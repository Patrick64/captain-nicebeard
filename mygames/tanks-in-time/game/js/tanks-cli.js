'use strict';

var MAX_FORWARD = 3.0;
var MAX_REVERSE = -3.0;
var ACCELERATION = 10;
var TURN_SPEED = 80;

var carStraight = new Image();
carStraight.src = "./res/car_straight.png";
var carLeft = new Image();
carLeft.src = "./res/car_left.png";
var carRight = new Image();
carRight.src = "./res/car_right.png";

var counter = 1000;


function onLoad() {
	  // Connect to the server:
	  var socket = io(document.location.href);
	  
	  var maingame = {
	  	onDraw: function(g) {},
	  	endLevel: function() {

	  		socket.emit('new-game', {},function() {});

	  	},
	  	lastTank: null,
	  	onKeyPress: function(key) {  	}
	  }
		var g = new Goo({width:800, height:600, 
		container:document.getElementById("canvasholder"),
		onDraw: function(g) {
			maingame.onDraw(g);
		},
		onKeyPress: function(g) {
			maingame.onKeyPress(g);
		}});
		
	  socket.on('receive-game', function(data) {
		//log.innerHTML += '<li>Received: '+ JSON.stringify(data) +'</li>';
		//var game =  JSON.parse(data);
		newGame(data.world,data.player,socket,maingame);
	});

  }

  function newGame(worldData,player,socket,maingame) {
	var startTime = Date.now();
	var curEventIndex = 0; //world.isForward ? 0 : world.events.length-1;
	// var eventsQueue = [];
	var timerElement = document.getElementById('worldTime');
	var world = new World(worldData,player);

	function getCurTime() {
		if (world.isForward) 
			return Date.now() - startTime;
		else
			return (startTime + world.worldDuration) - Date.now();
	}

	

	
	var curTime = getCurTime();
	world.recordTankState(world.player,curTime);

	function sendGameState() {
		var curTime = getCurTime();
		//recordTankState(player);
		var eventQueues = world.getQueuedEvents(curTime);

		socket.emit('tank-state', eventQueues,function() {});
		world.flushQueuedEvents(curTime);
	}
	
	var sendStateInterval = window.setInterval(function() {
		sendGameState();

	},1000);

	

	function endLevel() {
		maingame.onDraw = function() {};
		maingame.onKeyPress = function(g) {};
		clearInterval(sendStateInterval);	
		maingame.endLevel();
	}
	maingame.onKeyPress = function(g) {
		if (!!(g.keyCode==32)) world.player.fire();
	}
	var lastFrameTime= Date.now();
	maingame.onDraw = function(g) {

	
	
//			 if (Math.random()*10>1) return;
			var curTime = getCurTime();
			 if ((world.isForward && curTime>world.worldDuration) || (!world.isForward && curTime<0)) {
			 		//sendGameState();
			 		endLevel();
			 	}
			g.ctx.clearRect(0,0,g.width,g.height);
			var datenow = Date.now();
			var delta = (datenow - lastFrameTime) / 1000;
			lastFrameTime = datenow;

			world.player.handleKeys(g,curTime);
			world.player.tick(g,delta,world);
			world.player.draw(g);

			
			
			if (world.isForward) {
				while (curEventIndex < world.events.length && world.events[curEventIndex].startTime < curTime ) {
					var curEvent = world.events[curEventIndex];
					if (world.otherTanks[curEvent.tankId]) {
						world.otherTanks[curEvent.tankId].setState(curEvent);
					}
					curEventIndex++;
				}
			} else {
				while (curEventIndex < world.events.length && world.events[curEventIndex].endTime > curTime ) {
					var curEvent = world.events[curEventIndex];
					if (world.otherTanks[curEvent.tankId]) {
						world.otherTanks[curEvent.tankId].setState(curEvent);
					}
					curEventIndex++;
				}
			}
			Object.keys(world.tokens).forEach(function(t) {
				world.tokens[t].compareTank(world.player,curTime);
				world.tokens[t].tick(delta,curTime);
				world.tokens[t].draw(g);
			});

			Object.keys(world.otherTanks).forEach(function(p) {
				world.otherTanks[p].tick(g,delta,world);
				world.otherTanks[p].draw(g);
			});


			updateTimer();
		}
	

	function updateTimer() {
		var t = getCurTime() / 1000;
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		timerElement.innerHTML = m + ':' + (s<10 ? '0' : '') + s; 
	}


  }

  function Tank(world,isForward,tankId) {
	this.angle = 0;
	this.xpos = 400;
	this.ypos = 200;
	this.tankId = tankId;
	this.carImage = carStraight;
	this.world = world;
	this.isForward = isForward;
	this.keyForward=false;
	this.keyReverse=false;
	this.keyLeft=false;
	this.keyRight=false;
	this.keyShoot = false;
	this.velocity = 0;
	this.acceleration = 0;
	this.lastState = null;
	this.bullets = [];
  }

  Tank.prototype.tick = function(g,delta,world) {

  	if (this.keyForward)
  		this.acceleration = this.isForward ? ACCELERATION : -ACCELERATION; 
		//this.speed = Math.min(MAX_FORWARD, this.speed+ ((0.4*60)*delta) );
	  else if (this.keyReverse)
	  	this.acceleration = this.isForward ? -ACCELERATION : ACCELERATION;
		//this.speed = Math.max(MAX_REVERSE, this.speed-((0.4*60)*delta));
	  else
	  {
		//this.speed *= 1-((0.02*60)*delta);
		
		this.acceleration = 0;

	  }
	  
	  
	// rotate/turn
	if ((this.keyLeft && this.isForward) || (this.keyRight && !this.isForward))
	{
		this.angle = (this.angle - TURN_SPEED * delta) % 360;
		//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		this.carImage = carLeft;
	}
	else if ((this.keyLeft && !this.isForward) || (this.keyRight && this.isForward))
	{
		this.angle = (this.angle + TURN_SPEED * delta) % 360;
		//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		this.carImage = carRight;
	}
	else {
		this.carImage = carStraight;
	}



	// 
	if (this.acceleration) {
		this.velocity = this.velocity + (this.acceleration * delta);
	} else {
		//this.velocity = this.velocity * 0.98;
		if (Math.abs(this.velocity) < ACCELERATION * delta) {
			this.velocity = 0;
		} else {
			if (this.velocity>0)  
				this.velocity -= ACCELERATION * delta; 
			else 
				this.velocity += ACCELERATION * delta; 
		}
	}
	if (this.velocity>MAX_FORWARD) this.velocity = MAX_FORWARD;
	if (this.velocity<MAX_REVERSE) this.velocity = MAX_REVERSE;

	// move forward/backward
	var x = 0;
	//var y = (this.isForward ? this.velocity : -this.velocity)*60*delta;
	var y = this.velocity*60*delta;
	
	var angleRads = this.angle * (Math.PI / 180.0);
	
	var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
	var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
	
	this.xpos += deltaX;
	this.ypos += deltaY;
	
	var carLength = 100;
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
	
	
	this.bullets.forEach(function(b) { b.tick(delta,world); });
	
}

