const fs = require("fs");
const WavDecoder = require("wav-decoder");
const WavEncoder = require("wav-encoder");
const AudioData = require("audiodata");
const Tape = require("./tape");
const config = require("./config");
const renderer = require("./renderer");

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

module.exports = function() {
  config.load = load;
  config.decode = decode;
  config.from = from;
  config.render = render;
};
