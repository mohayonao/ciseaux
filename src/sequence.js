import Tape from "./tape";
import config from "./config";

function getInstrumentFromRegExp(instruments, ch) {
  let keys = Object.keys(instruments);

  for (let i = 0; i < keys.length; i++) {
    let matches = /^\/(.+)?\/(\w*)$/.exec(keys[i]);
    if (matches && new RegExp(matches[1], matches[2]).test(ch)) {
      return instruments[keys[i]];
    }
  }

  return null;
}

function getInstrumentFrom(instruments, ch, index, tape) {
  let instrument = null;

  if (instruments.hasOwnProperty(ch)) {
    instrument = instruments[ch];
  } else {
    instrument = getInstrumentFromRegExp(instruments, ch);
  }

  if (typeof instrument === "function") {
    instrument = instrument(ch, index, tape);
  }

  return (instrument instanceof Tape) ? instrument : null;
}

export default class Sequence {
  constructor(...args) {
    this.pattern = this.instruments = this.durationPerStep = null;
    args.forEach((arg) => {
      if (typeof arg === "string") {
        this.pattern = arg;
      } else if (typeof arg === "number" || Array.isArray(arg)) {
        this.durationPerStep = arg;
      } else if (typeof arg === "object") {
        this.instruments = arg;
      }
    });
  }

  apply(...args) {
    let { pattern, instruments, durationPerStep } = this;

    args.forEach((arg) => {
      if (typeof arg === "string") {
        pattern = arg;
      } else if (typeof arg === "number" || Array.isArray(arg)) {
        durationPerStep = arg;
      } else if (typeof arg === "object") {
        instruments = arg;
      }
    });

    if (pattern === null || instruments === null || durationPerStep === null) {
      return Tape.silence(0);
    }

    let durationPerStepList = Array.isArray(durationPerStep) ? durationPerStep : [ durationPerStep ];

    return pattern.split("").reduce((tape, ch, index) => {
      let instrument = getInstrumentFrom(instruments, ch, index, tape);
      let durationPerStep = durationPerStepList[index % durationPerStepList.length];

      durationPerStep = Math.max(0, +durationPerStep || 0);

      if (instrument !== null) {
        if (instrument.duration < durationPerStep) {
          tape = tape.concat(instrument, Tape.silence(durationPerStep - instrument.duration));
        } else {
          tape = tape.concat(instrument.slice(0, durationPerStep));
        }
      } else {
        tape = tape.concat(Tape.silence(durationPerStep));
      }

      return tape;
    }, new Tape(1, config.sampleRate));
  }
}
