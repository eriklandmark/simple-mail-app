<template lang="pug">
    .mail-container
        v-card(v-if="mail" flat)
            v-card-title {{mail.subject}}
            v-card-subtitle
                | When: {{mail.date.toLocaleString()}}
                br
                | From: {{mail.from}}
            v-divider
            v-card-text(v-if="mail.body")
                div(v-if="mail.body.type.includes('html')" v-html="mail.body.data")
                span(v-if="mail.body.type.includes('plain')" v-text="mail.body.data")


</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';

@Component({
    components: {},
})
export default class Mail extends Vue {

    get mail() {
        if (this.$store.state.selectedMail.id){
            return this.$store.state.selectedMail
        } else {
            return null
        }
    }
}
</script>

<style lang="scss">


.mail-container {
    height: 100%;
    overflow-y: auto;
    width: 70%;
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
