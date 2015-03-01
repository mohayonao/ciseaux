"use strict";

import assert from "power-assert";
import sinon from "sinon";
import config from "../src/config";
import renderer from "../src/renderer";
import Tape from "../src/tape";
import WebAudioTape, {use} from "../src/web-audio-tape";

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
    describe("create(audioBuffer: AudioBuffer): WebAudioTape", () => {
      it("should return a WebAudioTape", () => {
        let buffer = audioContext.createBuffer(2, 100, 44100);
        let tape = config.create(buffer);

        assert(tape instanceof WebAudioTape);
        assert(tape instanceof Tape);
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
