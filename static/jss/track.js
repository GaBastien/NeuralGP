class Track {
    constructor() {
        this.nbOfPoints = 25;
        this.generatingPoints();
    }

    generatingPoints() {
        this.points = [];
        for (let i = 0; i < this.nbOfPoints; i++) {
            this.points.push(new HullPoint(i));
        }

        this.hull = this.createConcavHull(2, [], this.points);
        console.log("Hull length :", this.hull.length);
        console.log(this.hull);
        this.bezierHull = this.getBezierInterpolation(this.hull, 10);
    }

    show() {
        // show hull
        /*if (this.hull.length > 2) {
            for(let i=1; i < this.hull.length; i++) {
                line(this.hull[i-1].pos.x, this.hull[i-1].pos.y, this.hull[i].pos.x, this.hull[i].pos.y);
            }
            line(this.hull[this.hull.length-1].pos.x, this.hull[this.hull.length-1].pos.y, this.hull[0].pos.x, this.hull[0].pos.y);
        }
        for (const p of this.points) {
            p.show();
        }*/

        for (const p of this.hull) {
            p.show();
        }
        if (this.bezierHull.length > 2) {
            for (let i=1; i < this.bezierHull.length; i++) {
                line(this.bezierHull[i-1].pos.x, this.bezierHull[i-1].pos.y, this.bezierHull[i].pos.x, this.bezierHull[i].pos.y);
            }
            line(this.bezierHull[this.bezierHull.length-1].pos.x, this.bezierHull[this.bezierHull.length-1].pos.y, this.bezierHull[0].pos.x, this.bezierHull[0].pos.y);
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
         * Fonction qui retourne une liste de candidat trié par le candidat faisant le virage le plus à droite (angle "tournant à droite" le plus bas)
         * Inspiré par la loi des cosinus https://www.maxicours.com/se/cours/trigonometrie-appliquee-aux-triangles-quelconques/
         */
        const idx = hull.length;
        let distHullSide = distanceBetweenTwoPoints(hull[idx-1], hull[idx-2]); // distance entre les deux derniers points du hull

        dataset.sort( function(a, b) {
            let OppositeSideA = distanceBetweenTwoPoints(hull[idx-2], a); // côté opposé à l'angle calculé
            let distA = distanceBetweenTwoPoints(hull[idx-1], a); // distance entre le dernier point du hull et le candidat
            let angleA; // angle correspondant au "tournant à droite" entre la dernière droite du hull et la droite défini par le dernier point du hull et le point a
            if (whichTurnSide(hull[idx-2], hull[idx-1], a) < 0) { // si tournant à gauche on enlève 2*PI pour continuer de calculer l'angle "tournant à droite"
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
    createConcavHull(k, hull, points) {
        // variables
        let currentPoint;
        let dataset = points;
        let nearestNeighbours; // les k plus proches voisins du currentPoint
        let neighboursSorted; // k plus proches voisins triés par ordre décroissant d'angle (virage à droite)
        let intersec; // booléen qui gère l'intersection entre le candidat et les bords du polygone

        // calcul du pivot : point le plus bas et le plus à gauche possible
        let pivotPoint = points[0];
        for (let i in points) {
            if( points[i].pos.y > pivotPoint.pos.y ) {
                pivotPoint = points[i];
            }
        }

        // init du hull et on enlève le premier point des candidats
        hull.push(pivotPoint);
        dataset = dataset.filter(point => point.id != pivotPoint.id);

        // ajout d'un deuxième point
        nearestNeighbours = this.nearestPoint(dataset, pivotPoint, k);

        // trié en fonction de l'angle que chacun d'entre eux fait avec l'axe des abscisses relativement au pivot
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
            // selection du premier candidat qui n'intersecte aucun des bords du polygone 
            while (intersec == true && i < neighboursSorted.length-1) {
                i++;
                intersec = this.checkIntersectionWithHull(hull, neighboursSorted[i]);
            }
            if (intersec == true) { // puisque tous les candidats croisent au moins un bord, réessayez avec un nombre plus élevé de voisins
                return this.createConcavHull(k+1, [], this.points);
            }
            
            // on a trouvé le bon candidat
            currentPoint = neighboursSorted[i];
            if (currentPoint.id != pivotPoint.id) { // on ne rajoute pas le point de pivot dans le hull (déjà présent)
                hull.push(neighboursSorted[i]);
                dataset = dataset.filter(point => point.id != neighboursSorted[i].id);
            }
        }

        // règle de gestion : si 40% des points ne sont pas dans le hull, la proposition n'est pas intéressante
        if ((hull.length / points.length) < 0.4) {
            return this.createConcavHull(k+1, [], this.points);
        }
        return hull;
    }

    bezierPointCubic(a,b,c,d,t) {
        return a*Math.pow((1-t),3) + 3*b*t*Math.pow((1-t),2) + 3*c*t*t*(1-t) + d*Math.pow(t,3);
    }

    bezierQuadratic(a,b,c,t) {
        return a*Math.pow((1-t),2) + 2*b*t*(1-t) + c*t*t;
    }

    // https://my.numworks.com/python/schraf/valentin
    // https://www.youtube.com/watch?v=2pNjW-2944Y

    // http://www.sens-neuchatel.ch/bulletin/no34/art3-34.pdf
    // https://www.youtube.com/watch?v=pnYccz1Ha34
    getBezierInterpolation(hull, weigh) {
        /**
         * Fonction qui retourne un polygone créée par la formule de Bézier pour ajouter plus de points à ce polygone afin de rendre les courbes plus lisses
         */
        let curveHull = [];

        for (let i = 0; i < hull.length-2; i = i+2) {
            const a = hull[i];
            const b = hull[i+1];
            const c = hull[i+2];

            for (let t = 0; t < 1; t+=1/weigh) {
                let curvPoint = new HullPoint(-1);
                curvPoint.pos.x = this.bezierQuadratic(a.pos.x, b.pos.x, c.pos.x, t);
                curvPoint.pos.y = this.bezierQuadratic(a.pos.y, b.pos.y, c.pos.y, t);

                curveHull.push(curvPoint);
            }
        }
        
        return curveHull;
    }
}