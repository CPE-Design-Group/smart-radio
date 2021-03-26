const UART = require("./UART");
const gpio = require("rpi-gpio");
const { DIR_OUT } = gpio;

const DEBUG = false;

const ctcssFreqs = [67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9, 114.8, 118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8, 179.9, 186.2, 192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3];
function freqToCTCSS_Tone(freq) {
    const number = ctcssFreqs.findIndex(el => el === freq) + 1;
    return number ? number.toString().padStart(4, '0') : 0;
}

class DRA818V {
    constructor(serialPort = "/dev/serial0", config = { baudRate: 9600, pttPin: 7 }) {
        this.uart = new UART(serialPort, config.baudRate, DEBUG);

        // initial config, eventually read from file to save across restarts
        this.currentConfig = {
            channelSpace: 0,
            txFreq: 147.420, 
            rxFreq: 147.420,
            txCTCSS: 100.0,
            rxCTCSS: 100.0,
            sqLevel: 4
        };

        this.currentFilter = {
            preDeEmph: false,
            highPass: true,
            lowPass: true
        }

        // setup PTT pin
        this.pttPin = config.pttPin;
        gpio.setup(config.pttPin, DIR_OUT, e => {
            if (e) console.log(e);
            else {
                gpio.write(this.pttPin, true); // default to RX
            }
        });
    }

    sendCommand(command) {
        return new Promise((resolve, reject) => {
            this.uart.write(command)
                .then(res => {
                    if (res === "+DMOERROR") {
                        reject("Invalid Command");
                    }
                    else resolve(res);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.sendCommand("AT+DMOCONNECT")
                .then(() => {
                    console.log("Connected to DRA818V");
                    Promise.all([
                        this.setGroup(this.currentConfig),
                        this.setFilter(this.currentFilter)
                    ]).then(resolve("Set Parameters and Filter"))
                      .catch(reject(e));
                })
                .catch((e) => reject(`Could not connect to DRA818V: ${e}`));
        })
    }

    isSignalAtFrequency(freq) {
        return new Promise((resolve, reject) => {
            this.sendCommand(`S+${freq.toFixed(4)}`).then(res => {
                if (res === "S=1") resolve(false);
                else if (res === "S=0") resolve(true);
                else reject("Invalid Response");
            })
            .catch(e => reject(e));
        });
    }

    setGroup(params) {
        const {channelSpace, txFreq, rxFreq, txCTCSS, sqLevel, rxCTCSS} = params;

        return new Promise((resolve, reject) => {
            // transform
            const e_txCTCSS = freqToCTCSS_Tone(txCTCSS);
            const e_rxCTCSS = freqToCTCSS_Tone(rxCTCSS);

            // validation
            if (![0, 1].includes(channelSpace)) { reject("channelSpace must be in [0, 1]"); return }
            if (txFreq < 134 || txFreq > 174) { reject("txFreq must be in [134.0000, 174.0000]"); return }
            if (rxFreq < 134 || txFreq > 174) { reject("rxFreq must be in [134.0000, 174.0000]"); return }
            if (!e_txCTCSS) { reject("txCTCSS invalid"); return }
            if (!e_rxCTCSS) { reject("rxCTCSS invalid"); return }
            if (sqLevel < 0 || sqLevel > 8) { reject("sqLevel must be in [0, 8]"); return }

            const formatFreq = freq => freq.toFixed(4);

            const paramArray = [channelSpace, formatFreq(txFreq), formatFreq(rxFreq), e_txCTCSS, sqLevel, e_rxCTCSS];
            this.sendCommand(`AT+DMOSETGROUP=${paramArray.join(',')}`)
                .then(res => {
                    if (res === "+DMOSETGROUP:0") {
                        this.currentConfig = params;
                        resolve("Parameters Set Successfully");
                    }
                    else if (res === "+DMOSETGROUP:1") reject("Data Out of Range");
                    else reject(`Failed to set Parameters: ${res}`);
                })
                .catch(e => reject(e));
        });
    }

    setVolume(volume) {
        return new Promise((resolve, reject) => {
            if (volume < 1 || volume > 8) { reject("volume must be in [1, 8]"); return }

            const encodedVolume = volume.toFixed(0);

            this.sendCommand(`AT+DMOSETVOLUME=${encodedVolume}`)
                .then(res => {
                    if (res === "+DMOSETVOLUME:0") resolve(`Volume Set to ${encodedVolume}`);
                    else if (res === "+DMOSETVOLUME:1") reject(`Failed to set volume to ${encodedVolume}`);
                    else reject(`Failed to Set Volume: ${res}`);
                })
                .catch(e => reject(`Failed to Set Volume: ${e}`));
        })
    }

    setFilter(params) {
        const { preDeEmph, highPass, lowPass } = params;
        const boolToBin = bool => bool ? '0' : '1';

        return new Promise((resolve, reject) => {
            this.sendCommand(`AT+SETFILTER=${boolToBin(preDeEmph)},${boolToBin(highPass)},${boolToBin(lowPass)}`)
                .then(res => {
                    if (res === "+DMOSETFILTER:0") {
                        this.currentFilter = params;
                        resolve("Filter Set Successfully")
                    }
                    else reject("Unable to Set Filter")
                })
                .catch(e => reject("Unable to Set Filter"));
        });
    }

    // setters
    setChannelSpace(channelSpace) { return this.setGroup({...this.currentConfig, channelSpace}) }
    setTransmitFrequency(txFreq) { return this.setGroup({...this.currentConfig, txFreq}) }
    setReceiveFrequency(rxFreq) { return this.setGroup({...this.currentConfig, rxFreq}) }
    setTransmitCTCSS(txCTCSS) { return this.setGroup({...this.currentConfig, txCTCSS}) }
    setReceiveCTCSS(rxCTCSS) { return this.setGroup({...this.currentConfig, rxCTCSS}) }
    setSquelchLevel(sqLevel) { return this.setGroup({...this.currentConfig, sqLevel}) }

    setPreDeEmph(preDeEmph) { return this.setFilter({...this.currentFilter, preDeEmph}) }
    setLowPass(lowPass) { return this.setFilter({...this.currentFilter, lowPass}) }
    setHighPass(highPass) { return this.setFilter({...this.currentFilter, highPass}) }

    // a stub right now
    transmitMessage(ms) {
        console.log("transmitting message");
        gpio.write(this.pttPin, false);
        setTimeout(() => gpio.write(this.pttPin, true), ms);
    }
}

module.exports = DRA818V;
