function Bullet(tank,xpos,ypos,angle,curTime,startTime) {
	
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
				y=-y;

				var angleRads = (180+this.angle) * (Math.PI / 180.0);
				
				var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
				var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
				
				this.xpos += deltaX;
				this.ypos += deltaY;

				
					Object.keys(world.otherTanks).forEach(function(tankId) {
						var otherTank = world.otherTanks[tankId];
						if ( (dist(otherTank,this)<50 && otherTank.active) && (otherTank!=this) ) {
							
							this.hitTank(otherTank,curTime);

						}

					}.bind(this));

					if (!this.tank.isPlayer) {
						if ( (dist(world.player,this)<40 ) ) {
							this.hitTank(world.player,curTime);
						}
					}
					if (world.landscape.getTerrainType({x:this.xpos,y:this.ypos})==3) {
						this.disableBullet(curTime);
					}
				
			}
		if (this.xpos<-50 || this.ypos<-50 || this.xpos > world.width+50 || this.ypos > world.height+50) {
			this.disableBullet(curTime);
		}
		
	}

}

Bullet.prototype.hitTank = function(otherTank,curTime) {
	this.disableBullet(curTime);
	this.tank.bulletHit(this,curTime);
	
	otherTank.tankHit(this,curTime);

}

Bullet.prototype.disableBullet = function(curTime) {
	this.active = false;
}
Bullet.prototype.draw = function(g,worldtime) {
	if (this.active) {
		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		g.ctx.scale(1,0.2+(Math.cos((worldtime-this.startTime)/200)-0.2));
			

		g.ctx.fillStyle = "#B88A0E"; 
			
		g.ctx.beginPath();
		g.ctx.strokeStyle= "#FDF1BF";
		g.ctx.arc(10, 10, 10, 0, 2 * Math.PI, false);
		g.ctx.stroke();
		g.ctx.fill();

		g.ctx.beginPath();
		g.ctx.fillStyle= "#DC8D24";
		g.ctx.arc(10-2, 10-2, 10, 0, 2 * Math.PI, false);
		g.ctx.stroke();
		g.ctx.fill();
		
		g.ctx.fillStyle= "#FFEEBA";
		g.ctx.font = "20px serif";
		g.ctx.fillText(String.fromCharCode(9733), 0, 15);
		
			
		  g.ctx.restore();
		}

}
