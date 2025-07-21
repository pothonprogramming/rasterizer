////////////////////////
// ABOUT THIS UTILITY //
////////////////////////
// * The goal of this utility is to help with the manipulation of shapes.

const Geometry = {
    // Rotates an array of coordinates around their average center point.
    // * coordinates is the original array of coordinates that will be used to generate rotated coordinates.
    // * rotatedCoordinates is an array that will be populated with the rotated coordinates.
    // * coordinateCount is the number of coordinates (essentially the array length).
    // * angleInRadians is the angle to use for the rotation.
    // * NOTE: It might be better to pass the output array into the function rather than to always create a new array.
    //// This way you have more control over memory allocation.
    // * NOTE: You can also pass the same array in twice to update the coordinates in place, but too much of that will lead to distortion due to rounding errors.
    rotate2DCoordinatesAroundCenter(coordinates, rotatedCoordinates, coordinateCount, angleInRadians) {
        // Find the center point coordinates by first summing up all coordinate values and then dividing by the number of points.
        let center_x = coordinates[0];
        let center_y = coordinates[1];
        for (let index = 2; index < coordinateCount; index += 2) {
            center_x += coordinates[index];
            center_y += coordinates[index + 1];
        }
        const inversePointCount = 2 / coordinateCount; // There are two coordinates per point
        center_x *= inversePointCount;
        center_y *= inversePointCount;

        // Rotate each point around the center
        const cosine = PureMath.approximateCosine(angleInRadians);
        const sine = PureMath.approximateSine(angleInRadians);

        for (let index = 0; index < coordinateCount; index += 2) {
            const vector_x = coordinates[index] - center_x;
            const vector_y = coordinates[index + 1] - center_y;

            rotatedCoordinates[index] = vector_x * cosine - vector_y * sine + center_x;
            rotatedCoordinates[index + 1] = vector_x * sine + vector_y * cosine + center_y;
        };
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
};