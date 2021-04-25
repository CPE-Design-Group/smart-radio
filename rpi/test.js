const APRS = require("./APRS");

const aprs = new APRS();

aprs.init().then(res => {
    aprs.transmitPacket(process.argv[2])
        .then(res => console.log("success"))
        .catch(e => console.error(e));
}).catch(e => console.log(e));
