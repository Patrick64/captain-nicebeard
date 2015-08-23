
  function Tank(world,isForward,tankId,tankData) {
	this.angle = 0;
	this.xpos = 400;
	this.ypos = 200;
	this.tankId = tankId;
	this.carImage = carStraight;
	this.world = world;
	this.isForward = isForward;
	this.keyForward=false;
	this.keyReverse=false;
	this.keyLeft=false;
	this.keyRight=false;
	this.keyShoot = false;
	this.velocity = 0;
	this.acceleration = 0;
	this.lastState = null;
	this.bullets = [];
	this.active = true;
	this.events = tankData ? tankData.events : {movements:[]};
	
	if (world.isForward) {
	    // forward sort by start time
	    this.events.movements.sort(function(a,b) { 
	        if (a.startTime < b.startTime) return -1; else return 1;
	    });
	  } else {
	    // reverse sort by end time
	    this.events.movements.sort(function(a,b) { 
	        
	        if (a.endTime > b.endTime) 
	          return -1; 
	        else if (a.endTime < b.endTime)
	          return 1;
	        else if (a.startTime > b.startTime )
	          return -1;
	        else 
	          return 1;
	        //return (b.endTime - a.endTime);
	    });
	  }
	  this.curEventIndex = 0;
  }

  Tank.prototype.tick = function(g,delta,world,curTime) {

	if (this.world.isForward) {
		while (this.curEventIndex < this.events.movements.length && this.events.movements[this.curEventIndex].startTime < curTime ) {
			var curEvent = this.events.movements[this.curEventIndex];
			this.setState(curEvent);
			this.curEventIndex++;
		}
	} else {
		while (this.curEventIndex < this.events.movements.length && this.events.movements[this.curEventIndex].endTime > curTime ) {
			var curEvent = this.events.movements[this.curEventIndex];
			this.setState(curEvent);
			this.curEventIndex++;
		}
	}


  	if (this.keyForward)
  		this.acceleration = this.isForward ? ACCELERATION : -ACCELERATION; 
		//this.speed = Math.min(MAX_FORWARD, this.speed+ ((0.4*60)*delta) );
	  else if (this.keyReverse)
	  	this.acceleration = this.isForward ? -ACCELERATION : ACCELERATION;
		//this.speed = Math.max(MAX_REVERSE, this.speed-((0.4*60)*delta));
	  else
	  {
		//this.speed *= 1-((0.02*60)*delta);
		
		this.acceleration = 0;

	  }
	  
	  
	// rotate/turn
	if ((this.keyLeft && this.isForward) || (this.keyRight && !this.isForward))
	{
		this.angle = (this.angle - TURN_SPEED * delta) % 360;
		//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		this.carImage = carLeft;
	}
	else if ((this.keyLeft && !this.isForward) || (this.keyRight && this.isForward))
	{
		this.angle = (this.angle + TURN_SPEED * delta) % 360;
		//this.acceleration = Math.max(this.acceleration,ACCELERATION/2);
		this.carImage = carRight;
	}
	else {
		this.carImage = carStraight;
	}



	// 
	if (this.acceleration) {
		this.velocity = this.velocity + (this.acceleration * delta);
	} else {
		//this.velocity = this.velocity * 0.98;
		if (Math.abs(this.velocity) < ACCELERATION * delta) {
			this.velocity = 0;
		} else {
			if (this.velocity>0)  
				this.velocity -= ACCELERATION * delta; 
			else 
				this.velocity += ACCELERATION * delta; 
		}
	}
	if (this.velocity>MAX_FORWARD) this.velocity = MAX_FORWARD;
	if (this.velocity<MAX_REVERSE) this.velocity = MAX_REVERSE;

	// move forward/backward
	var x = 0;
	//var y = (this.isForward ? this.velocity : -this.velocity)*60*delta;
	var y = this.velocity*60*delta;
	
	var angleRads = this.angle * (Math.PI / 180.0);
	
	var deltaX = x * Math.cos(angleRads) - y * Math.sin(angleRads)
	var deltaY = x * Math.sin(angleRads) + y * Math.cos(angleRads)
	
	this.xpos += deltaX;
	this.ypos += deltaY;
	
	var carLength = 100;
	this.wrapped = false;
	
	if (this.xpos < - carLength) {
		this.xpos = g.width+carLength;  
		this.wrapped = true;
	}
	else if (this.xpos >= g.width+carLength) {
		this.xpos = -carLength;
		this.wrapped = true;
	}
	
	if (this.ypos < -carLength) {
		this.ypos = g.height+carLength;  
		this.wrapped = true;
	}
	else if (this.ypos >= g.height+carLength) {
		this.ypos = -carLength;
		this.wrapped = true;
	}
	
	
	this.bullets.forEach(function(b) { b.tick(delta,world); });
	
}

Tank.prototype.fire = function( ) {

	this.bullets.push(new Bullet(this.isForward,this,this.xpos,this.ypos,this.angle));
	
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

Tank.prototype.draw = function(g) {
	if (this.active) {
		var angleRads = this.angle * (Math.PI / 180.0);
		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		g.ctx.rotate(angleRads);

		  //g.ctx.drawImage(this.carImage, -carStraight.width/2, -carStraight.height/2);
		 if (this.isForward) g.ctx.fillStyle = "blue"; else g.ctx.fillStyle = "red";

		  //g.ctx.fillStyle = 'rgb(' + Math.floor(255-42.5) + ',' +Math.floor(255-42.5) + ',0)';
			g.ctx.fillRect(-25, -50, 50, 100);
			g.ctx.fillStyle = "grey";
			g.ctx.fillRect(-5,0,10,50);
			
		  g.ctx.restore();

		  this.bullets.forEach(function(b) { b.draw(g); });
	}
  };

  Tank.prototype.handleKeys = function(g,curTime) {
  		var lastKeyCombo = this.keyForward*2 + this.keyReverse*4 + this.keyLeft*8 + this.keyRight*16;
	  // Support arrow keys, WASD and 2468
	  this.keyForward = !!(g.keysDown[38] || g.keysDown[87] || g.keysDown[50]);
	  this.keyReverse = !!(g.keysDown[40] || g.keysDown[83] || g.keysDown[56]);
	  this.keyLeft = !!(g.keysDown[37] || g.keysDown[65] || g.keysDown[52]);
	  this.keyRight = !!(g.keysDown[39] || g.keysDown[68] || g.keysDown[54]);
	  
		var curKeyCombo = this.keyForward*2 + this.keyReverse*4 + this.keyLeft*8 + this.keyRight*16;	
	  
	
	
	 if (curKeyCombo != lastKeyCombo)
	 	this.world.recordTankState(this,curTime);


}

Tank.prototype.hit = function(byTank) {
	this.active = false;

}

