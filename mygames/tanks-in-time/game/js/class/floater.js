var Floater = Token.extend({
	init : function(tokendata) {
		this._super(tokendata,false);
	},

	draw: function(g,worldTime,world) {
		if (this.visible && world.inView(this)) {
			g.ctx.save();
			g.ctx.translate(this.xpos, this.ypos);

			var s =  (((worldTime+this.ypos*100)%1000 > 500) ? (500-((worldTime+this.ypos*100)%500)) : ((worldTime+this.ypos*100)%500))/500;
			g.ctx.rotate(s-0.5);
    		g.ctx.drawImage(sprite,0,125,112,62, -351/6/2, -229/6/2,351/6, 229/6);

			// g.ctx.fillStyle = "red";
			
			// g.ctx.beginPath();
			// g.ctx.arc(20, 20, 20, 0, 2 * Math.PI, false);
			// g.ctx.stroke();
			// g.ctx.fill();
			
			g.ctx.restore();
		}

	},
	tankHit: function(player,worldTime) {
		player.rescuedFloaters++;
		player.score += 10;
		if (player.isPlayer) {
			// var s = ["Walk the plank - aboard, shipmatey! ",
			// "The more the merrier! ", 
			// "Join us for a game of backgammon ",
			// "Welcome aboard! "];
			// showNotification(s[Math.floor(s.length*Math.random())] + (10-player.rescuedFloaters) + " to go!");		
			showNotification("Shipmate rescued. " + (RESCUE_GOAL-player.rescuedFloaters) + " to go!");		
		}

	}
})