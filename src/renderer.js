"use strict";

import InlineWorker from "./inline-worker";

let self = {};
let worker = new InlineWorker(function() {
  self.repository = {};

  self.onmessage = function(e) {
    switch (e.data.type) {
    case "transfer":
      self.repository[e.data.data] = e.data.buffers.map(function(buffer) {
        return new Float32Array(buffer);
      });
      break;
    case "dispose":
      e.data.ids.forEach((id) => {
        delete self.repository[id];
      });
      break;
    case "render":
      self.start_rendering(e.data.tape, e.data.callbackId);
      break;
    }
  };

  self.to_buffer = function(array) {
    return array.buffer;
  };

  self.start_rendering = function(tape, callback_id) {
    var destination = self.alloc_data(tape);
    var buffers = destination.map(self.to_buffer);

    self.render(tape, destination);

    self.postMessage({ callbackId: callback_id, buffers: buffers }, buffers);
  };

  self.alloc_data = function(tape) {
    var data = new Array(tape.numberOfChannels);
    var length = Math.floor(tape.duration * tape.sampleRate);

    for (var i = 0; i < data.length; i++) {
      data[i] = new Float32Array(length);
    }

    return data;
  };

  self.render = function(tape, destination) {
    for (var ch = 0; ch < tape.tracks.length; ch++) {
      self._render(ch, tape.tracks[ch], destination, tape.sampleRate);
    }
  };

  self._render = function(ch, fragments, destination, samplerate) {
    var use_pan = fragments.some(function(fragment) {
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

      var can_simple_copy = (ch === 0) && pitch === 1 && !use_pan && fragment.gain === 1 &&
        !fragment.reverse && src_ch <= dst_ch && src_sub[0].length === dst_sub[0].length;

      if (can_simple_copy) {
        self.mix[`${src_sub.length}->${dst_sub.length}`](src_sub, dst_sub);
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

  self.subarray = function(array, begin, end) {
    var subarray = new Array(array.length);

    for (var i = 0; i < subarray.length; i++) {
      subarray[i] = array[i].subarray(begin, end);
    }

    return subarray;
  };

  self.process = function(src, dst, opts) {
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
    mix = self.mix1[`${mix_ch}->${dst_ch}`] || self.mix1.nop;

    if (opts.reverse) {
      index = dst[0].length - 1;
      step = -1;
    } else {
      index = 0;
      step = +1;
    }

    for (var i = 0; i < dst_length; i++, index += step) {
      var x0 = i * factor;
      var i0 = x0|0;
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
}, self);

let __callbacks = [];
let __data = 1; // data 0 is reserved for silence

worker.onmessage = (e) => {
  let audioData = e.data.buffers.map(buffer => new Float32Array(buffer));
  __callbacks[e.data.callbackId](audioData);
  __callbacks[e.data.callbackId] = null;
};

export default {
  transfer: (audioData) => {
    let data = __data++;
    let buffers = audioData.map(array => array.buffer);
    worker.postMessage({ type: "transfer", data, buffers }, buffers);
    return data;
  },
  dispose: (ids) => {
    worker.postMessage({ type: "dispose", ids });
  },
  render: (tape) => {
    let callbackId = __callbacks.length;

    worker.postMessage({ type: "render", tape, callbackId });

    return new Promise((resolve) => {
      __callbacks[callbackId] = resolve;
    });
  },
  util: self
};
