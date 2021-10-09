let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let res = 100;
function closestMultiple(n, x) {
    if (x > n)
        return x;
    n = n + (x / 2);
    n = n - (n % x);
    return n;
}
let dumpPos = () => console.log(`camera.x = ${camera.x}; camera.y = ${camera.y}; camera.z = ${camera.z}; yaw = ${yaw}; pitch = ${pitch}`);
let chunkCount = Math.floor(Math.sqrt(navigator.hardwareConcurrency)) || 2;
let chunkRes = closestMultiple(res, chunkCount) / chunkCount;
canvas.width = chunkCount * chunkRes;
canvas.height = chunkCount * chunkRes;
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
    shift: false,
    ctrl: false,
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
let pythag = (pos1, pos2 = Position.zero) => Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z);
let rotate = (pos, yaw, pitch) => {
    let newPitch = new Position(pos.x * Math.cos(deg2rad(pitch)) + pos.y * -Math.sin(deg2rad(pitch)) + 0, pos.x * Math.sin(deg2rad(pitch)) + pos.y * Math.cos(deg2rad(pitch)) + 0, 0 + 0 + pos.z);
    let newYaw = new Position(newPitch.x * Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)), 0 + newPitch.y + 0, newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)));
    return newYaw;
};
let normalize = (vector) => {
    let length = pythag(new Position(0, 0, 0), vector) || 1;
    return new Position(vector.x / length, vector.y / length, vector.z / length);
};
var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["sphere"] = 0] = "sphere";
    ShapeType[ShapeType["plane"] = 1] = "plane";
    ShapeType[ShapeType["box"] = 2] = "box";
    ShapeType[ShapeType["torus"] = 3] = "torus";
    ShapeType[ShapeType["mandlebulb"] = 4] = "mandlebulb";
})(ShapeType || (ShapeType = {}));
let objects = [
    // {
    //     type: ShapeType.plane,
    //     position: new Position(20,0,1),
    //     angle: new Position(0,1,0),
    //     h: 1,
    // },
    // {
    //     type: ShapeType.box,
    //     position: new Position(0,0,0),
    //     angle: new Position(1,1,1),
    //     b: new Position(50,50,50),
    //     //color: {r: 0, b: 0, g: 0}
    // },
    {
        type: ShapeType.box,
        position: new Position(5, 0, 0),
        //angle: {roll: 0, pitch: 0, yaw: 0 },
        b: new Position(1, 1, 1),
        color: { r: 255, b: 168, g: 237 },
    },
    // {
    //     type: ShapeType.torus,
    //     position: new Position(5,0,0),
    //     angle: {roll: 45, pitch: 0, yaw: 0 },
    //     minor: .5,//new Position(1,1,0),
    //     major: 1,
    //     color: {r: 255, b: 168, g: 237},
    // },
    // {
    //     type: ShapeType.mandlebulb,
    //     position: new Position(10,0,0),
    //     color: {r: 255, b: 168, g: 237},
    // },
    // {
    //     type: ShapeType.sphere,
    //     position: new Position(5,0,0),
    //     radius: 1,
    //     color: {r: 1, b: 1, g: 1}
    // },
];
for (let i = 0; i < 360; i += 10) {
    objects.push({
        type: ShapeType.sphere,
        position: new Position(20 * Math.cos(deg2rad(i)), 0, 20 * Math.sin(deg2rad(i))),
        radius: 1,
        color: { r: Math.random() * 255, b: Math.random() * 255, g: Math.random() * 255 }
    });
}
let roll = 0;
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
                roll: roll,
                chunkCount: chunkCount,
                channels: 4,
                camera: camera,
                objects: objects,
            });
        });
        time = performance.now();
    }
}
let moveSpeed = 1;
let rotSpeed = .5;
let sprintSpeed = 2;
let sprinting = 1;
let chunkStats = document.getElementById("chunkStats");
let move = Position.zero;
function main() {
    let delta = (performance.now() - time) / 1000;
    document.getElementById("frametime").innerHTML = delta.toString();
    chunkStats.innerHTML = "%: ";
    chunks.forEach((chunk) => {
        chunkStats.innerHTML += `${chunk.ready ? "#" : ""}`;
    });
    move.x = 0;
    move.y = 0;
    move.z = 0;
    if (keys.shift) {
        sprinting = sprintSpeed;
    }
    else {
        sprinting = 1;
    }
    if (keys.w) {
        move.x++;
    }
    if (keys.a) {
        move.z--;
    }
    if (keys.d) {
        move.z++;
    }
    if (keys.s) {
        move.x--;
    }
    move = normalize(rotate(move, yaw, 0));
    if (keys.space) {
        move.y += .5;
    }
    if (keys.ctrl) {
        move.y -= .5;
    }
    camera.x += move.x * moveSpeed * sprintSpeed * delta;
    camera.y += move.y * moveSpeed * sprintSpeed * delta;
    camera.z += move.z * moveSpeed * sprintSpeed * delta;
    if (keys.left) {
        yaw += 1 * rotSpeed;
    }
    if (keys.right) {
        yaw -= 1 * rotSpeed;
    }
    if (keys.up) {
        pitch += 1 * rotSpeed;
    }
    if (keys.down) {
        pitch -= 1 * rotSpeed;
    }
    draw();
    window.requestAnimationFrame(main);
}
main();
document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
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
        case "arrowdown":
            keys.down = true;
            e.preventDefault();
            break;
        case "arrowup":
            keys.up = true;
            e.preventDefault();
            break;
        case "arrowleft":
            keys.left = true;
            e.preventDefault();
            break;
        case "arrowright":
            keys.right = true;
            e.preventDefault();
            break;
        case "shift":
            keys.shift = true;
            break;
        case "control":
            keys.ctrl = true;
            break;
        case " ":
            keys.space = true;
            e.preventDefault();
            break;
        default:
            break;
    }
});
document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
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
        case "arrowdown":
            keys.down = false;
            e.preventDefault();
            break;
        case "arrowup":
            keys.up = false;
            e.preventDefault();
            break;
        case "arrowleft":
            keys.left = false;
            e.preventDefault();
            break;
        case "arrowright":
            keys.right = false;
            e.preventDefault();
            break;
        case "shift":
            keys.shift = false;
            break;
        case "control":
            keys.ctrl = false;
            break;
        case " ":
            keys.space = false;
            e.preventDefault();
            break;
        default:
            break;
    }
});
for (let i = 0; i < 8; i++) {
    document.getElementById(i.toString()).addEventListener("pointerdown", function () {
        switch (parseInt(this.id)) {
            case 0:
                keys.w = true;
                break;
            case 1:
                keys.a = true;
                break;
            case 2:
                keys.s = true;
                break;
            case 3:
                keys.d = true;
                break;
            case 4:
                keys.up = true;
                break;
            case 5:
                keys.down = true;
                break;
            case 6:
                keys.left = true;
                break;
            case 7:
                keys.right = true;
                break;
            default:
                break;
        }
    });
    document.getElementById(i.toString()).addEventListener("pointerup", function () {
        switch (parseInt(this.id)) {
            case 0:
                keys.w = false;
                break;
            case 1:
                keys.a = false;
                break;
            case 2:
                keys.s = false;
                break;
            case 3:
                keys.d = false;
                break;
            case 4:
                keys.up = false;
                break;
            case 5:
                keys.down = false;
                break;
            case 6:
                keys.left = false;
                break;
            case 7:
                keys.right = false;
                break;
            default:
                break;
        }
    });
}
//# sourceMappingURL=index.js.map