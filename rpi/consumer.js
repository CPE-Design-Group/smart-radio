const RepeaterCodec = require("../ec2/buffer");

process.stdin.on("data", data => {
    const str = data.toString();
    if (str[0] === '[' && str.includes(">WF4THC")) {
        const packet = str.match(/([^:]+$)/g)[0];
        const repeaterInfo = RepeaterCodec.decode(packet);

        console.log(repeaterInfo);
    }
});
