#pragma once


var RED   = [1.0, 0.0, 0.0, 1.0];
var GREEN = [0.0, 1.0, 0.0, 1.0];
var BLUE  = [0.0, 0.0, 1.0, 1.0];
var WHITE = [1.0, 1.0, 1.0, 1.0];


var PolyLine = function(color) {
    this.color  = color || RED;
    this.points = [];
}

PolyLine.prototype = {
    pushPoint: function(x, y) {
        this.points.push([x, y]);
    },
    getPoints: function() {
        return this.points;
    },

    setColor: function(color) {
        this.color = color;
    },
    getColor: function() {
        return this.color;
    },

    flatten: function(mouseXY) {
        var points = this.points;

        if (mouseXY === undefined)
            var arr = new Float32Array(points.length * 2);
        else
            var arr = new Float32Array(points.length * 2 + 2);

        for (var i = 0; i < points.length; i++) {
            arr[2 * i]     = points[i][0];
            arr[2 * i + 1] = points[i][1];
        }

        if (mouseXY !== undefined) {
            arr[arr.length - 2] = mouseXY[0];
            arr[arr.length - 1] = mouseXY[1];
        }

        return arr;
    },
};


var PolyLines = function() {
    this.count = 0;
    this.lines = [];
    this.current = new PolyLine;
};

PolyLines.prototype = {
    insert: function(polyLine) {
        for (var i = 0; i < this.lines.length; i++) {
            if (this.lines[i] === undefined) {
                this.lines[i] = polyLine;

                this.count += 1;
                return i;
            }
        }
        var i = this.lines.length;
        this.lines[i] = polyLine;

        this.count += 1;
        return i;
    },
    makeNew: function(color) {
        var i = this.insert(this.current);
        this.current = new PolyLine(color);
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
        /**  Multiply a 4x4 matrix by a 3-vector or another 4x4 Matrix.
         *
         *   other: Either a matrix or vector.
         */
        if (other.data === undefined) {  // other is a 3-vector or 4-vector (as Array)
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


var Circle = function(center, normal, radius) {
    this.center = center;
    this.normal = normal;
    this.radius = radius;
};

Circle.prototype = {
    toNGon: function(n) {
        var sliceAngle = 2 * Math.PI / n;

        var res = [];
        for (var i = 0; i < n; i++) {
            if (n % 2 == 0) {  // 'n' is even
                var x1 = this.radius * Math.cos(i * sliceAngle);
                var y1 = this.radius * Math.sin(i * sliceAngle);
            } else {
                var y1 = this.radius * -Math.sin(i * sliceAngle);
                var x1 = this.radius * -Math.cos(i * sliceAngle);
            }
            res[i] = [x1, y1, 0.0];
        }

        return res;
    },
};
