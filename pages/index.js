"use strict";

import DefineMap from "can-define/map/";
import "components/login/"
import "components/home/"
import "components/alert/"
import template from "./index.stache!";
import "./index.less";

let ApplicationState = new DefineMap({});
document.getElementById("wrapper").appendChild(template(ApplicationState));