Tank.prototype.fire = function( ) {

	this.bullets.push(new Bullet(this.isForward,this,this.xpos,this.ypos,this.angle));
	
}

Tank.prototype.setState = function(state) {
	if (this.lastState && !this.isForward) {
		this.velocity = -state.velocity;

		this.angle = this.lastState.angle;
		this.xpos = this.lastState.xpos;
		this.ypos = this.lastState.ypos;
		
	} else {
		this.angle = state.angle;
		this.xpos = state.xpos;
		this.ypos = state.ypos;
	}
	
	if (this.lastState || !this.isForward) {
		this.keyForward = state.keyForward;
		this.keyReverse = state.keyReverse;
		this.keyLeft = state.keyLeft;
		this.keyRight = state.keyRight;
	}

	this.lastState = state;
	//this.velocity = state.velocity ;
	//this.acceleration = state.acceleration;
}

Tank.prototype.draw = function(g) {
	var angleRads = this.angle * (Math.PI / 180.0);
	g.ctx.save();
	g.ctx.translate(this.xpos, this.ypos);
	g.ctx.rotate(angleRads);

	  //g.ctx.drawImage(this.carImage, -carStraight.width/2, -carStraight.height/2);
	 if (this.isForward) g.ctx.fillStyle = "blue"; else g.ctx.fillStyle = "red";

	  //g.ctx.fillStyle = 'rgb(' + Math.floor(255-42.5) + ',' +Math.floor(255-42.5) + ',0)';
		g.ctx.fillRect(-25, -50, 50, 100);
		g.ctx.fillStyle = "grey";
		g.ctx.fillRect(-5,0,10,50);
		
	  g.ctx.restore();

	  this.bullets.forEach(function(b) { b.draw(g); });

  };

  Tank.prototype.handleKeys = function(g,curTime) {
  		var lastKeyCombo = this.keyForward*2 + this.keyReverse*4 + this.keyLeft*8 + this.keyRight*16;
	  // Support arrow keys, WASD and 2468
	  this.keyForward = !!(g.keysDown[38] || g.keysDown[87] || g.keysDown[50]);
	  this.keyReverse = !!(g.keysDown[40] || g.keysDown[83] || g.keysDown[56]);
	  this.keyLeft = !!(g.keysDown[37] || g.keysDown[65] || g.keysDown[52]);
	  this.keyRight = !!(g.keysDown[39] || g.keysDown[68] || g.keysDown[54]);
	  
		var curKeyCombo = this.keyForward*2 + this.keyReverse*4 + this.keyLeft*8 + this.keyRight*16;	
	  
	
	
	 if (curKeyCombo != lastKeyCombo)
	 	this.world.recordTankState(this,curTime);


}

function Token(tokendata,isWorldForward) {
	this.xpos = tokendata.xpos;
	this.ypos = tokendata.ypos;
	this.isWorldForward = isWorldForward;
	this.events = tokendata.events;
	this.eventsQueue = [];
	if (this.isWorldForward) { // going forward
		this.visible = true;
		this.events.sort(function(a,b) { return a.startTime - b.startTime; });
	} else {
		this.visible = false;
		this.events.sort(function(a,b) { return b.startTime - a.startTime; });
	}
	this.curEventIndex=0;
}

