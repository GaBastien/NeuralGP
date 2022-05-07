function distanceBetweenTwoPoints(A, B) {
    return Math.sqrt(Math.pow(A.pos.x - B.pos.x, 2) + Math.pow(A.pos.y - B.pos.y,2));
}

function whichTurnSide(A, B, C) {
    // fonction qui permet de savoir s'il y a un tournant à gauche/droite entre les 3 points
    // renvoie négatif si tournant à gauche
    // renvoie positif si tournant à droite
    // renvoie 0 si alignés
    return (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y);
}

function collideLineLine(A, B, C, D) {
    const { x: x1, y: y1 } = A.pos;
    const { x: x2, y: y2 } = B.pos;
    const { x: x3, y: y3 } = C.pos;
    const { x: x4, y: y4 } = D.pos;

    // Avoid considering collision if one point is in common
    if (A.id === C.id || A.id === D.id || B.id === C.id || B.id === D.id) {
        return false;
    }

    // calculate the distance to intersection point
    const uA =
        ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
        ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    const uB =
        ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
        ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true;
    }
    return false;
}