import assert from "power-assert";
import AudioData from "audiodata";
import XMLHttpRequest from "./assets/xml-http-request";
import config from "../src/config";
import Tape from "../src/tape";
import browserInterface from "../src/browser-interface";

global.XMLHttpRequest = XMLHttpRequest;

let wavData = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x2c, 0x00, 0x00, 0x00, // file size
  0x57, 0x41, 0x56, 0x45, // "WAVE"
  0x66, 0x6d, 0x74, 0x20, // "fmt "
  0x10, 0x00, 0x00, 0x00, // 16bit
  0x01, 0x00, 0x02, 0x00, // stereo
  0x44, 0xac, 0x00, 0x00, // 44.1kHz
  0x10, 0xb1, 0x02, 0x00, // data speed
  0x04, 0x00, 0x10, 0x00, // block size, bit/sample
  0x64, 0x61, 0x74, 0x61, // "data"
  0x08, 0x00, 0x00, 0x00, // data size
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]).buffer;

describe("browser-interface", () => {
  before(() => {
    config.audioContext = new global.AudioContext();
  });
  after(() => {
    config.audioContext = null;
  });
  before(browserInterface);

  describe("load", () => {
    describe("(url: string): Promise<ArrayBuffer>", () => {
      it("works", () => {
        let url = "./sound/tape1.wav";
        let result = config.load(url);

        assert(result instanceof Promise);

        return result.then((buffer) => {
          assert(buffer instanceof ArrayBuffer);
        });
      });
      it("not works", () => {
        let url = "./sound/tape*.wav";
        let result = config.load(url);

        assert(result instanceof Promise);

        return result.then(() => {
          assert(!"NOT REACHED");
        }, (e) => {
          assert(e.message === "Not Found");
        });
      });
    });
  });
  describe("decode", () => {
    describe("(buffer: ArrayBuffer): AudioData", () => {
      it("works", () => {
        let src = wavData;
        let result = config.decode(src);

        assert(result instanceof Promise);

        return result.then((audiodata) => {
          assert(AudioData.isAudioData(audiodata) === true);
        });
      });
    });
  });
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
    describe("(src: AudioData): Promise<Tape>", () => {
      it("works", () => {
        let src = {
          sampleRate: 44100,
          channelData: [
            new Float32Array(100),
            new Float32Array(100),
          ],
        };

        let result = config.from(src);

        assert(result instanceof Promise);

        return result.then((tape) => {
          assert(tape instanceof Tape);
        });
      });
    });
    describe("(src: AudioBuffer): Promise<Tape>", () => {
      it("works", () => {
        let src = config.audioContext.createBuffer(2, 100, 44100);
        let result = config.from(src);

        assert(result instanceof Promise);

        return result.then((tape) => {
          assert(tape instanceof Tape);
        });
      });
    });
    describe("(src: ArrayBuffer): Promise<Tape>", () => {
      it("works", () => {
        let src = wavData;
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

        let result = config.from(src);

        assert(result instanceof Promise);

        return result.then((tape) => {
          assert(tape instanceof Tape);
        });
      });
      it("not work", () => {
        let src = "./sound/tape*.wav";

        let result = config.from(src);

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
        let result = config.from(null);

        assert(result instanceof Promise);

        return result.then(() => {
          assert(!"NOT REACHED");
        }, (e) => {
          assert(e.message = "Invalid arguments");
        });
      });
    });
  });
  describe("render(tape: JSON, numberOfChannels: number = 0): Promise<AudioBuffer>", () => {
    it("works", () => {
      let buffer = config.audioContext.createBuffer(2, 100, 44100);

      buffer.getChannelData(0).set([ 0, 1, 2, 3, 4 ]);
      buffer.getChannelData(1).set([ 5, 6, 7, 8, 9 ]);

      let audiodata = {
        sampleRate: buffer.sampleRate,
        channelData: [
          buffer.getChannelData(0),
          buffer.getChannelData(1),
        ],
      };

      let tape = new Tape(audiodata).slice(0);

      return config.render(tape.toJSON()).then((audioBuffer) => {
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
