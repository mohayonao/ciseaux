(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ciseaux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./lib/web-audio-tape").use();

module.exports = require("./lib");

},{"./lib":4,"./lib/web-audio-tape":11}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = {
  sampleRate: 0,
  from: null,
  render: null };
module.exports = exports["default"];
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Fragment = (function () {
  function Fragment(data, beginTime, endTime) {
    _classCallCheck(this, Fragment);

    this.data = data;
    this.beginTime = beginTime;
    this.endTime = endTime;
    this.gain = 1;
    this.pan = 0;
    this.reverse = false;
    this.pitch = 1;
    this.stretch = false;
  }

  _createClass(Fragment, [{
    key: "duration",
    get: function () {
      return (this.endTime - this.beginTime) / this.pitch;
    }
  }, {
    key: "slice",
    value: function slice(beginTime, duration) {
      beginTime = this.beginTime + beginTime * this.pitch;

      var endTime = beginTime + duration * this.pitch;

      beginTime = Math.max(this.beginTime, beginTime);
      endTime = Math.max(beginTime, Math.min(endTime, this.endTime));

      return this.clone({ beginTime: beginTime, endTime: endTime });
    }
  }, {
    key: "clone",
    value: function clone(attributes) {
      var newInstance = new Fragment(this.data, this.beginTime, this.endTime);

      newInstance.gain = this.gain;
      newInstance.pan = this.pan;
      newInstance.reverse = this.reverse;
      newInstance.pitch = this.pitch;
      newInstance.stretch = this.stretch;

      if (attributes) {
        Object.keys(attributes).forEach(function (key) {
          newInstance[key] = attributes[key];
        });
      }

      return newInstance;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        data: this.data,
        beginTime: this.beginTime,
        endTime: this.endTime,
        gain: this.gain,
        pan: this.pan,
        reverse: this.reverse,
        pitch: this.pitch,
        stretch: this.stretch };
    }
  }]);

  return Fragment;
})();

exports["default"] = Fragment;
module.exports = exports["default"];
},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _sequence = require("./sequence");

var _sequence2 = _interopRequireDefault(_sequence);

var _tape = require("./tape");

var _tape2 = _interopRequireDefault(_tape);

var from = _tape2["default"].from;
var silence = _tape2["default"].silence;
var concat = _tape2["default"].concat;
var mix = _tape2["default"].mix;
exports["default"] = { Sequence: _sequence2["default"], Tape: _tape2["default"], from: from, silence: silence, concat: concat, mix: mix };
module.exports = exports["default"];
},{"./sequence":8,"./tape":9}],5:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = (function () {
  function InlineWorker(func, self) {
    var _this = this;

    _classCallCheck(this, InlineWorker);

    if (WORKER_ENABLED) {
      var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
      var url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));

      return new global.Worker(url);
    }

    this.self = self;
    this.self.postMessage = function (data) {
      setTimeout(function () {
        _this.onmessage({ data: data });
      }, 0);
    };

    setTimeout(function () {
      func.call(self);
    }, 0);
  }

  _createClass(InlineWorker, [{
    key: "postMessage",
    value: function postMessage(data) {
      var _this2 = this;

      setTimeout(function () {
        _this2.self.onmessage({ data: data });
      }, 0);
    }
  }]);

  return InlineWorker;
})();

exports.InlineWorker = InlineWorker;
exports["default"] = InlineWorker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
var self = {};

