import Component from "can-component";
import template from "./login.stache!";

Component.extend({
    tag: "bb-login",
    view: template,
    viewModel: {
        showMain: {
            value: false
        },
        goToMain: function () {
            this.showMain = true
        }
    }
});