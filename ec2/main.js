const RepeaterDao = require("./RepeaterDao");
const RepeaterCodec = require("./buffer");
const { pick } = require("lodash");

class Server {
    constructor() {
        this.db = new RepeaterDao();
    }

    close() {
        this.db.close();
    }

    getRepeaterNearestCoords(coords) {
        return new Promise((resolve, reject) => {
            this.db.getRepeaters().then(res => {
                const closest = res.reduce(
                    (closest, current) => {
                        const _dist = this.db.distanceBetween(coords, {lat: current.lat,  lng: current.lng});
                        return _dist < closest._dist ? {...current, _dist} : closest
                    },
                    {...res[0], _dist: this.db.distanceBetween(coords, {lat: res[0].lat, lng: res[0].lng})}
                );
                
                const closestStripped = pick(closest, ["inputFrequency", "outputFrequency", "uplinkTone", "downlinkTone", "callSign", "IRLP"]);
                resolve(closestStripped);  
            })
        });
    }
}

const s = new Server();
s.getRepeaterNearestCoords({
    lat: 34.678393,
    lng: -86.669822
}).then(res => {
    const basePacketReponse = "APD69>WF4THC::WF4THC   :";
    const packet = basePacketReponse + RepeaterCodec.encode(res);
    console.log(packet);
});
