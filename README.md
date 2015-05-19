# ciseaux
[![Build Status](http://img.shields.io/travis/mohayonao/ciseaux.svg?style=flat-square)](https://travis-ci.org/mohayonao/ciseaux)
[![NPM Version](http://img.shields.io/npm/v/ciseaux.svg?style=flat-square)](https://www.npmjs.org/package/ciseaux)
[![Bower](http://img.shields.io/bower/v/ciseaux.svg?style=flat-square)](http://bower.io/search/?q=ciseaux)
[![Coverage Status](http://img.shields.io/coveralls/mohayonao/ciseaux.svg?style=flat-square)](https://coveralls.io/r/mohayonao/ciseaux?branch=master)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> JavaScript utility to chop an audio buffer, inspired from [youpy/scissor](https://github.com/youpy/scissor)

## :scissors: Demo

- [Ciseaux - JavaScript utility to chop an audio buffer : online examples](http://mohayonao.github.io/ciseaux/)

## :scissors: Documents

- [Getting Started](https://github.com/mohayonao/ciseaux/wiki/Getting-Started)
- [Editor's CheatSheet](https://github.com/mohayonao/ciseaux/wiki/Editor's-CheatSheet)

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
- `Ciseaux.from(src: ArrayBuffer|string, [audioContext: AudioContext]): Promise<Tape>`
- `Ciseaux.silence(duration: number): Tape`
- `Ciseaux.concat(...tapes: Tape): Tape`
- `Ciseaux.mix(...tapes: Tape, [method='silence']): Tape`

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
Utility class for creating a sequence tape that is concatenated tapes

- `constructor(...args: any)`
  - `pattern: string`
  - `durationPerStep: number|number[]`  
  - `instruments: object`

### Instance methods
- `apply(...args: any): Tape`
  - `pattern: string`
  - `durationPerStep: number|number[]`  
  - `instruments: object`

## :scissors: Usage
```js
// create a tape instance from the url
Ciseaux.from("/path/to/audio.wav").then(function(tape) {
  // edit tape
  tape = Ciseaux.concat([ tape.slice(10, 1), tape.slice(2, 3) ]).loop(4);

  // render the tape to an AudioBuffer
  return tape.render(audioContext);
}).then(function(audioBuffer) {
  play(audioBuffer);
});
```

## :scissors: Examples

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
tape = Ciseaux.concat(tape1.split(25).map(function(tape, i) {
  return tape.gain(i / 25);
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
tape = Ciseaux.concat(tape1.split(25).map(function(tape, i) {
  return tape.pitch(i / 50 + 0.75);
}));
```

#### mix
```js
tape = tape1.mix(tape2.gain(0.5), "fill").fill(30);
```

#### stutter
```js
tape = Ciseaux.concat(tape2.split(16).map(function(tape) {
  return tape.loop(4).pitch(1.5);
})).fill(30);
```

#### phase
```js
tape = Ciseaux.mix([ 1, 0.95 ].map(function(rate) {
  return tape2.pitch(rate).fill(30);
}));
```

#### lace
```js
tape = Ciseaux.concat(tape1.split(32).map(function(tape, index) {
  return index % 2 ? tape2.pitch(2).fill(tape.duration) : tape;
})).fill(30);
```

#### concrete
```js
tape = Ciseaux.mix([ -12, -10, -7, -3, 0 ].map(function(midi) {
  return tape1.pitch(Math.pow(2, midi * 1/12));
}), "fill").gain(0.5).fill(30);
```

#### sequence

```js
tape = new Ciseaux.Sequence("a bdacbba babfeg", 0.2, {
  a: tape1.split(16)[0],
  b: tape1.split(16)[1],
  c: tape1.split(16)[2],
  d: tape1.split(16)[3].gain(0.15),
  e: tape2.split(16)[4].pitch(0.25),
  f: tape2.split(16)[5].pitch(4).gain(0.1),
  g: tape3.pitch(32),
}).apply().fill(30);
```

#### shuffled sequence

```js
tape = new Ciseaux.Sequence("a bdaabcaccbgabb", {
  a: tape1.split(16)[4],
  b: tape1.split(16)[1],
  c: tape1.split(16)[2],
  d: tape1.split(16)[3].gain(0.15),
  e: tape2.split(16)[4].pitch(0.25),
  f: tape2.split(16)[5].pitch(4).gain(0.1),
  g: tape3.pitch(32),
}).apply([ 2/3, 1/3 ].map(function(x) { return x * 0.3; })).fill(30);
```

## :scissors: Architecture
```
+---------------+     +----------------+                +-----------+
| new Tape()    | --> | Float32Array[] | -- transfer -> |           |
|               |     +----------------+                |           |
|               |                                       |           |
|               |     +----------------+                |           |
| Tape.render() | --> | JSON           | -- transfer -> | WebWorker |
+---------------+     +----------------+                |           |
                                                        |           |
+---------------+     +----------------+                |           |
| AudioBuffer   | <-- | Float32Array[] | <- transfer -- |           |
+---------------+     +----------------+                +-----------+
```

## :scissors: Developments

```sh
# Build : babel -> browserify -> uglify-js
npm run build

# Test : mocha + power-assert
npm run test

# Coverage : mocha + isparta
npm run cover

# Lint : eslint
npm run lint
```

## :scissors: Contributing

1. [Fork it!](https://github.com/mohayonao/ciseaux/fork)
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## :scissors: License

[MIT](http://mohayonao.mit-license.org/)
