# ciseaux
[![Build Status](http://img.shields.io/travis/mohayonao/ciseaux.svg?style=flat-square)](https://travis-ci.org/mohayonao/ciseaux)
[![NPM Version](http://img.shields.io/npm/v/ciseaux.svg?style=flat-square)](https://www.npmjs.org/package/ciseaux)
[![Bower](http://img.shields.io/bower/v/ciseaux.svg?style=flat-square)](http://bower.io/search/?q=ciseaux)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> JavaScript utility to chop an audio buffer, inspired from [youpy/scissor](https://github.com/youpy/scissor)

## :scissors: Installation

bower:

```
bower install ciseaux
```

npm:

```
npm install ciseaux
```

downloads:

- [ciseaux.js](https://raw.githubusercontent.com/mohayonao/ciseaux/master/build/ciseaux.js)
- [ciseaux.min.js](https://raw.githubusercontent.com/mohayonao/ciseaux/master/build/ciseaux.min.js)

## :scissors: API
- `Ciseaux.silence(duration: number): Tape`
- `Ciseaux.concat(...tapes: Tape): Tape`
- `Ciseaux.mix(...tapes: Tape, [method='silence']): Tape`

### Ciseaux.Tape
- `constructor(audioBuffer: AudioBuffer)`

#### Instance attributes
- `sampleRate: number` _readonly_
- `length: number` _readonly_
- `duration: number` _readonly_
- `numberOfChannels` _readonly_
- `numberOfTracks` _readonly_

#### Instance methods
- `gain(gain: number = 1): Tape`
- `pan(pan: number = 0): Tape`
- `reverse(): Tape`
- `pitch(rate: number = 1): Tape`
- `stretch(rate: number = 1): Tape`
  - _not implemented (Pull Request please)_
- `concat(...tapes: Tape): Tape`
- `slice(startTime: number = 0, duration: number = inf): Tape`
- `loop(n: number = 2): Tape`
- `fill(duration: number): Tape`
- `replace(startTime: number = 0, duration: number = 0, tape: Tape = null): Tape`
- `split(n: number = 2): Tape[]`
- `mix(...tapes: Tape, [method = 'silence']): Tape`
- `render(audioContext: AudioContext): Promise<AudioBuffer>`
- `dispose(): void`

### Ciseaux.Sequence
- `constructor(pattern: string, durationPerStep: number)`

### Instance methods
- `apply(instruments: object): Tape`

## :scissors: Usage
```js
tape = new Ciseaux.Tape(audioBuffer);

tape = Ciseaux.concat([ tape.slice(10, 1), tape.slice(2, 3) ]).loop(4);

tape.render(audioContext).then(function(audioBuffer) {
  var bufSrc = audioContext.createBuffer();

  bufSrc.buffer = audioBuffer;
  bufSrc.start(audioContext.currentTime);
  bufSrc.connect();
});
```

## :scissors: Examples

[ciseaux - web examples](http://mohayonao.github.io/ciseaux/)

#### slice + concat
```js
tape = tape2.slice(0, 1.5).concat(tape3.slice(0, 0.5), tape1.slice(-2));
```

#### slice + concat + loop
```js
tape = tape3.slice(0, 0.5).concat(Ciseaux.silence(0.5)).loop(4);
```

#### replace + reverse
```js
tape = tape1.replace(2, 3, function(tape) {
  return tape.reverse();
});
```

#### gain
```js
tape = Ciseaux.concat(tape1.split(128).map(function(tape, i) {
  return tape.gain(i / 128);
}));
```

#### pan
```js
tape = Ciseaux.concat(tape1.split(25).map(function(tape, i) {
  return tape.pan(i % 2 ? -0.85 : +0.85);
}));
```

#### pitch
```js
tape = Ciseaux.concat(tape1.split(128).map(function(tape, i) {
  return tape.pitch(i / 128 + 0.5);
}));
```

#### mix
```js
tape = tape1.mix(tape2.gain(0.5), "fill");
```

#### stutter
```js
tape = Ciseaux.concat(tape2.split(64).map(function(tape) {
  return tape.loop(4).pitch(2);
}));
```

#### phase
```js
tape = Ciseaux.mix([ 1, 0.95 ].map(function(rate) {
  return tape2.pitch(rate).fill(10);
}));
```

#### lace
```js
tape = Ciseaux.concat(tape1.split(32).map(function(tape, index) {
  return index % 2 ? tape2.pitch(2).fill(tape.duration) : tape;
}));
```

#### concrete
```js
tape = Ciseaux.mix([ -3, 0, 4, 7 ].map(function(midi) {
  return tape1.pitch(Math.pow(2, midi * 1/12)).fill(10);
})).gain(0.5);
```

#### sequence

```js
tape = new Ciseaux.Sequence("a bdacbba babfeg", 0.2)
  .apply({
    a: tape1.split(16)[0],
    b: tape1.split(16)[1],
    c: tape1.split(16)[2],
    d: tape1.split(16)[3].gain(0.15),
    e: tape2.split(16)[4].pitch(0.25),
    f: tape2.split(16)[5].pitch(4).gain(0.1),
    g: tape3.pitch(32),
  }).loop(4);
```

## :scissors: License

[MIT](http://mohayonao.mit-license.org/)
