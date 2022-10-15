class HullPoint {
    constructor(id, x, y) {
        if (x != 0 && y != 0 ) {
            this.pos = createVector(x,y);
        } else this.pos = createVector(random(50, width-50), random(50, height-50));
        this.id = id;
    }

    show() {
        stroke("black");
        fill("white");
        circle(this.pos.x, this.pos.y, 20);
        const idText = this.id.toString();
        fill("red");
        textSize(16);
        text(
            idText,
            this.pos.x - textWidth(idText) / 2,
            this.pos.y + textSize() / 2
        );
    }
}