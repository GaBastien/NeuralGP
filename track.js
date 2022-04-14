class Track {
    constructor() {
        this.nbOfPoints = 15;
        this.generatingPoints();
    }

    generatingPoints() {
        this.points = [];
        this.hull = [];
        for (let i = 0; i < this.nbOfPoints; i++) {
            this.points.push(new HullPoint(i));
        }

        this.createhull();
    }

    show() {
        for (const p of this.points) {
            p.show();
        }

        // show hull
        if (this.hull.length > 0) {
            for(let i=1; i < this.hull.length; i++) {
                line(this.hull[i-1].pos.x, this.hull[i-1].pos.y, this.hull[i].pos.x, this.hull[i].pos.y);
            }
            line(this.hull[this.hull.length-1].pos.x, this.hull[this.hull.length-1].pos.y, this.hull[0].pos.x, this.hull[0].pos.y);
        }
    }

    whichTurnSide(A, B, C) {
        // fonction qui permet de savoir s'il y a un tournant à gauche/droite entre les 3 points
        // renvoie négatif si tournant à gauche
        // renvoie positif si tournant à droite
        // renvoie 0 si alignés
        return (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y);
    }

    // https://fr.wikipedia.org/wiki/Parcours_de_Graham
    // https://miashs-www.u-ga.fr/prevert/Prog/Complexite/graham.html
    createhull() { 
        // calcul du pivot : point le plus bas et le plus à gauche possible
        let pivotPoint = this.points[0];
        for (let i in this.points) {
            if( this.points[i].pos.y > pivotPoint.pos.y ) {
                pivotPoint = this.points[i];
            }
        }
        console.log(pivotPoint)

        // trié en fonction de l'angle que chacun d'entre eux fait avec l'axe des abscisses relativement au pivot
        // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
        this.points.sort( function(a, b) {
            let angleA = Math.atan2(pivotPoint.pos.y - a.pos.y, a.pos.x - pivotPoint.pos.x);
            let angleB = Math.atan2(pivotPoint.pos.y - b.pos.y, b.pos.x - pivotPoint.pos.x);
            return angleA == angleB ? 0 : angleA > angleB ? 1 : -1;
        });
        console.log(this.points);

        this.hull.push(this.points[0]);
        this.hull.push(this.points[1]);

        for (let i=2; i < this.nbOfPoints; i++) {
            let tournant = this.whichTurnSide(this.points[i],this.hull[this.hull.length-2],this.hull[this.hull.length-1]);
            while (tournant > 0) {
                this.hull.pop()
                tournant = this.whichTurnSide(this.points[i],this.hull[this.hull.length-2],this.hull[this.hull.length-1]);
            }
            this.hull.push(this.points[i]);
        }

        console.log(this.hull);
    }
}