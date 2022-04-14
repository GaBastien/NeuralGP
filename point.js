class HullPoint {
    constructor(id) {
        this.pos = createVector(random(50, width-50), random(50, height-50));
        this.id = id;
    }

    show() {
        fill("white")
        circle(this.pos.x, this.pos.y, 20);
        const idText = this.id.toString();
        fill("red");
        text(
            idText,
            this.pos.x - textWidth(idText) / 2,
            this.pos.y + textSize() / 2
        );
    }
}