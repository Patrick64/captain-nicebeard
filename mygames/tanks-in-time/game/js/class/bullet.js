function Bullet(isForward,tank,xpos,ypos,angle,curTime,startTime) {
	this.isForward = isForward;
	this.angle = angle;
	this.tank = tank;
	this.xpos = xpos;
	this.ypos = ypos;
	this.startX = xpos;
	this.startY = ypos;
	this.startTime = startTime;
	this.active = true;	

}

Bullet.prototype.tick = function(delta,world,curTime) {
	if (this.active) {
		
			for (var i =0; i<10; i++) {
				var x= 0;
				var y = 0.5*60*delta;
				if (this.tank.isForward) y=-y;

				var angleRads = (180+this.angle) * (Math.PI / 180.0);
				
				var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
				var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
				
				this.xpos += deltaX;
				this.ypos += deltaY;

				if (this.tank.isForward) {
					Object.keys(world.otherTanks).forEach(function(tankId) {
						var otherTank = world.otherTanks[tankId];
						if ( (dist(otherTank,this)<40 && otherTank.active) && (otherTank!=this) ) {
							
							this.hitTank(otherTank,curTime);

						}

					}.bind(this));

					if (!this.tank.isPlayer) {
						if ( (dist(world.player,this)<40 ) ) {
							this.hitTank(world.player,curTime);
						}
					}
				}
			}
		if (this.xpos<50 || this.ypos<50 || this.xpos > world.width-50 || this.ypos > world.height-50) {
			this.disableBullet(curTime);
		}
		if (!this.tank.isForward) {
			if (this.tank.world.isForward) {
				if (curTime > this.startTime) this.disableBullet(curTime);
			} else {
				if (curTime < this.startTime) this.disableBullet(curTime);
			}
		}
	}

}

Bullet.prototype.hitTank = function(otherTank,curTime) {
	this.disableBullet(curTime);
	//this.tank.bulletHit(this,curTime);
	
	otherTank.tankHit(this,curTime);

}

Bullet.prototype.disableBullet = function(curTime) {
	this.active = false;
	this.tank.eventsQueue.gun.push({
		isFired:false,
		worldTime: curTime,
		startX:this.startX,
		startY:this.startY,
		endX:this.xpos,
		endY:this.ypos,
		angle:this.angle,
		startTime:this.startTime
	});
}
Bullet.prototype.draw = function(g) {
	if (this.active) {
		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		
			
		//g.ctx.fillStyle = "red";
		if (this.tank.isForward) g.ctx.fillStyle = "blue"; else g.ctx.fillStyle = "red";
			
		g.ctx.beginPath();
		g.ctx.arc(10, 10, 10, 0, 2 * Math.PI, false);
		g.ctx.stroke();
		g.ctx.fill();
			
		  g.ctx.restore();
		}

}
