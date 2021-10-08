const _self = self;
let img;
let chunkCount = Math.floor(Math.sqrt(navigator.hardwareConcurrency)) || 2;
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
let localize = (pos1, pos2) => new Position(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z);
let normalize = (vector) => {
    let length = pythag(new Position(0, 0, 0), vector);
    return new Position(vector.x / length, vector.y / length, vector.z / length);
};
let dot = (pos1, pos2) => pos1.x * pos2.x + pos1.y * pos2.y + pos1.z * pos2.z;
let cross = (pos1, pos2) => new Position((pos1.y * pos2.z) - (pos1.z * pos2.y), (pos1.z * pos2.x) - (pos1.x * pos2.z), (pos1.x * pos2.y) - (pos1.y * pos2.x));
let rotate = (pos, yaw = 0, pitch = 0, roll = 0) => {
    let newRoll = new Position(pos.x + 0 + 0, 0 + pos.y * Math.cos(deg2rad(roll)) + pos.z * -Math.sin(deg2rad(roll)), 0 + pos.y * Math.sin(deg2rad(roll)) + pos.z * Math.cos(deg2rad(roll)));
    let newPitch = new Position(newRoll.x * Math.cos(deg2rad(pitch)) + newRoll.y * -Math.sin(deg2rad(pitch)) + 0, newRoll.x * Math.sin(deg2rad(pitch)) + newRoll.y * Math.cos(deg2rad(pitch)) + 0, 0 + 0 + newRoll.z);
    let newYaw = new Position(newPitch.x * Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)), 0 + newPitch.y + 0, newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)));
    return newYaw;
};
var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["sphere"] = 0] = "sphere";
    ShapeType[ShapeType["plane"] = 1] = "plane";
    ShapeType[ShapeType["box"] = 2] = "box";
    ShapeType[ShapeType["torus"] = 3] = "torus";
    ShapeType[ShapeType["mandlebulb"] = 4] = "mandlebulb";
})(ShapeType || (ShapeType = {}));
let sphereDist = (pos, sphere) => pythag(pos, sphere.position) - sphere.radius;
let planeDist = (pos, plane) => {
    return dot(localize(pos, plane.position), normalize(plane.angle)) + plane.h;
};
let boxDist = (pos, box) => {
    if (!box.angle) {
        box.angle = { roll: 0, pitch: 0, yaw: 0 };
    }
    let p = rotate(localize(pos, box.position), box.angle.yaw, box.angle.pitch, box.angle.roll);
    return Math.max(Math.abs(p.x) - box.b.x, Math.abs(p.y) - box.b.y, Math.abs(p.z) - box.b.z);
};
let torusDist = (pos, torus) => {
    if (!torus.angle) {
        torus.angle = { roll: 0, pitch: 0, yaw: 0 };
    }
    let p = rotate(localize(pos, torus.position), torus.angle.yaw, torus.angle.pitch, torus.angle.roll);
    let q = new Position(pythag(new Position(p.x, 0, p.z)) - torus.major, p.y, 0);
    return pythag(q) - torus.minor;
};
let mandlebulbDist = (pos, mandlebulb) => {
    let iterations = 10;
    let maxBulbDist = 10000;
    let power = 3;
    if (!mandlebulb.angle) {
        mandlebulb.angle = { roll: 0, pitch: 0, yaw: 0 };
    }
    let z = pos; //rotate(localize(pos, mandlebulb.position), mandlebulb.angle.yaw, mandlebulb.angle.pitch, mandlebulb.angle.roll)
    let dr = 1;
    let r = 0;
    for (let i = 0; i < iterations; i++) {
        r = pythag(z);
        if (r > maxBulbDist) {
            break;
        }
        let theta = Math.acos(z.z / r);
        let phi = Math.atan2(z.y, z.x);
        dr = Math.pow(r, power - 1) * power * dr + 1;
        let zr = Math.pow(r, power);
        theta = theta * power;
        phi = phi * power;
        z = new Position(zr * Math.sin(theta) * Math.cos(phi), zr * Math.sin(phi) * Math.sin(theta), zr * Math.cos(theta));
        z.x += pos.x;
        z.y += pos.y;
        z.z += pos.z;
    }
    return 0.5 * Math.log(r) * r / dr;
};
let minStep = 1 / 100;
let maxDistance = 500;
let maxSteps = 200;
let fov = 1;
_self.addEventListener('message', (evt) => {
    if (chunkCount != evt.data.chunkCount) {
        chunkCount = evt.data.chunkCount;
    }
    // console.log(sphereDist(evt.data.camera, evt.data.objects[0]))
    // console.log(planeDist(evt.data.camera, evt.data.objects[1]))
    if (!img) {
        img = new ImageData(evt.data.width, evt.data.height);
    }
    for (let y = 0; y < evt.data.height; y++) {
        for (let x = 0; x < evt.data.width; x++) {
            let totalDistance = 0;
            let distance = minStep;
            let steps = 0;
            let smallest;
            let rayPos = new Position(evt.data.camera.x, evt.data.camera.y, evt.data.camera.z);
            let vector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch, evt.data.roll));
            while (true) {
                if (totalDistance > maxDistance || distance < minStep || steps > maxSteps) {
                    break;
                }
                distance = maxDistance;
                evt.data.objects.forEach(obj => {
                    switch (obj.type) {
                        case ShapeType.sphere:
                            obj.distance = Math.abs(sphereDist(rayPos, obj));
                            break;
                        case ShapeType.plane:
                            obj.distance = Math.abs(planeDist(rayPos, obj));
                            break;
                        case ShapeType.box:
                            obj.distance = Math.abs(boxDist(rayPos, obj));
                            break;
                        case ShapeType.torus:
                            obj.distance = Math.abs(torusDist(rayPos, obj));
                            break;
                        case ShapeType.mandlebulb:
                            obj.distance = Math.abs(mandlebulbDist(rayPos, obj));
                            break;
                        default:
                            break;
                    }
                    if (obj.distance < distance) {
                        distance = obj.distance;
                        smallest = obj;
                    }
                });
                totalDistance += distance;
                rayPos.x += vector.x * distance;
                rayPos.y += vector.y * distance;
                rayPos.z += vector.z * distance;
                steps++;
            }
            //let pixelindex = 4 * (x + y * img.width)
            let pixelindex = (y * evt.data.width + x) * 4;
            let shade = 0; //(((x + evt.data.x) / (evt.data.width) / 4) + ((y + evt.data.y) / (evt.data.height) / 4))
            if (distance < minStep) {
                // shade = (distance * (1/minStep))
                shade = (Math.pow((1 - steps / maxSteps), 2)) * 255;
                if (smallest.color == undefined) {
                    smallest.color = { r: 255, g: 255, b: 255 };
                }
                img.data[pixelindex] = (shade - (255 - smallest.color.r));
                img.data[pixelindex + 1] = (shade - (255 - smallest.color.b));
                img.data[pixelindex + 2] = (shade - (255 - smallest.color.g));
                img.data[pixelindex + 3] = 255;
            }
            else {
                img.data[pixelindex] = 0 * 255;
                img.data[pixelindex + 1] = 0 * 255;
                img.data[pixelindex + 2] = 0 * 255;
                img.data[pixelindex + 3] = 255;
            }
        }
    }
    let bytes = new Uint8ClampedArray(img.data);
    self.postMessage({
        type: 'end',
        bytes: bytes
    }, [bytes.buffer]);
});
//# sourceMappingURL=worker.js.map