export default class Fragment {
  constructor(data, beginTime, endTime) {
    this.data = data;
    this.beginTime = beginTime;
    this.endTime = endTime;
    this.gain = 1;
    this.pan = 0;
    this.reverse = false;
    this.pitch = 1;
    this.stretch = false;
  }

  get duration() {
    return (this.endTime - this.beginTime) / this.pitch;
  }

  slice(beginTime, duration) {
    beginTime = this.beginTime + beginTime * this.pitch;

    let endTime = beginTime + duration * this.pitch;

    beginTime = Math.max(this.beginTime, beginTime);
    endTime = Math.max(beginTime, Math.min(endTime, this.endTime));

    return this.clone({ beginTime, endTime });
  }

  clone(attributes) {
    let newInstance = new Fragment(this.data, this.beginTime, this.endTime);

    newInstance.gain = this.gain;
    newInstance.pan = this.pan;
    newInstance.reverse = this.reverse;
    newInstance.pitch = this.pitch;
    newInstance.stretch = this.stretch;

    if (attributes) {
      Object.keys(attributes).forEach((key) => {
        newInstance[key] = attributes[key];
      });
    }

    return newInstance;
  }

  toJSON() {
    return {
      data: this.data,
      beginTime: this.beginTime,
      endTime: this.endTime,
      gain: this.gain,
      pan: this.pan,
      reverse: this.reverse,
      pitch: this.pitch,
      stretch: this.stretch,
    };
  }
}
