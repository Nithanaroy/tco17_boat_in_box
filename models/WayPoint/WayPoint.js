import baseMap from "can-connect/can/base-map/";
import DefineMap from "can-define/map/map";

let WayPointModel = DefineMap.extend({
    lat: "number",
    lng: "number",
    segmentLength: "number", // distance to previous way point
    speed: {
        type: "number",
        value: DEFAULT_SPEED
    }
});

export default WayPointModel;