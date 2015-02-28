"use strict";

import Sequence from "./sequence";
import Tape from "./tape";

let { silence, concat, mix } = Tape;

export default (Tape) => {
  return { Sequence, Tape, silence, concat, mix };
};
