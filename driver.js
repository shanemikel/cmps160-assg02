#define WHITE [1.0, 1.0, 1.0, 1.0]

var RED   = null;
var GREEN = null;
var BLUE  = null;

var g_reinit_lock = false;
var g_canvas      = null;

var WIDTH  = null;
var HEIGHT = null;

function init() {
    $(window).resize(function() {
        if (! g_reinit_lock) reinit();
    });

    RED   = hex2rgb($('#g-colors').css('--red'));
    GREEN = hex2rgb($('#g-colors').css('--green'));
    BLUE  = hex2rgb($('#g-colors').css('--blue'));

    reinit();
}

function reinit() {
    g_reinit_lock = true;

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , WIDTH);
    g_canvas.attr('height' , HEIGHT);

    g_reinit_lock = false;
}


function main() {
    init();

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

    gl.lineWidth(2.0);
    render(gl);
}

function render(gl) {
    clear(gl);
    
    var circle = new Circle([0.0, 0.0, 0.0], 0.75);
    render_ngon(gl , circle.toNGon(100) , RED   , false);
    render_ngon(gl , circle.toNGon(  8) , GREEN , false);
    render_ngon(gl , circle.toNGon(  4) , BLUE  , false);
}


function flatten(arr) {
    var res = new Float32Array(arr.length * 3);
    for (var i = 0; i < arr.length; i++) {
        res[3 * i]     = arr[i][0];
        res[3 * i + 1] = arr[i][1];
        res[3 * i + 2] = arr[i][2];
    }
    return res;
}

var Circle = function(center, radius) {
    this.center = center;
    this.radius = radius;
};

Circle.prototype = {
    toNGon: function(n) {
        var sliceAngle = 2 * Math.PI / n;

        var res = [];
        for (var i = 0; i < n; i++) {
            if (n % 2 == 0) {  // 'n' is even
                var x = this.radius * Math.cos(i * sliceAngle);
                var y = this.radius * Math.sin(i * sliceAngle);
            } else {
                var y = this.radius * Math.cos(i * sliceAngle);
                var x = this.radius * Math.sin(i * sliceAngle);
            }
            res[i] = [x, y, 0.0];
        }

        return res;
    }
};


function clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function render_ngon(gl, vertices, color, fill) {
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (fill)
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
    else
        gl.drawArrays(gl.LINE_LOOP, 0, vertices.length);
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


function point2string(x, y) {
    return "{" + x.toString() + ", " + y.toString() + "}";
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
