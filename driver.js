#include "shapes.js"
#include "util.js"


#define POINT_SIZE 5
#define SIDES 12
#define RADIUS 0.1

var RED   = null;
var GREEN = null;
var BLUE  = null;

var WHITE = [1.0, 1.0, 1.0, 1.0];
var BLACK = [0.0, 0.0, 0.0, 1.0];

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
    g_polylines.current.addPoint(x, y);

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

    for (var i = 0; i < points.length - 1; i++) {
        var cylinder = new Cylinder(points[i], points[i + 1]);
        // console.log('Cylinder volume: ' + cylinder.volume());
        g_cylinders.push(cylinder);
    }

    render(gl, mouse_xy);
}


function render(gl, mouse_xy) {
    clear(gl, BLACK);

    render_polylines(gl, mouse_xy);
    render_cylinders(gl);
}

function render_cylinders(gl) {
    gl.lineWidth(1.0);

    for (var i = 0; i < g_cylinders.length; i++) {
        var cylinder = g_cylinders[i];
        render_lines(gl, cylinder.toFrame(g_sides, g_radius), cylinder.getColor());
    }
}

function render_polylines(gl, mouse_xy) {
    gl.lineWidth(2.0);

    g_polylines.map(function(i, polyline) {
        render_line_strip(gl, polyline.getPoints(), polyline.getColor());
        render_points(gl, g_point_size, polyline.getPoints(), polyline.getColor());
    });

    var polyline = g_polylines.current;
    if (polyline.getPoints().length == 0) return;
    if (g_mouse_focus) {
        render_line_strip(gl, polyline.getPoints(mouse_xy), polyline.getColor());
        render_points(gl, g_point_size, polyline.getPoints(mouse_xy), polyline.getColor());
    } else {
        render_line_strip(gl, polyline.getPoints(), polyline.getColor());
        render_points(gl, g_point_size, polyline.getPoints(), polyline.getColor());
    }
}
