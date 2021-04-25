const APRS = require("./APRS");

const aprs = new APRS();

const NMEA_msg = "$GPGGA,181908.00,3959.1727000,N,10514.3109000,W,4,13,1.00,495.144,M,29.200,M,0.10,0000*40";
const parts = NMEA_msg.split(',');
const lat = Number(parts[2]).toFixed(2) + parts[3];
const lng = Number(parts[4]).toFixed(2) + parts[5];


const basePosPacket = "WF4THC>APD69:=";
const pos = `${lat}/${lng}`;

// console.log(basePosPacket + pos + ">rq");

aprs.init().then(res => {
    aprs.transmitPacket(basePosPacket + pos + ">rq")
        .then(res => console.log("success"))
        .catch(e => console.error(e));
}).catch(e => console.log(e));
