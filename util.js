#pragma once


function get_mouse_xy(canvas, ev) {
    var x    = ev.clientX;
    var y    = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width() / 2) / (canvas.width() / 2);
    y = (canvas.height() / 2 - (y - rect.top)) / (canvas.height() / 2);
    return [x, y];
}

function flatten(n, arr) {
    /**  Flatten a list of n-lists (n-dimensional vectors) into a Float32Array
     */
    var res = new Float32Array(arr.length * n);
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < n; j++)
            res[n * i + j] = arr[i][j];
    }
    return res;
}

function degrees2radians(degrees) {
    return degrees * Math.PI / 180;
}

function hex2rgb(hex) {
    // 'hexToRgb' function copied from 'https://stackoverflow.com/questions/5623838'
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    var rgb = hexToRgb(hex.trim());
    rgb = [rgb.r, rgb.g, rgb.b, 1.0];
    for (var i = 0; i < rgb.length; i++)
        rgb[i] /= 255;
    return rgb;
}

function point2string(x, y) {
    return "{" + x.toString() + ", " + y.toString() + "}";
}
