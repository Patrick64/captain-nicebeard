// CopyRight (c) 2013 John Robinson - http://www.storminthecastle.com

var Goo = function(o) {

  var self = this;
  
    // Setup defaults
  self.type = "2d";
  self.animate = true;
  self.fullscreen = false;
  self.keysDown = {};
  self.userData = {};

  if (o) {
   for (var p in o) {
     if (!o.hasOwnProperty(p)) continue;
     self[p] = o[p];
   }
  }
  
  self.canvas = document.createElement("canvas");
  self.canvas.id = "goocanvas";
  if (self.canvas)
    self.ctx = self.canvas.getContext(self.type);

  if (!self.canvas || !self.ctx && self.onFailure) {
    self.onFailure();
    return;
  }
  
  self.canvas.width = self.width;
  self.canvas.height = self.height;

  
    Object.defineProperty(self, "width", {
      get: function() {
        return self.canvas.width;
      },
      set: function(v) {
        self.canvas.width = v;
      }
    });
    Object.defineProperty(self, "height", {
      get: function() {
        return self.canvas.height;
      },
      set: function(v) {
        self.canvas.height = v;
      }
    });
  

  if (self.fullscreen) {
    self.container = document.body;
    document.body.style.margin = '0px';
    document.body.style.padding = '0px';
    document.body.style.overflow = 'hidden';            

  }
  
  if (self.container) {
    self.container.appendChild(self.canvas);
  }
  
  // shim layer with setTimeout fallback
  var requestAnimFrame = (function () {
    var rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
    if (!rAF) {
      rAF = function (callback) {
        window.setTimeout(callback, 1000 / 30.0);
      };
    }
    return rAF;
  })();

  var getTick = Date.now?Date.now: function () {
      return new Date().getTime();
    }

          
  document.addEventListener("keydown", function(e) {
      self.keyCode = e.keyCode;
      self.key =  String.fromCharCode(self.keyCode);
      self.keysDown[self.keyCode] = true;
      if (self.onKeyDown) self.onKeyDown(self)
    }, false);
    
  document.addEventListener("keyup", function(e) {
      self.keyCode = e.keyCode;
      self.key =  String.fromCharCode(self.keyCode);
      delete self.keysDown[self.keyCode];
      if (self.onKeyUp) self.onKeyUp(self)
    }, false);

  document.addEventListener("keypress", function(e) {
      self.keyCode = e.keyCode;
      self.key =  String.fromCharCode(self.keyCode);
      if (self.onKeyPress) self.onKeyPress(self)
    }, false);
      
   var sizeCanvas = (function() {
    if (self.fullscreen) {
      // This performs better than listening for resize events
      var w = window.innerWidth;
      var h = window.innerHeight;
      if (self.canvas.width != w)
        self.canvas.width = w;
      if (self.canvas.height != h)
        self.canvas.height = h;
    }  
  });
  
  var fpsCounter = 0;
  var fpsStartTime = getTick();
  
  function update() {
    sizeCanvas();
    var tick = getTick();
    if (self.onDraw) 
      self.onDraw(self, tick);
    if (self.animate) {
      if (fpsCounter++ > 60) {
        self.fps = fpsCounter / (tick-fpsStartTime) * 1000;
        if (self.onFrameRate)
          self.onFrameRate(self);
        fpsCounter = 0;
        fpsStartTime = tick;
      }
      requestAnimFrame(update);
    }
  };
  requestAnimFrame(update);
};
