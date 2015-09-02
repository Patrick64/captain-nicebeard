'use strict';

var MAX_FORWARD = 3.0;
var MAX_REVERSE = -3.0;
var ACCELERATION = 10;
var TURN_SPEED = 80;

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
		var g = new Goo({
		fullscreen:true,
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
		newGame(data.world,data.player,socket,maingame,data.lastTank);
	});

  }

  function newGame(worldData,player,socket,maingame,lastTank) {
	var startTime = Date.now();
	var curEventIndex = 0; //world.isForward ? 0 : world.events.length-1;
	// var eventsQueue = [];
	var timerElement = document.getElementById('worldTime');
	var scoreElement = document.getElementById('score');
	var coinsElement = document.getElementById('coins');
	var levelElement = document.getElementById('level');
	var givenElement = document.getElementById('given');
	
	var rescuedElement = document.getElementById('rescued');
	var world = new World(worldData,player,getCurTime(),lastTank);
	world.renderLandscape();
	var startTime = Date.now();
	function getCurTime() {
		if (worldData.isForward) 
			return Date.now() - startTime;
		else
			return (startTime + worldData.worldDuration) - Date.now();
	}

	
	var curTime = getCurTime();
	world.player.recordTankState(curTime);

	function sendGameState(levelComplete) {
		var curTime = getCurTime();
		//recordTankState(player);
		var eventQueues = world.getQueuedEvents(curTime);

		socket.emit('tank-state',{
			eventQueues: eventQueues,
			levelComplete:levelComplete},function() {});
		world.flushQueuedEvents(curTime);
	}
	
	var sendStateInterval = window.setInterval(function() {
	//	sendGameState();

	},1000);

	

	function endLevel(levelComplete) {
		var curTime = getCurTime();
		maingame.onDraw = function() {};
		maingame.onKeyPress = function(g) {};
		clearInterval(sendStateInterval);	
		world.player.recordTankState(curTime);
		sendGameState(levelComplete);
		maingame.endLevel();
	}
	maingame.onKeyPress = function(g) {
		if (!!(g.keyCode==32)) world.player.fire(getCurTime());
	}
	var lastFrameTime= Date.now();
	maingame.onDraw = function(g) {
		var curTime = getCurTime();
		world.render(g,curTime);
	
	
//			 if (Math.random()*10>1) return;
			
			 if ((world.isForward && curTime>world.worldDuration) || (!world.isForward && curTime<0)) {
			 		//sendGameState();
			 		endLevel(false);
			 	}
			 if (world.player.rescuedFloaters>=2) {
			 	endLevel(true);
			 }
			 	
			updateTimer();
		}
	

	function updateTimer() {
		var t = getCurTime() / 1000;
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		timerElement.innerHTML = m + ':' + (s<10 ? '0' : '') + s; 
		scoreElement.innerHTML = "Score: " + world.player.score;
		levelElement.innerHTML = "Lev " + (world.level+1);
		coinsElement.innerHTML = "coins: " + world.player.coins;
		givenElement.innerHTML = "given: " + world.player.given;
		rescuedElement.innerHTML = "resued: "+ world.player.rescuedFloaters;

	}


  }

function dist(a,b) {
	var x = a.xpos - b.xpos;
	var y = a.ypos - b.ypos;
	return Math.sqrt(x*x+y*y);
}


onLoad();
