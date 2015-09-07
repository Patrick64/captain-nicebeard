Number.prototype.mod = function mod(n) {
	return ((this % n) + n) % n;
}

function Tank(world, tankId, tankData, isPlayer, curTime, lastTank) {
	this.isPlayer = isPlayer;
	this.tokenCount = tankData ? tankData.tokenCount : 0;
	this.playerName = tankData ? tankData.playerName : "";
	this.angle = 245;
	// this.xpos = (world.width * Math.random() * 0.8) + 20;
	// this.ypos = (world.height * Math.random() * 0.8) + 20;
	var xy = world.landscape.findRandomPos(0, 25 + world.sealevel / 2);
	this.xpos = xy.x;
	this.ypos = xy.y;

	this.tankId = tankId;
	this.world = world;
	
	this.keyLeft = false;
	this.keyRight = false;
	this.keyShoot = false;
	this.velocity = 0;
	this.acceleration = 0;
	this.lastState = null;
	this.bullets = [];
	this.active = true;
	this.eventsQueue = {
		movements: [],
		gun: [],
		state: []
	};
	this.score = tankData ? tankData.score : 0;
	this.coins = 0;
	this.given = 0;
	this.rescuedFloaters = 0;

	// if (isPlayer) 
	// 	this.eventsQueue.state.push({worldTime:curTime,active:true,byTankId:null});


	this.events = {
		movements: tankData ? tankData.events.movements : [],
		gun: tankData ? new GameEvents(tankData.events.gun) : new GameEvents([]),
		state: tankData ? new GameEvents(tankData.events.state) : new GameEvents([]),
	}
	var firstState = this.events.state.getNextEvent();

	// forward sort by start time
	this.events.movements.sort(function(a, b) {
		if (a.startTime < b.startTime) return -1;
		else return 1;
	});
	this.curEventIndex = 0;
}

Tank.prototype.tick = function(g, delta, world, curTime) {
	if (this.active) {

			while (this.curEventIndex < this.events.movements.length && this.events.movements[this.curEventIndex].startTime < curTime) {
				var curEvent = this.events.movements[this.curEventIndex];
				this.setState(curEvent);
				this.curEventIndex++;
			}

		var newAngle = this.angle;


		// rotate/turn
		if (this.keyLeft) {
			newAngle = (this.angle - TURN_SPEED * delta) % 360;
			this.acceleration = ACCELERATION / 50;
			//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		} else if (this.keyRight) {
			newAngle = (this.angle + TURN_SPEED * delta) % 360;
			this.acceleration = ACCELERATION / 50;
			//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		} else {
			this.acceleration = ACCELERATION / 10;
		}



		// 
		
			this.velocity = this.velocity + (this.acceleration * delta);
		
		if (this.velocity > MAX_FORWARD) this.velocity = MAX_FORWARD;
		

		this.angle = newAngle;

		if (this.xpos < -50 || (this.xpos >= this.world.width + 50) ||
			(this.ypos < -50) || (this.ypos >= this.world.height + 50)) {
			this.angle = this.angle + 180;

		}

		// move forward/backward
		// 
		var xy =this.translatePosition(this, {x:0,y:this.velocity * 60 * delta}, this.angle);
		this.xpos = xy.x; this.ypos = xy.y;
		// var x = 0;
		
		// var y = this.velocity * 60 * delta;

		// var angleRads = this.angle * (Math.PI / 180.0);

		// var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
		// var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
		// 	//var prevX = this.xpos, prevY = this.ypos;
		// 	//var prevTerrainType = this.world.landscape.getTerrainType(this.translatePosition(-10,-50));
		// 	//this.tryMove(this.xpos+deltaX,this.ypos+deltaY,newAngle);
		// this.xpos += deltaX;
		// this.ypos += deltaY;

		if (this.getTerrainType() == 3) {
			this.crash(null,curTime);
			
		}
		//this.xpos += deltaX;
		//this.ypos += deltaY;
		//var terrainType = this.world.landscape.getTerrainType(this.translatePosition(-10,-50));
		//if (terrainType == 3 && prevTerrainType != 3) {
		//	this.xpos = prevX;
		//	this.ypos = prevY;
		//}
		var carLength = 100;
		this.wrapped = false;



		this.events.gun.forEachCurrentEvent(curTime, function(curEvent, prevEvent) {

			if (curEvent.isFired) {
				this.bullets.push(new Bullet(this, curEvent.startX, curEvent.startY, curEvent.angle, curTime, curEvent.startTime));
			}
		}.bind(this));

		this.events.state.forEachCurrentEvent(curTime, function(curEvent, prevEvent) {

				this.active = curEvent.active;
		}.bind(this));

		
			
		Object.keys(world.otherTanks).forEach(function(tankId) {
			var otherTank = world.otherTanks[tankId];
			if ( (dist(otherTank,this)<50 && otherTank.active) && (otherTank!=this) ) {
				this.crash(otherTank,curTime);
				otherTank.crash(this,curTime);
			}
		}.bind(this));

		

	}
	this.bullets.forEach(function(b) {
		b.tick(delta, world, curTime);
	});

}

