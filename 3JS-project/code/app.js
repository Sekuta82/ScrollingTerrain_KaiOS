var MODULE = (function () {
  var app = {};
  
  app.moveUp = false;
  app.moveDown = false;
  app.moveLeft = false;
  app.moveRight = false;

  // button input
  app.invertAxis = true;
  app.keyCallbackDown = {
    dUp: function() { app.invertAxis ? app.moveDown = true : app.moveUp = true; },
    dDown: function() { app.invertAxis ? app.moveUp = true : app.moveDown = true; },
    dLeft: function() { app.moveLeft = true; },
    dRight: function() { app.moveRight = true; }
  };
  app.keyCallbackUp = {
    dUp: function() { app.invertAxis ? app.moveDown = false : app.moveUp = false; },
    dDown: function() { app.invertAxis ? app.moveUp = false : app.moveDown = false; },
    dLeft: function() { app.moveLeft = false; },
    dRight: function() { app.moveRight = false; }
  };

  return app;
}());
