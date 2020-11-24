<template lang="pug">
    v-dialog(max-width="500" v-model="dialog")
        template(v-slot:activator='{on, attr}')
            v-btn(v-on="on" v-bind="attr" icon)
                v-icon mdi-plus
        v-card
            v-card-title Add Account
            v-card-text
                .account-types-icons
                    v-card(@click="tabIndex = 0")
                        v-card-text
                            v-img(src="@/assets/gmail-icon.png" :width="iconSize" :height="iconSize" contain)
                    v-card(@click="tabIndex = 1")
                        v-card-text
                            v-img(src="@/assets/outlook-icon.png" :width="iconSize" :height="iconSize" contain )
                    v-card(@click="tabIndex = 2")
                        v-card-text
                            v-icon(:size="iconSize" ) mdi-email

                .account-info.mt-8
                    v-tabs-items(v-model="tabIndex")
                        v-tab-item.center-items
                            v-card(max-width="500" width="90%")
                                v-card-text
                                    .center-items
                                        v-img(src="@/assets/gmail-logo.png" :height="50" contain)
                                    v-text-field(v-model="emailInput" type="email" label="Email" )
                                    v-text-field(v-model="passwordInput" type="password" label="Password")
                                    .center-items
                                        v-btn(text @click="addAccount") Add Account
                        v-tab-item.center-items
                            v-card(max-width="500" width="90%")
                                v-card-text
                                    .center-items
                                        v-img(src="@/assets/outlook-logo.png" :height="50" contain)
                                    v-text-field(v-model="emailInput" type="email" label="Email")
                                    v-text-field(v-model="passwordInput" type="password" label="Password")
                                    .center-items
                                        v-btn Add Account
                        v-tab-item.center-items
                            v-card(max-width="500" width="90%")
                                v-card-text
                                    .row.flex-center
                                        v-icon.mr-4(size="50") mdi-email
                                        span.text-h6 Other Accounts
                                    v-text-field(v-model="emailInput" type="email" label="Email")
                                    v-text-field(v-model="passwordInput" type="password" label="Password")
                                    .row.ml-0(style="width: 100%")
                                        div(style="width: 80%")
                                            v-text-field(v-model="hostInput" type="text" label="IMAP Host Address")
                                        div(style="width: 20%")
                                            v-text-field(v-model="portInput" type="number" label="Port")
                                    .center-items
                                        v-btn(text @click="addAccount") Add Account
                    v-progress-linear.mt-4(:indeterminate="isLoading")


</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';

@Component({
    components: {},
})
export default class App extends Vue {
    dialog: boolean = false
    iconSize: number = 60
    tabIndex: number = 0
    isLoading: boolean = false

    emailInput: string = ""
    passwordInput: string = ""
    hostInput: string = ""
    portInput: number = 0

    addAccount() {
        this.isLoading = true
        const providers = ["google", "outlook", "other"]
        let payload: any = {}
        if (this.tabIndex == 0) {
            payload = {
                email: this.emailInput.trim(),
                password: this.passwordInput,
                host: "imap.gmail.com",
                port: 993
            }
        } else if (this.tabIndex == 2) {
            payload = {
                email: this.emailInput.trim(),
                password: this.passwordInput,
                host: this.hostInput.trim(),
                port: this.portInput
            }
        }
        payload["provider"] = providers[this.tabIndex],
        this.$store.dispatch("addAccount", payload)
            .then(() => {
                this.dialog = false
                this.isLoading = false
            }).catch(() => {
                this.isLoading = false
        })
    }
}
</script>

<style lang="scss">
.account-types-icons {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
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
