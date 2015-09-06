function World(worldData,player,curTime,lastTank) {
	
	this.worldDuration = worldData.worldDuration;
	this.width = worldData.width;
	this.height = worldData.height;
	this.level = worldData.level;	
	this.sealevel = worldData.sealevel;
	
	this.otherTanks = {};
	this.tokens = {};
	this.floaters = {};
	this.landscapeSeed = worldData.landscapeSeed;
	this.landscape = new Landscape(this.width,this.height,2,this.landscapeSeed,this.sealevel);
	this.player = new Tank(this,player.tankId,false,true,curTime,lastTank);
	worldData.players.forEach(function(p) {
		this.otherTanks[p.tankId] = new Tank(this,p.tankId,p,false,curTime);
	}.bind(this));
	worldData.tokens.forEach(function(t) {
		this.tokens[t.tokenId] = new Token(t);
	}.bind(this));
	worldData.floaters.forEach(function(t) {
		this.floaters[t.id] = new Floater(t);
	}.bind(this));
	this.cameraX = this.player.xpos;
	this.cameraY = this.player.ypos;
	this.screenWidth = gid('goocanvas').width;
	this.screenHeight = gid('goocanvas').height;
	this.timeNotify = false;
}

World.prototype.renderLandscape = function() {
	this.landscape.render();
}

World.prototype.render = function(g,curTime) {
		this.cameraX = Math.max(0,this.player.xpos - (this.screenWidth/2));
		this.cameraY = Math.max(0,this.player.ypos - (this.screenHeight/2));
		this.cameraX = Math.min(this.cameraX,this.width - (this.screenWidth));
		this.cameraY = Math.min(this.cameraY,this.height - (this.screenHeight));

		

		// this.cameraX = Math.max(0,this.player.xpos - (this.screenWidth/2));
		// this.cameraY = Math.max(0,this.player.ypos - (this.screenHeight/2));
		// this.cameraX = Math.min(this.width-(this.screenWidth/2),this.cameraX);
		// this.cameraY = Math.min(this.height-(this.screenHeight/2),this.cameraY);
		this.landscape.move(this.cameraX,this.cameraY);

		g.ctx.clearRect(0,0,g.width,g.height);
		g.ctx.save();
		g.ctx.translate(-this.cameraX, -this.cameraY);

		var datenow = Date.now();
		if (!this.lastFrameTime) this.lastFrameTime = datenow;
		var delta = (datenow - this.lastFrameTime) / 1000;
		this.lastFrameTime = datenow;

		if (curTime > this.worldDuration*0.9 && !this.timeNotify) {
			this.timeNotify = true;
			showNotification('Time is running out!!');
		}


		
		
		Object.keys(this.tokens).forEach(function(t) {
			this.tokens[t].compareTank(this.player,curTime);
			this.tokens[t].tick(delta,curTime);
			this.tokens[t].draw(g,curTime);
		}.bind(this));

		Object.keys(this.floaters).forEach(function(t) {
			this.floaters[t].compareTank(this.player,curTime);
			this.floaters[t].tick(delta,curTime);
			this.floaters[t].draw(g,curTime);
		}.bind(this));

		Object.keys(this.otherTanks).forEach(function(p) {
			this.otherTanks[p].tick(g,delta,this,curTime);
			this.otherTanks[p].draw(g,curTime);
		}.bind(this));

		this.player.handleKeys(g,curTime);
		this.player.tick(g,delta,this,curTime);
		this.player.draw(g,curTime);

		g.ctx.restore();
}

World.prototype.getQueuedEvents = function(curTime) {
	this.player.updateLastEventInQueue(curTime);
	return {
		player:this.player.eventsQueue,
		tokens:Object.keys(this.tokens).reduce(
			function(obj,tokenId) { 
				obj[tokenId] = this.tokens[tokenId].eventsQueue;
				return obj;
			}.bind(this),{}),
		floaters:Object.keys(this.floaters).reduce(
			function(obj,id) { 
				obj[id] = this.floaters[id].eventsQueue;
				return obj;
			}.bind(this),{})
			
	};
}

// World.prototype.flushQueuedEvents = function(curTime) {
// 	this.player.flushQueuedEvents(curTime);
// 	Object.keys(this.tokens).forEach(
// 		function(id) { 
// 			this.tokens[id].eventsQueue = []; 
// 		}.bind(this));
// 	Object.keys(this.floaters).forEach(
// 		function(id) { 
// 			this.floaters[id].eventsQueue = []; 
// 		}.bind(this));
		
// }


