const Base64 = require('js-base64');

const Lower = 76;
const Higher = 90;

class Base64Endec {
    static encode(str) {


        const lengthShouldBe = Math.ceil(str.length / 8) * 8;
        const byteAligned = str.padStart(lengthShouldBe, '0');
        const bytes = byteAligned.match(/.{8}/g).map(str => parseInt(str, 2));

        const buf =  new ArrayBuffer(lengthShouldBe / 8);
        let packet = new Uint8Array(buf);

        for (let i in bytes) {
            packet[i] = bytes[i];
        }

        return Base64.fromUint8Array(packet);
    }

    static decode(b64) {
        const packet = Base64.toUint8Array(b64);

        let bytes = [];
        for (let i in packet) {
            bytes[i] = packet[i].toString(2).padStart(8, '0');
        }

        const cat = bytes.join('')
        const cutLength = cat.length - 8 <= Lower ? 4 : 6;
        
        const str = cat.substring(cutLength, cat.length);

        return str;
    }
}

module.exports = Base64Endec;

// const num = "0011110001101100110000110010010100010100000000011110000100100111010111101001";
// const encoded = Base64Endec.encode(num);
// const result = Base64Endec.decode(encoded);

// console.log(num);
// console.log(result);

// console.log(encoded);
