var io = require('sandbox-io');


var worlds = [];
var nextPlayerId = 1;
var nextTokenId = 1;


worlds.push(getNewWorld());

function getNewWorld() {
  return (new World());
  //return {isForward:true,worldDuration:2*60*1000,events:[],players:[]};
}


io.on('connection', function(socket) {
  // See the generated log in the server console:
  log.debug('New connection', socket.id);
  // Send a message to this player:
  var world = worlds[0];
  world.addPlayer(socket);
  
  //socket.emit('srv-msg', { message: 'Welcome!' });
  // Link a receiveClientMessage reference to this socket
  // and add it as a listener for 'cli-msg' events:
  //socket.on('cli-msg', receiveClientMessage.bind(socket));
  
});



function receiveClientMessage(data) {
  if (data == 'Hello') {
    this.emit('srv-msg', { hello: 'Wold!' });
  } else {
    this.emit('srv-msg', {
      data: data,
      msg: 'This data is a ' +
       data.constructor.toString().replace(/^function ([^(]+).*/, '$1')
      }
    );
  }
}


function Player(socket,worldIndex,isForward) {
  this.playerId = nextPlayerId;
  nextPlayerId++;
  this.worldIndex = worldIndex;
  this.socket = socket;
  this.isForward = isForward;

  var world = worlds[this.worldIndex];
  var game = {player:this.toPlainObject(),
    world:world.toPlainObject()
    //
    //players:world.players
  };
  //socket.on('disconnect', this.onExit.bind(this));
  debugger;
  socket.emit("receive-game",game);

  socket.on('tank-state', function(data) {
    //var events = JSON.parse(data);
    world.events.push.apply(world.events,data.player);
    
    console.log("Received " + data.player.length + " rows");
  });
  
}

Player.prototype.toPlainObject = function() {
  return {playerId:this.playerId,isForward:this.isForward};
}

function Token(maxX,maxY) {
  this.xpos = Math.floor(Math.random()*maxX);
  this.ypos = Math.floor(Math.random()*maxY);
  this.tokenId = nextTokenId;
  nextTokenId++;
}
Token.prototype.toPlainObject = function() {
  return {
    xpos:this.xpos,
    ypos:this.ypos,
    tokenId:this.tokenId
  };
}

Token.prototype.addEvent = function(event) {

}

function World() {
 this.isForward=false;
 this.worldDuration=1*10*1000;
 this.events=[];
 this.players=[];
 this.tokens = [];
 for (var i=0;i<10;i++) {
  this.tokens.push(new Token(800,600));
 }
}

World.prototype.addPlayer = function(socket) {
  this.isForward = !this.isForward;
  var player = new Player(socket,0,this.isForward);
  this.players.push(player);
}

World.prototype.toPlainObject = function() {
  // sort events in correct order
  debugger;  
  var events = this.events.slice();
  debugger;
  if (this.isForward) {
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
    isForward:this.isForward,
    worldDuration:this.worldDuration,
    events:events,
    players:this.players.map(function(p) {
      return p.toPlainObject();
    }),
    tokens: this.tokens.map(function(t) {
      return t.toPlainObject();
    })
  };
  return f;
}
