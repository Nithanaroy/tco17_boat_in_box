import Component from "can-component";
import HomeViewModel from "./home-view-model";
import template from "./home.stache!";

Component.extend({
    "tag": "bb-home-page",
    "view": template,
    "viewModel": HomeViewModel,
    "events": {
        inserted: function componentInserted() {
            this.viewModel.componentInserted();
        },
        "{viewModel} shipCueEnabled": function (viewModel, event, shipCueVisible, oldVal) {
            if (shipCueVisible) {
                $("#map-container").mousemove(function (event) {
                    shipVisualCue.css({
                        "left": event.clientX,
                        "top": event.clientY
                    });
                });
            } else {
                $("#map-container").unbind("mousemove");
            }
        },
        "{viewModel} ship": function (viewModel, event, newShip, oldShip) {
            if (newShip == null || typeof newShip.id === "undefined") {
                this.viewModel.hideShipInfo();
            }
        }
    },
    "helpers": {
        /**
         * Converts decimals to degrees, minutes and seconds format
         * Source: https://en.wikipedia.org/wiki/Geographic_coordinate_conversion#Coordinate_format_conversion
         */
        coordinateFormatter: function (decimalDegrees, isLat) {
            const degrees = Math.floor(decimalDegrees);
            const minutes = Math.floor(60 * (decimalDegrees - degrees));
            const seconds = Math.round(3600 * (decimalDegrees - degrees) - (60 * minutes));
            let direction = "N";
            if (isLat) {
                if (decimalDegrees < 0) {
                    direction = "S";
                }
            } else {
                if (decimalDegrees < 0) {
                    direction = "W";
                } else {
                    direction = "E";
                }
            }
            return `${Math.abs(degrees)}<sup>o</sup> ${minutes}' ${seconds}" ${direction}`;
        }
    }
});