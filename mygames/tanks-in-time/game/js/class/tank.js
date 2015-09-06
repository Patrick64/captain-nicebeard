Number.prototype.mod = function mod(n) {
	return ((this % n) + n) % n;
}

function Tank(world, isForward, tankId, tankData, isPlayer, curTime, lastTank) {
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
	this.isForward = isForward;
	this.keyForward = false;
	this.keyReverse = false;
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
	this.score = 0;
	this.coins = 0;
	this.given = 0;
	this.rescuedFloaters = 0;

	// if (isPlayer) 
	// 	this.eventsQueue.state.push({worldTime:curTime,active:true,byTankId:null});


	this.events = {
		movements: tankData ? tankData.events.movements : [],
		gun: tankData ? new GameEvents(tankData.events.gun, world.isForward) : new GameEvents([], world.isForward),
		state: tankData ? new GameEvents(tankData.events.state, world.isForward) : new GameEvents([], world.isForward),
	}
	var firstState = this.events.state.getNextEvent();
	if (firstState != null) {
		//this.active = firstState.active;
		// if ()
		// if (world.isForward) {
		// 	if (firstState.active) 
		// }
	}
	// if (!this.isForward && this.events.state.getNextEvent() != null) {
	// 	this.active = this.events.state.getNextEvent().active;
	// }
	if (world.isForward) {
		// forward sort by start time
		this.events.movements.sort(function(a, b) {
			if (a.startTime < b.startTime) return -1;
			else return 1;
		});
	} else {
		// reverse sort by end time
		this.events.movements.sort(function(a, b) {

			if (a.endTime > b.endTime)
				return -1;
			else if (a.endTime < b.endTime)
				return 1;
			else if (a.startTime > b.startTime)
				return -1;
			else
				return 1;
			//return (b.endTime - a.endTime);
		});
	}
	this.curEventIndex = 0;
}

Tank.prototype.tick = function(g, delta, world, curTime) {
	if (this.active) {
		if (this.world.isForward) {
			while (this.curEventIndex < this.events.movements.length && this.events.movements[this.curEventIndex].startTime < curTime) {
				var curEvent = this.events.movements[this.curEventIndex];
				this.setState(curEvent);
				this.curEventIndex++;
			}
		} else {
			while (this.curEventIndex < this.events.movements.length && this.events.movements[this.curEventIndex].endTime > curTime) {
				var curEvent = this.events.movements[this.curEventIndex];
				this.setState(curEvent);
				this.curEventIndex++;
			}
		}

		var newAngle = this.angle;

		// 	if (this.keyForward)
		// 		//this.acceleration = this.isForward ? ACCELERATION : -ACCELERATION; 
		// //this.speed = Math.min(MAX_FORWARD, this.speed+ ((0.4*60)*delta) );
		//  else if (this.keyReverse)
		//  	//this.acceleration = this.isForward ? -ACCELERATION : ACCELERATION;
		// //this.speed = Math.max(MAX_REVERSE, this.speed-((0.4*60)*delta));
		//  else
		//  {
		// //this.speed *= 1-((0.02*60)*delta);

		// //this.acceleration = 0;

		//  }


		// rotate/turn
		if ((this.keyLeft && this.isForward) || (this.keyRight && !this.isForward)) {
			newAngle = (this.angle - TURN_SPEED * delta) % 360;
			this.acceleration = ACCELERATION / 50;
			//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		} else if ((this.keyLeft && !this.isForward) || (this.keyRight && this.isForward)) {
			newAngle = (this.angle + TURN_SPEED * delta) % 360;
			this.acceleration = ACCELERATION / 50;
			//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		} else {
			this.acceleration = ACCELERATION / 10;
		}



		// 
		if (this.acceleration) {
			this.velocity = this.velocity + (this.acceleration * delta);
		} else {
			//this.velocity = this.velocity * 0.98;
			if (Math.abs(this.velocity) < ACCELERATION * delta) {
				this.velocity = 0;
			} else {
				if (this.velocity > 0)
					this.velocity -= ACCELERATION * delta;
				else
					this.velocity += ACCELERATION * delta;
			}
		}
		if (this.velocity > MAX_FORWARD) this.velocity = MAX_FORWARD;
		if (this.velocity < MAX_REVERSE) this.velocity = MAX_REVERSE;

		this.angle = newAngle;

		if (this.xpos < -50 || (this.xpos >= this.world.width + 50) ||
			(this.ypos < -50) || (this.ypos >= this.world.height + 50)) {
			this.angle = this.angle + 180;

		}

		// move forward/backward
		var x = 0;
		//var y = (this.isForward ? this.velocity : -this.velocity)*60*delta;
		var y = this.velocity * 60 * delta;

		var angleRads = this.angle * (Math.PI / 180.0);

		var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
		var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
			//var prevX = this.xpos, prevY = this.ypos;
			//var prevTerrainType = this.world.landscape.getTerrainType(this.translatePosition(-10,-50));
			//this.tryMove(this.xpos+deltaX,this.ypos+deltaY,newAngle);
		this.xpos += deltaX;
		this.ypos += deltaY;

		if (this.getTerrainType() == 3) {
			this.eventsQueue.state.push({
				worldTime: curTime,
				active: false,
				byTankId: null
			});
			this.active = false;
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

			if (this.isForward && curEvent.isFired) {
				this.bullets.push(new Bullet(this.world.isForward, this, curEvent.startX, curEvent.startY, curEvent.angle, curTime, curEvent.startTime));
			} else if (!this.isForward && !curEvent.isFired) {
				this.bullets.push(new Bullet(this.world.isForward, this, curEvent.endX, curEvent.endY, curEvent.angle, curTime, curEvent.startTime));
			}
		}.bind(this));

		this.events.state.forEachCurrentEvent(curTime, function(curEvent, prevEvent) {

			if (this.isForward) {
				this.active = curEvent.active;
			} else if (!this.isForward && prevEvent) {
				this.active = prevEvent.active;
			}
		}.bind(this));
	}
	this.bullets.forEach(function(b) {
		b.tick(delta, world, curTime);
	});

}

