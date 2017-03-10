import baseMap from "can-connect/can/base-map/";
import DefineMap from "can-define/map/map";

let AISMessageModel = DefineMap.extend({
    lat: "number",
    lng: "number",
    time: "string",
    mmsi: {
        type: "number",
        value: (new Date()).getTime()
    },
    channel: "string",
    navigational_status: "number",
    accuracy: "number",
    sog: "number",
    rate_of_turn: "number",
    cog: "number",
    true_heading: "number"
});

export default AISMessageModel;