/****************/
/* THINGS TO DO */
/****************/
// * Fix the naming convention to use camelCase with _ separators to indicate ownership.
//// For example: var canvasRaster = { pixelCount }; var canvasRaster_pixelCount = canvasRaster.pixelCount;
// NOTE //
// * Keep code completely platform agnostic to maximize portability.
//// Platform specific code should be written in a separate file.
//// Do not use non-portable techniques or libraries because logic is meant to be rewritten to C.

//////////////////////
// ABOUT RASTERIZER //
//////////////////////
// * This application is shaping up to be a showcase for the Raster utility.
//// The functions in that utility allow you to rasterize various shapes and bitmap images in software.
//// Rendering in software is slower than on a GPU, but it gives you full control over rendering without introducing dependencies.
//// If your application is not graphics intensive, rendering in software is a good way to make it more portable/cross platform.
const Rasterizer = (() => {

    const MAX_RASTER_WIDTH = 768;
    const MAX_RASTER_HEIGHT = 768;

    ////////////////
    // INITIALIZE //
    ////////////////
    // Because all application logic is handled here, the application will initialize as soon as this code runs.
    // Calling an initialize method from the platform layer is not necessary, and adds bloat to the platform layer.

    const mouse = Input.createMouseInput();

    const canvas = {
        pixels: new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT), // Initialize array to max size
        pixelCount: 0,
        x: 20,
        y: 20,
        width: 0,
        height: 0,
        scale: 7
    };

    const display = {
        pixels: new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT),
        pixelCount: 0,
        width: 0,
        height: 0
    };

    const toolbar = {
        pixels: new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT),
        pixelCount: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scale: 1,
        selectedColor: 0xff000000
    };

    let angle = 0;
    const coordinates0 = [60, 60, 90, 60, 75, 90, 75, 75];
    const coordinates1 = [60, 20, 90, 20, 75, 50, 75, 35];
    const coordinates2 = [10, 60, 40, 60, 25, 90, 25, 75];
    const coordinates3 = [10, 20, 40, 20, 25, 50, 25, 35];

    const somePoly = [40, 40, 60, 40, 60, 60, 40, 60];
    let somePolyRotated = [];

    let p0 = [];
    let p1 = [];
    let p2 = [];
    let p3 = [];

    resizeRaster(canvas, 100, 100);
    resizeRaster(display, 768, 768);
    resizeRaster(toolbar, 320, 160);

    // You could do this in c by passing &width and &height instead of raster
    // This is extremely powerful because you can make general purpose functions that handle struct members of a certain type regardless of the struct type.
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

    return {
        getDisplayRasterPixels() { return display.pixels; },
        getDisplayRasterPixelCount() { return display.pixelCount; },
        getDisplayRasterWidth() { return display.width; },
        getDisplayRasterHeight() { return display.height; },
        render() {
            MESSAGE = `*** mouse ***\nscreenX: ${mouse.x}, screenY: ${mouse.y}\n`;
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

            const mouse_x = BitMath.floor((mouse.x - canvas.x) / canvas.scale);
            const mouse_y = BitMath.floor((mouse.y - canvas.y) / canvas.scale);

            TESTDATA.x = mouse_x;
            TESTDATA.y = mouse_y;

            MESSAGE += `canvas_x: ${mouse_x}, canvas_y: ${mouse_y}\n`;

            Raster.fill(canvas.pixels, canvas.pixelCount, 0xffffffff);
            //Raster.drawLineSegment(canvas.pixels, canvas.width, 50, 50, BitMath.floor((mouse.x - canvas.x)/canvas.scale), BitMath.floor((mouse.y - canvas.y) / canvas.scale), 0xffffffff);
            //Raster.drawLineSegmentClipped(canvas.pixels, canvas.width, canvas.height, BitMath.floor((mouse.x - canvas.x)/canvas.scale), BitMath.floor((mouse.y - canvas.y) / canvas.scale), 50, 50, 0xffffffff);
            /*
                        // Top
                        Raster.fillPixel(canvas.pixels, canvas.width, 40, 10, 0xff808080);
                        Raster.fillPixel(canvas.pixels, canvas.width, 60, 10, 0xff808080);
                        Raster.fillClippedTriangle(canvas.pixels, canvas.width, 1, 1, canvas.width - 1, canvas.height - 1, 40, 10, 60, 10, mouse_x, mouse_y - 1, 0xff00ff00);
            
                        // Right
                        Raster.fillPixel(canvas.pixels, canvas.width, 50, 60, 0xff808080);
                        Raster.fillPixel(canvas.pixels, canvas.width, 50, 40, 0xff808080);
                        Raster.fillClippedTriangle(canvas.pixels, canvas.width, 1, 1, canvas.width - 1, canvas.height - 1, 50, 60, mouse_x + 1, mouse_y, 50, 40, 0xff00c000);
            
                        // Bottom
                        Raster.fillPixel(canvas.pixels, canvas.width, 40, 90, 0xff808080);
                        Raster.fillPixel(canvas.pixels, canvas.width, 60, 90, 0xff808080);
                        Raster.fillClippedTriangle(canvas.pixels, canvas.width, 1, 1, canvas.width - 1, canvas.height - 1, 40, 90, mouse_x, mouse_y + 1, 60, 90, 0xff008000);
            
                        // Left
                        Raster.fillPixel(canvas.pixels, canvas.width, 10, 60, 0xff808080);
                        Raster.fillPixel(canvas.pixels, canvas.width, 10, 40, 0xff808080);
                        Raster.fillClippedTriangle(canvas.pixels, canvas.width, 1, 1, canvas.width - 1, canvas.height - 1, 10, 60, 10, 40, mouse_x - 1, mouse_y, 0xff004000);
            */
            //drawPencilIcon(canvas.pixels, canvas.width, 5, 5, 20, 0x80ff0000, 0x8000ff00, 0x8000ffff);

            Raster.fillClippedCircle(canvas.pixels, canvas.width, 80, 5, 99, 20, 90, 10, angle * 10, 0xff00ff00);
            Raster.fillPixel(canvas.pixels, canvas.width, 90, 10, 0xffffffff);

            Raster.fillTransparentPixel(canvas.pixels, canvas.width, 1, 1, 0x80ffffff);
            Raster.fillTransparentPixel(canvas.pixels, canvas.width, 1, 1, 0x80ffffff);


            Geometry.rotate2DCoordinatesAroundCenter(coordinates0, p0, 8, angle);
            Geometry.rotate2DCoordinatesAroundCenter(coordinates1, p1, 8, angle);
            Geometry.rotate2DCoordinatesAroundCenter(coordinates2, p2, 8, angle);
            Geometry.rotate2DCoordinatesAroundCenter(coordinates3, p3, 8, angle);
            if (mouse.rightIsDown) {
                angle += 0.003;
                if (angle > PureMath.PI2) angle -= PureMath.PI2;
            }

            //console.log(p0)

            Raster.fillTransparentMeshTriangle(canvas.pixels, canvas.width, p0[0], p0[1], p0[2], p0[3], p0[6], p0[7], 0, 1, 1, 0x80ff0000);
            Raster.fillTransparentMeshTriangle(canvas.pixels, canvas.width, p0[2], p0[3], p0[4], p0[5], p0[6], p0[7], 0, 1, 1, 0x8000ff00);
            Raster.fillTransparentMeshTriangle(canvas.pixels, canvas.width, p0[4], p0[5], p0[0], p0[1], p0[6], p0[7], 0, 1, 1, 0x800000ff);
            if (mouse.leftIsDown) {
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p0[0]), BitMath.floor(p0[1]), 0xff0000ff);
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p0[2]), BitMath.floor(p0[3]), 0xff0000ff);
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p0[4]), BitMath.floor(p0[5]), 0xff0000ff);
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p0[6]), BitMath.floor(p0[7]), 0xff0000ff);
            }

            Raster.fillTransparentTriangle(canvas.pixels, canvas.width, p1[0], p1[1], p1[2], p1[3], p1[6], p1[7], 0x80ff0000);
            Raster.fillTransparentTriangle(canvas.pixels, canvas.width, p1[2], p1[3], p1[4], p1[5], p1[6], p1[7], 0x8000ff00);
            Raster.fillTransparentTriangle(canvas.pixels, canvas.width, p1[4], p1[5], p1[0], p1[1], p1[6], p1[7], 0x800000ff);
            if (mouse.leftIsDown) {
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p1[0]), BitMath.floor(p1[1]), 0xff0000ff);
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p1[2]), BitMath.floor(p1[3]), 0xff0000ff);
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p1[4]), BitMath.floor(p1[5]), 0xff0000ff);
                Raster.fillPixel(canvas.pixels, canvas.width, BitMath.floor(p1[6]), BitMath.floor(p1[7]), 0xff0000ff);
            }
            for (let i = 0; i < 8; i++) {
                p2[i] = PureMath.round(p2[i]);
                p3[i] = PureMath.round(p3[i]);
            }
            // Rounded coordinates
            Raster.fillTransparentMeshTriangle(canvas.pixels, canvas.width, p2[0], p2[1], p2[2], p2[3], p2[6], p2[7], 0, 1, 1, 0x80ff0000);
            Raster.fillTransparentMeshTriangle(canvas.pixels, canvas.width, p2[2], p2[3], p2[4], p2[5], p2[6], p2[7], 0, 1, 1, 0x8000ff00);
            Raster.fillTransparentMeshTriangle(canvas.pixels, canvas.width, p2[4], p2[5], p2[0], p2[1], p2[6], p2[7], 0, 1, 1, 0x800000ff);

            Raster.fillTransparentTriangle(canvas.pixels, canvas.width, p3[0], p3[1], p3[2], p3[3], p3[6], p3[7], 0x80ff0000);
            Raster.fillTransparentTriangle(canvas.pixels, canvas.width, p3[2], p3[3], p3[4], p3[5], p3[6], p3[7], 0x8000ff00);
            Raster.fillTransparentTriangle(canvas.pixels, canvas.width, p3[4], p3[5], p3[0], p3[1], p3[6], p3[7], 0x800000ff);

            Geometry.rotate2DCoordinatesAroundCenter(somePoly, somePolyRotated, 8, angle);
            Raster.fillConvexPolygon(canvas.pixels, canvas.width, somePolyRotated, 8, 0xff00ff00);
            if (mouse.leftIsDown) {
                Raster.fillTransparentPixel(canvas.pixels, canvas.width, PureMath.floor(somePolyRotated[0]), PureMath.floor(somePolyRotated[1]), 0x80ffffff);
                Raster.fillTransparentPixel(canvas.pixels, canvas.width, PureMath.floor(somePolyRotated[2]), PureMath.floor(somePolyRotated[3]), 0x80ffffff);
                Raster.fillTransparentPixel(canvas.pixels, canvas.width, PureMath.floor(somePolyRotated[4]), PureMath.floor(somePolyRotated[5]), 0x80ffffff);
                Raster.fillTransparentPixel(canvas.pixels, canvas.width, PureMath.floor(somePolyRotated[6]), PureMath.floor(somePolyRotated[7]), 0x40ffffff);
            }
            // Mouse crosshair
            Raster.fillPixel(canvas.pixels, canvas.width, mouse_x, mouse_y - 1, 0xffff0000);
            Raster.fillPixel(canvas.pixels, canvas.width, mouse_x + 1, mouse_y, 0xffff0000);
            Raster.fillPixel(canvas.pixels, canvas.width, mouse_x, mouse_y + 1, 0xffff0000);
            Raster.fillPixel(canvas.pixels, canvas.width, mouse_x - 1, mouse_y, 0xffff0000);

            //Raster.fillAxisAlignedRectangle(canvas.pixels, canvas.width, 20 + angle * 10, 20, 8.1, 8, 0xffff0000);
            Raster.fillClippedAxisAlignedRectangle(canvas.pixels, canvas.width, 30, 20, 40, 30, 20 + angle * 10, 20, 8.1, 8, 0xffff0000);
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