Tank.prototype.crash = function(otherTank,curTime) {
	if (!this.isPlayer || curTime>2000) {
		this.eventsQueue.state.push({
			worldTime: curTime,
			active: false,
			byTankId: null
		});
		this.active = false;
	}
};

Tank.prototype.translatePosition = function(origin, translate, angle) {
	var angleRads = angle * (Math.PI / 180.0);
	var deltaX = translate.x * Math.cos(angleRads) - translate.y * Math.sin(angleRads)
	var deltaY = translate.x * Math.sin(angleRads) + translate.y * Math.cos(angleRads)
	return {
		x: origin.xpos + deltaX,
		y: origin.ypos + deltaY
	};
}



Tank.prototype.getTerrainType = function() {
	var bl = this.world.landscape.getTerrainType(this.translatePosition(this, {
		x: -10,
		y: -50
	}, this.angle));
	var br = this.world.landscape.getTerrainType(this.translatePosition(this, {
		x: 10,
		y: -50
	}, this.angle));
	var tl = this.world.landscape.getTerrainType(this.translatePosition(this, {
		x: -10,
		y: 50
	}, this.angle));
	var tr = this.world.landscape.getTerrainType(this.translatePosition(this, {
		x: 10,
		y: 50
	}, this.angle));
	return Math.max(bl, br, tl, tr);
}

Tank.prototype.fire = function(curTime, direction) {
	if (this.coins <= 0) {
		if (this.isPlayer) showNotification('No coins left. Collect the treasure chests.');
	} else {
		var bulletAngle = this.angle + (45 * direction);
		this.bullets.push(new Bullet(this, this.xpos, this.ypos, bulletAngle, curTime, curTime));
		this.eventsQueue.gun.push({
			isFired: true,
			worldTime: curTime,
			startX: this.xpos,
			startY: this.ypos,
			startTime: curTime,
			angle: bulletAngle,
		});
		this.coins--;
	}
}

Tank.prototype.bulletHit = function(bullet, curTime) {
	this.given++;
	this.score += 10;
	bullet.disableBullet(curTime);
}

Tank.prototype.tankHit = function(bullet, curTime) {
	//this.active = false;
	// this tank is hit by a bullet
	//	this.eventsQueue.state.push({worldTime:curTime,active:false,byTankId:bullet.tank.tankId});
	this.coins++;

}



Tank.prototype.setState = function(state) {
		this.angle = state.angle;
		this.xpos = state.xpos;
		this.ypos = state.ypos;

	if (this.lastState ) {
		this.keyLeft = state.keyLeft;
		this.keyRight = state.keyRight;
	}

	this.lastState = state;
	//this.velocity = state.velocity ;
	//this.acceleration = state.acceleration;
}

