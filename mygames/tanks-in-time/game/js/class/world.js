function World(worldData,player) {
	//this.events = worldData.events;	
	this.eventsQueue = [];
	this.player = new Tank(this,true,player.tankId,false);
	this.otherTanks = {};
	this.tokens = {};
	this.isForward = worldData.isForward;
	this.worldDuration = worldData.worldDuration;

	worldData.players.forEach(function(p) {
		this.otherTanks[p.tankId] = new Tank(this,(p.isForward == this.isForward),p.tankId,p);
	}.bind(this));
	worldData.tokens.forEach(function(t) {
		this.tokens[t.tokenId] = new Token(t,this.isForward);
	}.bind(this));

}

World.prototype.recordTankState = function(player,curTime) {
	
	// set startTime and endTime for last event
	this.updateLastEventInQueue(curTime);
	this.eventsQueue.push(
	{
		tankId:player.tankId,
		startTime: curTime,
		endTime: curTime,
		angle:player.angle,
		xpos:player.xpos,
		ypos:player.ypos,
		//speed:player.speed,
		keyForward:player.keyForward,
		keyReverse:player.keyReverse,
		keyLeft:player.keyLeft,
		keyRight:player.keyRight,
		velocity :player.velocity ,
		acceleration :player.acceleration 
	});
}

World.prototype.updateLastEventInQueue = function(curTime) {
	
	// set startTime and endTime for last event
	if (this.eventsQueue.length) {
		var lastEvent = this.eventsQueue[this.eventsQueue.length-1];
		lastEvent.startTime = Math.min(lastEvent.startTime,curTime);
		lastEvent.endTime = Math.max(lastEvent.endTime,curTime);
	}

}

World.prototype.getQueuedEvents = function(curTime) {
	this.updateLastEventInQueue(curTime);
	return {
		player:this.eventsQueue,
		tokens:Object.keys(this.tokens).reduce(
			function(obj,tokenId) { 
				obj[tokenId] = this.tokens[tokenId].eventsQueue;
				return obj;
			}.bind(this),{})
	};
}

World.prototype.flushQueuedEvents = function(curTime) {
	this.eventsQueue = [];
	Object.keys(this.tokens).forEach(
		function(id) { 
			this.tokens[id].eventsQueue = []; 
		}.bind(this));
	this.recordTankState(this.player,curTime);
}


