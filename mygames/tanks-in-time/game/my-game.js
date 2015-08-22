var io = require('sandbox-io');


var worlds = [];
var nextTankId = 1;
var nextTokenId = 1;
var nextPlayerId = 1;
var players = [];


worlds.push(getNewWorld());

function getNewWorld() {
  return (new World());
  //return {isForward:true,worldDuration:2*60*1000,events:[],players:[]};
}


io.on('connection', function(socket) {
  // See the generated log in the server console:
  log.debug('New connection', socket.id);
  // Send a message to this player:
  
  
  var player = new Player();
  player.newGame(socket);
  
  
});



function Player() {
  this.playerId = nextPlayerId;
  nextPlayerId++;
  this.world =  worlds[0];
  this.isForward = true;
}

Player.prototype.newGame = function(socket) {
  this.tank = new Tank(0,this.isForward);
  this.world.addTank(this.tank);

  var game = {player:this.tank.toPlainObject(),
    world:this.world.toPlainObject(this.isForward)
  };
  //socket.on('disconnect', this.onExit.bind(this));
  debugger;
  socket.emit("receive-game",game);

  socket.on('tank-state', function(data) {
    //var events = JSON.parse(data);

    this.world.addEvents(data);
    console.log("Received " + data.player.length + " rows");
  }.bind(this));

}

function Tank(worldIndex,isForward) {
  this.tankId = nextTankId;
  nextTankId++;
  this.worldIndex = worldIndex;
  
  this.isForward = isForward;

  var world = worlds[this.worldIndex];
  
  
}

Tank.prototype.toPlainObject = function() {
  return {tankId:this.tankId,isForward:this.isForward};
}

function Token(maxX,maxY) {
  this.xpos = Math.floor(Math.random()*maxX);
  this.ypos = Math.floor(Math.random()*maxY);
  this.tokenId = nextTokenId;
  this.events = [];
  nextTokenId++;
}
Token.prototype.toPlainObject = function() {
  return {
    xpos:this.xpos,
    ypos:this.ypos,
    tokenId:this.tokenId,
    events:this.getEvents()
  };
}

Token.prototype.addEvents = function(events) {
  this.events.push.apply(this.events,events);
}

Token.prototype.getEvents = function() {
  // var events = this.events.slice();
  // events.sort(function(a,b) {
  //     if (isForward)
  //       return a.startTime - b.startTime;
  //     else
  //       return b.startTime - a.startTime;
  // });
  return this.events;
}

function World() {
 
 this.worldDuration=1*10*1000;
 this.events=[];
 this.tanks=[];
 this.tokens = [];
 for (var i=0;i<10;i++) {
  this.tokens.push(new Token(800,600));
 }
}

World.prototype.addTank = function(tank) {
  this.tanks.push(tank);
}

World.prototype.addEvents = function(data) {
  this.events.push.apply(this.events,data.player);
  this.tokens.forEach(function(t) {
    if (data.tokens[t.tokenId]) {
      var events = data.tokens[t.tokenId];
      t.addEvents(events);
    }
  });
}

World.prototype.toPlainObject = function(isForward) {
  // sort events in correct order
  debugger;  
  var events = this.events.slice();
  debugger;
  if (isForward) {
    // forward sort by start time
    events.sort(function(a,b) { 
        if (a.startTime < b.startTime) return -1; else return 1;
        //return (a.startTime - b.startTime);
    });
  } else {
    // reverse sort by end time
    events.sort(function(a,b) { 
        
        if (a.endTime > b.endTime) 
          return -1; 
        else if (a.endTime < b.endTime)
          return 1;
        else if (a.startTime > b.startTime )
          return -1;
        else 
          return 1;
        //return (b.endTime - a.endTime);
    });
  }
  debugger;
  var f= {
    isForward:isForward,
    worldDuration:this.worldDuration,
    events:events,
    players:this.tanks.map(function(p) {
      return p.toPlainObject();
    }),
    tokens: this.tokens.map(function(t) {
      return t.toPlainObject();
    })
  };
  return f;
}
