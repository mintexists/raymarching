let pythag = (pos1, pos2 = Position.zero) => Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z);
let localize = (pos1, pos2) => new Position(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z);
let rad2deg = (rad) => (180 / Math.PI) * rad;
let deg2rad = (deg) => deg * (Math.PI / 180);
let rotate = (pos, rotation) => {
    let newRoll = new Position(pos.x + 0 + 0, 0 + pos.y * Math.cos(deg2rad(rotation.x)) + pos.z * -Math.sin(deg2rad(rotation.x)), 0 + pos.y * Math.sin(deg2rad(rotation.x)) + pos.z * Math.cos(deg2rad(rotation.x)));
    let newPitch = new Position(newRoll.x * Math.cos(deg2rad(rotation.z)) + newRoll.y * -Math.sin(deg2rad(rotation.z)) + 0, newRoll.x * Math.sin(deg2rad(rotation.z)) + newRoll.y * Math.cos(deg2rad(rotation.z)) + 0, 0 + 0 + newRoll.z);
    let newYaw = new Position(newPitch.x * Math.cos(deg2rad(rotation.y)) + 0 + newPitch.z * Math.sin(deg2rad(rotation.y)), 0 + newPitch.y + 0, newPitch.x * -Math.sin(deg2rad(rotation.y)) + 0 + newPitch.z * Math.cos(deg2rad(rotation.y)));
    return newYaw;
};
export class Position {
    constructor(x = 0, y = 0, z = 0) {
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
export class Rotation {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
export class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}
export class Shader {
    constructor(roughness, absorbtion, color = new Color(255, 255, 255), density = 1, transmission = 0, ior = 1) {
        this.color = color;
        this.roughness = roughness;
        this.absorbtion = absorbtion;
        this.density = density;
        this.transmission = transmission;
        this.ior = ior;
    }
}
export var ShapeType;
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
    ShapeType[ShapeType["rotate"] = 11] = "rotate";
})(ShapeType || (ShapeType = {}));
export class Rotate {
    constructor(object, rotation) {
        this.type = ShapeType.rotate;
        this.object = object;
        this.rotation = rotation;
        this.shader = this.object.shader;
    }
    distance(pos) {
        return this.object.distance(rotate(pos, this.rotation));
    }
}
export class Sphere {
    constructor(position, radius, shader = new Shader(1, .5)) {
        this.type = ShapeType.sphere;
        this.position = position;
        this.radius = radius;
        this.shader = shader;
    }
    distance(pos) {
        return pythag(pos, this.position) - this.radius;
    }
}
export class Box {
    constructor(position, shape, shader = new Shader(1, .5)) {
        this.type = ShapeType.box;
        this.position = position;
        this.shape = shape;
        this.shader = shader;
    }
    distance(pos) {
        let p = localize(pos, this.position);
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.y) - this.shape.y, Math.abs(p.z) - this.shape.z);
    }
}
export class Torus {
    constructor(position, major, minor, shader = new Shader(1, .5)) {
        this.type = ShapeType.torus;
        this.position = position;
        this.major = major;
        this.shader = shader;
        this.minor = minor;
    }
    distance(pos) {
        let p = localize(pos, this.position);
        let q = new Position(pythag(new Position(p.x, 0, p.z)) - this.major, p.y, 0);
        return pythag(q) - this.minor;
    }
}
export class Plane {
    constructor(position, shape, shader = new Shader(1, .5)) {
        this.type = ShapeType.plane;
        this.position = position;
        this.shape = shape;
        this.shader = shader;
    }
    distance(pos) {
        let p = localize(pos, this.position);
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.y), Math.abs(p.z) - this.shape.y);
    }
}
export class Subtract {
    constructor(subtractor, subtractee, shader = new Shader(1, .5)) {
        this.type = ShapeType.subtract;
        this.subtractor = subtractor;
        this.subtractee = subtractee;
        this.shader = shader;
    }
    distance(pos) {
        let a = -this.subtractor.distance(pos);
        let b = this.subtractee.distance(pos);
        let c = Math.max(a, b);
        // if (c == a) {
        //     this.shader = new Shader(this.subtractor.shader.roughness, this.subtractor.shader.absorbtion, this.subtractor.shader.color)
        // } else {
        //     this.shader = new Shader(this.subtractee.shader.roughness, this.subtractee.shader.absorbtion, this.subtractee.shader.color)
        // }
        // this.shader = new Shader(this.subtractor.shader.roughness, this.subtractor.shader.absorbtion, this.subtractor.shader.color)
        // this.shader = this.subtractee.shader
        return c;
    }
}
export class Union {
    constructor(first, second, shader = new Shader(1, .5)) {
        this.type = ShapeType.union;
        this.first = first;
        this.second = second;
        this.shader = shader;
    }
    distance(pos) {
        let a = this.first.distance(pos);
        let b = this.second.distance(pos);
        let c = Math.min(a, b);
        if (c == a) {
            this.shader = new Shader(this.first.shader.roughness, this.first.shader.absorbtion, this.first.shader.color);
        }
        else {
            this.shader = new Shader(this.second.shader.roughness, this.second.shader.absorbtion, this.second.shader.color);
        }
        return c;
    }
}
export class Intersect {
    constructor(first, second, shader = new Shader(1, .5)) {
        this.type = ShapeType.intersect;
        this.first = first;
        this.second = second;
        this.shader = shader;
    }
    distance(pos) {
        let a = this.first.distance(pos);
        let b = this.second.distance(pos);
        let c = Math.max(a, b);
        if (c == a) {
            this.shader = new Shader(this.first.shader.roughness, this.first.shader.absorbtion, this.first.shader.color);
        }
        else {
            this.shader = new Shader(this.second.shader.roughness, this.second.shader.absorbtion, this.second.shader.color);
        }
        return c;
    }
}
export class Infinite {
    constructor(offset, object, shader = new Shader(1, .5)) {
        this.type = ShapeType.infinite;
        this.object = object;
        this.offset = offset;
        this.shader = shader;
    }
    distance(pos) {
        let q = new Position((((Math.abs(pos.x) + 0.5 * this.offset.x) % this.offset.x) - 0.5 * this.offset.x), (((Math.abs(pos.y) + 0.5 * this.offset.y) % this.offset.y) - 0.5 * this.offset.y), (((Math.abs(pos.z) + 0.5 * this.offset.z) % this.offset.z) - 0.5 * this.offset.z));
        q.x = this.offset.x == 0 ? pos.x : q.x;
        q.y = this.offset.y == 0 ? pos.y : q.y;
        q.z = this.offset.z == 0 ? pos.z : q.z;
        this.shader = new Shader(this.object.shader.roughness, this.object.shader.absorbtion, this.object.shader.color);
        return this.object.distance(q);
    }
}
export function processObjects(json) {
    let objects = [];
    json.forEach(object => {
        objects.push(jsonToObject(object));
    });
    return objects;
}
function jsonToObject(object) {
    switch (object.type) {
        case ShapeType.sphere:
            return new Sphere(object.position, object.radius, object.shader);
        case ShapeType.box:
            return new Box(object.position, object.shape, object.shader);
        case ShapeType.torus:
            return new Torus(object.position, object.major, object.minor, object.shader);
        case ShapeType.plane:
            return new Plane(object.position, object.shape, object.shader);
        case ShapeType.subtract:
            return new Subtract(jsonToObject(object.subtractor), jsonToObject(object.subtractee), object.shader);
        case ShapeType.union:
            return new Union(jsonToObject(object.first), jsonToObject(object.second));
        case ShapeType.intersect:
            return new Intersect(jsonToObject(object.first), jsonToObject(object.second));
        case ShapeType.infinite:
            return new Infinite(object.offset, jsonToObject(object.object));
        case ShapeType.rotate:
            return new Rotate(jsonToObject(object.object), object.rotation);
        default:
            break;
    }
}
//# sourceMappingURL=classes.js.map