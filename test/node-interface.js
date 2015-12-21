import assert from "power-assert";
import AudioData from "audiodata";
import config from "../src/config";
import Tape from "../src/tape";
import nodeInterface from "../src/node-interface";

let wavData = new Buffer([
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
]);

describe("node-interface", () => {
  before(nodeInterface);

  describe("load", () => {
    describe("(filepath: string): Promise<Buffer>", () => {
      it("works", () => {
        let filepath = "./sound/tape1.wav";
        let result = config.load(filepath);

        assert(result instanceof Promise);

        return result.then((buffer) => {
          assert(buffer instanceof Buffer);
        });
      });
      it("not works", () => {
        let url = "./sound/tape*.wav";
        let result = config.load(url);

        assert(result instanceof Promise);

        return result.then(() => {
          assert(!"NOT REACHED");
        }, (e) => {
          assert(e instanceof Error);
        });
      });
    });
    describe("decode", () => {
      describe("(buffer: Buffer): AudioData", () => {
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
    describe("(src: Buffer): Promise<Tape>", () => {
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
          assert(e instanceof Error);
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
  describe("render(tape: JSON, numberOfChannels: number = 0): Promise<Buffer>", () => {
    it("works", () => {
      let audiodata = {
        sampleRate: 44100,
        channelData: [
          new Float32Array([ 0, 1, 2, 3, 4 ]),
          new Float32Array([ 5, 6, 7, 8, 9 ]),
        ],
      };
      let tape = new Tape(audiodata).slice(0);

      return config.render(tape.toJSON()).then((buffer) => {
        assert(buffer instanceof Buffer);
      }, () => {
        throw new Error("NOT REACHED");
      });
    });
  });
});
