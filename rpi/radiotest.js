const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const port = new SerialPort("/dev/serial0", e => e && console.log("Error: ", e.message));
const parser = port.pipe(new Readline({delimiter: "\r\n"}))

// port.write("AT+DMOCONNECT\r\n");

setInterval(() => port.write("S+147.4200\r\n"), 1000);

parser.on("data", data => console.log("Data: ", data));
