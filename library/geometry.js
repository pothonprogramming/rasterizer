const Geometry = {
    createPoint2D(x, y) {
        return { x, y };
    },
    // Returns the wedge product of two vectors.
    // Returns a negative value if vector1 is to the left of vector0.
    // Returns a positive value if vector1 is to the right of vector0.
    // Returns 0 if vector0 and vector1 are parallel.
    // The wedge product is the area of the parallelogram in which vector0 and vector1 represent adjacent sides.
    // This is interesting because half of the wedge product is equal to the area of a triangle in which vector0 and vector1 are adjacent sides.
    wedgeProduct2D(vector0_x, vector0_y, vector1_x, vector1_y) {
        return vector0_x * vector1_y - vector0_y * vector1_x;
    },
    // Not sure if it's worth making a 3 point version of this.
    /*wedgeProduct2D(origin_x, origin_y, point1_x, point1_y, point2_x, point2_y) {
        return (point_x - lineSegment_x0) * (lineSegment_y1 - lineSegment_y0) - (point_y - lineSegment_y0) * (lineSegment_x1 - lineSegment_x0);
    },*/

    setPoint2D(point2d, x, y) {
        point2d.x = x;
        point2d.y = y;
    }
};