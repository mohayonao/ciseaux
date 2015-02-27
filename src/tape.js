"use strict";

import Track from "./track";
import config from "./config";

let util = {};

class Tape {
  static silence(duration) {
    return new Tape(1, config.sampleRate).silence(duration);
  }

  static concat(tapes) {
    return new Tape(1, config.sampleRate).concat(tapes);
  }

  static mix(tapes, method) {
    let newInstance = new Tape(1, config.sampleRate);

    if (Array.isArray(tapes)) {
      tapes.forEach((tape) => {
        newInstance = newInstance.mix(tape, method);
      });
      if (1 < newInstance.tracks.length) {
        newInstance.tracks.shift(); // remove first empty track
      }
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
    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.clone());

    Array.prototype.concat.apply([], tapes).forEach((tape) => {
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

    let this_duration = this.duration;
    let loopCount = Math.floor(duration / this_duration);
    let remain = duration % this_duration;

    return this.loop(loopCount).concat(this.slice(0, remain));
  }

  replace(beginTime = 0, duration = 0, tape = null) {
    beginTime = util.toNumber(beginTime);
    duration = Math.max(0, util.toNumber(duration));

    if (beginTime < 0) {
      beginTime += this.duration;
    }
    beginTime = Math.max(0, beginTime);

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

  mix(tape, method) {
    let newInstance = new Tape(this.numberOfChannels, this.sampleRate);

    newInstance.tracks = this.tracks.map(track => track.clone());

    if (tape instanceof Tape) {
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
    }

    return newInstance;
  }

  render(...args) {
    if (config.render[config.renderName]) {
      return config.render[config.renderName].apply(this, [ this.toJSON() ].concat(args));
    }
    return new Promise((resolve, reject) => {
      reject(new Error("not implemented"));
    });
  }

  dispose() {
    /* subclass responsibility */
  }

  toJSON() {
    return {
      tracks: this.tracks.map(track => track.toJSON()),
      duration: this.duration,
      sampleRate: this.sampleRate,
      numberOfChannels: this.numberOfChannels,
    };
  }
}

util.toNumber = num => +num || 0;

util.adjustNumberOfTracks = (tape, numberOfTracks) => {
  let newInstance = new Tape(tape.numberOfChannels, tape.sampleRate);

  newInstance.tracks = tape.tracks.map(track => track.clone());

  let balance = numberOfTracks - newInstance.numberOfTracks;
  let duration = newInstance.duration;

  for (let i = 0; i < balance; i++) {
    newInstance.tracks.push(Track.silence(duration));
  }

  return newInstance;
};

util.adjustDuration = (tape, duration, method) => {
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

export default Tape;
