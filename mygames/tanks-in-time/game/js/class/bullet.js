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
				var otherTank = world.otherTanks[tankId];
				if (dist(otherTank,this)<40) {
					this.active=false;
					otherTank.hit(this);

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
