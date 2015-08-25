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
  socket.on('new-game', function(data) {
    player.isForward = !player.isForward;
    player.newGame(socket);
  });

  socket.on('tank-state', function(data) {
    //var events = JSON.parse(data);
    player.receiveGameState(data);
  
  });
  
});



function Player() {
  this.playerId = nextPlayerId;
  nextPlayerId++;
  this.world =  worlds[0];
  this.isForward = true;
  this.events = [];
}

Player.prototype.newGame = function(socket) {
  this.tank = new Tank(0,this.isForward);
  

  var game = {player:this.tank.toPlainObject(),
    world:this.world.toPlainObject(this.isForward)
  };

  this.world.addTank(this.tank);
  
  //socket.on('disconnect', this.onExit.bind(this));
  debugger;
  socket.emit("receive-game",game);


}

Player.prototype.receiveGameState = function (data) {
    //this.world.addEvents(data);
    
    this.tank.addEvents(data.player);
    //this.events.push.apply(this.events,data.player);
    this.world.tokens.forEach(function(t) {
      if (data.tokens[t.tokenId]) {
        var events = data.tokens[t.tokenId];
        t.addEvents(events);
      }
    });
    console.log("Received " + JSON.stringify(data) + " ");
}


function Tank(worldIndex,isForward) {
  this.tankId = nextTankId;
  nextTankId++;
  this.worldIndex = worldIndex;
  
  this.isForward = isForward;

  var world = worlds[this.worldIndex];
  this.events = {movements:[],gun:[],state:[]};
  
}

Tank.prototype.toPlainObject = function() {
  return {tankId:this.tankId,
    isForward:this.isForward,
    events:this.events
  };
}


Tank.prototype.addEvents = function (events) {
  this.events.movements.push.apply(this.events.movements,events.movements);
  this.events.gun.push.apply(this.events.gun,events.gun);
  this.events.state.push.apply(this.events.state,events.state);
  debugger;
};

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
 this.height = 600;
 this.width = 800;
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
  /*
  var events = this.events.slice();
  
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
  */
  debugger;
  var f= {
    isForward:isForward,
    worldDuration:this.worldDuration,
    height:this.height, 
    width:this.width,

    //events:events,
    players:this.tanks.map(function(p) {
      return p.toPlainObject();
    }),
    tokens: this.tokens.map(function(t) {
      return t.toPlainObject();
    })
  };
  return f;
}
