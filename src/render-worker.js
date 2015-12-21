let self = global.self || {};
let render = {};

self.repository = [];

self.onmessage = (e) => {
  switch (e.data.type) {
  case "transfer":
    self.repository[e.data.data] = e.data.buffers.map(buffer => new Float32Array(buffer));
    break;
  case "dispose":
    delete self.repository[e.data.data];
    break;
  case "render":
    self.startRendering(e.data.tape, e.data.callbackId);
    break;
  default:
    // do nothing
  }
};

self.startRendering = (tape, callbackId) => {
  let destination = self.allocData(tape);
  let buffers = destination.map(array => array.buffer);

  self.render(tape, destination);

  self.postMessage({ callbackId, buffers }, buffers);
};

self.allocData = (tape) => {
  let data = new Array(tape.numberOfChannels);
  let length = Math.floor(tape.duration * tape.sampleRate);

  for (let i = 0; i < data.length; i++) {
    data[i] = new Float32Array(length);
  }

  return data;
};

self.render = (tape, destination) => {
  for (let i = 0; i < tape.tracks.length; i++) {
    self.renderTrack(i, tape.tracks[i], destination, tape.sampleRate);
  }
};

self.renderTrack = (trackNum, fragments, destination, sampleRate) => {
  let usePan = fragments.some(fragment => fragment.pan !== 0);
  let pos = 0;

  for (let i = 0, imax = fragments.length; i < imax; i++) {
    let fragment = fragments[i];
    let source = self.repository[fragment.data];
    let duration = (fragment.endTime - fragment.beginTime) / fragment.pitch;
    let length = Math.floor(duration * sampleRate);

    if (!source) {
      pos += length;
      continue;
    }

    let begin = Math.floor(fragment.beginTime * sampleRate);
    let end = Math.floor(fragment.endTime * sampleRate);
    let srcCh = source.length;
    let dstCh = destination.length;
    let srcSub = self.subarray(source, begin, end);
    let dstSub = self.subarray(destination, pos, pos + length);
    let pitch = fragment.pitch;

    /** TODO: implements
    if (fragment.stretch) {
      srcSub = self.stretch(srcSub, length);
      pitch = 1;
    }
    **/

    let canSimpleCopy = trackNum === 0 && pitch === 1 && !usePan && fragment.gain === 1 && !fragment.reverse && srcCh <= dstCh && srcSub[0].length === dstSub[0].length;

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

self.subarray = (array, begin, end) => {
  let subarray = new Array(array.length);

  for (let i = 0; i < subarray.length; i++) {
    subarray[i] = array[i].subarray(begin, end);
  }

  return subarray;
};

self.process = (src, dst, opts) => {
  let samples = new Array(src.length);
  let srcCh = src.length;
  let dstCh = dst.length;
  let mixCh;
  let srcLength = src[0].length;
  let dstLength = dst[0].length;
  let factor = (srcLength - 1) / (dstLength - 1);
  let index, step, ch, mix, l, r;

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

  for (let i = 0; i < dstLength; i++, index += step) {
    let x0 = i * factor;
    let i0 = x0|0;
    let i1 = Math.min(i0 + 1, srcLength - 1);

    for (ch = 0; ch < srcCh; ch++) {
      samples[ch] = src[ch][i0] + Math.abs(x0 - i0) * (src[ch][i1] - src[ch][i0]);
    }

    if (opts.pan !== null) {
      samples = self.pan[srcCh](samples, l, r);
    }

    let values = mix(samples);

    for (ch = 0; ch < dstCh; ch++) {
      dst[ch][index] += (values[ch] || 0) * opts.gain;
    }
  }
};

self.pan = [];
self.pan[1] = (src, l, r) => {
  return [ src[0] * l, src[0] * r ];
};
self.pan[2] = (src, l, r) => {
  let x = (src[0] + src[1]) * 0.5;

  return [ x * l, x * r ];
};
self.pan[4] = (src, l, r) => {
  let x = (src[0] + src[1]) * 0.5;
  let y = (src[2] + src[3]) * 0.5;

  return [ x * l, x * r, y * l, y * r ];
};
self.pan[6] = (src, l, r) => {
  let x = (src[0] + src[1]) * 0.5;
  let y = (src[4] + src[5]) * 0.5;

  return [ x * l, x * r, src[2], src[3], y * l, y * r ];
};

self.mix = {};
self.mix["1->1"] = (src, dst) => {
  dst[0].set(src[0]);
};
self.mix["1->2"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[0]);
};
self.mix["1->4"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[0]);
};
self.mix["1->6"] = (src, dst) => {
  dst[2].set(src[0]);
};
self.mix["2->2"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[1]);
};
self.mix["2->4"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[1]);
};
self.mix["2->6"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[1]);
};
self.mix["4->4"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[1]);
  dst[2].set(src[2]);
  dst[3].set(src[3]);
};
self.mix["4->6"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[1]);
  dst[4].set(src[2]);
  dst[5].set(src[3]);
};
self.mix["6->6"] = (src, dst) => {
  dst[0].set(src[0]);
  dst[1].set(src[1]);
  dst[2].set(src[2]);
  dst[3].set(src[3]);
  dst[4].set(src[4]);
  dst[5].set(src[5]);
};

self.mix1 = {};
self.mix1.nop = (src) => {
  return src;
};
self.mix1["1->2"] = (src) => {
  return [ src[0], src[0] ];
};
self.mix1["1->4"] = (src) => {
  return [ src[0], src[0], 0, 0 ];
};
self.mix1["1->6"] = (src) => {
  return [ 0, 0, src[0], 0, 0, 0 ];
};
self.mix1["2->4"] = (src) => {
  return [ src[0], src[1], 0, 0 ];
};
self.mix1["2->6"] = (src) => {
  return [ src[0], src[1], 0, 0, 0, 0 ];
};
self.mix1["4->6"] = (src) => {
  return [ src[0], src[1], 0, 0, src[2], src[3] ];
};
self.mix1["2->1"] = (src) => {
  return [ 0.5 * (src[0] + src[1]) ];
};
self.mix1["4->1"] = (src) => {
  return [ 0.25 * (src[0] + src[1] + src[2] + src[3]) ];
};
self.mix1["6->1"] = (src) => {
  return [ 0.7071 * (src[0] + src[1]) + src[2] + 0.5 * (src[4] + src[5]) ];
};
self.mix1["4->2"] = (src) => {
  return [ 0.5 * (src[0] + src[2]), 0.5 * (src[1] + src[3]) ];
};
self.mix1["6->2"] = (src) => {
  return [ src[0] + 0.7071 * (src[2] + src[4]), src[1] + 0.7071 * (src[2] + src[5]) ];
};
self.mix1["6->4"] = (src) => {
  return [ src[0] + 0.7071 * src[2], src[1] + 0.7071 * src[2], src[4], src[5] ];
};

render.self = render.util = self;

module.exports = render;
