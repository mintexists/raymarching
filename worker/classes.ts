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

export class Color {
    r: number
    g: number
    b: number

    constructor(r: number, g: number, b: number) {
        this.r = r
        this.g = g
        this.b = b
    }
}

export class Shader {
    color: Color
    roughness: number
    absorbtion: number
    density: number
    transmission: number
    ior: number

    constructor(roughness: number, absorbtion: number, color: Color = new Color(255,255,255), density: number = 1, transmission: number = 0, ior: number = 1) {
        this.color = color
        this.roughness = roughness
        this.absorbtion = absorbtion
        this.density = density
        this.transmission = transmission
        this.ior = ior
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
    rotate,
}

export class Rotate {
    type = ShapeType.rotate
    rotation: Rotation
    object: any
    shader: Shader

    constructor(object: any, rotation: Rotation) {
        this.object = object
        this.rotation = rotation
        this.shader = this.object.shader
    }

    distance(pos: Position) {
        return this.object.distance(rotate(pos, this.rotation))
    }
}

export class Sphere {
    type = ShapeType.sphere
    position: Position
    radius: number
    shader: Shader
    
    constructor (position: Position, radius: number, shader: Shader = new Shader(1, .5)) {
        this.position = position
        this.radius = radius
        this.shader = shader
    }

    distance(pos: Position) {
        return pythag(pos, this.position) - this.radius
    }
}

export class Box {
    type = ShapeType.box
    position: Position
    shape: Position
    shader: Shader

    constructor (position: Position, shape: Position, shader: Shader = new Shader(1, .5)) {
        this.position = position
        this.shape = shape
        this.shader = shader
    }

    distance(pos: Position) {
        let p = localize(pos, this.position)
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.y) - this.shape.y, Math.abs(p.z) - this.shape.z)
    }
}

export class Torus {
    type = ShapeType.torus
    position: Position
    major: number
    minor: number
    shader: Shader

    constructor (position: Position, major: number, minor: number, shader: Shader = new Shader(1, .5)) {
        this.position = position
        this.major = major
        this.shader = shader
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
    shader: Shader
    
    constructor(position: Position, shape: Position, shader: Shader = new Shader(1, .5)) {
        this.position = position
        this.shape = shape
        this.shader = shader
    }

    distance(pos: Position) {
        let p = localize(pos, this.position)
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.y), Math.abs(p.z) - this.shape.y)
    }
}

export class Subtract {
    type = ShapeType.subtract
    subtractor: any
    subtractee: any
    shader: Shader

    constructor(subtractor: any, subtractee: any, shader: Shader = new Shader(1, .5)) {
        this.subtractor = subtractor
        this.subtractee = subtractee
        this.shader = shader
    }

    distance(pos: Position) {
        let a = -this.subtractor.distance(pos)
        let b = this.subtractee.distance(pos)
        let c = Math.max(a,b)
        // if (c == a) {
        //     this.shader = new Shader(this.subtractor.shader.roughness, this.subtractor.shader.absorbtion, this.subtractor.shader.color)
        // } else {
        //     this.shader = new Shader(this.subtractee.shader.roughness, this.subtractee.shader.absorbtion, this.subtractee.shader.color)
        // }
        // this.shader = new Shader(this.subtractor.shader.roughness, this.subtractor.shader.absorbtion, this.subtractor.shader.color)
        // this.shader = this.subtractee.shader
        return c
    }
}

export class Union {
    type = ShapeType.union
    first: any
    second: any
    shader: Shader

    constructor(first: any, second: any, shader: Shader = new Shader(1, .5)) {
        this.first = first
        this.second = second
        this.shader = shader
    }

    distance(pos: Position) {
        let a = this.first.distance(pos)
        let b = this.second.distance(pos)
        let c = Math.min(a,b)
        if (c == a) {
            this.shader = new Shader(this.first.shader.roughness, this.first.shader.absorbtion, this.first.shader.color)
        } else {
            this.shader = new Shader(this.second.shader.roughness, this.second.shader.absorbtion, this.second.shader.color)
        }
        return c
    }
}

export class Intersect {
    type = ShapeType.intersect
    first: any
    second: any
    shader: Shader

    constructor(first: any, second: any, shader: Shader = new Shader(1, .5)) {
        this.first = first
        this.second = second
        this.shader = shader
    }

    distance(pos: Position) {
        let a = this.first.distance(pos)
        let b = this.second.distance(pos)
        let c = Math.max(a,b)
        if (c == a) {
            this.shader = new Shader(this.first.shader.roughness, this.first.shader.absorbtion, this.first.shader.color)
        } else {
            this.shader = new Shader(this.second.shader.roughness, this.second.shader.absorbtion, this.second.shader.color)
        }
        return c
    }
}

export class Infinite {
    type = ShapeType.infinite
    offset: Position
    object: any
    shader: Shader

    constructor(offset: Position, object: any, shader: Shader = new Shader(1, .5)) {
        this.object = object
        this.offset = offset
        this.shader = shader
    }

    distance(pos: Position) {
        let q = new Position((((Math.abs(pos.x) + 0.5 * this.offset.x) % this.offset.x)-0.5*this.offset.x), (((Math.abs(pos.y) + 0.5 * this.offset.y) % this.offset.y)-0.5*this.offset.y), (((Math.abs(pos.z) + 0.5 * this.offset.z) % this.offset.z)-0.5*this.offset.z))
        q.x = this.offset.x == 0 ? pos.x : q.x
        q.y = this.offset.y == 0 ? pos.y : q.y
        q.z = this.offset.z == 0 ? pos.z : q.z

        this.shader = new Shader(this.object.shader.roughness, this.object.shader.absorbtion, this.object.shader.color)

        return this.object.distance(q)
    }
}

export function processObjects(json) {
    let objects: Array<any> = []
    json.forEach(object => {
        objects.push(jsonToObject(object))
    });
    return objects
}

function jsonToObject(object) {
    switch (object.type) {
        case ShapeType.sphere:
            return new Sphere(object.position, object.radius, object.shader)
        case ShapeType.box:
            return new Box(object.position, object.shape, object.shader)
        case ShapeType.torus:
            return new Torus(object.position, object.major, object.minor, object.shader)
        case ShapeType.plane:
            return new Plane(object.position, object.shape, object.shader)
        case ShapeType.subtract:
            return new Subtract(jsonToObject(object.subtractor), jsonToObject(object.subtractee), object.shader)
        case ShapeType.union:
            return new Union(jsonToObject(object.first), jsonToObject(object.second))
        case ShapeType.intersect:
            return new Intersect(jsonToObject(object.first), jsonToObject(object.second))
        case ShapeType.infinite:
            return new Infinite(object.offset, jsonToObject(object.object))
        case ShapeType.rotate:
            return new Rotate(jsonToObject(object.object), object.rotation)
        default:
            break;
    }
}