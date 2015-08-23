function Token(tokendata,isWorldForward) {
	this.xpos = tokendata.xpos;
	this.ypos = tokendata.ypos;
	this.isWorldForward = isWorldForward;
	this.events = tokendata.events;
	this.eventsQueue = [];
	if (this.isWorldForward) { // going forward
		this.visible = true;
		this.events.sort(function(a,b) { return a.startTime - b.startTime; });
	} else {
		this.visible = false;
		this.events.sort(function(a,b) { return b.startTime - a.startTime; });
	}
	this.curEventIndex=0;
}

Token.prototype.draw = function(g) {
	if (this.visible) {
		g.ctx.save();
		g.ctx.translate(this.xpos, this.ypos);
		
			
		g.ctx.fillStyle = "green";
			
		g.ctx.beginPath();
		g.ctx.arc(20, 20, 20, 0, 2 * Math.PI, false);
		g.ctx.stroke();
		g.ctx.fill();
			
		  g.ctx.restore();
		}

}

Token.prototype.tick= function(delta,worldTime) {
	if (this.isWorldForward) {
		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].startTime < worldTime )) {
			var curEvent = this.events[this.curEventIndex];
			this.visible = curEvent.isForward ? curEvent.visible : !curEvent.visible;
			this.curEventIndex++;
		}
	} else {
		while (this.curEventIndex < this.events.length && (this.events[this.curEventIndex].startTime > worldTime )) {
			var curEvent = this.events[this.curEventIndex];
			this.visible = curEvent.isForward ? !curEvent.visible : curEvent.visible;
			this.curEventIndex++;
		}
	}

}

Token.prototype.compareTank = function(player,worldTime) {
	if (dist(this,player)<50 && this.visible)	{
		this.visible=false;
		this.eventsQueue.push({
			startTime: worldTime,
			endTime: worldTime,
			visible: this.visible,
			tankId: player.tankId,
			isForward: this.isWorldForward
		});
	}

}





Token.prototype.toPlainObject = function() {

}
