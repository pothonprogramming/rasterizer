const Input = (() => {

    return {
        // Creates a mouse input object, which is used to track the state of the mouse.
        createMouseInput(x, y) {
            return { x:0, y:0, leftIsDown: false, rightIsDown: false, wheelIsDown: false, wheelIsRotatingDown: false, wheelIsRotatingUp: false }
        }
    };

})();