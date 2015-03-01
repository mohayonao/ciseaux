"use strict";

import Sequence from "./sequence";
import Tape, {TapeConstructor} from "./tape";

let { silence, concat, mix } = Tape;

export default { Sequence, Tape: TapeConstructor, silence, concat, mix };
