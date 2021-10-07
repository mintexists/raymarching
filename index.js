let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let chunks = 2;
let chunkW = canvas.width / chunks;
let chunkH = canvas.height / chunks;
let imageDatas = [];
for (let y = 0; y < chunks; y++) {
    for (let x = 0; x < chunks; x++) {
        imageDatas.push(ctx.getImageData(x * chunkW, y * chunkH, chunkW, chunkH));
    }
}
var worker0 = new Worker("worker.js");
imageDatas.forEach((img_data) => {
    worker0.postMessage({
        pixels: img_data.data.buffer,
        width: canvas.width,
        height: canvas.height,
        channels: 4
    }, [img_data.data.buffer]);
});
//# sourceMappingURL=index.js.map