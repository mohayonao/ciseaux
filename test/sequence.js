"use strict";

import assert from "power-assert";
import Fragment from "../src/fragment";
import Tape from "../src/tape";
import Sequence from "../src/sequence";

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

describe("Sequence", () => {
  describe("constructor(pattern: string, durationPerStep: number)", () => {
    it("works", () => {
      let seq = new Sequence("abracadabra", 15);

      assert(seq instanceof Sequence);
    });
  });
  describe("#apply(instruments: object): Tape", () => {
    context("empty pattern", () => {
      it("works", () => {
        let seq = new Sequence("", 15);

        let result = seq.apply({ a: Tape.silence(5) });

        assert(result instanceof Tape);
        assert(result.duration === 0);
      });
    });
    context("durationPerStep = 0", () => {
      it("works", () => {
        let seq = new Sequence("abracadabra", 0);

        let result = seq.apply({ a: Tape.silence(5) });

        assert(result instanceof Tape);
        assert(result.duration === 0);
      });
    });
    context("gotcha", () => {
      it("works", () => {
        let seq = new Sequence("abracadabra", 15);

        let result = seq.apply({
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2, 3 ]),
          r: null,
          c: () => { return createTapeFromList([ 4, 5 ]); }
        }, 5);

        assert(result instanceof Tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 2, beginTime: 0, endTime: 10 }, // b
          { data: 3, beginTime: 0, endTime:  5 },
          { data: 0, beginTime: 0, endTime: 15 }, // r
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 4, beginTime: 0, endTime: 10 }, // c
          { data: 5, beginTime: 0, endTime:  5 },
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 0, beginTime: 0, endTime: 15 }, // d
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 2, beginTime: 0, endTime: 10 }, // b
          { data: 3, beginTime: 0, endTime:  5 },
          { data: 0, beginTime: 0, endTime: 15 }, // r
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 }
        ]);
      });
    });
    context("gotcha 2", () => {
      it("works", () => {
        let seq = new Sequence({
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2, 3 ]),
          r: null,
          c: () => { return createTapeFromList([ 4, 5 ]); }
        }, 15);

        let result = seq.apply("abracadabra", 5);

        assert(result instanceof Tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 2, beginTime: 0, endTime: 10 }, // b
          { data: 3, beginTime: 0, endTime:  5 },
          { data: 0, beginTime: 0, endTime: 15 }, // r
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 4, beginTime: 0, endTime: 10 }, // c
          { data: 5, beginTime: 0, endTime:  5 },
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 0, beginTime: 0, endTime: 15 }, // d
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 },
          { data: 2, beginTime: 0, endTime: 10 }, // b
          { data: 3, beginTime: 0, endTime:  5 },
          { data: 0, beginTime: 0, endTime: 15 }, // r
          { data: 1, beginTime: 0, endTime: 10 }, // a
          { data: 0, beginTime: 0, endTime:  5 }
        ]);
      });
    });
  });
});
