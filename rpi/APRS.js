const DRA818V = require("./DRA818V");
const fs = require("fs");

class APRS {
    constructor() {
        this.radio = new DRA818V();
    }

    init() {
        return new Promise((resolve, reject) => {
            this.radio.connect().then(() => {
                Promise.all([
                    //this.radio.setReceiveCTCSS(0),
                    this.radio.setTransmitCTCSS(0),
                    //this.radio.setSquelchLevel(0),
                    this.radio.setPreDeEmph(false),
                    //this.radio.setVolume(8),
                    this.radio.setTransmitFrequency(144.39),
                    //this.radio.setReceiveFrequency(144.39)
                ]).then(() => resolve()).catch(() => reject());
            });
        })
    }

    transmitPacket(packet) {
        return new Promise((resolve, reject) => {
            fs.writeFile(__dirname + `/xmit/tx-${Date.now()}`, packet + "\n", (err, data) => {
                if (err) reject(err)
                else resolve(data)
            });
        });
    }
}

module.exports = APRS;
