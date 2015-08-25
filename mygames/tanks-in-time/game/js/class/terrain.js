var radiiii = 4;


      function Terrain(detail) {
        this.size = Math.pow(2, detail) + 1;
        this.max = this.size - 1;
        this.map = new Float32Array(this.size * this.size);
      }

      Terrain.prototype.get = function(x, y) {
        if (x < 0 || x > this.max || y < 0 || y > this.max) return -1;
        return this.map[x + this.size * y];
      };

      Terrain.prototype.set = function(x, y, val) {
        this.map[x + this.size * y] = val;
      };

      Terrain.prototype.generate = function(roughness) {
        var self = this;

        this.set(0, 0, self.max);
        this.set(this.max, 0, self.max / 2);
        this.set(this.max, this.max, 0);
        this.set(0, this.max, self.max / 2);

        divide(this.max);

        function divide(size) {
          var x, y, half = size / 2;
          var scale = roughness * size;
          if (half < 1) return;

          for (y = half; y < self.max; y += size) {
            for (x = half; x < self.max; x += size) {
              square(x, y, half, Math.random() * scale * 2 - scale);
            }
          }
          for (y = 0; y <= self.max; y += half) {
            for (x = (y + half) % size; x <= self.max; x += size) {
              diamond(x, y, half, Math.random() * scale * 2 - scale);
            }
          }
          divide(size / 2);
        }

        function average(values) {
          var valid = values.filter(function(val) { return val !== -1; });
          var total = valid.reduce(function(sum, val) { return sum + val; }, 0);
          return total / valid.length;
        }

        function square(x, y, size, offset) {
          var ave = average([
            self.get(x - size, y - size),   // upper left
            self.get(x + size, y - size),   // upper right
            self.get(x + size, y + size),   // lower right
            self.get(x - size, y + size)    // lower left
          ]);
          self.set(x, y, ave + offset);
        }

        function diamond(x, y, size, offset) {
          var ave = average([
            self.get(x, y - size),      // top
            self.get(x + size, y),      // right
            self.get(x, y + size),      // bottom
            self.get(x - size, y)       // left
          ]);
          self.set(x, y, ave + offset);
        }
      };

      Terrain.prototype.draw = function(ctx, width, height) {
        var self = this;
        var waterVal = this.size * 0.1;
        var landVal = this.size * 0.5;

        // return this.map[x + this.size * y]
        var circles = [];
        for (var y = 0; y < this.size; y++) {
           for (var x = 0; x < this.size; x++) {        
        
        // for (var i=0; i<this.map.length; i++)  {
            circles.push({
              val:this.get(x,y),
              x:x,
              y:y
            });
            }
         }
        // this.map.map(function(val,i) {
        //   return {
        //     val:val,
        //     x:i%this.floor,
        //     y:Math.floor(this.floor/i)
        //   };
        // })
        circles.sort(function(a,b) {
          return b.val - a.val;
        });
        circles.forEach(function(p) {
            if (p.val < waterVal)
              var style = brightness(p.x, p.y, this.get(p.x + 1, p.y) - p.val,0,0,50);
            else if (p.val < landVal)
              var style = brightness(p.x, p.y, this.get(p.x + 1, p.y) - p.val,0,100,0);
            else
              var style = brightness(p.x, p.y, this.get(p.x + 1, p.y) - p.val,0,0,0);
            ctx.fillStyle = style;
            // ctx.fillRect(p.x*2, p.y*2, 2,2);    
            // var path = new Path2D();
            // path.arc(p.x*radiiii, p.y*radiiii, radiiii+radiiii*Math.random(), 0, 2 * Math.PI);
            // ctx.fill(path);
            ctx.fillRect(p.x*radiiii, p.y*radiiii, radiiii,radiiii);    


        }.bind(this));      

        // for (var y = 0; y < this.size; y++) {
        //   for (var x = 0; x < this.size; x++) {
        //     var val = this.get(x, y);
        //     if (val < waterVal)
        //       var style = brightness(x, y, this.get(x + 1, y) - val,50,50,0);
        //     else if (val < landVal)
        //       var style = brightness(x, y, this.get(x + 1, y) - val,50,0,50);
        //     else
        //       var style = brightness(x, y, this.get(x + 1, y) - val,0,0,0);
        //     ctx.fillStyle = style;
        //     ctx.fillRect(x*2, y*2, 2,2);    

        //     /*
        //     var val = this.get(x, y);
        //     var top = project(x, y, val);
        //     var bottom = project(x + 1, y, 0);
        //     var water = project(x, y, waterVal);
        //     var style = brightness(x, y, this.get(x + 1, y) - val);

        //     rect(top, bottom, style);
        //     rect(water, bottom, 'rgba(50, 150, 200, 0.15)');
        //     */
        //   }
        // }

        function rect(a, b, style) {
          if (b.y < a.y) return;
          ctx.fillStyle = style;
          ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
        }

        function brightness(x, y, slope,r,g,b) {
          if (y === self.max || x === self.max) return '#000';
          var a = ~~(slope * 50) + 128;
          a=a/2;
          var r = Math.min(a+r,255);
          var g = Math.min(a+g,255);
          var b = Math.min(a+b,255);
          return ['rgba(', r, ',', g, ',', b, ',1)'].join('');
        }

        function iso(x, y) {
          return {
            x: 0.5 * (self.size + x - y),
            y: 0.5 * (x + y)
          };
        }

        function project(flatX, flatY, flatZ) {
          var point = iso(flatX, flatY);
          var x0 = width * 0.5;
          var y0 = height * 0.2;
          var z = self.size * 0.5 - flatZ + point.y * 0.75;
          var x = (point.x - self.size * 0.5) * 6;
          var y = (self.size - point.y) * 0.005 + 1;

          return {
            x: x0 + x / y,
            y: y0 + z / y
          };
        }
      };

      var display = document.getElementById('display');
      var ctx = display.getContext('2d');
      var width = display.width = Math.pow(2,8)*radiiii; //display.width = window.innerWidth;
      var height = display.height =  Math.pow(2,8)*radiiii; // window.innerHeight;

      var terrain = new Terrain(10);
      terrain.generate(0.7);
      terrain.draw(ctx, width, height);
