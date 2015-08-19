var io = require('sandbox-io');


var worlds = [];


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

var nextPlayerId = 1;

function Player(socket,worldIndex,isForward) {
  this.playerId = nextPlayerId;
  nextPlayerId++;
  this.worldIndex = worldIndex;
  this.socket = socket;
  this.isForward = isForward;

  var world = worlds[this.worldIndex];
  var game = {playerId:this.playerId,
    world:world.toPlainObject()
    //
    //players:world.players
  };
  //socket.on('disconnect', this.onExit.bind(this));
  socket.emit("receive-game",game);

  socket.on('tank-state', function(data) {
    //var events = JSON.parse(data);
    world.events.push.apply(world.events,data);
    world.events.sort(function(a,b) { 
      return (a.worldTime - b.worldTime);
    });
    console.log("Received " + data.length + " rows");
  });
  
}

Player.prototype.toPlainObject = function() {
  return {playerId:this.playerId,isForward:this.isForward};
}

function World() {
 this.isForward=false;
 this.worldDuration=1*60*1000;
 this.events=[];
 this.players=[];

}

World.prototype.addPlayer = function(socket) {
  this.isForward = !this.isForward;
  this.players.push(new Player(socket,0,this.isForward));
}

World.prototype.toPlainObject = function() {
  var f= {
    isForward:this.isForward,
    worldDuration:this.worldDuration,
    events:this.events,
    players:this.players.map(function(p) {
      return p.toPlainObject();
    })
  };
  return f;
}