function render() {
  self.repository = [];

  self.onmessage = function(e) {
    switch (e.data.type) {
      case "transfer":
        self.repository[e.data.data] = e.data.buffers.map(function(buffer) {
          return new Float32Array(buffer);
        });
        break;
      case "dispose":
        delete self.repository[e.data.data];
        break;
      case "render":
        self.startRendering(e.data.tape, e.data.callbackId);
        break;
      }
  };

  self.startRendering = function(tape, callbackId) {
    var destination = self.allocData(tape);
    var buffers = destination.map(function(array) {
      return array.buffer;
    });

    self.render(tape, destination);

    self.postMessage({ callbackId: callbackId, buffers: buffers }, buffers);
  };

  self.allocData = function(tape) {
    var data = new Array(tape.numberOfChannels);
    var length = Math.floor(tape.duration * tape.sampleRate);

    for (var i = 0; i < data.length; i++) {
      data[i] = new Float32Array(length);
    }

    return data;
  };

  self.render = function(tape, destination) {
    for (var i = 0; i < tape.tracks.length; i++) {
      self.renderTrack(i, tape.tracks[i], destination, tape.sampleRate);
    }
  };

  self.renderTrack = function(trackNum, fragments, destination, sampleRate) {
    var usePan = fragments.some(function(fragment) {
      return fragment.pan !== 0;
    });

    var pos = 0;

    for (var i = 0, imax = fragments.length; i < imax; i++) {
      var fragment = fragments[i];
      var source = self.repository[fragment.data];
      var duration = (fragment.endTime - fragment.beginTime) / fragment.pitch;
      var length = Math.floor(duration * sampleRate);

      if (!source) {
        pos += length;
        continue;
      }

      var begin = Math.floor(fragment.beginTime * sampleRate);
      var end = Math.floor(fragment.endTime * sampleRate);
      var srcCh = source.length;
      var dstCh = destination.length;
      var srcSub = self.subarray(source, begin, end);
      var dstSub = self.subarray(destination, pos, pos + length);
      var pitch = fragment.pitch;

      /** TODO: implements
      if (fragment.stretch) {
        srcSub = self.stretch(srcSub, length);
        pitch = 1;
      }
      **/

      var canSimpleCopy = trackNum === 0 && pitch === 1 && !usePan && fragment.gain === 1 && !fragment.reverse && srcCh <= dstCh && srcSub[0].length === dstSub[0].length;

      if (canSimpleCopy) {
        self.mix[srcSub.length + "->" + dstSub.length](srcSub, dstSub);
      } else {
        self.process(srcSub, dstSub, {
          gain: fragment.gain,
          pan: usePan ? Math.max(-1, Math.min(fragment.pan, +1)) : null,
          reverse: !!fragment.reverse,
        });
      }

      pos += length;
    }
  };

  self.subarray = function(array, begin, end) {
    var subarray = new Array(array.length);

    for (var i = 0; i < subarray.length; i++) {
      subarray[i] = array[i].subarray(begin, end);
    }

    return subarray;
  };

  self.process = function(src, dst, opts) {
    var samples = new Array(src.length);
    var srcCh = src.length;
    var dstCh = dst.length;
    var mixCh;
    var srcLength = src[0].length;
    var dstLength = dst[0].length;
    var factor = (srcLength - 1) / (dstLength - 1);
    var index, step, ch, mix, l, r;

    if (opts.pan !== null) {
      l = Math.cos((opts.pan + 1) * 0.25 * Math.PI);
      r = Math.sin((opts.pan + 1) * 0.25 * Math.PI);
      mixCh = Math.max(srcCh, 2);
    } else {
      mixCh = srcCh;
    }
    mix = self.mix1[mixCh + "->" + dstCh] || self.mix1.nop;

    if (opts.reverse) {
      index = dst[0].length - 1;
      step = -1;
    } else {
      index = 0;
      step = +1;
    }

    for (var i = 0; i < dstLength; i++, index += step) {
      var x0 = i * factor;
      var i0 = x0|0;
      var i1 = Math.min(i0 + 1, srcLength - 1);

      for (ch = 0; ch < srcCh; ch++) {
        samples[ch] = src[ch][i0] + Math.abs(x0 - i0) * (src[ch][i1] - src[ch][i0]);
      }

      if (opts.pan !== null) {
        samples = self.pan[srcCh](samples, l, r);
      }

      var values = mix(samples);

      for (ch = 0; ch < dstCh; ch++) {
        dst[ch][index] += (values[ch] || 0) * opts.gain;
      }
    }
  };

  self.pan = [];
  self.pan[1] = function(src, l, r) {
    return [ src[0] * l, src[0] * r ];
  };
  self.pan[2] = function(src, l, r) {
    var x = (src[0] + src[1]) * 0.5;
    return [ x * l, x * r ];
  };
  self.pan[4] = function(src, l, r) {
    var x = (src[0] + src[1]) * 0.5;
    var y = (src[2] + src[3]) * 0.5;
    return [ x * l, x * r , y * l, y * r ];
  };
  self.pan[6] = function(src, l, r) {
    var x = (src[0] + src[1]) * 0.5;
    var y = (src[4] + src[5]) * 0.5;
    return [ x * l, x * r , src[2], src[3], y * l, y * r ];
  };

  self.mix = {};
  self.mix["1->1"] = function(src, dst) {
    dst[0].set(src[0]);
  };
  self.mix["1->2"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[0]);
  };
  self.mix["1->4"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[0]);
  };
  self.mix["1->6"] = function(src, dst) {
    dst[2].set(src[0]);
  };
  self.mix["2->2"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
  };
  self.mix["2->4"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
  };
  self.mix["2->6"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
  };
  self.mix["4->4"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
    dst[2].set(src[2]);
    dst[3].set(src[3]);
  };
  self.mix["4->6"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
    dst[4].set(src[2]);
    dst[5].set(src[3]);
  };
  self.mix["6->6"] = function(src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
    dst[2].set(src[2]);
    dst[3].set(src[3]);
    dst[4].set(src[4]);
    dst[5].set(src[5]);
  };

  self.mix1 = {};
  self.mix1.nop = function(src) {
    return src;
  };
  self.mix1["1->2"] = function(src) {
    return [ src[0], src[0] ];
  };
  self.mix1["1->4"] = function(src) {
    return [ src[0], src[0], 0, 0 ];
  };
  self.mix1["1->6"] = function(src) {
    return [ 0, 0, src[0], 0, 0, 0 ];
  };
  self.mix1["2->4"] = function(src) {
    return [ src[0], src[1], 0, 0 ];
  };
  self.mix1["2->6"] = function(src) {
    return [ src[0], src[1], 0, 0, 0, 0 ];
  };
  self.mix1["4->6"] = function(src) {
    return [ src[0], src[1], 0, 0, src[2], src[3] ];
  };
  self.mix1["2->1"] = function(src) {
    return [ 0.5 * (src[0] + src[1]) ];
  };
  self.mix1["4->1"] = function(src) {
    return [ 0.25 * (src[0] + src[1] + src[2] + src[3]) ];
  };
  self.mix1["6->1"] = function(src) {
    return [ 0.7071 * (src[0] + src[1]) + src[2] + 0.5 * (src[4] + src[5]) ];
  };
  self.mix1["4->2"] = function(src) {
    return [ 0.5 * (src[0] + src[2]), 0.5 * (src[1] + src[3]) ];
  };
  self.mix1["6->2"] = function(src) {
    return [ src[0] + 0.7071 * (src[2] + src[4]), src[1] + 0.7071 * (src[2] + src[5]) ];
  };
  self.mix1["6->4"] = function(src) {
    return [ src[0] + 0.7071 * src[2], src[1] + 0.7071 * src[2], src[4], src[5] ];
  };
}

