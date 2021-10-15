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
    constructor(x, y, z = 0) {
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
    ShapeType[ShapeType["infPlane"] = 1] = "infPlane";
    ShapeType[ShapeType["box"] = 2] = "box";
    ShapeType[ShapeType["torus"] = 3] = "torus";
    ShapeType[ShapeType["mandlebulb"] = 4] = "mandlebulb";
    ShapeType[ShapeType["plane"] = 5] = "plane";
    ShapeType[ShapeType["subtract"] = 6] = "subtract";
    ShapeType[ShapeType["union"] = 7] = "union";
    ShapeType[ShapeType["intersect"] = 8] = "intersect";
    ShapeType[ShapeType["infinite"] = 9] = "infinite";
    ShapeType[ShapeType["hexagonalPrism"] = 10] = "hexagonalPrism";
})(ShapeType || (ShapeType = {}));
let objects = [
    // #region Shapes
    // {
    //     type: ShapeType.infPlane,
    //     position: new Position(0,0,0),
    //     angle: new Position(0,1,0),
    //     h: .5,
    //     color: {r: 181, g: 208, b: 224},
    // },
    // {
    //     type: ShapeType.box,
    //     position: new Position(0,0,0),
    //     angle: new Position(1,1,1),
    //     b: new Position(50,50,50),
    //     //color: {r: 0, b: 0, g: 0}
    // },
    // {
    //     type: ShapeType.box,
    //     position: new Position(5,0,0),
    //     //angle: {roll: 0, pitch: 0, yaw: 0 },
    //     b: new Position(1,1,1),
    //     color: {r: 255, b: 168, g: 237},
    // },
    // {
    //     type: ShapeType.plane,
    //     position: new Position(5,-1,0),
    //     //angle: {roll: 0, pitch: 0, yaw: 0 },
    //     b: new Position(50,50),
    //     color: {r: 255, b: 168, g: 237},
    // },
    //
    // {
    //     type: ShapeType.subtract,
    //     subtractor: {
    //         type: ShapeType.sphere,
    //         position: new Position(5,.5,-3),
    //         radius: 1,
    //         color: {r: 1, b: 1, g: 1}
    //     },
    //     subtractee: {
    //         type: ShapeType.box,
    //         position: new Position(5,0,-3),
    //         //angle: {roll: 0, pitch: 0, yaw: 0 
    //         b: new Position(1,1,1),
    //         color: {r: 255, b: 168, g: 237},
    //     },
    // },
    // {
    //     type: ShapeType.union,
    //     first: {
    //         type: ShapeType.sphere,
    //         position: new Position(5,.5,0),
    //         radius: 1,
    //         color: {r: 1, b: 1, g: 1}
    //     },
    //     second: {
    //         type: ShapeType.box,
    //         position: new Position(5,0,0),
    //         //angle: {roll: 0, pitch: 0, yaw: 0 
    //         b: new Position(1,1,1),
    //         color: {r: 255, b: 168, g: 237},
    //     },
    // },
    // {
    //     type: ShapeType.intersect,
    //     first: {
    //         type: ShapeType.sphere,
    //         position: new Position(5,.5,3),
    //         radius: 1,
    //         color: {r: 1, b: 1, g: 1}
    //     },
    //     second: {
    //         type: ShapeType.box,
    //         position: new Position(5,0,3),
    //         //angle: {roll: 0, pitch: 0, yaw: 0 
    //         b: new Position(1,1,1),
    //         color: {r: 255, b: 168, g: 237},
    //     },
    // },
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
    //     position: new Position(3,0,0),
    //     power: 2,
    //     iterations: 10,
    //     angle: {roll: 0, pitch:0, yaw: 0}
    //     // color: {r: 255, b: 168, g: 237},
    // },
    // {
    //     type: ShapeType.sphere,
    //     position: new Position(5,0,-3),
    //     radius: 1,
    //     color: {r: 255, b: 0, g: 0}, 
    // },
    // {
    //     type: ShapeType.sphere,
    //     position: new Position(5,0,0),
    //     radius: 1,
    // },
    // {
    //     type: ShapeType.sphere,
    //     position: new Position(5,0,3),
    //     radius: 1,
    //     color: {r: 0, b: 255, g: 0},
    // },
    {
        type: ShapeType.box,
        position: new Position(5, 0, 0),
        b: new Position(1, 2, 1),
        color: { r: 0, b: 0, g: 255 },
    },
    // {
    //     type: ShapeType.sphere,
    //     position: new Position(5,2,3),
    //     radius: .5,
    //     color: {r: 0, b: 255, g: 0},
    // },
    // {
    //     type: ShapeType.infinite,
    //     c: new Position(4,0,4),
    //     object: {
    //         type: ShapeType.torus,
    //         position: new Position(0,0,0),
    //         minor: .5,
    //         major: 1,
    //         color: {r: 241, g: 209, b: 162},
    //     },
    // },
    // {
    //     type: ShapeType.infinite,
    //     c: new Position(4,0,4),
    //     object: {
    //         type: ShapeType.subtract,
    //         subtractor: {
    //             type: ShapeType.torus,
    //             position: new Position(0,0,0),
    //             minor: .5,
    //             major: 1,
    //             color: {r: 241, g: 209, b: 162},
    //         },
    //         subtractee: {
    //             type: ShapeType.torus,
    //             position: new Position(0,.1,0),
    //             minor: .5,
    //             major: 1,
    //             color: {r: 245, g: 159, b: 192},
    //         },
    //         //color: {r: 0, g: 0, b: 255}
    //     },
    // },
    // {
    //     type: ShapeType.subtract,
    //     subtractor: {
    //         type: ShapeType.hexagonalPrism,
    //         position: new Position(0,10),
    //         h: new Position(20,10),
    //         color: {r: 200, g: 200, b: 200}
    //     },
    //     subtractee: {
    //         type: ShapeType.box,
    //         position: new Position(0,5,0),
    //         b: new Position(20,20,20)
    //     }
    // }
    // {
    //     type: ShapeType.plane,
    //     position: new Position(0,-1,0),
    //     //angle: {roll: 0, pitch: 0, yaw: 0 },
    //     b: new Position(1,1),
    //     color: {r: 255, b: 168, g: 237},
    // },
    // {
    //     type: ShapeType.plane,
    //     position: new Position(1,0,0),
    //     angle: {roll: 0, pitch: 90, yaw: 0 },
    //     b: new Position(1,1),
    //     color: {r: 255, b: 168, g: 237},
    // },
    {
        type: ShapeType.infPlane,
        position: new Position(0, 0, 0),
        angle: new Position(0, 1, 0),
        h: 1
    },
    //  #endregion
];
let lights = [
    {
        position: new Position(8, 3, 0),
        radius: 10,
    },
    {
        position: new Position(5, 3, 3),
        radius: 10,
    },
    {
        position: new Position(5, 5, 0),
        radius: 10,
    },
];
let skyBrightness = 1;
let camera = new Position(0, 0, 0);
let roll = 0;
let pitch = 0;
let yaw = 0;
let minStep = 1 / 1000;
let bounces = 10;
let time = performance.now();
let framerates = [];
let avgMax = 10;
let arrAvg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
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
                minStep: minStep,
                lights: lights,
                bounces: bounces,
                channels: 4,
                camera: camera,
                objects: objects,
            });
        });
        let delta = (performance.now() - time) / 1000;
        framerates.push(1 / delta);
        if (framerates.length > avgMax) {
            framerates.shift();
        }
        document.getElementById("fps").innerHTML = (Math.floor(arrAvg(framerates))).toString();
        time = performance.now();
        // let img = document.createElement('img');
        // img.src = canvas.toDataURL()
        // document.getElementById("img").appendChild(img)
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
    delta = delta > 1 ? 1 : delta;
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
for (let i = 0; i < 10; i++) {
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
            case 8:
                keys.space = true;
                break;
            case 9:
                keys.ctrl = true;
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
            case 8:
                keys.space = false;
                break;
            case 9:
                keys.ctrl = false;
                break;
            default:
                break;
        }
    });
    document.getElementById(i.toString()).addEventListener("pointerleave", function () {
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
            case 8:
                keys.space = false;
                break;
            case 9:
                keys.ctrl = false;
                break;
            default:
                break;
        }
    });
}
window.addEventListener('blur', function (ev) {
    for (let i = 0; i < 10; i++) {
        switch (i) {
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
            case 8:
                keys.space = false;
                break;
            case 9:
                keys.ctrl = false;
                break;
            default:
                break;
        }
    }
});
//# sourceMappingURL=index.js.map