let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let chunkCount = 2;
let chunkW = canvas.width / chunkCount;
let chunkH = canvas.height / chunkCount;
class Chunk {
    constructor(x, y, worker = "worker.js") {
        this.x = x * chunkW;
        this.y = y * chunkH;
        this.ready = true;
        this.worker = new Worker(worker);
        this.pixels = new ImageData(chunkW, chunkH);
        this.worker.addEventListener("message", (evt) => {
            this.pixels.data.set(evt.data.bytes);
            this.ready = true;
        });
    }
    postMessage(data) {
        this.worker.postMessage(data);
    }
    getPixels() {
        this.ready = false;
        return this.pixels;
    }
}
let chunks = [];
for (let y = 0; y < chunkCount; y++) {
    for (let x = 0; x < chunkCount; x++) {
        chunks.push(new Chunk(x, y));
    }
}
let checkReady = (chunk) => chunk.ready;
function draw() {
    if (chunks.every(checkReady)) {
        chunks.forEach((chunk) => {
            ctx.putImageData(chunk.getPixels(), chunk.x, chunk.y);
            chunk.postMessage({
                width: chunkW,
                height: chunkH,
                channels: 4
            });
        });
    }
    window.requestAnimationFrame(draw);
}
function main() {
    draw();
}
main();
//# sourceMappingURL=index.js.map