#pragma once

#include "util.js"


#define ORIGIN [0.0, 0.0, 0.0]


var Polyline = function(color) {
    this.color  = color || WHITE;
    this.points = [];
}

Polyline.prototype = {
    addPoint: function(x, y) {
        this.points.push([x, y, 0.0]);
    },
    getPoints: function(mouseXY) {
        var res = [];

        for (var i = 0; i < this.points.length; i++)
            res.push([this.points[i][0], this.points[i][1], this.points[i][2]]);

        if (mouseXY !== undefined)
            res.push([mouseXY[0], mouseXY[1], 0.0]);

        return res;
    },

    setColor: function(color) {
        this.color = [color[0], color[1], color[2], color[3]];
    },
    getColor: function() {
        return [this.color[0], this.color[1], this.color[2], this.color[3]];
    },
};


var Polylines = function(color) {
    this.count   = 0;
    this.lines   = [];
    this.current = new Polyline(color);
};

Polylines.prototype = {
    insert: function(polyline) {
        for (var i = 0; i < this.lines.length; i++) {
            if (this.lines[i] === undefined) {
                this.lines[i] = polyline;

                this.count += 1;
                return i;
            }
        }
        var i = this.lines.length;
        this.lines[i] = polyline;

        this.count += 1;
        return i;
    },
    makeNew: function(color) {
        var i = this.insert(this.current);
        this.current = new Polyline(color);
        return i;
    },

    at: function(i) {
        return this.lines[i];
    },
    map: function(cb) {
        for (var i = 0; i < this.lines.length; i++)
            if (this.lines[i] !== undefined)
                cb(i, this.lines[i]);
    },
    remove: function(i) {
        this.lines[i] = undefined;

        this.count -= 1;
    },
};


var Circle = function(center, radius) {
    this.center = center;
    this.radius = radius;
};

Circle.prototype = {
    getCenter: function() {
        return [this.center[0], this.center[1], this.center[2]];
    },
    setCenter: function(center) {
        this.center = [center[0], center[1], center[2]];
    },

    getRadius: function() {
        return this.radius;
    },
    setRadius: function(radius) {
        this.radius = radius;
    },

    toPolygon: function(sides) {
        var sliceAngle = 2 * Math.PI / sides;

        var res = [];
        for (var i = 0; i < sides; i++) {
            if (sides % 2 == 0) {  // 'sides' is even
                var x1 = this.radius * Math.cos(i * sliceAngle);
                var y1 = this.radius * Math.sin(i * sliceAngle);
            } else {
                var y1 = this.radius * Math.cos(i * sliceAngle);
                var x1 = this.radius * Math.sin(i * sliceAngle);
            }
            res[i] = [this.center[0] + x1, this.center[1] + y1, this.center[2]];
        }

        return res;
    },

    toPolygonFrame: function(sides) {
        var polygon = this.toPolygon(sides);
        var res     = [];

        for (var i = 0; i < polygon.length; i++) {
            var i2 = (i + 1) % polygon.length;
            res.push(this.center);
            res.push(polygon[i]);
            res.push(polygon[i]);
            res.push(polygon[i2]);
        }
        return res;
    },

    // area: function() {
    //     return Math.PI * Math.pow(this.radius, 2);
    // },

    // polygonArea: function(sides) {
    //     var polygon = this.toPolygon(sides);
    //     console.log(polygon);

    //     var deltaX = polygon[1][0] - polygon[0][0];
    //     var deltaY = polygon[1][1] - polygon[0][1];

    //     var side      = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    //     var perimeter = side * sides;

    //     var apothemX = polygon[0][0] + deltaX / 2;
    //     var apothemY = polygon[0][1] + deltaY / 2;
    //     var apothem  = Math.sqrt(Math.pow(apothemX, 2) + Math.pow(apothemY, 2));

    //     return 1/2 * apothem * perimeter;
    // },
};

var Cylinder = function(end1, end2, color) {
    this.end1  = end1;
    this.end2  = end2;
    this.color = color || WHITE;
};

