class Track {
    constructor() {
        this.nbOfPoints = 25;
        this.generatingPoints();
    }

    generatingPoints() {
        this.points = [];
        this.hull = [];
        for (let i = 0; i < this.nbOfPoints; i++) {
            this.points.push(new HullPoint(i));
        }

        this.createConcavHull(2);
    }

    show() {
        // show hull
        if (this.hull.length > 2) {
            for(let i=1; i < this.hull.length; i++) {
                line(this.hull[i-1].pos.x, this.hull[i-1].pos.y, this.hull[i].pos.x, this.hull[i].pos.y);
            }
            line(this.hull[this.hull.length-1].pos.x, this.hull[this.hull.length-1].pos.y, this.hull[0].pos.x, this.hull[0].pos.y);
        }
        for (const p of this.points) {
            p.show();
        }
    }

    whichTurnSide(A, B, C) {
        // fonction qui permet de savoir s'il y a un tournant à gauche/droite entre les 3 points
        // renvoie négatif si tournant à gauche
        // renvoie positif si tournant à droite
        // renvoie 0 si alignés
        return (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y);
    }

    nearestPoint(dataset, point, k) {
        /**
         * Fonction qui retourne les k plus proches voisins du point
         */
        dataset.sort( function(a,b) {
            let distA = distanceBetweenTwoPoints(a, point);
            let distB = distanceBetweenTwoPoints(b, point);
            return distA == distB ? 0 : distA > distB ? 1 : -1;
        });

        return dataset.slice(0,k);
    }

    sortByAngle(dataset, hull) {
        /**
         * Fonction qui retourne une liste de candidat trié par le candidat faisant le virage le plus à droite
         * Inspiré par la loi des cosinus https://www.maxicours.com/se/cours/trigonometrie-appliquee-aux-triangles-quelconques/
         */
        const idx = hull.length;
        let distHullSide = distanceBetweenTwoPoints(hull[idx-1], hull[idx-2]); // distBetweenLast2HullPoints

        dataset.sort( function(a, b) {
            let OppositeSideA = distanceBetweenTwoPoints(hull[idx-2], a);
            let distA = distanceBetweenTwoPoints(hull[idx-1], a); // distance entre le dernier point du hull et le candidat
            let angleA;
            if (whichTurnSide(hull[idx-2], hull[idx-1], a) < 0) {
                angleA = 2*Math.PI - Math.acos((Math.pow(distA,2) + Math.pow(distHullSide,2)  - Math.pow(OppositeSideA,2)) /  (2*distA*distHullSide));
            } else {
                angleA = Math.acos((Math.pow(distA,2) + Math.pow(distHullSide,2)  - Math.pow(OppositeSideA,2)) /  (2*distA*distHullSide));
            }

            let OppositeSideB = distanceBetweenTwoPoints(hull[idx-2], b);
            let distB = distanceBetweenTwoPoints(hull[idx-1], b);
            let angleB;
            if (whichTurnSide(hull[idx-2], hull[idx-1], b) < 0) {
                angleB = 2*Math.PI - Math.acos((Math.pow(distB,2) + Math.pow(distHullSide,2)  - Math.pow(OppositeSideB,2)) /  (2*distB*distHullSide));
            } else {
                angleB = Math.acos((Math.pow(distB,2) + Math.pow(distHullSide,2)  - Math.pow(OppositeSideB,2)) /  (2*distB*distHullSide));
            }
            return angleA == angleB ? 0 : angleA > angleB ? 1 : -1;
        });

        return dataset;
    }

    checkIntersectionWithHull(dataset, point) {
        /**
         * Fonction qui retourne true si le nouveau candidat et le dernier point du hull créent une intersection avec un des bords
         * Sinon retourne false
         */
        let intersec = false;
        if (dataset.length > 1) {
            for(let i = 0; i < dataset.length-1; i++) {
                intersec = collideLineLine(dataset[i], dataset[i+1], dataset[dataset.length-1], point);
                if (intersec == true) return intersec;
            }
        }
        return intersec;
    }

    // https://repositorium.sdum.uminho.pt/bitstream/1822/6429/1/ConcaveHull_ACM_MYS.pdf
    createConcavHull(k) {
        console.log("Create hull with", k, "neighbours");
        let dataset = this.points;

        // calcul du pivot : point le plus bas et le plus à gauche possible
        let pivotPoint = this.points[0];
        for (let i in this.points) {
            if( this.points[i].pos.y > pivotPoint.pos.y ) {
                pivotPoint = this.points[i];
            }
        }

        // init du hull et on enlève le premier point des candidats
        this.hull.push(pivotPoint);
        dataset = dataset.filter(point => point.id != pivotPoint.id);

        // trié en fonction de l'angle que chacun d'entre eux fait avec l'axe des abscisses relativement au pivot
        // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
        this.points.sort( function(a, b) {
            let angleA = Math.atan2(pivotPoint.pos.y - a.pos.y, a.pos.x - pivotPoint.pos.x);
            let angleB = Math.atan2(pivotPoint.pos.y - b.pos.y, b.pos.x - pivotPoint.pos.x);
            return angleA == angleB ? 0 : angleA > angleB ? 1 : -1;
        });

        this.hull.push(this.points[1]);
        dataset = dataset.filter(point => point.id !=  this.points[1].id);

        // variable
        let currentPoint = this.points[1]; // point courant
        let nearestNeighbours = null; // les k plus proches voisins du currentPoint
        let neighboursSorted = null; // k plus proches voisins triés par ordre décroissant d'angle (virage à droite)
        let intersec = null; // boolean qui gère l'intersection entre le candidat et les bords du polygone

        while (currentPoint != pivotPoint && dataset.length > 0) {
            if (this.hull.length == 5) dataset.push(pivotPoint); // ajout du premier point

            nearestNeighbours = this.nearestPoint(dataset, currentPoint, k);
            neighboursSorted = this.sortByAngle(nearestNeighbours, this.hull);

            console.log("Sorted", k, "neighbours for the point id :", currentPoint.id)
            console.log(neighboursSorted)

            let i = -1;
            intersec = true;
            // selection du premier candidat qui n'intersecte aucun des bords du polygone 
            while (intersec == true && i < neighboursSorted.length) {
                i++;
                intersec = this.checkIntersectionWithHull(this.hull, neighboursSorted[0]);
            }
            if (intersec == true) { // puisque tous les candidats croisent au moins un bord, réessayez avec un nombre plus élevé de voisins
                this.hull = [];
                console.log("lul")
                return this.createConcavHull(k+1);
            }

            // on a trouvé le bon candidat
            this.hull.push(neighboursSorted[i]);
            currentPoint = neighboursSorted[i];
            dataset = dataset.filter(point => point.id != neighboursSorted[i].id);
        }

        console.log(this.hull);
    }
}