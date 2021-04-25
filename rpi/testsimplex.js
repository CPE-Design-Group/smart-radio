const DRA818V = require("./DRA818V");

const radio = new DRA818V();

radio.connect().then(() => {
    Promise.all([
        radio.setReceiveCTCSS(0),
        radio.setTransmitCTCSS(0),
        radio.setSquelchLevel(1),
        radio.setTransmitFrequency(144.420),
        radio.setReceiveFrequency(144.420),
        radio.setPreDeEmph(false),
        radio.setVolume(8)
    ]).then(console.log("done"));
});
