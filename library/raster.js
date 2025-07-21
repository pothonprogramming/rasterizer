/****************/
/* THINGS TO DO */
/****************/
// * Make sure all functions expect and can handle float coordinate inputs.
// * Make sure namimg conventions are consistent
//// I'm using camelCase for most variable names and a combination of camelCase and snake_case for indicating ownership.
//// For example: raster_pixelCount indicates that an object called raster owns a property called pixelCount
//// For example: var canvasRaster = { pixelCount }; var canvasRaster_pixelCount = canvasRaster.pixelCount;
// * Clipping functions should take clip rect properties instead of just clipping to the target raster
//// This is a more flexible approach and will allow clipping to an arbitrary axis aligned rect within the raster.
// * I'm not sure I like the "draw" prefix for functions that draw outlines. "fill" is good, because it's filling the shape.
//// Maybe "trace" instead of "draw". It's still short and is much more clear than draw. "outline" is longer, but more clear.

//////////////////////////////
// ABOUT THE RASTER UTILITY //
//////////////////////////////
// * This script is meant to provide generic functions to rasterize shapes and blit images.
// * Assumes Little Endian byte order.
// * Color values are expected to be stored as AABBGGRR.
//// For example, opaque blue should be written as 0xffff0000 (AABBGGRR), not 0x0000ffff (RRGGBBAA).
// * All fill methods use conservative edge rasterization, meaning any pixel area that overlaps the area of a shape will be drawn.
//// Note that points and lines are infinitely small and do not represent pixels, which are better represented by square volumes.
//// This means that a point does not represent a pixel. A pixel is more like a square in which all edges have a length of 1.
//// So the points (0, 0), (0.5, 0.5), and (1, 1) all intersect with the pixel at (0, 0).
const Raster = {

    /////////////////////////////
    // AXIS ALIGNED RECTANGLES //
    /////////////////////////////
    // Functions for working with axis aligned rectangles

    fillAxisAlignedRectangle(raster_pixels, raster_width, rectangle_left, rectangle_top, rectangle_width, rectangle_height, color) {
        const bottom = PureMath.ceiling(rectangle_top + rectangle_height); // Expand edges to draw all pixels that overlap the rectangle
        const left = PureMath.floor(rectangle_left);
        const right = PureMath.ceiling(rectangle_left + rectangle_width);
        const top = PureMath.floor(rectangle_top);

        let index = top * raster_width + left;
        const indexYStep = raster_width - right + left;

        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                raster_pixels[index] = color;
                index++;
            }
            index += indexYStep;
        }
    },

    // This isn't fool proof. You can break it by passing negative rectangle_width or rectangle_height or by passing inverted clip values like clip_left > clip_right.
    fillClippedAxisAlignedRectangle(raster_pixels, raster_width, clip_left, clip_top, clip_right, clip_bottom, rectangle_left, rectangle_top, rectangle_width, rectangle_height, color) {
        const bottom = PureMath.ceiling(PureMath.minimum2(clip_bottom, rectangle_top + rectangle_height)); // Expand edges to draw all pixels that overlap the rectangle
        const left = PureMath.floor(PureMath.maximum2(clip_left, rectangle_left));
        const right = PureMath.ceiling(PureMath.minimum2(clip_right, rectangle_left + rectangle_width));
        const top = PureMath.floor(PureMath.maximum2(clip_top, rectangle_top));

        let index = top * raster_width + left;
        const indexYStep = raster_width - right + left;

        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                raster_pixels[index] = color;
                index++;
            }
            index += indexYStep;
        }
    },

    /////////////
    // CIRCLES //
    /////////////
    // Functions for drawing circles

    // This can be optimized. Circles are symmetrical, so I only need to do 1/2, 1/4, or 1/8th the math to calculate points.
    // It's probably best to access memory contiguously if possible.
    fillCircle(pixels, raster_width, circle_x, circle_y, circle_radius, color) {
        const box_bottom = BitMath.ceiling(circle_y + circle_radius);
        const box_left = BitMath.floor(circle_x - circle_radius);
        const box_right = BitMath.ceiling(circle_x + circle_radius);
        const box_top = BitMath.floor(circle_y - circle_radius);

        const circleRadiusSquared = circle_radius * circle_radius;

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_right + box_left;

        // You could also break these loops into different quadrants and draw one quadrant at a time.
        // This would get rid of the pixelEdge branches, but it would also lead to a lot of duplicate code. Not sure which is better.
        for (let y = box_top; y < box_bottom; y++) {
            const pixelEdgeY = y < circle_y ? y + 1 : y; // Test the edge that has the least magnitude along the vector
            const vector_y = pixelEdgeY - circle_y;
            const vectorYSquared = vector_y * vector_y;
            for (let x = box_left; x < box_right; x++) {
                const pixelEdgeX = x < circle_x ? x + 1 : x; // Test the edge that has the least magnitude along the vector
                const vector_x = pixelEdgeX - circle_x;
                if (vector_x * vector_x + vectorYSquared < circleRadiusSquared) pixels[index] = color;
                index++;
            }
            index += indexYStep;
        }
    },

    // Running a point in circle test for each point isn't the most efficient way to render a filled circle on the CPU,
    // but this approach lends itself very nicely to clipping, because it's easy to iterate over a rectangular region to get each test point.
    fillClippedCircle(pixels, raster_width, clip_left, clip_top, clip_right, clip_bottom, circle_x, circle_y, circle_radius, color) {
        const box_bottom = BitMath.minimum2(BitMath.ceiling(circle_y + circle_radius), clip_bottom);
        const box_left = BitMath.maximum2(BitMath.floor(circle_x - circle_radius), clip_left);
        const box_right = BitMath.minimum2(BitMath.ceiling(circle_x + circle_radius), clip_right);
        const box_top = BitMath.maximum2(BitMath.floor(circle_y - circle_radius), clip_top);

        const circleRadiusSquared = circle_radius * circle_radius;

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_right + box_left;

        // You could also break these loops into different quadrants and draw one quadrant at a time.
        // This would get rid of the pixelEdge branches, but it would also lead to a lot of duplicate code. Not sure which is better.
        for (let y = box_top; y < box_bottom; y++) {
            const pixelEdgeY = y < circle_y ? y + 1 : y; // Test the edge that has the least magnitude along the vector
            const vector_y = pixelEdgeY - circle_y;
            const vectorYSquared = vector_y * vector_y;
            for (let x = box_left; x < box_right; x++) {
                const pixelEdgeX = x < circle_x ? x + 1 : x; // Test the edge that has the least magnitude along the vector
                const vector_x = pixelEdgeX - circle_x;
                if (vector_x * vector_x + vectorYSquared < circleRadiusSquared) pixels[index] = color;
                index++;
            }
            index += indexYStep;
        }
    },

    // Uses Bresenham's algorithm to draw the outline of the circle.
    // This does not respect conservative edge rasterization.
    traceCircleFast(raster_pixels, raster_width, targetX, targetY, diameter, color) {
        let odd = diameter & 1;
        const circleRadius = (diameter - odd) * 0.5;
        odd = odd ^ 1;
        const centerX = targetX + circleRadius;
        const centerY = targetY + circleRadius;
        let x = 0;
        let y = circleRadius;
        let d = 1 - circleRadius;

        while (x <= y) {
            raster_pixels[(centerY + y - odd) * raster_width + centerX + x - odd] = color;
            raster_pixels[(centerY + x - odd) * raster_width + centerX + y - odd] = color;
            raster_pixels[(centerY + y - odd) * raster_width + centerX - x] = color;
            raster_pixels[(centerY + x - odd) * raster_width + centerX - y] = color;
            raster_pixels[(centerY - y) * raster_width + centerX - x] = color;
            raster_pixels[(centerY - x) * raster_width + centerX - y] = color;
            raster_pixels[(centerY - y) * raster_width + centerX + x - odd] = color;
            raster_pixels[(centerY - x) * raster_width + centerX + y - odd] = color;

            const delta = d + 2 * x + 1;
            const mask = -(+(delta >= 0));
            d += 2 * x + 1 + ((mask & (1 - 2 * y)));
            y += mask;
            x++;
        }
    },

    ///////////
    // LINES //
    ///////////
    // Functions for drawing lines

    // Does not protect against buffer overflow.
    fillHorizontalLine(raster_pixels, raster_width, line_x, line_y, lineWidth, color) {
        const firstIndex = line_y * raster_width + line_x;
        const lastIndex = firstIndex + lineWidth;
        for (let index = firstIndex; index < lastIndex; index++) raster_pixels[index] = color;
    },

    // This method is not meant to handle negative line width. Lines will always be drawn starting at the leftmost coordinate.
    fillClippedHorizontalLine(raster_pixels, raster_width, raster_height, lineLeftX, line_y, lineWidth, color) {
        let lineRightX = lineLeftX + lineWidth; // Technically this is 1 greater than the true right x of the line, but the last index is never drawn.
        if (lineLeftX >= raster_width || lineRightX <= 0 || line_y < 0 || line_y >= raster_height) return;
        if (lineLeftX < 0) lineLeftX = 0;
        if (lineRightX > raster_width) lineRightX = raster_width; // Still technically 1 greater than the maximum right x of the line.

        const firstIndex = line_y * raster_width + lineLeftX;
        const lastIndex = firstIndex + lineRightX - lineLeftX;

        for (let index = firstIndex; index < lastIndex; index++) raster_pixels[index] = color;
    },

    // Does not protect against buffer overflow.
    fillVerticalLine(raster_pixels, raster_width, line_x, line_y, lineHeight, color) {
        const firstIndex = line_y * raster_width + line_x;
        const lastIndex = firstIndex + lineHeight * raster_width;
        for (let index = firstIndex; index < lastIndex; index += raster_width) raster_pixels[index] = color;
    },

    // This method is not meant to handle negative lineHeight.
    fillClippedVerticalLine(raster_pixels, raster_width, raster_height, line_x, lineTopY, lineHeight, color) {
        let lineBottomY = lineTopY + lineHeight; // This is technically 1 greater than the actual bottom y of the line.
        if (lineBottomY <= 0 || lineTopY >= raster_height || line_x < 0 || line_x >= raster_width) return;
        if (lineBottomY > raster_height) lineBottomY = raster_height; // Still 1 greater than the actual bottom y of the line.
        if (lineTopY < 0) lineTopY = 0;

        const firstIndex = lineTopY * raster_width + line_x;
        const lastIndex = lineBottomY * raster_width + line_x; // The last index is never drawn. Use <= in loop to draw last index.
        for (let index = firstIndex; index < lastIndex; index += raster_width) raster_pixels[index] = color;
    },

    drawLineSegment(raster_pixels, raster_width, lineSegmentX0, lineSegmentY0, lineSegmentX1, lineSegmentY1, color) {
        const absoluteRise = BitMath.absolute(lineSegmentY1 - lineSegmentY0);
        const absoluteRun = BitMath.absolute(lineSegmentX1 - lineSegmentX0);
        const stepX = lineSegmentX0 < lineSegmentX1 ? 1 : -1;
        const stepY = lineSegmentY0 < lineSegmentY1 ? 1 : -1;

        let index = lineSegmentY0 * raster_width + lineSegmentX0;
        const lastIndex = lineSegmentY1 * raster_width + lineSegmentX1;
        const indexYStep = stepY * raster_width;

        // If the line is steep, then y will always be incremented, however x will not always be incremented.
        // Else if the line is not steep, then x will always be incremented, but y will not always be incremented.
        if (absoluteRise > absoluteRun) {
            let error = absoluteRise >> 1;
            while (index !== lastIndex) {
                raster_pixels[index] = color;
                index += indexYStep;
                error -= absoluteRun;
                if (error < 0) {
                    index += stepX;
                    error += absoluteRise;
                }
            }
        } else {
            let error = absoluteRun >> 1;
            while (index !== lastIndex) {
                raster_pixels[index] = color;
                index += stepX;
                error -= absoluteRise;
                if (error < 0) {
                    index += indexYStep;
                    error += absoluteRun;
                }
            }
        }
        raster_pixels[index] = color; // Draw the last pixel in the line segment.
    },

    drawLineSegmentClipped(raster_pixels, raster_width, raster_height, lineSegmentX0, lineSegmentY0, lineSegmentX1, lineSegmentY1, color) {
        let t0 = 0; // time along the line segment at point0
        let t1 = 1; // time along the line segment at point1
        let deltaX = lineSegmentX1 - lineSegmentX0; // rate of change along x axis
        let deltaY = lineSegmentY1 - lineSegmentY0; // rate of change along y axis

        const values = [-deltaX, lineSegmentX0, deltaX, raster_width - 1 - lineSegmentX0, -deltaY, lineSegmentY0, deltaY, raster_height - 1 - lineSegmentY0];

        for (let i = 0; i < 8; i += 2) {
            let rateOfChange = values[i];
            let distanceToEdge = values[i + 1];
            if (rateOfChange === 0) { // A perfectly vertical or horizontal line
                if (distanceToEdge < 0) return;
                continue;
            }
            let t2 = distanceToEdge / rateOfChange; // time along the line segment relative to edge
            if (rateOfChange < 0) {
                if (t2 > t1) return; // time should not exceed high constraint of t1
                if (t2 > t0) t0 = t2; // time should exceed low constraint of t0
            } else {
                if (t2 < t0) return; // time should not be less than low constraint of t0
                if (t2 < t1) t1 = t2; // time should be less than high constraint of t1
            }
        }

        const x0 = lineSegmentX0;
        const y0 = lineSegmentY0;

        // Set new values. They may be the same or they may be updated by clipping.
        lineSegmentX0 = BitMath.floor(x0 + deltaX * t0);
        lineSegmentY0 = BitMath.floor(y0 + deltaY * t0);
        lineSegmentX1 = BitMath.floor(x0 + deltaX * t1);
        lineSegmentY1 = BitMath.floor(y0 + deltaY * t1);

        const absoluteRise = BitMath.absolute(lineSegmentY1 - lineSegmentY0); // Must recompute rise with new values
        const absoluteRun = BitMath.absolute(lineSegmentX1 - lineSegmentX0); // Must recompute run with new values
        const stepX = deltaX > 0 ? 1 : -1;
        const stepY = deltaY > 0 ? 1 : -1;

        let index = lineSegmentY0 * raster_width + lineSegmentX0;
        const lastIndex = lineSegmentY1 * raster_width + lineSegmentX1;
        const indexYStep = stepY * raster_width;

        // If the line is steep, then y will always be incremented, however x will not always be incremented.
        // Else if the line is not steep, then x will always be incremented, but y will not always be incremented.
        if (absoluteRise > absoluteRun) {
            let error = absoluteRise >> 1;
            while (index !== lastIndex) {
                raster_pixels[index] = color;
                index += indexYStep;
                error -= absoluteRun;
                if (error < 0) {
                    index += stepX;
                    error += absoluteRise;
                }
            }
        } else {
            let error = absoluteRun >> 1;
            while (index !== lastIndex) {
                raster_pixels[index] = color;
                index += stepX;
                error -= absoluteRise;
                if (error < 0) {
                    index += indexYStep;
                    error += absoluteRun;
                }
            }
        }
        raster_pixels[index] = color; // Draw the last pixel in the line segment.
    },

    ////////////
    // PIXELS // Functions for drawing individual pixels
    ////////////

    // pixel_x and pixel_y must be integers, not floats.
    fillPixel(raster_pixels, raster_width, pixel_x, pixel_y, color) {
        raster_pixels[pixel_y * raster_width + pixel_x] = color;
    },

    // Colors are in aabbggrr format
    fillTransparentPixel(raster_pixels, raster_width, pixel_x, pixel_y, color) {
        const index = pixel_y * raster_width + pixel_x;

        const baseColor = raster_pixels[index];

        const alpha = color >>> 24;
        const inverseAlpha = 255 - alpha;

        const br = ((baseColor & 0x00ff00ff) * alpha + (color & 0x00ff00ff) * inverseAlpha) >>> 8;
        const ag = (((baseColor >>> 8) & 0x00ff00ff) * alpha + ((color >>> 8) & 0x00ff00ff) * inverseAlpha) >>> 8;

        raster_pixels[index] = (ag << 8 & 0xff00ff00) | (br & 0x00ff00ff);
    },

    // Only fills the pixel if it is inside the clip boundaries.
    // These boundaries should never surpass the raster width and height.
    // pixel_x and pixel_y must be an integer, not a float.
    fillClippedPixel(raster_pixels, raster_width, clip_left, clip_top, clip_right, clip_bottom, pixel_x, pixel_y, color) {
        if (pixel_x < clip_left || pixel_y < clip_top || pixel_x > clip_right || pixel_y > clip_bottom) return;
        raster_pixels[pixel_y * raster_width + pixel_x] = color;
    },

    /////////////////////
    // CONVEX POLYGONS //
    /////////////////////

    // Convex polygons should all be handled the same way

    // Used to draw a a convex polygon from a flat array of point coordinates.
    // This method can also be used to draw a thick line.
    fillConvexPolygon(pixels, raster_width, coordinates, coordinateCount, color) {

        // Find the bounding box edges
        let box_bottom;
        for (let index = 0; index < coordinateCount; index ++) {

        }


        // This will basically do the same thing the triangle version does, but more generalized to handle more points.
        // The bounding box of the triangle
        //const box_bottom = BitMath.ceiling(BitMath.maximum3(triangle_y0, triangle_y1, triangle_y2));
        const box_left = BitMath.floor(BitMath.minimum3(triangle_x0, triangle_x1, triangle_x2));
        const box_right = BitMath.ceiling(BitMath.maximum3(triangle_x0, triangle_x1, triangle_x2));
        const box_top = BitMath.floor(BitMath.minimum3(triangle_y0, triangle_y1, triangle_y2));
        const box_width = box_right - box_left; // The box width is tied to the x loop, so be careful if you change this.

        // The equation of a line is ax + by + c = 0
        // a and b are the x and y values of the normal of the line.
        // c is the negative dot product of the point (x, y) and the normal (a, b).
        // When the point (x, y) is on the line, the equation will yield 0.
        // When the point (x, y) is to the right or left of the line, the equation will yield a positive or negative value.

        // Set up the coefficient values for each line segment in the triangle.
        // The right normal of a vector, v (p1.x - p0.x, p1.y - p0.y) is (-vy, vx)
        // edge0
        const a0 = triangle_y0 - triangle_y1; // Right Normal x is negative edge vector y
        const b0 = triangle_x1 - triangle_x0; // Right Normal y is edge vector x
        const c0 = -a0 * triangle_x0 - b0 * triangle_y0; // The negative dot product of the point and the normal vector
        // edge1
        const a1 = triangle_y1 - triangle_y2;
        const b1 = triangle_x2 - triangle_x1;
        const c1 = -a1 * triangle_x1 - b1 * triangle_y1;
        // edge2
        const a2 = triangle_y2 - triangle_y0;
        const b2 = triangle_x0 - triangle_x2;
        const c2 = -a2 * triangle_x2 - b2 * triangle_y2;

        // This algorithm fills any pixel that the triangle overlaps.
        // A pixel is technically an area, not a point. Points are infinitely small. Pixels have an area of 1x1 or 1.
        // A pixel has 4 corner points.
        // Instead of testing the top left corner or the center point, this algorithm tests the point that is farthest along the normal vector.
        // The normal vector points inside the triangle. Getting the point that is deepest into the triangle will ensure the overlap test is accurate.

        // Get the x and y offsets for each pixel test
        // Get the corner point of the pixel bounding box that is farthest along the right normal vector to the line edge.
        const x0 = a0 < 0 ? 0 : 1; // !(a0 >> 31) is a fast alternative, but it will truncate float values and introduce rounding errors.
        const y0 = b0 < 0 ? 0 : 1; // !(b0 >> 31)
        const x1 = a1 < 0 ? 0 : 1; // !(a1 >> 31)
        const y1 = b1 < 0 ? 0 : 1; // !(b1 >> 31)
        const x2 = a2 < 0 ? 0 : 1; // !(a2 >> 31)
        const y2 = b2 < 0 ? 0 : 1; // !(b2 >> 31)

        // These are the results of each edge test for the top left corner of the bounding box with deepest point in pixel offsets applied.
        let v0 = a0 * (box_left + x0) + b0 * (box_top + y0) + c0;
        let v1 = a1 * (box_left + x1) + b1 * (box_top + y1) + c1;
        let v2 = a2 * (box_left + x2) + b2 * (box_top + y2) + c2;

        // The y increment to add to the edge test result on each y iteration
        const yOffset0 = b0 - a0 * box_width;
        const yOffset1 = b1 - a1 * box_width;
        const yOffset2 = b2 - a2 * box_width;

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_width;

        for (let y = box_top; y < box_bottom; y++) {

            for (let x = box_left; x < box_right; x++) {
                // (v0 | v1 | v2) > 0 Is a faster alternative, but the bitwise operations truncate float values, leading to a rounding error.
                // I'm choosing to not draw points on the line because only the very edge of the pixel would be on the line.
                if (v0 > 0 && v1 > 0 && v2 > 0) raster_pixels[index] = color;

                index++;

                v0 += a0;
                v1 += a1;
                v2 += a2;
            }

            index += indexYStep;

            v0 += yOffset0;
            v1 += yOffset1;
            v2 += yOffset2;
        }
    },

    ////////////
    // RASTER //
    ////////////
    // Functions for working with rasters, which are essentially arrays of color values that have a width and height

    // I messed with this function without testing it. Not sure if it still works.
    copyOpaquePixels(sourceRaster_pixels, sourceRaster_width, sourceRaster_height, targetRaster_pixels, targetRaster_width, target_x, target_y) {
        const bottom = target_y + sourceRaster_height;
        const right = target_x + sourceRaster_width;

        let sourceIndex = 0;
        for (let y = target_y; y < bottom; y++) {
            let firstIndexInTargetRow = y * targetRaster_width; // can be optimized further.
            for (let x = target_x; x < right; x++) {
                const sourceValue = sourceRaster_pixels[sourceIndex];
                const mask = -((sourceValue >>> 24) & 0xff !== 0);
                const targetIndex = firstIndexInTargetRow + x;
                targetRaster_pixels[targetIndex] = (sourceValue & mask) | (targetRaster_pixels[targetIndex] & ~mask);
                sourceIndex++;
            }
        }
    },

    copyOpaquePixelsClipped(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetHeight, targetX, targetY) {
        const left = BitMath.clampZero(targetX);
        const right = BitMath.clampHigh(targetX + sourceWidth, targetWidth);
        if (left > right) return;

        const top = BitMath.clampZero(targetY);
        const bottom = BitMath.clampHigh(targetY + sourceHeight, targetHeight);
        if (top > bottom) return;

        for (let pixelY = top; pixelY < bottom; pixelY++) {
            const sourcePixelY = pixelY - targetY;
            for (let pixelX = left; pixelX < right; pixelX++) {
                const sourceValue = sourcePixels[sourcePixelY * sourceWidth + (pixelX - targetX)];
                const mask = -((sourceValue >>> 24) & 0xff !== 0);
                const targetIndex = pixelY * targetWidth + pixelX;
                targetPixels[targetIndex] = (sourceValue & mask) | (targetPixels[targetIndex] & ~mask);
            }
        }
    },

    // This method could write outside of the target buffer, so only use it if you know for sure that the source is within the target bounds.
    // Copies all pixels from the source into the target starting at the specified position in the target.
    copyPixels(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetX, targetY) {
        const lastTargetRow = targetY + sourceHeight;
        const lastTargetColumn = targetX + sourceWidth;

        let sourceIndex = 0; // This method always copies the entire sourcePixels array in contiguous order, so we don't need to loop 
        for (let targetRow = targetY; targetRow < lastTargetRow; targetRow++) {
            const firstIndexInTargetRow = targetRow * targetWidth; // The first index in the target row.
            for (let targetColumn = targetX; targetColumn < lastTargetColumn; targetColumn++) {
                targetPixels[firstIndexInTargetRow + targetColumn] = sourcePixels[sourceIndex];
                sourceIndex++;
            }
        }
    },

    copyPixelsClipped(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetHeight, targetX, targetY) {
        const firstTargetColumn = BitMath.clampZero(targetX);
        const lastTargetColumn = BitMath.clampHigh(targetX + sourceWidth, targetWidth);
        if (firstTargetColumn > lastTargetColumn) return;

        const firstTargetRow = BitMath.clampZero(targetY);
        const lastTargetRow = BitMath.clampHigh(targetY + sourceHeight, targetHeight);
        if (firstTargetRow > lastTargetRow) return;

        for (let targetRow = firstTargetRow; targetRow < lastTargetRow; targetRow++) {
            const firstIndexInTargetRow = targetRow * targetWidth;
            const sourceRow = targetRow - targetY;
            for (let targetColumn = firstTargetColumn; targetColumn < lastTargetColumn; targetColumn++)
                targetPixels[firstIndexInTargetRow + targetColumn] = sourcePixels[sourceRow * sourceWidth + targetColumn - targetX];
        }
    },

    // The idea is to duplicate each pixel in the sourcePixels array by a factor of scale in 2 dimensions.
    // So if scale = 2, 1 pixel will turn into 4 pixels, filling 2 columns on the x axis and 2 rows on the y axis.
    //
    // Example: scale = 2
    // 
    // [0, 1
    //  2, 3] source array
    //
    // [0, 0, 1, 1,
    //  0, 0, 1, 1,
    //  2, 2, 3, 3,
    //  2, 2, 3, 3] target array
    //
    // To do this, loop over each row *scale* number of times and copy each pixel in the row *scale* number of times to the target array.
    copyPixelsScaled(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetX, targetY, scale) {
        for (let sourceRow = 0; sourceRow < sourceHeight; sourceRow++) {
            const firstIndexInSourceRow = sourceRow * sourceWidth;
            const targetRow = sourceRow * scale + targetY;
            for (let rowOffset = 0; rowOffset < scale; rowOffset++) {
                const firstIndexInTargetRow = (targetRow + rowOffset) * targetWidth;
                for (let sourceColumn = 0; sourceColumn < sourceWidth; sourceColumn++) {
                    const sourcePixelValue = sourcePixels[firstIndexInSourceRow + sourceColumn];
                    const targetIndex = firstIndexInTargetRow + sourceColumn * scale + targetX;
                    for (let columnOffset = 0; columnOffset < scale; columnOffset++)
                        targetPixels[targetIndex + columnOffset] = sourcePixelValue;
                }
            }
        }
    },

    // I think there is a more efficient way to scale and clip the source to the target.
    // Rather than calculating the source row and column for every write to the target, it might be more efficient to iterate
    // through source row and column with for loops. The only issue is that calculating edge offsets will require some tricky math
    // and some conditions. For example, if the source is being scaled up by 2 and targetX is -1, only half of the source pixel will be
    // drawn. Special offset values would need to be calculated for reading the source values for any clipped edges.
    // One benefit of this approach is there is no branching. Function calls should ideally be inlined.
    copyPixelsScaledClipped(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetHeight, targetX, targetY, scale) {
        let firstTargetColumn = BitMath.clampZero(targetX);
        let firstTargetRow = BitMath.clampZero(targetY);
        let lastTargetColumn = BitMath.clampHigh(targetX + sourceWidth * scale, targetWidth);
        let lastTargetRow = BitMath.clampHigh(targetY + sourceHeight * scale, targetHeight);

        const inverseScale = 1 / scale; // Multiply by inverse scale instead of dividing by scale in the loop.

        for (let targetRow = firstTargetRow; targetRow < lastTargetRow; targetRow++) {
            const firstIndexInSourceRow = BitMath.truncate((targetRow - targetY) * inverseScale) * sourceWidth; // Using truncate instead of floor because value is always positive.
            const firstIndexInTargetRow = targetRow * targetWidth;
            // There might be 
            for (let targetColumn = firstTargetColumn; targetColumn < lastTargetColumn; targetColumn++)
                targetPixels[firstIndexInTargetRow + targetColumn] = sourcePixels[firstIndexInSourceRow + BitMath.truncate((targetColumn - targetX) * inverseScale)];
        }
    },

    // A raster is simply a 2 dimensional grid of pixels.
    // This object is helpful for tracking the pixel values, the number of pixels, and the width and height of the grid.
    // pixels is an array of 32 bit ints, pixelCount is the number of array elements.
    // width and height must not exceed the length of the pixels array to avoid overflows.
    createRaster(pixels, width, height) {
        return { pixels, pixelCount: width * height, width, height }
    },



    fill(raster_pixels, raster_pixelCount, color) {
        for (let index = 0; index < raster_pixelCount; index++) raster_pixels[index] = color;
    },

    ///////////////
    // TRIANGLES //
    ///////////////
    // Functions for drawing triangles

    fillClippedTriangle(raster_pixels, raster_width, clip_left, clip_top, clip_right, clip_bottom, triangle_x0, triangle_y0, triangle_x1, triangle_y1, triangle_x2, triangle_y2, color) {
        // The bounding box of the triangle
        const box_bottom = PureMath.ceiling(PureMath.minimum2(PureMath.maximum3(triangle_y0, triangle_y1, triangle_y2), clip_bottom));
        const box_left = PureMath.floor(PureMath.maximum2(PureMath.minimum3(triangle_x0, triangle_x1, triangle_x2), clip_left));
        const box_right = PureMath.ceiling(PureMath.minimum2(PureMath.maximum3(triangle_x0, triangle_x1, triangle_x2), clip_right));
        const box_top = PureMath.floor(PureMath.maximum2(PureMath.minimum3(triangle_y0, triangle_y1, triangle_y2), clip_top));
        const box_width = box_right - box_left; // The box width is tied to the x loop, so be careful if you change this.

        // edge0
        const a0 = triangle_y0 - triangle_y1; // Right Normal x is negative edge vector y
        const b0 = triangle_x1 - triangle_x0; // Right Normal y is edge vector x
        const c0 = -a0 * triangle_x0 - b0 * triangle_y0; // The negative dot product of the point and the normal vector
        // edge1
        const a1 = triangle_y1 - triangle_y2;
        const b1 = triangle_x2 - triangle_x1;
        const c1 = -a1 * triangle_x1 - b1 * triangle_y1;
        // edge2
        const a2 = triangle_y2 - triangle_y0;
        const b2 = triangle_x0 - triangle_x2;
        const c2 = -a2 * triangle_x2 - b2 * triangle_y2;

        // Get the x and y offsets for each pixel test
        // Get the corner point of the pixel bounding box that is farthest along the right normal vector to the line edge.
        const x0 = a0 < 0 ? 0 : 1; // !(a0 >> 31) is a fast alternative, but it will truncate float values and introduce rounding errors.
        const y0 = b0 < 0 ? 0 : 1; // !(b0 >> 31)
        const x1 = a1 < 0 ? 0 : 1; // !(a1 >> 31)
        const y1 = b1 < 0 ? 0 : 1; // !(b1 >> 31)
        const x2 = a2 < 0 ? 0 : 1; // !(a2 >> 31)
        const y2 = b2 < 0 ? 0 : 1; // !(b2 >> 31)

        // These are the results of each edge test for the top left corner of the bounding box with deepest point in pixel offsets applied.
        let v0 = a0 * (box_left + x0) + b0 * (box_top + y0) + c0;
        let v1 = a1 * (box_left + x1) + b1 * (box_top + y1) + c1;
        let v2 = a2 * (box_left + x2) + b2 * (box_top + y2) + c2;

        // The y increment to add to the edge test result on each y iteration
        const yOffset0 = b0 - a0 * box_width;
        const yOffset1 = b1 - a1 * box_width;
        const yOffset2 = b2 - a2 * box_width;

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_width;

        for (let y = box_top; y < box_bottom; y++) {

            for (let x = box_left; x < box_right; x++) {
                // (v0 | v1 | v2) > 0 Is a faster alternative, but the bitwise operations truncate float values, leading to a rounding error.
                // I'm choosing to not draw points on the line because only the very edge of the pixel would be on the line.
                if (v0 > 0 && v1 > 0 && v2 > 0) raster_pixels[index] = color;

                index++;

                v0 += a0;
                v1 += a1;
                v2 += a2;
            }

            index += indexYStep;

            v0 += yOffset0;
            v1 += yOffset1;
            v2 += yOffset2;
        }
    },

    fillTransparentTriangle(raster_pixels, raster_width, triangle_x0, triangle_y0, triangle_x1, triangle_y1, triangle_x2, triangle_y2, color) {
        // The bounding box of the triangle
        const box_bottom = BitMath.ceiling(PureMath.maximum3(triangle_y0, triangle_y1, triangle_y2));
        const box_left = BitMath.floor(PureMath.minimum3(triangle_x0, triangle_x1, triangle_x2));
        const box_right = BitMath.ceiling(PureMath.maximum3(triangle_x0, triangle_x1, triangle_x2));
        const box_top = BitMath.floor(PureMath.minimum3(triangle_y0, triangle_y1, triangle_y2));
        const box_width = box_right - box_left; // The box width is tied to the x loop, so be careful if you change this.

        // edge0
        const a0 = triangle_y0 - triangle_y1; // Right Normal x is negative edge vector y
        const b0 = triangle_x1 - triangle_x0; // Right Normal y is edge vector x
        const c0 = -a0 * triangle_x0 - b0 * triangle_y0; // The negative dot product of the point and the normal vector
        // edge1
        const a1 = triangle_y1 - triangle_y2;
        const b1 = triangle_x2 - triangle_x1;
        const c1 = -a1 * triangle_x1 - b1 * triangle_y1;
        // edge2
        const a2 = triangle_y2 - triangle_y0;
        const b2 = triangle_x0 - triangle_x2;
        const c2 = -a2 * triangle_x2 - b2 * triangle_y2;

        const x0 = a0 < 0 ? 0 : 1; // !(a0 >> 31) is a fast alternative, but it will truncate float values and introduce rounding errors.
        const y0 = b0 < 0 ? 0 : 1; // !(b0 >> 31)
        const x1 = a1 < 0 ? 0 : 1; // !(a1 >> 31)
        const y1 = b1 < 0 ? 0 : 1; // !(b1 >> 31)
        const x2 = a2 < 0 ? 0 : 1; // !(a2 >> 31)
        const y2 = b2 < 0 ? 0 : 1; // !(b2 >> 31)

        // These are the results of each edge test for the top left corner of the bounding box with deepest point in pixel offsets applied.
        let v0 = a0 * (box_left + x0) + b0 * (box_top + y0) + c0;
        let v1 = a1 * (box_left + x1) + b1 * (box_top + y1) + c1;
        let v2 = a2 * (box_left + x2) + b2 * (box_top + y2) + c2;

        // The y increment to add to the edge test result on each y iteration
        const yOffset0 = b0 - a0 * box_width;
        const yOffset1 = b1 - a1 * box_width;
        const yOffset2 = b2 - a2 * box_width;

        // Premultiplied color:
        color = Color.premultiplyColor(color);

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_width;

        for (let y = box_top; y < box_bottom; y++) {

            for (let x = box_left; x < box_right; x++) {
                if (v0 > 0 && v1 > 0 && v2 > 0) raster_pixels[index] = Color.blendOverOpaqueBase(color, raster_pixels[index]);

                if (x === TESTDATA.x && y === TESTDATA.y) {

                    MESSAGE += `\n--- triangle --- ${(color >>> 0).toString(16)} --- test point: x: ${x}, y: ${y}\n`;
                    MESSAGE += `- boundary:\n${box_left}, ${box_top}\n${box_right}, ${box_bottom}\n`
                    MESSAGE += `- triangle points (x, y):\n${triangle_x0}, ${triangle_y0}\n${triangle_x1}, ${triangle_y1}\n${triangle_x2}, ${triangle_y2}\n`;
                    MESSAGE += `- edge normals (x, y):\n${a0}, ${b0}\n${a1}, ${b1}\n${a2}, ${b2}\n`;
                    MESSAGE += `- edge tests:\n${x + x0}, ${y + y0} : ${v0}\n${x + x1}, ${y + y1} : ${v1}\n${x + x2}, ${y + y2} : ${v2}, point inside: ${v0 > 0 && v1 > 0 && v2 > 0}\n`;

                    //MESSAGE +=(edge0IsShared && (b0 < 0 || b0 == 0 && a0 > 0) ? v0 >= 0 : v0 > 0) , (edge1IsShared && (b1 < 0 || b1 == 0 && a1 > 0) ? v1 >= 0 : v1 > 0) , (edge2IsShared && b2 < 0 ? (v2 >= 0 || b2 == 0 && a2 > 0) : v2 > 0);
                    //console.log(triangle_x2 + ' -> ' + triangle_x0, triangle_y2 + ' -> ' + triangle_y0, a2, b2, x + x2, y + y2, v1);
                }

                index++;

                v0 += a0;
                v1 += a1;
                v2 += a2;
            }

            index += indexYStep;

            v0 += yOffset0;
            v1 += yOffset1;
            v2 += yOffset2;
        }
    },

    // edge0IsShared, edge1IsShared, and edge2IsShared take 0 or 1. 1 indicates a shared edge.
    // triangle points are expected to be in clockwise winding order.
    fillTransparentMeshTriangle(raster_pixels, raster_width, triangle_x0, triangle_y0, triangle_x1, triangle_y1, triangle_x2, triangle_y2, edge0IsShared, edge1IsShared, edge2IsShared, color) {
        // The bounding box of the triangle
        const box_bottom = BitMath.ceiling(PureMath.maximum3(triangle_y0, triangle_y1, triangle_y2));
        const box_left = BitMath.floor(PureMath.minimum3(triangle_x0, triangle_x1, triangle_x2));
        const box_right = BitMath.ceiling(PureMath.maximum3(triangle_x0, triangle_x1, triangle_x2));
        const box_top = BitMath.floor(PureMath.minimum3(triangle_y0, triangle_y1, triangle_y2));
        const box_width = box_right - box_left; // The box width is tied to the x loop, so be careful if you change this.

        // a and b represent the x and y values of the right normal vector to the edge.
        // edge0
        const a0 = triangle_y0 - triangle_y1; // Right Normal x is negative edge vector y
        const b0 = triangle_x1 - triangle_x0; // Right Normal y is edge vector x
        const c0 = -a0 * triangle_x0 - b0 * triangle_y0; // The negative dot product of the point and the normal vector
        // edge1
        const a1 = triangle_y1 - triangle_y2;
        const b1 = triangle_x2 - triangle_x1;
        const c1 = -a1 * triangle_x1 - b1 * triangle_y1;
        // edge2
        const a2 = triangle_y2 - triangle_y0;
        const b2 = triangle_x0 - triangle_x2;
        const c2 = -a2 * triangle_x2 - b2 * triangle_y2;

        const x0 = edge0IsShared ? 0.5 : a0 < 0 ? 0 : 1;
        const y0 = edge0IsShared ? 0.5 : b0 < 0 ? 0 : 1;
        const x1 = edge1IsShared ? 0.5 : a1 < 0 ? 0 : 1;
        const y1 = edge1IsShared ? 0.5 : b1 < 0 ? 0 : 1;
        const x2 = edge2IsShared ? 0.5 : a2 < 0 ? 0 : 1;
        const y2 = edge2IsShared ? 0.5 : b2 < 0 ? 0 : 1;

        //console.log(`edge1 normal: ${a1}, ${b1}, offset: ${x1}, ${y1}`)

        // These are the results of each edge test for the offset point in the pixel boundary.
        let v0 = a0 * (box_left + x0) + b0 * (box_top + y0) + c0;
        let v1 = a1 * (box_left + x1) + b1 * (box_top + y1) + c1;
        let v2 = a2 * (box_left + x2) + b2 * (box_top + y2) + c2;

        // The y increment to add to the edge test result on each y iteration
        const yOffset0 = b0 - a0 * box_width;
        const yOffset1 = b1 - a1 * box_width;
        const yOffset2 = b2 - a2 * box_width;

        const premultipliedColor = Color.premultiplyColor(color);

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_width;

        const edge0IsBottomLeft = edge0IsShared && (b0 < 0 || b0 == 0 && a0 > 0);
        const edge1IsBottomLeft = edge1IsShared && (b1 < 0 || b1 == 0 && a1 > 0);
        const edge2IsBottomLeft = edge2IsShared && (b2 < 0 || b2 == 0 && a1 > 0);

        for (let y = box_top; y < box_bottom; y++) {
            for (let x = box_left; x < box_right; x++) {
                // Apply a tie break rule to include points that are on the line for shared edges
                //if ((edge0IsBottomLeft ? v0 >= 0 : v0 > 0) && (edge1IsBottomLeft ? v1 >= 0 : v1 > 0) && (edge2IsBottomLeft ? v2 >= 0 : v2 > 0)) raster_pixels[index] = Color.blendOverOpaqueBase(premultipliedColor, pixels[index]);
                //if ((v0 > 0 || edge0IsBottomLeft && v0 === 0) && (v1 > 0 || edge1IsBottomLeft && v1 === 0) && (v2 > 0 || edge2IsBottomLeft && v2 === 0)) raster_pixels[index] = Color.blendOverOpaqueBase(premultipliedColor, pixels[index]);
                if (((v0 > 0) + ((v0 === 0) & edge0IsBottomLeft)) && ((v1 > 0) + ((v1 === 0) & edge1IsBottomLeft)) && ((v2 > 0) + ((v2 === 0) & edge2IsBottomLeft))) raster_pixels[index] = Color.blendOverOpaqueBase(premultipliedColor, raster_pixels[index]);

                /*if (x === TESTDATA.x && y === TESTDATA.y) {

                    MESSAGE += `\n--- triangle --- ${(color >>> 0).toString(16)} --- test point: x: ${x}, y: ${y}\n`;
                    MESSAGE += `- boundary:\n${box_left}, ${box_top}\n${box_right}, ${box_bottom}\n`
                    MESSAGE += `- triangle points (x, y):\n${triangle_x0}, ${triangle_y0}\n${triangle_x1}, ${triangle_y1}\n${triangle_x2}, ${triangle_y2}\n`;
                    MESSAGE += `- edge normals (x, y):\n${a0}, ${b0}\n${a1}, ${b1}\n${a2}, ${b2}\n`;
                    MESSAGE += `- edge tests:\n${x + x0}, ${y + y0} : ${v0}\n${x + x1}, ${y + y1} : ${v1}\n${x + x2}, ${y + y2} : ${v2}, point inside: ${v0 > 0 && v1 > 0 && v2 > 0}\n`;

                    //MESSAGE +=(edge0IsShared && (b0 < 0 || b0 == 0 && a0 > 0) ? v0 >= 0 : v0 > 0) , (edge1IsShared && (b1 < 0 || b1 == 0 && a1 > 0) ? v1 >= 0 : v1 > 0) , (edge2IsShared && b2 < 0 ? (v2 >= 0 || b2 == 0 && a2 > 0) : v2 > 0);
                    //console.log(triangle_x2 + ' -> ' + triangle_x0, triangle_y2 + ' -> ' + triangle_y0, a2, b2, x + x2, y + y2, v1);
                }*/
                index++;

                v0 += a0;
                v1 += a1;
                v2 += a2;
            }

            index += indexYStep;

            v0 += yOffset0;
            v1 += yOffset1;
            v2 += yOffset2;
        }
    },

    // This method assumes clockwise point winding.
    // Any pixel volumes that are to the right of or overlap all 3 edge vectors will be drawn.
    // Points will be offset to the corner of the pixel that is farthest along the edge normal to get the point in the pixel volume that is deepest into the edge along the normal.
    fillTriangle(raster_pixels, raster_width, triangle_x0, triangle_y0, triangle_x1, triangle_y1, triangle_x2, triangle_y2, color) {
        // The bounding box of the triangle
        const box_bottom = BitMath.ceiling(BitMath.maximum3(triangle_y0, triangle_y1, triangle_y2));
        const box_left = BitMath.floor(BitMath.minimum3(triangle_x0, triangle_x1, triangle_x2));
        const box_right = BitMath.ceiling(BitMath.maximum3(triangle_x0, triangle_x1, triangle_x2));
        const box_top = BitMath.floor(BitMath.minimum3(triangle_y0, triangle_y1, triangle_y2));
        const box_width = box_right - box_left; // The box width is tied to the x loop, so be careful if you change this.

        // The equation of a line is ax + by + c = 0
        // a and b are the x and y values of the normal of the line.
        // c is the negative dot product of the point (x, y) and the normal (a, b).
        // When the point (x, y) is on the line, the equation will yield 0.
        // When the point (x, y) is to the right or left of the line, the equation will yield a positive or negative value.

        // Set up the coefficient values for each line segment in the triangle.
        // The right normal of a vector, v (p1.x - p0.x, p1.y - p0.y) is (-vy, vx)
        // edge0
        const a0 = triangle_y0 - triangle_y1; // Right Normal x is negative edge vector y
        const b0 = triangle_x1 - triangle_x0; // Right Normal y is edge vector x
        const c0 = -a0 * triangle_x0 - b0 * triangle_y0; // The negative dot product of the point and the normal vector
        // edge1
        const a1 = triangle_y1 - triangle_y2;
        const b1 = triangle_x2 - triangle_x1;
        const c1 = -a1 * triangle_x1 - b1 * triangle_y1;
        // edge2
        const a2 = triangle_y2 - triangle_y0;
        const b2 = triangle_x0 - triangle_x2;
        const c2 = -a2 * triangle_x2 - b2 * triangle_y2;

        // This algorithm fills any pixel that the triangle overlaps.
        // A pixel is technically an area, not a point. Points are infinitely small. Pixels have an area of 1x1 or 1.
        // A pixel has 4 corner points.
        // Instead of testing the top left corner or the center point, this algorithm tests the point that is farthest along the normal vector.
        // The normal vector points inside the triangle. Getting the point that is deepest into the triangle will ensure the overlap test is accurate.

        // Get the x and y offsets for each pixel test
        // Get the corner point of the pixel bounding box that is farthest along the right normal vector to the line edge.
        const x0 = a0 < 0 ? 0 : 1; // !(a0 >> 31) is a fast alternative, but it will truncate float values and introduce rounding errors.
        const y0 = b0 < 0 ? 0 : 1; // !(b0 >> 31)
        const x1 = a1 < 0 ? 0 : 1; // !(a1 >> 31)
        const y1 = b1 < 0 ? 0 : 1; // !(b1 >> 31)
        const x2 = a2 < 0 ? 0 : 1; // !(a2 >> 31)
        const y2 = b2 < 0 ? 0 : 1; // !(b2 >> 31)

        // These are the results of each edge test for the top left corner of the bounding box with deepest point in pixel offsets applied.
        let v0 = a0 * (box_left + x0) + b0 * (box_top + y0) + c0;
        let v1 = a1 * (box_left + x1) + b1 * (box_top + y1) + c1;
        let v2 = a2 * (box_left + x2) + b2 * (box_top + y2) + c2;

        // The y increment to add to the edge test result on each y iteration
        const yOffset0 = b0 - a0 * box_width;
        const yOffset1 = b1 - a1 * box_width;
        const yOffset2 = b2 - a2 * box_width;

        // Set up the first index and row step.
        let index = box_top * raster_width + box_left;
        const indexYStep = raster_width - box_width;

        for (let y = box_top; y < box_bottom; y++) {

            for (let x = box_left; x < box_right; x++) {
                // (v0 | v1 | v2) > 0 Is a faster alternative, but the bitwise operations truncate float values, leading to a rounding error.
                // I'm choosing to not draw points on the line because only the very edge of the pixel would be on the line.
                if (v0 > 0 && v1 > 0 && v2 > 0) raster_pixels[index] = color;

                index++;

                v0 += a0;
                v1 += a1;
                v2 += a2;
            }

            index += indexYStep;

            v0 += yOffset0;
            v1 += yOffset1;
            v2 += yOffset2;
        }
    }

};