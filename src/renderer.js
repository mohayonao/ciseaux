import InlineWorker from "./inline-worker";
import render from "./render-worker";

let worker = new InlineWorker(render, render.self);

let __callbacks = [];
let __data = 1; // data 0 is reserved for silence

worker.onmessage = function(e) {
  let audioData = e.data.buffers.map(buffer => new Float32Array(buffer));
  __callbacks[e.data.callbackId](audioData);
  __callbacks[e.data.callbackId] = null;
};

export default {
  transfer(audioData) {
    let data = __data++;
    let buffers = audioData.map(array => array.buffer);
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
