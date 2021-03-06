

function GameEvents(events) {
	this.curEventIndex=0;
	this.events = [];
	if (events) this.addEvents(events);
	
}

/** call function for each event in worldTime */
GameEvents.prototype.forEachCurrentEvent = function(worldTime,callback) {

		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].worldTime < worldTime )) {
			var curEvent = this.events[this.curEventIndex];
			var prevEvent = this.curEventIndex > 0 ? this.events[this.curEventIndex-1] : null;
			callback(curEvent,prevEvent);
			this.curEventIndex++;
		}
}

// ge the next event to be run, useful for going in reverse
GameEvents.prototype.getNextEvent = function() {
	if (this.curEventIndex>=0 && this.curEventIndex < this.events.length) {
		return this.events[this.curEventIndex];
	} else {
		return null;
	}

}

GameEvents.prototype.addEvents  = function(events ) {
	this.events = events;
	    // forward sort by start time
	    this.events.sort(function(a,b) { 
	        if (a.worldTime < b.worldTime) return -1; else return 1;
	    });


}