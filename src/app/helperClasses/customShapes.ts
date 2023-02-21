
export class CustomShapes {

    public shapes : {};
    
    constructor() {

       this.shapes  = {
            "symbolDiamondAlt" : this.diamondAlt,
            "symbolDiamondSquare" : this.diamondSquare,
            "symbolHexagon" : this.hexagon,
            "symbolHexagonAlt" : this.hexagonAlt,
            "symbolOctagon" : this.octogon,
            "symbolOctagonAlt" : this.octagonAlt,
            "symbolPentagon" : this.pentagon,
            "symbolTriangleLeft" : this.triangleLeft,
            "symbolTriangleRight" : this.triangleRight,
            "symbolTriangleDown" : this.triangleDown,
            "symbolX" : this.x
        }
        
    }

    private diamondAlt = {
        draw: function(context, size) {

            var tan30 = Math.sqrt(1 / 3);
            var tan30_2 = tan30 * 2;

            var x = Math.sqrt(size / tan30_2);
            var y = x * tan30;
        
            context.moveTo(0, -y);
            context.lineTo(x, 0);
            context.lineTo(0, y);
            context.lineTo(-x, 0);
        
            context.closePath();
        }
    };

    private  diamondSquare = {
        draw: function(context, size) {

          var w = Math.sqrt(size);
          var d = w / 2 * Math.sqrt(2);
      
          context.moveTo(0, -d);
          context.lineTo(d, 0);
          context.lineTo(0, d);
          context.lineTo(-d, 0);
      
          context.closePath();

        }
    };

    private hexagon = {
        draw: function(context, size) {

            function sideLength(area) {

                var num = 2 * area;
                var denom = 3 * Math.sqrt(3);
                return Math.sqrt(num / denom);
        
            }

            function rotatePoint(x, y, theta) {
        
                return [
                  Math.cos(theta) * x + -Math.sin(theta) * y, // x
                  Math.sin(theta) * x + Math.cos(theta) * y,  // y
                ];
        
            }

            var tau = 2 * Math.PI;
            var s = sideLength(size);
            var R = s;

            context.moveTo.apply(context, rotatePoint(R, 0, tau/12));

            for (var i = 0; i < 6; ++i) {

                var a = tau * i / 6;
                var x = Math.cos(a) * R;
                var y = Math.sin(a) * R;

                context.lineTo.apply(context, rotatePoint(x, y, tau/12));
            
            }

            context.closePath();

        }
    }

    shape : {}

    private hexagonAlt = {
        draw: function(context, size) {

            function sideLength(area) {

                var num = 2 * area;
                var denom = 3 * Math.sqrt(3);
                return Math.sqrt(num / denom);
        
            }

            function rotatePoint(x, y, theta) {
        
                return [
                  Math.cos(theta) * x + -Math.sin(theta) * y, // x
                  Math.sin(theta) * x + Math.cos(theta) * y,  // y
                ];
        
            }

            var tau = 2 * Math.PI;
            var s = sideLength(size);
            var R = s;

            context.moveTo.apply(context, rotatePoint(R, 0, tau));

            for (var i = 0; i < 6; ++i) {

                var a = tau * i / 6;
                var x = Math.cos(a) * R;
                var y = Math.sin(a) * R;

                context.lineTo.apply(context, rotatePoint(x, y, tau));
            
            }

            context.closePath();

        }
    }

    private octogon = {
        draw(context, size) {

            var circumradiusCoeff = 1/2 * Math.sqrt(4 + 2 * Math.sqrt(2)); // ~ 1.3065629648763766

            function circumradius(side) { return side * circumradiusCoeff; }

            function sideLength(area) {
                var num = area * (1 - Math.sqrt(2));
                var denom = 2;
                return Math.sqrt(-1 * num / denom);
            }

            function rotatePoint(x, y, theta) {
        
                return [
                  Math.cos(theta) * x + -Math.sin(theta) * y, // x
                  Math.sin(theta) * x + Math.cos(theta) * y,  // y
                ];
        
            }

            var tau = 2 * Math.PI;
            var s = sideLength(size);
            var R = circumradius(s);
        
            context.moveTo.apply(context, rotatePoint(R, 0, 0));
        
            for (var i = 0; i < 8; ++i) {
              var a = tau * i / 8;
              var x = Math.cos(a) * R;
              var y = Math.sin(a) * R;
        
              context.lineTo.apply(context, rotatePoint(x, y, 0));
            }
        
            context.closePath();

          }
    }

