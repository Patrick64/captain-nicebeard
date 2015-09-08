"use strict";

function Landscape(t, e, i, s, n) {
	this.multiplier = i, this.width = Math.floor(t / i), this.height = Math.floor(e / i), this.seed = s, this.canvas = gid("landscape"), this.mask = new Int32Array(this.width * this.height), this.sealevel = n
}

function GameEvents(t) {
	this.curEventIndex = 0, this.events = [], t && this.addEvents(t)
}

function World(t, e, i, s) {
	this.worldDuration = t.worldDuration, this.width = t.width, this.height = t.height, this.level = t.level, this.sealevel = t.sealevel, this.otherTanks = {}, this.tokens = {}, this.floaters = {}, this.landscapeSeed = t.landscapeSeed, this.landscape = new Landscape(this.width, this.height, 2, this.landscapeSeed, this.sealevel), this.player = new Tank(this, e.tankId, !1, !0, i, s), t.players.forEach(function(t) {
		this.otherTanks[t.tankId] = new Tank(this, t.tankId, t, !1, i)
	}.bind(this)), t.tokens.forEach(function(t) {
		this.tokens[t.tokenId] = new Token(t)
	}.bind(this)), t.floaters.forEach(function(t) {
		this.floaters[t.id] = new Floater(t)
	}.bind(this)), this.cameraX = this.player.xpos, this.cameraY = this.player.ypos, this.screenWidth = gid("goocanvas").width, this.screenHeight = gid("goocanvas").height, this.timeNotify = !1
}

function Bullet(t, e, i, s, n, a) {
	this.angle = s, this.tank = t, this.xpos = e, this.ypos = i, this.startX = e, this.startY = i, this.startTime = a, this.active = !0
}

function Tank(t, e, i, s, n, a) {
	this.isPlayer = s, this.tokenCount = i ? i.tokenCount : 0, this.playerName = i ? i.playerName : "", this.angle = 245;
	var o = t.landscape.findRandomPos(0, 25 + t.sealevel / 2);
	this.xpos = o.x, this.ypos = o.y, this.tankId = e, this.world = t, this.keyLeft = !1, this.keyRight = !1, this.keyShoot = !1, this.velocity = 0, this.acceleration = 0, this.lastState = null, this.bullets = [], this.active = !0, this.eventsQueue = {
		movements: [],
		gun: [],
		state: []
	}, this.score = i ? i.score : 0, this.coins = 0, this.given = 0, this.rescuedFloaters = 0, this.events = {
		movements: i ? i.events.movements : [],
		gun: new GameEvents(i ? i.events.gun : []),
		state: new GameEvents(i ? i.events.state : [])
	};
	this.events.state.getNextEvent();
	this.events.movements.sort(function(t, e) {
		return t.startTime < e.startTime ? -1 : 1
	}), this.curEventIndex = 0
}

function gid(t) {
	return document.getElementById(t)
}

function onLoad() {
	var t = new Landscape(screen.width, screen.height, 2, 2e3 * Math.random(), 5);
	t.render(), gid("nameform").onsubmit = function(t) {
		return gid("intro").style.display = "none", gid("info").style.display = "block", maingame.onKeyPress = function(t) {
			32 == g.keyCode && (gid("info").style.display = "none", gid("newLevel").style.display = "block", startGame(gid("nameinput").value))
		}, !1
	}
}

function startGame(t) {
	var e = io(document.location.href);
	maingame.endLevel = function(t, i) {
		if (gid("newLevel").style.display = "block", gid("overlay").className = "show", gid("press-space").style.display = "none", gid("press-space").innerHTML = i ? "Press space to restart game." : t ? "Press space to travel to next sea." : "Press space to retry this sea.", gid("loading-text").style.display = "block", gid("saying").innerHTML = pirateSayings[Math.floor(pirateSayings.length * Math.random())], !t || i) {
			if (gid("finalscore").innerText = (i ? "CONGRATULATIONS! You have completed all seven seas. Your final score is " : "You scored ") + maingame.playerScore, i) var s = "Shiver me timbers! I completed Captain Nicebeard and scored " + maingame.playerScore + ". Can you do better? " + window.location.href;
			else var s = "Yarr! I scored " + maingame.playerScore + " on Captain Nicebeard, the reverse pirate! " + window.location.href;
			var n = "http://twitter.com/home/?status=" + encodeURIComponent(s);
			gid("twit").innerText = "Post to Twitter: " + s, gid("twit").href = n, gid("tweetthis").className = "show"
		} else gid("tweetthis").className = "";
		gid("loading-text").style.display = "block", (!t || i) && (maingame.playerScore = 0), e.emit("new-game", {}, function() {})
	}, e.on("receive-game", function(i) {
		i.player.playerName = t, i.player.score = maingame.playerScore, newGame(i.world, i.player, e, maingame, i.lastTank, t, i.landscapeChanged)
	})
}