render.self = render.util = self;

module.exports = render;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _inlineWorker = require("./inline-worker");

var _inlineWorker2 = _interopRequireDefault(_inlineWorker);

var _renderWorker = require("./render-worker");

var _renderWorker2 = _interopRequireDefault(_renderWorker);

var worker = new _inlineWorker2["default"](_renderWorker2["default"], _renderWorker2["default"].self);

var __callbacks = [];
var __data = 1; // data 0 is reserved for silence

worker.onmessage = function (e) {
  var audioData = e.data.buffers.map(function (buffer) {
    return new Float32Array(buffer);
  });
  __callbacks[e.data.callbackId](audioData);
  __callbacks[e.data.callbackId] = null;
};

exports["default"] = {
  transfer: function transfer(audioData) {
    var data = __data++;
    var buffers = audioData.map(function (array) {
      return array.buffer;
    });
    worker.postMessage({ type: "transfer", data: data, buffers: buffers }, buffers);
    return data;
  },
  dispose: function dispose(data) {
    worker.postMessage({ type: "dispose", data: data });
  },
  render: function render(tape) {
    var callbackId = __callbacks.length;

    worker.postMessage({ type: "render", tape: tape, callbackId: callbackId });

    return new Promise(function (resolve) {
      __callbacks[callbackId] = resolve;
    });
  },
  util: _renderWorker2["default"].util };
