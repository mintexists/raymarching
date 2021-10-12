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
let sphereDist = (pos, sphere) => pythag(pos, sphere.position) - sphere.radius;
let infPlaneDist = (pos, plane) => {
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
    if (!mandlebulb.angle) {
        mandlebulb.angle = { roll: 0, pitch: 0, yaw: 0 };
    }
    pos = rotate(localize(mandlebulb.position, pos), mandlebulb.angle.yaw, mandlebulb.angle.pitch, mandlebulb.angle.roll);
    let iterations = Math.pow(10, 9); //100 - pythag(Position.zero, pos)
    let maxBulbDist = Math.pow(10, 9); //pythag(Position.zero, pos) * 100
    let power = 3;
    let z = pos;
    let dr = 1;
    let r = 0;
    for (let it = 0; it < iterations; it++) {
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
let planeDist = (pos, plane) => {
    if (!plane.angle) {
        plane.angle = { roll: 0, pitch: 0, yaw: 0 };
    }
    let p = rotate(localize(pos, plane.position), plane.angle.yaw, plane.angle.pitch, plane.angle.roll);
    return Math.max(Math.abs(p.x) - plane.b.x, Math.abs(p.y), Math.abs(p.z) - plane.b.y);
};
let subtract = (pos, subtract) => {
    let dist = Math.max(-calcDist(pos, subtract.subtractor), calcDist(pos, subtract.subtractee));
    if (!subtract.color) {
        if ((-subtract.subtractor.distance) == dist) {
            subtract.altColor = subtract.subtractor.color;
        }
        else if (subtract.subtractee.distance == dist) {
            subtract.altColor = subtract.subtractee.color;
        }
    }
    return dist;
};
let union = (pos, union) => {
    let dist = Math.min(calcDist(pos, union.first), calcDist(pos, union.second));
    if (!union.color) {
        if (union.first.distance == dist && union.first.color) {
            union.altColor = union.first.color;
        }
        else if (union.second.distance == dist && union.second.color) {
            union.altColor = union.second.color;
        }
    }
    return dist;
};
let intersect = (pos, intersect) => {
    let dist = Math.max(calcDist(pos, intersect.first), calcDist(pos, intersect.second));
    if (!intersect.color) {
        if (intersect.first.distance == dist && intersect.first.color) {
            intersect.altColor = intersect.first.color;
        }
        else if (intersect.second.distance == dist && intersect.second.color) {
            intersect.altColor = intersect.second.color;
        }
    }
    return dist;
};
let hexagonalPrismDist = (pos, hexagonal) => {
    if (!hexagonal.angle) {
        hexagonal.angle = { roll: 0, pitch: 0, yaw: 0 };
    }
    let p = rotate(localize(pos, hexagonal.position), hexagonal.angle.yaw, hexagonal.angle.pitch, hexagonal.angle.roll);
    //p = rotate(p, 0,0,0)
    p.x = Math.abs(p.x);
    p.z = Math.abs(p.z);
    p.y = Math.abs(p.y);
    //let k = normalize(new Position(0.57735, 0, 0.8660254))
    let k = new Position(2 / 3, 0, 1);
    let p1 = rotate(p, 60);
    return Math.max(p.x - hexagonal.h.x * k.x, p.z - hexagonal.h.x * k.z, p1.x - hexagonal.h.x * k.x, p1.z - hexagonal.h.x * k.z, p.y - hexagonal.h.y);
};
let infinite = (pos, infinite) => {
    let q = new Position((((Math.abs(pos.x) + 0.5 * infinite.c.x) % infinite.c.x) - 0.5 * infinite.c.x), (((Math.abs(pos.y) + 0.5 * infinite.c.y) % infinite.c.y) - 0.5 * infinite.c.y), (((Math.abs(pos.z) + 0.5 * infinite.c.z) % infinite.c.z) - 0.5 * infinite.c.z));
    q.x = infinite.c.x == 0 ? pos.x : q.x;
    q.y = infinite.c.y == 0 ? pos.y : q.y;
    q.z = infinite.c.z == 0 ? pos.z : q.z;
    if (!infinite.color) {
        if (infinite.object.color) {
            infinite.altColor = infinite.object.color;
        }
        else if (infinite.object.altColor) {
            infinite.altColor = infinite.object.altColor;
        }
    }
    return calcDist(q, infinite.object);
};
let calcDist = (rayPos, obj) => {
    switch (obj.type) {
        case ShapeType.sphere:
            obj.distance = (sphereDist(rayPos, obj));
            break;
        case ShapeType.infPlane:
            obj.distance = (infPlaneDist(rayPos, obj));
            break;
        case ShapeType.box:
            obj.distance = (boxDist(rayPos, obj));
            break;
        case ShapeType.torus:
            obj.distance = (torusDist(rayPos, obj));
            break;
        case ShapeType.mandlebulb:
            obj.distance = (mandlebulbDist(rayPos, obj));
            break;
        case ShapeType.plane:
            obj.distance = (planeDist(rayPos, obj));
            break;
        case ShapeType.subtract:
            obj.distance = (subtract(rayPos, obj));
            break;
        case ShapeType.union:
            obj.distance = (union(rayPos, obj));
            break;
        case ShapeType.intersect:
            obj.distance = (intersect(rayPos, obj));
            break;
        case ShapeType.infinite:
            obj.distance = (infinite(rayPos, obj));
            break;
        case ShapeType.hexagonalPrism:
            obj.distance = (hexagonalPrismDist(rayPos, obj));
        default:
            break;
    }
    return obj.distance;
};
let calcNormal = (p, obj) => {
    let eps = 0.0001;
    let h = new Position(eps, 0, 0);
    let xyyP = new Position(p.x + h.x, p.y + h.y, p.z + h.x);
    let xyyM = new Position(p.x - h.x, p.y - h.y, p.z - h.x);
    let yxyP = new Position(p.x + h.y, p.y + h.x, p.z + h.y);
    let yxyM = new Position(p.x - h.y, p.y - h.x, p.z - h.y);
    let yyxP = new Position(p.x + h.y, p.y + h.y, p.z + h.x);
    let yyxM = new Position(p.x - h.y, p.y - h.y, p.z - h.x);
    return normalize(new Position(calcDist(xyyP, obj) - calcDist(xyyM, obj), calcDist(yxyP, obj) - calcDist(yxyM, obj), calcDist(yyxP, obj) - calcDist(yyxM, obj)));
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
    // console.log(infPlane(evt.data.camera, evt.data.objects[1]))
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
                    calcDist(rayPos, obj);
                    if (Math.abs(obj.distance) < distance) {
                        distance = Math.abs(obj.distance);
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
                let color = { r: 255, g: 255, b: 255 };
                if (smallest.color != undefined) {
                    color = smallest.color;
                }
                else if (smallest.altColor) {
                    color = smallest.altColor;
                }
                let normal = calcNormal(rayPos, smallest);
                //color = {r: Math.abs(normal.x)*255, g: Math.abs(normal.y)*255, b: Math.abs(normal.z)*255}
                //color = {r: normal.x*255, g: 0, b: 0}
                img.data[pixelindex] = (shade - (255 - color.r));
                img.data[pixelindex + 1] = (shade - (255 - color.g));
                img.data[pixelindex + 2] = (shade - (255 - color.b));
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