const Input = (() => {

    return {
        // Creates a mouse input object, which is used to track the state of the mouse.
        createMouseInput(x, y) {
            return {
                leftDownX: 0, leftDownY: 0, leftIsDown: false,
                rightDownX: 0, rightDownY: 0, rightIsDown: false,
                wheelDownX: 0, wheelDownY: 0, wheelIsDown: false, wheelIsRotatingDown: false, wheelIsRotatingUp: false,
                x: 0, y: 0
            };
        }
    };

})();