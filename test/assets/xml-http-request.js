import fs from "fs";

export class XMLHttpRequest {
  constructor() {
    this.url = "";
    this.status = 0;
    this.statusText = "";
  }

  open(method, url) {
    this.url = url;
  }

  send() {
    fs.readFile(this.url, (err, data) => {
      if (err) {
        this.status = 404;
        this.statusText = "Not Found";
        if (typeof this.onerror === "function") {
          this.onerror(err);
        }
      } else {
        this.status = 200;
        this.statusText = "OK";
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
