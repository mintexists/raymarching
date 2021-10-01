let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let scaleX = 10;
let scaleY = -10;
let xOffset = canvas.width / 2;
let yOffset = canvas.height / 2;
let minStep = 1 / 10;
let maxDistance = 500;
let mouseDown = false;
let rad2deg = (rad) => (180 / Math.PI) * rad;
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
    }
}
class Rectangle {
    constructor(position = new Position(0, 0), width, height = 1, angle = 0) {
        this.angle = angle;
        this.position = position;
        this.width = width;
        this.height = height;
    }
    distance(pos) {
        this.radAngle = deg2rad(this.angle);
        let localPos = new Position(pos.x - this.position.x, pos.y - this.position.y);
        let newPos = new Position(localPos.x * Math.cos(this.radAngle) - localPos.y * Math.sin(this.radAngle), localPos.y * Math.cos(this.radAngle) + localPos.x * Math.sin(this.radAngle));
        return Math.max(Math.abs(newPos.x) - this.width / 2, Math.abs(newPos.y) - this.height / 2);
    }
}
class Triangle {
    constructor(p1, p2, p3) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }
    distance(pos) {
        let slopeA = -((this.p1.y - this.p2.y) / (this.p1.x - this.p2.x));
        let slopeB = -((this.p2.y - this.p3.y) / (this.p2.x - this.p3.x));
        let slopeC = -((this.p3.y - this.p1.y) / (this.p3.x - this.p1.x));
        let pointA = new Position((this.p1.x + this.p2.x) / 2, (this.p1.y + this.p2.y) / 2);
        let pointB = new Position((this.p2.x + this.p3.x) / 2, (this.p2.y + this.p3.y) / 2);
        let pointC = new Position((this.p3.x + this.p1.x) / 2, (this.p3.y + this.p1.y) / 2);
        let localPosA = new Position(pos.x - pointA.x, pos.y - pointA.y);
        let localPosB = new Position(pos.x - pointB.x, pos.y - pointB.y);
        let localPosC = new Position(pos.x - pointC.x, pos.y - pointC.y);
        let angleA = Math.atan(slopeA);
        let angleB = Math.atan(slopeB);
        let angleC = Math.atan(slopeC);
        let newPosA = new Position(localPosA.x * Math.cos(angleA) - localPosA.y * Math.sin(angleA), localPosA.y * Math.cos(angleA) + localPosA.x * Math.sin(angleA));
        let newPosB = new Position(localPosB.x * Math.cos(angleB) - localPosB.y * Math.sin(angleB), localPosB.y * Math.cos(angleB) + localPosB.x * Math.sin(angleB));
        let newPosC = new Position(localPosC.x * Math.cos(angleC) - localPosC.y * Math.sin(angleC), localPosC.y * Math.cos(angleC) + localPosC.x * Math.sin(angleC));
        //console.log(Math.abs(newPosA.y), Math.abs(newPosB.y), Math.abs(newPosC.y))
        //return Math.min(Math.abs(newPosA.y), Math.abs(newPosB.y), Math.abs(newPosC.y))
        //return Math.max((newPosA.y), (newPosB.y), (newPosC.y))
        return (newPosA.y + newPosB.y + newPosC.y) / 3;
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
    constructor(first, second, k = minStep) {
        this.first = first;
        this.second = second;
        this.k = k;
    }
    distance(pos) {
        return sMin(this.first.distance(pos), this.second.distance(pos), this.k);
        //return Math.min(this.first.distance(pos), this.second.distance(pos))
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
//objects.push(new Circle(new Position(-30, 0), 5))
//objects.push(new Rectangle(new Position(30,10), 20, 10))
objects.push(new Triangle(new Position(0, 0), new Position(10, 10), new Position(10, 0)));
//objects.push(new Rectangle(new Position(20, 0), 20, 10))
//objects.push(new Rectangle(new Position(20, 20), 20, 10, 0))
// objects.push(new Circle(new Position(30,0), 20))
//objects.push(new Subtract(new Circle(new Position(30,0), 15), new Onion(new Rectangle(new Position(20, 0), 20, 10, 20), 2)))
// objects.push(
//     new Union(
//         new Subtract(
//             new Rectangle(new Position(0,0), 20, 20, 45),
//             new Rectangle(new Position(0,14.14), 28.28, 28.28)
//         ),
//         new Union(
//             new Intersect(
//                 new Circle(new Position(-7.07, 0), 7.07),
//                 new Rectangle(new Position(0,7.07), 30, 30, 45),
//             ),
//             new Intersect(
//                 new Circle(new Position(7.07, 0), 7.07),
//                 new Rectangle(new Position(0,7.07), 30, 30, 45),
//             ),
//         )
//     )
// )
let camera = new Position(0, 0);
function draw() {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
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
                distances.push(Math.abs(object.distance(rayPos)));
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
function main() {
    draw();
    window.requestAnimationFrame(main);
}
main();
//# sourceMappingURL=index.js.map