const OUroborosWorker = require("ouroboros-worker");
const render = require("./render-worker");

let worker = new OUroborosWorker(render.self);
let __callbacks = [];
let __data = 1; // data 0 is reserved for silence

worker.onmessage = (e) => {
  let channleData = e.data.buffers.map(buffer => new Float32Array(buffer));

  __callbacks[e.data.callbackId](channleData);
  __callbacks[e.data.callbackId] = null;
};

module.exports = {
  transfer(audiodata) {
    let data = __data++;
    let buffers = audiodata.channelData.map(array => array.buffer);

    worker.postMessage({ type: "transfer", data, buffers }, buffers);

    return data;
  },
  dispose(data) {
    worker.postMessage({ type: "dispose", data });
  },
  render(tape) {
    let callbackId = __callbacks.length;

    worker.postMessage({ type: "render", tape, callbackId });

    return new Promise((resolve) => {
      __callbacks[callbackId] = resolve;
    });
  },
  util: render.util,
};
