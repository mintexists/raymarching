const _self = self as DedicatedWorkerGlobalScope;

let img: ImageData

let chunkCount = Math.floor(Math.sqrt(navigator.hardwareConcurrency)) || 2

class Position {
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

    constructor(x,y,z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

let rad2deg = (rad: number) => (180 / Math.PI) * rad
let deg2rad = (deg: number) => deg * (Math.PI / 180)

let pythag = (pos1: Position, pos2: Position=Position.zero) => Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z)

let localize = (pos1: Position, pos2: Position) => new Position(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z)

let normalize = (vector: Position) => {

    let length = pythag(new Position(0,0,0), vector)

    return new Position(vector.x / length, vector.y / length, vector.z / length)
}

let dot = (pos1: Position, pos2: Position) => pos1.x * pos2.x + pos1.y * pos2.y + pos1.z * pos2.z

let cross = (pos1: Position, pos2: Position) => new Position(
    (pos1.y*pos2.z) - (pos1.z*pos2.y), 
    (pos1.z*pos2.x) - (pos1.x*pos2.z), 
    (pos1.x*pos2.y) - (pos1.y*pos2.x),
)

let rotate = (pos: Position, yaw: number = 0, pitch: number = 0, roll: number = 0) => {
    let newRoll = new Position(
        pos.x + 0 + 0,
        0 + pos.y * Math.cos(deg2rad(roll)) + pos.z * -Math.sin(deg2rad(roll)),
        0 + pos.y * Math.sin(deg2rad(roll)) + pos.z * Math.cos(deg2rad(roll)),
    )
    let newPitch = new Position(
        newRoll.x *  Math.cos(deg2rad(pitch)) + newRoll.y * -Math.sin(deg2rad(pitch)) + 0,
        newRoll.x *  Math.sin(deg2rad(pitch)) + newRoll.y *  Math.cos(deg2rad(pitch)) + 0,
        0 + 0 + newRoll.z
    )
    let newYaw = new Position(
        newPitch.x *  Math.cos(deg2rad(yaw)) + 0 + newPitch.z * Math.sin(deg2rad(yaw)),
        0 + newPitch.y + 0,
        newPitch.x * -Math.sin(deg2rad(yaw)) + 0 + newPitch.z * Math.cos(deg2rad(yaw)),
    )
    return newYaw
} 

enum ShapeType {
    sphere,
    plane,
    box,
    torus,
    mandlebulb,
}


let sphereDist = (pos: Position, sphere) => pythag(pos, sphere.position) - sphere.radius

let planeDist = (pos: Position, plane) => {
    return dot(localize(pos, plane.position), normalize(plane.angle)) + plane.h
}

let boxDist = (pos: Position, box) => {
    if (!box.angle) {box.angle = {roll: 0, pitch: 0, yaw: 0}}
    let p = rotate(localize(pos, box.position), box.angle.yaw, box.angle.pitch, box.angle.roll)
    return Math.max(Math.abs(p.x) - box.b.x, Math.abs(p.y) - box.b.y, Math.abs(p.z) - box.b.z)
}

let torusDist = (pos: Position, torus) => {
    if (!torus.angle) {torus.angle = {roll: 0, pitch: 0, yaw: 0}}
    let p = rotate(localize(pos, torus.position), torus.angle.yaw, torus.angle.pitch, torus.angle.roll)
    let q = new Position( pythag(new Position(p.x, 0, p.z))-torus.major, p.y, 0)
    return pythag(q) - torus.minor
}

let mandlebulbDist = (pos: Position, mandlebulb) => {
    if (!mandlebulb.angle) {mandlebulb.angle = {roll: 0, pitch: 0, yaw: 0}}
    pos = rotate(localize(mandlebulb.position, pos), mandlebulb.angle.yaw, mandlebulb.angle.pitch, mandlebulb.angle.roll)

    let iterations  = 10**9//100 - pythag(Position.zero, pos)
    let maxBulbDist = 10**9//pythag(Position.zero, pos) * 100
    let power = 3

    let z = pos//rotate(/* localize(mandlebulb.position, pos) */pos, mandlebulb.angle.yaw, mandlebulb.angle.pitch, mandlebulb.angle.roll)

    let dr = 1
    let r = 0

    for (let it = 0; it < iterations; it++) {
        r = pythag(z)
        if (r > maxBulbDist) {
            break
        }
        let theta = Math.acos(z.z/r)
        let phi = Math.atan2(z.y,z.x)
        dr = Math.pow(r, power - 1) * power * dr + 1
        let zr = Math.pow(r, power)
        theta = theta * power
        phi = phi * power
        z = new Position(
            zr * Math.sin(theta) * Math.cos(phi),
            zr * Math.sin(phi) * Math.sin(theta),
            zr * Math.cos(theta)
        )
        z.x += pos.x
        z.y += pos.y
        z.z += pos.z
    }

    return 0.5*Math.log(r)*r/dr

}

let minStep = 1/100
let maxDistance = 500
let maxSteps = 200
let fov = 1

_self.addEventListener( 'message', ( evt ) => {

    if (chunkCount != evt.data.chunkCount) {
        chunkCount = evt.data.chunkCount
    }

    // console.log(sphereDist(evt.data.camera, evt.data.objects[0]))
    // console.log(planeDist(evt.data.camera, evt.data.objects[1]))

    if (!img) {
        img = new ImageData( evt.data.width, evt.data.height );
    }   
    
    for (let y = 0; y < evt.data.height; y++) {
        for (let x = 0; x < evt.data.width; x++) {

            let totalDistance = 0
            let distance = minStep
            let steps = 0

            let smallest: any

            let rayPos = new Position(evt.data.camera.x, evt.data.camera.y, evt.data.camera.z)
            
            let vector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch, evt.data.roll))
            
            while (true) {

                if (totalDistance > maxDistance || distance < minStep || steps > maxSteps) {
                    break
                }

                distance = maxDistance

                evt.data.objects.forEach(obj => {
                    switch (obj.type) {
                        case ShapeType.sphere:
                            obj.distance = Math.abs(sphereDist(rayPos, obj))
                            break;
                        case ShapeType.plane:
                            obj.distance = Math.abs(planeDist(rayPos, obj))
                            break;
                        case ShapeType.box:
                            obj.distance = Math.abs(boxDist(rayPos, obj))
                            break
                        case ShapeType.torus:
                            obj.distance = Math.abs(torusDist(rayPos, obj))
                            break
                        case ShapeType.mandlebulb:
                            obj.distance = Math.abs(mandlebulbDist(rayPos, obj))
                            break
                        default:
                            break;
                    }

                    if (obj.distance < distance) {
                        distance = obj.distance
                        smallest = obj
                    }

                })

                totalDistance += distance

                rayPos.x += vector.x * distance
                rayPos.y += vector.y * distance
                rayPos.z += vector.z * distance

                steps++

            }

            //let pixelindex = 4 * (x + y * img.width)
            let pixelindex = (y * evt.data.width + x) * 4

            let shade = 0//(((x + evt.data.x) / (evt.data.width) / 4) + ((y + evt.data.y) / (evt.data.height) / 4))

            if (distance < minStep) {
                // shade = (distance * (1/minStep))
                shade = ((1 - steps/maxSteps) ** 2) * 255

                if (smallest.color == undefined) {
                    smallest.color = {r: 255, g: 255, b: 255}
                }

                img.data[pixelindex]   = (shade - (255 - smallest.color.r))
                img.data[pixelindex+1] = (shade - (255 - smallest.color.b))
                img.data[pixelindex+2] = (shade - (255 - smallest.color.g))
                img.data[pixelindex+3] = 255
    
            } else {
                img.data[pixelindex]   = 0 * 255
                img.data[pixelindex+1] = 0 * 255
                img.data[pixelindex+2] = 0 * 255
                img.data[pixelindex+3] = 255

            }

        }
    }
  
    let bytes = new Uint8ClampedArray( img.data );
  
    self.postMessage( {
        type: 'end',
        bytes: bytes
    }, [bytes.buffer] );
});
  