module.exports = exports["default"];
},{"./inline-worker":5,"./render-worker":6}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _tape = require("./tape");

var _tape2 = _interopRequireDefault(_tape);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

function getInstrumentFromRegExp(instruments, ch) {
  var keys = Object.keys(instruments);

  for (var i = 0; i < keys.length; i++) {
    var matches = /^\/(.+)?\/(\w*)$/.exec(keys[i]);
    if (matches && new RegExp(matches[1], matches[2]).test(ch)) {
      return instruments[keys[i]];
    }
  }

  return null;
}

function getInstrumentFrom(instruments, ch, index, tape) {
  var instrument = null;

  if (instruments.hasOwnProperty(ch)) {
    instrument = instruments[ch];
  } else {
    instrument = getInstrumentFromRegExp(instruments, ch);
  }

  if (typeof instrument === "function") {
    instrument = instrument(ch, index, tape);
  }

  return instrument instanceof _tape2["default"] ? instrument : null;
}

var Sequence = (function () {
  function Sequence() {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _classCallCheck(this, Sequence);

    this.pattern = this.instruments = this.durationPerStep = null;
    args.forEach(function (arg) {
      if (typeof arg === "string") {
        _this.pattern = arg;
      } else if (typeof arg === "number" || Array.isArray(arg)) {
        _this.durationPerStep = arg;
      } else if (typeof arg === "object") {
        _this.instruments = arg;
      }
    });
  }

  _createClass(Sequence, [{
    key: "apply",
    value: function apply() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var pattern = this.pattern;
      var instruments = this.instruments;
      var durationPerStep = this.durationPerStep;

      args.forEach(function (arg) {
        if (typeof arg === "string") {
          pattern = arg;
        } else if (typeof arg === "number" || Array.isArray(arg)) {
          durationPerStep = arg;
        } else if (typeof arg === "object") {
          instruments = arg;
        }
      });

      if (pattern === null || instruments === null || durationPerStep === null) {
        return _tape2["default"].silence(0);
      }

      var durationPerStepList = Array.isArray(durationPerStep) ? durationPerStep : [durationPerStep];

      return pattern.split("").reduce(function (tape, ch, index) {
        var instrument = getInstrumentFrom(instruments, ch, index, tape);
        var durationPerStep = durationPerStepList[index % durationPerStepList.length];

        durationPerStep = Math.max(0, +durationPerStep || 0);

        if (instrument !== null) {
          if (instrument.duration < durationPerStep) {
            tape = tape.concat(instrument, _tape2["default"].silence(durationPerStep - instrument.duration));
          } else {
            tape = tape.concat(instrument.slice(0, durationPerStep));
          }
        } else {
          tape = tape.concat(_tape2["default"].silence(durationPerStep));
        }

        return tape;
      }, new _tape2["default"](1, _config2["default"].sampleRate));
    }
  }]);

  return Sequence;
})();

exports["default"] = Sequence;
module.exports = exports["default"];
},{"./config":2,"./tape":9}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _track = require("./track");

var _track2 = _interopRequireDefault(_track);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var util = {};