function newGame(t, e, i, s, n, a, o) {
	function r() {
		return Date.now() - l
	}

	function h() {
		function t(t) {
			var e = r();
			i.emit("tank-state", {
				eventQueues: p.getQueuedEvents(e),
				levelComplete: t,
				player: p.player.toPlainObject()
			})
		}

		function e(e) {
			var i = r();
			p.render(g, i), s.level = p.level, s.onDraw = function() {}, s.onKeyPress = function(t) {}, p.player.recordTankState(i), window.setTimeout(function() {
				t(e), s.endLevel(e, 6 == p.level && e)
			}, 1e3)
		}
		l = Date.now(), showNotification("Sea number " + (p.level + 1) + " ahoy!");
		var n = r();
		p.player.recordTankState(n), s.onKeyPress = function(t) {
			122 == t.keyCode && p.player.fire(r(), -1), 120 == t.keyCode && p.player.fire(r(), 1)
		};
		Date.now();
		s.onDraw = function(t) {
			var i = r();
			p.render(t, i), p.player.active || (showNotification("Yar! We be scuttled."), e(!1)), i > p.worldDuration && (showNotification("Out of time!"), e(!1)), p.player.rescuedFloaters >= RESCUE_GOAL && (showNotification("Yarr! Sea " + (p.level + 1) + " complete. "), e(!0)), s.playerScore = p.player.score, c()
		}
	}

	function c() {
		var t = (p.worldDuration - r()) / 1e3,
			e = Math.floor(t / 60),
			i = Math.floor(t % 60);
		d.innerHTML = e + ":" + (10 > i ? "0" : "") + i, u.innerHTML = "Score: " + p.player.score, y.innerHTML = "Coins: " + p.player.coins
	}
	var l = Date.now(),
		d = gid("worldTime"),
		u = gid("score"),
		y = gid("coins"),
		p = new World(t, e, r(), n);
	p.player.playerName = a, p.player.score = e.score, p.renderLandscape(), gid("press-space").style.display = "block", gid("loading-text").style.display = "none", s.onKeyPress = function(t) {
		32 == t.keyCode && (gid("overlay").className = "", h())
	}
}

function dist(t, e) {
	var i = t.xpos - e.xpos,
		s = t.ypos - e.ypos;
	return Math.sqrt(i * i + s * s)
}

