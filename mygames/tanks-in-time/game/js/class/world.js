function World(worldData,player,curTime) {
	//this.events = worldData.events;	
	
	this.player = new Tank(this,true,player.tankId,false,true,curTime);
	this.otherTanks = {};
	this.tokens = {};
	this.isForward = worldData.isForward;
	this.worldDuration = worldData.worldDuration;
	this.width = worldData.width;
	this.height = worldData.height;
	worldData.players.forEach(function(p) {
		this.otherTanks[p.tankId] = new Tank(this,(p.isForward == this.isForward),p.tankId,p,false,curTime);
	}.bind(this));
	worldData.tokens.forEach(function(t) {
		this.tokens[t.tokenId] = new Token(t,this.isForward);
	}.bind(this));

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


