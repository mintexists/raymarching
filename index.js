let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let scaleX = 10;
let scaleY = -10;
let xOffset = canvas.width / 2;
let yOffset = canvas.height / 2;
let minStep = 1 / 100;
let maxDistance = 500;
let mouseDown = false;
let rad2deg = (rad) => 180 / (Math.PI * rad);
let deg2rad = (deg) => deg * (Math.PI / 180);
let pythag = (pos1, pos2) => Math.sqrt(Math.pow((pos1.x - pos2.x), 2) + Math.pow((pos1.y - pos2.y), 2));
function sMin(a, b, k) {
    let h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * (1 / 4);
}
class Position {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}
class Circle {
    constructor(position = new Position(0, 0), radius = 1) {
        this.position = position;
        this.radius = radius;
    }
    distance(pos, radius = this.radius) {
        return pythag(pos, this.position) - radius;
        //return Math.sqrt( (pos.x - this.position.x) ** 2 + (pos.y - this.position.y) ** 2) - radius
    }
}
class Rectangle {
    constructor(position = new Position(0, 0), width = 1, height = 1) {
        this.position = position;
        this.width = width;
        this.height = height;
    }
    distance(pos) {
        let localPos = new Position(pos.x - this.position.x, pos.y - this.position.y);
        return Math.max(Math.abs(localPos.x) - this.width / 2, Math.abs(localPos.y) - this.height / 2);
    }
}
class Subtract {
    constructor(subtractee, subtractor) {
        this.subtractee = subtractee;
        this.subtractor = subtractor;
    }
    distance(pos) {
        return Math.max(-this.subtractor.distance(pos), this.subtractee.distance(pos));
    }
}
class Intersect {
    constructor(intersectee, intersector) {
        this.intersectee = intersectee;
        this.intersector = intersector;
    }
    distance(pos) {
        return Math.max(this.intersector.distance(pos), this.intersectee.distance(pos));
    }
}
class Union {
    constructor(first, second) {
        this.first = first;
        this.second = second;
    }
    distance(pos) {
        return Math.min(this.first.distance(pos), this.second.distance(pos));
    }
}
class Round {
    constructor(object, radius) {
        this.object = object;
        this.radius = radius;
    }
    distance(pos) {
        return this.object.distance(pos) - this.radius;
    }
}
class Onion {
    constructor(object, width) {
        this.object = object;
        this.width = width;
    }
    distance(pos) {
        return Math.abs(this.object.distance(pos)) - this.width;
    }
}
let objects = [];
objects.push(new Circle(new Position(-30, 0), 5));
objects.push(new Onion(new Rectangle(new Position(-30, 20), 20, 10), 1));
//objects.push(new Rectangle(new Position(20, 0), 20, 10))
// objects.push(new Circle(new Position(30,0), 20))
objects.push(new Subtract(new Circle(new Position(30, 0), 15), new Onion(new Rectangle(new Position(20, 0), 20, 10), 1)));
// ctx.beginPath();
// ctx.arc(xOffset, yOffset, 5, 0, 2 * Math.PI);
// ctx.stroke();
// Make this not be hell please Uwu
/* objects.forEach(object => {
    if (object instanceof Subtract) {
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.arc(object.subtractor.position.x * scaleX + xOffset, object.subtractor.position.y * scaleY + yOffset, object.subtractor.radius * scaleX, 0, 2 * Math.PI);
        ctx.stroke()
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.arc(object.subtractee.position.x * scaleX + xOffset, object.subtractee.position.y * scaleY + yOffset, object.subtractee.radius * scaleX, 0, 2 * Math.PI);
        ctx.stroke()
    } else if (object instanceof Intersect) {
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.arc(object.intersector.position.x * scaleX + xOffset, object.intersector.position.y * scaleY + yOffset, object.intersector.radius * scaleX, 0, 2 * Math.PI);
        ctx.stroke()
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.arc(object.intersectee.position.x * scaleX + xOffset, object.intersectee.position.y * scaleY + yOffset, object.intersectee.radius * scaleX, 0, 2 * Math.PI);
        ctx.stroke()
    } else {
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.arc(object.position.x * scaleX + xOffset, object.position.y * scaleY + yOffset, Math.abs(object.radius) * scaleX, 0, 2 * Math.PI);
        ctx.stroke()
    }
})
 */
let camera = new Position(0, 0);
function draw() {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    for (let i = 0; i < 360; i += .1) {
        let rayPos = new Position(camera.x, camera.y);
        let distance = minStep;
        let totalDistance = 0;
        while (true) {
            if (totalDistance > maxDistance || distance < minStep) {
                break;
            }
            let distances = [];
            objects.forEach(object => {
                distances.push(object.distance(rayPos));
            });
            /*distance = maxDistance
            distances.forEach(dist => {
                distance = sMin(distance, dist, .1)
            })*/
            distance = Math.min(...distances);
            totalDistance += distance;
            if ( /* i % 36 == 0 */false) {
                ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset);
                ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset);
                ctx.stroke();
                ctx.strokeStyle = "red";
                ctx.beginPath();
                ctx.arc(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset, distance * scaleX, 0, 2 * Math.PI);
                ctx.stroke();
            }
            rayPos.x += Math.cos(deg2rad(i)) * distance;
            rayPos.y += Math.sin(deg2rad(i)) * distance;
        }
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset);
        ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset);
        ctx.stroke();
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
    mouseDown = true;
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
        mouseDown = false;
    }
});
let frame = 0;
function main() {
    draw();
    objects[0].position.y = Math.sin(frame / 40) * 40;
    window.requestAnimationFrame(main);
    frame++;
}
main();
//# sourceMappingURL=index.js.map