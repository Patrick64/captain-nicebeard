var Floater = Token.extend({
	init : function(tokendata) {
		this._super(tokendata,false);
	},

	draw: function(g,worldTime) {
		if (this.visible) {
			g.ctx.save();
			g.ctx.translate(this.xpos, this.ypos);

			var s =  (((worldTime+this.ypos*100)%1000 > 500) ? (500-((worldTime+this.ypos*100)%500)) : ((worldTime+this.ypos*100)%500))/500;
			g.ctx.rotate(s-0.5);
    		g.ctx.drawImage(gameImages[1], -351/6/2, -229/6/2,351/6, 229/6);

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
		

	}
})