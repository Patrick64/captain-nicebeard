function World(worldData,player,curTime,lastTank) {
	//this.events = worldData.events;	
	this.isForward = worldData.isForward;
	this.worldDuration = worldData.worldDuration;
	this.width = worldData.width;
	this.height = worldData.height;
	
	this.player = new Tank(this,true,player.tankId,false,true,curTime,lastTank);
	this.otherTanks = {};
	this.tokens = {};
	worldData.players.forEach(function(p) {
		this.otherTanks[p.tankId] = new Tank(this,(p.isForward == this.isForward),p.tankId,p,false,curTime);
	}.bind(this));
	worldData.tokens.forEach(function(t) {
		this.tokens[t.tokenId] = new Token(t,this.isForward);
	}.bind(this));
	this.landscapeSeed = worldData.landscapeSeed;
	this.landscape = new Landscape(this.width,this.height,4,this.landscapeSeed);
	this.cameraX = this.player.xpos;
	this.cameraY = this.player.ypos;
	this.screenWidth = document.getElementById('goocanvas').width;
	this.screenHeight = document.getElementById('goocanvas').height;
}

World.prototype.renderLandscape = function() {
	this.landscape.render();
}

World.prototype.render = function(g,curTime) {
		this.cameraX = this.player.xpos - (this.screenWidth/2);
		this.cameraY = this.player.ypos - (this.screenHeight/2);

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

		this.player.handleKeys(g,curTime);
		this.player.tick(g,delta,this,curTime);
		this.player.draw(g);

		
		
		Object.keys(this.tokens).forEach(function(t) {
			this.tokens[t].compareTank(this.player,curTime);
			this.tokens[t].tick(delta,curTime);
			this.tokens[t].draw(g);
		}.bind(this));

		Object.keys(this.otherTanks).forEach(function(p) {
			this.otherTanks[p].tick(g,delta,this,curTime);
			this.otherTanks[p].draw(g);
		}.bind(this));

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
			}.bind(this),{})
	};
}

World.prototype.flushQueuedEvents = function(curTime) {
	this.player.flushQueuedEvents(curTime);
	Object.keys(this.tokens).forEach(
		function(id) { 
			this.tokens[id].eventsQueue = []; 
		}.bind(this));
	
}


