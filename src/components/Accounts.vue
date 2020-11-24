<template lang="pug">
    v-list
        template(v-for="account in Object.values($store.state.accounts)")
            v-list-group(:key="account.email")
                template(style="padding: 0 !important" v-slot:activator)
                    v-list-item-avatar
                        v-icon mdi-account
                    v-list-item-content
                        v-tooltip(bottom)
                            template(v-slot:activator="{on, attr}")
                                v-list-item-title(v-on="on" v-bind="attr") {{account.name}}
                            span {{account.email}}
                v-list-item.mail-box-list-item(v-for="mail_box in Object.values(account.mail_boxes).filter((box) => box.pinned)"
                    @click="selectMailBox(account.email, mail_box.id)" :key="`${account.email}.${mail_box.id}`")
                    v-list-item-avatar
                        v-icon mdi-email
                    v-list-item-content
                        v-list-item-title {{formatMailboxName(mail_box.name)}}
                    v-list-item-avatar(v-if="mail_box.unread_messages > 0") {{mail_box.unread_messages}}
            v-divider


</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';

@Component({
    components: {},
})
export default class Accounts extends Vue {

    formatMailboxName(name: string) {
        return name[0] + name.substr(1).toLowerCase()
    }

    selectMailBox(email: string, mail_box: string) {
        this.$store.commit("setCurrentMailBox", {email, box_id: mail_box})
    }

    @Watch("$store.state.selectedMailBox", {deep: true})
    loadMailBox() {
        this.$store.dispatch("loadMailBox")
    }
}
</script>

<style lang="scss">

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
