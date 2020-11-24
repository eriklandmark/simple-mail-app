<template lang="pug">
    .mail-box-container
        v-card.mail-list(flat max-width="400px" width="30%" min-width="230px" )
            v-list(v-if="mail_box" two-line)
                template(v-for="(mail, index) in mail_box.messages")
                    v-list-item(@click="selectMail(mail)")
                        //v-list-item-avatar
                            span {{index}}
                            //v-icon mdi-email
                        v-list-item-content
                            v-list-item-title {{mail.subject}}
                            v-list-item-subtitle {{mail.from}}
                        //v-list-item-avatar(v-if="mail_box.unread_messages > 0") {{mail_box.unread_messages}}
                    v-divider
        v-divider(vertical)
        v-card
        mail

</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import {Mail as MailInterface} from "@/store/imap_helper";
import Mail from "@/components/Mail.vue";

@Component({
    components: {Mail},
})
export default class MailBox extends Vue {

    formatMailboxName(name: string) {
        return name[0] + name.substr(1).toLowerCase()
    }

    selectMail(mail: MailInterface) {
        this.$store.dispatch("fetchMail", mail)
    }

    get mail_box() {
        if (this.$store.state.selectedMailBox.email && this.$store.state.selectedMailBox.box_id) {
            return this.$store.state.accounts[this.$store.state.selectedMailBox.email].mail_boxes[this.$store.state.selectedMailBox.box_id]
        } else {
            return null
        }
    }
}
</script>

<style lang="scss">

.mail-list {
    overflow-y: auto;
}

.mail-box-container {
    height: 100%;
    display: flex;
    flex-direction: row;
}

.v-list-group__header {
    padding: 0 8px !important;
}

.mail-box-list-item {
    height: 48px !important;
    padding: 0 8px !important;
}

.center-items {
    display: grid;
    place-items: center;
}

.flex-center {
    align-items: center;
    justify-content: center;
}



</style>
