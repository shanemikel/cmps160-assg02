#define RED   [1.0, 0.4, 0.4, 1.0]
#define GREEN [0.4, 1.0, 0.4, 1.0]
#define BLUE  [0.4, 0.4, 1.0, 1.0]
#define WHITE [1.0, 1.0, 1.0, 1.0]


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


var g_canvas = $('#webgl');


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
