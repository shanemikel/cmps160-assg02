#include "shapes.js"

#define POINT_SIZE 8


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

var g_mouseFocus = false;
var g_pointSize = POINT_SIZE;
$('#point-size-label').text(g_pointSize);
$('#point-size-slider').attr('value', g_pointSize);

var g_buildingLine = false;
var g_polyLines = new PolyLines();


function main() {
    var canvas = g_canvas[0];

    var gl = getWebGLContext(g_canvas[0]);
    if (! gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    $('#polylines-reset').click(function() {
        console.log('Resetting the application to initial state...');

        g_pointSize = POINT_SIZE;
        $('#point-size-slider').val(g_pointSize).trigger('change');

        g_polyLines = new PolyLines();
        $('#polyline-controls').html('<a> PolyLine Controls </a>').attr('hidden', 'true');
        renderPolyLines(gl, g_pointSize);
    });

    $('#point-size-slider').on('change mousemove', function() {
        g_pointSize = $('#point-size-slider').val();
        $('#point-size-label').text(g_pointSize);
        renderPolyLines(gl, g_pointSize);
    });

    if (! initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    g_canvas.mouseenter(function() {
        g_mouseFocus = true;
        console.log('Canvas has mouse focus: ' + g_mouseFocus);
    });

    g_canvas.mouseout(function() {
        g_mouseFocus = false;
        console.log('Canvas has mouse focus: ' + g_mouseFocus);
        renderPolyLines(gl, g_pointSize);
    });

    g_canvas.mousedown(function(ev) {
        switch (ev.which) {
        case 1:
            click(gl, getMouseXY(ev));
            break;
        case 3:
            rightClick(gl, getMouseXY(ev));
            break;
        }
    });

    g_canvas.mousemove(function(ev) {
        renderPolyLines(gl, g_pointSize, getMouseXY(ev));
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


function renderPolyLines(gl, pointSize, mouseXY) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    g_polyLines.map(function(i, polyLine) {
        renderPolyLine(gl, polyLine, pointSize);
    });
    if (g_mouseFocus) {
        renderPolyLine(gl, g_polyLines.current, pointSize, mouseXY);
    } else {
        renderPolyLine(gl, g_polyLines.current, pointSize);
    }
}

function renderPolyLine(gl, polyLine, pointSize, mouseXY) {
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
    gl.uniform1f(u_PointSize, pointSize);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (! u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    var color = polyLine.getColor();
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    var vertexBuffer = gl.createBuffer();
    if (! vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    var buffer = polyLine.flatten(mouseXY);
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


function click(gl, mouseXY) {
    g_buildingLine = true;
    
    var x = mouseXY[0];
    var y = mouseXY[1];

    console.log("Recieved click: " + point2string(x, y));

    polyLine = g_polyLines.current;
    polyLine.pushPoint(x, y);

    renderPolyLines(gl, g_pointSize, mouseXY);
}

function rightClick(gl, mouseXY) {
    var x = mouseXY[0];
    var y = mouseXY[1];

    console.log("Recieved right-click: " + point2string(x, y));

    if (! g_buildingLine)
        return;
    g_buildingLine = false;

    var j = g_polyLines.makeNew();
    var points = g_polyLines.at(j).getPoints();
    for (var i = 0; i < points.length; i++) {
        var point = points[i];
        console.log("g_polyLines[" + j + "][" + i + "]: " + point2string(point[0], point[1]));
    }

    var polyLineControl = `
        <div id="polyline-control-${j}" class="control">
	  <a> ${j} </a>
	  <button class="remove" type="button">
            <i class="fas fa-times"></i>
          </button>
	  <button class="red" type="button">
            <code>RED</code>
          </button>
	  <button class="white" type="button">
            <code>WHITE</code>
          </button>
	  <button class="blue" type="button">
            <code>BLUE</code>
          </button>
	</div>
    `;
    $('#polyline-controls').removeAttr('hidden').append(polyLineControl);

    polyLineControl = $('#polyline-control-' + j);
    polyLineControl.children('button.remove').first().click(function() {
        console.log('Removing PolyLine ' + j + '...');

        $('#polyline-control-' + j).remove();
        g_polyLines.remove(j);
        renderPolyLines(gl, g_pointSize);

        if (g_polyLines.count === 0) {
            console.log('PolyLine count is 0, hiding controls...');
            $('#polyline-controls').attr('hidden', 'true');
        }
    });
    polyLineControl.children('button.red').first().click(function() {
        console.log('Changing color of PolyLine ' + j + '...');

        g_polyLines.at(j).setColor(RED);
        renderPolyLines(gl, g_pointSize);
    });
    polyLineControl.children('button.white').first().click(function() {
        console.log('Changing color of PolyLine ' + j + '...');
        
        g_polyLines.at(j).setColor(WHITE);
        renderPolyLines(gl, g_pointSize);
    });
    polyLineControl.children('button.blue').first().click(function() {
        console.log('Changing color of PolyLine ' + j + '...');

        g_polyLines.at(j).setColor(BLUE);
        renderPolyLines(gl, g_pointSize);
    });

    renderPolyLines(gl, g_pointSize);
}


function point2string(x, y) {
    return "{" + x.toString() + ", " + y.toString() + "}";
}
