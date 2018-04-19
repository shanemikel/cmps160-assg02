#define WHITE [1.0, 1.0, 1.0, 1.0]

var RED   = null;
var GREEN = null;
var BLUE  = null;

var g_canvas = null;

function init() {
    RED   = hex2rgb($('#g-colors').css('--red'));
    GREEN = hex2rgb($('#g-colors').css('--green'));
    BLUE  = hex2rgb($('#g-colors').css('--blue'));

    var webgl_width  = $('#g-webgl').css('width');
    var webgl_height = $('#g-webgl').css('height');

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , webgl_width);
    g_canvas.attr('height' , webgl_height);
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

    clear(gl);
    
    gl.lineWidth(2.0);
    var circle = new Circle2d([0.0, 0.0], 0.75);
    renderNgon(gl , circle.toNgon(100) , RED   , false);
    renderNgon(gl , circle.toNgon(8)   , GREEN , false);
    renderNgon(gl , circle.toNgon(5)   , BLUE  , false);
}

function clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function flatten(arr) {
    var res = new Float32Array(arr.length * 2);
    for (var i = 0; i < arr.length; i++) {
        res[2 * i]     = arr[i][0];
        res[2 * i + 1] = arr[i][1];
    }
    return res;
}

var Circle2d = function(center, radius) {
    this.center = center;
    this.radius = radius;
};

Circle2d.prototype = {
    toNgon: function(n) {
        // Returns an array of 'n' points, corresponding to the vertices of the n-gon
        //   inscribed in the circle.  (Expects 'n' >= 3)
        var sliceAngle = 2 * Math.PI / n;

        var res = [];
        for (var i = 0; i < n; i++) {
            if (n % 2 === 0) {  // 'n' is even
                var x = this.radius * Math.cos(i * sliceAngle);
                var y = this.radius * Math.sin(i * sliceAngle);
            } else {
                var y = this.radius * Math.cos(i * sliceAngle);
                var x = this.radius * Math.sin(i * sliceAngle);
            }
            res[i] = [x, y];
        }

        return res;
    },
};

function renderNgon(gl, ngon_points, color, fill) {
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(ngon_points), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (fill) {
        gl.drawArrays(gl.TRIANGLE_FAN, 0, ngon_points.length);
    } else {
        gl.drawArrays(gl.LINE_LOOP, 0, ngon_points.length);
    }
}


function point2string(x, y) {
    return "{" + x.toString() + ", " + y.toString() + "}";
}
