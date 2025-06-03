(() => {
    function handleMouseDown(event) {
        const canvasRectangle = canvas.getBoundingClientRect();
        Rasterizer.updateMousePosition(Math.floor(event.clientX - canvasRectangle.left), Math.floor(event.clientY - canvasRectangle.top));

        switch (event.button) {
            case 0:
                Rasterizer.plotPoint();
                Rasterizer.render();
                render();
                break;
            case 2:
                Rasterizer.updateMouseLeftIsDown(true);
                break;
        }
    }

    function handleMouseMove(event) {
        const canvasRectangle = canvas.getBoundingClientRect();
        Rasterizer.updateMousePosition(Math.floor(event.clientX - canvasRectangle.left), Math.floor(event.clientY - canvasRectangle.top));
    }

    function handleMouseUp(event) {
        const canvasRectangle = canvas.getBoundingClientRect();
        Rasterizer.updateMousePosition(Math.floor(event.clientX - canvasRectangle.left), Math.floor(event.clientY - canvasRectangle.top));
        if (event.button === 2) animate = false;
        switch (event.button) {
            case 2:
                Rasterizer.updateMouseLeftIsDown(false);
                break;
        }
    }

    function handleResize(event) {
        const windowInnerWidth = event.target.innerWidth;
        const windowInnerHeight = event.target.innerHeight;
        const displayRasterWidth = Rasterizer.getDisplayRasterWidth();
        const displayRasterHeight = Rasterizer.getDisplayRasterHeight();

        // The canvas must never exceed the size of the window or the size of the display raster.
        const canvasWidth = windowInnerWidth < displayRasterWidth ? windowInnerWidth : displayRasterWidth;
        const canvasHeight = windowInnerHeight < displayRasterHeight ? windowInnerHeight : displayRasterHeight;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvasContext2D.imageSmoothingEnabled = false;

        canvas.style.left = Math.floor((windowInnerWidth - canvasWidth) * 0.5) + "px";
        canvas.style.top = Math.floor((windowInnerHeight - canvasHeight) * 0.5) + "px";

        Rasterizer.render();

        resetImageData();

        render();
    }

    function resetImageData() {
        displayView = new Uint8ClampedArray(Rasterizer.getDisplayRasterPixels().buffer, 0, Rasterizer.getDisplayRasterPixelCount() * 4);
        imageData = new ImageData(displayView, Rasterizer.getDisplayRasterWidth(), Rasterizer.getDisplayRasterHeight());
    }

    function render() {
        canvasContext2D.putImageData(imageData, 0, 0);
    }

    Rasterizer.initialize(200, 200, 10, 10, 2, 2);

    const canvas = document.createElement("canvas");
    const canvasContext2D = canvas.getContext("2d");
    canvasContext2D.imageSmoothingEnabled = false;

    let displayView;
    let imageData;

    resetImageData();

    document.body.appendChild(canvas);
    document.addEventListener("contextmenu", function (event) { event.preventDefault(); });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);
    window.dispatchEvent(new Event("resize"));

    render();

})();