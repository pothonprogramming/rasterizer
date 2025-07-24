/****************/
/* THINGS TO DO */
/****************/
// * I think it would be good to also include bulk processing functions that are suitable for processing large arrays of component data.
//// For example, in an Entity Component based design, entity data would be stored in dense, flat arrays and offsets would be specified to access data for each entity.
//// This would make processing super fast.

////////////////////////
// ABOUT THIS UTILITY //
////////////////////////
// * The goal of this utility is to help with the manipulation of shapes.
// * These methods will often expect a flat array of coordinates in the form x0, y0, x1, y1, x2, y2...
//// The reason for this is that x and y values are very commonly used together and seldom used separately.
//// When focusing on cache efficiency, it is best to keep x and y values packed tightly together in the same location if they will be accessed together often.

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
        for (let xIndex = 2; xIndex < coordinateCount; xIndex += 2) {
            center_x += coordinates[xIndex];
            center_y += coordinates[xIndex + 1];
        }
        const inversePointCount = 2 / coordinateCount; // There are two coordinates per point.
        center_x *= inversePointCount;
        center_y *= inversePointCount;

        // Rotate each point around the center
        const cosine = PureMath.approximateCosine(angleInRadians);
        const sine = PureMath.approximateSine(angleInRadians);

        for (let xIndex = 0; xIndex < coordinateCount; xIndex += 2) {
            const yIndex = xIndex + 1;
            const vector_x = coordinates[xIndex] - center_x;
            const vector_y = coordinates[yIndex] - center_y;

            rotatedCoordinates[xIndex] = vector_x * cosine - vector_y * sine + center_x;
            rotatedCoordinates[yIndex] = vector_x * sine + vector_y * cosine + center_y;
        };
    },

    // * This function is a placeholder for rotating individual points around their center
    //// I'm not sure that this is needed, but it would be useful to rotate points in a point cloud.
    rotate2DCoordinatesAroundCenterByAngles(coordinates, rotatedCoordinates, coordinateCount, anglesInRadians) {},

    scale2DCoordinatesAroundCenter(coordinates, scaledCoordinates, coordinateCount, scale) {
        let center_x = coordinates[0];
        let center_y = coordinates[1];
        for (let xIndex = 2; xIndex < coordinateCount; xIndex += 2) {
            center_x += coordinates[xIndex];
            center_y += coordinates[xIndex + 1];
        }
        const inversePointCount = 2 / coordinateCount; // There are two coordinates per point.
        center_x *= inversePointCount;
        center_y *= inversePointCount;

        for (let xIndex = 0; xIndex < coordinateCount; xIndex += 2) {
            const yIndex = xIndex + 1;
            scaledCoordinates[xIndex] = (coordinates[xIndex] - center_x) * scale + center_x;
            scaledCoordinates[yIndex] = (coordinates[yIndex] - center_y) * scale + center_y;
        }
    },

    translate2DCoordinatesByVector(coordinates, movedCoordinates, coordinateCount, vector_x, vector_y) {
        for (let xIndex = 0; xIndex < coordinateCount; xIndex += 2) {
            const yIndex = xIndex + 1;
            movedCoordinates[xIndex] = coordinates[xIndex] + vector_x;
            movedCoordinates[yIndex] = coordinates[yIndex] + vector_y;
        }
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