const imap = require("imap-simple")
const getMessage = require("imap-simple/lib/helpers/getMessage")
const simpleParser = require('mailparser').simpleParser;

export interface Account {
    email: string
    name?: string
    provider: string
    icon?: string
    secrets: {
        password?: string
        host?: string
        port?: number
        refresh_token?: string
    }
    mail_boxes: any
}

export interface MailBox {
    id: string
    messages: any[]
    name: string
    total_messages: number
    unread_messages: number
    path: string
    pinned: boolean
}

export interface Mail {
    id: string
    subject: string
    from: string
    to: string
    date: Date
    attachments?: {
        [propName: string]: {
            id: string
            name: string
            size: number
            type: string
        }
    }[]
    body?: {
        type: string,
        data: string
    }
}

const default_mail_boxes: any = {
    inbox: {
        name: "Inbox"
    },
    sent: {
        name: "Sent"
    },
    drafts: {
        name: "Drafts"
    },
    trash: {
        name: "Trash"
    },
    junk: {
        name: "Junk"
    }
}

export async function createConnection(account: Account) {
    const config = {
        imap: {
            user: account.email,
            password: account.secrets.password,
            host: account.secrets.host,
            port: account.secrets.port,
            tls: true,
            authTimeout: 5000,
            tlsOptions: {
                rejectUnauthorized: false,
                //servername: details.host,
                //secureProtocol: 'TLSv1.1'
            }
        }
    }

    const connection = await imap.connect(config)
    if (connection.imap.state == "authenticated") {
        return connection
    }
}

export async function initMailBoxes(connection: any, account: Account) {
    const boxes = await connection.getBoxes()

    const all_boxes: any[] = []

    const getChildren = (acc: any[], child: any) => {
        if (child[1].children) {
            for (let p of Object.entries(child[1].children)) {
                p[0] = child[0] + child[1].delimiter + p[0]
                getChildren(acc, p)
            }
        } else {
            acc.push(child)
        }
    }
    for (const box of Object.entries(boxes)) getChildren(all_boxes, box)

    const default_pinned = Object.keys(default_mail_boxes)

    const all_boxes_parsed = all_boxes.reduce((acc: any, box: any) => {
        if (box[1].special_use_attrib && default_pinned.includes(box[1].special_use_attrib.substr(1).toLowerCase())) {
            acc[box[1].special_use_attrib.substr(1).toLowerCase()] = {path: box[0], pinned: true}
        } else if (box[1].special_use_attrib) {
            acc[box[1].special_use_attrib.substr(1).toLowerCase()] = {path: box[0], pinned: false}
        } else if (box[0] != "INBOX") {
            acc[box[0]] = {path: box[0], pinned: false}
        }
        return acc
    }, {inbox: {path: "INBOX", pinned: true}})


    const result = await Promise.all(Object.keys(all_boxes_parsed).map((key: string) => {
        return new Promise((resolve, reject) => {
            connection.imap.status(all_boxes_parsed[key].path, (err: any, box_status: any) => {
                if (err) reject(err)
                else resolve({id: key, box_status})
            })
        })
    }))

    return result.reduce((acc: any, box: any) => {
        acc[box.id] = {
            id: box.id,
            path: all_boxes_parsed[box.id].path,
            messages: [],
            name: default_mail_boxes[box.id]? default_mail_boxes[box.id].name: all_boxes_parsed[box.id].path,
            unread_messages: box.box_status.messages.unseen,
            total_messages: box.box_status.messages.total,
            pinned: all_boxes_parsed[box.id].pinned
        } as MailBox
        return acc
    }, {} as { [propName: string]: MailBox })
}

export async function fetchMailbox(connection: any, account: Account, box_id: string): Promise<Mail[]> {
    const path = account.mail_boxes[box_id].path
    await connection.openBox(path)
    const limit = Math.max(account.mail_boxes[box_id].total_messages - 99, 1)
    const result = (await connection.search([limit + ":*"], {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
    })).reverse()
    connection.closeBox(path)

    return result.map((msg: any) => {
        return {
            id: msg.attributes.uid,
            body: {},
            attachments: {},
            date: new Date(msg.parts[0].body.date[0]),
            from: msg.parts[0].body.from[0],
            subject: msg.parts[0].body.subject[0],
            to: msg.parts[0].body.to[0]
        } as Mail
    }) as Mail[]
}

export async function fetchMail(connection: any, mail: Mail) {
    const result: any[] = await fetch( connection, [mail.id.toString()], {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', "TEXT", ""],
        struct: true
    })

    let  idHeader = "Imap-Id: "+ mail.id +"\r\n";
    const all = result[0].parts.find((part: any) => part.which == "")
    const full_mail: any = await new Promise((resolve, reject) => {
        simpleParser(idHeader + all.body, (err: any, mail: any) => {
            if (err) reject(err)
            else resolve(mail)
        });
    })

    if (full_mail.html) {
        mail.body = {data: full_mail.html, type: "html"}
    } else {
        mail.body = {data: full_mail.textAsHtml, type: "html"}
    }

    mail.attachments = full_mail.attachments


    return mail
}

function fetch(connection: any, uids: any, fetchOptions: any): Promise<any> {
    return new Promise(function (resolve, reject) {
        const fetch = connection.imap.fetch(uids, fetchOptions);
        let messagesRetrieved = 0;
        const messages: any[] = [];

        const fetchOnMessage = (message: any, seqNo: number) => {
            getMessage(message).then((message: any) => {
                message.seqNo = seqNo;
                messages[seqNo] = message;

                messagesRetrieved++;
                if (messagesRetrieved === uids.length) {
                    fetchCompleted();
                }
            });
        }

        const fetchCompleted = () => {
            // pare array down while keeping messages in order
            let pared = messages.filter(function (m) { return !!m; });
            resolve(pared);
        }

        const fetchOnError = (err: any) => {
            fetch.removeListener('message', fetchOnMessage);
            fetch.removeListener('end', fetchOnEnd);
            reject(err);
        }

        const fetchOnEnd = () => {
            fetch.removeListener('message', fetchOnMessage);
            fetch.removeListener('error', fetchOnError);
        }

        fetch.on('message', fetchOnMessage);
        fetch.once('error', fetchOnError);
        fetch.once('end', fetchOnEnd);
    });
};