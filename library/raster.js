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

    copyPixels(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetX, targetY) {
        const bottom = targetY + sourceHeight;
        const right = targetX + sourceWidth;

        let sourceIndex = 0;
        for (let pixelY = targetY; pixelY < bottom; pixelY++)
            for (let pixelX = targetX; pixelX < right; pixelX++) {
                targetPixels[pixelY * targetWidth + pixelX] = sourcePixels[sourceIndex];
                sourceIndex++;
            }
    },

    copyPixelsClipped(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetHeight, targetX, targetY) {
        const left = BitMath.clampZero(targetX);
        const right = BitMath.clampHigh(targetX + sourceWidth, targetWidth);
        if (left > right) return;

        const top = BitMath.clampZero(targetY);
        const bottom = BitMath.clampHigh(targetY + sourceHeight, targetHeight);
        if (top > bottom) return;

        for (let pixelY = top; pixelY < bottom; pixelY++) {
            const sourcePixelY = pixelY - targetY;
            for (let pixelX = left; pixelX < right; pixelX++)
                targetPixels[pixelY * targetWidth + pixelX] = sourcePixels[sourcePixelY * sourceWidth + (pixelX - targetX)];
        }
    },

    copyPixelsScaled(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetX, targetY, scale) {
        const bottom = targetY + sourceHeight * scale;
        const right = targetX + sourceWidth * scale;

        let sourceIndex = 0;
        for (let sourceY = 0; sourceY < sourceHeight; sourceY++) {
            for (let sourceX = 0; sourceX < sourceWidth; sourceX++) {
                const value = sourcePixels[sourceIndex];
                sourceIndex++;

                const startX = sourceX * scale;
                const startY = sourceY * scale;

                for (let tY = 0; ty < scale; ty++) {
                    const targetRow = (startY + ty) * targetWidth;
                    for (let tX = 0; tx < scale; tx++) {
                        targetPixels[targetRow + startX + sX] = value;
                    }
                }
            }
        }
    },

    copyPixelsClippedScaled(sourcePixels, sourceWidth, sourceHeight, targetPixels, targetWidth, targetHeight, targetX, targetY, scale) {
        const left = BitMath.clampZero(targetX);
        const right = BitMath.clampHigh(targetX + sourceWidth, targetWidth);
        if (left > right) return;

        const top = BitMath.clampZero(targetY);
        const bottom = BitMath.clampHigh(targetY + sourceHeight, targetHeight);
        if (top > bottom) return;

        for (let pixelY = top; pixelY < bottom; pixelY++) {
            const sourcePixelY = pixelY - targetY;
            for (let pixelX = left; pixelX < right; pixelX++)
                targetPixels[pixelY * targetWidth + pixelX] = sourcePixels[sourcePixelY * sourceWidth + (pixelX - targetX)];
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