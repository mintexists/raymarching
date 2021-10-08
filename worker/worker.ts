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

let rotate = (pos: Position, yaw: number, pitch: number) => {

    let newPitch = new Position(
        pos.x *  Math.cos(deg2rad(pitch)) + pos.y * -Math.sin(deg2rad(pitch)) + 0,
        pos.x *  Math.sin(deg2rad(pitch)) + pos.y *  Math.cos(deg2rad(pitch)) + 0,
        0 + 0 + pos.z
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
}


let sphereDist = (pos: Position, sphere) => pythag(pos, sphere.position) - sphere.radius

let planeDist = (pos: Position, plane) => {
    return dot(localize(pos, plane.position), normalize(plane.angle)) + plane.h
}

let boxDist = (pos: Position, box) => {
    let p = localize(pos, box.position)
    
    return Math.max(Math.abs(p.x) - box.b.x, Math.abs(p.y) - box.b.y, Math.abs(p.z) - box.b.z)
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

            let rayPos = new Position(evt.data.camera.x, evt.data.camera.y, evt.data.camera.z)
            
            let vector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch))
            
            while (true) {

                if (totalDistance > maxDistance || distance < minStep || steps > maxSteps) {
                    break
                }

                let distances: Array<number> = []

                evt.data.objects.forEach(object => {
                    switch (object.type) {
                        case ShapeType.sphere:
                            distances.push(Math.abs(sphereDist(rayPos, object)))
                            break;
                        case ShapeType.plane:
                            distances.push(Math.abs(planeDist(rayPos, object)))
                            break;
                        case ShapeType.box:
                            distances.push(Math.abs(boxDist(rayPos, object)))
                        default:
                            break;
                    }
                });

                distance = Math.min(...distances)

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
                shade = (1 - steps/maxSteps) ** 2
            }

            img.data[pixelindex] = shade*255
            img.data[pixelindex+1] = shade*255
            img.data[pixelindex+2] = shade*255
            img.data[pixelindex+3] = 255
        }
    }
  
    let bytes = new Uint8ClampedArray( img.data );
  
    self.postMessage( {
        type: 'end',
        bytes: bytes
    }, [bytes.buffer] );
});
  