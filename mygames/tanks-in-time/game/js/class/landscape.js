function Landscape(width,height,multiplier,seed) {
	this.multiplier = multiplier;
	this.width = Math.floor(width/multiplier);
	this.height = Math.floor(height/multiplier);
	this.seed = 7;//seed;
  this.canvas = document.getElementById('landscape');
}

Landscape.prototype.render = function() {


	//var canvas = document.getElementsByTagName('canvas')[0];
	
	// this.canvas.width = this.width*this.multiplier; //*this.multiplier;
	// this.canvas.height = this.height*this.multiplier; //*this.multiplier;
	this.canvas.width = this.width; //*this.multiplier;
	this.canvas.height = this.height; //*this.multiplier;
	this.canvas.style.width = (this.width*this.multiplier) + 'px';
	this.canvas.style.height = (this.height*this.multiplier) + 'px';

	var ctx = this.canvas.getContext('2d');

	var image = ctx.createImageData(this.width, this.height);
	var data = image.data;

	var start = Date.now();
	noise.seed(this.seed);
	for (var x = 0; x < this.width; x++) {
  //if (x % 100 == 0) {
  //  noise.seed(Math.random());
  //}
  
  for (var y = 0; y < this.height; y++) {
    //var value = Math.abs(noise.perlin2(x / 100, y / 100));
    //noise.seed(1);
    var value = Math.abs(noise.perlin2(x / (600/this.multiplier), y / (600/this.multiplier)));
    
    //var value2 = Math.abs(noise.perlin2((x+500) / 300, (y+500) / 300));
    // noise.seed(2);
     //var value2 = Math.abs(noise.perlin2((x+20) / 100, (y+20) / 100));
     // var value = (value1+value2)/2;
     value *= 256;

    //if (value<20 && value2<0.15) value = 21;

    var cell = (x + y * this.width) * 4;
    if (value>100) {
    	value -= Math.random()*20;
    	data[cell] = data[cell + 1] = data[cell + 2] = value;
    } else if (value>10) {
      //value -= Math.random()*20;
       //data[cell] = 0; data[cell + 1] = 255-(value); data[cell + 2] = 0;
       var value2 = Math.abs(noise.perlin2(x / 20, y / 20));
       data[cell] = 0; data[cell + 1] = 235-(value2*20)-(Math.random()*20)-Math.abs((value*0.6)-30); data[cell + 2] = 0;
     } else {
     	value -= Math.random()*20;
     	data[cell] = 0; data[cell + 1] = 0; data[cell + 2] = 155+value*5;
     }
 //   data[cell] += Math.max(0, (25 - value) * 8);
    data[cell + 3] = 255; // alpha.
  }
}

/* // Benchmark code.
start = Date.now();
for (var x = 0; x < 10000; x++) {
  for (var y = 0; y < 10000; y++) {
    noise.simplex2(x / 50, y/50);
  }
}*/
var end = Date.now();

ctx.fillColor = '#000';
ctx.fillRect(0, 0, 10000, 10000);
ctx.putImageData(image, 0, 0);


ctx.font = '16px sans-serif'
ctx.textAlign = 'center';
ctx.fillText('Rendered in ' + (end - start) + ' ms', this.canvas.width / 2, this.canvas.height - 20);


}

Landscape.prototype.move = function(x,y) {
  this.canvas.style.left = -x;
  this.canvas.style.top = -y;
}