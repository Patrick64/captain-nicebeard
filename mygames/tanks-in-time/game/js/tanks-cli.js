'use strict';

var MAX_FORWARD = 3.0;
var MAX_REVERSE = -3.0;
var ACCELERATION = 10;
var TURN_SPEED = 80;

var counter = 1000;


var maingame = {
	onDraw: function(g) {},
	endLevel: function() {

		//socket.emit('new-game', {},function() {});

	},
	lastTank: null,
	onKeyPress: function(key) {}
}
var g = new Goo({
	fullscreen: true,
	container: document.getElementById("canvasholder"),
	onDraw: function(g) {
		maingame.onDraw(g);
	},
	onKeyPress: function(g) {
		maingame.onKeyPress(g);
	}
});



function onLoad() {
	var l = new Landscape(screen.width, screen.height, 2, Math.random() * 2000,5);
	l.render();
	document.getElementById('nameform').onsubmit = function(e) {
		document.getElementById('intro').style.display = 'none';
		document.getElementById('info').style.display = 'block';
		maingame.onKeyPress = function(key) {
			if (!!(g.keyCode == 32)) {
				document.getElementById('info').style.display = 'none';
				//document.getElementById('overlay').style.display  = 'none';
				document.getElementById('newLevel').style.display = 'block';
				startGame(document.getElementById('nameinput').value);
			}
		}

		return false;
	};
}


function startGame(playerName) {
	// Connect to the server:
	var socket = io(document.location.href);
	maingame.endLevel = function() {
		document.getElementById('newLevel').style.display = 'block';
		document.getElementById('overlay').style.display = 'block';
		document.getElementById('press-space').style.display = 'none';
		document.getElementById('loading-text').style.display = 'block';
		

		socket.emit('new-game', {}, function() {});

	};
	socket.on('receive-game', function(data) {
		//log.innerHTML += '<li>Received: '+ JSON.stringify(data) +'</li>';
		//var game =  JSON.parse(data);
		data.player.playerName = playerName;
		newGame(data.world, data.player, socket, maingame, data.lastTank,playerName);
	});

}

function newGame(worldData, player, socket, maingame, lastTank, playerName) {
	var startTime = Date.now();

	function getCurTime() {
		if (worldData.isForward) {
			return Date.now() - startTime;
		} else {
			return (startTime + worldData.worldDuration) - Date.now();
		}
	}

	var curEventIndex = 0; //world.isForward ? 0 : world.events.length-1;
	// var eventsQueue = [];
	var timerElement = document.getElementById('worldTime');
	var scoreElement = document.getElementById('score');
	var coinsElement = document.getElementById('coins');
	var levelElement = document.getElementById('level');
	var givenElement = document.getElementById('given');


	var rescuedElement = document.getElementById('rescued');
	var world = new World(worldData, player, getCurTime(), lastTank);
	world.player.playerName = playerName;
	world.renderLandscape();

	document.getElementById('press-space').style.display = 'block';
	document.getElementById('loading-text').style.display = 'none';
	maingame.onKeyPress = function(g) {
		if (!!(g.keyCode == 32)) {
			document.getElementById('overlay').style.display = 'none';
			startLoadedGame();
		}
	}


	function startLoadedGame() {
		startTime = Date.now();
		showNotification("Sea number " + (world.level+1) + " ahoy!");

		var curTime = getCurTime();
		world.player.recordTankState(curTime);

		function sendGameState(levelComplete) {
			var curTime = getCurTime();
			//recordTankState(player);
			var eventQueues = world.getQueuedEvents(curTime);

			socket.emit('tank-state', {
				eventQueues: eventQueues,
				levelComplete: levelComplete,
				player: world.player.toPlainObject()
			}, function() {});
			world.flushQueuedEvents(curTime);
		}

		var sendStateInterval = window.setInterval(function() {
			//	sendGameState();

		}, 1000);



		function endLevel(levelComplete) {
			var curTime = getCurTime();
			if (levelComplete)
				showNotification("Sea number " + (world.level+1) + " Complete!");
				//document.getElementById('newLevTitle').innerHTML="Sea number " + world.level + " Complete!";
			else
				showNotification("Yar! We be scuttled.");
				//document.getElementById('newLevTitle').innerHTML="You crashed!";
			
			maingame.onDraw = function() {};
			maingame.onKeyPress = function(g) {};
			clearInterval(sendStateInterval);
			world.player.recordTankState(curTime);
			sendGameState(levelComplete);
			maingame.endLevel();
		}
		maingame.onKeyPress = function(g) {
			if (!!(g.keyCode == "z".charCodeAt(0) || g.keyCode == "Z".charCodeAt(0))) { // z
				world.player.fire(getCurTime(),-1);
			}
			if (!!(g.keyCode == "x".charCodeAt(0) || g.keyCode == "X".charCodeAt(0))) { // x
				world.player.fire(getCurTime(),1);
			}
		}
		var lastFrameTime = Date.now();
		maingame.onDraw = function(g) {
			var curTime = getCurTime();
			world.render(g, curTime);



			if ((world.isForward && curTime > world.worldDuration) || (!world.isForward && curTime < 0) || !world.player.active) {
				//sendGameState();
				endLevel(false);
			}
			if (world.player.rescuedFloaters >= 2) {
				endLevel(true);
			}

			updateTimer();
		}
	}

	function updateTimer() {
		var t = getCurTime() / 1000;
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		timerElement.innerHTML = m + ':' + (s < 10 ? '0' : '') + s;
		scoreElement.innerHTML = "Score: " + world.player.score;
		levelElement.innerHTML = "Lev " + (world.level + 1);
		coinsElement.innerHTML = "coins: " + world.player.coins;
		givenElement.innerHTML = "given: " + world.player.given;
		rescuedElement.innerHTML = "resued: " + world.player.rescuedFloaters;

	}


}

function dist(a, b) {
	var x = a.xpos - b.xpos;
	var y = a.ypos - b.ypos;
	return Math.sqrt(x * x + y * y);
}

var hideNotification = false;
function showNotification(str) {
	var wrap = document.getElementById('notification-wrap');	
	var notif = document.getElementById('notification');	
	notif.innerHTML=str;
	wrap.className = "show";
	if (hideNotification) clearInterval(hideNotification);
	hideNotification = window.setInterval(function() {
		wrap.className = "hide";
	},3000);
}



//onLoad();

var imgSrc = ["/img/chest.svg", "/img/floater.svg", "/img/ship.svg"];
var imgsloaded = 0;
var gameImages = imgSrc.map(function(src) {
	var img = new Image();
	img.onerror = function(e) {
		debugger;
	}
	img.onload = function() {
		imgsloaded++;
		if (imgsloaded == imgSrc.length) onLoad();
	};
	img.src = src;
	return img;
});