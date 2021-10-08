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
    // let roll = deg2rad(pitchDeg)
    // let pitch = deg2rad(rollDeg)
    // let yaw = deg2rad(yawDeg)
    // Roll: X, Pitch: Z, Yaw: Y
    // let rotated = new Position(
    //     (pos.x * (Math.cos(pitch) * Math.cos(yaw))) + (pos.y * (Math.cos(pitch) * Math.sin(yaw) * Math.sin(roll) - Math.sin(pitch) * Math.cos(roll))) + (pos.z * (Math.cos(pitch) * Math.sin(yaw) * Math.cos(roll) + Math.sin(pitch) * Math.sin(yaw))),
    //     (pos.x * (Math.sin(pitch) * Math.cos(yaw))) + (pos.y * (Math.sin(pitch) * Math.sin(yaw) * Math.sin(roll) - Math.cos(pitch) * Math.cos(roll))) + (pos.z * (Math.sin(pitch) * Math.sin(yaw) * Math.cos(roll) + Math.cos(pitch) * Math.sin(yaw))),
    //     (pos.x * (-Math.sin(yaw)))                  + (pos.y * (Math.cos(yaw) * Math.sin(roll)))                                                      + (pos.z * (Math.cos(yaw) * Math.cos(roll)))
    // )
    let newRoll = new Position(pos.x + 0 + 0, 0 + pos.y * Math.cos(deg2rad(roll)) + pos.z * -Math.sin(deg2rad(roll)), 0 + pos.y * Math.sin(deg2rad(roll)) + pos.z * Math.cos(deg2rad(roll)));
    let newPitch = new Position(newRoll.x * Math.cos(deg2rad(pitch)) + newRoll.y * -Math.sin(deg2rad(pitch)) + 0, newRoll.x * Math.sin(deg2rad(pitch)) + newRoll.y * Math.cos(deg2rad(pitch)) + 0, 0 + 0 + newRoll.z);
    let newYaw = new Position(newPitch.x * Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)), 0 + newPitch.y + 0, newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)));
    // return newYaw
    return newYaw;
};
var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["sphere"] = 0] = "sphere";
    ShapeType[ShapeType["plane"] = 1] = "plane";
    ShapeType[ShapeType["box"] = 2] = "box";
})(ShapeType || (ShapeType = {}));
let sphereDist = (pos, sphere) => pythag(pos, sphere.position) - sphere.radius;
let planeDist = (pos, plane) => {
    return dot(localize(pos, plane.position), normalize(plane.angle)) + plane.h;
};
let boxDist = (pos, box) => {
    let p = localize(pos, box.position);
    return Math.max(Math.abs(p.x) - box.b.x, Math.abs(p.y) - box.b.y, Math.abs(p.z) - box.b.z);
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