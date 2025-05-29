(() => {

    const MAX_RASTER_WIDTH = RasterEditor.getMaxRasterWidth();
    const MAX_RASTER_HEIGHT = RasterEditor.getMaxRasterHeight();

    function handleMouseDown(event) {
        const canvasRectangle = canvas.getBoundingClientRect();
        RasterEditor.updateMousePosition(event.clientX - canvasRectangle.left, event.clientY - canvasRectangle.top);

        switch (event.button) {
            case 0:
                RasterEditor.plotPoint();
                RasterEditor.render();
                render();
                break;
            case 2:
                RasterEditor.updateMouseLeftIsDown(true);
                break;
        }
    }

    function handleMouseMove(event) {
        const canvasRectangle = canvas.getBoundingClientRect();
        RasterEditor.updateMousePosition(event.clientX - canvasRectangle.left, event.clientY - canvasRectangle.top);
    }

    function handleMouseUp(event) {
        const canvasRectangle = canvas.getBoundingClientRect();
        RasterEditor.updateMousePosition(event.clientX - canvasRectangle.left, event.clientY - canvasRectangle.top);
        if (event.button === 2) animate = false;
        switch (event.button) {
            case 2:
                RasterEditor.updateMouseLeftIsDown(false);
                break;
        }
    }

    function handleResize(event) {
        let width = event.target.innerWidth;
        let height = event.target.innerHeight;

        if (width > MAX_RASTER_WIDTH) width = MAX_RASTER_WIDTH;
        if (height > MAX_RASTER_HEIGHT) height = MAX_RASTER_HEIGHT; 

        canvas.width = width;
        canvas.height = height;
        canvasContext2D.imageSmoothingEnabled = false;

        RasterEditor.resizeDisplayRaster(width, height);

        RasterEditor.render();

        displayView = new Uint8ClampedArray(RasterEditor.getDisplayBuffer().buffer, 0, RasterEditor.getDisplayBufferLength() * 4);
        imageData = new ImageData(displayView, RasterEditor.getDisplayBufferWidth(), RasterEditor.getDisplayBufferHeight());

        render();
    }

    function render() {
        canvasContext2D.putImageData(imageData, 0, 0);
    }

    RasterEditor.initialize(window.innerWidth, window.innerHeight, 32, 32, 100, 100);

    const canvas = document.createElement("canvas");
    const canvasContext2D = canvas.getContext("2d");
    canvasContext2D.imageSmoothingEnabled = false;

    let displayView = new Uint8ClampedArray(RasterEditor.getDisplayBuffer().buffer, 0, RasterEditor.getDisplayBufferLength() * 4);
    let imageData = new ImageData(displayView, RasterEditor.getDisplayBufferWidth(), RasterEditor.getDisplayBufferHeight());

    document.body.appendChild(canvas);
    document.addEventListener("contextmenu", function (event) { event.preventDefault(); });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);
    window.dispatchEvent(new Event("resize"));

    render();

})();