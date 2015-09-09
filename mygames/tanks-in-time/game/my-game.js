var io = require('sandbox-io');
var noise = require('./js/perlin.js');

var worlds = [];
var nextTankId = 1;
var nextTokenId = 1;
var nextPlayerId = 1;
var players = [];
var maxPlayersPerLevel = 20;


function getNewWorld(i) {
  var w = new World(i);
  w.addTokens(5, 15 );
  return w;

}

function startServer() {

  for (var i = 0; i <= 6; i++) worlds.push(getNewWorld(i));

  io.on('connection', function(socket) {
    // See the generated log in the server console:
    log.debug('New connection', socket.id);
    // Send a message to this player:


    var player = new Player();
    player.newGame(socket);
    socket.on('new-game', function(data) {
      player.newGame(socket);
    });

    socket.on('tank-state', function(data,fn) {
      //var events = JSON.parse(data);
      player.receiveGameState(data);
      fn(true);
    });
    socket.on('disconnect', function(){
      player.tank=null;
      player=null;
    });

  });

}


function Player() {
  this.playerId = nextPlayerId;
  nextPlayerId++;
  this.level = 0;
  //this.world = worlds[this.level];
  this.events = [];
  //	this.lastTank = null;
  this.landscapeChanged = true;
  this.playerName = "";
}

Player.prototype.newGame = function(socket) {
  var world = worlds[this.level];
  if (world.tanks.length > maxPlayersPerLevel ) {
    world.deleteWorld();
    worlds[this.level] = getNewWorld(this.level);
    world = worlds[this.level];
    this.landscapeChanged = true;
  }

  this.tank = new Tank(0, this);


  var game = {
    player: this.tank.toPlainObject(),
    world: world.toPlainObject(),
    // lastTank: this.lastTank,
    landscapeChanged:this.landscapeChanged
  };


  socket.emit("receive-game", game);
  // this.lastTank = this.tank;

}

Player.prototype.receiveGameState = function(data) {
  var world = worlds[this.level];
  world.addTank(this.tank);
  world.addTokens(3, 8 );
  this.landscapeChanged = false;
  if (data.levelComplete) {
    this.level++;
    this.landscapeChanged=true;
  }
  if (this.level>6) {
    this.level=0;
    this.landscapeChanged=true;
  }
  if (data.player.playerName) {
    this.playerName = data.player.playerName;
    this.tank.playerName = data.player.playerName;
  }
  this.tank.addEvents(data.eventQueues.player);
  // this.world.tokens.forEach(function(t) {
  //   if (data.eventQueues.tokens[t.tokenId]) {
  //     var events = data.eventQueues.tokens[t.tokenId];
  //     t.addEvents(events);
  //   }
  // });
  // this.world.floaters.forEach(function(t) {
  //   if (data.eventQueues.floaters[t.id]) {
  //     var events = data.eventQueues.floaters[t.id];
  //     t.addEvents(events);
  //   }
  // });
}


function Tank(worldIndex, player) {
  this.tankId = nextTankId;
  nextTankId++;
  this.worldIndex = worldIndex;

  

  //var world = worlds[this.worldIndex];
  this.events = {
    movements: [],
    gun: []
    // ,
    // state: []
  };

}

Tank.prototype.toPlainObject = function() {
  return {
    tankId: this.tankId,
    
    events: this.events,
    playerName: this.playerName
  };
}


Tank.prototype.addEvents = function(events) {
  this.events.movements.push.apply(this.events.movements, events.movements);
  this.events.gun.push.apply(this.events.gun, events.gun);
  // this.events.state.push.apply(this.events.state, events.state);

};

function Token(x, y) {
  this.xpos = x;
  this.ypos = y;
  this.tokenId = nextTokenId;
  // this.events = [];
  nextTokenId++;
}
Token.prototype.toPlainObject = function() {
  return {
    xpos: this.xpos,
    ypos: this.ypos,
    tokenId: this.tokenId,
    id: this.tokenId
    // ,
    // events: this.events
  };
}

// Token.prototype.addEvents = function(events) {
//   this.events.push.apply(this.events, events);
// }


function World(level) {

  this.worldDuration = 5 * 60 * 1000;
  this.height = 2000 + 400*level;
  this.width = 3000 +  400*level;
  this.events = [];
  this.tanks = [];
  this.tokens = [];
  this.floaters = [];
  this.sealevel = level*7;
  this.landscapeSeed = Math.floor(Math.random() * 10000);
  this.level = level;
}

World.prototype.addTokens = function(numTokens, numFloaters) {
  noise.seed(this.landscapeSeed);
  var tokensCount = 0,
    floatersCount = 0;
  while (tokensCount < numTokens && floatersCount < numFloaters) {
    var x = Math.floor(Math.random() * this.width);
    var y = Math.floor(Math.random() * this.height);
    var value = Math.abs(noise.perlin2(x / (600), y / (600)));
    value *= 256;
    value = Math.min(256, value + this.sealevel);
    if (value > 70 && value < 77 && tokensCount < numTokens) {
      this.tokens.push(new Token(x, y));
      tokensCount++;
    }
    if (value < 40 + this.sealevel && floatersCount < numFloaters) {
      this.floaters.push(new Token(x, y));
      floatersCount++;
    }
  }
}

World.prototype.deleteWorld = function() {
  this.tanks = [];
  this.tokens = [];
  this.floaters = [];
}

World.prototype.addTank = function(tank) {
  this.tanks.push(tank);
}

World.prototype.addEvents = function(data) {
  this.events.push.apply(this.events, data.player);
  // this.tokens.forEach(function(t) {
  //   if (data.tokens[t.tokenId]) {
  //     var events = data.tokens[t.tokenId];
  //     t.addEvents(events);
  //   }
  // });
}

World.prototype.toPlainObject = function() {

  var f = {
    sealevel: this.sealevel,
    level: this.level,
    worldDuration: this.worldDuration,
    height: this.height,
    width: this.width,
    landscapeSeed: this.landscapeSeed,
    players: this.tanks.map(function(p) {
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

startServer();
