var AudioContext = global.AudioContext || global.webkitAudioContext;

if (typeof global.window === global && typeof AudioContext !== "undefined") {
  require("./lib/browser-interface")();
} else {
  require("./lib/node-interface")();
}

module.exports = require("./lib");
