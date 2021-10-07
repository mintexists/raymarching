let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let scaleX = 1;
let scaleY = 1;
let xOffset = canvas.width / 2;
let yOffset = canvas.height / 2;
let minStep = 1;
let maxDistance = 100;
let fov = 1;
let yaw = 0;
let pitch = 0;
let mouseDown = false;
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
let rad2deg = (rad) => (180 / Math.PI) * rad;
let deg2rad = (deg) => deg * (Math.PI / 180);
let pythag = (pos1, pos2) => Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z); //Math.sqrt((pos1.x-pos2.x)**2 + (pos1.y-pos2.y)**2 + (pos1.z-pos2.z)**2)
let dot = (pos1, pos2) => pos1.x * pos2.x + pos1.y * pos2.y + pos1.z * pos2.z;
const average = (array) => array.reduce((a, b) => a + b) / array.length;
let normalize = (vector) => {
    let length = pythag(new Position(0, 0, 0), vector);
    return new Position(vector.x / length, vector.y / length, vector.z / length);
};
// this isnt right
let rotate = (pos, yaw, pitch) => {
    let newPitch = new Position(pos.x * Math.cos(deg2rad(pitch)) + pos.y * -Math.sin(deg2rad(pitch)) + 0, pos.x * Math.sin(deg2rad(pitch)) + pos.y * Math.cos(deg2rad(pitch)) + 0, 0 + 0 + pos.z);
    let newYaw = new Position(newPitch.x * Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)), 0 + newPitch.y + 0, newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)));
    // return pos
    return newYaw;
};
function sMin(a, b, k) {
    let h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * (1 / 4);
}
class Position {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
class Sphere {
    constructor(position, radius = 1) {
        this.position = position;
        this.radius = radius;
    }
    distance(pos) {
        return pythag(pos, this.position) - this.radius;
    }
}
class Plane {
    constructor(position, angle, height) {
        this.position = position;
        this.angle = angle;
        this.height = height;
    }
    distance(pos) {
        let vector = new Position(pos.x - this.position.x, pos.y - this.position.y, pos.z - this.position.z);
        return dot(vector, this.angle) + this.height;
    }
}
/*class Subtract {
    subtractee: any
    subtractor: any
    constructor(subtractee, subtractor) {
        this.subtractee = subtractee
        this.subtractor = subtractor
    }

    distance(pos: Position) {
        return Math.max(-this.subtractor.distance(pos), this.subtractee.distance(pos))
    }
}

class Intersect {
    intersectee: any
    intersector: any
    constructor(intersectee, intersector) {
        this.intersectee = intersectee
        this.intersector = intersector
    }

    distance(pos: Position) {
        return Math.max(this.intersector.distance(pos), this.intersectee.distance(pos))
    }
}

class Union {
    first: any
    second: any
    k: number
    constructor(first, second, k = minStep) {
        this.first = first
        this.second = second
        this.k = k
    }

    distance(pos: Position) {
        return sMin(this.first.distance(pos), this.second.distance(pos), this.k)
        //return Math.min(this.first.distance(pos), this.second.distance(pos))
    }
}

class Round {
    object: any
    radius: number
    constructor(object, radius) {
        this.object = object
        this.radius = radius
    }

    distance(pos: Position) {
        return this.object.distance(pos) - this.radius
    }
}

class Onion {
    object: any
    width: number
    constructor(object, width) {
        this.object = object
        this.width = width
    }

    distance(pos: Position) {
        return Math.abs(this.object.distance(pos)) - this.width
    }
}*/
let objects = [];
// objects.push(new Sphere(new Position(80,0,0), 30))
// objects.push(new Sphere(new Position(0,0,80), 30))
// objects.push(new Sphere(new Position(80,0,80), 30))
for (let i = 0; i < 360; i += 10) {
    objects.push(new Sphere(new Position(20 * Math.cos(deg2rad(i)), 0, 20 * Math.sin(deg2rad(i))), 1));
}
objects.push(new Plane(new Position(0, 0, 0), new Position(0, 1, 0), 2));
let camera = new Position(0, 0, 0);
let imagedata = ctx.createImageData(canvas.width, canvas.height);
function draw() {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let distance = minStep;
            let totalDistance = 0;
            let rayPos = new Position(camera.x, camera.y, camera.z);
            //let vector = new Position(2, ((y/canvas.height) - .5) * 2, ((x/canvas.width) - .5) * 2)
            let vector = normalize(rotate(new Position(1, ((y / canvas.height) - .5) * fov, ((x / canvas.width) - .5) * fov), yaw, pitch));
            let normal;
            while (true) {
                if (totalDistance > maxDistance || distance < minStep) {
                    break;
                }
                let distances = [];
                objects.forEach(object => {
                    normal = new Position(rayPos.x - object.position.x, rayPos.y - object.position.y, rayPos.z - object.position.z);
                    distances.push(Math.abs(object.distance(rayPos)));
                });
                distance = Math.min(...distances);
                totalDistance += distance;
                rayPos.x += vector.x * distance;
                rayPos.y += vector.y * distance;
                rayPos.z += vector.z * distance;
            }
            let shade = 0;
            if (distance < minStep) {
                shade = (distance * (1 / minStep)); //(totalDistance/maxDistance)  //Math.abs(dot(normalize(vector), normalize(normal))*2)
            }
            let pixelindex = ((canvas.width - y) * canvas.width + x) * 4;
            imagedata.data[pixelindex] = shade * 255;
            imagedata.data[pixelindex + 1] = shade * 255;
            imagedata.data[pixelindex + 2] = shade * 255;
            imagedata.data[pixelindex + 3] = 255;
        }
    }
    ctx.putImageData(imagedata, 0, 0);
    // ctx.fillStyle = "black"
    // ctx.clearRect(0,0,canvas.width,canvas.height)
    // ctx.fillRect(0,0,canvas.width,canvas.height)
    // ctx.fillStyle = "white"
    // for (let i = 0+offset; i < 360+offset; i+=1) {
    //     let rayPos = new Position(camera.x, camera.y)
    //     let distance = minStep;
    //     let totalDistance = 0
    //     while (true) {
    //         if (totalDistance > maxDistance || distance < minStep) {
    //             break
    //         }
    //         let distances: Array<number> = []
    //         objects.forEach(object => {
    //             distances.push(object.distance(rayPos))
    //         })
    //         /*distance = maxDistance
    //         distances.forEach(dist => {
    //             distance = sMin(distance, dist, .1)
    //         })*/
    //         distance = Math.min(...distances)
    //         totalDistance += distance
    //         if (/* i % 36 == 0 */ false) {
    //             ctx.strokeStyle = "black"
    //             ctx.beginPath();
    //             ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset)
    //             ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset)
    //             ctx.stroke();
    //             ctx.strokeStyle = "red"
    //             ctx.beginPath()
    //             ctx.arc(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset, distance * scaleX, 0, 2 * Math.PI);
    //             ctx.stroke()
    //         }
    //         rayPos.x += Math.cos(deg2rad(i)) * distance
    //         rayPos.y += Math.sin(deg2rad(i)) * distance
    //     }
    //     ctx.strokeStyle = "white"
    //     ctx.beginPath()
    //     ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset)
    //     ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset)
    //     ctx.stroke()
    // }
}
let frameTimes = [];
for (let i = 0; i < 10; i++) {
    frameTimes.push(0);
}
function main() {
    //let time = performance.now()
    draw();
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
    //frameTimes.push(performance.now() - time)
    //frameTimes.shift()
    //document.getElementById("frametime").innerText = (1 / (average(frameTimes)) * 100).toString()
    //offset+=1/10
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