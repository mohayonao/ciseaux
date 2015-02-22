:feelsgood: work in progress

# tape-buffer
[![Build Status](http://img.shields.io/travis/mohayonao/tape-buffer.svg?style=flat-square)](https://travis-ci.org/mohayonao/tape-buffer)
[![NPM Version](http://img.shields.io/npm/v/tape-buffer.svg?style=flat-square)](https://www.npmjs.org/package/tape-buffer)
[![Bower](http://img.shields.io/bower/v/tape-buffer.svg?style=flat-square)](http://bower.io/search/?q=tape-buffer)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> utility to chop an audio buffer, inspired from [youpy/scissor](https://github.com/youpy/scissor)

## Installation

bower:

```
bower install tape-buffer
```

npm:

```
npm install tape-buffer
```

downloads:

- [tape-buffer](https://raw.githubusercontent.com/mohayonao/tape-buffer/master/build/tape-buffer)
- [tape-buffer.min.js](https://raw.githubusercontent.com/mohayonao/tape-buffer/master/build/tape-buffer.min.js)

## API

### TapeBuffer
- `from(buffers: Float32Array[], sampleRate: number)`
- `from(audioBuffer: AudioBuffer)`

#### Instance attributes
- `sampleRate: number` _readonly_
- `length: number` _readonly_
- `duration: number` _readonly_
- `numberOfChannels` _readonly_

#### Instance methods
- `concat(...others: TapeBuffer): TapeBuffer`
- `reverse(): TapeBuffer`
- `loop(count: number): TapeBuffer`
- `slice(begin: number, end: number): TapeBuffer`
- `split(n: number): TapeBuffer[]`
- `toAudioBuffer(audioContext: AudioContext): AudioBuffer`

## Examples

## License

[MIT](http://mohayonao.mit-license.org/)
