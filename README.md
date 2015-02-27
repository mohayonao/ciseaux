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

## :scissors: Examples
```js
var tape = new Ciseaux.Tape(audioBuffer);

var stutter = tape.split(100).map(function(tape) {
  return tape.loop(4);
});

Ciseaux.concat(stutter).render(audioContext).then(function(audioBuffer) {
  play(audioBuffer);
});
```

```js
var seq = new Ciseaux.Sequence("x y  xyz", 0.2);

var tape = seq.apply({
  x: foo,
  y: function() {
    return bar;
  },
  z: foo.reverse().
}).loop(4).render(audioContext).then(function(audioBuffer) {
  play(audioBuffer);
});
```

## :scissors: License

[MIT](http://mohayonao.mit-license.org/)
