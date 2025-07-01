const Geometry = {
    createDimension2D(width, height) {
        return { width, height };
    },
    createPoint2D(x, y) {
        return { x, y };
    },
    setPoint2D(point2d, x, y) {
        point2d.x = x;
        point2d.y = y;
    }
};