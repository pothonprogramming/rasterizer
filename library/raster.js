// Assumes Little Endian byte order.
// Color values will be stored as AABBGGRR.
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
                    const targetIndex = firstIndexInTargetRow + sourceColumn * scale + targetX;
                    const sourcePixelValue = sourcePixels[firstIndexInSourceRow + sourceColumn];
                    for (let columnOffset = 0; columnOffset < scale; columnOffset++)
                        targetPixels[targetIndex + columnOffset] = sourcePixelValue;
                }
            }
        }
    },

    copyPixelsScaledClipped(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetHeight, targetX, targetY, scale) {
        //console.log(`sourceWidth: ${sourceWidth}, sourceHeight: ${sourceHeight}`);
        //console.log(`targetWidth: ${targetWidth}, targetHeight: ${targetHeight}, targetX: ${targetX}, targetY: ${targetY}`);

        // Set up the source and target boundaries for reading and writing.
        let firstSourceColumn = targetX < 0 ? BitMath.floor(-targetX / scale) : 0;
        let firstTargetColumn = BitMath.clampZero(targetX);

        let lastTargetColumn = BitMath.clampHigh(targetX + sourceWidth * scale, targetWidth);
        //let lastSourceColumn = lastTargetColumn > targetWidth ? sourceWidth - BitMath.floor(targetWidth - lastTargetColumn / scale) : sourceWidth;

        let firstSourceRow = targetY < 0 ? BitMath.floor(-targetY / scale) : 0;
        let firstTargetRow = BitMath.clampZero(targetY);

        let lastTargetRow = BitMath.clampHigh(targetY + sourceHeight * scale, targetHeight);
        //let lastSourceRow = lastTargetRow > targetHeight ? sourceHeight - BitMath.floor(targetHeight - lastTargetRow / scale) : sourceHeight;

        //console.log(`firstSourceRow: ${firstSourceRow}, lastSourceRow: ${lastSourceRow}, firstSourceColumn: ${firstSourceColumn}, lastSourceColumn: ${lastSourceColumn}`);
        //console.log(`firstTargetRow: ${firstTargetRow}, lastTargetRow: ${lastTargetRow}, firstTargetColumn: ${firstTargetColumn}, lastTargetColumn: ${lastTargetColumn}`);

        //let sourceColumn = firstSourceColumn;
        //let sourceRow = firstSourceRow;
        // Now loop over the target boundaries
        for (let targetRow = firstTargetRow; targetRow < lastTargetRow; targetRow++) {
            // Every time you loop over *scale* number of target rows, you can increment a source row
            const sourceRow = Math.floor((targetRow - targetY) / scale);

            for (let targetColumn = firstTargetColumn; targetColumn < lastTargetColumn; targetColumn++) {

                const sourceColumn = Math.floor((targetColumn - targetX) / scale);
                const value = sourcePixels[sourceRow * sourceWidth + sourceColumn];
                targetPixels[targetRow * targetWidth + targetColumn] = value;
            }

        }

    },

    // A raster is simply a grid of pixels. The grid doesn't exist in any particular coordinate space, but it does have dimensions.
    // pixels is an array of 32 bit ints, pixelCount is the number of array elements.
    // width and height must not exceede the length of the pixels array to avoid overflows.
    createRaster(pixels, width, height) {
        return { pixels, pixelCount: width * height, width, height }
    },

    fill(pixels, pixelCount, color) {
        for (let i = 0; i < pixelCount; i++) pixels[i] = color;
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
    }

};