var Tape = (function () {
  function Tape(numberOfChannels, sampleRate) {
    _classCallCheck(this, Tape);

    this.tracks = [new _track2["default"]()];
    this._numberOfChannels = Math.max(1, numberOfChannels | 0);
    this._sampleRate = Math.max(0, sampleRate | 0) || _config2["default"].sampleRate;
  }

  _createClass(Tape, [{
    key: "sampleRate",
    get: function () {
      return this._sampleRate || _config2["default"].sampleRate;
    }
  }, {
    key: "length",
    get: function () {
      return Math.floor(this.duration * this.sampleRate);
    }
  }, {
    key: "duration",
    get: function () {
      return this.tracks[0].duration;
    }
  }, {
    key: "numberOfChannels",
    get: function () {
      return this._numberOfChannels;
    }
  }, {
    key: "numberOfTracks",
    get: function () {
      return this.tracks.length;
    }
  }, {
    key: "gain",
    value: function gain() {
      var _gain = arguments[0] === undefined ? 1 : arguments[0];

      _gain = util.toNumber(_gain);

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.gain(_gain);
      });

      return newInstance;
    }
  }, {
    key: "pan",
    value: function pan() {
      var _pan = arguments[0] === undefined ? 0 : arguments[0];

      _pan = util.toNumber(_pan);

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.pan(_pan);
      });

      return newInstance;
    }
  }, {
    key: "reverse",
    value: function reverse() {
      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.reverse();
      });

      return newInstance;
    }
  }, {
    key: "pitch",
    value: function pitch() {
      var rate = arguments[0] === undefined ? 1 : arguments[0];

      rate = Math.max(0, util.toNumber(rate));

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.pitch(rate);
      });

      return newInstance;
    }
  }, {
    key: "stretch",
    value: function stretch() {
      var rate = arguments[0] === undefined ? 1 : arguments[0];

      rate = Math.max(0, util.toNumber(rate));

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.stretch(rate);
      });

      return newInstance;
    }
  }, {
    key: "clone",
    value: function clone() {
      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.clone();
      });

      return newInstance;
    }
  }, {
    key: "silence",
    value: function silence() {
      var duration = arguments[0] === undefined ? 0 : arguments[0];

      duration = Math.max(0, util.toNumber(duration));

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      if (0 < duration) {
        newInstance.tracks = this.tracks.map(function () {
          return _track2["default"].silence(duration);
        });
      }

      return newInstance;
    }
  }, {
    key: "concat",
    value: function concat() {
      for (var _len = arguments.length, tapes = Array(_len), _key = 0; _key < _len; _key++) {
        tapes[_key] = arguments[_key];
      }

      tapes = Array.prototype.concat.apply([], tapes);

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.clone();
      });

      tapes.forEach(function (tape) {
        if (!(tape instanceof Tape && 0 < tape.duration)) {
          return;
        }
        if (newInstance._numberOfChannels < tape._numberOfChannels) {
          newInstance._numberOfChannels = tape._numberOfChannels;
        }
        if (newInstance.numberOfTracks < tape.numberOfTracks) {
          newInstance = util.adjustNumberOfTracks(newInstance, tape.numberOfTracks);
        }
        if (tape.numberOfTracks < newInstance.numberOfTracks) {
          tape = util.adjustNumberOfTracks(tape, newInstance.numberOfTracks);
        }
        tape.tracks.forEach(function (track, index) {
          newInstance.tracks[index].append(track);
        });
      });

      return newInstance;
    }
  }, {
    key: "slice",
    value: function slice() {
      var beginTime = arguments[0] === undefined ? 0 : arguments[0];
      var duration = arguments[1] === undefined ? Infinity : arguments[1];

      beginTime = util.toNumber(beginTime);
      duration = Math.max(0, util.toNumber(duration));

      if (beginTime < 0) {
        beginTime += this.duration;
      }
      beginTime = Math.max(0, beginTime);

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.slice(beginTime, duration);
      });

      return newInstance;
    }
  }, {
    key: "loop",
    value: function loop() {
      var n = arguments[0] === undefined ? 2 : arguments[0];

      n = Math.max(0, n | 0);

      var tapes = new Array(n);

      for (var i = 0; i < tapes.length; i++) {
        tapes[i] = this;
      }

      return new Tape(this.numberOfChannels, this.sampleRate).concat(tapes);
    }
  }, {
    key: "fill",
    value: function fill() {
      var duration = arguments[0] === undefined ? this.duration : arguments[0];

      duration = Math.max(0, util.toNumber(duration));

      var this$duration = this.duration;

      if (this$duration === 0) {
        return this.silence(duration);
      }

      var loopCount = Math.floor(duration / this$duration);
      var remain = duration % this$duration;

      return this.loop(loopCount).concat(this.slice(0, remain));
    }
  }, {
    key: "replace",
    value: function replace() {
      var beginTime = arguments[0] === undefined ? 0 : arguments[0];
      var duration = arguments[1] === undefined ? 0 : arguments[1];
      var tape = arguments[2] === undefined ? null : arguments[2];

      beginTime = util.toNumber(beginTime);
      duration = Math.max(0, util.toNumber(duration));

      if (beginTime < 0) {
        beginTime += this.duration;
      }
      beginTime = Math.max(0, beginTime);

      if (typeof tape === "function") {
        tape = tape(this.slice(beginTime, duration));
      }

      return this.slice(0, beginTime).concat(tape, this.slice(beginTime + duration));
    }
  }, {
    key: "split",
    value: function split() {
      var n = arguments[0] === undefined ? 2 : arguments[0];

      n = Math.max(0, n | 0);

      var tapes = new Array(n);
      var duration = this.duration / n;

      for (var i = 0; i < n; i++) {
        tapes[i] = this.slice(duration * i, duration);
      }

      return tapes;
    }
  }, {
    key: "mix",
    value: function mix() {
      for (var _len2 = arguments.length, tapes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        tapes[_key2] = arguments[_key2];
      }

      tapes = Array.prototype.concat.apply([], tapes);

      var method = undefined;
      if (typeof tapes[tapes.length - 1] === "string") {
        method = tapes.pop();
      }

      var newInstance = new Tape(this.numberOfChannels, this.sampleRate);

      newInstance.tracks = this.tracks.map(function (track) {
        return track.clone();
      });

      tapes.forEach(function (tape) {
        if (!(tape instanceof Tape && 0 < tape.duration)) {
          return;
        }
        if (newInstance._numberOfChannels < tape._numberOfChannels) {
          newInstance._numberOfChannels = tape._numberOfChannels;
        }
        if (newInstance.duration < tape.duration) {
          newInstance = util.adjustDuration(newInstance, tape.duration, method);
        }
        if (tape.duration < newInstance.duration) {
          tape = util.adjustDuration(tape, newInstance.duration, method);
        }
        newInstance.tracks = newInstance.tracks.concat(tape.tracks);
      });

      return newInstance;
    }
  }, {
    key: "render",
    value: function render() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (_config2["default"].render) {
        return _config2["default"].render.apply(null, [this.toJSON()].concat(args));
      }
      return new Promise(function (resolve, reject) {
        reject(new Error("not implemented"));
      });
    }
  }, {
    key: "dispose",
    value: function dispose() {}
  }, {
    key: "toJSON",
    value: function toJSON() {
      var tracks = this.tracks.map(function (track) {
        return track.toJSON();
      });
      var duration = this.duration;
      var sampleRate = this.sampleRate;
      var numberOfChannels = this.numberOfChannels;

      var usePan = tracks.some(function (fragments) {
        return fragments.some(function (fragment) {
          return fragment.pan !== 0;
        });
      });
      if (usePan) {
        numberOfChannels = Math.max(2, numberOfChannels);
      }

      return { tracks: tracks, duration: duration, sampleRate: sampleRate, numberOfChannels: numberOfChannels };
    }
  }], [{
    key: "from",
    value: function from() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      if (_config2["default"].from) {
        return _config2["default"].from.apply(null, args);
      }
      return Promise.resolve(new Tape(args[0], args[1]));
    }
  }, {
    key: "silence",
    value: function silence(duration) {
      return new Tape(1, _config2["default"].sampleRate).silence(duration);
    }
  }, {
    key: "concat",
    value: function concat() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return Tape.prototype.concat.apply(new Tape(1, _config2["default"].sampleRate), args);
    }
  }, {
    key: "mix",
    value: function mix() {
      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      var newInstance = Tape.prototype.mix.apply(new Tape(1, _config2["default"].sampleRate), args);

      if (1 < newInstance.tracks.length) {
        newInstance.tracks.shift(); // remove first empty track
      }

      return newInstance;
    }
  }]);

  return Tape;
})();

