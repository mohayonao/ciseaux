"use strict";

import Tape from "./tape";
import Fragment from "./fragment";
import config from "./config";
import renderer from "./renderer";

class WebAudioTape extends Tape {
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

  render(audioContext, numberOfChannels = this.numberOfChannels) {
    let tape = this.toJSON();

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

  dispose() {
    renderer.dispose([ this._data ]);
  }
}

export default WebAudioTape;
