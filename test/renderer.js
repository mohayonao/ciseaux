import assert from "power-assert";
import renderer from "../src/renderer";

let UNDEFINED;

describe("renderer", () => {
  let transferred = null;

  describe("transfer(audioData: Float32Array[]): number", () => {
    it("should put audioData to the repository", (done) => {
      let audiodata = {
        sampleRate: 8000,
        channelData: [
          new Float32Array([ 0, 1, 2, 3, 4 ]),
          new Float32Array([ 5, 6, 7, 8, 9 ]),
        ],
      };
      let result = renderer.transfer(audiodata);

      setTimeout(() => {
        assert(renderer.util.repository[result] !== audiodata.channelData);
        assert.deepEqual(renderer.util.repository[result], audiodata.channelData);
        done();
      }, 0);

      assert(renderer.util.repository[result] === UNDEFINED);

      transferred = result;
    });
  });
  describe("dispose(data: number): void", () => {
    it("should delete audioData from the repository", (done) => {
      if (transferred === null) {
        return done();
      }

      renderer.dispose(transferred);

      setTimeout(() => {
        assert(renderer.util.repository[transferred] === UNDEFINED);
        done();
      }, 0);

      assert(renderer.util.repository[transferred] !== UNDEFINED);
    });
  });
  describe("render(tape: object): Promise<Float32Array[]>", () => {
    it("works", () => {
      let tape = {
        tracks: [
          [ { data: 0, beginTime: 0, endTime: 0.5 } ],
        ],
        duration: 0.5,
        sampleRate: 8000,
        numberOfChannels: 2,
      };

      return renderer.render(tape).then((audioData) => {
        assert(Array.isArray(audioData));
        assert(audioData.length === 2);
        assert(audioData[0] !== audioData[1]);
        assert(audioData[0] instanceof Float32Array);
        assert(audioData[1] instanceof Float32Array);
        assert(audioData[0].length === 4000);
        assert(audioData[1].length === 4000);
      });
    });
  });
});
