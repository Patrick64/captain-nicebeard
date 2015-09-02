var Floater = Token.extend({
	init : function(tokendata) {
		this._super(tokendata,false);
	},

	draw: function(g) {
		if (this.visible) {
			g.ctx.save();
			g.ctx.translate(this.xpos, this.ypos);

			
			g.ctx.fillStyle = "red";
			
			g.ctx.beginPath();
			g.ctx.arc(20, 20, 20, 0, 2 * Math.PI, false);
			g.ctx.stroke();
			g.ctx.fill();
			
			g.ctx.restore();
		}

	},
	tankHit: function(player,worldTime) {
		player.rescuedFloaters++;
		

	}
})