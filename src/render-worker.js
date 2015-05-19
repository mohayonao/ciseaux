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