exports["default"] = Tape;

util.toNumber = function (num) {
  return +num || 0;
};

util.adjustNumberOfTracks = function (tape, numberOfTracks) {
  var newInstance = new Tape(tape.numberOfChannels, tape.sampleRate);

  newInstance.tracks = tape.tracks.map(function (track) {
    return track.clone();
  });

  var balance = numberOfTracks - newInstance.numberOfTracks;
  var duration = newInstance.duration;

  for (var i = 0; i < balance; i++) {
    newInstance.tracks.push(_track2["default"].silence(duration));
  }

  return newInstance;
};

util.adjustDuration = function (tape, duration, method) {
  if (tape.duration === 0) {
    return tape.silence(duration);
  }
  switch (method) {
    case "fill":
      return tape.fill(duration);
    case "pitch":
      return tape.pitch(tape.duration / duration);
    case "stretch":
      return tape.stretch(tape.duration / duration);
    default:
      /* silence */
      return tape.concat(tape.silence(duration - tape.duration));
  }
};
module.exports = exports["default"];

/* subclass responsibility */
},{"./config":2,"./track":10}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _fragment = require("./fragment");

var _fragment2 = _interopRequireDefault(_fragment);

var Track = (function () {
  function Track() {
    var fragments = arguments[0] === undefined ? [] : arguments[0];
    var duration = arguments[1] === undefined ? 0 : arguments[1];

    _classCallCheck(this, Track);

    this.fragments = fragments;
    if (fragments.length !== 0 && duration === 0) {
      duration = fragments.reduce(function (duration, fragment) {
        return duration + fragment.duration;
      }, 0);
    }
    this.duration = duration;
  }

  _createClass(Track, [{
    key: "gain",
    value: function gain(_gain) {
      return new Track(this.fragments.map(function (fragment) {
        return fragment.clone({ gain: fragment.gain * _gain });
      }), this.duration);
    }
  }, {
    key: "pan",
    value: function pan(_pan) {
      return new Track(this.fragments.map(function (fragment) {
        return fragment.clone({ pan: fragment.pan + _pan });
      }), this.duration);
    }
  }, {
    key: "reverse",
    value: function reverse() {
      return new Track(this.fragments.map(function (fragment) {
        return fragment.clone({ reverse: !fragment.reverse });
      }).reverse(), this.duration);
    }
  }, {
    key: "pitch",
    value: function pitch(rate) {
      return new Track(this.fragments.map(function (fragment) {
        return fragment.clone({ pitch: fragment.pitch * rate, stretch: false });
      }), 0); // need to recalculate the duration
    }
  }, {
    key: "stretch",
    value: function stretch(rate) {
      return new Track(this.fragments.map(function (fragment) {
        return fragment.clone({ pitch: fragment.pitch * rate, stretch: true });
      }), 0); // need to recalculate the duration
    }
  }, {
    key: "clone",
    value: function clone() {
      return new Track(this.fragments.slice(), this.duration);
    }
  }, {
    key: "slice",
    value: function slice(beginTime, duration) {
      var newInstance = new Track();
      var remainingStart = Math.max(0, beginTime);
      var remainingDuration = duration;

      for (var i = 0; 0 < remainingDuration && i < this.fragments.length; i++) {
        if (this.fragments[i].duration <= remainingStart) {
          remainingStart -= this.fragments[i].duration;
        } else {
          var fragment = this.fragments[i].slice(remainingStart, remainingDuration);

          newInstance.addFragment(fragment);

          remainingStart = 0;
          remainingDuration -= fragment.duration;
        }
      }

      return newInstance;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.fragments.map(function (fragment) {
        return fragment.toJSON();
      });
    }
  }, {
    key: "addFragment",
    value: function addFragment(fragment) {
      if (fragment instanceof _fragment2["default"] && 0 < fragment.duration) {
        this.fragments.push(fragment);
        this.duration += fragment.duration;
      }
      return this;
    }
  }, {
    key: "append",
    value: function append(track) {
      var _this = this;

      if (track instanceof Track) {
        track.fragments.forEach(function (fragment) {
          _this.addFragment(fragment);
        });
      }
      return this;
    }
  }], [{
    key: "silence",
    value: function silence(duration) {
      return new Track([new _fragment2["default"](0, 0, duration)], duration);
    }
  }]);

  return Track;
})();

