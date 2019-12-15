var MODULE = (function () {
    var app = {};

    app.moveUp = false;
    app.moveDown = false;
    app.moveLeft = false;
    app.moveRight = false;

    //input mapping
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyup);

    function handleKeydown(e) {
        switch (e.key) {
            case 'ArrowUp':
            case '2': /* num pad navigation */
                keyCallbackDown.dUp();
                break;
            case 'ArrowDown':
            case '8': /* num pad navigation */
                keyCallbackDown.dDown();
                break;
            case 'ArrowLeft':
            case '4': /* num pad navigation */
                keyCallbackDown.dLeft();
                break;
            case 'ArrowRight':
            case '6': /* num pad navigation */
                keyCallbackDown.dRight();
                break;
        }
    }
    function handleKeyup(e) {
        switch (e.key) {
            case 'ArrowUp':
            case '2': /* num pad navigation */
                keyCallbackUp.dUp();
                break;
            case 'ArrowDown':
            case '8': /* num pad navigation */
                keyCallbackUp.dDown();
                break;
            case 'ArrowLeft':
            case '4': /* num pad navigation */
                keyCallbackUp.dLeft();
                break;
            case 'ArrowRight':
            case '6': /* num pad navigation */
                keyCallbackUp.dRight();
                break;
        }
    }

    // button input
    app.invertAxis = true;
    var keyCallbackDown = {
        dUp: function () { app.invertAxis ? app.moveDown = true : app.moveUp = true; },
        dDown: function () { app.invertAxis ? app.moveUp = true : app.moveDown = true; },
        dLeft: function () { app.moveLeft = true; },
        dRight: function () { app.moveRight = true; }
    };
    var keyCallbackUp = {
        dUp: function () { app.invertAxis ? app.moveDown = false : app.moveUp = false; },
        dDown: function () { app.invertAxis ? app.moveUp = false : app.moveDown = false; },
        dLeft: function () { app.moveLeft = false; },
        dRight: function () { app.moveRight = false; }
    };

    return app;
}())