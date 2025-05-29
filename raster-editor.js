

const RasterEditor = (() => {

    const mouseController = Controller.createMouseController();

    const MAX_RASTER_WIDTH = 640;
    const MAX_RASTER_HEIGHT = 640;

    let canvasRaster; // Represents the editable image.
    let canvasPosition = Geometry.createPoint2D(32, 32);
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
        getMaxRasterWidth() { return MAX_RASTER_WIDTH; },
        getMaxRasterHeight() { return MAX_RASTER_HEIGHT; },
        getDisplayBuffer() { return displayRaster.pixels; },
        getDisplayBufferLength() { return displayRaster.pixelCount; },
        getDisplayBufferWidth() { return displayRaster.width; },
        getDisplayBufferHeight() { return displayRaster.height; },
        initialize(displayWidth, displayHeight, canvasX, canvasY, canvasWidth, canvasHeight) {
            canvasRaster = Rasterizer.createRaster(new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT), 0, 0);
            resizeRaster(canvasRaster, canvasWidth, canvasHeight);
            Rasterizer.fill(canvasRaster.pixels, canvasRaster.pixelCount, 0xff0000ff);
            Geometry.setPoint2D(canvasPosition, canvasX, canvasY);
            displayRaster = Rasterizer.createRaster(new Uint32Array(MAX_RASTER_WIDTH * MAX_RASTER_HEIGHT), 0, 0);
            resizeRaster(displayRaster, displayWidth, displayHeight);
            toolbarRaster = Rasterizer.createRaster(new Uint32Array(64 * 16), 64, 16);

        },
        plotPoint() {
            console.log(mouseController.x - canvasPosition.x, mouseController.y - canvasPosition.y);
            Rasterizer.fillPointClipped(canvasRaster.pixels, canvasRaster.width, canvasRaster.height, Math.floor(mouseController.x - canvasPosition.x), Math.floor(mouseController.y - canvasPosition.y), 0xffffffff);  
        },
        render() {
            Rasterizer.fill(displayRaster.pixels, displayRaster.pixelCount, 0x00000000);
            Rasterizer.copyPixelsClipped(canvasRaster.pixels, canvasRaster.width, canvasRaster.height, displayRaster.pixels, displayRaster.width, displayRaster.height, canvasPosition.x, canvasPosition.y);
        },
        resizeDisplayRaster(width, height) {
            resizeRaster(displayRaster, width, height);
        },
        update() {

            

        },
        updateMousePosition(x, y) {
            mouseController.x = x;
            mouseController.y = y;


            /*mouseController.wheelIsDown = wheelIsDown;
            mouseController.wheelIsRotatingDown = wheelIsRotatingDown;
            mouseController.wheelIsRotatingUp = wheelIsRotatingUp;*/
        },
        updateMouseLeftIsDown(leftIsDown) {
            mouseController.leftIsDown = leftIsDown;
        },
        updateMouseRightIsDown(rightIsDown) {
            mouseController.rightIsDown = rightIsDown;
        }
    };

})();