"use strict";

import fs from "fs";

export class XMLHttpRequest {
  constructor() {
    this.url = "";
  }

  open(method, url) {
    this.url = url;
  }

  send() {
    fs.readFile(this.url, (err, data) => {
      if (err) {
        [ this.status, this.statusText ] = [ 404, "Not Found" ];
        if (typeof this.onerror === "function") {
          this.onerror(err);
        }
      } else {
        [ this.status, this.statusText ] = [ 200, "OK" ];
        if (typeof this.onload === "function") {
          if (this.responseType === "arraybuffer") {
            this.response = new Uint8Array(data).buffer;
          } else {
            this.response = data.toString();
          }
          this.onload();
        }
      }
    });
  }
}

export default XMLHttpRequest;
