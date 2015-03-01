(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ciseaux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./lib/web-audio-tape").use();

module.exports = require("./lib");

},{"./lib":4,"./lib/web-audio-tape":10}],2:[function(require,module,exports){
"use strict";

module.exports = {
  sampleRate: 0,
  create: null,
  render: null };
},{}],3:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

module.exports = Fragment;
},{}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Sequence = _interopRequire(require("./sequence"));

var Tape = _interopRequire(require("./tape"));

var silence = Tape.silence;
var concat = Tape.concat;
var mix = Tape.mix;
module.exports = { Sequence: Sequence, Tape: Tape, silence: silence, concat: concat, mix: mix };
},{"./sequence":7,"./tape":8}],5:[function(require,module,exports){
(function (global){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/* istanbul ignore next */
var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = (function () {
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

module.exports = InlineWorker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var InlineWorker = _interopRequire(require("./inline-worker"));

var self = {};
var worker = new InlineWorker(function () {
  self.repository = {};

  self.onmessage = function (e) {
    switch (e.data.type) {
      case "transfer":
        self.repository[e.data.data] = e.data.buffers.map(function (buffer) {
          return new Float32Array(buffer);
        });
        break;
      case "dispose":
        e.data.ids.forEach(function (id) {
          delete self.repository[id];
        });
        break;
      case "render":
        self.start_rendering(e.data.tape, e.data.callbackId);
        break;
    }
  };

  self.to_buffer = function (array) {
    return array.buffer;
  };

  self.start_rendering = function (tape, callback_id) {
    var destination = self.alloc_data(tape);
    var buffers = destination.map(self.to_buffer);

    self.render(tape, destination);

    self.postMessage({ callbackId: callback_id, buffers: buffers }, buffers);
  };

  self.alloc_data = function (tape) {
    var data = new Array(tape.numberOfChannels);
    var length = Math.floor(tape.duration * tape.sampleRate);

    for (var i = 0; i < data.length; i++) {
      data[i] = new Float32Array(length);
    }

    return data;
  };

  self.render = function (tape, destination) {
    for (var ch = 0; ch < tape.tracks.length; ch++) {
      self._render(ch, tape.tracks[ch], destination, tape.sampleRate);
    }
  };

  self._render = function (ch, fragments, destination, samplerate) {
    var use_pan = fragments.some(function (fragment) {
      return fragment.pan !== 0;
    });

    var pos = 0;

    for (var i = 0, imax = fragments.length; i < imax; i++) {
      var fragment = fragments[i];
      var source = self.repository[fragment.data];
      var duration = (fragment.endTime - fragment.beginTime) / fragment.pitch;
      var length = Math.floor(duration * samplerate);

      if (!source) {
        pos += length;
        continue;
      }

      var begin = Math.floor(fragment.beginTime * samplerate);
      var end = Math.floor(fragment.endTime * samplerate);
      var src_ch = source.length;
      var dst_ch = destination.length;
      var src_sub = self.subarray(source, begin, end);
      var dst_sub = self.subarray(destination, pos, pos + length);
      var pitch = fragment.pitch;

      /** TODO: implements
      if (fragment.stretch) {
        src_sub = self.stretch(src_sub, length);
        pitch = 1;
      }
      **/

      var can_simple_copy = ch === 0 && pitch === 1 && !use_pan && fragment.gain === 1 && !fragment.reverse && src_ch <= dst_ch && src_sub[0].length === dst_sub[0].length;

      if (can_simple_copy) {
        self.mix["" + src_sub.length + "->" + dst_sub.length](src_sub, dst_sub);
      } else {
        self.process(src_sub, dst_sub, {
          gain: fragment.gain,
          pan: use_pan ? Math.max(-1, Math.min(fragment.pan, +1)) : null,
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
    var src_ch = src.length;
    var dst_ch = dst.length;
    var mix_ch;
    var src_length = src[0].length;
    var dst_length = dst[0].length;
    var factor = (src_length - 1) / (dst_length - 1);
    var index, step, ch, mix, l, r;

    if (opts.pan !== null) {
      l = Math.cos((opts.pan + 1) * 0.25 * Math.PI);
      r = Math.sin((opts.pan + 1) * 0.25 * Math.PI);
      mix_ch = Math.max(src_ch, 2);
    } else {
      mix_ch = src_ch;
    }
    mix = self.mix1["" + mix_ch + "->" + dst_ch] || self.mix1.nop;

    if (opts.reverse) {
      index = dst[0].length - 1;
      step = -1;
    } else {
      index = 0;
      step = +1;
    }

    for (var i = 0; i < dst_length; i++, index += step) {
      var x0 = i * factor;
      var i0 = x0 | 0;
      var i1 = Math.min(i0 + 1, src_length - 1);

      for (ch = 0; ch < src_ch; ch++) {
        samples[ch] = src[ch][i0] + Math.abs(x0 - i0) * (src[ch][i1] - src[ch][i0]);
      }

      if (opts.pan !== null) {
        samples = self.pan[src_ch](samples, l, r);
      }

      var values = mix(samples);

      for (ch = 0; ch < dst_ch; ch++) {
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
}, self);

var __callbacks = [];
var __data = 1; // data 0 is reserved for silence

worker.onmessage = function (e) {
  var audioData = e.data.buffers.map(function (buffer) {
    return new Float32Array(buffer);
  });
  __callbacks[e.data.callbackId](audioData);
  __callbacks[e.data.callbackId] = null;
};

module.exports = {
  transfer: function (audioData) {
    var data = __data++;
    var buffers = audioData.map(function (array) {
      return array.buffer;
    });
    worker.postMessage({ type: "transfer", data: data, buffers: buffers }, buffers);
    return data;
  },
  dispose: function (ids) {
    worker.postMessage({ type: "dispose", ids: ids });
  },
  render: function (tape) {
    var callbackId = __callbacks.length;

    worker.postMessage({ type: "render", tape: tape, callbackId: callbackId });

    return new Promise(function (resolve) {
      __callbacks[callbackId] = resolve;
    });
  },
  util: self
};
},{"./inline-worker":5}],7:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _tape = require("./tape");

var Tape = _interopRequire(_tape);

var TapeConstructor = _tape.TapeConstructor;

var config = _interopRequire(require("./config"));

var getInstrumentFrom = function (instruments, ch, tape) {
  if (!instruments.hasOwnProperty(ch)) {
    return null;
  }

  var instrument = instruments[ch];
  if (typeof instrument === "function") {
    instrument = instrument(ch, tape);
  }

  return instrument instanceof Tape ? instrument : null;
};

var Sequence = (function () {
  function Sequence(arg0, durationPerStep) {
    _classCallCheck(this, Sequence);

    if (typeof arg0 === "string") {
      this.pattern = arg0;
      this.instruments = null;
    } else {
      this.pattern = "";
      this.instruments = arg0 || {};
    }
    this.durationPerStep = durationPerStep;
  }

  _prototypeProperties(Sequence, null, {
    apply: {
      value: function apply(arg1) {
        var pattern = null;
        var instruments = null;

        if (this.instruments === null) {
          pattern = this.pattern;
          instruments = arg1 || {};
        } else {
          pattern = String(arg1);
          instruments = this.instruments;
        }

        var durationPerStep = Math.max(0, +this.durationPerStep || 0);

        if (!(pattern.length && durationPerStep && instruments && typeof instruments === "object")) {
          return Tape.silence(0);
        }

        return pattern.split("").reduce(function (tape, ch) {
          var instrument = getInstrumentFrom(instruments, ch, tape);

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

module.exports = Sequence;
},{"./config":2,"./tape":8}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Track = _interopRequire(require("./track"));

var config = _interopRequire(require("./config"));

var util = {};

var Tape = (function () {
  function Tape() {
    for (var _len = arguments.length, _args = Array(_len), _key = 0; _key < _len; _key++) {
      _args[_key] = arguments[_key];
    }

    _classCallCheck(this, Tape);

    var args = _args.slice();
    if (config.create) {
      return config.create.apply(null, args);
    }
    return new TapeConstructor(args[0], args[1]);
  }

  _prototypeProperties(Tape, {
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
        for (var _len = arguments.length, _tapes = Array(_len), _key = 0; _key < _len; _key++) {
          _tapes[_key] = arguments[_key];
        }

        var tapes = Array.prototype.concat.apply([], _tapes);

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
        for (var _len = arguments.length, _tapes = Array(_len), _key = 0; _key < _len; _key++) {
          _tapes[_key] = arguments[_key];
        }

        var tapes = Array.prototype.concat.apply([], _tapes);

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

exports["default"] = Tape;

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
Object.defineProperty(exports, "__esModule", {
  value: true
});

/* subclass responsibility */
},{"./config":2,"./track":9}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Fragment = _interopRequire(require("./fragment"));

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

module.exports = Track;
},{"./fragment":3}],10:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var TapeConstructor = require("./tape").TapeConstructor;

var Fragment = _interopRequire(require("./fragment"));

var config = _interopRequire(require("./config"));

var renderer = _interopRequire(require("./renderer"));

var WebAudioTape = (function (TapeConstructor) {
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
        renderer.dispose([this._data]);
      },
      writable: true,
      configurable: true
    }
  });

  return WebAudioTape;
})(TapeConstructor);

exports["default"] = WebAudioTape;
var use = exports.use = function () {
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
},{"./config":2,"./fragment":3,"./renderer":6,"./tape":8}]},{},[1])(1)
});