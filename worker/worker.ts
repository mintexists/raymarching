import noise from "../perlin.js"

import {Position, Rotation, Shader, Color, ShapeType, Rotate, Sphere, Box, Torus, Plane, Subtract, Union, Intersect, Infinite, processObjects} from "./classes.js"

const _self = self as DedicatedWorkerGlobalScope;

let img: ImageData

let chunkCount = Math.floor(Math.sqrt(navigator.hardwareConcurrency)) || 2

let rad2deg = (rad: number) => (180 / Math.PI) * rad
let deg2rad = (deg: number) => deg * (Math.PI / 180)

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const norm = (val, max, min) => (val - min) / (max - min)

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

    // let radYaw = deg2rad(pitch)
    // let radPitch = deg2rad(yaw)
    // let radRoll = deg2rad(roll)
    // let cosYaw = Math.cos(radYaw)
    // let sinYaw = Math.sin(radYaw)
    // let cosPitch = Math.cos(radPitch)
    // let sinPitch = Math.sin(radPitch)
    // let cosRoll = Math.cos(radRoll)
    // let sinRoll = Math.sin(radRoll)

    // return new Position(
    //     (pos.x * cosYaw * cosPitch) + (pos.y * (cosYaw * sinPitch * sinRoll - sinYaw * cosRoll)) + (pos.z * (cosYaw * sinPitch * cosRoll + sinYaw * sinRoll)),
    //     (pos.x * cosYaw * cosPitch) + (pos.y * (sinYaw * sinPitch * sinRoll - cosYaw * cosRoll)) + (pos.z * (sinYaw * sinPitch * cosRoll + cosYaw * sinRoll)),
    //     (pos.x * -sinPitch) + (pos.y * cosPitch * sinRoll) + (pos.z * cosPitch * cosRoll),
    // )
}

let mixVector = (vec1: Position, vec2: Position, w = 1) => {
    return normalize(new Position(
        (vec1.x * w) + (vec2.x * (1 - w)),
        (vec1.y * w) + (vec2.y * (1 - w)),
        (vec1.z * w) + (vec2.z * (1 - w)),
    ))
}

let randomInUnitSphere = (scale: number = 1, x,y,i) => {
    let theta = random[x][y][i].x * Math.PI * 2
    let v = random[x][y][i].y
    let phi = Math.acos((2*v)-1);
    let r = Math.pow(random[x][y][i].z, 1/3);
    return new Position(
        scale * r * Math.sin(phi) * Math.cos(theta),
        scale * r * Math.sin(phi) * Math.sin(theta),
        scale * r * Math.cos(phi),
    )
   
}

