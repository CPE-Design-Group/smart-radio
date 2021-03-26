const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

class UART {

    writeLine(message) {
        if (this.debug) console.log(`TX: ${message}`);
        this.port.write(`${message}\r\n`);
    }

    constructor(serialPort, baudRate = 9600, debug = false) {
        this.outBuffer = [];
        this.requestInProgress = false;
        this.debug = debug;

        this.port = new SerialPort(serialPort, { baudRate });
        
        this.port.on("error", e => {
            this.session.reject(e.message);
            this.session.lock = false;
        });
        
        this.parser = this.port.pipe(new Readline({delimiter: "\r\n"}));
        
        this.parser.on("data", data => {
            this.outBuffer[0].resolve(data);
            this.outBuffer.splice(0, 1);

            // debug
            if (this.debug) console.log(`RX: ${data}`);

            if (this.outBuffer.length) this.handleBuffer();
            else (this.requestInProgress = false);
        });
    }

    handleBuffer() {
        if (this.outBuffer.length) {
            this.requestInProgress = true;
            const req = this.outBuffer[0];
            this.writeLine(req.message);
        }
    }

    write(message) {
        return new Promise((resolve, reject) => {
            this.outBuffer.push({
                message,
                resolve,
                reject
            });

            if (!this.requestInProgress) this.handleBuffer();
        })
    }
}

module.exports = UART;