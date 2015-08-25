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
	var world = new World(worldData,player,getCurTime());

	function getCurTime() {
		if (worldData.isForward) 
			return Date.now() - startTime;
		else
			return (startTime + worldData.worldDuration) - Date.now();
	}

	

	
	var curTime = getCurTime();
	world.player.recordTankState(curTime);

	function sendGameState() {
		var curTime = getCurTime();
		//recordTankState(player);
		var eventQueues = world.getQueuedEvents(curTime);

		socket.emit('tank-state', eventQueues,function() {});
		world.flushQueuedEvents(curTime);
	}
	
	var sendStateInterval = window.setInterval(function() {
	//	sendGameState();

	},1000);

	

	function endLevel() {
		var curTime = getCurTime();
		maingame.onDraw = function() {};
		maingame.onKeyPress = function(g) {};
		clearInterval(sendStateInterval);	
		world.player.recordTankState(curTime);
		sendGameState();
		maingame.endLevel();
	}
	maingame.onKeyPress = function(g) {
		if (!!(g.keyCode==32)) world.player.fire(getCurTime());
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
			world.player.tick(g,delta,world,curTime);
			world.player.draw(g);

			
			
			Object.keys(world.tokens).forEach(function(t) {
				world.tokens[t].compareTank(world.player,curTime);
				world.tokens[t].tick(delta,curTime);
				world.tokens[t].draw(g);
			});

			Object.keys(world.otherTanks).forEach(function(p) {
				world.otherTanks[p].tick(g,delta,world,curTime);
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

function dist(a,b) {
	var x = a.xpos - b.xpos;
	var y = a.ypos - b.ypos;
	return Math.sqrt(x*x+y*y);
}


onLoad();