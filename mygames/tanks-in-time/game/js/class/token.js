var Token = Class.extend({
	init: function(tokendata,isWorldForward) {


		this.xpos = tokendata.xpos;
		this.ypos = tokendata.ypos;
		this.isWorldForward = isWorldForward;
		this.events = new GameEvents(tokendata.events,isWorldForward);
		this.eventsQueue = [];
		var firstEvent = this.events.getNextEvent();
		if (firstEvent==null) 
			this.visible = true;
		else {
			this.runEvent(firstEvent);
			this.visible = !this.visible;
		}

	}

	,draw: function(g) {
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

	,tick: function(delta,worldTime) {

		this.events.forEachCurrentEvent(worldTime,function(event) {
			this.runEvent(event);
		}.bind(this));
	}

	,runEvent: function(event) {
		if (this.isWorldForward)
			this.visible = event.visible;
		else
			this.visible = !event.visible;
	}

	,compareTank: function(player,worldTime) {
		if (dist(this,player)<50 && this.visible)	{

			this.visible=false;
			
			this.eventsQueue.push({
				worldTime: worldTime,
				visible: this.isWorldForward ? this.visible : !this.visible,
				tankId: player.tankId,
				isForward: this.isWorldForward
			});
			this.tankHit(player,worldTime);
		}

	},
	tankHit: function(player,worldTime) {
		player.coins += 10;
	}





	,toPlainObject: function() {

	}

});