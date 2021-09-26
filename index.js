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
    distance(pos) {
        return Math.sqrt(Math.pow((pos.x - this.position.x), 2) + Math.pow((pos.y - this.position.y), 2)) - this.radius;
    }
}
let objects = [];
objects.push(new Circle(new Position(30, 10), 20));
objects.push(new Circle(new Position(30, 30), 20));
objects.push(new Circle(new Position(-10, 10), 5));
// ctx.beginPath();
// ctx.arc(xOffset, yOffset, 5, 0, 2 * Math.PI);
// ctx.stroke();
objects.forEach(object => {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.arc(object.position.x * scaleX + xOffset, object.position.y * scaleY + yOffset, object.radius * scaleX, 0, 2 * Math.PI);
    ctx.stroke();
});
let camera = new Position(0, 0);
function main() {
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
            // if (/* i % 36 == 0 */ true) {
            //     ctx.strokeStyle = "red"
            //     ctx.beginPath();
            //     ctx.arc(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset, distance * scaleX, 0, 2 * Math.PI);
            //     // ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset)
            //     // ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset)
            //     ctx.stroke();    
            // }
            rayPos.x += Math.cos(deg2rad(i)) * distance;
            rayPos.y += Math.sin(deg2rad(i)) * distance;
        }
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset);
        ctx.lineTo(rayPos.x * scaleX + xOffset, rayPos.y * scaleY + yOffset);
        ctx.stroke();
        /*let distances: Array<Number> = []

        objects.forEach(object => {

            let totalDistance = 0;
            let distance = 1;
            let position = new Position(camera.x, camera.y)

            let thing = true
            //while (totalDistance < 100 || distance < .1) {
            while (thing) {
                if (totalDistance > 100 || distance < .1) {
                    thing = false
                }
                distance = object.distance(position)
                totalDistance += distance
                position.x += Math.cos(deg2rad(i)) * distance
                position.y += Math.sin(deg2rad(i)) * distance
            }

            ctx.beginPath()
            ctx.moveTo(camera.x * scaleX + xOffset, camera.y * scaleY + yOffset)
            ctx.lineTo(position.x * scaleX + xOffset, position.y * scaleY + yOffset)
            ctx.stroke()



            let distance = object.distance(camera)
            let x = Math.cos(deg2rad(i)) * distance * scale
            let y = Math.sin(deg2rad(i)) * distance * scale
            ctx.beginPath()
            ctx.moveTo(camera.x * scale + xOffset, camera.y * scale + yOffset)
            ctx.lineTo(x + xOffset, y + yOffset)
            ctx.stroke()
        });*/
    }
}
//# sourceMappingURL=index.js.map