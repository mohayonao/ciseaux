import Sequence from "./sequence";
import Tape from "./tape";
import config from "./config";

let AudioContext = global.AudioContext || global.webkitAudioContext;

export default {
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

  from: Tape.from,
  silence: Tape.silenct,
  concat: Tape.concat,
  mix: Tape.mix,
};
