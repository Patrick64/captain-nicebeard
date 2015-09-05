var io = require('sandbox-io');
var noise = require('./js/class/perlin.js');

var worlds = [];
var nextTankId = 1;
var nextTokenId = 1;
var nextPlayerId = 1;
var players = [];
debugger;


for (var i=0; i<10; i++) worlds.push(getNewWorld(i));

function getNewWorld(i) {
  return (new World(i));
  //return {isForward:true,worldDuration:2*60*1000,events:[],players:[]};
}


io.on('connection', function(socket) {
  // See the generated log in the server console:
  log.debug('New connection', socket.id);
  // Send a message to this player:
  
  
  var player = new Player();
  player.newGame(socket);
  socket.on('new-game', function(data) {
    player.isForward = true; //!player.isForward;
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
//	this.lastTank = null;
  this.level = 0;
}

Player.prototype.newGame = function(socket) {
  this.world = worlds[this.level];
  if (this.world.tanks.length>10) {
    this.world.deleteWorld();
    worlds[this.level]=getNewWorld(this.level);
	this.world = worlds[this.level];
  }
  this.world.addTokens(10,10);
  this.tank = new Tank(0,this.isForward);
  

  var game = {player:this.tank.toPlainObject(),
    world:this.world.toPlainObject(this.isForward),
	lastTank:this.lastTank
  };

  this.world.addTank(this.tank);
  
  //socket.on('disconnect', this.onExit.bind(this));
  
  socket.emit("receive-game",game);
  this.lastTank = this.tank;

}

Player.prototype.receiveGameState = function (data) {
    //this.world.addEvents(data);
    debugger;
    if (data.levelComplete) this.level++;
    this.tank.addEvents(data.eventQueues.player);
    //this.events.push.apply(this.events,data.player);
    this.world.tokens.forEach(function(t) {
      if (data.eventQueues.tokens[t.tokenId]) {
        var events = data.eventQueues.tokens[t.tokenId];
        t.addEvents(events);
      }
    });
    this.world.floaters.forEach(function(t) {
      if (data.eventQueues.floaters[t.id]) {
        var events = data.eventQueues.floaters[t.id];
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
  
};

function Token(x,y) {
  this.xpos = x;
  this.ypos = y;
  this.tokenId = nextTokenId;
  this.events = [];
  nextTokenId++;
}
Token.prototype.toPlainObject = function() {
  return {
    xpos:this.xpos,
    ypos:this.ypos,
    tokenId:this.tokenId,
    id:this.tokenId,
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

function World(level) {
 
 this.worldDuration=1*60*1000;
 this.height = 2000 + Math.floor(Math.random()*2000);
 this.width = 3000  + Math.floor(Math.random()*2000);
 this.events=[];
 this.tanks=[];
 this.tokens = [];
 this.floaters = [];
 this.landscapeSeed = Math.floor(Math.random()*10000);
 this.level = level;
}

World.prototype.addTokens = function(numTokens,numFloaters) {
    noise.seed(this.landscapeSeed);
    var tokensCount=0, floatersCount = 0;
    while (tokensCount<numTokens || floatersCount < numFloaters) {
      var x= Math.floor(Math.random()*this.width);
      var y= Math.floor(Math.random()*this.height);
      var value = Math.abs(noise.perlin2(x / (600), y / (600)));
      value *= 256;
      if (value>70 && value<80 && tokensCount<numTokens) {
        this.tokens.push(new Token(x,y));
        tokensCount++;
      }
      if (value<40 && floatersCount < numFloaters) {
        this.floaters.push(new Token(x,y));
        floatersCount++;
      }
    }
}

World.prototype.deleteWorld = function() {
  this.tanks=[]; this.tokens=[];
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
  
  var f= {
    level:this.level,
    isForward:isForward,
    worldDuration:this.worldDuration,
    height:this.height, 
    width:this.width,
    landscapeSeed: this.landscapeSeed,
    //events:events,
    players:this.tanks.map(function(p) {
      return p.toPlainObject();
    }),
    tokens: this.tokens.map(function(t) {
      return t.toPlainObject();
    }),
    floaters: this.floaters.map(function(t) {
      return t.toPlainObject();
    })
  };
  return f;
}
