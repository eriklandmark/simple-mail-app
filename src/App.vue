<template lang="pug">
    v-app
        v-app-bar(app)
            v-app-bar-nav-icon(@click="mini = !mini")
                v-icon {{mini? "mdi-chevron-right": "mdi-chevron-left"}}

            v-spacer

        v-navigation-drawer(app permanent :mini-variant.sync="mini" width="250")
            v-list-item.px-2
                v-list-item-avatar
                    v-icon mdi-account-group
                v-list-item-title Accounts
                add-account
            v-divider
            accounts

        v-main(app)
            mail-box


</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import AddAccount from "@/components/AddAccount.vue";
import Accounts from "@/components/Accounts.vue";
import MailBox from "@/components/MailBox.vue";

@Component({
    components: {MailBox, Accounts, AddAccount},
})
export default class App extends Vue {
    navDrawer: boolean = true
    mini: boolean = true

    beforeCreate() {
        this.$store.dispatch("user_storage/init")
    }

    created() {
        this.$store.dispatch("initAccounts")
    }
}
</script>

<style lang="scss">
.v-main {
    height: 100vh;
}

html, body {
    overflow-y: hidden !important;
}

#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
</style>
