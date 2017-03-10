import DefineMap from "can-define/map/";
import ShipModel from "../../models/Ship/";
import WayPointModel from "../../models/WayPoint/";
import AISMessageModel from "../../models/AISMessage/";

let HomeViewModel = DefineMap.extend({
    mapRef: "*",
    pretty: function (s) {
        return JSON.stringify(s); // To Remove
    },
    componentInserted: function () {
        this.initializeMap();
        this.subscribeToMapEvents();
    },
    initializeMap: function () {
        var map = L.map('map-container', {
            zoomControl: false
        }).setView([17.937107, -76.221486], 7);
        L.tileLayer(
            'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibml0aGFuYXJveSIsImEiOiJVTlQ0bUtJIn0.xHgUVf3z6KU1IociPuP-5g', {
                attribution: '',
                maxZoom: 18,

            }).addTo(map);
        this.mapRef = map;
        mymap = map;
        shipMarker = L.marker({
            lat: 0,
            lng: 0
        }, {
            icon: boatIcon,
            opacity: 0
        }).addTo(map);
    },
    subscribeToMapEvents: function () {
        const self = this;
        mymap.on("click", function (event) {
            self.onMapClick.call(self, event);
        });
    },
    handleAddingShip: function (event) {
        const self = this;
        this.leftNavSelectedIndex = 0;
        this.shipCueEnabled = false;
        this.ship = new ShipModel({
            lat: event.latlng.lat,
            lng: event.latlng.lng
        });
        self.alertMsg = "Saving ship, please wait";
        this.ship.save().then(function (ship) {
            self.alertMsgVisible = false;
            self.totalShips++;
            L.marker(event.latlng, {
                "shipId": ship.id, // save ship ID along with marker
                icon: startEndPointIcon
            }).on("click", function (event) {
                self.shipClicked.call(self, event);
            }).addTo(mymap);
            self.shipInfoPos.left = event.originalEvent.clientX;
            self.shipInfoPos.top = event.originalEvent.clientY;
        }).catch(handleErrors);
    },
    handleAddingEndpoint: function (event) {
        const self = this;
        mapDrawings.push(L.marker(event.latlng, {
            icon: startEndPointIcon
        }).on("click", function (event) {
            self.endPointClicked.call(self, event);
        }).addTo(mymap));
        this.ship.waypoints.push(new WayPointModel({
            lat: event.latlng.lat,
            lng: event.latlng.lng
        }));
        this.ship.action = "waypoint";
        console.log("end point added");
    },
    handleAddingWaypoint: function (event) {
        mapDrawings.push(L.marker(event.latlng, {
            icon: wayPointIcon
        }).addTo(mymap));
        // Add this as the last but one point. The end point is added already
        let waypointIndex = this.ship.waypoints.length - 1;
        this.ship.waypoints.splice(waypointIndex, 0, new WayPointModel({
            lat: event.latlng.lat,
            lng: event.latlng.lng
        }));
        this.ship.waypoints[waypointIndex].segmentLength = this.computeSegmentLength(
            waypointIndex - 1,
            waypointIndex);
        this.ship.save().catch(handleErrors);
        console.log("way point added");
    },
    computeSegmentLength: function (fromIndex, toIndex) {
        let from;
        const to = this.ship.waypoints[toIndex];
        if (fromIndex === -1) {
            from = this.ship; // ship has the starting co-ordinates
        } else {
            from = this.ship.waypoints[fromIndex];
        }
        return distanceBetweenCoords(from.lat, to.lat, from.lng, to.lng);
    },
    endPointClicked: function (event) {
        const self = this;
        const endPointIndex = this.ship.waypoints.length - 1;
        let segmentLength = this.computeSegmentLength(endPointIndex - 1, endPointIndex);
        this.ship.waypoints[endPointIndex].segmentLength = segmentLength;
        this.ship.action = "complete"; // completed adding way points
        this.alertMsg = "Saving scenario"
        this.ship.save().then(function (ship) {
            self.alertMsgVisible = false;
            self.plotRoute();
        }).catch(handleErrors);
    },
    loadScenario: function () {
        this.hideShipMarker();
        this.resetScrubber();
        this.plotWayPoints();
        if (this.ship.action === "complete") {
            this.plotRoute();
        }
    },
    shipClicked: function (event) {
        const self = this;
        const shipId = event.target.options.shipId;
        this.alertMsg = "Fetching ship info...";
        ShipModel.get({
            id: shipId
        }).then(function (ship) {
            self.alertMsgVisible = false;
            self.ship = ship;
            self.loadScenario();
            self.shipInfoPos.left = event.originalEvent.clientX;
            self.shipInfoPos.top = event.originalEvent.clientY;
        }).catch(handleErrors);
    },
    cleanUp: function (event, deselectShip = true) {
        this.hideShipMarker();

        // remove ship scenario
        while (mapDrawings.length > 0) {
            mapDrawings.pop().removeFrom(mymap);
        }

        // reset selected ship
        if (deselectShip) {
            this.ship = null;
        }

        this.hideShipInfo();
        this.resetScrubber();
    },
    hideShipMarker: function () {
        shipMarker.setOpacity(0);
    },
    resetScrubber: function () {
        document.getElementById("progress-mark").style.left = 0;
        this.scrubberMarkPos = 0;
    },
    onMapClick: function (event) {
        if (this.leftNavSelectedIndex === 1) {
            this.handleAddingShip(event);
        } else if (this.ship && this.ship.action === "waypoint") {
            this.handleAddingWaypoint(event);
        } else if (this.ship && this.ship.action === "endpoint") {
            this.handleAddingEndpoint(event);
        } else {
            this.cleanUp(event)
        }
    },
    moveShip: function (percentDayComplete) {
        let timeTravelled = percentDayComplete * 24 / 100;
        let shipSpeed = 10 * KNOTS_TO_KM;
        let distanceTravelled = shipSpeed * timeTravelled;
        let totalLength = 0,
            i = 0;
        for (; i < this.ship.waypoints.length; i++) {
            totalLength += this.ship.waypoints[i].segmentLength;
            if (distanceTravelled < totalLength) {
                break;
            }
        }
        let nearestSegmentAccLength = totalLength - this.ship.waypoints[i].segmentLength;
        let distanceTravelledOnLastSegment = distanceTravelled - nearestSegmentAccLength;
        let p1 = this.ship.waypoints[i - 1] || this.ship;
        let p2 = this.ship.waypoints[i];
        let segmentSlope = (p2.lat - p1.lat) / (p2.lng - p1.lng);
        let angle = Math.atan(segmentSlope);
        // Thanks to http://gis.stackexchange.com/a/2964/85044
        // let shipx = (distanceTravelledOnLastSegment * Math.cos(angle)) / (111.111 * Math.cos(
        //     p1.lat * Math.PI / 180)) + p1.lng;
        let shipx = (distanceTravelledOnLastSegment * Math.cos(angle)) / 111.111 + p1.lng;
        let shipy = distanceTravelledOnLastSegment * Math.sin(angle) / 111.111 + p1.lat;
        shipMarker.setLatLng({
            lat: shipy,
            lng: shipx
        }).setOpacity(1);
    },
    plotRoute: function () {
        const latlngs = [
            [this.ship.lat, this.ship.lng]
        ].concat(this.ship.waypoints.get().map(p => [
            p.lat, p.lng
        ]));
        mapDrawings.push(L.polyline(latlngs, {
            color: 'red',
            dashArray: "5,5",
            weight: 1
        }).addTo(mymap));
    },
    plotWayPoints: function () {
        this.ship.waypoints.slice(0, this.ship.waypoints.length - 1).forEach(p => {
            mapDrawings.push(L.marker({
                lat: p.lat,
                lng: p.lng
            }, {
                icon: wayPointIcon
            }).addTo(mymap));
        });
        this.ship.waypoints.slice(this.ship.waypoints.length - 1).forEach(p => {
            mapDrawings.push(L.marker({
                lat: p.lat,
                lng: p.lng
            }, {
                icon: startEndPointIcon
            }).addTo(mymap));
        });
    },
    moveScrubber: function (el, downEvent) {
        const self = this;

        if (self.ship == null || typeof self.ship.id === "undefined") {
            self.alertMsg = "Select a ship to see its journey using timeline";
            return;
        }

        if (self.ship.waypoints.length == 0) {
            self.alertMsg =
                "Add some waypoints for this ship to see its journey using timeline";
            return;
        }

        let maxDragDistance = el.parentElement.clientWidth;
        let dragStartXAt = downEvent.clientX;
        let prevMarkPos = self.scrubberMarkPos;
        // Thanks to http://stackoverflow.com/a/8933562/1585523 for the idea
        document.body.onmousemove = function (moveEvent) {
            let dragAmount = ((moveEvent.clientX - dragStartXAt) / maxDragDistance *
                100) + prevMarkPos;
            if (dragAmount >= 0 && dragAmount <= 100) {
                el.style.left = dragAmount + "%";
                debounce(function () {
                    self.moveShip(dragAmount);
                }, 150)();
            }
        }
        document.body.onmouseup = function () {
            self.scrubberMarkPos = parseFloat(el.style.left);
            document.body.onmousemove = document.body.onmouseup = null;
        }
    },
    times: {
        value: function () {
            times = [];
            for (let i = 0; i < 10; i++) {
                times.push(`0${i}:00`);
            }
            for (let i = 10; i < 25; i++) {
                times.push(`${i}:00`);
            }
            return times;
        }
    },
    leftNavSelectedIndex: {
        value: 0
    },
    shipCueEnabled: {
        value: false
    },
    shipInfoPos: {
        value: {
            top: -999,
            left: -999
        }
    },
    hideMessagePanel: {
        value: true
    },
    ship: {
        Type: ShipModel,
        Value: ShipModel
    },
    currMessage: {
        Type: AISMessageModel,
        Value: AISMessageModel
    },
    totalShips: {
        type: "number",
        value: 0
    },
    scrubberMarkPos: {
        type: "number",
        value: 0
    },
    alertMsg: {
        "type": "string",
        "value": null
    },
    alertMsgVisible: {
        "type": "boolean",
        "value": false
    },
    hideShipInfo: function () {
        this.shipInfoPos = {
            top: -999,
            left: -999
        };
    },
    addShipBtnClick: function addShipBtnClick() {
        this.leftNavSelectedIndex = 1;
        this.shipCueEnabled = true;
    },
    addAisBtnClick: function addAisBtnClick(event) {
        if (this.ship == null || typeof this.ship.id === "undefined") {
            this.alertMsg = "Select a ship to add a message";
            return;
        }

        this.cleanUp(event, false);
        this.hideMessagePanel = false;
    },
    closeMessagePanel: function () {
        this.hideMessagePanel = true;
    },
    wayPointBtnClick: function () {
        this.ship.action = "endpoint";
        this.hideShipInfo();
    },
    saveShip: function () {
        const self = this;
        this.ship.save().then(function () {
            self.alertMsg = "Saved ship successfully";
        }).catch(handleErrors);
    },
    isNewMessage: function (message) {
        // if two messages have same MMSI they are same
        // if there is already another message in ship with the same ID it means this is not a new Message
        return this.ship.ais_messages.get().filter(m => m.mmsi === message.mmsi).length ==
            0;
    },
    saveMessage: function () {
        const self = this;
        this.alertMsg = `Saving AIS Message for Ship ID #${this.ship.id}`;
        if (self.isNewMessage(self.currMessage)) {
            self.ship.ais_messages.push(self.currMessage);
        }
        this.ship.save().then(function (ship) {
            self.alertMsgVisible = false;
            self.currMessage = new AISMessageModel({
                mmsi: (new Date()).getTime()
            });
            self.closeMessagePanel();
        }).catch(handleErrors);
    },
    discardMessage: function () {
        this.currMessage = new AISMessageModel({
            mmsi: (new Date()).getTime()
        });
    },
    editMessage: function (index) {
        this.currMessage = this.ship.ais_messages[index];
        this.hideMessagePanel = false;
    },
    removeWayPoint: function (index) {
        const self = this;
        this.ship.waypoints.splice(index, 1);
        this.ship.save().then(function (ship) {
            self.cleanUp(null, false);
            self.plotWayPoints();
            if (self.ship.action === "complete") {
                self.plotRoute();
            }
        }).catch(handleErrors);
    }
});