function showNotification(t) {
	var e = gid("notification-wrap"),
		i = gid("notification");
	i.innerHTML = t, e.className = "show", hideNotification && clearInterval(hideNotification), hideNotification = window.setInterval(function() {
		e.className = "hide"
	}, 3e3)
}
var pirateSayings = ["Yarr! No rum for me thanks, I'm tee-total.", "Batten down the hatches! It's movie night.", "Avast ye scurvy dogs. I be challenging ye to a game scrabble.", "Spanish gallion yonder. Let us visit for tea and polite chat.", "No need to loot anymore, ship mates. Our friendship is the real treasure.", "This be no eye patch, it's the new Google Glass", "Yarr! Welcome aboard, we have free wifi.", "Pieces of silver can't buy you happiness.", "No need for keelhauling, let's settle our differences amicably."],
	Goo = function(t) {
		function e() {
			o();
			var t = a();
			i.onDraw && i.onDraw(i, t), i.animate && (r++ > 60 && (i.fps = r / (t - h) * 1e3, i.onFrameRate && i.onFrameRate(i), r = 0, h = t), n(e))
		}
		var i = this;
		if (i.type = "2d", i.animate = !0, i.fullscreen = !1, i.keysDown = {}, i.userData = {}, t)
			for (var s in t) t.hasOwnProperty(s) && (i[s] = t[s]);
		if (i.canvas = document.createElement("canvas"), i.canvas.id = "goocanvas", i.canvas && (i.ctx = i.canvas.getContext(i.type)), !i.canvas || !i.ctx && i.onFailure) return void i.onFailure();
		i.canvas.width = i.width, i.canvas.height = i.height, Object.defineProperty(i, "width", {
			get: function() {
				return i.canvas.width
			},
			set: function(t) {
				i.canvas.width = t
			}
		}), Object.defineProperty(i, "height", {
			get: function() {
				return i.canvas.height
			},
			set: function(t) {
				i.canvas.height = t
			}
		}), i.fullscreen && (i.container = document.body, document.body.style.margin = "0px", document.body.style.padding = "0px", document.body.style.overflow = "hidden"), i.container && i.container.appendChild(i.canvas);
		var n = function() {
				var t = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
				return t || (t = function(t) {
					window.setTimeout(t, 1e3 / 30)
				}), t
			}(),
			a = Date.now ? Date.now : function() {
				return (new Date).getTime()
			};
		document.addEventListener("keydown", function(t) {
			i.keyCode = t.keyCode, i.key = String.fromCharCode(i.keyCode), i.keysDown[i.keyCode] = !0, i.onKeyDown && i.onKeyDown(i)
		}, !1), document.addEventListener("keyup", function(t) {
			i.keyCode = t.keyCode, i.key = String.fromCharCode(i.keyCode), delete i.keysDown[i.keyCode], i.onKeyUp && i.onKeyUp(i)
		}, !1), document.addEventListener("keypress", function(t) {
			i.keyCode = t.keyCode, i.key = String.fromCharCode(i.keyCode), i.onKeyPress && i.onKeyPress(i)
		}, !1);
		var o = function() {
				if (i.fullscreen) {
					var t = window.innerWidth,
						e = window.innerHeight;
					i.canvas.width != t && (i.canvas.width = t), i.canvas.height != e && (i.canvas.height = e)
				}
			},
			r = 0,
			h = a();
		n(e)
	};
