#include "shapes.js"
#include "util.js"


var RED   = null;
var GREEN = null;
var BLUE  = null;

var g_canvas = null;

var WIDTH  = null;
var HEIGHT = null;

function init() {
    RED   = hex2rgb($('#g-colors').css('--red'));
    GREEN = hex2rgb($('#g-colors').css('--green'));
    BLUE  = hex2rgb($('#g-colors').css('--blue'));

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , WIDTH);
    g_canvas.attr('height' , HEIGHT);
}


function main() {
    init();

    var gl = getWebGLContext(g_canvas[0]);
    if (! gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (! initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    gl.lineWidth(1.0);
    render(gl);
}

function render(gl) {
    clear(gl);
    
    var circle = new Circle([0.0, 0.0, 0.0], [0.0, 0.0, 1.0], 0.75);
    // render_ngon(gl , circle.toNGon(100) , RED   , false);
    // render_ngon(gl , circle.toNGon(  8) , GREEN , false);
    // render_ngon(gl , circle.toNGon(  4) , BLUE  , false);

    var xform = new Matrix();
    xform = xform.scale(0.25);

    var ngon     = circle.toNGon(5);
    var vertices = triangles(ngon);

    res = [];
    for (var i = 0; i < vertices.length; i++)
        res[i] = xform.multiply(vertices[i]);

    render_ngon(gl, res, RED, false);
}


function triangles(ngon) {
    var res = [];
    for (var i = 0; i < ngon.length; i++) {
        var i2 = (i + 1) % ngon.length;
        res.push([0.0, 0.0, 0.0]);
        res.push(ngon[i]);
        res.push(ngon[i]);
        res.push(ngon[i2]);
    }
    return res;
}


function clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function render_ngon(gl, vertices, color) {
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(3, vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.LINES, 0, vertices.length);
}

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '}\n';

var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';