Cylinder.prototype = {
    getColor: function() {
        return this.color;
    },
    setColor: function(color) {
        this.color = color;
    },

    // volume: function(sides, radius) {
    //     var circle       = new Circle(ORIGIN, radius);
    //     var end_cap_area = circle.polygonArea(sides);

    //     var deltaX = this.end2[0] - this.end1[0];
    //     var deltaY = this.end2[1] - this.end1[0];
    //     var length = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

    //     console.log('Circular cylinder volume: ' + circle.area() * length);
    //     return end_cap_area * length;
    // },

    toFrame: function(sides, radius) {
        var deltaX = this.end2[0] - this.end1[0];
        var deltaY = this.end2[1] - this.end1[1];

        var c1 = new Circle(ORIGIN, radius);
        var c2 = new Circle(ORIGIN, radius);

        var rotate = (new Matrix()).rotateY(Math.PI / 2)
                                   .rotateZ(-Math.atan(deltaY / deltaX));
        var xform1 = rotate.translate(this.end1);
        var xform2 = rotate.translate(this.end2);

        var c1_vertices = c1.toPolygonFrame(sides).map(v => xform1.multiply(v));
        var c2_vertices = c2.toPolygonFrame(sides).map(v => xform2.multiply(v));;

        var polygon1_vertices = c1.toPolygon(sides).map(v => xform1.multiply(v));
        var polygon2_vertices = c2.toPolygon(sides).map(v => xform2.multiply(v));
        
        var bridge = [];
        for (var i = 0; i < polygon1_vertices.length; i++) {
            var i2 = (i + 1) % polygon1_vertices.length;
            bridge.push(polygon1_vertices[i]);
            bridge.push(polygon2_vertices[i]);
            bridge.push(polygon2_vertices[i]);
            bridge.push(polygon1_vertices[i2]);
        }

        return c1_vertices.concat(c2_vertices).concat(bridge);
    },
};


var Matrix = function() {
    /**  Construct a 4x4 identity matrix stored as a row-major Float32Array
     */
    this.data = new Float32Array(4 * 4);
    for (var i = 0; i < 4; i++)
        this.data[4 * i + i] = 1;
};

Matrix.prototype = {
    scale: function(scalar) {
        var mat = new Matrix();
        for (var i = 0; i < 3; i++)
            mat.data[4 * i + i] = scalar;

        // console.log(mat.data);
        return mat.multiply(this);
    },

    translate: function(vector) {
        var mat = new Matrix();
        for (var i = 0; i < 3; i++)
            mat.data[4 * i + 3] = vector[i];

        // console.log(mat.data);
        return mat.multiply(this);
    },

    rotateX: function(radians) {
        var mat = new Matrix();
        var row = 0;
        mat.data[4 * row + 0] = 1;
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = 0;
        row = 1;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = Math.cos(radians);
        mat.data[4 * row + 2] = Math.sin(radians);
        row = 2;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = -Math.sin(radians);
        mat.data[4 * row + 2] = Math.cos(radians);
        return mat.multiply(this);
    },

    rotateY: function(radians) {
        var mat = new Matrix();
        var row = 0;
        mat.data[4 * row + 0] = Math.cos(radians);
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = -Math.sin(radians);
        row = 1;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = 1;
        mat.data[4 * row + 2] = 0;
        row = 2;
        mat.data[4 * row + 0] = Math.sin(radians);
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = Math.cos(radians);
        return mat.multiply(this);
    },

    rotateZ: function(radians) {
        var mat = new Matrix();
        var row = 0;
        mat.data[4 * row + 0] = Math.cos(radians);
        mat.data[4 * row + 1] = Math.sin(radians);
        mat.data[4 * row + 2] = 0;
        row = 1;
        mat.data[4 * row + 0] = -Math.sin(radians);
        mat.data[4 * row + 1] = Math.cos(radians);
        mat.data[4 * row + 2] = 0;
        row = 2;
        mat.data[4 * row + 0] = 0;
        mat.data[4 * row + 1] = 0;
        mat.data[4 * row + 2] = 1;
        return mat.multiply(this);
    },

    multiply: function(other) {
        /**  Multiply a 4x4 matrix by a 3-vector or another 4x4 Matrix
         *   @param other either a matrix or vector
         */
        if (other.data === undefined) {  // other is a 3-vector (as Array)
            other = [other[0], other[1], other[2], 1.0];
            var res = [0.0, 0.0, 0.0, 0.0];

            for (var i = 0; i < 4; i++) {
                for (var k = 0; k < 4; k++) {
                    var lhs  = this.data[4 * i + k];
                    res[i]  += lhs * other[k];
                }
            }

            for (var i = 0; i < 3; i++)
                res[i] /= res[3];
            
            return res;
        } else {                         // other is a 4x4 matrix
            var res  = new Matrix();
            res.data = new Float32Array(4 * 4);

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    for (var k = 0; k < 4; k++) {
                        var lhs =  this.data[4 * i + k];
                        var rhs = other.data[4 * k + j];
                        res.data[4 * i + j] += lhs * rhs;
                    }
                }
            }

            return res;
        }
    },
};