Token.prototype.draw = function(g) {
	if (this.visible) {
		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		
			
		g.ctx.fillStyle = "green";
			
		g.ctx.beginPath();
		g.ctx.arc(20, 20, 20, 0, 2 * Math.PI, false);
		g.ctx.stroke();
		g.ctx.fill();
			
		  g.ctx.restore();
		}

}

Token.prototype.tick= function(delta,worldTime) {
	if (this.isWorldForward) {
		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].startTime < worldTime )) {
			var curEvent = this.events[this.curEventIndex];
			this.visible = curEvent.isForward ? curEvent.visible : !curEvent.visible;
			this.curEventIndex++;
		}
	} else {
		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].startTime > worldTime )) {
			var curEvent = this.events[this.curEventIndex];
			this.visible = curEvent.isForward ? !curEvent.visible : curEvent.visible;
			this.curEventIndex++;
		}
	}

}

Token.prototype.compareTank = function(player,worldTime) {
	if (dist(this,player)<50 && this.visible)	{
		this.visible=false;
		this.eventsQueue.push({
			startTime: worldTime,
			endTime: worldTime,
			visible: this.visible,
			tankId: player.tankId,
			isForward: this.isWorldForward
		});
	}

}

function Bullet(isForward,tank,xpos,ypos,angle) {
	this.isForward = isForward;
	this.angle = angle;
	this.tank = tank;
	this.xpos = xpos;
	this.ypos = ypos;
	this.active = true;	
}

Bullet.prototype.tick = function(delta,world) {
	if (this.active) {
		for (var i =0; i<10; i++) {
			var x= 0;
			var y = 1*60*delta;
			if (this.isForward) y=-y;

			var angleRads = (180+this.angle) * (Math.PI / 180.0);
			
			var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
			var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
			
			this.xpos += deltaX;
			this.ypos += deltaY;

			Object.keys(world.otherTanks).forEach(function(tankId) {
				if (dist(world.otherTanks[tankId],this)<40) {
					this.active=false;

				}

			}.bind(this));
			
		}
	}

}

Bullet.prototype.draw = function(g) {
	if (this.active) {
		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		
			
		g.ctx.fillStyle = "red";
			
		g.ctx.beginPath();
		g.ctx.arc(10, 10, 10, 0, 2 * Math.PI, false);
		g.ctx.stroke();
		g.ctx.fill();
			
		  g.ctx.restore();
		}

}




Token.prototype.toPlainObject = function() {

}

function dist(a,b) {
	var x = a.xpos - b.xpos;
	var y = a.ypos - b.ypos;
	return Math.sqrt(x*x+y*y);
}

function World(worldData,player) {
	this.events = worldData.events;	
	this.eventsQueue = [];
	this.player = new Tank(this,true,player.tankId);
	this.otherTanks = {};
	this.tokens = {};
	this.isForward = worldData.isForward;
	this.worldDuration = worldData.worldDuration;
	worldData.players.forEach(function(p) {
		this.otherTanks[p.tankId] = new Tank(this,(p.isForward == this.isForward));
	}.bind(this));
	worldData.tokens.forEach(function(t) {
		this.tokens[t.tokenId] = new Token(t,this.isForward);
	}.bind(this));

}

World.prototype.recordTankState = function(player,curTime) {
	
	// set startTime and endTime for last event
	this.updateLastEventInQueue(curTime);
	this.eventsQueue.push(
	{
		tankId:player.tankId,
		startTime: curTime,
		endTime: curTime,
		angle:player.angle,
		xpos:player.xpos,
		ypos:player.ypos,
		//speed:player.speed,
		keyForward:player.keyForward,
		keyReverse:player.keyReverse,
		keyLeft:player.keyLeft,
		keyRight:player.keyRight,
		velocity :player.velocity ,
		acceleration :player.acceleration 
	});
}

World.prototype.updateLastEventInQueue = function(curTime) {
	
	// set startTime and endTime for last event
	if (this.eventsQueue.length) {
		var lastEvent = this.eventsQueue[this.eventsQueue.length-1];
		lastEvent.startTime = Math.min(lastEvent.startTime,curTime);
		lastEvent.endTime = Math.max(lastEvent.endTime,curTime);
	}

}

World.prototype.getQueuedEvents = function(curTime) {
	this.updateLastEventInQueue(curTime);
	return {
		player:this.eventsQueue,
		tokens:Object.keys(this.tokens).reduce(
			function(obj,tokenId) { 
				obj[tokenId] = this.tokens[tokenId].eventsQueue;
				return obj;
			}.bind(this),{})
	};
}

World.prototype.flushQueuedEvents = function(curTime) {
	this.eventsQueue = [];
	Object.keys(this.tokens).forEach(
		function(id) { 
			this.tokens[id].eventsQueue = []; 
		}.bind(this));
	this.recordTankState(this.player,curTime);
}



onLoad();