    private octagonAlt = {
        draw(context, size) {

            var circumradiusCoeff = 1/2 * Math.sqrt(4 + 2 * Math.sqrt(2)); // ~ 1.3065629648763766

            function circumradius(side) { return side * circumradiusCoeff; }

            function sideLength(area) {
                var num = area * (1 - Math.sqrt(2));
                var denom = 2;
                return Math.sqrt(-1 * num / denom);
            }

            function rotatePoint(x, y, theta) {
        
                return [
                  Math.cos(theta) * x + -Math.sin(theta) * y, // x
                  Math.sin(theta) * x + Math.cos(theta) * y,  // y
                ];
        
            }

            var tau = 2 * Math.PI;
            var s = sideLength(size);
            var R = circumradius(s);
        
            context.moveTo.apply(context, rotatePoint(R, 0, tau/16));
        
            for (var i = 0; i < 8; ++i) {
              var a = tau * i / 8;
              var x = Math.cos(a) * R;
              var y = Math.sin(a) * R;
        
              context.lineTo.apply(context, rotatePoint(x, y, tau/16));
            }
        
            context.closePath();

          }
    }

    private pentagon = {
        draw: function(context, size) {

            var circumradiusCoeff = 1/10 * Math.sqrt(50 + 10 * Math.sqrt(5)); // ~ 0.85065080835204

            function circumradius(side) { return side * circumradiusCoeff; }

            function sideLength(area) {
                var num = 4 * area;
                var denom = Math.sqrt(5 * (5 + 2 * Math.sqrt(5))); // ~ 6.881909602355868
              
                return Math.sqrt(num / denom);
            }

            function rotatePoint(x, y, theta) {
        
                return [
                  Math.cos(theta) * x + -Math.sin(theta) * y, // x
                  Math.sin(theta) * x + Math.cos(theta) * y,  // y
                ];
        
            }
              
            var tau = 2 * Math.PI;
            var s = sideLength(size);
            var R = circumradius(s);
            var theta = -tau / 4; // Rotate 1/4 turn back so the shape is oriented with a point upward.
        
            context.moveTo.apply(context, rotatePoint(R, 0, theta));
        
            for (var i = 0; i < 5; ++i) {
                var a = tau * i / 5;
                var x = Math.cos(a) * R;
                var y = Math.sin(a) * R;
        
                context.lineTo.apply(context, rotatePoint(x, y, theta));
            }
        
            context.closePath();

            }
    };

    private triangleDown = {
        draw: function(context, size) {

            var y = -Math.sqrt(size / (Math.sqrt(3) * 3));
            context.moveTo(0, -y * 2);
            context.lineTo(-Math.sqrt(3) * y, y);
            context.lineTo(Math.sqrt(3) * y, y);
            context.closePath();

        }
    };

    private triangleLeft = {
        draw: function(context, size) {

            var x = -Math.sqrt(size / (Math.sqrt(3) * 3));
            context.moveTo(x * 2, 0);
            context.lineTo(-x, -Math.sqrt(3) * x);
            context.lineTo(-x, Math.sqrt(3) * x);
            context.closePath();

        }
    };

    private triangleRight = {
        draw: function(context, size) {

            var x = -Math.sqrt(size / (Math.sqrt(3) * 3));
            context.moveTo(-x * 2, 0);
            context.lineTo(x, -Math.sqrt(3) * x);
            context.lineTo(x, Math.sqrt(3) * x);
            context.closePath();

        }
    };

    private x = {
        draw: function(context, size) {

            function rotatePoint(x, y, theta) {
        
                return [
                  Math.cos(theta) * x + -Math.sin(theta) * y, // x
                  Math.sin(theta) * x + Math.cos(theta) * y,  // y
                ];
        
            }

            var tau = 2 * Math.PI;
            var r = Math.sqrt(size / 5) / 2;
            var theta = tau / 8;
        
            // Use the same construction points as `symbolCross` and rotate 1/8 turn.
            var points = [
                rotatePoint(-3 * r, -r, theta),
                rotatePoint(-r, -r, theta),
                rotatePoint(-r, -3 * r, theta),
                rotatePoint(r, -3 * r, theta),
                rotatePoint(r, -r, theta),
                rotatePoint(3 * r, -r, theta),
                rotatePoint(3 * r, r, theta),
                rotatePoint(r, r, theta),
                rotatePoint(r, 3 * r, theta),
                rotatePoint(-r, 3 * r, theta),
                rotatePoint(-r, r, theta),
                rotatePoint(-3 * r, r, theta)
            ];
        
            context.moveTo.apply(context, points.pop());
            
            for (var i = 0; i < points.length; i++) {
              context.lineTo.apply(context, points[i]);
            }
        
            context.closePath();
        }
    }


}