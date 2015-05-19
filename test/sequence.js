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
  describe("constructor(...args)", () => {
    it("works", () => {
      let seq = new Sequence();

      assert(seq instanceof Sequence);
      assert(seq.pattern === null);
      assert(seq.durationPerStep === null);
      assert(seq.instruments === null);
    });
  });
  describe("#apply(...args): Tape", () => {
    context("(pattern, durationPerStep, instruments) -> ()", () => {
      it("works", () => {
        let seq = new Sequence("abc", 5, {
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2 ]),
          c: createTapeFromList([ 3 ]),
        });

        let result1 = seq.apply();
        let result2 = seq.apply();

        assert(result1 instanceof Tape);
        assert(result2 instanceof Tape);
        assert(result1 !== result2);

        result1 = pickEach(result1.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result1, [
          { data: 1, beginTime: 0, endTime: 5 }, // a
          { data: 2, beginTime: 0, endTime: 5 }, // b
          { data: 3, beginTime: 0, endTime: 5 }, // c
        ]);
        result2 = pickEach(result2.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result2, [
          { data: 1, beginTime: 0, endTime: 5 }, // a
          { data: 2, beginTime: 0, endTime: 5 }, // b
          { data: 3, beginTime: 0, endTime: 5 }, // c
        ]);
      });
    });
    context("(pattern, durationPerStep) -> (instruments)", () => {
      it("works", () => {
        let seq = new Sequence("abc", 5);

        let result1 = seq.apply({
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2 ]),
          c: createTapeFromList([ 3 ]),
        });
        let result2 = seq.apply({
          a: createTapeFromList([ 4 ]),
          b: createTapeFromList([ 5 ]),
          c: createTapeFromList([ 6 ]),
        });

        assert(result1 instanceof Tape);
        assert(result2 instanceof Tape);
        assert(result1 !== result2);

        result1 = pickEach(result1.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result1, [
          { data: 1, beginTime: 0, endTime: 5 }, // a
          { data: 2, beginTime: 0, endTime: 5 }, // b
          { data: 3, beginTime: 0, endTime: 5 }, // c
        ]);
        result2 = pickEach(result2.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result2, [
          { data: 4, beginTime: 0, endTime: 5 }, // a
          { data: 5, beginTime: 0, endTime: 5 }, // b
          { data: 6, beginTime: 0, endTime: 5 }, // c
        ]);
      });
    });
    context("(pattern) -> (durationPerStep, instruments)", () => {
      it("works", () => {
        let seq = new Sequence("abc");

        let result1 = seq.apply(5, {
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2 ]),
          c: createTapeFromList([ 3 ]),
        });
        let result2 = seq.apply(10, {
          a: createTapeFromList([ 4 ]),
          b: createTapeFromList([ 5 ]),
          c: createTapeFromList([ 6 ]),
        });

        assert(result1 instanceof Tape);
        assert(result2 instanceof Tape);
        assert(result1 !== result2);

        result1 = pickEach(result1.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result1, [
          { data: 1, beginTime: 0, endTime: 5 }, // a
          { data: 2, beginTime: 0, endTime: 5 }, // b
          { data: 3, beginTime: 0, endTime: 5 }, // c
        ]);
        result2 = pickEach(result2.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result2, [
          { data: 4, beginTime: 0, endTime: 10 }, // a
          { data: 5, beginTime: 0, endTime: 10 }, // b
          { data: 6, beginTime: 0, endTime: 10 }, // c
        ]);
      });
    });
    context("() -> (pattern, durationPerStep, instruments)", () => {
      it("works", () => {
        let seq = new Sequence();

        let result1 = seq.apply("abc", 5, {
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2 ]),
          c: createTapeFromList([ 3 ]),
        });
        let result2 = seq.apply("cba", 10, {
          a: createTapeFromList([ 4 ]),
          b: createTapeFromList([ 5 ]),
          c: createTapeFromList([ 6 ]),
        });

        assert(result1 instanceof Tape);
        assert(result2 instanceof Tape);
        assert(result1 !== result2);

        result1 = pickEach(result1.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result1, [
          { data: 1, beginTime: 0, endTime: 5 }, // a
          { data: 2, beginTime: 0, endTime: 5 }, // b
          { data: 3, beginTime: 0, endTime: 5 }, // c
        ]);
        result2 = pickEach(result2.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result2, [
          { data: 6, beginTime: 0, endTime: 10 }, // c
          { data: 5, beginTime: 0, endTime: 10 }, // b
          { data: 4, beginTime: 0, endTime: 10 }, // a
        ]);
      });
    });
    context("invalid arguments", () => {
      it("works", () => {
        let seq = new Sequence(true);

        let result1 = seq.apply(false);
        let result2 = seq.apply(false);

        assert(result1 instanceof Tape);
        assert(result2 instanceof Tape);
        assert(result1.duration === 0);
        assert(result2.duration === 0);
        assert(result1 !== result2);
        assert.deepEqual(result1.toJSON(), result2.toJSON());
      });
    });
    context("list of durationPerStep", () => {
      it("works", () => {
        let seq = new Sequence("abc", {
          a: createTapeFromList([ 1 ]),
          b: createTapeFromList([ 2 ]),
          c: createTapeFromList([ 3 ]),
        });

        let result = seq.apply([ 5, 10, 15 ]);

        assert(result instanceof Tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 1, beginTime: 0, endTime:  5 }, // a
          { data: 2, beginTime: 0, endTime: 10 }, // b
          { data: 3, beginTime: 0, endTime: 10 }, // c
          { data: 0, beginTime: 0, endTime:  5 }, // silence
        ]);
      });
    });
    context("function as instrument", () => {
      it("works", () => {
        let seq = new Sequence("aaa", 5, {
          a: (ch, index) => {
            return createTapeFromList([ (index + 1) * 2 ]);
          },
        });

        let result = seq.apply();

        assert(result instanceof Tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data: 2, beginTime: 0, endTime: 5 }, // a
          { data: 4, beginTime: 0, endTime: 5 }, // b
          { data: 6, beginTime: 0, endTime: 5 }, // c
        ]);
      });
    });
    context("regexp", () => {
      it("works", () => {
        let seq = new Sequence("abcABC", 5, {
          "/a/i": createTapeFromList([ 1 ]),
          "/./": (ch) => {
            return createTapeFromList([ ch.charCodeAt(ch) ]);
          },
        });

        let result = seq.apply();

        assert(result instanceof Tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
          { data:  1, beginTime: 0, endTime: 5 }, // a
          { data: 98, beginTime: 0, endTime: 5 }, // b
          { data: 99, beginTime: 0, endTime: 5 }, // c
          { data:  1, beginTime: 0, endTime: 5 }, // a
          { data: 66, beginTime: 0, endTime: 5 }, // b
          { data: 67, beginTime: 0, endTime: 5 }, // c
        ]);
      });
    });
    context("not found", () => {
      it("works", () => {
        let seq = new Sequence("abc", 0, {
          c: null,
        });

        let result = seq.apply();

        assert(result instanceof Tape);

        result = pickEach(result.toJSON().tracks[0], [ "data", "beginTime", "endTime" ]);
        assert.deepEqual(result, [
        ]);
      });
    });
  });
});
