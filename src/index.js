const Sequence = require("./sequence");
const Tape = require("./tape");
const config = require("./config");

let AudioContext = global.AudioContext || global.webkitAudioContext;

module.exports = {
  get context() {
    return config.context;
  },
  set context(audioContext) {
    if (AudioContext && audioContext instanceof AudioContext) {
      config.context = audioContext;
    }
  },
  load: (filepath) => {
    return config.load(filepath);
  },
  decode: (buffer) => {
    return config.decode(buffer);
  },

  Sequence,
  Tape,

  from: (...args) => {
    if (config.from) {
      return config.from(...args);
    }
    return Promise.resolve(new Tape(...args));
  },
  silence: Tape.silence,
  concat: Tape.concat,
  mix: Tape.mix,
};
