#pragma once


var RED   = [1.0, 0.0, 0.0, 1.0];
var GREEN = [0.0, 1.0, 0.0, 1.0];
var BLUE  = [0.0, 0.0, 1.0, 1.0];
var WHITE = [1.0, 1.0, 1.0, 1.0];


var Polyline = function(color) {
    this.color  = color || RED;
    this.points = [];
}

Polyline.prototype = {
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


var Polylines = function() {
    this.count = 0;
    this.lines = [];
    this.current = new Polyline;
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
