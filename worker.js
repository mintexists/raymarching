importScripts("perlin.js");
const _self = self;
noise.seed(10);
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
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const norm = (val, max, min) => (val - min) / (max - min);
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
let randomInUnitSphere = (scale = 1, x, y, i) => {
    let theta = random[x][y][i].x * Math.PI * 2;
    let v = random[x][y][i].y;
    let phi = Math.acos((2 * v) - 1);
    let r = Math.pow(random[x][y][i].z, 1 / 3);
    return new Position(scale * r * Math.sin(phi) * Math.cos(theta), scale * r * Math.sin(phi) * Math.sin(theta), scale * r * Math.cos(phi));
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
    let iterations = mandlebulb.iterations || 10;
    let maxBulbDist = 10;
    let power = mandlebulb.power;
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
    let posClone = new Position(pos.x, pos.y, pos.z);
    let scale = 1;
    let height = .1;
    let add = (noise.simplex2(pos.x / scale, pos.z / scale)) * height;
    //posClone.y += add
    let value = 1;
    //posClone.y = Math.round(posClone.y*value)/value
    let p = rotate(localize(posClone, plane.position), plane.angle.yaw, plane.angle.pitch, plane.angle.roll);
    return Math.max(Math.abs(p.x) - plane.b.x, Math.abs(p.y), Math.abs(p.z) - plane.b.y);
};
let subtract = (pos, subtract) => {
    let dist = Math.max(-calcDist(pos, subtract.subtractor), calcDist(pos, subtract.subtractee));
    if (!subtract.color) {
        if ((-subtract.subtractor.distance) == dist) {
            subtract.altColor = subtract.subtractor.color || subtract.subtractor.altColor;
        }
        else if (subtract.subtractee.distance == dist) {
            subtract.altColor = subtract.subtractee.color || subtract.subtractee.altColor;
        }
    }
    return dist;
};
let union = (pos, union) => {
    let dist = Math.min(calcDist(pos, union.first), calcDist(pos, union.second));
    if (!union.color) {
        if (union.first.distance == dist && union.first.color || union.first.altColor) {
            union.altColor = union.first.color || union.first.altColor;
        }
        else if (union.second.distance == dist && union.second.color || union.second.altColor) {
            union.altColor = union.second.color || union.second.altColor;
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
            break;
        default:
            break;
    }
    return obj.distance;
};
let calcNormal = (p, obj) => {
    let eps = 0.0001;
    let h = new Position(eps, 0, 0);
    let xyyP = new Position(p.x + h.x, p.y + h.y, p.z + h.y);
    let xyyM = new Position(p.x - h.x, p.y - h.y, p.z - h.y);
    let yxyP = new Position(p.x + h.y, p.y + h.x, p.z + h.y);
    let yxyM = new Position(p.x - h.y, p.y - h.x, p.z - h.y);
    let yyxP = new Position(p.x + h.y, p.y + h.y, p.z + h.x);
    let yyxM = new Position(p.x - h.y, p.y - h.y, p.z - h.x);
    return normalize(new Position(calcDist(xyyP, obj) - calcDist(xyyM, obj), calcDist(yxyP, obj) - calcDist(yxyM, obj), calcDist(yyxP, obj) - calcDist(yyxM, obj)));
};
let calcReflect = (v, n) => {
    let perp = 2 * dot(v, n);
    return new Position(
    // (v.x - (perp * n.x)),
    // (v.y - (perp * n.y)),
    // (v.z - (perp * n.z)),
    (v.x - 2 * dot(v, n) * n.x), (v.y - 2 * dot(v, n) * n.y), (v.z - 2 * dot(v, n) * n.z));
};
let minStep = 1 / 100;
let maxDistance = 100;
let maxSteps = 200;
let fov = 1.5;
function castRay(pos, vector, objects = [], ignore = { distance: undefined }) {
    let totalDistance = 0;
    let distance = maxDistance;
    let object;
    let rayPos = new Position(pos.x, pos.y, pos.z);
    vector = new Position(vector.x, vector.y, vector.z);
    let normal;
    let steps = 0;
    while (!(totalDistance > maxDistance || distance < minStep || steps > maxSteps)) {
        distance = maxDistance;
        objects.forEach(obj => {
            calcDist(rayPos, obj);
            //if (true) {
            if (obj.distance != ignore.distance) {
                if (Math.abs(obj.distance) < distance) {
                    distance = Math.abs(obj.distance);
                    object = obj;
                }
            }
        });
        // if (light) {
        //     let dist = pythag(rayPos, light.position)
        //     if (Math.abs(dist) < distance) {
        //         distance = Math.abs(dist)
        //         object = light
        //     }
        // }
        totalDistance += distance;
        rayPos.x += vector.x * distance;
        rayPos.y += vector.y * distance;
        rayPos.z += vector.z * distance;
        steps++;
    }
    return {
        object: object,
        normal: normal,
        pos: rayPos,
        steps: steps,
        distance: distance,
        totalDistance: totalDistance,
    };
}
let random = [];
let genRandom = true;
_self.addEventListener('message', (evt) => {
    minStep = evt.data.minStep || minStep;
    if (chunkCount != evt.data.chunkCount) {
        chunkCount = evt.data.chunkCount;
    }
    if (genRandom) {
        for (let y = 0; y < evt.data.height; y++) {
            for (let x = 0; x < evt.data.width; x++) {
                if (!random[x]) {
                    random[x] = [];
                }
                random[x][y] = []; //new Position((Math.random() - .5) * 2, (Math.random() - .5) * 2, (Math.random() - .5) * 2)
            }
        }
        genRandom = false;
    }
    // console.log(sphereDist(evt.data.camera, evt.data.objects[0]))
    // console.log(infPlane(evt.data.camera, evt.data.objects[1]))
    if (!img) {
        img = new ImageData(evt.data.width, evt.data.height);
    }
    for (let y = 0; y < evt.data.height; y++) {
        for (let x = 0; x < evt.data.width; x++) {
            let colors = [];
            for (let i = 0; i < evt.data.samples; i++) {
                if (!random[x][y][i]) {
                    random[x][y][i] = new Position(Math.random(), Math.random(), Math.random());
                }
                let maxBounces = evt.data.maxBounces;
                let shades = [];
                let objects = evt.data.objects;
                let pos = new Position(evt.data.camera.x, evt.data.camera.y, evt.data.camera.z);
                let vector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch, evt.data.roll));
                let ray;
                let normal;
                let lastObject = { distance: Infinity };
                for (let b = 0; b < maxBounces; b++) {
                    ray = castRay(pos, vector, objects, lastObject);
                    lastObject = ray.object;
                    if (ray.totalDistance < maxDistance && ray.steps < maxSteps) {
                        shades.push(ray.object.reflectivity);
                    }
                    else {
                        shades.push(evt.data.skyBrightness);
                        break;
                    }
                    normal = calcNormal(ray.pos, ray.object);
                    vector = calcReflect(vector, normal);
                    let random = randomInUnitSphere(ray.object.roughness, x, y, i);
                    vector.x += random.x;
                    vector.y += random.y;
                    vector.z += random.z;
                    pos = ray.pos;
                    //break
                    // pos.x += vector.x
                    // pos.y += vector.y
                    // pos.z += vector.z
                    // pos.x += normal.x * minStep
                    // pos.y += normal.y * minStep
                    // pos.z += normal.z * minStep
                    // pos.x += random[x][y][i] * ray.object.roughness
                    // pos.y += random[x][y][i] * ray.object.roughness
                    // pos.z += random[x][y][i] * ray.object.roughness
                }
                let shade = shades.reduce((a, b) => a * b);
                colors.push(shade);
            }
            let color = (colors.reduce((a, b) => a + b, 0) / colors.length) * 255;
            let pixelindex = (y * evt.data.width + x) * 4;
            img.data[pixelindex] = color;
            img.data[pixelindex + 1] = color;
            img.data[pixelindex + 2] = color;
            img.data[pixelindex + 3] = 255;
            // img.data[pixelindex]   = Math.abs(vector.x) * 255
            // img.data[pixelindex+1] = Math.abs(vector.y) * 255
            // img.data[pixelindex+2] = Math.abs(vector.z) * 255
            // img.data[pixelindex+3] = 255
            // normal = normal || new Position(0,0,0)
            // img.data[pixelindex]   = normal.x * 255
            // img.data[pixelindex+1] = normal.y * 255
            // img.data[pixelindex+2] = normal.z * 255
            // img.data[pixelindex+3] = 255
            // //let light = evt.data.light
            // let shade = 255
            // evt.data.lights.forEach(light => {
            //     light.level = [0]
            // })
            // let bounces = evt.data.bounces
            // let initialPosition = new Position(evt.data.camera.x, evt.data.camera.y, evt.data.camera.z)
            // let initialVector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch, evt.data.roll))
            // let initialRay = castRay(initialPosition,initialVector,evt.data.objects)
            // let initialNormal = calcNormal(initialRay.pos, initialRay.object)
            // let diffuseScale = initialRay.object.roughness != undefined ? initialRay.object.roughness : 0
            // for (let i = 0; i < bounces; i++) {
            //     if (!random[x][y][i]) {
            //         random[x][y][i] = (noise.simplex3(x, y, i))
            //         // random[x][y][i] = new Position((Math.random() - .5) * 2, (Math.random() - .5) * 2, (Math.random() - .5) * 2)
            //     }
            //     let initialRayPos = new Position(initialRay.pos.x, initialRay.pos.y, initialRay.pos.z)
            //     // initialRayPos.x += random[x][y][i].x * diffuseScale
            //     // initialRayPos.y += random[x][y][i].y * diffuseScale
            //     // initialRayPos.z += random[x][y][i].z * diffuseScale
            //     // initialRayPos.x += noise.simplex3(x, y, i) * diffuseScale
            //     // initialRayPos.y += noise.simplex3(x, y, i) * diffuseScale
            //     // initialRayPos.z += noise.simplex3(x, y, i) * diffuseScale
            //     // initialRayPos.x += random[x][y][i].x * diffuseScale
            //     // initialRayPos.y += random[x][y][i].y * diffuseScale
            //     // initialRayPos.z += random[x][y][i].z * diffuseScale
            //     initialRayPos.x += random[x][y][i] * diffuseScale
            //     initialRayPos.y += random[x][y][i] * diffuseScale
            //     initialRayPos.z += random[x][y][i] * diffuseScale
            //     // initialRayPos.x += random[x][y][i].x * diffuseScale
            //     // initialRayPos.y += random[x][y][i].x * diffuseScale
            //     // initialRayPos.z += random[x][y][i].x * diffuseScale
            //     let rayPos = new Position(initialRayPos.x, initialRayPos.y, initialRayPos.z)
            //     rayPos.x += (initialNormal.x * minStep)
            //     rayPos.y += (initialNormal.y * minStep)
            //     rayPos.z += (initialNormal.z * minStep)
            //     //let newVector = new Position(initialNormal.x, initialNormal.y,initialNormal.z)
            //     evt.data.lights.forEach(light => {
            //         let newVector = normalize(localize(light.position, initialRayPos))
            //         let ray = castRay(rayPos,newVector,evt.data.objects,light)
            //         if (pythag(ray.pos,light.position) < minStep * 2) {
            //             let level = 1 - (pythag(initialRayPos,light.position) / light.radius)
            //             level = level < 0 ? 0 : level
            //             light.level.push(level)
            //             // light.level += 1 - (pythag(initialRayPos,light.position) / light.radius)
            //         } else {
            //             let level = 0
            //             level = level < 0 ? 0 : level
            //             light.level.push(0)
            //         }
            //     });
            // }
            // shade = (evt.data.lights.reduce((a,b) => {
            //     return a + (b.level.reduce((a,b) => a + b) / bounces)
            // }, 0) / evt.data.lights.length) * 255
            // shade += evt.data.skyBrightness * 255
            // shade = initialRay.distance < minStep ? shade : 0
            // 
            // let color = {r: 255, g: 255, b: 255}
            // if (initialRay.object.color) {
            //     color.r = initialRay.object.color.r
            //     color.g = initialRay.object.color.g
            //     color.b = initialRay.object.color.b
            // }
            // shade = 255
            // color = {r: Math.abs(initialNormal.x)*255, g: Math.abs(initialNormal.y)*255, b: Math.abs(initialNormal.z)*255}
        }
    }
    let bytes = new Uint8ClampedArray(img.data);
    // console.log("Done")
    self.postMessage({
        type: 'end',
        bytes: bytes
    }, [bytes.buffer]);
});
//# sourceMappingURL=worker.js.map