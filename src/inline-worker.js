const WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

export class InlineWorker {
  constructor(func, self) {
    if (WORKER_ENABLED) {
      let functionBody = func.toString().trim().match(
        /^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/
      )[1];
      let url = global.URL.createObjectURL(new global.Blob([ functionBody ], { type: "text/javascript" }));

      return new global.Worker(url);
    }

    this.self = self;
    this.self.postMessage = (data) => {
      setTimeout(() => {
        this.onmessage({ data });
      }, 0);
    };

    setTimeout(() => {
      func.call(self);
    }, 0);
  }

  postMessage(data) {
    setTimeout(() => {
      this.self.onmessage({ data });
    }, 0);
  }
}

export default InlineWorker;
