let canvas = document.getElementById("canvas") as HTMLCanvasElement
let ctx = canvas.getContext("2d")

let chunks = 2
let chunkW = canvas.width / chunks
let chunkH = canvas.height / chunks

let worker0 = new Worker("worker.js")

let pixels0 = new ImageData(chunkW, chunkH);
let pixels1 = new ImageData(chunkW, chunkH);
let pixels2 = new ImageData(chunkW, chunkH);
let pixels3 = new ImageData(chunkW, chunkH);


worker0.addEventListener( 'message', ( evt ) => {
    pixels0.data.set( evt.data.bytes );    
    ctx.putImageData( pixels0, 0 * chunkW, 0 * chunkH);
});

let worker1 = new Worker("worker.js")

worker1.addEventListener( 'message', ( evt ) => {
    pixels1.data.set( evt.data.bytes );    
    ctx.putImageData( pixels1, 1 * chunkW, 0 * chunkH);
});

let worker2 = new Worker("worker.js")

worker2.addEventListener( 'message', ( evt ) => {
    pixels2.data.set( evt.data.bytes );    
    ctx.putImageData( pixels2, 0 * chunkW, 1 * chunkH);
});

let worker3 = new Worker("worker.js")

worker3.addEventListener( 'message', ( evt ) => {
    pixels3.data.set( evt.data.bytes );    
    ctx.putImageData( pixels3, 1 * chunkW, 1 * chunkH);
});

function draw() {
    // let imageData0 = ctx.getImageData(0 * chunkW, 0 * chunkH, chunkW, chunkH)
    worker0.postMessage( {
        // pixels: pixel.data.buffer,
        width: chunkW,
        height: chunkH,
        channels: 4
    })//, [imageData0.data.buffer] )

    // let imageData1 = ctx.getImageData(1 * chunkW, 0 * chunkH, chunkW, chunkH)
    worker1.postMessage( {
        // pixels: imageData1.data.buffer,
        width: chunkW,
        height: chunkH,
        channels: 4
    })//, [imageData1.data.buffer] )
    

    // let imageData2 = ctx.getImageData(0 * chunkW, 1 * chunkH, chunkW, chunkH)
    worker2.postMessage( {
        // pixels: imageData2.data.buffer,
        width: chunkW,
        height: chunkH,
        channels: 4
    })//, [imageData2.data.buffer] )

    // let imageData3 = ctx.getImageData(1 * chunkW, 1 * chunkH, chunkW, chunkH)
    worker3.postMessage( {
        // pixels: imageData3.data.buffer,
        width: chunkW,
        height: chunkH,
        channels: 4
    })//, [imageData3.data.buffer] )
}

function main() {
    draw()
    window.requestAnimationFrame(main)
}

main()