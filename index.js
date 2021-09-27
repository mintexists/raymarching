let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let scaleX = 10;
let scaleY = -10;
let xOffset = canvas.width / 2;
let yOffset = canvas.height / 2;
let minStep = .1;
let maxDistance = 100;
let rad2deg = (rad) => 180 / (Math.PI * rad);
let deg2rad = (deg) => deg * (Math.PI / 180);
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
        return Math.sqrt(Math.pow((pos.x - this.position.x), 2) + Math.pow((pos.y - this.position.y), 2)) - radius;
    }
}
class Rectangle {
    constructor(position = new Position(0, 0), width = 1, height = 1, rotation = 0) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }
    distance(pos) {
        let d1 = Math.abs(this.position.x) - this.width;
        let d2 = Math.abs(this.position.y) - this.height;
        return Math.sqrt(Math.max(d1, 0) + Math.pow(Math.max(d1, d2), 2) + Math.pow(0, 2));
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
let objects = [];
objects.push(new Rectangle(new Position(20, 0), 10, 10, 0));
//objects.push(new Union(new Circle(new Position(30,0), 20), new Circle(new Position(30,15), 10)))
// ctx.beginPath();
// ctx.arc(xOffset, yOffset, 5, 0, 2 * Math.PI);
// ctx.stroke();
// Make this not be hell please Uwu
/*objects.forEach(object => {
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
})*/
let camera = new Position(0, 0);
function main() {
    //ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    for (let i = 0; i < 360; i += 1) {
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
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset);
        ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset);
        ctx.stroke();
    }
}
//# sourceMappingURL=index.js.map