#include "shapes.js"
#include "util.js"


#define POINT_SIZE 5
#define SIDES 12
#define RADIUS 0.1

var RED   = null;
var GREEN = null;
var BLUE  = null;

var WHITE = [1.0, 1.0, 1.0, 1.0];

var g_canvas = null;

var WIDTH  = null;
var HEIGHT = null;

var g_mouse_focus = false;

var g_point_size     = POINT_SIZE;
var g_building_line  = false;
var g_polylines      = null;
var g_sides          = SIDES;
var g_radius         = RADIUS;
var g_cylinders      = null;

function init() {
    RED   = hex2rgb($('#g-colors').css('--red'));
    GREEN = hex2rgb($('#g-colors').css('--green'));
    BLUE  = hex2rgb($('#g-colors').css('--blue'));

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , WIDTH);
    g_canvas.attr('height' , HEIGHT);

    g_polylines = new Polylines();
    g_cylinders = [];
}


function main() {
    init();

    var gl = getWebGLContext(g_canvas[0]);
    if (! gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    start(gl);
}

function start(gl) {
    if (! initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    setup_callbacks(gl);

    render(gl);
}

function setup_callbacks(gl) {
    g_canvas.mouseenter(function() {
        console.log('Canvas has mouse focus: ' + g_mouse_focus);
        g_mouse_focus = true;
        render(gl);
    });

    g_canvas.mouseout(function() {
        console.log('Canvas has mouse focus: ' + g_mouse_focus);
        g_mouse_focus = false;
        render(gl);
    });

    g_canvas.mousedown(function(ev) {
        switch (ev.which) {
        case 1:
            var mouse_xy = get_mouse_xy(g_canvas, ev);
            console.log('Recieved left-click: ' + mouse_xy);
            click(gl, mouse_xy);
            break;
        case 3:
            var mouse_xy = get_mouse_xy(g_canvas, ev);
            console.log('Recieved right-click: ' + mouse_xy);
            right_click(gl, mouse_xy);
            break;
        }
    });

    g_canvas.mousemove(function(ev) {
        render(gl, get_mouse_xy(g_canvas, ev));
    });
}

function click(gl, mouse_xy) {
    var x = mouse_xy[0];
    var y = mouse_xy[1];

    g_building_line = true;

    g_polylines.current.pushPoint(x, y);

    render(gl, mouse_xy);
}

function right_click(gl, mouse_xy) {
    var x = mouse_xy[0];
    var y = mouse_xy[1];

    if (! g_building_line)
        return;
    g_building_line = false;

    var points = g_polylines.current.getPoints();
    g_polylines.current = new Polyline();

    console.log('Adding cylinder: '
                + point2string(points[0][0], points[0][1], points[0][2])
                + ' => '
                + point2string(points[1][0], points[1][1], points[1][2]));
    var cylinder = new Cylinder(points[0], points[1]);
    g_cylinders.push(cylinder);

    render(gl, mouse_xy);
}


function render(gl, mouse_xy) {
    clear(gl);
    
    render_polylines(gl, mouse_xy);
    render_cylinders(gl);
}

function clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function render_cylinders(gl) {
    gl.lineWidth(1.0);

    for (var i = 0; i < g_cylinders.length; i++) {
        render_cylinder(gl, g_cylinders[i]);
    }
}

function render_cylinder(gl, cylinder) {
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var color       = cylinder.getColor();
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var buffer = flatten(3, cylinder.toFrame(g_sides, g_radius));
    var count  = buffer.length / 3;

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.LINES, 0, count);
}


function render_polylines(gl, mouse_xy) {
    gl.lineWidth(2.0);

    g_polylines.map(function(i, polyline) {
        render_polyline(gl, polyline);
    });

    if (g_mouse_focus)
        render_polyline(gl, g_polylines.current, mouse_xy);
    else
        render_polyline(gl, g_polylines.current);
}

function render_polyline(gl, polyline, mouse_xy) {
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    if (! u_PointSize) {
        console.log('Failed to get the storage location of u_PointSize');
        return;
    }
    gl.uniform1f(u_PointSize, g_point_size);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (! u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    var color = polyline.getColor();
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    var buffer = polyline.flatten(mouse_xy);
    var count  = buffer.length / 3;

    if (count == 0)
        return;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.drawArrays(gl.LINE_STRIP, 0, count);
}


var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n'     +
    'uniform float u_PointSize;\n'     +
    'void main() {\n'                  +
    '  gl_Position = a_Position;\n'    +
    '  gl_PointSize = u_PointSize;\n'  +
    '}';

var FSHADER_SOURCE =
    'precision mediump float;\n'       +
    'uniform vec4 u_FragColor;\n'      +
    'void main() {\n'                  +
    '  gl_FragColor = u_FragColor;\n'  +
    '}';
