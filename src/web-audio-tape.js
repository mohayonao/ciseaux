import AudioData from "audiodata";
import Tape from "./tape";
import config from "./config";
import renderer from "./renderer";

let _audioContext = null;

function load(url) {
  return new Promise((resolve, reject) => {
    let xhr = new global.XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error(xhr.statusText));
      }
    };
    xhr.onerror = () => {
      reject(new Error(xhr.statusText));
    };
    xhr.send();
  });
}

function decode(buffer) {
  return new Promise((resolve, reject) => {
    _audioContext.decodeAudioData(buffer, (audioBuffer) => {
      resolve(toAudioData(audioBuffer));
    }, reject);
  });
}

function toAudioData(audioBuffer) {
  return AudioData.fromAudioBuffer(audioBuffer);
}

function from(src, audioContext = _audioContext) {
  if (src instanceof Tape) {
    return Promise.resolve(src.clone());
  }
  if (AudioData.isAudioData(src)) {
    return Promise.resolve(new Tape(src));
  }
  if (src instanceof global.AudioBuffer) {
    return Promise.resolve(new Tape(toAudioData(src)));
  }
  if (_audioContext === null) {
    _audioContext = audioContext || new global.AudioContext();
  }
  if (src instanceof ArrayBuffer) {
    return decode(src).then(from);
  }
  if (typeof src === "string") {
    return load(src).then(from);
  }
  return Promise.reject(new Error("Invalid arguments"));
}

function render(tape, audioContext = _audioContext, numberOfChannels = 0) {
  numberOfChannels = Math.max(numberOfChannels, tape.numberOfChannels);

  tape.numberOfChannels = numberOfChannels;

  return renderer.render(tape).then((channelData) => {
    return AudioData.toAudioBuffer({
      sampleRate: tape.sampleRate,
      channelData: channelData,
    }, audioContext);
  });
}

export let use = function() {
  config.from = from;
  config.render = render;
};