Tank.prototype.draw = function(g, worldTime) {
	//if (this.active) {
	var angleRads = this.angle * (Math.PI / 180.0);
	g.ctx.save();
	g.ctx.translate(this.xpos, this.ypos);
	
	g.ctx.rotate(angleRads);

	if (this.angle.mod(360) < 180) {
		g.ctx.rotate(-Math.PI / 2);
		// g.ctx.drawImage(gameImages[2],394/4/2,371/4/4,-394/4,-371/4);
	} else {
		g.ctx.rotate(Math.PI / 2);
		g.ctx.scale(-1, 1);
		// g.ctx.drawImage(gameImages[2],394/4/2,371/4/4,-394/4,-371/4);
	}
	if (!this.active) {
		g.ctx.scale(0.6, -1);
		g.ctx.globalAlpha = 0.5
	}


	if (this.isPlayer && worldTime<2000) {
			g.ctx.beginPath();
			g.ctx.strokeStyle= "rgba(128,255,128," + Math.abs(Math.sin(worldTime/200)) + ")";
			// + (20*Math.sin(worldTime/200))
			g.ctx.lineWidth = "10"
			g.ctx.arc(5, -10, 70 , 0, 2 * Math.PI, false);
			g.ctx.stroke();
		}

	g.ctx.drawImage(gameImages[0],0,0,126,118, 394 / 4 / 2, 371 / 4 / 4, -394 / 4, -371 / 4);
	//if (this.isPlayer) g.ctx.strokeRect(-25, -50, 50, 100);
	
	if (!this.isPlayer) {

		g.ctx.restore();
		g.ctx.save();

		g.ctx.translate(this.xpos, this.ypos);
		g.ctx.strokeStyle = "rgb(255,255,255)";

		g.ctx.font = "17px serif";
		var captionSize = g.ctx.measureText(this.playerName);
		g.ctx.fillStyle = 'rgba(0,0,0,0.5)';
		g.ctx.fillRect(-captionSize.width / 2 - 5, 40, captionSize.width + 10, 20);

		g.ctx.fillStyle = "#fff";

		g.ctx.fillText(this.playerName, -captionSize.width / 2, 55);
		
	} else {
		
	}

	g.ctx.restore();

	this.bullets.forEach(function(b) {
		b.draw(g, worldTime);
	});

};

Tank.prototype.handleKeys = function(g, curTime) {
	var lastKeyCombo = this.keyForward * 2 + this.keyReverse * 4 + this.keyLeft * 8 + this.keyRight * 16;
	// Support arrow keys, WASD and 2468
	this.keyLeft = !!(g.keysDown[37] || g.keysDown[65] || g.keysDown[52]);
	this.keyRight = !!(g.keysDown[39] || g.keysDown[68] || g.keysDown[54]);

	var curKeyCombo = this.keyForward * 2 + this.keyReverse * 4 + this.keyLeft * 8 + this.keyRight * 16;



	if (curKeyCombo != lastKeyCombo)
		this.recordTankState(curTime);


}

// Tank.prototype.hit = function(byTank) {
// 	this.active = false;

// }

Tank.prototype.recordTankState = function(curTime) {

	// set startTime and endTime for last event
	this.updateLastEventInQueue(curTime);
	this.eventsQueue.movements.push({
		tankId: this.tankId,
		startTime: curTime,
		endTime: curTime,
		angle: this.angle,
		xpos: this.xpos,
		ypos: this.ypos,
		keyLeft: this.keyLeft,
		keyRight: this.keyRight,
		velocity: this.velocity,
		acceleration: this.acceleration
	});
}

Tank.prototype.updateLastEventInQueue = function(curTime) {

	// set startTime and endTime for last event
	if (this.eventsQueue.movements.length) {
		var lastEvent = this.eventsQueue.movements[this.eventsQueue.movements.length - 1];
		lastEvent.startTime = Math.min(lastEvent.startTime, curTime);
		lastEvent.endTime = Math.max(lastEvent.endTime, curTime);
	}

}

// Tank.prototype.flushQueuedEvents = function(curTime) {
// 	this.eventsQueue = {
// 		movements: [],
// 		gun: [],
// 		state: []
// 	};
// 	this.recordTankState(curTime);
// }
Tank.prototype.toPlainObject = function() {
	return {
		active: this.active,
		eventsQueue: this.eventsQueue,
		score: this.score,
		coins: this.coins,
		given: this.given,
		rescuedFloaters: this.rescuedFloaters,
		playerName: this.playerName
	}
}