exports["default"] = Track;
module.exports = exports["default"];
},{"./fragment":3}],11:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _tape = require("./tape");

var _tape2 = _interopRequireDefault(_tape);

var _fragment = require("./fragment");

var _fragment2 = _interopRequireDefault(_fragment);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _renderer = require("./renderer");

var _renderer2 = _interopRequireDefault(_renderer);

var _audioContext = null;

var WebAudioTape = (function (_Tape) {
  function WebAudioTape(audioBuffer) {
    _classCallCheck(this, WebAudioTape);

    _get(Object.getPrototypeOf(WebAudioTape.prototype), "constructor", this).call(this, audioBuffer.numberOfChannels, audioBuffer.sampleRate);

    var audioData = new Array(audioBuffer.numberOfChannels);
    for (var i = 0; i < audioData.length; i++) {
      audioData[i] = audioBuffer.getChannelData(i);
    }

    this._data = _renderer2["default"].transfer(audioData);

    this.tracks[0].addFragment(new _fragment2["default"](this._data, 0, audioBuffer.duration));

    _config2["default"].sampleRate = audioBuffer.sampleRate;
  }

  _inherits(WebAudioTape, _Tape);

  _createClass(WebAudioTape, [{
    key: "dispose",
    value: function dispose() {
      _renderer2["default"].dispose(this._data);
    }
  }]);

  return WebAudioTape;
})(_tape2["default"]);

