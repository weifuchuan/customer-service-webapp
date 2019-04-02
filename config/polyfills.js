'use strict';

// use ` require("xxx") ` for import polyfils

import "@babel/polyfill";
require("react-app-polyfill/ie11")
require("intersection-observer/intersection-observer.js")

import EventEmitter from "wolfy87-eventemitter";

window.EventEmitter = EventEmitter;
window.bus = new EventEmitter(); 