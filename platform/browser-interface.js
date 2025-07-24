// This is the platform specific code or "platform layer". It connects the core application logic to the platform it runs on.
// The platform layer is meant to do things like get device input, render graphics, save/load data, etc.
// Keep this code as minimal as possible. Anything that doesn't require platform/language specific code should be handled by the application layer.

// The core application layer will be exposed through the global Rasterizer object.
(() => {
    function handleMouseDownOrMouseUp(event) {
        Rasterizer.updateMousePosition(Math.floor(event.clientX - canvasRectangle.left), Math.floor(event.clientY - canvasRectangle.top));
        const mouseDown = event.type === "mousedown";
        switch (event.button) {
            case 0:
                Rasterizer.updateMouseLeftIsDown(mouseDown);
                break;
            case 2:
                Rasterizer.updateMouseRightIsDown(mouseDown);
                break;
        }
    }

    function handleMouseMove(event) {
        Rasterizer.updateMousePosition(Math.floor(event.clientX - canvasRectangle.left), Math.floor(event.clientY - canvasRectangle.top));
    }

    function handleAnimationFrameRequest(timeStamp) {
        MESSAGE = "";
        if (Rasterizer.update(timeStamp)) if (Rasterizer.render()) render();

        animmationFrameRequestId = window.requestAnimationFrame(handleAnimationFrameRequest);
        //window.cancelAnimationFrame(animmationFrameRequestId);
        
        output.innerText = MESSAGE;
    }

    function handleWindowResize(event) {
        const windowInnerWidth = event.target.innerWidth;
        const windowInnerHeight = event.target.innerHeight;

        const maximumRasterHeight = Rasterizer.getMaximumRasterHeight();
        const maximumRasterWidth = Rasterizer.getMaximumRasterWidth();

        // The canvas must never exceed the size of the window or the size of the display raster.
        const canvasWidth = windowInnerWidth < maximumRasterWidth ? windowInnerWidth : maximumRasterWidth;
        const canvasHeight = windowInnerHeight < maximumRasterHeight ? windowInnerHeight : maximumRasterHeight;

        Rasterizer.resizeDisplay(canvasWidth, canvasHeight);
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvasContext2D.imageSmoothingEnabled = false;

        canvas.style.left = Math.floor((windowInnerWidth - canvasWidth) * 0.5) + "px";
        canvas.style.top = Math.floor((windowInnerHeight - canvasHeight) * 0.5) + "px";

        canvasRectangle = canvas.getBoundingClientRect();

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

    /////////////////
    // CANVAS DATA //
    /////////////////

    const canvas = document.createElement("canvas");
    const canvasContext2D = canvas.getContext("2d");
    canvasContext2D.imageSmoothingEnabled = false;

    let canvasRectangle;
    let displayView;
    let imageData;

    /***************/
    /* TEST OUTPUT */
    /***************/
    // * Delete this stuff when it's no longer needed.
    const output = document.createElement("p");
    output.style.position = "fixed";
    output.style.color = "#ffffff";
    output.style.fontSize = "1.5em";
    
    ///////////////
    // LOOP DATA //
    ///////////////
    let animationFrameRequestId;
    
    resetImageData();

    document.body.appendChild(canvas);
    document.body.appendChild(output);
    document.addEventListener("contextmenu", function (event) { event.preventDefault(); });
    window.addEventListener("mousedown", handleMouseDownOrMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseDownOrMouseUp);
    window.addEventListener("resize", handleWindowResize);
    window.dispatchEvent(new Event("resize"));

    animationFrameRequestId = window.requestAnimationFrame(handleAnimationFrameRequest);

    render();

})();