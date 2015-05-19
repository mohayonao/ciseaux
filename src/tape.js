import Track from "./track";
import config from "./config";

let util = {};

export default class Tape {
  static from(...args) {
    if (config.from) {
      return config.from.apply(null, args);
    }
    return Promise.resolve(new Tape(args[0], args[1]));
  }

  static silence(duration) {
    return new Tape(1, config.sampleRate).silence(duration);
  }

  static concat(...args) {
    return Tape.prototype.concat.apply(new Tape(1, config.sampleRate), args);
  }

  static mix(...args) {
    let newInstance = Tape.prototype.mix.apply(new Tape(1, config.sampleRate), args);

    if (1 < newInstance.tracks.length) {
      newInstance.tracks.shift(); // remove first empty track
    }

    return newInstance;
  }

  constructor(numberOfChannels, sampleRate) {
    this.tracks = [ new Track() ];
    this._numberOfChannels = Math.max(1, numberOfChannels|0);
    this._sampleRate = Math.max(0, sampleRate|0) || config.sampleRate;
  }

  get sampleRate() {
    return this._sampleRate || config.sampleRate;
  }

  get length() {
    return Math.floor(this.duration * this.sampleRate);
  }

  get duration() {
    return this.tracks[0].duration;
  }

  get numberOfChannels() {
    return this._numberOfChannels;
  }

  get numberOfTracks() {
    return this.tracks.length;
  }

  gain(gain = 1) {
    gain = util.toNumber(gain);

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.gain(gain));

    return newInstance;
  }

  pan(pan = 0) {
    pan = util.toNumber(pan);

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.pan(pan));

    return newInstance;
  }

  reverse() {
    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.reverse());

    return newInstance;
  }

  pitch(rate = 1) {
    rate = Math.max(0, util.toNumber(rate));

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.pitch(rate));

    return newInstance;
  }

  stretch(rate = 1) {
    rate = Math.max(0, util.toNumber(rate));

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.stretch(rate));

    return newInstance;
  }

  clone() {
    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.clone());

    return newInstance;
  }

  silence(duration = 0) {
    duration = Math.max(0, util.toNumber(duration));

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    if (0 < duration) {
      newInstance.tracks = this.tracks.map(() => Track.silence(duration));
    }

    return newInstance;
  }

  concat(...tapes) {
    tapes = Array.prototype.concat.apply([], tapes);

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.clone());

    tapes.forEach((tape) => {
      if (!(tape instanceof Tape && 0 < tape.duration)) {
        return;
      }
      if (newInstance._numberOfChannels < tape._numberOfChannels) {
        newInstance._numberOfChannels = tape._numberOfChannels;
      }
      if (newInstance.numberOfTracks < tape.numberOfTracks) {
        newInstance = util.adjustNumberOfTracks(newInstance, tape.numberOfTracks);
      }
      if (tape.numberOfTracks < newInstance.numberOfTracks) {
        tape = util.adjustNumberOfTracks(tape, newInstance.numberOfTracks);
      }
      tape.tracks.forEach((track, index) => {
        newInstance.tracks[index].append(track);
      });
    });

    return newInstance;
  }

  slice(beginTime = 0, duration = Infinity) {
    beginTime = util.toNumber(beginTime);
    duration = Math.max(0, util.toNumber(duration));

    if (beginTime < 0) {
      beginTime += this.duration;
    }
    beginTime = Math.max(0, beginTime);

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.slice(beginTime, duration));

    return newInstance;
  }

  loop(n = 2) {
    n = Math.max(0, n|0);

    let tapes = new Array(n);

    for (let i = 0; i < tapes.length; i++) {
      tapes[i] = this;
    }

    return new Tape(this.numberOfChannels, this.sampleRate).concat(tapes);
  }

  fill(duration = this.duration) {
    duration = Math.max(0, util.toNumber(duration));

    let this$duration = this.duration;

    if (this$duration === 0) {
      return this.silence(duration);
    }

    let loopCount = Math.floor(duration / this$duration);
    let remain = duration % this$duration;

    return this.loop(loopCount).concat(this.slice(0, remain));
  }

  replace(beginTime = 0, duration = 0, tape = null) {
    beginTime = util.toNumber(beginTime);
    duration = Math.max(0, util.toNumber(duration));

    if (beginTime < 0) {
      beginTime += this.duration;
    }
    beginTime = Math.max(0, beginTime);

    if (typeof tape === "function") {
      tape = tape(this.slice(beginTime, duration));
    }

    return this.slice(0, beginTime).concat(tape, this.slice(beginTime + duration));
  }

  split(n = 2) {
    n = Math.max(0, n|0);

    let tapes = new Array(n);
    let duration = this.duration / n;

    for (let i = 0; i < n; i++) {
      tapes[i] = this.slice(duration * i, duration);
    }

    return tapes;
  }

  mix(...tapes) {
    tapes = Array.prototype.concat.apply([], tapes);

    let method;
    if (typeof tapes[tapes.length - 1] === "string") {
      method = tapes.pop();
    }

    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.clone());

    tapes.forEach((tape) => {
      if (!(tape instanceof Tape && 0 < tape.duration)) {
        return;
      }
      if (newInstance._numberOfChannels < tape._numberOfChannels) {
        newInstance._numberOfChannels = tape._numberOfChannels;
      }
      if (newInstance.duration < tape.duration) {
        newInstance = util.adjustDuration(newInstance, tape.duration, method);
      }
      if (tape.duration < newInstance.duration) {
        tape = util.adjustDuration(tape, newInstance.duration, method);
      }
      newInstance.tracks = newInstance.tracks.concat(tape.tracks);
    });

    return newInstance;
  }

  render(...args) {
    if (config.render) {
      return config.render.apply(null, [ this.toJSON() ].concat(args));
    }
    return new Promise((resolve, reject) => {
      reject(new Error("not implemented"));
    });
  }

  dispose() {
    /* subclass responsibility */
  }

  toJSON() {
    let tracks = this.tracks.map(track => track.toJSON());
    let duration = this.duration;
    let sampleRate = this.sampleRate;
    let numberOfChannels = this.numberOfChannels;

    let usePan = tracks.some((fragments) => {
      return fragments.some((fragment) => {
        return fragment.pan !== 0;
      });
    });
    if (usePan) {
      numberOfChannels = Math.max(2, numberOfChannels);
    }

    return { tracks, duration, sampleRate, numberOfChannels };
  }
}

util.toNumber = function(num) {
  return +num || 0;
};

util.adjustNumberOfTracks = function(tape, numberOfTracks) {
  let newInstance = new Tape(tape.numberOfChannels, tape.sampleRate);

  newInstance.tracks = tape.tracks.map(track => track.clone());

  let balance = numberOfTracks - newInstance.numberOfTracks;
  let duration = newInstance.duration;

  for (let i = 0; i < balance; i++) {
    newInstance.tracks.push(Track.silence(duration));
  }

  return newInstance;
};

util.adjustDuration = function(tape, duration, method) {
  if (tape.duration === 0) {
    return tape.silence(duration);
  }
  switch (method) {
  case "fill":
    return tape.fill(duration);
  case "pitch":
    return tape.pitch(tape.duration / duration);
  case "stretch":
    return tape.stretch(tape.duration / duration);
  default: /* silence */
    return tape.concat(tape.silence(duration - tape.duration));
  }
};
