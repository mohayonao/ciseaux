import assert from "power-assert";
import sinon from "sinon";
import config from "../src/config";
import Fragment from "../src/fragment";
import Tape from "../src/tape";

let pickEach = (list, keys) => {
  return list.map((data) => {
    let result = {};

    keys.forEach((key) => {
      result[key] = data[key];
    });

    return result;
  });
};

let createTapeFromList = (list) => {
  let tape = new Tape(2, 8000);
  list.forEach((data) => {
    tape.tracks[0].addFragment(new Fragment(data, 0, 10));
  });
  return tape;
};

class TestTape extends Tape {
  constructor() {
    super(2, 800);
  }
}

describe.only("Tape", () => {
  describe(".from(...args): Promise<Tape>", () => {
    let config$from;
    before(() => {
      config$from = config.from;
    });
    after(() => {
      config.from = config$from;
    });
    context("exists from", () => {
      it("works", () => {
        config.from = sinon.spy(() => {
          return Promise.resolve(new TestTape());
        });

        let result = Tape.from();

        assert(result instanceof Promise);

        return result.then((tape) => {
          assert(tape instanceof TestTape);
        });
      });
    });
    context("not exists from", () => {
      it("works", () => {
        config.from = null;

        let result = Tape.from(2, 8000);

        assert(result instanceof Promise);

        return result.then((tape) => {
          assert(tape instanceof Tape);
        });
      });
    });
  });
  describe(".silence(duration: number): Tape", () => {
    it("should create a silence Tape", () => {
      let silence = Tape.silence(20);

      assert(silence instanceof Tape);
      assert(silence.duration === 20);
    });
  });
  describe(".concat(tapes: Tape[]): Tape", () => {
    it("should create a new Tape", () => {
      let tape1 = createTapeFromList([ 0, 1 ]);
      let tape2 = createTapeFromList([ 2, 3 ]);

      let result = Tape.concat([ tape1, tape2, null ]);

      assert(result instanceof Tape);
      assert(result.duration === 40);
      assert(result.numberOfChannels === 2);

      result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 0, beginTime: 0, endTime: 10 },
        { data: 1, beginTime: 0, endTime: 10 },
        { data: 2, beginTime: 0, endTime: 10 },
        { data: 3, beginTime: 0, endTime: 10 },
      ]);
    });
  });
  describe(".mix(tapes: Tape[], method: string): Tape", () => {
    it("works", () => {
      let tape1 = createTapeFromList([ 0, 1 ]);
      let tape2 = createTapeFromList([ 2, 3, 4, 5 ]);

      let result = Tape.mix([ tape1, tape2 ]);

      assert(result instanceof Tape);
      assert(result.duration === 40);
      assert(result.numberOfChannels === 2);
      assert(result.numberOfTracks === 2);

      let tracks = result.toJSON().tracks;

      result = pickEach(tracks[0], [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 0, beginTime: 0, endTime: 10 },
        { data: 1, beginTime: 0, endTime: 10 },
        { data: 0, beginTime: 0, endTime: 20 },
      ], "tracks[0]");

      result = pickEach(tracks[1], [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 2, beginTime: 0, endTime: 10 },
        { data: 3, beginTime: 0, endTime: 10 },
        { data: 4, beginTime: 0, endTime: 10 },
        { data: 5, beginTime: 0, endTime: 10 },
      ], "tracks[1]");
    });
    it("works when given not Tape[]", () => {
      let result = Tape.mix([ null ]);

      assert(result instanceof Tape);
      assert(result.duration === 0);
      assert(result.numberOfChannels === 1);
      assert(result.numberOfTracks === 1);
    });
    it("works when given invalid argument", () => {
      let result = Tape.mix();

      assert(result instanceof Tape);
      assert(result.duration === 0);
      assert(result.numberOfChannels === 1);
      assert(result.numberOfTracks === 1);
    });
  });
  describe("#sampleRate: number [getter]", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      assert(tape.sampleRate === 8000);
    });
  });
  describe("#length: number [getter]", () => {
    it("should be calculated according to duration", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ]));
      assert(tape.length === 8000 * 20, "[ 0, 1 ]");

      tape = tape.concat(createTapeFromList([ 2, 3 ]));
      assert(tape.length === 8000 * 40, "[ 0, 1, 2, 3 ]");
    });
  });
  describe("#duration: number [getter]", () => {
    it("should be calculated according to tracks", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ]));
      assert(tape.duration === 20, "[ 0, 1 ]");

      tape = tape.concat(createTapeFromList([ 2, 3 ]));
      assert(tape.duration === 40, "[ 0, 1, 2, 3 ]");
    });
  });
  describe("#numberOfChannels: number [getter]", () => {
    it("work", () => {
      let tape = new Tape(2, 8000);

      assert(tape.numberOfChannels === 2);
    });
  });
  describe("#numberOfTracks: number [getter]", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      assert(tape.numberOfTracks === 1);
    });
  });
  describe("#gain(gain: number): Tape", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ])).gain(0.5);
      tape = tape.concat(createTapeFromList([ 2, 3 ])).gain(0.5);
      tape = tape.concat(createTapeFromList([ 4, 5 ])).gain();
      tape = tape.concat(createTapeFromList([ 6, 7 ])).gain(0.5);
      tape = tape.concat(createTapeFromList([ 8, 9 ])).gain(0.5);

      let result = pickEach(tape.toJSON().tracks[0], [ "data", "gain" ]);
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
    });
  });
  describe("#pan(pan: number): Tape", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ])).pan(0.25);
      tape = tape.concat(createTapeFromList([ 2, 3 ])).pan(0.25);
      tape = tape.concat(createTapeFromList([ 4, 5 ])).pan();
      tape = tape.concat(createTapeFromList([ 6, 7 ])).pan(0.25);
      tape = tape.concat(createTapeFromList([ 8, 9 ])).pan(0.25);

      let result = pickEach(tape.toJSON().tracks[0], [ "data", "pan" ]);
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
    });
  });
  describe("#reverse(): Tape", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ])).reverse(); // 1 0
      tape = tape.concat(createTapeFromList([ 2, 3 ])).reverse(); // 3 2 0 1
      tape = tape.concat(createTapeFromList([ 4, 5 ])).reverse(); // 5 4 1 0 2 3
      tape = tape.concat(createTapeFromList([ 6, 7 ])).reverse(); // 7 6 3 2 0 1 4 5
      tape = tape.concat(createTapeFromList([ 8, 9 ])).reverse(); // 9 8 5 4 1 0 2 3 6 7

      let result = pickEach(tape.toJSON().tracks[0], [ "data", "reverse" ]);
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
    });
  });
  describe("#pitch(rate: number): Tape", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ])).pitch(0.25);
      tape = tape.concat(createTapeFromList([ 2, 3 ])).pitch(0.5);
      tape = tape.concat(createTapeFromList([ 4, 5 ])).pitch();
      tape = tape.concat(createTapeFromList([ 6, 7 ])).pitch(2.0);
      tape = tape.concat(createTapeFromList([ 8, 9 ])).pitch(3.0);

      let result = pickEach(tape.toJSON().tracks[0], [ "data", "pitch", "stretch" ]);
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
    });
  });
  describe("#stretch(rate: number): Tape", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(createTapeFromList([ 0, 1 ])).stretch(0.25);
      tape = tape.concat(createTapeFromList([ 2, 3 ])).stretch(0.5);
      tape = tape.concat(createTapeFromList([ 4, 5 ])).stretch();
      tape = tape.concat(createTapeFromList([ 6, 7 ])).stretch(2.0);
      tape = tape.concat(createTapeFromList([ 8, 9 ])).stretch(3.0);

      let result = pickEach(tape.toJSON().tracks[0], [ "data", "pitch", "stretch" ]);
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
    });
  });
  describe("#clone(): Tape", () => {
    it("works", () => {
      let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

      let result = tape.clone();

      assert(result !== tape);
      assert.deepEqual(result.toJSON(), tape.toJSON());
    });
  });
  describe("#silence(duration: number): Tape", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape = tape.concat(tape.silence());
      tape = tape.concat(tape.silence(1));
      tape = tape.concat(tape.silence(2));

      let result = pickEach(tape.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 0, beginTime: 0, endTime: 1 },
        { data: 0, beginTime: 0, endTime: 2 },
      ]);
    });
  });
  describe("#concat: (...tapes: Tape): Tape", () => {
    context("same numberOfTracks", () => {
      it("works", () => {
        let tape = new Tape(2, 8000);

        let result = tape.concat(
          createTapeFromList([ 0, 1 ]),
          createTapeFromList([ 2, 3 ]),
          [ createTapeFromList([ 4, 5 ]),
            createTapeFromList([ 6, 7 ]),
            createTapeFromList([ 8, 9 ]),
            null,
          ],
          null
        );

        assert.deepEqual(tape.toJSON().tracks, [ [] ], "non destructive");

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("adjust numberOfTracks", () => {
      it("works", () => {
        let tape1 = createTapeFromList([ 0, 1 ]);
        let tape2 = createTapeFromList([ 2, 3 ]).mix(createTapeFromList([ 4, 5 ])).mix(createTapeFromList([ 6, 7 ]));
        let tape3 = createTapeFromList([ 8, 9 ]);

        let result = tape1.concat(tape2, tape3);

        assert(result.numberOfTracks === 3);

        let tracks = result.toJSON().tracks;

        result = pickEach(tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ], "tracks[0]");

        result = pickEach(tracks[1], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 20 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 20 },
        ], "tracks[1]");

        result = pickEach(tracks[2], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 20 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 20 },
        ], "tracks[2]");
      });
    });
  });
  describe("#slice(beginTime: number, duration: number): Tape", () => {
    context("without arguments", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.slice();

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("without duration", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.slice(55);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 5, beginTime: 5, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("with all arguments", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.slice(55, 30);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 5, beginTime: 5, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime:  5 },
        ]);
      });
    });
    context("given negative beginTime", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.slice(-55, 30);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 4, beginTime: 5, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime:  5 },
        ]);
      });
    });
  });
  describe("#loop(n: number): Tape", () => {
    context("without arguments", () => {
      it("works (default n = 2)", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4 ]);

        let result = tape.loop();

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given n", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4 ]);

        let result = tape.loop(3);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given n = 0", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4 ]);

        let result = tape.loop(0);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
        ]);
      });
    });
  });
  describe("#fill(duration: number): Tape", () => {
    context("without arguments", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4 ]);

        let result = tape.fill();

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given duration", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4 ]);

        let result = tape.fill(75);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime:  5 },
        ]);
      });
    });
    context("given duration = 0", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4 ]);

        let result = tape.fill(0);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
        ]);
      });
    });
    context("from empty", () => {
      it("works", () => {
        let tape = new Tape(2, 8000);

        let result = tape.fill(10);

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
        ]);
      });
    });
  });
  describe("#replace(beginTime: number, duration: number, tape: Tape): Tape", () => {
    context("without arguments", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.replace();

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given all arguments", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.replace(55, 30, createTapeFromList([ 10, 20, 30 ]));

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime:  5 },

          { data: 10, beginTime: 0, endTime: 10 },
          { data: 20, beginTime: 0, endTime: 10 },
          { data: 30, beginTime: 0, endTime: 10 },

          { data: 8, beginTime: 5, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given negative beginTime", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.replace(-55, 30, createTapeFromList([ 10, 20, 30 ]));

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime:  5 },

          { data: 10, beginTime: 0, endTime: 10 },
          { data: 20, beginTime: 0, endTime: 10 },
          { data: 30, beginTime: 0, endTime: 10 },

          { data: 7, beginTime: 5, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given a function as a tape", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.replace(-55, 30, (tape) => {
          return tape.loop();
        });

        assert(result !== tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime:  5 },

          { data: 4, beginTime: 5, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime:  5 },
          { data: 4, beginTime: 5, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime:  5 },

          { data: 7, beginTime: 5, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
  });
  describe("#split(n: number): Tape[]", () => {
    context("withtout arguments", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.split();

        assert(Array.isArray(result));
        assert(result.length === 2);

        let result0 = pickEach(result[0].toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result0, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
        ]);

        let result1 = pickEach(result[1].toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result1, [
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given n", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.split(4);

        assert(Array.isArray(result));
        assert(result.length === 4);

        let result0 = pickEach(result[0].toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result0, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 5 },
        ]);

        let result1 = pickEach(result[1].toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result1, [
          { data: 2, beginTime: 5, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 4, beginTime: 0, endTime: 10 },
        ]);

        let result2 = pickEach(result[2].toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result2, [
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 5 },
        ]);

        let result3 = pickEach(result[3].toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result3, [
          { data: 7, beginTime: 5, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ]);
      });
    });
    context("given n = 0", () => {
      it("works", () => {
        let tape = createTapeFromList([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);

        let result = tape.split(0);

        assert(Array.isArray(result));
        assert(result.length === 0);
      });
    });
  });
  describe("#mix(tape: Tape, method:string): Tape", () => {
    context("without arguments", () => {
      let tape1 = createTapeFromList([ 0, 1, 2, 3 ]);

      let result = tape1.mix();

      assert(result !== tape1);

      let tracks = result.toJSON().tracks;

      result = pickEach(tracks[0], [ "data", "beginTime", "endTime" ]);
      assert.deepEqual(result, [
        { data: 0, beginTime: 0, endTime: 10 },
        { data: 1, beginTime: 0, endTime: 10 },
        { data: 2, beginTime: 0, endTime: 10 },
        { data: 3, beginTime: 0, endTime: 10 },
      ], "tracks[0]");
    });
    context("without method", () => {
      it("works", () => {
        let tape1 = createTapeFromList([ 0, 1, 2, 3 ]);
        let tape2 = createTapeFromList([ 4, 5, 6, 7, 8, 9 ]);

        let result = tape1.mix(tape2);

        assert(result !== tape1);
        assert(result !== tape2);
        assert(result.numberOfTracks === 2);

        let tracks = result.toJSON().tracks;

        result = pickEach(tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 20 },
        ], "tracks[0]");

        result = pickEach(tracks[1], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ], "tracks[1]");
      });
    });
    context("method = 'fill'", () => {
      it("works", () => {
        let tape1 = createTapeFromList([ 0, 1, 2, 3 ]);
        let tape2 = createTapeFromList([ 4, 5, 6, 7, 8, 9 ]);

        let result = tape1.mix(tape2, "fill");

        assert(result !== tape1);
        assert(result !== tape2);
        assert(result.numberOfTracks === 2);

        let tracks = result.toJSON().tracks;

        result = pickEach(tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
          { data: 2, beginTime: 0, endTime: 10 },
          { data: 3, beginTime: 0, endTime: 10 },
          { data: 0, beginTime: 0, endTime: 10 },
          { data: 1, beginTime: 0, endTime: 10 },
        ], "tracks[0]");

        result = pickEach(tracks[1], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 4, beginTime: 0, endTime: 10 },
          { data: 5, beginTime: 0, endTime: 10 },
          { data: 6, beginTime: 0, endTime: 10 },
          { data: 7, beginTime: 0, endTime: 10 },
          { data: 8, beginTime: 0, endTime: 10 },
          { data: 9, beginTime: 0, endTime: 10 },
        ], "tracks[1]");
      });
    });
    context("method = 'pitch'", () => {
      it("works", () => {
        let tape1 = createTapeFromList([ 0, 1, 2, 3, 4, 5 ]);
        let tape2 = createTapeFromList([ 6, 7, 8, 9 ]);

        let result = tape1.mix(tape2, "pitch");

        assert(result !== tape1);
        assert(result !== tape2);
        assert(result.numberOfTracks === 2);

        let tracks = result.toJSON().tracks;

        result = pickEach(tracks[0], [ "data", "beginTime", "endTime", "pitch" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10, pitch: 1 },
          { data: 1, beginTime: 0, endTime: 10, pitch: 1 },
          { data: 2, beginTime: 0, endTime: 10, pitch: 1 },
          { data: 3, beginTime: 0, endTime: 10, pitch: 1 },
          { data: 4, beginTime: 0, endTime: 10, pitch: 1 },
          { data: 5, beginTime: 0, endTime: 10, pitch: 1 },
        ], "tracks[0]");

        result = pickEach(tracks[1], [ "data", "beginTime", "endTime", "pitch" ]);
        assert.deepEqual(result, [
          { data: 6, beginTime: 0, endTime: 10, pitch: 4 / 6 },
          { data: 7, beginTime: 0, endTime: 10, pitch: 4 / 6 },
          { data: 8, beginTime: 0, endTime: 10, pitch: 4 / 6 },
          { data: 9, beginTime: 0, endTime: 10, pitch: 4 / 6 },
        ], "tracks[1]");
      });
    });
    context("method = 'stretch'", () => {
      it("works", () => {
        let tape1 = createTapeFromList([ 0, 1, 2, 3, 4, 5 ]);
        let tape2 = createTapeFromList([ 6, 7, 8, 9 ]);

        let result = tape1.mix(tape2, "stretch");

        assert(result !== tape1);
        assert(result !== tape2);
        assert(result.numberOfTracks === 2);

        let tracks = result.toJSON().tracks;

        result = pickEach(tracks[0], [ "data", "beginTime", "endTime", "pitch", "stretch" ]);
        assert.deepEqual(result, [
          { data: 0, beginTime: 0, endTime: 10, pitch: 1, stretch: false },
          { data: 1, beginTime: 0, endTime: 10, pitch: 1, stretch: false },
          { data: 2, beginTime: 0, endTime: 10, pitch: 1, stretch: false },
          { data: 3, beginTime: 0, endTime: 10, pitch: 1, stretch: false },
          { data: 4, beginTime: 0, endTime: 10, pitch: 1, stretch: false },
          { data: 5, beginTime: 0, endTime: 10, pitch: 1, stretch: false },
        ], "tracks[0]");

        result = pickEach(tracks[1], [ "data", "beginTime", "endTime", "pitch", "stretch" ]);
        assert.deepEqual(result, [
          { data: 6, beginTime: 0, endTime: 10, pitch: 4 / 6, stretch: true },
          { data: 7, beginTime: 0, endTime: 10, pitch: 4 / 6, stretch: true },
          { data: 8, beginTime: 0, endTime: 10, pitch: 4 / 6, stretch: true },
          { data: 9, beginTime: 0, endTime: 10, pitch: 4 / 6, stretch: true },
        ], "tracks[1]");
      });
    });
  });
  describe("#render(): Promise", () => {
    let config$render;
    before(() => {
      config$render = config.render;
    });
    after(() => {
      config.render = config$render;
    });
    context("exists render", () => {
      it("works", () => {
        config.render = (...args) => {
          return new Promise((resolve) => {
            resolve(args);
          });
        };

        let tape = new Tape(2, 8000);

        return tape.render("arg1", "arg2", "...args").then((args) => {
          assert.deepEqual(args, [ tape.toJSON(), "arg1", "arg2", "...args" ]);
        }, () => {
          throw new Error("NOT REACHED");
        });
      });
    });
    context("not exists render", () => {
      it("works", () => {
        config.render = null;

        let tape = new Tape(2, 8000);

        return tape.render().then(() => {
          throw new Error("NOT REACHED");
        }, (e) => {
          assert(e instanceof Error);
        });
      });
    });
  });
  describe("#dispose(): void", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      tape.dispose();

      assert(true);
    });
  });
  describe("#toJSON(): JSON", () => {
    it("works", () => {
      let tape = new Tape(2, 8000);

      assert.deepEqual(tape.toJSON(), {
        tracks: [ [] ],
        duration: 0,
        sampleRate: 8000,
        numberOfChannels: 2,
      });
    });
  });
});
