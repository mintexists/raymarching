let pythag = (pos1: Position, pos2: Position=Position.zero) => Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z)

let localize = (pos1: Position, pos2: Position) => new Position(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z)

let rad2deg = (rad: number) => (180 / Math.PI) * rad
let deg2rad = (deg: number) => deg * (Math.PI / 180)

let rotate = (pos: Position, rotation: Rotation) => {
    let newRoll = new Position(
        pos.x + 0 + 0,
        0 + pos.y * Math.cos(deg2rad(rotation.x)) + pos.z * -Math.sin(deg2rad(rotation.x)),
        0 + pos.y * Math.sin(deg2rad(rotation.x)) + pos.z * Math.cos(deg2rad(rotation.x)),
    )
    let newPitch = new Position(
        newRoll.x *  Math.cos(deg2rad(rotation.z)) + newRoll.y * -Math.sin(deg2rad(rotation.z)) + 0,
        newRoll.x *  Math.sin(deg2rad(rotation.z)) + newRoll.y *  Math.cos(deg2rad(rotation.z)) + 0,
        0 + 0 + newRoll.z
    )
    let newYaw = new Position(
        newPitch.x *  Math.cos(deg2rad(rotation.y)) + 0 + newPitch.z * Math.sin(deg2rad(rotation.y)),
        0 + newPitch.y + 0,
        newPitch.x * -Math.sin(deg2rad(rotation.y)) + 0 + newPitch.z * Math.cos(deg2rad(rotation.y)),
    )
    return newYaw
}

export class Position {
    x: number
    y: number
    z: number

    static zero = new Position(0,0,0)
    static forward = new Position(1,0,0)
    static back = new Position(-1,0,0)
    static up = new Position(0,1,0)
    static down = new Position(0,-1,0)
    static left = new Position(0,0,-1)
    static right = new Position(0,0,1)

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x
        this.y = y
        this.z = z
    }
}

export class Rotation {
    x: number
    y: number
    z: number

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x
        this.y = y
        this.z = z
    }
}

export enum ShapeType {
    sphere, // finyished UwU
    infPlane, // Deprecate this please uwu
    box, // finyished UwU
    torus, // finyished UwU
    mandlebulb,
    plane, // finyished UwU
    subtract, // finyished UwU
    union, // finyished UwU
    intersect, // finyished UwU
    infinite, // finyished UwU
    hexagonalPrism,
}

export class Rotate {
    rotation: Rotation
    object: any

    constructor(object: any, rotation: Rotation) {
        this.object = object
        this.rotation = rotation
    }

    distance(pos: Position) {
        this.object.distance(rotate(pos, this.rotation))
    }
}

export class Sphere {
    type = ShapeType.sphere
    position: Position
    radius: number
    
    constructor (position: Position, radius: number) {
        this.position = position
        this.radius = radius
    }

    distance(pos: Position) {
        pythag(pos, this.position) - this.radius
    }
}

export class Box {
    type = ShapeType.box
    position: Position
    shape: Position

    constructor (position: Position, shape: Position) {
        this.position = position
        this.shape = shape
    }
}

export class Torus {
    type = ShapeType.torus
    position: Position
    major: number
    minor: number

    constructor (position: Position, major: number, minor: number) {
        this.position = position
        this.major = major
        this.minor = minor
    }

    distance(pos: Position) {
        let p = localize(pos, this.position)
        let q = new Position(pythag(new Position(p.x, 0, p.z))-this.major, p.y, 0)
        return pythag(q) - this.minor
    }
}

export class Plane {
    type = ShapeType.plane
    position: Position
    shape: Position
    
    constructor(position: Position, shape: Position) {
        this.position = position
        this.shape = shape
    }

    distance(pos: Position) {
        let p = localize(pos, this.position)
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.y), Math.abs(p.z) - this.shape.y)
    }
}

export class Subtract {
    subtractor: any
    subtractee: any

    constructor(subtractor: any, subtractee: any) {
        this.subtractor = subtractor
        this.subtractee = subtractee
    }

    distance(pos: Position) {
        return Math.max(
            -this.subtractor.distance(pos),
            this.subtractee.distance(pos)
        )
    }
}

export class Union {
    first: any
    second: any

    constructor(first: any, second: any) {
        this.first = first
        this.second = second
    }

    distance(pos: Position) {
        return Math.min(
            this.first.distance(pos),
            this.second.distance(pos)
        )
    }
}

export class Intersect {
    first: any
    second: any

    constructor(first: any, second: any) {
        this.first = first
        this.second = second
    }

    distance(pos: Position) {
        return Math.max(
            this.first.distance(pos),
            this.second.distance(pos)
        )
    }
}

export class Infinite {
    offset: Position
    object: any

    constructor(offset: Position, object: any) {
        this.object = object
        this.offset = offset
    }

    distance(pos: Position) {
        let q = new Position((((Math.abs(pos.x) + 0.5 * this.offset.x) % this.offset.x)-0.5*this.offset.x), (((Math.abs(pos.y) + 0.5 * this.offset.y) % this.offset.y)-0.5*this.offset.y), (((Math.abs(pos.z) + 0.5 * this.offset.z) % this.offset.z)-0.5*this.offset.z))
        q.x = this.offset.x == 0 ? pos.x : q.x
        q.y = this.offset.y == 0 ? pos.y : q.y
        q.z = this.offset.z == 0 ? pos.z : q.z

        return this.object.distance(q)
    }
}