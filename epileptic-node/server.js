var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/../epileptic-frontend/'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
server.listen(7000,"0.0.0.0");

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

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

function sendToClients(color, bpm) {
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