let mandlebulbDist = (pos: Position, mandlebulb) => {
    if (!mandlebulb.angle) {mandlebulb.angle = {roll: 0, pitch: 0, yaw: 0}}
    pos = rotate(localize(mandlebulb.position, pos), mandlebulb.angle.yaw, mandlebulb.angle.pitch, mandlebulb.angle.roll)
    let iterations  = mandlebulb.iterations || 10
    let maxBulbDist = 10
    let power = mandlebulb.power
    let z = pos
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

let hexagonalPrismDist = (pos: Position, hexagonal) => {
    if (!hexagonal.angle) {hexagonal.angle = {roll: 0, pitch: 0, yaw: 0}}
    let p = rotate(localize(pos, hexagonal.position), hexagonal.angle.yaw, hexagonal.angle.pitch, hexagonal.angle.roll)

    //p = rotate(p, 0,0,0)

    p.x = Math.abs(p.x)
    p.z = Math.abs(p.z)
    p.y = Math.abs(p.y)

    //let k = normalize(new Position(0.57735, 0, 0.8660254))
    let k = new Position(2/3,0,1)

    let p1 = rotate(p, 60)

    return Math.max(
        p.x  - hexagonal.h.x * k.x,
        p.z  - hexagonal.h.x * k.z,
        p1.x - hexagonal.h.x * k.x,
        p1.z - hexagonal.h.x * k.z,
        p.y -  hexagonal.h.y,
    )
}
 
let infinite = (pos: Position, infinite) => {
    let q = new Position((((Math.abs(pos.x) + 0.5 * infinite.c.x) % infinite.c.x)-0.5*infinite.c.x), (((Math.abs(pos.y) + 0.5 * infinite.c.y) % infinite.c.y)-0.5*infinite.c.y), (((Math.abs(pos.z) + 0.5 * infinite.c.z) % infinite.c.z)-0.5*infinite.c.z))
    q.x = infinite.c.x == 0 ? pos.x : q.x
    q.y = infinite.c.y == 0 ? pos.y : q.y
    q.z = infinite.c.z == 0 ? pos.z : q.z

    if (!infinite.color) {
        if (infinite.object.color) {
            infinite.altColor = infinite.object.color
        } else if (infinite.object.altColor) {
            infinite.altColor = infinite.object.altColor
        }
    }

    // return calcDist(q, infinite.object)
}

let calcNormal = (p: Position, obj) => { // SOMETHING IS WRONBG HELP
    let eps = 0.0001
    let h = new Position(eps, 0, 0)
    let xyyP = new Position(p.x + h.x, p.y + h.y, p.z + h.y)
    let xyyM = new Position(p.x - h.x, p.y - h.y, p.z - h.y)
    let yxyP = new Position(p.x + h.y, p.y + h.x, p.z + h.y)
    let yxyM = new Position(p.x - h.y, p.y - h.x, p.z - h.y)
    let yyxP = new Position(p.x + h.y, p.y + h.y, p.z + h.x)
    let yyxM = new Position(p.x - h.y, p.y - h.y, p.z - h.x)
    return normalize(new Position(
        // calcDist(xyyP, obj) - calcDist(xyyM, obj),
        // calcDist(yxyP, obj) - calcDist(yxyM, obj),
        // calcDist(yyxP, obj) - calcDist(yyxM, obj),
        obj.distance(xyyP) - obj.distance(xyyM),
        obj.distance(yxyP) - obj.distance(yxyM),
        obj.distance(yyxP) - obj.distance(yyxM),
    ))
}

let calcReflect = (v: Position, n: Position) => {
    return new Position(
        (v.x - 2 * dot(v,n) * n.x),
        (v.y - 2 * dot(v,n) * n.y),
        (v.z - 2 * dot(v,n) * n.z),
    )
}

let calcRefract = (v: Position, n: Position, n1: number, n2: number) => {
    let c = dot(new Position(-n.x, -n.y, -n.z), v)
    let r = n1/n2
    return new Position(
        r * v.x + (r * c - Math.sqrt(1 - Math.pow(r, 2) * (1 - Math.pow(c,2)))) * n.x,
        r * v.y + (r * c - Math.sqrt(1 - Math.pow(r, 2) * (1 - Math.pow(c,2)))) * n.y,
        r * v.z + (r * c - Math.sqrt(1 - Math.pow(r, 2) * (1 - Math.pow(c,2)))) * n.z,
    )
}

let minStep = 1/100
let maxDistance = 100
let maxSteps = Infinity
let fov = 1.5

function castRay(pos: Position, vector: Position, objects: Array<any> = [], ignore: any = undefined, i: any) {
    let totalDistance = 0
    let distance = maxDistance
    let object
    let rayPos = new Position(pos.x, pos.y, pos.z)
    vector = new Position(vector.x, vector.y, vector.z)
    let normal: Position
    let steps = 0

    do {
    // while (!(totalDistance > maxDistance || distance < minStep || steps > maxSteps)) {
        distance = maxDistance
        let ignoreDist = Infinity
        if (ignore) {
            ignoreDist = ignore.distance(rayPos)
        }
        objects.forEach(obj => {
            let objDist = Math.abs(obj.distance(rayPos))
            if (objDist != ignoreDist) {
                if ((objDist) < distance && Math.random() < obj.shader.density) {
                    distance = (objDist)
                    object = obj
                }
            }
        })

        // if (light) {
        //     let dist = pythag(rayPos, light.position)
        //     if (Math.abs(dist) < distance) {
        //         distance = Math.abs(dist) 
        //         object = light
        //     }
        // }

        totalDistance += distance
        rayPos.x += vector.x * distance
        rayPos.y += vector.y * distance
        rayPos.z += vector.z * distance

        steps ++
    } while (!(totalDistance > maxDistance || distance < minStep || steps > maxSteps))
    return {
        object: object,
        normal: normal,
        pos: rayPos,
        steps: steps,
        distance: distance,
        totalDistance: totalDistance,
    }
}

let random: Array<Array<Array<any>>> = []
let genRandom = true

_self.addEventListener( 'message', ( evt ) => {

    let objects = processObjects(evt.data.objects)

    minStep = evt.data.minStep || minStep

    if (chunkCount != evt.data.chunkCount) {
        chunkCount = evt.data.chunkCount
    }

    if (genRandom) {
        for (let y = 0; y < evt.data.height; y++) {
            for (let x = 0; x < evt.data.width; x++) {
                if (!random[x]) {
                    random[x] = []
                }
                random[x][y] = []//new Position((Math.random() - .5) * 2, (Math.random() - .5) * 2, (Math.random() - .5) * 2)
                // This is fucked up gotta make it sasve the thingy
                for (let i = 0; i < Math.max(evt.data.samples, evt.data.maxBounces); i++) {
                    random[x][y][i] = new Position(Math.random(), Math.random(), Math.random())
                }
            }
        }
        genRandom = true
    }

    // console.log(sphereDist(evt.data.camera, evt.data.objects[0]))
    // console.log(infPlane(evt.data.camera, evt.data.objects[1]))

    if (!img) {
        img = new ImageData( evt.data.width, evt.data.height );
    }   
    
    for (let y = 0; y < evt.data.height; y++) {
        for (let x = 0; x < evt.data.width; x++) {

            let samples: Array<any> = []
            let light = []
            let normal: Position

            for (let i = 0; i < evt.data.samples; i++) {
                // if (!random[x][y][i]) {
                //     random[x][y][i] = new Position(Math.random(), Math.random(), Math.random())
                // }
    
                let maxBounces = evt.data.maxBounces
                maxDistance = evt.data.maxDistance
    
                let colors: Array<any> = []
                let lighting: Array<any> = []
    
                let sky = evt.data.sky
    
                let pos = new Position(evt.data.camera.x, evt.data.camera.y, evt.data.camera.z)
                let vector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch, evt.data.roll))
                let origVector = normalize(rotate(new Position(1, -(((y + evt.data.y) / (evt.data.height) / chunkCount) - .5) * fov, (((x + evt.data.x) / (evt.data.width) / chunkCount) - .5) * fov), evt.data.yaw, evt.data.pitch, evt.data.roll))
                let ray: any
                // let normal: Position
                let lastObject
                let refractObject
                let lastIOR = 1
    
                for (let b = 0; b < maxBounces; b++) {
                    ray = castRay(pos, vector, objects, lastObject, [x,y,i])
                    lastObject = ray.object
                    // console.log(ray)
                    // debugger
                    // if (true) {
                    // if (ray.totalDistance < maxDistance && ray.steps < maxSteps) {
                    if (ray.distance < minStep) {
                        colors.push({r: (ray.object.shader.color.r/255), g: (ray.object.shader.color.g/255), b: (ray.object.shader.color.b/255)})
                        lighting.push(1 - ray.object.shader.absorbtion)
                    } else {
                        colors.push({r: evt.data.sky.color.r/255, g: evt.data.sky.color.g/255, b: evt.data.sky.color.b/255})
                        lighting.push((vector.y + (pos.y / maxDistance)) * sky.brightness)
                        break
                    }
                    normal = calcNormal(ray.pos, ray.object)
                    // let metalVector = calcReflect(vector, normal)
                    //vector = calcReflect(vector, normal)
                    let diffuse = randomInUnitSphere(1, x, y, i)
                    diffuse.x += normal.x
                    diffuse.y += normal.y
                    diffuse.z += normal.z
                    diffuse = normalize(diffuse)

                    let reflect = normalize(calcReflect(vector, normal))

                    // Make this some kind of 4d array thingy please
                    if ((random[x][y][i].x + random[x][y][b].y) % 1 < ray.object.shader.transmission) {

                        // Use a ray cast for this i think so u can yknow whatitcalled hit things
                        if (ray.object.distance(ray.pos) < 0) {
                            // If inside the object

                            // vector = calcRefract(vector, new Position(-normal.x, -normal.y, -normal.z), ray.object.shader.ior, 1)
                            vector = normalize(calcRefract(vector, normal, ray.object.shader.ior, lastIOR))

                            // This needs to loop through *all* the objects, not just the one hit
                            let a = objects.filter((i) => i.distance(ray.pos) != ray.object.distance(ray.pos)).reduce((a,b) => Math.min(Math.abs(b.distance(ray.pos)), a), Infinity)
                            

                            while (ray.object.distance(ray.pos) < minStep && a < minStep) {

                                ray.pos.x += vector.x * minStep
                                ray.pos.y += vector.y * minStep
                                ray.pos.z += vector.z * minStep
                            }

                        } else {
                            // If outside the object

                            vector = normalize(calcRefract(vector, normal, lastIOR, ray.object.shader.ior))
                            
                            // while (Math.abs(ray.object.distance(ray.pos)) < minStep) {
                            //     ray.pos.x += vector.x * minStep
                            //     ray.pos.y += vector.y * minStep
                            //     ray.pos.z += vector.z * minStep
                            // }
                            ray.pos.x += vector.x * minStep * 3
                            ray.pos.y += vector.y * minStep * 3
                            ray.pos.z += vector.z * minStep * 3

                        }

                        // vector = calcRefract(vector, new Position(-normal.x, -normal.y, -normal.z), ray.object.shader.ior, 1)
                        // vector = calcRefract(vector, normal, lastIOR, ray.object.shader.ior)

                        // refractObject = JSON.stringify(ray.object)
                        lastIOR = ray.object.shader.ior
                        lastObject = undefined

                    } else {
                        vector = mixVector(diffuse, reflect, ray.object.shader.roughness)
                    }

                    pos = ray.pos
                }
    
                let color = colors.reduce((a,b) => {
                    return {r: a.r * b.r, g: a.g * b.g, b: a.b * b.b}
                })
                
                samples.push(color)

                light.push(lighting.reduce((a,b) => a * b))
            }

            let color = (samples.reduce((a,b) => {
                return {r: a.r + b.r, g: a.g + b.g, b: a.b + b.b}
            })) // / samples.length) * 255

            let shade = light.reduce((a,b) => a+b) / light.length

            color.r /= samples.length
            color.g /= samples.length
            color.b /= samples.length

            color.r *= (shade)
            color.g *= (shade)
            color.b *= (shade)

            color.r *= 255
            color.g *= 255
            color.b *= 255

            let pixelindex = (y * evt.data.width + x) * 4

            img.data[pixelindex]   = color.r
            img.data[pixelindex+1] = color.g
            img.data[pixelindex+2] = color.b
            img.data[pixelindex+3] = 255

            // img.data[pixelindex]   = shade * 255
            // img.data[pixelindex+1] = shade * 255
            // img.data[pixelindex+2] = shade * 255
            // img.data[pixelindex+3] = 255

            // img.data[pixelindex]   = Math.abs(vector.x) * 255
            // img.data[pixelindex+1] = Math.abs(vector.y) * 255
            // img.data[pixelindex+2] = Math.abs(vector.z) * 255
            // img.data[pixelindex+3] = 255

            // normal = normal || new Position(0,0,0)

            // img.data[pixelindex]   = normal.x * 255
            // img.data[pixelindex+1] = normal.y * 255
            // img.data[pixelindex+2] = normal.z * 255
            // img.data[pixelindex+3] = 255

        }
    }
  
    let bytes = new Uint8ClampedArray( img.data );
  
    // console.log("Done")

    self.postMessage( {
        type: 'end',
        bytes: bytes
    }, [bytes.buffer] );
});
  