Tank.prototype.translatePosition = function(origin, translate, angle) {
	var angleRads = angle * (Math.PI / 180.0);
	var deltaX = translate.x * Math.cos(angleRads) - translate.y * Math.sin(angleRads)
	var deltaY = translate.x * Math.sin(angleRads) + translate.y * Math.cos(angleRads)
	return {
		x: origin.xpos + deltaX,
		y: origin.ypos + deltaY
	};
}

Tank.prototype.tryMove = function(x, y, angle) {
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

	var newPos = {
		xpos: x,
		ypos: y
	};
	var bl2 = this.world.landscape.getTerrainType(this.translatePosition(newPos, {
		x: -10,
		y: -50
	}, angle));
	var br2 = this.world.landscape.getTerrainType(this.translatePosition(newPos, {
		x: 10,
		y: -50
	}, angle));
	var tl2 = this.world.landscape.getTerrainType(this.translatePosition(newPos, {
		x: -10,
		y: 50
	}, angle));
	var tr2 = this.world.landscape.getTerrainType(this.translatePosition(newPos, {
		x: 10,
		y: 50
	}, angle));
	var prev = (bl == 3 ? 1 : 0) + (br == 3 ? 1 : 0) + (tl == 3 ? 1 : 0) + (tr == 3 ? 1 : 0);
	var thisCount = (bl2 == 3 ? 1 : 0) + (br2 == 3 ? 1 : 0) + (tl2 == 3 ? 1 : 0) + (tr2 == 3 ? 1 : 0);
	if (thisCount <= prev) {
		this.xpos = x;
		this.ypos = y;
		this.angle = angle;
	}



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
		if (this.isPlayer) showNotification('Yarr I be out of booty.');
	} else {
		var bulletAngle = this.angle + (90 * direction);
		this.bullets.push(new Bullet(this.isForward, this, this.xpos, this.ypos, bulletAngle, curTime, curTime));
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

Tank.prototype.draw = function(g, worldTime) {
	//if (this.active) {
	var angleRads = this.angle * (Math.PI / 180.0);
	g.ctx.save();
	g.ctx.translate(this.xpos, this.ypos);
	g.ctx.rotate(angleRads);

	//g.ctx.drawImage(this.carImage, -carStraight.width/2, -carStraight.height/2);
	// if (this.isForward) g.ctx.fillStyle = "blue";
	// else g.ctx.fillStyle = "red";

	//g.ctx.fillStyle = 'rgb(' + Math.floor(255-42.5) + ',' +Math.floor(255-42.5) + ',0)';

	// 	g.ctx.fillRect(-25, -50, 50, 100);
	// else
	// 	g.ctx.strokeRect(-25, -50, 50, 100);
	// g.ctx.fillStyle = "grey";
	// g.ctx.fillRect(-5, 0, 10, 50);
	// g.ctx.strokeStyle = "rgb(255,200,100)";
	// g.ctx.lineWidth = 5;
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
	g.ctx.drawImage(gameImages[2], 394 / 4 / 2, 371 / 4 / 4, -394 / 4, -371 / 4);
	//if (this.isPlayer) g.ctx.strokeRect(-25, -50, 50, 100);
	g.ctx.restore();
	if (!this.isPlayer) {


		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		g.ctx.strokeStyle = "rgb(255,255,255)";

		g.ctx.font = "17px serif";
		var captionSize = g.ctx.measureText(this.playerName);
		g.ctx.fillStyle = 'rgba(0,0,0,0.5)';
		g.ctx.fillRect(-captionSize.width / 2 - 5, 40, captionSize.width + 10, 20);

		g.ctx.fillStyle = "#fff";

		g.ctx.fillText(this.playerName, -captionSize.width / 2, 55);
		g.ctx.restore();
	}

	this.bullets.forEach(function(b) {
		b.draw(g, worldTime);
	});

};

Tank.prototype.handleKeys = function(g, curTime) {
	var lastKeyCombo = this.keyForward * 2 + this.keyReverse * 4 + this.keyLeft * 8 + this.keyRight * 16;
	// Support arrow keys, WASD and 2468
	this.keyForward = !!(g.keysDown[38] || g.keysDown[87] || g.keysDown[50]);
	this.keyReverse = !!(g.keysDown[40] || g.keysDown[83] || g.keysDown[56]);
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
		//speed:this.speed,
		keyForward: this.keyForward,
		keyReverse: this.keyReverse,
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

Tank.prototype.flushQueuedEvents = function(curTime) {
	this.eventsQueue = {
		movements: [],
		gun: [],
		state: []
	};
	this.recordTankState(curTime);
}
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