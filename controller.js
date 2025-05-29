const Controller = (() => {

    function createMouseController(x, y) {
        return { x:0, y:0, leftIsDown: false, rightIsDown: false, wheelIsDown: false, wheelIsRotatingDown: false, wheelIsRotatingUp: false }
    }

    function createTouchController() {

    }

    return {
        createMouseController
    };

})();