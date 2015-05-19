import assert from "power-assert";
import Fragment from "../src/fragment";
import Track from "../src/track";

let pickEach = (list, keys) => {
  return list.map((data) => {
    let result = {};

    keys.forEach((key) => {
      result[key] = data[key];
    });

    return result;
  });
};

let createTrackFromList = (list) => {
  let track = new Track();
  track.fragments = list.map(data => new Fragment(data, 0, 10));
  return track;
};

describe("Track", () => {
  describe(".silence(duration: number): Track", () => {
    it("should return a slient Track", () => {
      let track = Track.silence(120);

      assert(track instanceof Track);
      assert(track.duration === 120);

      let result = pickEach(track.toJSON(), [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 0, beginTime: 0, endTime: 120 },
      ]);
    });
  });
  describe("constructor(fragments = [])", () => {
    it("should create a new Track", () => {
      let track = new Track();

      assert(track instanceof Track);
    });
  });
  describe("#duration: number [getter]", () => {
    it("should be calculated according to fragments", () => {
      let track = new Track();

      track.append(createTrackFromList([ 0, 1 ]));
      assert(track.duration === 20, "[ 0, 1 ]");

      track.append(createTrackFromList([ 2, 3 ]));
      assert(track.duration === 40, "[ 0, 1, 2, 3 ]");
    });
  });
  describe("#gain(gain: number): Track", () => {
    it("works", () => {
      let track = new Track();

      let result = track;
      result = result.append(createTrackFromList([ 0, 1 ])).gain(0.5);
      result = result.append(createTrackFromList([ 2, 3 ])).gain(0.5);
      result = result.append(createTrackFromList([ 4, 5 ])).gain(1.0);
      result = result.append(createTrackFromList([ 6, 7 ])).gain(0.5);
      result = result.append(createTrackFromList([ 8, 9 ])).gain(0.5);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "gain" ]);
      assert.deepEqual(result, [
        { data: 0, gain: 0.0625 },
        { data: 1, gain: 0.0625 },
        { data: 2, gain: 0.125  },
        { data: 3, gain: 0.125  },
        { data: 4, gain: 0.25   },
        { data: 5, gain: 0.25   },
        { data: 6, gain: 0.25   },
        { data: 7, gain: 0.25   },
        { data: 8, gain: 0.5    },
        { data: 9, gain: 0.5    },
      ]);

      result = pickEach(track.toJSON(), [ "data", "gain" ]);
      assert.deepEqual(result, [
        { data: 0, gain: 1 },
        { data: 1, gain: 1 },
      ]);
    });
  });
  describe("#pan(pan: number): Track", () => {
    it("works", () => {
      let track = new Track();

      let result = track;
      result = result.append(createTrackFromList([ 0, 1 ])).pan(0.25);
      result = result.append(createTrackFromList([ 2, 3 ])).pan(0.25);
      result = result.append(createTrackFromList([ 4, 5 ])).pan(0.0);
      result = result.append(createTrackFromList([ 6, 7 ])).pan(0.25);
      result = result.append(createTrackFromList([ 8, 9 ])).pan(0.25);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "pan" ]);
      assert.deepEqual(result, [
        { data: 0, pan: 1.00 },
        { data: 1, pan: 1.00 },
        { data: 2, pan: 0.75 },
        { data: 3, pan: 0.75 },
        { data: 4, pan: 0.50 },
        { data: 5, pan: 0.50 },
        { data: 6, pan: 0.50 },
        { data: 7, pan: 0.50 },
        { data: 8, pan: 0.25 },
        { data: 9, pan: 0.25 },
      ]);

      result = pickEach(track.toJSON(), [ "data", "pan" ]);
      assert.deepEqual(result, [
        { data: 0, pan: 0 },
        { data: 1, pan: 0 },
      ]);
    });
  });
  describe("#reverse(): Track", () => {
    it("works", () => {
      let track = new Track();

      let result = track;
      result = result.append(createTrackFromList([ 0, 1 ])).reverse(); // 1 0
      result = result.append(createTrackFromList([ 2, 3 ])).reverse(); // 3 2 0 1
      result = result.append(createTrackFromList([ 4, 5 ])).reverse(); // 5 4 1 0 2 3
      result = result.append(createTrackFromList([ 6, 7 ])).reverse(); // 7 6 3 2 0 1 4 5
      result = result.append(createTrackFromList([ 8, 9 ])).reverse(); // 9 8 5 4 1 0 2 3 6 7

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "reverse" ]);
      assert.deepEqual(result, [
        { data: 9, reverse: true  },
        { data: 8, reverse: true  },
        { data: 5, reverse: true  },
        { data: 4, reverse: true  },
        { data: 1, reverse: true  },
        { data: 0, reverse: true  },
        { data: 2, reverse: false },
        { data: 3, reverse: false },
        { data: 6, reverse: false },
        { data: 7, reverse: false },
      ]);

      result = pickEach(track.toJSON(), [ "data", "reverse" ]);
      assert.deepEqual(result, [
        { data: 0, reverse: false },
        { data: 1, reverse: false },
      ]);
    });
  });
  describe("#pitch(rate: number): Track", () => {
    it("works", () => {
      let track = new Track();

      let result = track;
      result = result.append(createTrackFromList([ 0, 1 ])).pitch(0.25);
      result = result.append(createTrackFromList([ 2, 3 ])).pitch(0.5);
      result = result.append(createTrackFromList([ 4, 5 ])).stretch(1.0);
      result = result.append(createTrackFromList([ 6, 7 ])).pitch(2.0);
      result = result.append(createTrackFromList([ 8, 9 ])).pitch(3.0);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "pitch", "stretch" ]);
      assert.deepEqual(result, [
        { data: 0, pitch: 0.75, stretch: false },
        { data: 1, pitch: 0.75, stretch: false },
        { data: 2, pitch: 3.00, stretch: false },
        { data: 3, pitch: 3.00, stretch: false },
        { data: 4, pitch: 6.00, stretch: false },
        { data: 5, pitch: 6.00, stretch: false },
        { data: 6, pitch: 6.00, stretch: false },
        { data: 7, pitch: 6.00, stretch: false },
        { data: 8, pitch: 3.00, stretch: false },
        { data: 9, pitch: 3.00, stretch: false },
      ]);

      result = pickEach(track.toJSON(), [ "data", "pitch", "stretch" ]);
      assert.deepEqual(result, [
        { data: 0, pitch: 1.00, stretch: false },
        { data: 1, pitch: 1.00, stretch: false },
      ]);
    });
  });
  describe("#stretch(rate: number): Track", () => {
    it("works", () => {
      let track = new Track();

      let result = track;
      result = result.append(createTrackFromList([ 0, 1 ])).stretch(0.25);
      result = result.append(createTrackFromList([ 2, 3 ])).stretch(0.5);
      result = result.append(createTrackFromList([ 4, 5 ])).pitch(1.0);
      result = result.append(createTrackFromList([ 6, 7 ])).stretch(2.0);
      result = result.append(createTrackFromList([ 8, 9 ])).stretch(3.0);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "pitch", "stretch" ]);
      assert.deepEqual(result, [
        { data: 0, pitch: 0.75, stretch: true },
        { data: 1, pitch: 0.75, stretch: true },
        { data: 2, pitch: 3.00, stretch: true },
        { data: 3, pitch: 3.00, stretch: true },
        { data: 4, pitch: 6.00, stretch: true },
        { data: 5, pitch: 6.00, stretch: true },
        { data: 6, pitch: 6.00, stretch: true },
        { data: 7, pitch: 6.00, stretch: true },
        { data: 8, pitch: 3.00, stretch: true },
        { data: 9, pitch: 3.00, stretch: true },
      ]);

      result = pickEach(track.toJSON(), [ "data", "pitch", "stretch" ]);
      assert.deepEqual(result, [
        { data: 0, pitch: 1.00, stretch: false },
        { data: 1, pitch: 1.00, stretch: false },
      ]);
    });
  });
  describe("#clone(): Track", () => {
    it("should return a cloned Track", () => {
      let track = createTrackFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

      let result = track.clone();

      assert(result !== track);
      assert.deepEqual(result.toJSON(), track.toJSON());
    });
  });
  describe("#slice(beginTime: number, duration: number): Track", () => {
    it("works", () => {
      let track = createTrackFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

      let result = track.slice(55, 30);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 5, beginTime: 5, endTime: 10 },
        { data: 6, beginTime: 0, endTime: 10 },
        { data: 7, beginTime: 0, endTime: 10 },
        { data: 8, beginTime: 0, endTime:  5 },
      ]);
    });
    it("given negative beginTime", () => {
      let track = createTrackFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

      let result = track.slice(-20, 30);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 0, beginTime: 0, endTime: 10 },
        { data: 1, beginTime: 0, endTime: 10 },
        { data: 2, beginTime: 0, endTime: 10 },
      ]);
    });
    it("out of range", () => {
      let track = createTrackFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

      let result = track.slice(95, 30);

      assert(result !== track);

      result = pickEach(result.toJSON(), [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 9, beginTime: 5, endTime: 10 },
      ]);
    });
  });
  describe("#toJSON(): JSON", () => {
    it("works", () => {
      let track = new Track();

      assert.deepEqual(track.toJSON(), []);
    });
  });
  describe("#addFragment(fragment: Fragment): self", () => {
    it("works", () => {
      let track = new Track();

      let result = track;

      assert(result.fragments.length === 0);

      result = result.addFragment(new Fragment(0, 0, 10));
      assert(result.fragments.length === 1);

      result = result.addFragment(new Fragment(0, 0, 10));
      assert(result.fragments.length === 2);

      result = result.addFragment(null);
      assert(result.fragments.length === 2);

      assert(result === track);
    });
  });
  describe("#append(track: Track): self", () => {
    it("works", () => {
      let track = new Track();

      let result = track;

      assert(result.fragments.length === 0);

      result = result.append(createTrackFromList([ 0, 1 ]));
      assert(result.fragments.length === 2);

      result = result.append(createTrackFromList([ 2, 3 ]));
      assert(result.fragments.length === 4);

      result = result.append(null);
      assert(result.fragments.length === 4);

      assert(result === track);
    });
  });
});
