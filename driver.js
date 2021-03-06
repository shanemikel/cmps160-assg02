#include "shapes.js"
#include "util.js"


#define POINT_SIZE 5
#define SIDES 12
#define RADIUS 0.06
#define TRANSLATE 0

var WHITE       = null;
var BLACK       = null;
var RED         = null;
var GREEN       = null;
var BLUE        = null;
var GREY        = null;
var DARK_GREY   = null;
var LIGHT_GREY  = null;

var DEFAULT_POLYLINE_COLOR = null;
var DEFAULT_CYLINDER_COLOR = null;

var g_canvas = null;

var WIDTH  = null;
var HEIGHT = null;
var COLOR  = null;

var g_mouse_focus = false;

var g_point_size     = POINT_SIZE;
var g_building_line  = false;
var g_polylines      = null;
var g_sides          = SIDES;
var g_radius         = RADIUS;
var g_cylinders      = null;
var g_translate      = TRANSLATE;

function init() {
    WHITE       = hex2rgb($('#g-colors').css('--white'));
    BLACK       = hex2rgb($('#g-colors').css('--black'));
    RED         = hex2rgb($('#g-colors').css('--red'));
    GREEN       = hex2rgb($('#g-colors').css('--green'));
    BLUE        = hex2rgb($('#g-colors').css('--blue'));
    GREY        = hex2rgb($('#g-colors').css('--grey'));
    DARK_GREY   = hex2rgb($('#g-colors').css('--dark-grey'));
    LIGHT_GREY  = hex2rgb($('#g-colors').css('--light-grey'));

    DEFAULT_POLYLINE_COLOR = BLUE;
    DEFAULT_CYLINDER_COLOR = BLUE;

    WIDTH  = $('#g-webgl').css('width');
    HEIGHT = $('#g-webgl').css('height');
    COLOR  = hex2rgb($('#g-webgl').css('--background-color'));

    g_canvas = $('#webgl');
    g_canvas.attr('width'  , WIDTH);
    g_canvas.attr('height' , HEIGHT);

    g_polylines = new Polylines(DEFAULT_POLYLINE_COLOR);
    g_cylinders = new Cylinders();

    setupIOSOR('io-sor');

    $('#sides-label').text(g_sides);
    $('#sides-slider').attr('step', 1);
    $('#sides-slider').attr('min', 4);
    $('#sides-slider').attr('max', 99);
    $('#sides-slider').attr('value', g_sides);

    $('#radius-label').text(g_radius.toFixed(2));
    $('#radius-slider').attr('step', 0.01);
    $('#radius-slider').attr('min', 0.01);
    $('#radius-slider').attr('max', 1.00);
    $('#radius-slider').attr('value', g_radius);
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
    
    $('#sides-slider').on('input', function() {
        $(this).trigger('change');
    });
    $('#sides-slider').change(function() {
        g_sides = this.value;
        $('#sides-label').text(g_sides);
        render(gl);
    });

    $('#radius-slider').on('input', function() {
        $(this).trigger('change');
    });
    $('#radius-slider').change(function() {
        g_radius = parseFloat(this.value);
        $('#radius-label').text(g_radius.toFixed(2));
        render(gl);
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
    g_polylines.current = new Polyline(DEFAULT_POLYLINE_COLOR);

    for (var i = 0; i < points.length - 1; i++) {
        console.log('Defined cylinder: '
                    + vector2string(points[i])
                    + ' => '
                    + vector2string(points[i + 1]));

        var cylinder = new Cylinder(points[i], points[i + 1], DEFAULT_CYLINDER_COLOR);
        // console.log('Cylinder volume: ' + cylinder.volume());

        make_cylinder_control(gl, g_cylinders.insert(cylinder));
    }
    render(gl, mouse_xy);
}

function make_cylinder_control(gl, i) {
    var label = i.toString();
    if (label.length < 2) label = '0' + label;

    $('#cylinder-controls').append(`
            <div id="cylinder-control-${i}" class="control-group">
              <button class="remove" type="button"><i class="fas fa-times"></i></button>
              <code>${label}</code>
              <button class="red" type="button">Red</button>
              <button class="green" type="button">Green</button>
              <button class="blue" type="button">Blue</button>
            </div>
        `);

    var control_selector = `#cylinder-control-${i}`;

    $(control_selector).children('button.remove').first().click(function() {
        console.log('Removing cylinder: ' + i);
        $(control_selector).remove();
        g_cylinders.remove(i);
        render(gl);
    });
    $(control_selector).children('button.red').first().click(function() {
        console.log('Setting color of cylinder: ' + i);
        g_cylinders.at(i).setColor(RED);
        render(gl);
    });
    $(control_selector).children('button.green').first().click(function() {
        console.log('Setting color of cylinder: ' + i);
        g_cylinders.at(i).setColor(GREEN);
        render(gl);
    });
    $(control_selector).children('button.blue').first().click(function() {
        console.log('Setting color of cylinder: ' + i);
        g_cylinders.at(i).setColor(BLUE);
        render(gl);
    });
}


function render(gl, mouse_xy) {
    clear(gl, COLOR);

    render_grid(gl, DARK_GREY);
    // render_polygon_test(gl);

    render_polylines(gl, mouse_xy);
    render_cylinders(gl);
}

function render_polygon_test(gl) {
    render_line_loop(gl, 2, (new Circle(ORIGIN, 0.5)).toPolygon(16), GREEN);
    render_line_loop(gl, 2, (new Circle(ORIGIN, 0.5)).toPolygon( 8), RED);
    render_line_loop(gl, 2, (new Circle(ORIGIN, 0.5)).toPolygon( 4), BLUE);
}

function render_grid(gl, color) {
    var vertices = [];
    vertices.push([-1.0,  0.0, 0.0]);
    vertices.push([ 1.0,  0.0, 0.0]);
    vertices.push([ 0.0, -1.0, 0.0]);
    vertices.push([ 0.0,  1.0, 0.0]);
    render_lines(gl, 2, vertices, color);

    vertices = [];
    var tick_length = 0.02;
    var tick_space  = 0.1;
    for (var i = 1; i <= 2 / tick_space - 1; i++) {
        var tick = i * tick_space - 1;

        vertices.push([-tick_length, tick, 0.0]);
        vertices.push([ tick_length, tick, 0.0]);

        vertices.push([tick, -tick_length, 0.0]);
        vertices.push([tick,  tick_length, 0.0]);
    }
    render_lines(gl, 1, vertices, color);
}

function render_cylinders(gl) {
    g_cylinders.map(function(i, cylinder) {
        render_lines(gl, 1, cylinder.toFrame(g_sides, g_radius), cylinder.getColor());
    });
}

function render_polylines(gl, mouse_xy) {
    g_polylines.map(function(i, polyline) {
        render_line_strip(gl, 2, polyline.getPoints(), polyline.getColor());
        render_points(gl, g_point_size, polyline.getPoints(), polyline.getColor());
    });

    var polyline = g_polylines.current;
    if (polyline.getPoints().length == 0) return;
    if (g_mouse_focus) {
        render_line_strip(gl, 2, polyline.getPoints(mouse_xy), polyline.getColor());
        render_points(gl, g_point_size, polyline.getPoints(mouse_xy), polyline.getColor());
    } else {
        render_line_strip(gl, 2, polyline.getPoints(), polyline.getColor());
        render_points(gl, g_point_size, polyline.getPoints(), polyline.getColor());
    }
}
