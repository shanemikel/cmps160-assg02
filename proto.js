#include "shapes.js"

#define POINT_SIZE 5


var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform float u_PointSize;' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  gl_PointSize = u_PointSize;\n' +
    '}\n';

var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';


var g_canvas = $('#webgl');

var g_polyline = new Polyline();


function main() {
    var canvas = g_canvas[0];

    var gl = getWebGLContext(g_canvas[0]);
    if (! gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (! initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    g_canvas.mousedown(function(ev) {
        switch (ev.which) {
        case 1:
            click(gl, getMouseXY(ev));
            break;
        case 3:
            rightClick(gl);
            break;
        }
    });

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.lineWidth(3.0);
}


function getMouseXY(ev) {
    var x = ev.clientX;  // x coordinate of a mouse pointer
    var y = ev.clientY;  // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    var canvas = g_canvas;

    x = ((x - rect.left) - canvas.width() / 2)/(canvas.width() / 2);
    y = (canvas.height() / 2 - (y - rect.top))/(canvas.height() / 2);

    return [x, y];
}


function renderPolyline(gl, polyline, mouseXY) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    gl.uniform1f(u_PointSize, POINT_SIZE);
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    var color = polyline.getColor();
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    var buffer = polyline.flatten(mouseXY);

    var count = buffer.length / 2;
    if (count === 0)
        return;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.drawArrays(gl.LINE_STRIP, 0, count);
}

function renderPolygon(gl, polyline) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    gl.uniform1f(u_PointSize, POINT_SIZE);
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    var color = polyline.getColor();
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    var buffer = polyline.flatten();

    var count = buffer.length / 2;
    if (count === 0)
        return;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, count);
}


function click(gl, mouseXY) {
    var x = mouseXY[0];
    var y = mouseXY[1];

    console.log("Recieved click: " + point2string(x, y));

    g_polyline.pushPoint(x, y);
    renderPolyline(gl, g_polyline, mouseXY);
}

function rightClick(gl) {
    renderPolygon(gl, g_polyline);
}


function point2string(x, y) {
    return "{" + x.toString() + ", " + y.toString() + "}";
}