exports["default"] = WebAudioTape;
var use = function use() {

  function from(src) {
    var audioContext = arguments[1] === undefined ? _audioContext : arguments[1];

    if (src instanceof _tape2["default"]) {
      return Promise.resolve(src.clone());
    }
    if (src instanceof global.AudioBuffer) {
      return Promise.resolve(new WebAudioTape(src));
    }
    if (_audioContext === null) {
      _audioContext = audioContext || new global.AudioContext();
    }
    if (src instanceof ArrayBuffer) {
      return new Promise(function (resolve, reject) {
        _audioContext.decodeAudioData(src, function (audioBuffer) {
          resolve(audioBuffer);
        }, reject);
      }).then(from);
    }
    if (typeof src === "string") {
      return new Promise(function (resolve, reject) {
        var xhr = new global.XMLHttpRequest();
        xhr.open("GET", src);
        xhr.responseType = "arraybuffer";
        xhr.onload = function () {
          /* istanbul ignore else */
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = function () {
          reject(new Error(xhr.statusText));
        };
        xhr.send();
      }).then(from);
    }
    return Promise.reject(new Error("Invalid arguments"));
  }

  function render(tape, audioContext) {
    var numberOfChannels = arguments[2] === undefined ? 0 : arguments[2];

    numberOfChannels = Math.max(numberOfChannels, tape.numberOfChannels);

    tape.numberOfChannels = numberOfChannels;

    return _renderer2["default"].render(tape).then(function (audioData) {
      var length = Math.floor(tape.duration * tape.sampleRate);
      var audioBuffer = audioContext.createBuffer(numberOfChannels, length, tape.sampleRate);

      if (audioBuffer.copyToChannel) {
        for (var i = 0; i < numberOfChannels; i++) {
          audioBuffer.copyToChannel(audioData[i], i);
        }
      } else {
        for (var i = 0; i < numberOfChannels; i++) {
          audioBuffer.getChannelData(i).set(audioData[i]);
        }
      }

      return audioBuffer;
    });
  }

  _config2["default"].from = from;
  _config2["default"].render = render;
};
exports.use = use;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./config":2,"./fragment":3,"./renderer":7,"./tape":9}]},{},[1])(1)
});