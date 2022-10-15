class Track {
    constructor() {
        this.nbOfPoints = 25;
        this.generatingPoints();
    }

    generatingPoints() {
        this.points = [];
        for (let i = 0; i < this.nbOfPoints; i++) {
            this.points.push(new HullPoint(i, 0, 0));
        }

        this.hull = this.createConcavHull(2, [], this.points);
        this.bezierHull = this.generateBezierCurve(this.hull, 3);
        this.createWidth(this.bezierHull);
    }

    show() {
        for (const p of this.hull) {
            p.show();
        }
        /*stroke("blue");
        this.showHull(this.bezierHull);*/
        stroke('rgb(0,255,0)');
        this.showHull(this.innerHull);
        line(this.innerHull[1].pos.x, this.innerHull[1].pos.y, this.innerHull[2].pos.x, this.innerHull[2].pos.y);
        stroke('rgb(255,0,0)');
        this.showHull(this.outerHull);
    }

    showHull(polygon) {
        for (let i=1; i < polygon.length; i++) {
            line(polygon[i-1].pos.x, polygon[i-1].pos.y, polygon[i].pos.x, polygon[i].pos.y);
        }
        line(polygon[polygon.length-1].pos.x, polygon[polygon.length-1].pos.y, polygon[0].pos.x, polygon[0].pos.y);
    }

    /**  
     * Fonction qui permet de savoir s'il y a un tournant à gauche/droite entre les 3 points
     * Renvoie négatif si tournant à gauche
     * Renvoie positif si tournant à droite
     * Renvoie 0 si alignés
     */
    whichTurnSide(A, B, C) {
        return (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y);
    }

    /**
     * Fonction qui retourne les k plus proches voisins du point
     */
    nearestPoint(dataset, point, k) {
        dataset.sort( function(a,b) {
            let distA = distanceBetweenTwoPoints(a, point);
            let distB = distanceBetweenTwoPoints(b, point);
            return distA == distB ? 0 : distA > distB ? 1 : -1;
        });

        return dataset.slice(0,k);
    }

    /**
     * Fonction qui retourne une liste de candidat trié par le candidat faisant le virage le plus à droite (angle "tournant à droite" le plus bas)
     * Inspiré par la loi des cosinus https://www.maxicours.com/se/cours/trigonometrie-appliquee-aux-triangles-quelconques/
     */
    sortByAngle(dataset, hull) {

        const idx = hull.length;
        let distHullSide = distanceBetweenTwoPoints(hull[idx-1], hull[idx-2]); // distance entre les deux derniers points du hull

        dataset.sort( function(a, b) {
            let OppositeSideA = distanceBetweenTwoPoints(hull[idx-2], a); // Côté opposé à l'angle calculé
            let distA = distanceBetweenTwoPoints(hull[idx-1], a); // Distance entre le dernier point du hull et le candidat
            let angleA; // Angle correspondant au "tournant à droite" entre la dernière droite du hull et la droite défini par le dernier point du hull et le point a
            if (whichTurnSide(hull[idx-2], hull[idx-1], a) < 0) { // Si tournant à gauche on enlève 2*PI pour continuer de calculer l'angle "tournant à droite"
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

    /**
     * Fonction qui retourne true si le nouveau candidat et le dernier point du hull créent une intersection avec un des bords
     * Sinon retourne false
     */
    checkIntersectionWithHull(dataset, point) {
        let intersec = false;
        if (dataset.length > 1) {
            for(let i = 0; i < dataset.length-1; i++) {
                intersec = collideLineLine(dataset[i], dataset[i+1], dataset[dataset.length-1], point);
                if (intersec == true) return intersec;
            }
        }
        return intersec;
    }

    /**
     * On enlève les points trop proches pour éviter des comportements bizarre plus tard
     */
    removeClosePoint(hull, minDist) {

         let toBeRemoved = [];
         for (let i = 0; i < hull.length; i++) {
            for (let j = 0; j < hull.length; j++) {
                if (toBeRemoved.includes(hull[j].id)) {
                    continue;
                }
                if (dist(hull[i].pos.x, hull[i].pos.y, hull[j].pos.x, hull[j].pos.y) < minDist) {
                    toBeRemoved.push(hull[i].id);
                    break;
                }
            }
        }
        hull = hull.filter(({id}) => toBeRemoved.includes(id));
        return hull;
    }

    // https://repositorium.sdum.uminho.pt/bitstream/1822/6429/1/ConcaveHull_ACM_MYS.pdf
    createConcavHull(k, hull, points) {
        // Variables
        let currentPoint;
        let dataset = points;
        let nearestNeighbours; // Les k plus proches voisins du currentPoint
        let neighboursSorted; // k plus proches voisins triés par ordre décroissant d'angle (virage à droite)
        let intersec; // Booléen qui gère l'intersection entre le candidat et les bords du polygone

        // Calcul du pivot : point le plus bas et le plus à gauche possible
        let pivotPoint = points[0];
        for (let i in points) {
            if( points[i].pos.y > pivotPoint.pos.y ) {
                pivotPoint = points[i];
            }
        }

        // Init du hull et on enlève le premier point des candidats
        hull.push(pivotPoint);
        dataset = dataset.filter(point => point.id != pivotPoint.id);

        // Ajout d'un deuxième point
        nearestNeighbours = this.nearestPoint(dataset, pivotPoint, k);

        // Trié en fonction de l'angle que chacun d'entre eux fait avec l'axe des abscisses relativement au pivot
        // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
        nearestNeighbours.sort( function(a, b) {
            let angleA = Math.atan2(pivotPoint.pos.y - a.pos.y, a.pos.x - pivotPoint.pos.x);
            let angleB = Math.atan2(pivotPoint.pos.y - b.pos.y, b.pos.x - pivotPoint.pos.x);
            return angleA == angleB ? 0 : angleA > angleB ? 1 : -1;
        });

        hull.push(nearestNeighbours[0]);
        dataset = dataset.filter(point => point.id !=  nearestNeighbours[0].id);
        currentPoint = nearestNeighbours[0];

        while (currentPoint.id != pivotPoint.id && dataset.length > 0) {
            if (hull.length == 5) dataset.push(pivotPoint); // ajout du premier point

            nearestNeighbours = this.nearestPoint(dataset, currentPoint, k);
            neighboursSorted = this.sortByAngle(nearestNeighbours, hull);

            let i = -1;
            intersec = true;
            // Sélection du premier candidat qui n'intersecte aucun des bords du polygone 
            while (intersec == true && i < neighboursSorted.length-1) {
                i++;
                intersec = this.checkIntersectionWithHull(hull, neighboursSorted[i]);
            }
            if (intersec == true) { // Puisque tous les candidats croisent au moins un bord, réessayez avec un nombre plus élevé de voisins
                return this.createConcavHull(k+1, [], this.points);
            }
            
            // On a trouvé le bon candidat
            currentPoint = neighboursSorted[i];
            if (currentPoint.id != pivotPoint.id) { // On ne rajoute pas le point de pivot dans le hull (déjà présent)
                hull.push(neighboursSorted[i]);
                dataset = dataset.filter(point => point.id != neighboursSorted[i].id);
            }
        }

        hull = this.removeClosePoint(hull, 40);

        // Règle de gestion : si 40% des points ne sont pas dans le hull, la proposition n'est pas intéressante
        if ((hull.length / points.length) < 0.4) {
            return this.createConcavHull(k+1, [], this.points);
        }

        return hull;
    }

    // https://my.numworks.com/python/schraf/valentin
    // https://www.youtube.com/watch?v=2pNjW-2944Y

    // http://www.sens-neuchatel.ch/bulletin/no34/art3-34.pdf
    // https://www.youtube.com/watch?v=pnYccz1Ha34
    indexMod(i, l) {
        if (i < 0) {
            return this.indexMod(l + i, l);
        }
        if (i >= l) {
            return this.indexMod(i - l, l);
        }
        return i;
    }

    myBezierPoint(a, b, c, d, t) {
        const t3 = t * t * t,
            t2 = t * t,
            f1 = -0.5 * t3 + t2 - 0.5 * t,
            f2 = 1.5 * t3 - 2.5 * t2 + 1.0,
            f3 = -1.5 * t3 + 2.0 * t2 + 0.5 * t,
            f4 = 0.5 * t3 - 0.5 * t2;
        return a * f1 + b * f2 + c * f3 + d * f4;
    }

    generateBezierCurve(points, step) {
        const curve = [];
        for (let i = 0; i < points.length; i++) {
            const a = points[this.indexMod(i - 1, points.length)];
            const b = points[this.indexMod(i, points.length)];
            const c = points[this.indexMod(i + 1, points.length)];
            const d = points[this.indexMod(i + 2, points.length)];

            const curvePoint = new HullPoint(points.length);
            curvePoint.pos.x = this.myBezierPoint(
                a.pos.x,
                b.pos.x,
                c.pos.x,
                d.pos.x,
                0.5
            );

            curvePoint.pos.y = this.myBezierPoint(
                a.pos.y,
                b.pos.y,
                c.pos.y,
                d.pos.y,
                0.5
            );

            curve.push(points[this.indexMod(i)]);
            curve.push(curvePoint);
        }
        if (!step || step === 0) {
            curve.push(curve[0]);
            return curve;
        }
        return this.generateBezierCurve(curve, step - 1);
    }

    createWidth(hull) {
        const lefts = [];
        const rights = [];
        for (let i = 0; i < hull.length - 1; i++) {
            const anchor = hull[i].pos;
            const mover = hull[i + 1].pos;
            const left = mover
                .copy()
                .sub(anchor)
                .rotate(PI / 2)
                .setMag(20)
                .add(anchor);
            const right = mover
                .copy()
                .sub(anchor)
                .rotate(-PI / 2)
                .setMag(20)
                .add(anchor);

            //track.push(points[i].pos);
            lefts.push(new HullPoint(-1, left.x, left.y));
            rights.push(new HullPoint(-1, right.x, right.y));
        }
        this.innerHull = [...rights, rights[0]];
        this.outerHull = [...lefts, lefts[0]];
    }
}