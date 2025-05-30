

const Rasterizer = (() => {

    const mouseInput = Input.createMouseInput();

    const MAX_RASTER_WIDTH = 640;
    const MAX_RASTER_HEIGHT = 640;

    let canvasRaster; // Represents the editable image.
    let canvasPosition = Geometry.createPoint2D(32, 32);
    let canvasScale = 10;
    let displayRaster; // Represents everything that will be rendered.
    let toolbarRaster; // Represents the toolbar.
    let toolbarPosition = Geometry.createPoint2D(32, 16);

    function resizeRaster(raster, width, height) {
        if (width > MAX_RASTER_WIDTH) width = MAX_RASTER_WIDTH;
        if (height > MAX_RASTER_HEIGHT) height = MAX_RASTER_HEIGHT;
        raster.width = width;
        raster.height = height;
        raster.pixelCount = width * height;
    }

    return {
        getDisplayRasterPixels() { return displayRaster.pixels; },
        getDisplayRasterPixelCount() { return displayRaster.pixelCount; },
        getDisplayRasterWidth() { return displayRaster.width; },
        getDisplayRasterHeight() { return displayRaster.height; },
        initialize(displayWidth, displayHeight, canvasX, canvasY, canvasWidth, canvasHeight) {
            canvasRaster = Raster.createRaster(new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT), 0, 0);
            resizeRaster(canvasRaster, canvasWidth, canvasHeight);
            Raster.fill(canvasRaster.pixels, canvasRaster.pixelCount, 0xff0000ff);
            Geometry.setPoint2D(canvasPosition, canvasX, canvasY);
            displayRaster = Raster.createRaster(new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT), 0, 0);
            resizeRaster(displayRaster, displayWidth, displayHeight);
            toolbarRaster = Raster.createRaster(new Uint32Array(64 * 16), 64, 16);
        },
        plotPoint() {
            console.log(BitMath.floor((mouseInput.x - canvasPosition.x) / canvasScale), BitMath.floor((mouseInput.y - canvasPosition.y) / canvasScale));
            Raster.fillPointClipped(canvasRaster.pixels, canvasRaster.width, canvasRaster.height, BitMath.floor((mouseInput.x - canvasPosition.x) / canvasScale), BitMath.floor((mouseInput.y - canvasPosition.y) / canvasScale), 0xffffffff);  
        },
        render() {
            Raster.fill(displayRaster.pixels, displayRaster.pixelCount, 0x00000000);
            Raster.copyPixelsClipped(canvasRaster.pixels, canvasRaster.width, canvasRaster.height, displayRaster.pixels, displayRaster.width, displayRaster.height, canvasPosition.x + 20, canvasPosition.y + 20);
            Raster.copyPixelsScaled(canvasRaster.pixels, canvasRaster.width, canvasRaster.height, displayRaster.pixels, displayRaster.width, canvasPosition.x, canvasPosition.y, canvasScale);
        },
        resizeDisplayRaster(width, height) {
            resizeRaster(displayRaster, width, height);
        },
        update() {

            

        },
        updateMousePosition(x, y) {
            mouseInput.x = x;
            mouseInput.y = y;


            /*mouseInput.wheelIsDown = wheelIsDown;
            mouseInput.wheelIsRotatingDown = wheelIsRotatingDown;
            mouseInput.wheelIsRotatingUp = wheelIsRotatingUp;*/
        },
        updateMouseLeftIsDown(leftIsDown) {
            mouseInput.leftIsDown = leftIsDown;
        },
        updateMouseRightIsDown(rightIsDown) {
            mouseInput.rightIsDown = rightIsDown;
        }
    };

})();