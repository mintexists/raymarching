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
})(ShapeType || (ShapeType = {}));
export class Rotate {
    constructor(object, rotation) {
        this.object = object;
        this.rotation = rotation;
    }
    distance(pos) {
        this.object.distance(rotate(pos, this.rotation));
    }
}
export class Sphere {
    constructor(position, radius) {
        this.type = ShapeType.sphere;
        this.position = position;
        this.radius = radius;
    }
    distance(pos) {
        pythag(pos, this.position) - this.radius;
    }
}
export class Box {
    constructor(position, shape) {
        this.type = ShapeType.box;
        this.position = position;
        this.shape = shape;
    }
}
export class Torus {
    constructor(position, major, minor) {
        this.type = ShapeType.torus;
        this.position = position;
        this.major = major;
        this.minor = minor;
    }
    distance(pos) {
        let p = localize(pos, this.position);
        let q = new Position(pythag(new Position(p.x, 0, p.z)) - this.major, p.y, 0);
        return pythag(q) - this.minor;
    }
}
export class Plane {
    constructor(position, shape) {
        this.type = ShapeType.plane;
        this.position = position;
        this.shape = shape;
    }
    distance(pos) {
        let p = localize(pos, this.position);
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.y), Math.abs(p.z) - this.shape.y);
    }
}
export class Subtract {
    constructor(subtractor, subtractee) {
        this.subtractor = subtractor;
        this.subtractee = subtractee;
    }
    distance(pos) {
        return Math.max(-this.subtractor.distance(pos), this.subtractee.distance(pos));
    }
}
export class Union {
    constructor(first, second) {
        this.first = first;
        this.second = second;
    }
    distance(pos) {
        return Math.min(this.first.distance(pos), this.second.distance(pos));
    }
}
export class Intersect {
    constructor(first, second) {
        this.first = first;
        this.second = second;
    }
    distance(pos) {
        return Math.max(this.first.distance(pos), this.second.distance(pos));
    }
}
export class Infinite {
    constructor(offset, object) {
        this.object = object;
        this.offset = offset;
    }
    distance(pos) {
        let q = new Position((((Math.abs(pos.x) + 0.5 * this.offset.x) % this.offset.x) - 0.5 * this.offset.x), (((Math.abs(pos.y) + 0.5 * this.offset.y) % this.offset.y) - 0.5 * this.offset.y), (((Math.abs(pos.z) + 0.5 * this.offset.z) % this.offset.z) - 0.5 * this.offset.z));
        q.x = this.offset.x == 0 ? pos.x : q.x;
        q.y = this.offset.y == 0 ? pos.y : q.y;
        q.z = this.offset.z == 0 ? pos.z : q.z;
        return this.object.distance(q);
    }
}
//# sourceMappingURL=classes.js.map