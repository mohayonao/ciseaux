(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ciseaux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./lib/web-audio-tape").use();

module.exports = require("./lib");

},{"./lib":4,"./lib/web-audio-tape":11}],2:[function(require,module,exports){
"use strict";

module.exports = {
  sampleRate: 0,
  from: null,
  create: null,
  render: null };
},{}],3:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Fragment = exports.Fragment = (function () {
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

  _prototypeProperties(Fragment, null, {
    duration: {
      get: function () {
        return (this.endTime - this.beginTime) / this.pitch;
      },
      configurable: true
    },
    slice: {
      value: function slice(beginTime, duration) {
        beginTime = this.beginTime + beginTime * this.pitch;

        var endTime = beginTime + duration * this.pitch;

        beginTime = Math.max(this.beginTime, beginTime);
        endTime = Math.max(beginTime, Math.min(endTime, this.endTime));

        return this.clone({ beginTime: beginTime, endTime: endTime });
      },
      writable: true,
      configurable: true
    },
    clone: {
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
      },
      writable: true,
      configurable: true
    },
    toJSON: {
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
      },
      writable: true,
      configurable: true
    }
  });

  return Fragment;
})();

exports["default"] = Fragment;
Object.defineProperty(exports, "__esModule", {
  value: true
});
},{}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Sequence = _interopRequire(require("./sequence"));

var Tape = _interopRequire(require("./tape"));

