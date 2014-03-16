var socket;
var output;
var intervalId;

function init() {
    output = $("#color");
    output_image = $("#image");
    socket =  io.connect("http://"+window.location.hostname);
    
    blink("#FF0000", 100, 600);

    socket.on('data', onDataEvent);
}

function onDataEvent(data) {
    console.log(data);

    if (data.image) {
        blink(data.color, data.duration, data.interval, true);
        setImage(data.image);
    } else {
        blink(data.color, data.duration, data.interval, false);
        output.css('opacity', 1);
    }
}

function blink(color, duration, interval, hasImage) {
    clearRequestInterval(intervalId);
    intervalId = requestInterval(function() { 
        flash(color, duration, hasImage); 
    }, interval);
}

function flash(color, duration, hasImage) {
    //console.log("blink", color, duration);
    setColor(color);
    requestTimeout(function() {
        if (hasImage) {
            setColor(color);
        } else {
            setColor('black');
        }
    }, duration);
}

function setColor(color) {
    //console.log("color", color);
    if (typeof color === "undefined") {
        color = "black";
    } else {
        output.css('background-color', color);
    }
};

function setImage(image) {
    output_image.css('background-image', 'url('+image+')');
    output.css('opacity', 0.8);
}

$(function() {
    init();
});


