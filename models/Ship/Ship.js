import baseMap from "can-connect/can/base-map/";
import DefineMap from "can-define/map/map";
import DefineList from "can-define/list/list";
import AISMessageModel from "../AISMessage/";
import WayPointModel from "../WayPoint/";

let ShipModel = DefineMap.extend({
    id: "number",
    name: "string",
    course: {
        "type": "number",
        "value": 0
    },
    speed: {
        "type": "number",
        "value": DEFAULT_SPEED
    },
    lat: "number",
    lng: "number",
    waypoints: {
        "Type": DefineList.extend({
            "Map": WayPointModel
        }),
        "value": []
    },
    ais_messages: {
        "Type": DefineList.extend({
            "Map": AISMessageModel
        }),
        "value": []
    },
    action: "string" // empty string, waypoint, endpoint
});

ShipModel.List = DefineList.extend({
    "Map": ShipModel
});

baseMap({
    "idProp": "id",
    "Map": ShipModel,
    "List": ShipModel.List,
    "url": "/api/ship/",
    "name": "Ship"
});

export default ShipModel;