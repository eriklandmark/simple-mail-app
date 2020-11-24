import Vue from 'vue'
import Vuex from 'vuex'

import {createUserStorage} from "@/store/user_storage_module";
import * as imap_helper from "@/store/imap_helper";
import {Account, Mail} from "@/store/imap_helper";

const imap = require("imap-simple")

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        accounts: {} as { [propName: string]: Account },
        connections: {} as any,
        selectedMailBox: {
            email: "",
            box_id: ""
        },
        selectedMail: {}
    },
    mutations: {
        addAccount(state, account: Account) {
            Vue.set(state.accounts, account.email, account)
        },

        setMailBoxes(state, {email, mail_boxes}) {
            Vue.set(state.accounts[email], "mail_boxes", mail_boxes)
        },

        setMailBox(state, {email, mail_box}) {
            Vue.set(state.accounts[email].mail_boxes, mail_box.id, mail_box)
        },

        setCurrentMailBox(state, details) {
            state.selectedMailBox = details
        },

        setCurrentMail(state, details) {
            state.selectedMail = details
        },

        setConnection(state, {email, connection}) {
            state.connections[email] = connection
        },

        updateRefreshToken(state, {email, token}) {
            state.accounts[email].secrets.refresh_token = token
        }
    },
    actions: {
        async initAccounts(store, details) {
            await Promise.all(Object.keys(store.state.accounts)
                .map((email: string) => store.dispatch("initAccount", store.state.accounts[email])))
            console.log("Loaded accounts!")
        },

        async initAccount(store, account: Account) {
            const connection = await imap_helper.createConnection(account)
            const mail_boxes = await imap_helper.initMailBoxes(connection, account)
            store.commit("setConnection", {email: account.email, connection})
            store.commit("setMailBoxes", {email: account.email, mail_boxes: mail_boxes})

            store.dispatch("user_storage/save")
        },

        async addAccount(store, details) {
            try {
                const config = {
                    imap: {
                        user: details.email,
                        password: details.password,
                        host: details.host,
                        port: details.port,
                        tls: true,
                        authTimeout: 5000,
                        tlsOptions: {
                            rejectUnauthorized: false,
                        }
                    }
                }

                const connection = await imap.connect(config)

                if (connection.imap.state == "authenticated") {
                    const account: Account = {
                        email: details.email.toLowerCase(),
                        name: details.email.toLowerCase(),
                        provider: "google",
                        secrets: {
                            host: details.host,
                            port: details.port,
                            password: details.password
                        },
                        mail_boxes: {}
                    }

                    console.log("New Account", account)
                    store.commit("addAccount", account)
                    store.dispatch("initAccount", account)
                }
            } catch (e) {
                console.error(e)
                return e
            }
        },

        async loadMailBox(store) {
            const email = store.state.selectedMailBox.email
            const account = store.state.accounts[email]
            const box_id = store.state.selectedMailBox.box_id

            console.log("Loading mail box: ", email, " | ", box_id)
            const connection = store.state.connections[email]

            account.mail_boxes[box_id].messages = await imap_helper.fetchMailbox(connection, account, box_id)
            store.commit("setMailBox", {email, mail_box: account.mail_boxes[box_id]})
        },

        async fetchMail(store, mail: Mail) {
            const connection = store.state.connections[store.state.selectedMailBox.email]
            const path = store.state.accounts[store.state.selectedMailBox.email].mail_boxes[store.state.selectedMailBox.box_id].path
            await connection.openBox(path)
            store.commit("setCurrentMail", await imap_helper.fetchMail(connection, mail))
            await connection.closeBox(path)
        }
    },
    modules: {
        user_storage: createUserStorage(["accounts"], {saveTo: "fs", always_save: true})
    }
})
