const Base64Endec = require("./buf2");

const repeater = {
    inputFrequency: 449.75,
    outputFrequency: 444.75,
    uplinkTone: 131.8,
    downlinkTone: 131.8,
    callSign: 'N4WGY',
    IRLP: 0
};

const bits = {
    callSign: 36, // 6b per char
    uplinkTone: 6,
    downlinkTone: 6,
    IRLP: 14,
    band: 1, // VHF or UHF
    freqFromStartOfBand: 19, // times 1e+4
    offsetNegative: 1,
    offset: 7
};

const VHF = [144, 148];
const UHF = [420, 450];

const beg = {
    UHF: 420,
    VHF: 144
};

const inRange = (val, range) => (val >= range[0] && val <= range[1]);

class RepeaterCodec {
    static preprocess({inputFrequency, outputFrequency, callSign, IRLP, uplinkTone, downlinkTone}) {
        let processed = {IRLP, callSign};

        // calculate band
        if (inRange(inputFrequency, VHF)) processed.band = "VHF"
        else if (inRange(inputFrequency, UHF)) processed.band = "UHF"
        else throw "Repeater input frequency is not in the VHF or UHF bands";


        // transform CTCSS frequency to CTCSS number
        const ctcssFreqs = [0, 67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9, 114.8, 118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8, 179.9, 186.2, 192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3];
        processed.uplinkTone = ctcssFreqs.findIndex(t => t === uplinkTone);
        processed.downlinkTone = ctcssFreqs.findIndex(t => t === downlinkTone);
        if (processed.uplinkTone === -1) throw "Invalid uplink CTCSS";
        if (processed.downlinkTone === -1) throw "Invalid downlink CTCSS";

        // frequency from start of band
        processed.freqFromStartOfBand = outputFrequency - (processed.band === "VHF" ? VHF[0] : UHF[0]);

        // freq offset
        const offset = inputFrequency - outputFrequency;
        processed.offset = Math.abs(offset);
        processed.offsetNegative = offset < 0;

        return processed;
    }

    // delete when finished
    repeater = {
        inputFrequency: 449.75,
        outputFrequency: 444.75,
        uplinkTone: 131.8,
        downlinkTone: 131.8,
        callSign: 'N4WGY',
        IRLP: 0
    };

    static postProcess({IRLP, callSign, freqFromStartOfBand, band, offsetNegative, offset, uplinkTone, downlinkTone}) {
        return { 
            inputFrequency: (freqFromStartOfBand + beg[band]) + (offset * (offsetNegative ? -1 : 1)),
            outputFrequency: freqFromStartOfBand + beg[band],
            uplinkTone,
            downlinkTone,
            callSign,
            IRLP
        };
    }

    static encode(repeater) {
        return Base64Endec.encode(this.encodeBin(repeater));
    }

    static decode(b64) {
        // const str = Number(atob(b64)).toString(2);

        // const targetLength = Object.values(bits).reduce((acc, cv) => acc + cv, 0);

        // if (str.length < targetLength - bits.IRLP) str.padStart(targetLength - bits.IRLP, '0');
        // else str.padStart(targetLength, '0');

        return this.decodeBin(Base64Endec.decode(b64));
    }

    static encodeBin(repeater) {
        // string of bits
        let bin = "";

        bin += repeater.band === "VHF" ? 1 : 0;

        // repeater output frequency
        bin += (repeater.freqFromStartOfBand * 1e+4).toString(2).padStart(bits.freqFromStartOfBand, '0');

        // offset
        bin += Number(repeater.offsetNegative);
        bin += (repeater.offset * 10).toString(2).padStart(bits.offset, '0');

        // uplink & downlink tone
        bin += repeater.uplinkTone.toString(2).padStart(bits.uplinkTone, '0') + repeater.downlinkTone.toString(2).padStart(bits.downlinkTone, '0');

        // callsign
        bin += repeater.callSign.split('').map((c, i) => (repeater.callSign.charCodeAt(i) - 48).toString(2).padStart(bits.callSign/6, '0')).join('').padStart(bits.callSign, '0');

        // IRLP (leave off if no IRLP node number)
        if (repeater.IRLP) bin += repeater.IRLP.toString(2).padStart(bits.IRLP, '0');

        return bin;

    }

    static decodeBin(encodedBinary) {
        let decoded = {};
        let pos = 0;

        decoded.band = parseInt(encodedBinary.substr(pos, bits.band), 2) ? "VHF" : "UHF";
        pos += bits.band;

        decoded.freqFromStartOfBand = parseInt(encodedBinary.substr(pos, bits.freqFromStartOfBand), 2) / 1e+4;
        pos += bits.freqFromStartOfBand;
        
        decoded.offsetNegative = Boolean(parseInt(encodedBinary.substr(pos, bits.offsetNegative), 2));
        pos += bits.offsetNegative;

        decoded.offset = parseInt(encodedBinary.substr(pos, bits.offset), 2) / 10;
        pos += bits.offset;

        decoded.uplinkTone = parseInt(encodedBinary.substr(pos, bits.uplinkTone), 2);
        pos += bits.uplinkTone;

        decoded.downlinkTone = parseInt(encodedBinary.substr(pos, bits.downlinkTone), 2);
        pos += bits.downlinkTone;

        const callSignBits = encodedBinary.substr(pos, bits.callSign).match(/.{6}/g)
        decoded.callSign = String.fromCharCode(...callSignBits.map(char => parseInt(char, 2) + 48)).match(/[^0].+/g)[0];
        pos += bits.callSign;

        decoded.IRLP = pos === encodedBinary.length ? 0 : parseInt(encodedBinary.substr(pos, bits.IRLP), 2);
        
        return decoded;
    }
}

const pre = RepeaterCodec.preprocess(repeater);
const encoded = RepeaterCodec.encode(pre);
const decoded = RepeaterCodec.decode(encoded);
const post = RepeaterCodec.postProcess(decoded);

console.log(repeater);
console.log(post);

// console.log(pre);
// console.log(decoded);
console.log(encoded);
