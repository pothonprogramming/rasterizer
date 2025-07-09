// Assumes Little Endian byte order.
// Color values are expected to be stored as AABBGGRR.
// For example, opaque blue should be written as 0xffff0000, not 0x0000ffff.

const Raster = {

    copyOpaquePixels(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetX, targetY) {
        const bottom = targetY + sourceHeight;
        const right = targetX + sourceWidth;

        let sourceIndex = 0;
        for (let pixelY = targetY; pixelY < bottom; pixelY++)
            for (let pixelX = targetX; pixelX < right; pixelX++) {
                const sourceValue = sourcePixels[sourceIndex];
                const mask = -((sourceValue >>> 24) & 0xff !== 0);
                const targetIndex = pixelY * targetWidth + pixelX;
                targetPixels[targetIndex] = (sourceValue & mask) | (targetPixels[targetIndex] & ~mask);
                sourceIndex++;
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

    drawCircle(pixels, rasterWidth, targetX, targetY, diameter, color) {
        let odd = diameter & 1;
        const circleRadius = (diameter - odd) * 0.5;
        odd = odd ^ 1;
        const centerX = targetX + circleRadius;
        const centerY = targetY + circleRadius;
        let x = 0;
        let y = circleRadius;
        let d = 1 - circleRadius;

        while (x <= y) {
            pixels[(centerY + y - odd) * rasterWidth + centerX + x - odd] = color;
            pixels[(centerY + x - odd) * rasterWidth + centerX + y - odd] = color;
            pixels[(centerY + y - odd) * rasterWidth + centerX - x] = color;
            pixels[(centerY + x - odd) * rasterWidth + centerX - y] = color;
            pixels[(centerY - y) * rasterWidth + centerX - x] = color;
            pixels[(centerY - x) * rasterWidth + centerX - y] = color;
            pixels[(centerY - y) * rasterWidth + centerX + x - odd] = color;
            pixels[(centerY - x) * rasterWidth + centerX + y - odd] = color;

            const delta = d + 2 * x + 1;
            const mask = -(+(delta >= 0));
            d += 2 * x + 1 + ((mask & (1 - 2 * y)));
            y += mask;
            x++;
        }
    },
    drawCircleClipped() { },

    drawLineSegment(pixels, rasterWidth, lineSegmentX0, lineSegmentY0, lineSegmentX1, lineSegmentY1, color) {
        const absoluteRise = BitMath.absolute(lineSegmentY1 - lineSegmentY0);
        const absoluteRun = BitMath.absolute(lineSegmentX1 - lineSegmentX0);
        const stepX = lineSegmentX0 < lineSegmentX1 ? 1 : -1;
        const stepY = lineSegmentY0 < lineSegmentY1 ? 1 : -1;

        let index = lineSegmentY0 * rasterWidth + lineSegmentX0;
        const lastIndex = lineSegmentY1 * rasterWidth + lineSegmentX1;
        const indexYStep = stepY * rasterWidth;

        // If the line is steep, then y will always be incremented, however x will not always be incremented.
        // Else if the line is not steep, then x will always be incremented, but y will not always be incremented.
        if (absoluteRise > absoluteRun) {
            let error = absoluteRise >> 1;
            while (index !== lastIndex) {
                pixels[index] = color;
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
                pixels[index] = color;
                index += stepX;
                error -= absoluteRise;
                if (error < 0) {
                    index += indexYStep;
                    error += absoluteRun;
                }
            }
        }
        pixels[index] = color; // Draw the last pixel in the line segment.
    },

    drawLineSegmentClipped(pixels, rasterWidth, rasterHeight, lineSegmentX0, lineSegmentY0, lineSegmentX1, lineSegmentY1, color) {
        let t0 = 0; // time along the line segment at point0
        let t1 = 1; // time along the line segment at point1
        let deltaX = lineSegmentX1 - lineSegmentX0; // rate of change along x axis
        let deltaY = lineSegmentY1 - lineSegmentY0; // rate of change along y axis

        const values = [-deltaX, lineSegmentX0, deltaX, rasterWidth - 1 - lineSegmentX0, -deltaY, lineSegmentY0, deltaY, rasterHeight - 1 - lineSegmentY0];

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

        let index = lineSegmentY0 * rasterWidth + lineSegmentX0;
        const lastIndex = lineSegmentY1 * rasterWidth + lineSegmentX1;
        const indexYStep = stepY * rasterWidth;

        // If the line is steep, then y will always be incremented, however x will not always be incremented.
        // Else if the line is not steep, then x will always be incremented, but y will not always be incremented.
        if (absoluteRise > absoluteRun) {
            let error = absoluteRise >> 1;
            while (index !== lastIndex) {
                pixels[index] = color;
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
                pixels[index] = color;
                index += stepX;
                error -= absoluteRise;
                if (error < 0) {
                    index += indexYStep;
                    error += absoluteRun;
                }
            }
        }
        pixels[index] = color; // Draw the last pixel in the line segment.
    },

    fill(pixels, pixelCount, color) {
        for (let i = 0; i < pixelCount; i++) pixels[i] = color;
    },

    // This isn't working yet.
    fillCircle(pixels, rasterWidth, circleX, circleY, circleRadius, color) {
        const step = Math_PI * 0.0625;
        const cos = Math.cos(step);
        const sin = Math.sin(step);

        let pixelX = circleRadius;
        let pixelY = 0;
        let pointCount = Math.ceil(Math_2PI / step);

        for (let i = 0; i < pointCount; i++) {
            pixels[(pixelY + circleY) * rasterWidth + pixelX + circleX] = color;
            let x = pixelX * cos - pixelY * sin;
            let y = pixelX * sin + pixelY * cos;
            pixelX = Math.round(x);
            pixelY = Math.round(y);
        }
    },

    // Does not protect against buffer overflow.
    fillHorizontalLine(pixels, rasterWidth, line_x, line_y, lineWidth, color) {
        const firstIndex = line_y * rasterWidth + line_x;
        const lastIndex = firstIndex + lineWidth;
        for (let index = firstIndex; index < lastIndex; index++) pixels[index] = color;
    },

    // This method is not meant to handle negative line width. Lines will always be drawn starting at the leftmost coordinate.
    fillHorizontalLineClipped(pixels, rasterWidth, rasterHeight, lineLeftX, line_y, lineWidth, color) {
        let lineRightX = lineLeftX + lineWidth; // Technically this is 1 greater than the true right x of the line, but the last index is never drawn.
        if (lineLeftX >= rasterWidth || lineRightX <= 0 || line_y < 0 || line_y >= rasterHeight) return;
        if (lineLeftX < 0) lineLeftX = 0;
        if (lineRightX > rasterWidth) lineRightX = rasterWidth; // Still technically 1 greater than the maximum right x of the line.

        const firstIndex = line_y * rasterWidth + lineLeftX;
        const lastIndex = firstIndex + lineRightX - lineLeftX;

        for (let index = firstIndex; index < lastIndex; index++) pixels[index] = color;
    },

    fillPoint(pixels, rasterWidth, pointX, pointY, color) {
        pixels[pointY * rasterWidth + pointX] = color;
    },

    fillPointClipped(pixels, rasterWidth, rasterHeight, pointX, pointY, color) {
        if (pointX < 0 || pointY < 0 || pointX > rasterWidth || pointY > rasterHeight) return;
        pixels[pointY * rasterWidth + pointX] = color;
    },

    fillRectangle(pixels, rasterWidth, rectangleX, rectangleY, rectangleWidth, rectangleHeight, color) {
        let bottom = rectangleY + rectangleHeight;
        let right = rectangleX + rectangleWidth;

        for (let pixelY = rectangleY; pixelY < bottom; pixelY++)
            for (let pixelX = rectangleX; pixelX < right; pixelX++)
                pixels[pixelY * rasterWidth + pixelX] = color;
    },

    fillRectangleClipped(pixels, rasterWidth, rasterHeight, rectangleX, rectangleY, rectangleWidth, rectangleHeight, color) {
        let left = BitMath.clampZero(rectangleX);
        let right = BitMath.clampHigh(rectangleX + rectangleWidth, rasterWidth);
        if (left >= right) return;

        let top = BitMath.clampZero(rectangleY);
        let bottom = BitMath.clampHigh(rectangleY + rectangleHeight, rasterHeight);
        if (top >= bottom) return;

        for (let pixelY = top; pixelY < bottom; pixelY++)
            for (let pixelX = left; pixelX < right; pixelX++)
                pixels[pixelY * rasterWidth + pixelX] = color;
    },

    fillTriangle(pixels, rasterWidth, triangle_x0, triangle_y0, triangle_x1, triangle_y1, triangle_x2, triangle_y2, color) {
        // The bounding box of the triangle
        const box_bottom = BitMath.floor(BitMath.maximum3(triangle_y0, triangle_y1, triangle_y2));
        const box_left = BitMath.floor(BitMath.minimum3(triangle_x0, triangle_x1, triangle_x2));
        const box_right = BitMath.floor(BitMath.maximum3(triangle_x0, triangle_x1, triangle_x2));
        const box_top = BitMath.floor(BitMath.minimum3(triangle_y0, triangle_y1, triangle_y2));

        // The equation of a line is ax + by + c = 0 when x and y are not both equal to 0.
        // When a point (x, y) is on the line, the equation will yield 0.
        // When a point (x, y) is to the left or right of the line, the equation will yield a positive or negative value.
        // Set up the coefficient values for each line segment in the triangle.
        const a0 = triangle_y0 - triangle_y1; // Normal x
        const b0 = triangle_x1 - triangle_x0; // Normal y
        const c0 = -a0 * triangle_x0 - b0 * triangle_y0;

        const a1 = triangle_y1 - triangle_y2;
        const b1 = triangle_x2 - triangle_x1;
        const c1 = -a1 * triangle_x1 - b1 * triangle_y1;

        const a2 = triangle_y2 - triangle_y0;
        const b2 = triangle_x0 - triangle_x2;
        const c2 = -a2 * triangle_x2 - b2 * triangle_y2;

        // Get the x and y offsets for each pixel test
        const x0 = a0 < 0 ? 0 : 1;
        const y0 = b0 < 0 ? 0 : 1;
        const x1 = a1 < 0 ? 0 : 1;
        const y1 = b1 < 0 ? 0 : 1;
        const x2 = a2 < 0 ? 0 : 1;
        const y2 = b2 < 0 ? 0 : 1;

        const offset0 = a0 * x0 + b0 * y0 + c0;
        const offset1 = a1 * x1 + b1 * y1 + c1;
        const offset2 = a2 * x2 + b2 * y2 + c2;

        for (let y = box_top; y <= box_bottom; y++) {
            //let wedge0 = a0 * box_left + b0 * y + c0;
            //let wedge1 = a1 * box_left + b1 * y + c1;
            //let wedge2 = a2 * box_left + b2 * y + c2;

            let wedge0 = a0 * box_left + b0 * y + offset0;
            let wedge1 = a1 * box_left + b1 * y + offset1;
            let wedge2 = a2 * box_left + b2 * y + offset2;
            
            for (let x = box_left; x <= box_right; x++) {
                //let wedge0 = a0 * x + b0 * y + offset0;
                //let wedge1 = a1 * x + b1 * y + offset1;
                //let wedge2 = a2 * x + b2 * y + offset2;

                // You can also OR the 3 values together and test sign
                if (wedge0 >= 0 && wedge1 >= 0 && wedge2 >= 0) pixels[y * rasterWidth + x] = color;

                wedge0 += a0;
                wedge1 += a1;
                wedge2 += a2;
            }
        }
    },

    /*const ab0dot = a0 * a0 + b0 * b0;
        const ab1dot = a1 * a1 + b1 * b1;
        const ab2dot = a2 * a2 + b2 * b2;

        const ab1cross = a0 * b1 - b0 * a1;

        console.log(a0 * 90 + b0 * 30 + c0, a1 * 90 + b1 * 30 + c1, a2 * 90 + b2 * 30 + c2);
        */

    // Does not protect against buffer overflow.
    fillVerticalLine(pixels, rasterWidth, line_x, line_y, lineHeight, color) {
        const firstIndex = line_y * rasterWidth + line_x;
        const lastIndex = firstIndex + lineHeight * rasterWidth;
        for (let index = firstIndex; index < lastIndex; index += rasterWidth) pixels[index] = color;
    },

    // This method is not meant to handle negative lineHeight.
    fillVerticalLineClipped(pixels, rasterWidth, rasterHeight, line_x, lineTopY, lineHeight, color) {
        let lineBottomY = lineTopY + lineHeight; // This is technically 1 greater than the actual bottom y of the line.
        if (lineBottomY <= 0 || lineTopY >= rasterHeight || line_x < 0 || line_x >= rasterWidth) return;
        if (lineBottomY > rasterHeight) lineBottomY = rasterHeight; // Still 1 greater than the actual bottom y of the line.
        if (lineTopY < 0) lineTopY = 0;

        const firstIndex = lineTopY * rasterWidth + line_x;
        const lastIndex = lineBottomY * rasterWidth + line_x; // The last index is never drawn. Use <= in loop to draw last index.
        for (let index = firstIndex; index < lastIndex; index += rasterWidth) pixels[index] = color;
    }

};