var from = Tape.from;
var silence = Tape.silence;
var concat = Tape.concat;
var mix = Tape.mix;
module.exports = { Sequence: Sequence, Tape: Tape, from: from, silence: silence, concat: concat, mix: mix };
},{"./sequence":8,"./tape":9}],5:[function(require,module,exports){
(function (global){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/* istanbul ignore next */
var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = exports.InlineWorker = (function () {
  function InlineWorker(func, self) {
    var _this = this;

    _classCallCheck(this, InlineWorker);

    /* istanbul ignore next */
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

  _prototypeProperties(InlineWorker, null, {
    postMessage: {
      value: function postMessage(data) {
        var _this = this;

        setTimeout(function () {
          _this.self.onmessage({ data: data });
        }, 0);
      },
      writable: true,
      configurable: true
    }
  });

  return InlineWorker;
})();

exports["default"] = InlineWorker;
Object.defineProperty(exports, "__esModule", {
  value: true
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
"use strict";

/* jshint esnext: false */

/**
  CAUTION!!!!
  This file is used in WebWorker.
  So, must write with ES5, not use ES6.
  You need attention not to be traspiled by babel.
*/

var self = {};

function render() {
  self.repository = [];

  self.onmessage = function (e) {
    switch (e.data.type) {
      case "transfer":
        self.repository[e.data.data] = e.data.buffers.map(function (buffer) {
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

  self.startRendering = function (tape, callbackId) {
    var destination = self.allocData(tape);
    var buffers = destination.map(function (array) {
      return array.buffer;
    });

    self.render(tape, destination);

    self.postMessage({ callbackId: callbackId, buffers: buffers }, buffers);
  };

  self.allocData = function (tape) {
    var data = new Array(tape.numberOfChannels);
    var length = Math.floor(tape.duration * tape.sampleRate);

    for (var i = 0; i < data.length; i++) {
      data[i] = new Float32Array(length);
    }

    return data;
  };

  self.render = function (tape, destination) {
    for (var i = 0; i < tape.tracks.length; i++) {
      self.renderTrack(i, tape.tracks[i], destination, tape.sampleRate);
    }
  };

  self.renderTrack = function (trackNum, fragments, destination, sampleRate) {
    var usePan = fragments.some(function (fragment) {
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
          reverse: !!fragment.reverse
        });
      }

      pos += length;
    }
  };

  self.subarray = function (array, begin, end) {
    var subarray = new Array(array.length);

    for (var i = 0; i < subarray.length; i++) {
      subarray[i] = array[i].subarray(begin, end);
    }

    return subarray;
  };

  self.process = function (src, dst, opts) {
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
      var i0 = x0 | 0;
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
  self.pan[1] = function (src, l, r) {
    return [src[0] * l, src[0] * r];
  };
  self.pan[2] = function (src, l, r) {
    var x = (src[0] + src[1]) * 0.5;
    return [x * l, x * r];
  };
  self.pan[4] = function (src, l, r) {
    var x = (src[0] + src[1]) * 0.5;
    var y = (src[2] + src[3]) * 0.5;
    return [x * l, x * r, y * l, y * r];
  };
  self.pan[6] = function (src, l, r) {
    var x = (src[0] + src[1]) * 0.5;
    var y = (src[4] + src[5]) * 0.5;
    return [x * l, x * r, src[2], src[3], y * l, y * r];
  };

  self.mix = {};
  self.mix["1->1"] = function (src, dst) {
    dst[0].set(src[0]);
  };
  self.mix["1->2"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[0]);
  };
  self.mix["1->4"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[0]);
  };
  self.mix["1->6"] = function (src, dst) {
    dst[2].set(src[0]);
  };
  self.mix["2->2"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
  };
  self.mix["2->4"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
  };
  self.mix["2->6"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
  };
  self.mix["4->4"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
    dst[2].set(src[2]);
    dst[3].set(src[3]);
  };
  self.mix["4->6"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
    dst[4].set(src[2]);
    dst[5].set(src[3]);
  };
  self.mix["6->6"] = function (src, dst) {
    dst[0].set(src[0]);
    dst[1].set(src[1]);
    dst[2].set(src[2]);
    dst[3].set(src[3]);
    dst[4].set(src[4]);
    dst[5].set(src[5]);
  };

  self.mix1 = {};
  self.mix1.nop = function (src) {
    return src;
  };
  self.mix1["1->2"] = function (src) {
    return [src[0], src[0]];
  };
  self.mix1["1->4"] = function (src) {
    return [src[0], src[0], 0, 0];
  };
  self.mix1["1->6"] = function (src) {
    return [0, 0, src[0], 0, 0, 0];
  };
  self.mix1["2->4"] = function (src) {
    return [src[0], src[1], 0, 0];
  };
  self.mix1["2->6"] = function (src) {
    return [src[0], src[1], 0, 0, 0, 0];
  };
  self.mix1["4->6"] = function (src) {
    return [src[0], src[1], 0, 0, src[2], src[3]];
  };
  self.mix1["2->1"] = function (src) {
    return [0.5 * (src[0] + src[1])];
  };
  self.mix1["4->1"] = function (src) {
    return [0.25 * (src[0] + src[1] + src[2] + src[3])];
  };
  self.mix1["6->1"] = function (src) {
    return [0.7071 * (src[0] + src[1]) + src[2] + 0.5 * (src[4] + src[5])];
  };
  self.mix1["4->2"] = function (src) {
    return [0.5 * (src[0] + src[2]), 0.5 * (src[1] + src[3])];
  };
  self.mix1["6->2"] = function (src) {
    return [src[0] + 0.7071 * (src[2] + src[4]), src[1] + 0.7071 * (src[2] + src[5])];
  };
  self.mix1["6->4"] = function (src) {
    return [src[0] + 0.7071 * src[2], src[1] + 0.7071 * src[2], src[4], src[5]];
  };
}

render.self = render.util = self;

module.exports = render;
},{}],7:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var InlineWorker = _interopRequire(require("./inline-worker"));

var render = _interopRequire(require("./render-worker"));

var worker = new InlineWorker(render, render.self);

var __callbacks = [];
var __data = 1; // data 0 is reserved for silence

worker.onmessage = function (e) {
  var audioData = e.data.buffers.map(function (buffer) {
    return new Float32Array(buffer);
  });
  __callbacks[e.data.callbackId](audioData);
  __callbacks[e.data.callbackId] = null;
};

var renderer = exports.renderer = {
  transfer: function (audioData) {
    var data = __data++;
    var buffers = audioData.map(function (array) {
      return array.buffer;
    });
    worker.postMessage({ type: "transfer", data: data, buffers: buffers }, buffers);
    return data;
  },
  dispose: function (data) {
    worker.postMessage({ type: "dispose", data: data });
  },
  render: function (tape) {
    var callbackId = __callbacks.length;

    worker.postMessage({ type: "render", tape: tape, callbackId: callbackId });

    return new Promise(function (resolve) {
      __callbacks[callbackId] = resolve;
    });
  },
  util: render.util
};

exports["default"] = renderer;
Object.defineProperty(exports, "__esModule", {
  value: true
});
},{"./inline-worker":5,"./render-worker":6}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _tape = require("./tape");

var Tape = _tape.Tape;
var TapeConstructor = _tape.TapeConstructor;

var config = _interopRequire(require("./config"));

var getInstrumentFromRegExp = function (instruments, ch) {
  var keys = Object.keys(instruments);

  for (var i = 0; i < keys.length; i++) {
    var matches = /^\/(.+)?\/(\w*)$/.exec(keys[i]);
    if (matches && new RegExp(matches[1], matches[2]).test(ch)) {
      return instruments[keys[i]];
    }
  }

  return null;
};

var getInstrumentFrom = function (instruments, ch, index, tape) {
  var instrument = null;

  if (instruments.hasOwnProperty(ch)) {
    instrument = instruments[ch];
  } else {
    instrument = getInstrumentFromRegExp(instruments, ch);
  }

  if (typeof instrument === "function") {
    instrument = instrument(ch, index, tape);
  }

  return instrument instanceof Tape ? instrument : null;
};

var Sequence = exports.Sequence = (function () {
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

  _prototypeProperties(Sequence, null, {
    apply: {
      value: function apply() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var _ref = this;

        var pattern = _ref.pattern;
        var instruments = _ref.instruments;
        var durationPerStep = _ref.durationPerStep;

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
          return Tape.silence(0);
        }

        var durationPerStepList = Array.isArray(durationPerStep) ? durationPerStep : [durationPerStep];

        return pattern.split("").reduce(function (tape, ch, index) {
          var instrument = getInstrumentFrom(instruments, ch, index, tape);
          var durationPerStep = durationPerStepList[index % durationPerStepList.length];

          durationPerStep = Math.max(0, +durationPerStep || 0);

          if (instrument !== null) {
            if (instrument.duration < durationPerStep) {
              tape = tape.concat(instrument, Tape.silence(durationPerStep - instrument.duration));
            } else {
              tape = tape.concat(instrument.slice(0, durationPerStep));
            }
          } else {
            tape = tape.concat(Tape.silence(durationPerStep));
          }

          return tape;
        }, new TapeConstructor(1, config.sampleRate));
      },
      writable: true,
      configurable: true
    }
  });

  return Sequence;
})();

exports["default"] = Sequence;
Object.defineProperty(exports, "__esModule", {
  value: true
});
},{"./config":2,"./tape":9}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Track = _interopRequire(require("./track"));

var config = _interopRequire(require("./config"));

var util = {};

var Tape = exports.Tape = (function () {
  function Tape() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _classCallCheck(this, Tape);

    if (config.create) {
      return config.create.apply(null, args);
    }
    return new TapeConstructor(args[0], args[1]);
  }

  _prototypeProperties(Tape, {
    from: {
      value: function from() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (config.from) {
          return config.from.apply(null, args);
        }
        return Promise.resolve(new TapeConstructor(args[0], args[1]));
      },
      writable: true,
      configurable: true
    },
    silence: {
      value: function silence(duration) {
        return new TapeConstructor(1, config.sampleRate).silence(duration);
      },
      writable: true,
      configurable: true
    },
    concat: {
      value: function concat() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return Tape.prototype.concat.apply(new TapeConstructor(1, config.sampleRate), args);
      },
      writable: true,
      configurable: true
    },
    mix: {
      value: function mix() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var newInstance = Tape.prototype.mix.apply(new TapeConstructor(1, config.sampleRate), args);

        if (1 < newInstance.tracks.length) {
          newInstance.tracks.shift(); // remove first empty track
        }

        return newInstance;
      },
      writable: true,
      configurable: true
    }
  }, {
    sampleRate: {
      get: function () {
        return this._sampleRate || config.sampleRate;
      },
      configurable: true
    },
    length: {
      get: function () {
        return Math.floor(this.duration * this.sampleRate);
      },
      configurable: true
    },
    duration: {
      get: function () {
        return this.tracks[0].duration;
      },
      configurable: true
    },
    numberOfChannels: {
      get: function () {
        return this._numberOfChannels;
      },
      configurable: true
    },
    numberOfTracks: {
      get: function () {
        return this.tracks.length;
      },
      configurable: true
    },
    gain: {
      value: (function (_gain) {
        var _gainWrapper = function gain() {
          return _gain.apply(this, arguments);
        };

        _gainWrapper.toString = function () {
          return _gain.toString();
        };

        return _gainWrapper;
      })(function () {
        var gain = arguments[0] === undefined ? 1 : arguments[0];

        gain = util.toNumber(gain);

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.gain(gain);
        });

        return newInstance;
      }),
      writable: true,
      configurable: true
    },
    pan: {
      value: (function (_pan) {
        var _panWrapper = function pan() {
          return _pan.apply(this, arguments);
        };

        _panWrapper.toString = function () {
          return _pan.toString();
        };

        return _panWrapper;
      })(function () {
        var pan = arguments[0] === undefined ? 0 : arguments[0];

        pan = util.toNumber(pan);

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.pan(pan);
        });

        return newInstance;
      }),
      writable: true,
      configurable: true
    },
    reverse: {
      value: function reverse() {
        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.reverse();
        });

        return newInstance;
      },
      writable: true,
      configurable: true
    },
    pitch: {
      value: function pitch() {
        var rate = arguments[0] === undefined ? 1 : arguments[0];

        rate = Math.max(0, util.toNumber(rate));

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.pitch(rate);
        });

        return newInstance;
      },
      writable: true,
      configurable: true
    },
    stretch: {
      value: function stretch() {
        var rate = arguments[0] === undefined ? 1 : arguments[0];

        rate = Math.max(0, util.toNumber(rate));

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.stretch(rate);
        });

        return newInstance;
      },
      writable: true,
      configurable: true
    },
    clone: {
      value: function clone() {
        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.clone();
        });

        return newInstance;
      },
      writable: true,
      configurable: true
    },
    silence: {
      value: function silence() {
        var duration = arguments[0] === undefined ? 0 : arguments[0];

        duration = Math.max(0, util.toNumber(duration));

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        if (0 < duration) {
          newInstance.tracks = this.tracks.map(function () {
            return Track.silence(duration);
          });
        }

        return newInstance;
      },
      writable: true,
      configurable: true
    },
    concat: {
      value: function concat() {
        for (var _len = arguments.length, tapes = Array(_len), _key = 0; _key < _len; _key++) {
          tapes[_key] = arguments[_key];
        }

        tapes = Array.prototype.concat.apply([], tapes);

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.clone();
        });

        tapes.forEach(function (tape) {
          if (!(tape instanceof TapeConstructor && 0 < tape.duration)) {
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
      },
      writable: true,
      configurable: true
    },
    slice: {
      value: function slice() {
        var beginTime = arguments[0] === undefined ? 0 : arguments[0];
        var duration = arguments[1] === undefined ? Infinity : arguments[1];

        beginTime = util.toNumber(beginTime);
        duration = Math.max(0, util.toNumber(duration));

        if (beginTime < 0) {
          beginTime += this.duration;
        }
        beginTime = Math.max(0, beginTime);

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.slice(beginTime, duration);
        });

        return newInstance;
      },
      writable: true,
      configurable: true
    },
    loop: {
      value: function loop() {
        var n = arguments[0] === undefined ? 2 : arguments[0];

        n = Math.max(0, n | 0);

        var tapes = new Array(n);

        for (var i = 0; i < tapes.length; i++) {
          tapes[i] = this;
        }

        return new TapeConstructor(this.numberOfChannels, this.sampleRate).concat(tapes);
      },
      writable: true,
      configurable: true
    },
    fill: {
      value: function fill() {
        var duration = arguments[0] === undefined ? this.duration : arguments[0];

        duration = Math.max(0, util.toNumber(duration));

        var this_duration = this.duration;

        if (this_duration === 0) {
          return this.silence(duration);
        }

        var loopCount = Math.floor(duration / this_duration);
        var remain = duration % this_duration;

        return this.loop(loopCount).concat(this.slice(0, remain));
      },
      writable: true,
      configurable: true
    },
    replace: {
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
      },
      writable: true,
      configurable: true
    },
    split: {
      value: function split() {
        var n = arguments[0] === undefined ? 2 : arguments[0];

        n = Math.max(0, n | 0);

        var tapes = new Array(n);
        var duration = this.duration / n;

        for (var i = 0; i < n; i++) {
          tapes[i] = this.slice(duration * i, duration);
        }

        return tapes;
      },
      writable: true,
      configurable: true
    },
    mix: {
      value: function mix() {
        for (var _len = arguments.length, tapes = Array(_len), _key = 0; _key < _len; _key++) {
          tapes[_key] = arguments[_key];
        }

        tapes = Array.prototype.concat.apply([], tapes);

        var method = undefined;
        if (typeof tapes[tapes.length - 1] === "string") {
          method = tapes.pop();
        }

        var newInstance = new TapeConstructor(this.numberOfChannels, this.sampleRate);

        newInstance.tracks = this.tracks.map(function (track) {
          return track.clone();
        });

        tapes.forEach(function (tape) {
          if (!(tape instanceof TapeConstructor && 0 < tape.duration)) {
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
      },
      writable: true,
      configurable: true
    },
    render: {
      value: function render() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (config.render) {
          return config.render.apply(null, [this.toJSON()].concat(args));
        }
        return new Promise(function (resolve, reject) {
          reject(new Error("not implemented"));
        });
      },
      writable: true,
      configurable: true
    },
    dispose: {
      value: function dispose() {},
      writable: true,
      configurable: true
    },
    toJSON: {
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
      },
      writable: true,
      configurable: true
    }
  });

  return Tape;
})();

