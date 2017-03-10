import Component from "can-component";
import template from "./alert.stache!";

Component.extend({
    tag: "bb-alert",
    view: template,
    viewModel: {
        alertMsg: {
            "type": "string",
            "value": null,
            "set": function (newMsg) {
                const self = this;
                if (newMsg && newMsg.length > 0) {
                    self.showAlert = true;
                    window.setTimeout(function () {
                        self.showAlert = false;
                        self.alertMsg = null;
                    }, 5000);
                }
                return newMsg;
            }
        },
        showAlert: {
            "type": "boolean",
            "value": function () {
                return this.alertMsg && this.alertMsg.length > 0;
            }
        }
    },
    "events": {
        "{viewModel} alertMsg": function (viewModel, event, newMsg, oldMsg) {
            const self = this;
            if (newMsg && newMsg.length > 0) {
                self.viewModel.showAlert = true;
                window.setTimeout(function () {
                    self.viewModel.showAlert = false;
                    self.viewModel.alertMsg = null;
                }, 2000);
            }
        }
    }
});