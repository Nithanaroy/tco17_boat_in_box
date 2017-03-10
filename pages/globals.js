let mymap = null; // global reference to leaflet map
let shipMarker = null; // global reference to ship marker to animate on map
let mapDrawings = [];
const startEndPointIcon = L.icon({
    iconUrl: './assets/start_end_points.png',
    iconSize: [19, 30],
    iconAnchor: [9.5, 30],
    popupAnchor: [-3, -76],
});
const wayPointIconOld = L.icon({
    iconUrl: './assets/waypoint.png',
    iconSize: [17, 13],
    iconAnchor: [8.5, 6.5],
    popupAnchor: [-3, -76],
});
const wayPointIcon = L.icon({
    iconUrl: './assets/waypoint-2.png',
    iconSize: [11, 11],
    iconAnchor: [5.5, 5.5],
    popupAnchor: [-3, -76],
});
const boatIcon = L.icon({
    iconUrl: './assets/boat.png',
    iconSize: [13, 29],
    iconAnchor: [6.5, 14.5],
    popupAnchor: [-3, -76],
});

const DEFAULT_SPEED = 10;
const KNOTS_TO_KM = 1.852;

function disableMap() {
    mymap.dragging.disable();
    mymap.touchZoom.disable();
    mymap.doubleClickZoom.disable();
    mymap.scrollWheelZoom.disable();
    mymap.boxZoom.disable();
    mymap.keyboard.disable();
}

function enableMap() {
    mymap.dragging.enable();
    mymap.touchZoom.enable();
    mymap.doubleClickZoom.enable();
    mymap.scrollWheelZoom.enable();
    mymap.boxZoom.enable();
    mymap.keyboard.enable();
}

function handleErrors(err) {
    alert("Error occurred. Check console");
    console.error(err);
}

// Pasted from: https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

/* return KM distance between two co-ordinates */
function distanceBetweenCoords(lat1, lat2, lon1, lon2) {
    // Pasted from http://www.movable-type.co.uk/scripts/latlong.html
    const R = 6371e3; // metres
    const lat1Radians = lat1 * (Math.PI / 180);
    const lat2Radians = lat2 * (Math.PI / 180);
    const latDiff = (lat2 - lat1) * (Math.PI / 180);
    const lngDiff = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) + Math.cos(lat1Radians) * Math.cos(
            lat2Radians) * Math.sin(lngDiff / 2) * Math
        .sin(lngDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c / 1000;
}

const shipVisualCue = $("#shipVisualCue");

console.log(
    'Map attribution: Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
)