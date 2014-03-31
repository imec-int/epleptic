var _ = require('underscore')
    , express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , io_client = require('socket.io-client');

var midi_socket_server = "http://localhost:3000";
var lights_socket_server = "http://hacklights.mixapp.be/";

var prev_beats = [];
var current_color_index = 0;
var last_color_switch = +new Date();

var rainbow = [
        "rgb(230, 25, 25)",
        "rgb(230, 127, 25)",
        "rgb(230, 230, 25)",
        "rgb(128, 230, 25)",
        "rgb(25, 230, 25)",
        "rgb(25, 230, 128)",
        "rgb(25, 230, 230)",
        "rgb(230, 25, 230)"
    ];

app.use(express.static(__dirname + '/../epileptic-frontend/'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
server.listen(7000,"0.0.0.0");

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

// listen to the MIDI socket
var midi_socket = io_client.connect(midi_socket_server);
console.log('connecting to midi socket... ('+midi_socket_server+')');
midi_socket.on('connect', function(){
    console.log('connected to MIDI');
    midi_socket.on('midi', onMidiEvent);
    midi_socket.on('disconnect', function(){});
});

// connect to the lights socket
var lights_socket = io_client.connect(lights_socket_server);
console.log('connecting to lights socket... ('+lights_socket_server+')');
lights_socket.on('connect', function(){
    console.log('connected to lights');
});

// listen to sound input and time syncing thing
io.sockets.on('connection', function (socket) {
    console.log('[' + socket.handshake.address.address + '] user connected');

    socket.on('ping', function (clienttime, fn) {
        // console.log(clienttime);

        //respond:
        fn({
            clienttime: clienttime,
            servertime: Date.now()/1000
        });
    });

    socket.on("getRealServertime", function (traveltime, fn) {
        var now = Date.now()/1000;

        console.log('[' + socket.handshake.address.address + '] traveltime: ' + traveltime);

        fn({
            realServertime: now + traveltime,
            servertime: now
        });

        // store traveltime inside socket :-)
        socket.traveltime = traveltime;
    });

    socket.on('input', function(data) {
        console.log(data.bpm)
        console.log('[' + socket.handshake.address.address + '] input', data);

        sendToClients(data.color,data.bpm);
    });

    socket.on('disconnect', function() {
        console.log('[' + socket.handshake.address.address + '] user disconnected');
    });
});

app.post('/start', function (req, res) {
    var color = req.body.color,
        bpm = req.body.bpm;

    sendToClients(color, bpm);

    res.send(200);
});

app.post('/stop', function (req, res) {
    sendToClients("#111111",20);

    res.send(200);
});

function onMidiEvent(data) {
    var code = data[0];
    var note = data[1];
    var velocity = data[2];

    isBeat = (code == 145);
    isBeatLight = (code == 145 && note == 36);

    if (isBeatLight) {
      sendBeatToLightMan();
    }

    if (isBeat) {
        var beat = +new Date();
        prev_beats.push(beat);

        if (prev_beats.length > 10) {
            prev_beats.shift(1);
        }

        var diff, sum = 0;
        for (var i=1; i<prev_beats.length; i++) {
            diff = prev_beats[i] - prev_beats[i-1];
            sum += diff;
        }

        var avg_time_between_beats = sum/prev_beats.length; // milliseconds
        var bpm = Math.round(60000/avg_time_between_beats);

        console.log('beat', bpm);

        // switch colors
        var now = +new Date()
        if (last_color_switch && (now-last_color_switch) > 2000) {
            // switch color
            current_color_index = (current_color_index + 1) % rainbow.length;
            last_color_switch = now;
        }

        sendToLightMan(current_color_index);

        if (avg_time_between_beats > 0) {
            sendToClients("rainbow", bpm);
        }
    }
}

function sendToLightMan(colorIndex) {
     lights_socket.emit('hackevent', 'eplepticCOLOR'+colorIndex);
};

function sendBeatToLightMan() {
     lights_socket.emit('hackevent', 'eplepticbeat');
};



function sendToClients(color, bpm) {
    if (color == "rainbow") {
        color = rainbow[current_color_index];
    }

    console.log("color", color);

    var bpsecond = Math.round(bpm/60);
    var interval = 0;
    if (bpm != 0) {
        interval = (1000/bpsecond);
    }

    var duration = (interval/5);

    io.sockets.emit('data', {
        color: color,
        duration: duration,
        interval: interval
    });
}
