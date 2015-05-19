import Tape from "./tape";
import Fragment from "./fragment";
import config from "./config";
import renderer from "./renderer";

let _audioContext = null;

export default class WebAudioTape extends Tape {
  constructor(audioBuffer) {
    super(audioBuffer.numberOfChannels, audioBuffer.sampleRate);

    let audioData = new Array(audioBuffer.numberOfChannels);
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = audioBuffer.getChannelData(i);
    }

    this._data = renderer.transfer(audioData);

    this.tracks[0].addFragment(new Fragment(this._data, 0, audioBuffer.duration));

    config.sampleRate = audioBuffer.sampleRate;
  }

  dispose() {
    renderer.dispose(this._data);
  }
}

export let use = function() {

  function from(src, audioContext = _audioContext) {
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
      return new Promise((resolve, reject) => {
        _audioContext.decodeAudioData(src, (audioBuffer) => {
          resolve(audioBuffer);
        }, reject);
      }).then(from);
    }
    if (typeof src === "string") {
      return new Promise((resolve, reject) => {
        let xhr = new global.XMLHttpRequest();
        xhr.open("GET", src);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
          /* istanbul ignore else */
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
      }).then(from);
    }
    return Promise.reject(new Error("Invalid arguments"));
  }

  function render(tape, audioContext, numberOfChannels = 0) {
    numberOfChannels = Math.max(numberOfChannels, tape.numberOfChannels);

    tape.numberOfChannels = numberOfChannels;

    return renderer.render(tape).then((audioData) => {
      let length = Math.floor(tape.duration * tape.sampleRate);
      let audioBuffer = audioContext.createBuffer(numberOfChannels, length, tape.sampleRate);

      if (audioBuffer.copyToChannel) {
        for (let i = 0; i < numberOfChannels; i++) {
          audioBuffer.copyToChannel(audioData[i], i);
        }
      } else {
        for (let i = 0; i < numberOfChannels; i++) {
          audioBuffer.getChannelData(i).set(audioData[i]);
        }
      }

      return audioBuffer;
    });
  }

  config.from = from;
  config.render = render;
};
