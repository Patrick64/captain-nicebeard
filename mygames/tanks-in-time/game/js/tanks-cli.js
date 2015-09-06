'use strict';

var MAX_FORWARD = 3.0;
var ACCELERATION = 10;
var TURN_SPEED = 80;
var RESCUE_GOAL = 10;



var maingame = {
	onDraw: function(g) {},
	endLevel: function() {

		//socket.emit('new-game', {},function() {});

	},
	level:0,
	playerScore: 0,
	onKeyPress: function(key) {}
}
var g = new Goo({
	fullscreen: true,
	onDraw: function(g) {
		maingame.onDraw(g);
	},
	onKeyPress: function(g) {
		maingame.onKeyPress(g);
	}
});

// get elemnt by id
function gid(id) {
	return document.getElementById(id);
}


function onLoad() {
	var l = new Landscape(screen.width, screen.height, 2, Math.random() * 2000,5);
	l.render();
	gid('nameform').onsubmit = function(e) {
		gid('intro').style.display = 'none';
		gid('info').style.display = 'block';
		maingame.onKeyPress = function(key) {
			if (!!(g.keyCode == 32)) {
				gid('info').style.display = 'none';
				//gid('overlay').style.display  = 'none';
				gid('newLevel').style.display = 'block';
				startGame(gid('nameinput').value);
			}
		}

		return false;
	};
}


function startGame(playerName) {
	// Connect to the server:
	var socket = io(document.location.href);
	var prevLevel = -1;
	maingame.endLevel = function(levelComplete,gameComplete) {
		gid('newLevel').style.display = 'block';
		gid('overlay').className = 'show';
		gid('press-space').style.display = 'none';
		gid('press-space').innerHTML = gameComplete ? "Press space to restart game." : (levelComplete ? "Press space to travel to next sea." : "Press space to retry this sea.") ;
		gid('loading-text').style.display = 'block';
		gid('saying').innerHTML = pirateSayings[Math.floor(pirateSayings.length*Math.random())];
		if (!levelComplete || gameComplete) {
			gid('finalscore').innerText = 
			(gameComplete ? "CONGRATULATIONS! You have completed all seven seas. Your final score is " : "You scored ")
			 + maingame.playerScore;	
			if (gameComplete)
				var status = "Shiver me timbers! I completed Captain Nicebeard and scored " + maingame.playerScore + ". Can you do better? " + window.location.href;
			else
				var status = "Yarr! I scored " + maingame.playerScore + " on Captain Nicebeard, the reverse pirate! " + window.location.href;
			var twit = "http://twitter.com/home/?status=" + encodeURIComponent(status);
			gid('twit').innerText = "Post to Twitter: " + status;	
			gid('twit').href = twit;	
			gid('tweetthis').className = 'show';
		} else {
			gid('tweetthis').className = '';
		}
		gid('loading-text').style.display = 'block';

		if (!levelComplete || gameComplete) maingame.playerScore = 0;
		socket.emit('new-game', {}, function() {});
		
	};
	socket.on('receive-game', function(data) {
		//log.innerHTML += '<li>Received: '+ JSON.stringify(data) +'</li>';
		//var game =  JSON.parse(data);
		data.player.playerName = playerName;
		data.player.score = maingame.playerScore;
		newGame(data.world, data.player, socket, maingame, data.lastTank,playerName,data.landscapeChanged);
		
	});

}

function newGame(worldData, player, socket, maingame, lastTank, playerName, landscapeChanged) {
	var startTime = Date.now();

	function getCurTime() {
		
			return Date.now() - startTime;
		
	}

	var curEventIndex = 0;
	// var eventsQueue = [];
	var timerElement = gid('worldTime');
	var scoreElement = gid('score');
	var coinsElement = gid('coins');
	
	var world = new World(worldData, player, getCurTime(), lastTank);
	world.player.playerName = playerName;
	world.player.score = player.score;
	//if (landscapeChanged) 
	world.renderLandscape();

	gid('press-space').style.display = 'block';
	gid('loading-text').style.display = 'none';
	maingame.onKeyPress = function(g) {
		if (!!(g.keyCode == 32)) {
			gid('overlay').className = '';
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
			world.render(g, curTime);
			
			maingame.level = world.level;
			// if (levelComplete)
			// 	showNotification("Sea number " + (world.level+1) + " complete!");
			// 	//gid('newLevTitle').innerHTML="Sea number " + world.level + " Complete!";
			// else
			// 	showNotification("Yar! We be scuttled.");
			// 	//gid('newLevTitle').innerHTML="You crashed!";
			
			maingame.onDraw = function() {};
			maingame.onKeyPress = function(g) {};
			clearInterval(sendStateInterval);
			world.player.recordTankState(curTime);
			
			window.setTimeout(function() {
				sendGameState(levelComplete);
				maingame.endLevel(levelComplete,(world.level==6 && levelComplete));
			}, 1000);
			
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



			if (!world.player.active) {
				showNotification("Yar! We be scuttled.");
				endLevel(false);
			}
			if ((curTime > world.worldDuration)) {
				showNotification("Out of time!");
				endLevel(false);
			}

			if (world.player.rescuedFloaters >= RESCUE_GOAL) {
				showNotification("Yarr! Sea " + (world.level+1) + " complete. ");
				endLevel(true);
			}
			maingame.playerScore = world.player.score;
			updateTimer();
		}
	}

	function updateTimer() {
		var t =  (world.worldDuration - getCurTime()) / 1000;
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		timerElement.innerHTML = m + ':' + (s < 10 ? '0' : '') + s;
		scoreElement.innerHTML = "Score: " + world.player.score;
		
		coinsElement.innerHTML = "Coins: " + world.player.coins;
		
		

	}


}

function dist(a, b) {
	var x = a.xpos - b.xpos;
	var y = a.ypos - b.ypos;
	return Math.sqrt(x * x + y * y);
}

var hideNotification = false;
function showNotification(str) {
	var wrap = gid('notification-wrap');	
	var notif = gid('notification');	
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