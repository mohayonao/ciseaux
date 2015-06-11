import fs from "fs";
import WavDecoder from "wav-decoder";
import WavEncoder from "wav-encoder";
import AudioData from "audiodata";
import Tape from "./tape";
import config from "./config";
import renderer from "./renderer";

function load(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, buffer) => {
      if (err) {
        reject(err);
      }
      resolve(buffer);
    });
  });
}

function decode(buffer) {
  return WavDecoder.decode(buffer);
}

function from(src) {
  if (src instanceof Tape) {
    return Promise.resolve(src.clone());
  }
  if (AudioData.isAudioData(src)) {
    return Promise.resolve(new Tape(src));
  }
  if (src instanceof Buffer) {
    return decode(src).then(from);
  }
  if (typeof src === "string") {
    return load(src).then(from);
  }
  return Promise.reject(new Error("Invalid arguments"));
}

function render(tape, numberOfChannels = 0) {
  numberOfChannels = Math.max(numberOfChannels, tape.numberOfChannels);

  tape.numberOfChannels = numberOfChannels;

  return renderer.render(tape).then((channelData) => {
    return WavEncoder.encode({
      sampleRate: tape.sampleRate,
      channelData: channelData,
    });
  });
}

export default function() {
  config.load = load;
  config.decode = decode;
  config.from = from;
  config.render = render;
}
