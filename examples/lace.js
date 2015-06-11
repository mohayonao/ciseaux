var fs = require("fs");
var path = require("path");
var Ciseaux = require("../node");

function edit(tape1, tape2) {
  return Ciseaux.concat(tape1.split(32).map(function(tape, index) {
    return index % 2 ? tape2.pitch(2).fill(tape.duration) : tape;
  })).fill(30);
}

Promise.all([
  "tape1.wav",
  "tape2.wav",
].map(function(filename) {
  var filepath = path.normalize(__dirname + "/../sound/" + filename);
  return Ciseaux.from(filepath);
})).then(function(result) {
  return edit(result[0], result[1]).render();
}).then(function(buffer) {
  var filepath = __filename.replace(/\.js$/, ".wav");

  fs.writeFile(filepath, buffer, function(err) {
    if (err) {
      throw err;
    }
    console.log("write to: " + filepath);
  });
}).catch(function(e) {
  console.error(e);
});
