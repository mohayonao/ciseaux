"use strict";

import {TapeConstructor} from "./tape";
import Fragment from "./fragment";
import config from "./config";
import renderer from "./renderer";

class WebAudioTape extends TapeConstructor {
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
    renderer.dispose([ this._data ]);
  }
}

export default WebAudioTape;

export var use = () => {
  config.create = (audioBuffer) => {
    return new WebAudioTape(audioBuffer);
  };
  config.render = (tape, audioContext, numberOfChannels = 0) => {
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
  };
};
