let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let chunkCount = Math.floor(Math.sqrt(navigator.hardwareConcurrency)) || 2;
let chunkW = canvas.width / chunkCount;
let chunkH = canvas.height / chunkCount;
let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false
};
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
class Position {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
Position.zero = new Position(0, 0, 0);
Position.forward = new Position(1, 0, 0);
Position.back = new Position(-1, 0, 0);
Position.up = new Position(0, 1, 0);
Position.down = new Position(0, -1, 0);
Position.left = new Position(0, 0, -1);
Position.right = new Position(0, 0, 1);
let rad2deg = (rad) => (180 / Math.PI) * rad;
let deg2rad = (deg) => deg * (Math.PI / 180);
let rotate = (pos, yaw, pitch) => {
    let newPitch = new Position(pos.x * Math.cos(deg2rad(pitch)) + pos.y * -Math.sin(deg2rad(pitch)) + 0, pos.x * Math.sin(deg2rad(pitch)) + pos.y * Math.cos(deg2rad(pitch)) + 0, 0 + 0 + pos.z);
    let newYaw = new Position(newPitch.x * Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)), 0 + newPitch.y + 0, newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)));
    return newYaw;
};
var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["sphere"] = 0] = "sphere";
    ShapeType[ShapeType["plane"] = 1] = "plane";
})(ShapeType || (ShapeType = {}));
let objects = [
    {
        type: ShapeType.sphere,
        position: new Position(20, 0, 0),
        radius: 1,
    },
    {
        type: ShapeType.plane,
        position: new Position(20, 0, 1),
        angle: new Position(0, 1, 0),
        h: 1,
    }
];
let pitch = 0;
let yaw = 0;
let camera = new Position(0, 0, 0);
let time = performance.now();
function draw() {
    if (chunks.every((chunk) => chunk.ready)) {
        chunks.forEach((chunk) => {
            ctx.putImageData(chunk.getPixels(), chunk.x, chunk.y);
            chunk.postMessage({
                width: chunkW,
                height: chunkH,
                x: chunk.x,
                y: chunk.y,
                pitch: pitch,
                yaw: yaw,
                channels: 4,
                camera: camera,
                objects: objects,
            });
        });
        time = performance.now();
    }
}
function main() {
    let delta = (time - performance.now()) / 1000;
    if (keys.w) {
        let move = rotate(new Position(1, 0, 0), yaw, 0);
        camera.x += move.x;
        camera.y += move.y;
        camera.z += move.z;
    }
    if (keys.a) {
        let move = rotate(new Position(0, 0, -1), yaw, 0);
        camera.x += move.x;
        camera.y += move.y;
        camera.z += move.z;
    }
    if (keys.d) {
        let move = rotate(new Position(0, 0, 1), yaw, 0);
        camera.x += move.x;
        camera.y += move.y;
        camera.z += move.z;
    }
    if (keys.s) {
        let move = rotate(new Position(-1, 0, 0), yaw, 0);
        camera.x += move.x;
        camera.y += move.y;
        camera.z += move.z;
    }
    if (keys.left) {
        yaw += 5;
    }
    if (keys.right) {
        yaw -= 5;
    }
    if (keys.up) {
        pitch += 5;
    }
    if (keys.down) {
        pitch -= 5;
    }
    if (keys.space) {
        camera.y += .5;
    }
    if (keys.shift) {
        camera.y -= .5;
    }
    draw();
    window.requestAnimationFrame(main);
}
main();
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case "w":
            keys.w = true;
            break;
        case "a":
            keys.a = true;
            break;
        case "s":
            keys.s = true;
            break;
        case "d":
            keys.d = true;
            break;
        case "ArrowDown":
            keys.down = true;
            break;
        case "ArrowUp":
            keys.up = true;
            break;
        case "ArrowLeft":
            keys.left = true;
            break;
        case "ArrowRight":
            keys.right = true;
        case "Shift":
            keys.shift = true;
            break;
        case " ":
            keys.space = true;
            break;
        default:
            break;
    }
});
document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case "w":
            keys.w = false;
            break;
        case "a":
            keys.a = false;
            break;
        case "s":
            keys.s = false;
            break;
        case "d":
            keys.d = false;
            break;
        case "ArrowDown":
            keys.down = false;
            break;
        case "ArrowUp":
            keys.up = false;
            break;
        case "ArrowLeft":
            keys.left = false;
            break;
        case "ArrowRight":
            keys.right = false;
        case "Shift":
            keys.shift = false;
            break;
        case " ":
            keys.space = false;
            break;
        default:
            break;
    }
});
//# sourceMappingURL=index.js.map