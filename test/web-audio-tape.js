import assert from "power-assert";
import sinon from "sinon";
import XMLHttpRequest from "./assets/xml-http-request";
import config from "../src/config";
import renderer from "../src/renderer";
import Tape from "../src/tape";
import WebAudioTape, { use } from "../src/web-audio-tape";

global.XMLHttpRequest = XMLHttpRequest;

describe("WebAudioTape", () => {
  let audioContext;

  before(() => {
    audioContext = new global.AudioContext();
  });

  describe("constructor(audioBuffer: AudioBuffer)", () => {
    it("works", () => {
      sinon.spy(renderer, "transfer");

      let buffer = audioContext.createBuffer(2, 100, 44100);
      let tape = new WebAudioTape(buffer);

      assert(tape instanceof WebAudioTape);
      assert(tape instanceof Tape);
      assert(renderer.transfer.calledOnce);

      renderer.transfer.restore();
    });
  });
  describe("#dispose(): void", () => {
    it("works", () => {
      sinon.spy(renderer, "dispose");

      let buffer = audioContext.createBuffer(2, 100, 44100);
      let tape = new WebAudioTape(buffer);

      tape.dispose();

      assert(renderer.dispose.calledOnce);

      renderer.dispose.restore();
    });
  });
  describe("use", () => {
    before(use);
    describe("from", () => {
      describe("(src: Tape): Promise<Tape>", () => {
        it("works", () => {
          let src = Tape.silence(20);
          let result = config.from(src);

          assert(result instanceof Promise);

          return result.then((tape) => {
            assert(tape instanceof Tape);
            assert(tape !== src);
          });
        });
      });
      describe("(src: AudioBuffer): Promise<Tape>", () => {
        it("works", () => {
          let src = audioContext.createBuffer(2, 100, 44100);
          let result = config.from(src);

          assert(result instanceof Promise);

          return result.then((tape) => {
            assert(tape instanceof Tape);
          });
        });
      });
      describe("(src: ArrayBuffer): Promise<Tape>", () => {
        it("works", () => {
          let src = new Uint32Array([
            1179011410,88,1163280727,544501094,16,131073,44100,176400,1048580,1635017060,8,0,0,
          ]).buffer;

          let result = config.from(src);

          assert(result instanceof Promise);

          return result.then((tape) => {
            assert(tape instanceof Tape);
          });
        });
      });
      describe("(src: string): Promise<Tape>", () => {
        it("works", () => {
          let src = "./sound/tape1.wav";

          let result = config.from(src, audioContext);

          assert(result instanceof Promise);

          return result.then((tape) => {
            assert(tape instanceof Tape);
          });
        });
        it("not work", () => {
          let src = "./sound/tape*.wav";

          let result = config.from(src, audioContext);

          assert(result instanceof Promise);

          return result.then(() => {
            assert(!"NOT REACHED");
          }, (e) => {
            assert(e.message === "Not Found");
          });
        });
      });
      describe("(src: INVALID): Promise<Tape>", () => {
        it("works", () => {
          let result = config.from(null, audioContext);

          assert(result instanceof Promise);

          return result.then(() => {
            assert(!"NOT REACHED");
          }, (e) => {
            assert(e.message = "Invalid arguments");
          });
        });
      });
    });
    describe("render(audioContext: AudioContext, numberOfChannels: number): Promise<AudioBuffer>", () => {
      it("works", () => {
        let buffer = audioContext.createBuffer(2, 100, 44100);

        buffer.getChannelData(0).set([ 0, 1, 2, 3, 4 ]);
        buffer.getChannelData(1).set([ 5, 6, 7, 8, 9 ]);

        let tape = new WebAudioTape(buffer).slice(0);

        return tape.render(audioContext).then((audioBuffer) => {
          assert(audioBuffer !== buffer);
          assert(audioBuffer instanceof global.AudioBuffer);
          assert.deepEqual(audioBuffer.getChannelData(0), buffer.getChannelData(0));
          assert.deepEqual(audioBuffer.getChannelData(1), buffer.getChannelData(1));
        }, () => {
          throw new Error("NOT REACHED");
        });
      });
    });
  });
});
