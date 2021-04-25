const { pick } = require("lodash");

// get configuration from top-level .env file
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, '../.env')
});
const mysql = require("mysql");

class RepeaterDao {
    constructor() {
        this.connection = mysql.createConnection({
            host: process.env.RDS_HOST,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            database: process.env.RDS_DB_NAME
        });
        this.connection.connect();
    }

    deg2Rad(deg) {
        return deg * Math.PI / 180.0;
    }

    distanceBetween(coord1, coord2) {
        const earthRadiusKm = 6371;

        // convert coords to radians
        [coord1, coord2] = [coord1, coord2].map(coord => ({
            lat: this.deg2Rad(coord.lat),
            lng: this.deg2Rad(coord.lng)
        }));

        const dLat = coord2.lat - coord1.lat;
        const dLng = coord2.lng - coord1.lng;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(coord1.lat) * Math.cos(coord2.lat);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadiusKm * c;
    }

    getRepeaters() {
        return new Promise((resolve, reject) => {
            this.connection.query("SELECT * FROM repeaters WHERE supportsAnalog = 1 AND public = 1", (err, res, fields) => {
                if (err) reject(err);
                else resolve(res);
            })
        })
    }

    close() {
        this.connection.end();
    }
}

const db = new RepeaterDao();
db.getRepeaters().then(res => {
    const here = {
        lat: 34.678393,
        lng: -86.669822
    };


    const closest = res.reduce(
        (closest, current) => {
            _dist = db.distanceBetween(here, {lat: current.lat,  lng: current.lng});
            return _dist < closest._dist ? {...current, _dist} : closest
        },
        {...res[0], _dist: db.distanceBetween(here, {lat: res[0].lat, lng: res[0].lng})}
    );
    
    const closestStripped = pick(closest, ["inputFrequency", "outputFrequency", "uplinkTone", "downlinkTone", "callSign", "IRLP"]);
    
    console.log(closestStripped);

    
}).catch(e => console.error(e))
.finally(() => db.close());

