'use strict';

function GameEvent(events,isWorldForward) {
	this.events = [];
	this.isWorldForward = isWorldForward;
	this.curEventIndex=0;
}

/** call function for each event in worldTime */
GameEvent.prototype.forEachCurrentEvent = function(worldTime,callback) {
	if (this.isWorldForward) {
		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].worldTime < worldTime )) {
			var curEvent = this.events[this.curEventIndex];
			var prevEvent = this.curEventIndex > 0 ? this.events[this.curEventIndex-1] : null;
			callback(curEvent,prevEvent);
			this.curEventIndex++;
		}
	} else {
		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].worldTime > worldTime )) {
			
			var curEvent = this.events[this.curEventIndex];
			var prevEvent = this.curEventIndex < this.events.length-1 ? this.events[this.curEventIndex+1] : null;
			callback(curEvent,prevEvent);
			
			this.curEventIndex++;
		}
	}
}

// ge the next event to be run, useful for going in reverse
GameEvent.prototype.getNextEvent = function() {
	if (this.curEventIndex>0 && this.curEventIndex < this.events.length) {
		return this.events[this.curEventIndex];
	} else {
		return null;
	}

}

GameEvent.prototype.addEvents  = function(events ) {
	if (this.isWorldForward) {
	    // forward sort by start time
	    this.events.sort(function(a,b) { 
	        if (a.startTime < b.startTime) return -1; else return 1;
	    });
	  } else {
	    // reverse sort by end time
	    this.events.sort(function(a,b) { 
	        
	        if (a.worldTime > b.worldTime) 
	          return -1; 
	        else 
	          return 1;
	        
	    });
	  }


}