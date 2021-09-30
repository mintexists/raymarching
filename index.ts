let canvas = document.getElementById("canvas") as HTMLCanvasElement
let ctx = canvas.getContext("2d")

let scaleX = 10
let scaleY = -10

let xOffset = canvas.width / 2
let yOffset = canvas.height / 2

let minStep = 1/10
let maxDistance = 500

let mouseDown = false

let rad2deg = (rad: number) => 180 / (Math.PI * rad)
let deg2rad = (deg: number) => deg * (Math.PI / 180)

let pythag = (pos1: Position, pos2: Position) => Math.sqrt((pos1.x-pos2.x)**2 + (pos1.y-pos2.y)**2)

function sMin(a: number, b: number, k: number) {
    let h: number = Math.max(k - Math.abs(a - b), 0) / k
    return Math.min(a, b) - h * h * k * (1/4)
}

class Position {
    x: number
    y: number
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

class Circle {
    position: Position
    radius: number
    constructor(position = new Position(0,0), radius = 1) {
        this.position = position
        this.radius = radius
    }

    distance(pos: Position, radius = this.radius) {
        return pythag(pos, this.position) - radius
    }
}

class Rectangle {
    position: Position
    width: number
    height: number
    angle: number
    radAngle: number
    constructor(position = new Position(0,0), width, height = 1, angle = 0 ) {
        this.angle = angle
        this.position = position
        this.width = width
        this.height = height
    }

    distance(pos: Position) {
        this.radAngle = deg2rad(this.angle)
        let localPos = new Position(pos.x - this.position.x, pos.y - this.position.y)
        let newPos = new Position(
            localPos.x * Math.cos(this.radAngle) - localPos.y * Math.sin(this.radAngle), 
            localPos.y * Math.cos(this.radAngle) + localPos.x * Math.sin(this.radAngle)
        )
        return Math.max(Math.abs(newPos.x) - this.width/2, Math.abs(newPos.y) - this.height/2)
    }
}

class Subtract {
    subtractee: any
    subtractor: any
    constructor(subtractee, subtractor) {
        this.subtractee = subtractee
        this.subtractor = subtractor
    }

    distance(pos: Position) {
        return Math.max(-this.subtractor.distance(pos), this.subtractee.distance(pos))
    }
}

class Intersect {
    intersectee: any 
    intersector: any
    constructor(intersectee, intersector) {
        this.intersectee = intersectee
        this.intersector = intersector
    }

    distance(pos: Position) {
        return Math.max(this.intersector.distance(pos), this.intersectee.distance(pos))
    }
}

class Union {
    first: any
    second: any
    k: number
    constructor(first, second, k = minStep) {
        this.first = first
        this.second = second
        this.k = k
    }

    distance(pos: Position) {
        return sMin(this.first.distance(pos), this.second.distance(pos), this.k)
        //return Math.min(this.first.distance(pos), this.second.distance(pos))
    }
}

class Round {
    object: any
    radius: number
    constructor(object, radius) {
        this.object = object
        this.radius = radius
    }

    distance(pos: Position) {
        return this.object.distance(pos) - this.radius
    }
}

class Onion {
    object: any
    width: number 
    constructor(object, width) {
        this.object = object
        this.width = width
    }

    distance(pos: Position) {
        return Math.abs(this.object.distance(pos)) - this.width
    }
}

let objects = []

//objects.push(new Circle(new Position(-30, 0), 5))

//objects.push(new Onion(new Rectangle(new Position(-30,20), 20, 10), 1))

//objects.push(new Rectangle(new Position(20, 0), 20, 10))
//objects.push(new Rectangle(new Position(20, 20), 20, 10, 0))


// objects.push(new Circle(new Position(30,0), 20))

//objects.push(new Subtract(new Circle(new Position(30,0), 15), new Onion(new Rectangle(new Position(20, 0), 20, 10, 20), 2)))

objects.push(
    new Union(
        new Subtract(
            new Rectangle(new Position(0,0), 20, 20, 45),
            new Rectangle(new Position(0,14.14), 28.28, 28.28)
        ),
        new Union(
            new Intersect(
                new Circle(new Position(-7.07, 0), 7.07),
                new Rectangle(new Position(0,7.07), 30, 30, 45),
            ),
            new Intersect(
                new Circle(new Position(7.07, 0), 7.07),
                new Rectangle(new Position(0,7.07), 30, 30, 45),
            ),
        )
    )
)

let camera = new Position(0,0)

function draw() {

    ctx.fillStyle = "black"
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillRect(0,0,canvas.width,canvas.height)

    ctx.fillStyle = "white"
    for (let i = 0; i < 360; i+=1/15) {

        let rayPos = new Position(camera.x, camera.y)

        let distance = minStep;
        let totalDistance = 0

        while (true) {

            if (totalDistance > maxDistance || distance < minStep) {
                break
            }

            let distances: Array<number> = []

            objects.forEach(object => {
                distances.push(Math.abs(object.distance(rayPos)))
            })

            /*distance = maxDistance
            distances.forEach(dist => {
                distance = sMin(distance, dist, .1)
            })*/

            distance = Math.min(...distances)
            totalDistance += distance

            if (/* i % 36 == 0 */ false) {
                ctx.strokeStyle = "black"
                ctx.beginPath();
                ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset)
                ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset)
                ctx.stroke();

                ctx.strokeStyle = "red"
                ctx.beginPath()
                ctx.arc(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset, distance * scaleX, 0, 2 * Math.PI);
                ctx.stroke()
            }


            rayPos.x += Math.cos(deg2rad(i)) * distance
            rayPos.y += Math.sin(deg2rad(i)) * distance

        }

        ctx.strokeStyle = "white"
        ctx.beginPath()
        ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset)
        ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset)
        ctx.stroke()
        
    }

}

function getMousePos(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', e => {
    camera.x = (e.offsetX - xOffset) / scaleX;
    camera.y = (e.offsetY - yOffset) / scaleY;
    mouseDown = true
});

canvas.addEventListener('mousemove', e => {
    if (mouseDown == true) {
        camera.x = (e.offsetX - xOffset) / scaleX;
        camera.y = (e.offsetY - yOffset) / scaleY;    
    }
});

canvas.addEventListener('mouseup', e => {
    if (mouseDown == true) {
        camera.x = (e.offsetX - xOffset) / scaleX;
        camera.y = (e.offsetY - yOffset) / scaleY; 
        mouseDown = false   
    }
});
  

function main() {

    draw()

    window.requestAnimationFrame(main)
}

main()