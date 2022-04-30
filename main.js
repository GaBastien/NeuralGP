// https://www.statox.fr/posts/2021/10/race_generator/
// http://blog.meltinglogic.com/2013/12/how-to-generate-procedural-racetracks/
let terrain;
let ms;

function setup() {
	createCanvas(1200, 900);
	this.terrain = new Track();
	this.ms = millis();
}

function draw() {
	background(100);
	this.terrain.show();
	if (millis() - this.ms > 1000) {
		this.terrain.generatingPoints();
		this.ms = millis();
	}
}