Landscape.prototype.findRandomPos = function(t, e) {
	noise.seed(this.seed);
	do {
		var i = Math.floor(Math.random() * this.width * this.multiplier),
			s = Math.floor(Math.random() * this.height * this.multiplier),
			n = Math.abs(noise.perlin2(i / 600, s / 600));
		n *= 256, n = Math.min(256, n + this.sealevel)
	} while (t > n || n > e);
	return {
		x: i,
		y: s
	}
}, Landscape.prototype.render = function() {
	this.canvas.width = this.width, this.canvas.height = this.height, this.canvas.style.width = this.width * this.multiplier + "px", this.canvas.style.height = this.height * this.multiplier + "px";
	var t = this.canvas.getContext("2d"),
		e = t.createImageData(this.width, this.height),
		i = e.data;
	Date.now();
	noise.seed(this.seed);
	for (var s = 0; s < this.width; s++)
		for (var n = 0; n < this.height; n++) {
			var a = Math.abs(noise.perlin2(s / (600 / this.multiplier), n / (600 / this.multiplier)));
			a *= 256, a = Math.min(256, a + this.sealevel);
			var o, r = Math.abs(noise.perlin2(s / 20, n / 20)),
				h = 4 * (s + n * this.width),
				c = Math.random();
			o = a > 80 ? 3 : 2, a > 110 - 10 * c ? (a -= 20 * c, i[h] = 0, i[h + 1] = a, i[h + 2] = 0) : a > 80 || Math.floor(a) == Math.floor(77 - 3 * c) ? (i[h] = 255 - 10 * Math.random() - (a - 80), i[h + 1] = i[h], i[h + 2] = Math.max(0, 255 - 30 * (a - 80)) + -(20 * r)) : (a -= 20 * Math.random(), i[h] = 0, i[h + 1] = 0, i[h + 2] = 235 - 20 * r - 20 * Math.random() - Math.abs(.6 * a - 30)), this.mask[s + n * this.width] = o, i[h + 3] = 255
		}
	Date.now();
	t.fillColor = "#000", t.fillRect(0, 0, 1e4, 1e4), t.putImageData(e, 0, 0)
}, Landscape.prototype.move = function(t, e) {
	this.canvas.style.left = -t, this.canvas.style.top = -e
}, Landscape.prototype.getTerrainType = function(t) {
	return t.x > 0 && t.x < this.width * this.multiplier && t.y > 0 && t.y < this.height * this.multiplier ? this.mask[Math.floor(t.x / this.multiplier) + Math.floor(t.y / this.multiplier) * this.width] : 0
}, GameEvents.prototype.forEachCurrentEvent = function(t, e) {
	for (; this.curEventIndex < this.events.length && this.events[this.curEventIndex].worldTime < t;) {
		var i = this.events[this.curEventIndex],
			s = this.curEventIndex > 0 ? this.events[this.curEventIndex - 1] : null;
		e(i, s), this.curEventIndex++
	}
}, GameEvents.prototype.getNextEvent = function() {
	return this.curEventIndex >= 0 && this.curEventIndex < this.events.length ? this.events[this.curEventIndex] : null
}, GameEvents.prototype.addEvents = function(t) {
	this.events = t, this.events.sort(function(t, e) {
		return t.worldTime < e.worldTime ? -1 : 1
	})
}, World.prototype.renderLandscape = function() {
	this.landscape.render()
}, World.prototype.render = function(t, e) {
	this.cameraX = Math.max(0, this.player.xpos - this.screenWidth / 2), this.cameraY = Math.max(0, this.player.ypos - this.screenHeight / 2), this.cameraX = Math.min(this.cameraX, this.width - this.screenWidth), this.cameraY = Math.min(this.cameraY, this.height - this.screenHeight), this.landscape.move(this.cameraX, this.cameraY), t.ctx.clearRect(0, 0, t.width, t.height), t.ctx.save(), t.ctx.translate(-this.cameraX, -this.cameraY);
	var i = Date.now();
	this.lastFrameTime || (this.lastFrameTime = i);
	var s = (i - this.lastFrameTime) / 1e3;
	this.lastFrameTime = i, e > .9 * this.worldDuration && !this.timeNotify && (this.timeNotify = !0, showNotification("Time is running out!!")), Object.keys(this.tokens).forEach(function(i) {
		this.tokens[i].compareTank(this.player, e), this.tokens[i].tick(s, e), this.tokens[i].draw(t, e)
	}.bind(this)), Object.keys(this.floaters).forEach(function(i) {
		this.floaters[i].compareTank(this.player, e), this.floaters[i].tick(s, e), this.floaters[i].draw(t, e)
	}.bind(this)), Object.keys(this.otherTanks).forEach(function(i) {
		this.otherTanks[i].tick(t, s, this, e), this.otherTanks[i].draw(t, e)
	}.bind(this)), this.player.handleKeys(t, e), this.player.tick(t, s, this, e), this.player.draw(t, e), t.ctx.restore()
}, World.prototype.getQueuedEvents = function(t) {
	return this.player.updateLastEventInQueue(t), {
		player: this.player.eventsQueue,
		tokens: Object.keys(this.tokens).reduce(function(t, e) {
			return t[e] = this.tokens[e].eventsQueue, t
		}.bind(this), {}),
		floaters: Object.keys(this.floaters).reduce(function(t, e) {
			return t[e] = this.floaters[e].eventsQueue, t
		}.bind(this), {})
	}
}, Bullet.prototype.tick = function(t, e, i) {
	if (this.active) {
		for (var s = 0; 10 > s; s++) {
			var n = 0,
				a = 30 * t;
			a = -a;
			var o = (180 + this.angle) * (Math.PI / 180),
				r = n * Math.cos(o) - a * Math.sin(o),
				h = n * Math.sin(o) + a * Math.cos(o);
			this.xpos += r, this.ypos += h, Object.keys(e.otherTanks).forEach(function(t) {
				var s = e.otherTanks[t];
				dist(s, this) < 50 && s.active && s != this && this.hitTank(s, i)
			}.bind(this)), this.tank.isPlayer || dist(e.player, this) < 40 && this.hitTank(e.player, i), 3 == e.landscape.getTerrainType({
				x: this.xpos,
				y: this.ypos
			}) && this.disableBullet(i)
		}(this.xpos < -50 || this.ypos < -50 || this.xpos > e.width + 50 || this.ypos > e.height + 50) && this.disableBullet(i)
	}
}, Bullet.prototype.hitTank = function(t, e) {
	this.disableBullet(e), this.tank.bulletHit(this, e), t.tankHit(this, e)
}, Bullet.prototype.disableBullet = function(t) {
	this.active = !1
}, Bullet.prototype.draw = function(t, e) {
	this.active && (t.ctx.save(), t.ctx.translate(this.xpos, this.ypos), t.ctx.scale(1, .2 + (Math.cos((e - this.startTime) / 200) - .2)), t.ctx.fillStyle = "#B88A0E", t.ctx.beginPath(), t.ctx.strokeStyle = "#FDF1BF", t.ctx.arc(10, 10, 10, 0, 2 * Math.PI, !1), t.ctx.stroke(), t.ctx.fill(), t.ctx.beginPath(), t.ctx.fillStyle = "#DC8D24", t.ctx.arc(8, 8, 10, 0, 2 * Math.PI, !1), t.ctx.stroke(), t.ctx.fill(), t.ctx.fillStyle = "#FFEEBA", t.ctx.font = "20px serif", t.ctx.fillText(String.fromCharCode(9733), 0, 15), t.ctx.restore())
}, Number.prototype.mod = function(t) {
	return (this % t + t) % t
}, Tank.prototype.tick = function(t, e, i, s) {
	if (this.active) {
		for (; this.curEventIndex < this.events.movements.length && this.events.movements[this.curEventIndex].startTime < s;) {
			var n = this.events.movements[this.curEventIndex];
			this.setState(n), this.curEventIndex++
		}
		var a = this.angle;
		this.keyLeft ? (a = (this.angle - TURN_SPEED * e) % 360, this.acceleration = ACCELERATION / 50) : this.keyRight ? (a = (this.angle + TURN_SPEED * e) % 360, this.acceleration = ACCELERATION / 50) : this.acceleration = ACCELERATION / 10, this.velocity = this.velocity + this.acceleration * e, this.velocity > MAX_FORWARD && (this.velocity = MAX_FORWARD), this.angle = a, (this.xpos < -50 || this.xpos >= this.world.width + 50 || this.ypos < -50 || this.ypos >= this.world.height + 50) && (this.angle = this.angle + 180);
		var o = this.translatePosition(this, {
			x: 0,
			y: 60 * this.velocity * e
		}, this.angle);
		this.xpos = o.x, this.ypos = o.y, 3 == this.getTerrainType() && this.crash(null, s);
		this.wrapped = !1, this.events.gun.forEachCurrentEvent(s, function(t, e) {
			t.isFired && this.bullets.push(new Bullet(this, t.startX, t.startY, t.angle, s, t.startTime))
		}.bind(this)), this.events.state.forEachCurrentEvent(s, function(t, e) {
			this.active = t.active
		}.bind(this)), Object.keys(i.otherTanks).forEach(function(t) {
			var e = i.otherTanks[t];
			dist(e, this) < 50 && e.active && e != this && (this.crash(e, s), e.crash(this, s))
		}.bind(this))
	}
	this.bullets.forEach(function(t) {
		t.tick(e, i, s)
	})
}, Tank.prototype.crash = function(t, e) {
	(!this.isPlayer || e > 2e3) && (this.eventsQueue.state.push({
		worldTime: e,
		active: !1,
		byTankId: null
	}), this.active = !1)
}, Tank.prototype.translatePosition = function(t, e, i) {
	var s = i * (Math.PI / 180),
		n = e.x * Math.cos(s) - e.y * Math.sin(s),
		a = e.x * Math.sin(s) + e.y * Math.cos(s);
	return {
		x: t.xpos + n,
		y: t.ypos + a
	}
}, Tank.prototype.getTerrainType = function() {
	var t = this.world.landscape.getTerrainType(this.translatePosition(this, {
			x: -10,
			y: -50
		}, this.angle)),
		e = this.world.landscape.getTerrainType(this.translatePosition(this, {
			x: 10,
			y: -50
		}, this.angle)),
		i = this.world.landscape.getTerrainType(this.translatePosition(this, {
			x: -10,
			y: 50
		}, this.angle)),
		s = this.world.landscape.getTerrainType(this.translatePosition(this, {
			x: 10,
			y: 50
		}, this.angle));
	return Math.max(t, e, i, s)
}, Tank.prototype.fire = function(t, e) {
	if (this.coins <= 0) this.isPlayer && showNotification("No coins left. Collect the treasure chests.");
	else {
		var i = this.angle + 45 * e;
		this.bullets.push(new Bullet(this, this.xpos, this.ypos, i, t, t)), this.eventsQueue.gun.push({
			isFired: !0,
			worldTime: t,
			startX: this.xpos,
			startY: this.ypos,
			startTime: t,
			angle: i
		}), this.coins--
	}
}, Tank.prototype.bulletHit = function(t, e) {
	this.given++, this.score += 10, t.disableBullet(e)
}, Tank.prototype.tankHit = function(t, e) {
	this.coins++
}, Tank.prototype.setState = function(t) {
	this.angle = t.angle, this.xpos = t.xpos, this.ypos = t.ypos, this.lastState && (this.keyLeft = t.keyLeft, this.keyRight = t.keyRight), this.lastState = t
}, Tank.prototype.draw = function(t, e) {
	var i = this.angle * (Math.PI / 180);
	if (t.ctx.save(), t.ctx.translate(this.xpos, this.ypos), t.ctx.rotate(i), this.angle.mod(360) < 180 ? t.ctx.rotate(-Math.PI / 2) : (t.ctx.rotate(Math.PI / 2), t.ctx.scale(-1, 1)), this.active || (t.ctx.scale(.6, -1), t.ctx.globalAlpha = .5), this.isPlayer && 2e3 > e && (t.ctx.beginPath(), t.ctx.strokeStyle = "rgba(128,255,128," + Math.abs(Math.sin(e / 200)) + ")", t.ctx.lineWidth = "10", t.ctx.arc(5, -10, 70, 0, 2 * Math.PI, !1), t.ctx.stroke()), t.ctx.drawImage(gameImages[0], 0, 0, 126, 118, 49.25, 23.1875, -98.5, -92.75), !this.isPlayer) {
		t.ctx.restore(), t.ctx.save(), t.ctx.translate(this.xpos, this.ypos), t.ctx.strokeStyle = "rgb(255,255,255)", t.ctx.font = "17px serif";
		var s = t.ctx.measureText(this.playerName);
		t.ctx.fillStyle = "rgba(0,0,0,0.5)", t.ctx.fillRect(-s.width / 2 - 5, 40, s.width + 10, 20), t.ctx.fillStyle = "#fff", t.ctx.fillText(this.playerName, -s.width / 2, 55)
	}
	t.ctx.restore(), this.bullets.forEach(function(i) {
		i.draw(t, e)
	})
}, Tank.prototype.handleKeys = function(t, e) {
	var i = 2 * this.keyForward + 4 * this.keyReverse + 8 * this.keyLeft + 16 * this.keyRight;
	this.keyLeft = !!(t.keysDown[37] || t.keysDown[65] || t.keysDown[52]), this.keyRight = !!(t.keysDown[39] || t.keysDown[68] || t.keysDown[54]);
	var s = 2 * this.keyForward + 4 * this.keyReverse + 8 * this.keyLeft + 16 * this.keyRight;
	s != i && this.recordTankState(e)
}, Tank.prototype.recordTankState = function(t) {
	this.updateLastEventInQueue(t), this.eventsQueue.movements.push({
		tankId: this.tankId,
		startTime: t,
		endTime: t,
		angle: this.angle,
		xpos: this.xpos,
		ypos: this.ypos,
		keyLeft: this.keyLeft,
		keyRight: this.keyRight,
		velocity: this.velocity,
		acceleration: this.acceleration
	})
}, Tank.prototype.updateLastEventInQueue = function(t) {
	if (this.eventsQueue.movements.length) {
		var e = this.eventsQueue.movements[this.eventsQueue.movements.length - 1];
		e.startTime = Math.min(e.startTime, t), e.endTime = Math.max(e.endTime, t)
	}
}, Tank.prototype.toPlainObject = function() {
	return {
		active: this.active,
		eventsQueue: this.eventsQueue,
		score: this.score,
		coins: this.coins,
		given: this.given,
		rescuedFloaters: this.rescuedFloaters,
		playerName: this.playerName
	}
};
var Token = Class.extend({
		init: function(t) {
			this.xpos = t.xpos, this.ypos = t.ypos, this.events = new GameEvents(t.events), this.eventsQueue = [];
			var e = this.events.getNextEvent();
			null == e ? this.visible = !0 : (this.runEvent(e), this.visible = !this.visible)
		},
		draw: function(t, e) {
			if (this.visible) {
				t.ctx.save(), t.ctx.translate(this.xpos, this.ypos);
				var i = ((e + 100 * this.ypos) % 1e3 > 500 ? 500 - (e + 100 * this.ypos) % 500 : (e + 100 * this.ypos) % 500) / 1e3;
				t.ctx.scale(1 + i, 1 + .8 * i), t.ctx.drawImage(gameImages[0], 0, 191, 106, 109, -20.6875, -21.1875, 331 / 8, 339 / 8), t.ctx.restore()
			}
		},
		tick: function(t, e) {
			this.events.forEachCurrentEvent(e, function(t) {
				this.runEvent(t)
			}.bind(this))
		},
		runEvent: function(t) {
			this.visible = t.visible
		},
		compareTank: function(t, e) {
			dist(this, t) < 50 && this.visible && (this.visible = !1, this.eventsQueue.push({
				worldTime: e,
				visible: this.visible,
				tankId: t.tankId
			}), this.tankHit(t, e))
		},
		tankHit: function(t, e) {
			t.coins += 10, t.isPlayer && showNotification("Booty retrieved. Press Z / X to give gold to fellow ships.")
		},
		toPlainObject: function() {}
	}),
	Floater = Token.extend({
		init: function(t) {
			this._super(t, !1)
		},
		draw: function(t, e) {
			if (this.visible) {
				t.ctx.save(), t.ctx.translate(this.xpos, this.ypos);
				var i = ((e + 100 * this.ypos) % 1e3 > 500 ? 500 - (e + 100 * this.ypos) % 500 : (e + 100 * this.ypos) % 500) / 500;
				t.ctx.rotate(i - .5), t.ctx.drawImage(gameImages[0], 0, 125, 112, 62, -29.25, -229 / 6 / 2, 58.5, 229 / 6), t.ctx.restore()
			}
		},
		tankHit: function(t, e) {
			t.rescuedFloaters++, t.score += 10, t.isPlayer && showNotification("Shipmate rescued. " + (RESCUE_GOAL - t.rescuedFloaters) + " to go!")
		}
	}),
	MAX_FORWARD = 3,
	ACCELERATION = 10,
	TURN_SPEED = 80,
	RESCUE_GOAL = 10,
	maingame = {
		onDraw: function(t) {},
		endLevel: function() {},
		level: 0,
		playerScore: 0,
		onKeyPress: function(t) {}
	},
	g = new Goo({
		fullscreen: !0,
		onDraw: function(t) {
			maingame.onDraw(t)
		},
		onKeyPress: function(t) {
			maingame.onKeyPress(t)
		}
	}),
	hideNotification = !1,
	imgSrc = ["/img/sprites.svg"],
	imgsloaded = 0,
	gameImages = imgSrc.map(function(t) {
		var e = new Image;
		return e.onerror = function(t) {}, e.onload = function() {
			imgsloaded++, imgsloaded == imgSrc.length && onLoad()
		}, e.src = t, e
	});