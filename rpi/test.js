const DRA818V = require("./DRA818V");

const radio = new DRA818V();

radio.connect()
    .then(res => {
        console.log(res);
        radio.transmitMessage(2000);
    })
    .catch(e => console.error(e));
