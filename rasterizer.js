// This is the core application code or "application layer". It should be completely platform agnostic to maximize portability.
// Do not use non-portable techniques or libraries because logic is meant to be rewritten to C.
const Rasterizer = (() => {

    const MAX_RASTER_WIDTH = 640;
    const MAX_RASTER_HEIGHT = 640;

    ////////////////
    // INITIALIZE //
    ////////////////
    // Because all application logic is handled here, the application will initialize as soon as this code runs.
    // Calling an initialize method from the platform layer is not necessary, and adds bloat to the platform layer.

    const mouse = Input.createMouseInput();

    const canvas = {
        pixels:new Uint32Array(MAX_RASTER_WIDTH*MAX_RASTER_HEIGHT), // Initialize array to max size
        pixelCount:0,
        x:10,
        y:10,
        width:0,        
        height:0,
        scale:6
    };

    const display = {
        pixels:new Uint32Array(MAX_RASTER_WIDTH*MAX_RASTER_HEIGHT),
        pixelCount:0,
        width:0,
        height:0
    };

    const toolbar = {
        pixels:new Uint32Array(MAX_RASTER_WIDTH*MAX_RASTER_HEIGHT),
        pixelCount:0,
        x:0,
        y:0,
        width:0,
        height:0,
        scale:1,
        selectedColor:0xff000000
    };

    const triangle = [[50, 50], [80, 50], [65, 80]];
    let triangleAngle = 0;

    function rotatePointsAroundCenter(points, angleRadians) {
        if (!points.length) return [];
    
        // Step 1: Calculate the centroid (average x and y)
        let sumX = 0, sumY = 0;
        for (const [x, y] of points) {
            sumX += x;
            sumY += y;
        }
        const centerX = sumX / points.length;
        const centerY = sumY / points.length;
    
        // Step 2: Rotate each point around the centroid
        const cosA = Math.cos(angleRadians);
        const sinA = Math.sin(angleRadians);
        const rotated = points.map(([x, y]) => {
            const dx = x - centerX;
            const dy = y - centerY;
    
            const rx = dx * cosA - dy * sinA + centerX;
            const ry = dx * sinA + dy * cosA + centerY;
    
            return [rx, ry];
        });
    
        return rotated;
    }

    resizeRaster(canvas, 100, 100);
    Raster.fill(canvas.pixels, canvas.pixelCount, 0xff0000ff);

    resizeRaster(display, 640, 640);

    resizeRaster(toolbar, 320, 160);

    // You could do this in c by passing &width and &height instead of raster
    /*
        void resizeRaster(int *width, int *height, int w, int h) {
            width = w;
            height = h;
        }

        resizeRaster(&type1.width, &type1.height, 10, 20);
        resizeRaster(&type2.width, &type2.height, 10, 20);
    */
    function resizeRaster(raster, width, height) {
        if (width > MAX_RASTER_WIDTH) width = MAX_RASTER_WIDTH;
        if (height > MAX_RASTER_HEIGHT) height = MAX_RASTER_HEIGHT;
        raster.width = width;
        raster.height = height;
        raster.pixelCount = width * height;
    }

    function mouseIsInBounds(x, y, width, height, scale = 1) {
        if (mouse.x < x || mouse.y < y || mouse.x > x + width * scale || mouse.y > y + height * scale) return false;
        return true;
    }

    function plotPoint(canvasPixels, canvasWidth, canvasHeight, canvasX, canvasY, canvasScale = 1) {
        console.log(BitMath.floor((mouse.x - canvasX) / canvasScale), BitMath.floor((mouse.y - canvasY) / canvasScale));
        Raster.fillPointClipped(canvasPixels, canvasWidth, canvasHeight, BitMath.floor((mouse.x - canvasX) / canvasScale), BitMath.floor((mouse.y - canvasY) / canvasScale), 0xffffffff);
    }

    function drawPencilIcon(targetPixels, targetRasterWidth, x, y, scale, color) {
        const x0 = x;
        const y0 = BitMath.floor(y + 1 * scale);
        const x1 = x;
        const y1 = BitMath.floor(y + 0.75 * scale);
        const x2 = BitMath.floor(x + 0.75 * scale);
        const y2 = y;
        const x3 = BitMath.floor(x + 1 * scale);
        const y3 = BitMath.floor(y + 0.25 * scale);
        const x4 = BitMath.floor(x + 0.25 * scale);
        const y4 = BitMath.floor(y + 1 * scale);
        Raster.drawLineSegment(targetPixels, targetRasterWidth, x0, y0, x1, y1, color);
        Raster.drawLineSegment(targetPixels, targetRasterWidth, x1, y1, x2, y2, color);
        Raster.drawLineSegment(targetPixels, targetRasterWidth, x2, y2, x3, y3, color);
        Raster.drawLineSegment(targetPixels, targetRasterWidth, x3, y3, x4, y4, color);
        Raster.drawLineSegment(targetPixels, targetRasterWidth, x4, y4, x0, y0, color); 
    }

    return {
        getDisplayRasterPixels() { return display.pixels; },
        getDisplayRasterPixelCount() { return display.pixelCount; },
        getDisplayRasterWidth() { return display.width; },
        getDisplayRasterHeight() { return display.height; },
        render() {
            // Clear the background to black.
            Raster.fill(display.pixels, display.pixelCount, 0x00000000);
            // Interior border around displayRaster.
            Raster.fillHorizontalLine(display.pixels, display.width, 0, 0, display.width, 0xffffffff);
            Raster.fillHorizontalLine(display.pixels, display.width, 0, display.height - 1, display.width, 0xffffffff);
            Raster.fillVerticalLine(display.pixels, display.width, 0, 0, display.height, 0xffffffff);
            Raster.fillVerticalLine(display.pixels, display.width, display.width - 1, 0, display.height, 0xffffffff);

            // Messing around with drawing the canvas.
            //Raster.copyPixelsClipped(canvas.pixels, canvas.width, canvas.height, display.pixels, display.width, display.height, canvasPosition.x + 20, canvasPosition.y + 20);
            //Raster.copyPixelsScaled(canvas.pixels, canvas.width, canvas.height, display.pixels, display.width, canvasPosition.x, canvasPosition.y, canvasScale);
            //Raster.copyPixelsScaledClipped(canvas.pixels, canvas.width, canvas.height, display.pixels, display.width, display.height, canvasPosition.x + 180, canvasPosition.y + 40, 20);

            Raster.fill(canvas.pixels, canvas.pixelCount, 0xff0000ff);
            drawPencilIcon(canvas.pixels, canvas.width, 10, 10, 12, 0x00000000);
            //Raster.drawLineSegment(canvas.pixels, canvas.width, 50, 50, BitMath.floor((mouse.x - canvas.x)/canvas.scale), BitMath.floor((mouse.y - canvas.y) / canvas.scale), 0xffffffff);
            //Raster.drawLineSegmentClipped(canvas.pixels, canvas.width, canvas.height, BitMath.floor((mouse.x - canvas.x)/canvas.scale), BitMath.floor((mouse.y - canvas.y) / canvas.scale), 50, 50, 0xffffffff);
            
            Raster.fillTriangle(canvas.pixels, canvas.width, 10, 10, 25, 10, BitMath.floor((mouse.x - canvas.x)/canvas.scale), BitMath.floor((mouse.y - canvas.y) / canvas.scale), 0xff00ff00);
            Raster.fillPoint(canvas.pixels, canvas.width, 90, 30, 0xffffffff);
            Raster.fillPoint(canvas.pixels, canvas.width, 10, 10, 0xffffffff);
            Raster.fillPoint(canvas.pixels, canvas.width, 25, 10, 0xffffffff);

            let p = rotatePointsAroundCenter(triangle, triangleAngle += 0.005);
            console.log(p);
            Raster.fillTriangle(canvas.pixels, canvas.width, p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[2][1], 0xffff0000);
            //Raster.fillHorizontalLineClipped(canvas.pixels, canvas.width, canvas.height, -10, 99, 2000, 0xffffffff);
            //Raster.fillVerticalLineClipped(canvas.pixels, canvas.width, canvas.height, 99, 0, 99, 0xffffffff);
            Raster.copyPixelsScaledClipped(canvas.pixels, canvas.width, canvas.height, display.pixels, display.width, display.height, canvas.x, canvas.y, canvas.scale);

            

            // Draw the toolbar
            //Raster.fillRectangleClipped(toolbar.pixels,toolbar.width,toolbar.height,0, 0, toolbar.width, toolbar.height, toolbar.selectedColor);
            //Raster.copyPixelsScaledClipped(toolbar.pixels, toolbar.width, toolbar.height, display.pixels, display.width, display.height, toolbar.x, toolbar.y, toolbar.scale);

            // Horizontal
            
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 0, 100, 0xffffffff);
            // Vertical
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 100, 200, 0xffffffff);
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 100, 0, 0xffffffff);
            // 45 degree
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 200, 0, 0xffffffff);
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 200, 200, 0xffffffff);
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 0, 0, 0xff0000ff);
            //Raster.drawLineSegment(display.pixels, display.width, 100, 100, 0, 200, 0xff0000ff);

        },
        resizeDisplay(width, height) {
            resizeRaster(display, width, height);
        },
        update() {

            if (mouse.leftIsDown) {

                if (mouseIsInBounds(canvas.x, canvas.y, canvas.width, canvas.height, canvas.scale)) {
                    plotPoint(canvas.pixels, canvas.width, canvas.height, canvas.x, canvas.y, canvas.scale);
                }

            } 

        },
        updateMousePosition(x, y) {
            mouse.x = x;
            mouse.y = y;


            /*mouse.wheelIsDown = wheelIsDown;
            mouse.wheelIsRotatingDown = wheelIsRotatingDown;
            mouse.wheelIsRotatingUp = wheelIsRotatingUp;*/
        },
        updateMouseLeftIsDown(leftIsDown) {
            mouse.leftDownX = mouse.x;
            mouse.leftDownY = mouse.y;
            mouse.leftIsDown = leftIsDown;
        },
        updateMouseRightIsDown(rightIsDown) {
            mouse.rightDownX = mouse.x;
            mouse.rightDownY = mouse.y;
            mouse.rightIsDown = rightIsDown;
        }
    };

})();