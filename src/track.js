import Fragment from "./fragment";

export default class Track {
  static silence(duration) {
    return new Track([ new Fragment(0, 0, duration) ], duration);
  }

  constructor(fragments = [], duration = 0) {
    this.fragments = fragments;
    if (fragments.length !== 0 && duration === 0) {
      duration = fragments.reduce((duration, fragment) => {
        return duration + fragment.duration;
      }, 0);
    }
    this.duration = duration;
  }

  gain(gain) {
    return new Track(this.fragments.map((fragment) => {
      return fragment.clone({ gain: fragment.gain * gain });
    }), this.duration);
  }

  pan(pan) {
    return new Track(this.fragments.map((fragment) => {
      return fragment.clone({ pan: fragment.pan + pan });
    }), this.duration);
  }

  reverse() {
    return new Track(this.fragments.map((fragment) => {
      return fragment.clone({ reverse: !fragment.reverse });
    }).reverse(), this.duration);
  }

  pitch(rate) {
    return new Track(this.fragments.map((fragment) => {
      return fragment.clone({ pitch: fragment.pitch * rate, stretch: false });
    }), 0); // need to recalculate the duration
  }

  stretch(rate) {
    return new Track(this.fragments.map((fragment) => {
      return fragment.clone({ pitch: fragment.pitch * rate, stretch: true });
    }), 0); // need to recalculate the duration
  }

  clone() {
    return new Track(this.fragments.slice(), this.duration);
  }

  slice(beginTime, duration) {
    let newInstance = new Track();
    let remainingStart = Math.max(0, beginTime);
    let remainingDuration = duration;

    for (let i = 0; 0 < remainingDuration && i < this.fragments.length; i++) {
      if (this.fragments[i].duration <= remainingStart) {
        remainingStart -= this.fragments[i].duration;
      } else {
        let fragment = this.fragments[i].slice(remainingStart, remainingDuration);

        newInstance.addFragment(fragment);

        remainingStart = 0;
        remainingDuration -= fragment.duration;
      }
    }

    return newInstance;
  }

  toJSON() {
    return this.fragments.map(fragment => fragment.toJSON());
  }

  addFragment(fragment) {
    if (fragment instanceof Fragment && 0 < fragment.duration) {
      this.fragments.push(fragment);
      this.duration += fragment.duration;
    }
    return this;
  }

  append(track) {
    if (track instanceof Track) {
      track.fragments.forEach((fragment) => {
        this.addFragment(fragment);
      });
    }
    return this;
  }
}
