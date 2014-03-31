var socket;
var output;
var intervalId;

function init() {
    output = $("#color");
    socket =  io.connect("http://"+window.location.hostname);

    blink("#FF0000", 100, 600);

    socket.on('data', onDataEvent);
}

function onDataEvent(data) {
    // console.log(data);
    blink(data.color, data.duration, data.interval);
    //socket.emit('my other event', { my: 'data' });
}

function blink(color, duration, interval) {
    clearRequestInterval(intervalId);
    intervalId = requestInterval(function() {
        flash(color, duration);
    }, interval);
}

function flash(color, duration) {
    //console.log("blink", color, duration);
    setColor(color);
    requestTimeout(function() {
        setColor("black");
    }, duration);
}

function setColor(color) {
    //console.log("color", color);
    if (typeof color === "undefined") {
        color = "black";
    }
    output.css('background-color', color);
};

$(function() {
    init();
});