var TapeConstructor = exports.TapeConstructor = (function (Tape) {
  function TapeConstructor(numberOfChannels, sampleRate) {
    _classCallCheck(this, TapeConstructor);

    this.tracks = [new Track()];
    this._numberOfChannels = Math.max(1, numberOfChannels | 0);
    this._sampleRate = Math.max(0, sampleRate | 0) || config.sampleRate;
  }

  _inherits(TapeConstructor, Tape);

  return TapeConstructor;
})(Tape);

util.toNumber = function (num) {
  return +num || 0;
};

util.adjustNumberOfTracks = function (tape, numberOfTracks) {
  var newInstance = new TapeConstructor(tape.numberOfChannels, tape.sampleRate);

  newInstance.tracks = tape.tracks.map(function (track) {
    return track.clone();
  });

  var balance = numberOfTracks - newInstance.numberOfTracks;
  var duration = newInstance.duration;

  for (var i = 0; i < balance; i++) {
    newInstance.tracks.push(Track.silence(duration));
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

exports["default"] = Tape;
Object.defineProperty(exports, "__esModule", {
  value: true
});

/* subclass responsibility */
},{"./config":2,"./track":10}],10:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Fragment = _interopRequire(require("./fragment"));

var Track = exports.Track = (function () {
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

  _prototypeProperties(Track, {
    silence: {
      value: function silence(duration) {
        return new Track([new Fragment(0, 0, duration)], duration);
      },
      writable: true,
      configurable: true
    }
  }, {
    gain: {
      value: (function (_gain) {
        var _gainWrapper = function gain(_x) {
          return _gain.apply(this, arguments);
        };

        _gainWrapper.toString = function () {
          return _gain.toString();
        };

        return _gainWrapper;
      })(function (gain) {
        return new Track(this.fragments.map(function (fragment) {
          return fragment.clone({ gain: fragment.gain * gain });
        }), this.duration);
      }),
      writable: true,
      configurable: true
    },
    pan: {
      value: (function (_pan) {
        var _panWrapper = function pan(_x2) {
          return _pan.apply(this, arguments);
        };

        _panWrapper.toString = function () {
          return _pan.toString();
        };

        return _panWrapper;
      })(function (pan) {
        return new Track(this.fragments.map(function (fragment) {
          return fragment.clone({ pan: fragment.pan + pan });
        }), this.duration);
      }),
      writable: true,
      configurable: true
    },
    reverse: {
      value: function reverse() {
        return new Track(this.fragments.map(function (fragment) {
          return fragment.clone({ reverse: !fragment.reverse });
        }).reverse(), this.duration);
      },
      writable: true,
      configurable: true
    },
    pitch: {
      value: function pitch(rate) {
        return new Track(this.fragments.map(function (fragment) {
          return fragment.clone({ pitch: fragment.pitch * rate, stretch: false });
        }), 0); // need to recalculate the duration
      },
      writable: true,
      configurable: true
    },
    stretch: {
      value: function stretch(rate) {
        return new Track(this.fragments.map(function (fragment) {
          return fragment.clone({ pitch: fragment.pitch * rate, stretch: true });
        }), 0); // need to recalculate the duration
      },
      writable: true,
      configurable: true
    },
    clone: {
      value: function clone() {
        return new Track(this.fragments.slice(), this.duration);
      },
      writable: true,
      configurable: true
    },
    slice: {
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
      },
      writable: true,
      configurable: true
    },
    toJSON: {
      value: function toJSON() {
        return this.fragments.map(function (fragment) {
          return fragment.toJSON();
        });
      },
      writable: true,
      configurable: true
    },
    addFragment: {
      value: function addFragment(fragment) {
        if (fragment instanceof Fragment && 0 < fragment.duration) {
          this.fragments.push(fragment);
          this.duration += fragment.duration;
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    append: {
      value: function append(track) {
        var _this = this;

        if (track instanceof Track) {
          track.fragments.forEach(function (fragment) {
            _this.addFragment(fragment);
          });
        }
        return this;
      },
      writable: true,
      configurable: true
    }
  });

  return Track;
})();

exports["default"] = Track;
Object.defineProperty(exports, "__esModule", {
  value: true
});
},{"./fragment":3}],11:[function(require,module,exports){
(function (global){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _tape = require("./tape");

var Tape = _tape.Tape;
var TapeConstructor = _tape.TapeConstructor;

var Fragment = _interopRequire(require("./fragment"));

var config = _interopRequire(require("./config"));

var renderer = _interopRequire(require("./renderer"));

var _audioContext = null;

var WebAudioTape = exports.WebAudioTape = (function (TapeConstructor) {
  function WebAudioTape(audioBuffer) {
    _classCallCheck(this, WebAudioTape);

    _get(Object.getPrototypeOf(WebAudioTape.prototype), "constructor", this).call(this, audioBuffer.numberOfChannels, audioBuffer.sampleRate);

    var audioData = new Array(audioBuffer.numberOfChannels);
    for (var i = 0; i < audioData.length; i++) {
      audioData[i] = audioBuffer.getChannelData(i);
    }

    this._data = renderer.transfer(audioData);

    this.tracks[0].addFragment(new Fragment(this._data, 0, audioBuffer.duration));

    config.sampleRate = audioBuffer.sampleRate;
  }

  _inherits(WebAudioTape, TapeConstructor);

  _prototypeProperties(WebAudioTape, null, {
    dispose: {
      value: function dispose() {
        renderer.dispose(this._data);
      },
      writable: true,
      configurable: true
    }
  });

  return WebAudioTape;
})(TapeConstructor);

exports["default"] = WebAudioTape;
var use = exports.use = function () {
  var from = config.from = function (src) {
    var audioContext = arguments[1] === undefined ? _audioContext : arguments[1];

    if (src instanceof Tape) {
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
  };
  config.create = function (audioBuffer) {
    return new WebAudioTape(audioBuffer);
  };
  config.render = function (tape, audioContext) {
    var numberOfChannels = arguments[2] === undefined ? 0 : arguments[2];

    numberOfChannels = Math.max(numberOfChannels, tape.numberOfChannels);

    tape.numberOfChannels = numberOfChannels;

    return renderer.render(tape).then(function (audioData) {
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
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./config":2,"./fragment":3,"./renderer":7,"./tape":9}]},{},[1])(1)
});