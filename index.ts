let canvas = document.getElementById("canvas") as HTMLCanvasElement
let ctx = canvas.getContext("2d")

import noise from "./perlin.js"

import {Position, Rotation, Shader, Color, ShapeType, Rotate, Sphere, Box, Torus, Plane, Subtract, Union, Intersect, Infinite, processObjects} from "./classes.js"
import { createBuilderStatusReporter } from "../../../node_modules/typescript/lib/typescript.js"
import { SHARE_ENV } from "worker_threads"

let res = 200

function closestMultiple(n, x) {
    if (x > n) return x
    n = n + (x/2)
    n = n - (n % x)
    return n;
}

let dumpPos = () => console.log(`camera.x = ${camera.x}; camera.y = ${camera.y}; camera.z = ${camera.z}; yaw = ${yaw}; pitch = ${pitch}`)

let chunkCount = Math.floor(Math.sqrt(navigator.hardwareConcurrency)) || 2

let chunkRes = closestMultiple(res, chunkCount) / chunkCount

canvas.width  = chunkCount * chunkRes
canvas.height = chunkCount * chunkRes


let chunkW = canvas.width / chunkCount
let chunkH = canvas.height / chunkCount

let keys =  {
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
}

class Chunk {
    pixels: ImageData
    ready: boolean
    worker: Worker
    x: number
    y: number
    constructor(x, y, worker = "worker.js") {
        this.x = x * chunkW
        this.y = y * chunkH
        this.ready = true
        // this.worker = new Worker(worker)
        this.worker = new Worker(worker, {type: "module"})
        this.pixels = new ImageData(chunkW, chunkH)

        this.worker.addEventListener("message", (evt) => {
            this.pixels.data.set(evt.data.bytes)
            this.ready = true
        })
    }

    postMessage(data) {
        this.worker.postMessage(data)
    }

    getPixels() {
        this.ready = false
        return this.pixels
    }
}

let chunks: Array<Chunk> = []
for (let y = 0; y < chunkCount; y++) {
    for (let x = 0; x < chunkCount; x++) {
        chunks.push(new Chunk(x,y))
    }
}

let rad2deg = (rad: number) => (180 / Math.PI) * rad
let deg2rad = (deg: number) => deg * (Math.PI / 180)

let pythag = (pos1: Position, pos2: Position=Position.zero) => Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z)

let rotate = (pos: Position, yaw: number, pitch: number) => {

    let newPitch = new Position(
        pos.x *  Math.cos(deg2rad(pitch)) + pos.y * -Math.sin(deg2rad(pitch)) + 0,
        pos.x *  Math.sin(deg2rad(pitch)) + pos.y *  Math.cos(deg2rad(pitch)) + 0,
        0 + 0 + pos.z
    )

    let newYaw = new Position(
        newPitch.x *  Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)),
        0 + newPitch.y + 0,
        newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)),
    )

    return newYaw
}

let normalize = (vector: Position) => {

    let length = pythag(new Position(0,0,0), vector) || 1

    return new Position(vector.x / length, vector.y / length, vector.z / length)
}

let objects: any = [
    // new Sphere(new Position(5,0,0),    1, new Shader(0, 0, new Color(255,255,255), 1, 1, 1.52)),
    new Rotate(new Box(new Position(5,0,0), new Position(1,1,1), new Shader(1, 0, new Color(255,255,255), 1, 1, 1.52)), new Rotation(0,0,0)),
    // new Sphere(new Position(6.5,0,0),  1, new Shader(0, 0, new Color(255,255,255), 1, 1, 1.52)),
    // new Sphere(new Position(5,0,0), .9, new Shader(0, 0, new Color(255,255,255), 1, 1, 1)),
    // new Torus(new Position(5,0,0), 1, .5, new Shader(0, 0, new Color(255,255,255), 1, .5)),
    new Plane(new Position(0,-1,0), new Position(Infinity,Infinity)),
    // new Subtract(new Sphere(new Position(5,0,0), .8), new Sphere(new Position(5,0,0), 1), new Shader(0, 0, new Color(255,255,255), 1, 1, 1.52))
]

let sky = {
    brightness: 2,
    color: {r: 189, g: 246, b: 254},
}

let camera = new Position(0,0,0)
let roll  = 0
let pitch = 0
let yaw   = 0

let minStep = 1/1000
let maxBounces = 10
let samples = 10
let maxDistance = 100

let time = performance.now()
let framerates: Array<Number> = []
let avgMax = 10

let arrAvg = arr => arr.reduce((a,b) => a + b, 0) / arr.length

function draw() {
    if (chunks.every((chunk) => chunk.ready)) {
        chunks.forEach((chunk) => {
            ctx.putImageData(chunk.getPixels(), chunk.x, chunk.y)
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
                maxBounces: maxBounces,
                maxDistance: maxDistance,
                samples: samples,
                sky: sky,
                channels: 4,
                camera: camera,
                objects: objects,
            })
        })

        let delta = (performance.now() - time) / 1000
        framerates.push(1/delta)

        if (framerates.length > avgMax) {
            framerates.shift()
        }
        
        document.getElementById("fps").innerText = (Math.floor(arrAvg(framerates))).toString()
        time = performance.now()

        document.getElementById("lastFrametime").innerHTML = delta.toString()

        // let img = document.createElement('img');
        // img.src = canvas.toDataURL()
        // document.getElementById("img").appendChild(img)

    }
}

let moveSpeed = 1
let rotSpeed  = .5
let sprintSpeed = 2
let sprinting = 1

let chunkStats = document.getElementById("chunkStats")

let move = Position.zero

