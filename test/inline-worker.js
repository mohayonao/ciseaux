import assert from "power-assert";
import InlineWorker from "../src/inline-worker";

describe("InlineWorker", () => {
  describe("constructor(func: function, self: object)", () => {
    it("works", (done) => {
      let self = {};
      let worker = new InlineWorker(function() {
        self.onmessage = function(e) {
          assert(e.data === "hello");
          self.postMessage("good bye");
        };
      }, self);

      worker.onmessage = (e) => {
        assert(e.data === "good bye");
        done();
      };

      worker.postMessage("hello");
    });
  });
});
