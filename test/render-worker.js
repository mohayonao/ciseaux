import assert from "power-assert";
import renderer from "../src/renderer";
import render from "../src/render-worker";

let closeTo = (actual, expected, delta) => {
  return Math.abs(actual - expected) <= delta;
};

describe("render", () => {
  describe("allocData(tape: object): Float32Array[]", () => {
    it("works", () => {
      let tape = {
        tracks: [
          [
            { data: 0, beginTime: 0, endTime: 0.5 },
          ],
        ],
        duration: 0.5,
        sampleRate: 8000,
        numberOfChannels: 2,
      };
      let data = render.util.allocData(tape);

      assert(Array.isArray(data));
      assert(data.length === 2);
      assert(data[0] !== data[1]);
      assert(data[0] instanceof Float32Array);
      assert(data[1] instanceof Float32Array);
      assert(data[0].length === 4000);
      assert(data[1].length === 4000);
    });
  });
  describe("render(tape: object, destination: Float32Array[]): void", () => {
    it("works", (done) => {
      const X = 0.5;

      let buffer = new Float32Array(8000);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = X;
      }
      let data = renderer.transfer([ buffer ]);

      let tape = {
        tracks: [
          [
            {
              data: data,
              beginTime: 0,
              endTime: 0.125,
              gain: 1.0,
              pan: 0,
              reverse: false,
              pitch: 1,
              stretch: false,
            },
            {
              data: data,
              beginTime: 0,
              endTime: 0.125,
              gain: 0.5,
              pan: 0,
              reverse: false,
              pitch: 1,
              stretch: false,
            },
            {
              data: data,
              beginTime: 0,
              endTime: 0.125,
              gain: 0.25,
              pan: 0,
              reverse: false,
              pitch: 1,
              stretch: false,
            },
            {
              data: 0,
              beginTime: 0,
              endTime: 0.125,
              gain: 1,
              pan: 0,
              reverse: false,
              pitch: 1,
              stretch: false,
            },
          ],
          [
            {
              data: data,
              beginTime: 0,
              endTime: 0.25,
              gain: 1,
              pan: -0.5,
              reverse: false,
              pitch: 1,
              stretch: false,
            },
            {
              data: data,
              beginTime: 0.25,
              endTime: 0.5,
              gain: 1,
              pan: +0.5,
              reverse: true,
              pitch: 1,
              stretch: false,
            },
          ],
        ],
        duration: 0.5,
        sampleRate: 8000,
        numberOfChannels: 2,
      };
      let destination = render.util.allocData(tape);

      setTimeout(function() {
        render.util.render(tape, destination);

        assert(closeTo(destination[0][   0], X * 1.00 + X * Math.cos(0.25 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[0][1000], X * 0.50 + X * Math.cos(0.25 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[0][2000], X * 0.25 + X * Math.cos(0.75 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[0][3000], 0        + X * Math.cos(0.75 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[1][   0], X * 1.00 + X * Math.sin(0.25 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[1][1000], X * 0.50 + X * Math.sin(0.25 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[1][2000], X * 0.25 + X * Math.sin(0.75 * 0.5 * Math.PI), 1e-6));
        assert(closeTo(destination[1][3000], 0        + X * Math.sin(0.75 * 0.5 * Math.PI), 1e-6));

        done();
      }, 0);
    });
  });
  describe("subarray(array: Float32Array[], begin: number, end: number): Float32Array[]", () => {
    it("works", () => {
      let source = [
        new Float32Array([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]),
        new Float32Array([ 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 ]),
      ];

      let subarray = render.util.subarray(source, 2, 5);

      assert(Array.isArray(subarray));
      assert(subarray.length === 2);
      assert.deepEqual(subarray[0], new Float32Array([ 2, 3, 4 ]));
      assert.deepEqual(subarray[1], new Float32Array([ 7, 6, 5 ]));
      assert(subarray[0].buffer === source[0].buffer);
      assert(subarray[1].buffer === source[1].buffer);
    });
  });
  describe("process(src: Float32Array[], dst: Float32Array[], gain: number, pan: number, reverse: boolean): void", () => {
    context("non flags", () => {
      it("work", () => {
        let src = [
          new Float32Array([ 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9 ]),
          new Float32Array([ 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2 ]),
        ];
        let dst = [
          new Float32Array(10),
        ];

        render.util.process(src, dst, {
          gain: 1,
          pan: null,
          reverse: false,
        });

        assert(closeTo(dst[0][0], (0.00 + 0.00) * 0.5, 1e-6));
        assert(closeTo(dst[0][1], (0.10 + 0.20) * 0.5, 1e-6));
        assert(closeTo(dst[0][2], (0.20 + 0.40) * 0.5, 1e-6));
        assert(closeTo(dst[0][3], (0.30 + 0.60) * 0.5, 1e-6));
        assert(closeTo(dst[0][4], (0.40 + 0.80) * 0.5, 1e-6));
        assert(closeTo(dst[0][5], (0.50 + 1.00) * 0.5, 1e-6));
        assert(closeTo(dst[0][6], (0.60 + 0.80) * 0.5, 1e-6));
        assert(closeTo(dst[0][7], (0.70 + 0.60) * 0.5, 1e-6));
        assert(closeTo(dst[0][8], (0.80 + 0.40) * 0.5, 1e-6));
        assert(closeTo(dst[0][9], (0.90 + 0.20) * 0.5, 1e-6));
      });
    });
    context("gain: 0.5", () => {
      it("work", () => {
        let src = [
          new Float32Array([ 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9 ]),
          new Float32Array([ 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2 ]),
        ];
        let dst = [
          new Float32Array(10),
        ];

        render.util.process(src, dst, {
          gain: 0.5,
          pan: null,
          reverse: false,
        });

        assert(closeTo(dst[0][0], (0.00 + 0.00) * 0.25, 1e-6));
        assert(closeTo(dst[0][1], (0.10 + 0.20) * 0.25, 1e-6));
        assert(closeTo(dst[0][2], (0.20 + 0.40) * 0.25, 1e-6));
        assert(closeTo(dst[0][3], (0.30 + 0.60) * 0.25, 1e-6));
        assert(closeTo(dst[0][4], (0.40 + 0.80) * 0.25, 1e-6));
        assert(closeTo(dst[0][5], (0.50 + 1.00) * 0.25, 1e-6));
        assert(closeTo(dst[0][6], (0.60 + 0.80) * 0.25, 1e-6));
        assert(closeTo(dst[0][7], (0.70 + 0.60) * 0.25, 1e-6));
        assert(closeTo(dst[0][8], (0.80 + 0.40) * 0.25, 1e-6));
        assert(closeTo(dst[0][9], (0.90 + 0.20) * 0.25, 1e-6));
      });
    });
    context("pan: 0", () => {
      it("work", () => {
        let src = [
          new Float32Array([ 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9 ]),
          new Float32Array([ 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2 ]),
        ];
        let dst = [
          new Float32Array(10),
          new Float32Array(10),
        ];
        let l = Math.cos(0.25 * Math.PI);
        let r = Math.sin(0.25 * Math.PI);

        render.util.process(src, dst, {
          gain: 1,
          pan: 0,
          reverse: false,
        });

        assert(closeTo(dst[0][0], (0.00 + 0.00) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][1], (0.10 + 0.20) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][2], (0.20 + 0.40) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][3], (0.30 + 0.60) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][4], (0.40 + 0.80) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][5], (0.50 + 1.00) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][6], (0.60 + 0.80) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][7], (0.70 + 0.60) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][8], (0.80 + 0.40) * 0.5 * l, 1e-6));
        assert(closeTo(dst[0][9], (0.90 + 0.20) * 0.5 * l, 1e-6));
        assert(closeTo(dst[1][0], (0.00 + 0.00) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][1], (0.10 + 0.20) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][2], (0.20 + 0.40) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][3], (0.30 + 0.60) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][4], (0.40 + 0.80) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][5], (0.50 + 1.00) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][6], (0.60 + 0.80) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][7], (0.70 + 0.60) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][8], (0.80 + 0.40) * 0.5 * r, 1e-6));
        assert(closeTo(dst[1][9], (0.90 + 0.20) * 0.5 * r, 1e-6));
      });
    });
    context("reverse: true", () => {
      it("work", () => {
        let src = [
          new Float32Array([ 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9 ]),
          new Float32Array([ 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2 ]),
        ];
        let dst = [
          new Float32Array(10),
        ];

        render.util.process(src, dst, {
          gain: 1,
          pan: null,
          reverse: true,
        });

        assert(closeTo(dst[0][9], (0.00 + 0.00) * 0.5, 1e-6));
        assert(closeTo(dst[0][8], (0.10 + 0.20) * 0.5, 1e-6));
        assert(closeTo(dst[0][7], (0.20 + 0.40) * 0.5, 1e-6));
        assert(closeTo(dst[0][6], (0.30 + 0.60) * 0.5, 1e-6));
        assert(closeTo(dst[0][5], (0.40 + 0.80) * 0.5, 1e-6));
        assert(closeTo(dst[0][4], (0.50 + 1.00) * 0.5, 1e-6));
        assert(closeTo(dst[0][3], (0.60 + 0.80) * 0.5, 1e-6));
        assert(closeTo(dst[0][2], (0.70 + 0.60) * 0.5, 1e-6));
        assert(closeTo(dst[0][1], (0.80 + 0.40) * 0.5, 1e-6));
        assert(closeTo(dst[0][0], (0.90 + 0.20) * 0.5, 1e-6));
      });
    });
    context("resample: true", () => {
      it("work", () => {
        let src = [
          new Float32Array([ 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9 ]),
          new Float32Array([ 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2 ]),
        ];
        let dst = [
          new Float32Array(19),
        ];

        render.util.process(src, dst, {
          gain: 1,
          pan: null,
          reverse: false,
        });

        assert(closeTo(dst[0][ 0], (0.00 + 0.00) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 1], (0.05 + 0.10) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 2], (0.10 + 0.20) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 3], (0.15 + 0.30) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 4], (0.20 + 0.40) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 5], (0.25 + 0.50) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 6], (0.30 + 0.60) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 7], (0.35 + 0.70) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 8], (0.40 + 0.80) * 0.5, 1e-6));
        assert(closeTo(dst[0][ 9], (0.45 + 0.90) * 0.5, 1e-6));
        assert(closeTo(dst[0][10], (0.50 + 1.00) * 0.5, 1e-6));
        assert(closeTo(dst[0][11], (0.55 + 0.90) * 0.5, 1e-6));
        assert(closeTo(dst[0][12], (0.60 + 0.80) * 0.5, 1e-6));
        assert(closeTo(dst[0][13], (0.65 + 0.70) * 0.5, 1e-6));
        assert(closeTo(dst[0][14], (0.70 + 0.60) * 0.5, 1e-6));
        assert(closeTo(dst[0][15], (0.75 + 0.50) * 0.5, 1e-6));
        assert(closeTo(dst[0][16], (0.80 + 0.40) * 0.5, 1e-6));
        assert(closeTo(dst[0][17], (0.85 + 0.30) * 0.5, 1e-6));
        assert(closeTo(dst[0][18], (0.90 + 0.20) * 0.5, 1e-6));
      });
    });
  });
});
describe("pan(src: number[], l: number, r: number): number[]", () => {
  const L = 0.1, R = 0.2, C = 0.3, LFE = 0.4, SL = 0.5, SR = 0.6;
  const PAN_L = Math.cos(0.25 * Math.PI);
  const PAN_R = Math.sin(0.25 * Math.PI);

  it("1", () => {
    let src = [ C ];
    let dst = render.util.pan[1](src, PAN_L, PAN_R);

    assert(dst.length === 2);
    assert(closeTo(dst[0], C * PAN_L, 1e-6));
    assert(closeTo(dst[1], C * PAN_R, 1e-6));
  });
  it("2", () => {
    let src = [ L, R ];
    let dst = render.util.pan[2](src, PAN_L, PAN_R);

    assert(dst.length === 2);
    assert(closeTo(dst[0], (L + R) * 0.5 * PAN_L, 1e-6));
    assert(closeTo(dst[1], (L + R) * 0.5 * PAN_R, 1e-6));
  });
  it("4", () => {
    let src = [ L, R, SL, SR ];
    let dst = render.util.pan[4](src, PAN_L, PAN_R);

    assert(dst.length === 4);
    assert(closeTo(dst[0], (L + R) * 0.5 * PAN_L, 1e-6));
    assert(closeTo(dst[1], (L + R) * 0.5 * PAN_R, 1e-6));
    assert(closeTo(dst[2], (SL + SR) * 0.5 * PAN_L, 1e-6));
    assert(closeTo(dst[3], (SL + SR) * 0.5 * PAN_R, 1e-6));
  });
  it("6", () => {
    let src = [ L, R, C, LFE, SL, SR ];
    let dst = render.util.pan[6](src, PAN_L, PAN_R);

    assert(dst.length === 6);
    assert(closeTo(dst[0], (L + R) * 0.5 * PAN_L, 1e-6));
    assert(closeTo(dst[1], (L + R) * 0.5 * PAN_R, 1e-6));
    assert(closeTo(dst[2], C, 1e-6));
    assert(closeTo(dst[3], LFE, 1e-6));
    assert(closeTo(dst[4], (SL + SR) * 0.5 * PAN_L, 1e-6));
    assert(closeTo(dst[5], (SL + SR) * 0.5 * PAN_R, 1e-6));
  });
});
describe("mix(src: Float32Array[], dst: Float32Array[]): void", () => {
  it("1->1", () => {
    let src = [
      new Float32Array([ 0 ]),
    ];
    let dst = [
      new Float32Array(1),
    ];

    render.util.mix["1->1"](src, dst);

    assert.deepEqual(dst[0], src[0]);
  });
  it("1->2", () => {
    let src = [
      new Float32Array([ 0 ]),
    ];
    let dst = [
      new Float32Array(1),
      new Float32Array(1),
    ];

    render.util.mix["1->2"](src, dst);

    assert.deepEqual(dst[0], src[0]);
    assert.deepEqual(dst[1], src[0]);
  });
  it("1->4", () => {
    let src = [
      new Float32Array([ 0 ]),
    ];
    let dst = [
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
    ];

    render.util.mix["1->4"](src, dst);

    assert.deepEqual(dst[0], src[0]);
    assert.deepEqual(dst[1], src[0]);
    assert.deepEqual(dst[2], new Float32Array(1));
    assert.deepEqual(dst[3], new Float32Array(1));
  });
  it("1->6", () => {
    let src = [
      new Float32Array([ 0 ]),
    ];
    let dst = [
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
    ];

    render.util.mix["1->6"](src, dst);

    assert.deepEqual(dst[0], new Float32Array(1));
    assert.deepEqual(dst[1], new Float32Array(1));
    assert.deepEqual(dst[2], src[0]);
    assert.deepEqual(dst[3], new Float32Array(1));
    assert.deepEqual(dst[4], new Float32Array(1));
    assert.deepEqual(dst[5], new Float32Array(1));
  });
  it("2->2", () => {
    let src = [
      new Float32Array([ 0 ]),
      new Float32Array([ 1 ]),
    ];
    let dst = [
      new Float32Array(1),
      new Float32Array(1),
    ];

    render.util.mix["2->2"](src, dst);

    assert.deepEqual(dst[0], src[0]);
    assert.deepEqual(dst[1], src[1]);
  });
  it("2->4", () => {
    let src = [
      new Float32Array([ 0 ]),
      new Float32Array([ 1 ]),
    ];
    let dst = [
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
    ];

    render.util.mix["2->4"](src, dst);

    assert.deepEqual(dst[0], src[0]);
    assert.deepEqual(dst[1], src[1]);
    assert.deepEqual(dst[2], new Float32Array(1));
    assert.deepEqual(dst[3], new Float32Array(1));
  });
  it("2->6", () => {
    let src = [
      new Float32Array([ 0 ]),
      new Float32Array([ 1 ]),
    ];
    let dst = [
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
      new Float32Array(1),
    ];

    render.util.mix["2->6"](src, dst);

    assert.deepEqual(dst[0], src[0]);
    assert.deepEqual(dst[1], src[1]);
    assert.deepEqual(dst[2], new Float32Array(1));
    assert.deepEqual(dst[3], new Float32Array(1));
    assert.deepEqual(dst[4], new Float32Array(1));
    assert.deepEqual(dst[5], new Float32Array(1));
  });
});
it("4->4", () => {
  let src = [
    new Float32Array([ 0 ]),
    new Float32Array([ 1 ]),
    new Float32Array([ 2 ]),
    new Float32Array([ 3 ]),
  ];
  let dst = [
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
  ];

  render.util.mix["4->4"](src, dst);

  assert.deepEqual(dst[0], src[0]);
  assert.deepEqual(dst[1], src[1]);
  assert.deepEqual(dst[2], src[2]);
  assert.deepEqual(dst[3], src[3]);
});
it("4->6", () => {
  let src = [
    new Float32Array([ 0 ]),
    new Float32Array([ 1 ]),
    new Float32Array([ 2 ]),
    new Float32Array([ 3 ]),
  ];
  let dst = [
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
  ];

  render.util.mix["4->6"](src, dst);

  assert.deepEqual(dst[0], src[0]);
  assert.deepEqual(dst[1], src[1]);
  assert.deepEqual(dst[2], new Float32Array(1));
  assert.deepEqual(dst[3], new Float32Array(1));
  assert.deepEqual(dst[4], src[2]);
  assert.deepEqual(dst[5], src[3]);
});
it("6->6", () => {
  let src = [
    new Float32Array([ 0 ]),
    new Float32Array([ 1 ]),
    new Float32Array([ 2 ]),
    new Float32Array([ 3 ]),
    new Float32Array([ 4 ]),
    new Float32Array([ 5 ]),
  ];
  let dst = [
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
    new Float32Array(1),
  ];

  render.util.mix["6->6"](src, dst);

  assert.deepEqual(dst[0], src[0]);
  assert.deepEqual(dst[1], src[1]);
  assert.deepEqual(dst[2], src[2]);
  assert.deepEqual(dst[3], src[3]);
  assert.deepEqual(dst[4], src[4]);
  assert.deepEqual(dst[5], src[5]);
});
describe("mix1(src: number[]): number[]", () => {
  const L = 0.1, R = 0.2, C = 0.3, LFE = 0.4, SL = 0.5, SR = 0.6;

  it("nop", () => {
    let src = [ L, C, R ];
    let dst = render.util.mix1.nop(src);

    assert(src === dst);
  });
  it("1->2", () => {
    let src = [ C ];
    let dst = render.util.mix1["1->2"](src);

    assert(dst.length === 2);
    assert(dst[0] === C);
    assert(dst[1] === C);
  });
  it("1->4", () => {
    let src = [ C ];
    let dst = render.util.mix1["1->4"](src);

    assert(dst.length === 4);
    assert(dst[0] === C);
    assert(dst[1] === C);
    assert(dst[2] === 0);
    assert(dst[3] === 0);
  });
  it("1->6", () => {
    let src = [ C ];
    let dst = render.util.mix1["1->6"](src);

    assert(dst.length === 6);
    assert(dst[0] === 0);
    assert(dst[1] === 0);
    assert(dst[2] === C);
    assert(dst[3] === 0);
    assert(dst[4] === 0);
    assert(dst[5] === 0);
  });
  it("2->4", () => {
    let src = [ L, R ];

    let dst = render.util.mix1["2->4"](src);

    assert(dst.length === 4);
    assert(dst[0] === L);
    assert(dst[1] === R);
    assert(dst[2] === 0);
    assert(dst[3] === 0);
  });
  it("2->6", () => {
    let src = [ L, R ];
    let dst = render.util.mix1["2->6"](src);

    assert(dst.length === 6);
    assert(dst[0] === L);
    assert(dst[1] === R);
    assert(dst[2] === 0);
    assert(dst[3] === 0);
    assert(dst[4] === 0);
    assert(dst[5] === 0);
  });
  it("4->6", () => {
    let src = [ L, R, SL, SR ];
    let dst = render.util.mix1["4->6"](src);

    assert(dst.length === 6);
    assert(dst[0] === L);
    assert(dst[1] === R);
    assert(dst[2] === 0);
    assert(dst[3] === 0);
    assert(dst[4] === SL);
    assert(dst[5] === SR);
  });
  it("2->1", () => {
    let src = [ L, R ];
    let dst = render.util.mix1["2->1"](src);

    assert(dst.length === 1);
    assert(closeTo(dst[0], 0.5 * (L + R), 1e-6));
  });
  it("4->1", () => {
    let src = [ L, R, SL, SR ];

    let dst = render.util.mix1["4->1"](src);

    assert(dst.length === 1);
    assert(closeTo(dst[0], 0.25 * (L + R + SL + SR), 1e-6));
  });
  it("6->1", () => {
    let src = [ L, R, C, LFE, SL, SR ];
    let dst = render.util.mix1["6->1"](src);

    assert(dst.length === 1);
    assert(closeTo(dst[0], 0.7071 * (L + R) + C + 0.5 * (SL + SR), 1e-6));
  });
  it("4->2", () => {
    let src = [ L, R, SL, SR ];

    let dst = render.util.mix1["4->2"](src);

    assert(dst.length === 2);
    assert(closeTo(dst[0], 0.5 * (L + SL), 1e-6));
    assert(closeTo(dst[1], 0.5 * (R + SR), 1e-6));
  });
  it("6->2", () => {
    let src = [ L, R, C, LFE, SL, SR ];
    let dst = render.util.mix1["6->2"](src);

    assert(dst.length === 2);
    assert(closeTo(dst[0], L + 0.7071 * (C + SL), 1e-6));
    assert(closeTo(dst[1], R + 0.7071 * (C + SR), 1e-6));
  });
  it("6->4", () => {
    let src = [ L, R, C, LFE, SL, SR ];
    let dst = render.util.mix1["6->4"](src);

    assert(dst.length === 4);
    assert(closeTo(dst[0], L + 0.7071 * C, 1e-6));
    assert(closeTo(dst[1], R + 0.7071 * C, 1e-6));
    assert(closeTo(dst[2], SL, 1e-6));
    assert(closeTo(dst[3], SR, 1e-6));
  });
});
