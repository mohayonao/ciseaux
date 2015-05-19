import assert from "power-assert";
import Fragment from "../src/fragment";

describe("Fragment", () => {
  describe("constructor(data: number, beginTime: number, endTime: number)", () => {
    it("should create a new Fragment", () => {
      let fragment = new Fragment(1, 0, 10);

      assert(fragment instanceof Fragment);
      assert(fragment.data === 1);
      assert(fragment.beginTime === 0);
      assert(fragment.endTime === 10);
      assert(fragment.gain === 1);
      assert(fragment.pan === 0);
      assert(fragment.reverse === false);
      assert(fragment.pitch === 1);
      assert(fragment.stretch === false);
    });
  });
  describe("#duration: number [getter]", () => {
    it("should be calculated according to the pitch", () => {
      let fragment = new Fragment(1, 0, 10);

      assert(fragment.duration === 10);

      fragment.pitch = 2;

      assert(fragment.duration === 5);
    });
  });
  describe("#slice(beginTime: number, duration: number): Fragment", () => {
    context("pitch = 1", () => {
      it("works", () => {
        let fragment = new Fragment(1, 0, 10);

        // * * * * * * * * * *
        // 0 1 2 3 4 5 6 7 8 9
        //   * * * * * * *
        //   0 1 2 3 4 5 6
        //       * * * * * *
        //       0 1 2 3 4
        //   * * * *
        //       0 1
        //             * *

        let result = fragment;

        result = result.slice(1, 7);
        assert(result instanceof Fragment);
        assert(result !== fragment);
        assert(result.beginTime === 1);
        assert(result.endTime === 8);
        assert(result.duration === 7);

        result = result.slice(2, 6);
        assert(result.beginTime === 3);
        assert(result.endTime === 8);
        assert(result.duration === 5);

        result = result.slice(-2, 4);
        assert(result.beginTime === 3);
        assert(result.endTime === 5);
        assert(result.duration === 2);

        result = result.slice(3, 2);
        assert(result.beginTime === 6);
        assert(result.endTime === 6);
        assert(result.duration === 0);
      });
    });
    context("pitch = 0.1", () => {
      it("works", () => {
        let fragment = new Fragment(1, 0, 100);

        fragment.pitch = 0.1;

        // * * * * * * * * * *
        // 0 1 2 3 4 5 6 7 8 9
        //   * * * * * * *
        //   0 1 2 3 4 5 6
        //       * * * * * *
        //       0 1 2 3 4
        //   * * * *
        //       0 1
        //             * *

        let result = fragment;

        result = result.slice(10, 70);
        assert(result instanceof Fragment);
        assert(result !== fragment);
        assert(result.beginTime === 1);
        assert(result.endTime === 8);
        assert(result.duration === 70);

        result = result.slice(20, 60);
        assert(result.beginTime === 3);
        assert(result.endTime === 8);
        assert(result.duration === 50);

        result = result.slice(-20, 40);
        assert(result.beginTime === 3);
        assert(result.endTime === 5);
        assert(result.duration === 20);

        result = result.slice(30, 20);
        assert(result.beginTime === 6);
        assert(result.endTime === 6);
        assert(result.duration === 0);
      });
    });
  });
  describe("#clone(attributes: object): Fragment", () => {
    context("without attributes", () => {
      it("should return a cloned Fragment that's all properties should be copied", () => {
        let fragment = new Fragment(1, 0, 10);

        fragment.gain = 0.5;
        fragment.pan = 0.25;
        fragment.reverse = true;
        fragment.pitch = 0.125;
        fragment.stretch = true;

        let result = fragment.clone();

        assert(result instanceof Fragment);
        assert(result !== fragment);
        assert(result.data === fragment.data);
        assert(result.beginTime === fragment.beginTime);
        assert(result.endTime === fragment.endTime);
        assert(result.gain === fragment.gain);
        assert(result.pan === fragment.pan);
        assert(result.reverse === fragment.reverse);
        assert(result.pitch === fragment.pitch);
        assert(result.stretch === fragment.stretch);
      });
    });
    context("given attributes", () => {
      it("should return a cloned Fragment that has given attributes", () => {
        let fragment = new Fragment(1, 0, 10);

        fragment.gain = 0.5;
        fragment.pan = 0.25;
        fragment.reverse = true;
        fragment.pitch = 0.125;
        fragment.stretch = true;

        let result = fragment.clone({
          beginTime: 2,
          endTime: 8,
          gain: 0.25,
          pan: 0.125,
          reverse: false,
          pitch: 0.0625,
          stretch: false,
        });

        assert(result instanceof Fragment);
        assert(result !== fragment);
        assert(result.data === fragment.data);
        assert(result.beginTime === 2);
        assert(result.endTime === 8);
        assert(result.gain === 0.25);
        assert(result.pan === 0.125);
        assert(result.reverse === false);
        assert(result.pitch === 0.0625);
        assert(result.stretch === false);
      });
    });
  });
  describe("#toJSON(): JSON", () => {
    it("works", () => {
      let fragment = new Fragment(1, 2, 3);

      fragment.gain = 0.5;
      fragment.pan = 0.25;
      fragment.reverse = true;
      fragment.pitch = 0.125;
      fragment.stretch = true;

      assert.deepEqual(fragment.toJSON(), {
        data: 1,
        beginTime: 2,
        endTime: 3,
        gain: 0.5,
        pan: 0.25,
        reverse: true,
        pitch: 0.125,
        stretch: true,
      });
    });
  });
});
