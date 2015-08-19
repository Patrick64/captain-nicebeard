

var MAX_FORWARD = 20.0;
var MAX_REVERSE = -20.0;

var carStraight = new Image();
carStraight.src = "./res/car_straight.png";
var carLeft = new Image();
carLeft.src = "./res/car_left.png";
var carRight = new Image();
carRight.src = "./res/car_right.png";

var counter = 1000;
onLoad();

function onLoad() {
	  // Connect to the server:
	  var socket = io(document.location.href);
	  
	  socket.on('receive-game', function(data) {
		log.innerHTML += '<li>Received: '+ JSON.stringify(data) +'</li>';
		//var game =  JSON.parse(data);
		newGame(data.world,data.playerId,socket);
	});

  }

  function newGame(world,playerId,socket) {
	var startTime = Date.now();
	var curEventIndex = world.isForward ? 0 : world.events.length-1;
	var eventsQueue = [];
	var timerElement = document.getElementById('worldTime');


	function getCurTime() {
		if (world.isForward) 
			return Date.now() - startTime;
		else
			return (startTime + world.worldDuration) - Date.now();
	}

	var player = new Tank(recordTankState,true);
	var otherPlayers = {};
	world.players.forEach(function(p) {
		otherPlayers[p.playerId] = new Tank(null,(p.isForward == world.isForward));
	});


	function recordTankState(player) {
		eventsQueue.push(
		{
			playerId:playerId,
			worldTime: getCurTime(),
			angle:player.angle,
			xpos:player.xpos,
			ypos:player.ypos,
			speed:player.speed
		});
	}
	
	recordTankState(player);
	
	window.setInterval(function() {
		recordTankState(player);
		socket.emit('tank-state', eventsQueue,function() {
			
		});
		eventsQueue = [];	
	},1000)

	

	var g = new Goo({width:800, height:600, 
		container:document.getElementById("canvasholder"),
		onDraw: function(g) {
			g.ctx.clearRect(0,0,g.width,g.height);

			player.handleKeys(g);
			player.tick(g);
			player.draw(g);

			
			var curTime = getCurTime();
			if (world.isForward) {
				while (curEventIndex < world.events.length && world.events[curEventIndex].worldTime < curTime ) {
					var curEvent = world.events[curEventIndex];
					if (otherPlayers[curEvent.playerId]) {
						otherPlayers[curEvent.playerId].setState(curEvent);
					}
					curEventIndex++;
				}
			} else {
				while (curEventIndex >= 0 && world.events[curEventIndex].worldTime > curTime ) {
					var curEvent = world.events[curEventIndex];
					if (otherPlayers[curEvent.playerId]) {
						otherPlayers[curEvent.playerId].setState(curEvent);
					}
					curEventIndex--;
				}
			}
			Object.keys(otherPlayers).forEach(function(p) {
				otherPlayers[p].tick(g);
				otherPlayers[p].draw(g);
			});

			updateTimer();
		}
	});

	function updateTimer() {
		var t = getCurTime() / 1000;
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		timerElement.innerHTML = m + ':' + (s<10 ? '0' : '') + s; 
	}


  }

  function Tank(recordTankState,isForward) {
	this.angle = 180;
	this.xpos = 400;
	this.ypos = 300;
	this.speed = 0.0;
	this.carImage = carStraight;
	this.recordTankState = recordTankState;
	this.isForward = isForward;
  }

  Tank.prototype.tick = function(g) {
	// move forward/backward
	var x = 0;
	var y = this.isForward ? this.speed : -this.speed;
	
	var angleRads = this.angle * (Math.PI / 180.0);
	
	var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
	var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
	
	this.xpos += deltaX;
	this.ypos += deltaY;
	
	var carLength = 128;
	this.wrapped = false;
	
	if (this.xpos < - carLength) {
		this.xpos = g.width+carLength;  
		this.wrapped = true;
	}
	else if (this.xpos >= g.width+carLength) {
		this.xpos = -carLength;
		this.wrapped = true;
	}
	
	if (this.ypos < -carLength) {
		this.ypos = g.height+carLength;  
		this.wrapped = true;
	}
	else if (this.ypos >= g.height+carLength) {
		this.ypos = -carLength;
		this.wrapped = true;
	}
	
	
}

Tank.prototype.setState = function(state) {
	this.angle = state.angle;
	this.xpos = state.xpos;
	this.ypos = state.ypos;
	this.speed = state.speed;
}

Tank.prototype.draw = function(g) {
	var angleRads = this.angle * (Math.PI / 180.0);
	g.ctx.save();
	g.ctx.translate(this.xpos, this.ypos);
	g.ctx.rotate(angleRads);

	// if (this.speed != 0) {
	// 	  // reset our trail
	// 	  if (counter++ > 1000) {
	// 		g.ctx.beginPath();
	// 		g.ctx.moveTo(0,-carStraight.height/2-10);
	// 		counter = 0;
	// 	  }
	//   }    
	//   g.ctx.strokeStyle = "orange";
	//   if (this.wrapped)
	// 	g.ctx.moveTo(0,-carStraight.height/2-10);
	//   g.ctx.lineTo(0,0);
	//   g.ctx.lineWidth = 5;
	//   g.ctx.stroke();
	  
	  g.ctx.drawImage(this.carImage, -carStraight.width/2, -carStraight.height/2);
	  g.ctx.restore();

  };

  Tank.prototype.handleKeys = function(g) {

	  // Support arrow keys, WASD and 2468
	  var keyForward = g.keysDown[38] || g.keysDown[87] || g.keysDown[50];
	  var keyReverse = g.keysDown[40] || g.keysDown[83] || g.keysDown[56];
	  var keyLeft = g.keysDown[37] || g.keysDown[65] || g.keysDown[52];
	  var keyRight = g.keysDown[39] || g.keysDown[68] || g.keysDown[54];

	  if (keyForward)
		this.speed = Math.min(MAX_FORWARD, this.speed+0.4);
	  else if (keyReverse)
		this.speed = Math.max(MAX_REVERSE, this.speed-0.4);
	  else
	  {
		this.speed *= 0.98;
		if (Math.abs(this.speed) < 0.5) this.speed = 0;
	  }
	  
	  
	// rotate/turn
	if (keyLeft)
	{
		this.angle = (this.angle - 2 * (this.speed / MAX_FORWARD)) % 360;
		this.carImage = carLeft;
	}
	else if (keyRight)
	{
		this.angle = (this.angle + 2 * (this.speed / MAX_FORWARD)) % 360;
		this.carImage = carRight;
	}
	else {
		this.carImage = carStraight;
	}
	
	
	if (keyLeft || keyRight || keyForward || keyReverse)
		this.recordTankState(this);


}