let frame: any

function main() {

    samples = (document.getElementById("samples") as HTMLInputElement).valueAsNumber
    maxBounces = (document.getElementById("bounces") as HTMLInputElement).valueAsNumber
    maxDistance = (document.getElementById("maxDistance") as HTMLInputElement).valueAsNumber

    let delta = (performance.now() - time) / 1000
    document.getElementById("frametime").innerText = delta.toString()

    delta = delta > 1 ? 1 : delta

    chunkStats.innerText = "%: "

    chunks.forEach((chunk) => {
        chunkStats.innerText += `${chunk.ready ? "#" : ""}`
    })

    move.x=0;move.y=0;move.z=0;

    if (keys.shift) {
        sprinting = sprintSpeed
    } else {
        sprinting = 1
    }

    if (keys.w) {
        move.x++
    }

    if (keys.a) {
        move.z--
    }

    if (keys.d) {
        move.z++
    }

    if (keys.s) {
        move.x--
    }

    move = normalize(rotate(move, yaw, 0))

    if (keys.space) {
        move.y += .5
    }

    if (keys.ctrl) {
        move.y -= .5
    }

    camera.x += move.x * moveSpeed * sprintSpeed * delta
    camera.y += move.y * moveSpeed * sprintSpeed * delta
    camera.z += move.z * moveSpeed * sprintSpeed * delta

    if (keys.left) {
        yaw += 1 * rotSpeed
    }

    if (keys.right) {
        yaw -= 1 * rotSpeed
    }

    if (keys.up) {
        pitch += 1 * rotSpeed
    }

    if (keys.down) {
        pitch -= 1 * rotSpeed
    }
    
    draw()
    frame = window.requestAnimationFrame(main)
}

main()

document.addEventListener('keydown', (e) => {
    if (e.key == "Escape") {
        debugger
    }
    switch (e.key.toLowerCase()) {
        case "w":
            keys.w = true
            break;
        case "a":
            keys.a = true
            break;
        case "s":
            keys.s = true
            break;
        case "d":
            keys.d = true
            break;
        case "arrowdown":
            keys.down = true
            e.preventDefault();
            break
        case "arrowup":
            keys.up = true
            e.preventDefault();
            break
        case "arrowleft":
            keys.left = true
            e.preventDefault();
            break
        case "arrowright":
            keys.right = true
            e.preventDefault();
            break
        case "shift":
            keys.shift = true
            break
        case "control":
            keys.ctrl = true
            break
        case " ":
            keys.space = true
            e.preventDefault();
            break
        default:
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case "w":
            keys.w = false
            break;
        case "a":
            keys.a = false
            break;
        case "s":
            keys.s = false
            break;
        case "d":
            keys.d = false
            break;
        case "arrowdown":
            keys.down = false
            e.preventDefault();
            break
        case "arrowup":
            keys.up = false
            e.preventDefault();
            break
        case "arrowleft":
            keys.left = false
            e.preventDefault();
            break
        case "arrowright":
            keys.right = false
            e.preventDefault();
            break
        case "shift":
            keys.shift = false
            break
        case "control":
            keys.ctrl = false
            break
        case " ":
            keys.space = false
            e.preventDefault();
            break
        default:
            break;
    }
});

for (let i = 0; i < 10; i++) {
    document.getElementById(i.toString()).addEventListener("pointerdown", function() {
        switch (parseInt(this.id)) {
            case 0:
                keys.w = true
                break;
            case 1:
                keys.a = true
                break
            case 2:
                keys.s = true
                break
            case 3:
                keys.d = true
                break
            case 4:
                keys.up = true
                break
            case 5:
                keys.down = true
                break
            case 6:
                keys.left = true
                break
            case 7:
                keys.right = true
                break
            case 8:
                keys.space = true
                break
            case 9:
                keys.ctrl = true
                break
            default:
                break;
        }
    });
    document.getElementById(i.toString()).addEventListener("pointerup", function() {
        switch (parseInt(this.id)) {
            case 0:
                keys.w = false
                break;
            case 1:
                keys.a = false
                break
            case 2:
                keys.s = false
                break
            case 3:
                keys.d = false
                break
            case 4:
                keys.up = false
                break
            case 5:
                keys.down = false
                break
            case 6:
                keys.left = false
                break
            case 7:
                keys.right = false
                break
            case 8:
                keys.space = false
                break
            case 9:
                keys.ctrl = false
                break
            default:
                break;
        }
    });

    document.getElementById(i.toString()).addEventListener("pointerleave", function() {
        switch (parseInt(this.id)) {
            case 0:
                keys.w = false
                break;
            case 1:
                keys.a = false
                break
            case 2:
                keys.s = false
                break
            case 3:
                keys.d = false
                break
            case 4:
                keys.up = false
                break
            case 5:
                keys.down = false
                break
            case 6:
                keys.left = false
                break
            case 7:
                keys.right = false
                break
            case 8:
                keys.space = false
                break
            case 9:
                keys.ctrl = false
                break
            default:
                break;
        }
    });
}

window.addEventListener('blur', function(ev) {
    for (let i = 0; i < 10; i++) {
        switch (i) {
            case 0:
                keys.w = false
                break;
            case 1:
                keys.a = false
                break
            case 2:
                keys.s = false
                break
            case 3:
                keys.d = false
                break
            case 4:
                keys.up = false
                break
            case 5:
                keys.down = false
                break
            case 6:
                keys.left = false
                break
            case 7:
                keys.right = false
                break
            case 8:
                keys.space = false
                break
            case 9:
                keys.ctrl = false
                break
            default:
                break;
        }
    }
});