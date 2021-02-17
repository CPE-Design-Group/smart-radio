// get configuration from top-level .env file
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, '../.env')
});

const fs = require("fs");
const csv = require("csv");
const { spawn } = require("child_process");

const readStream = fs.createReadStream(process.argv[2]);
const writeStream = fs.createWriteStream("output.csv");

const parser = csv.parse();

// define transformation
const transformer = csv.transform(([
    outputFrequency,
    inputFrequency,
    ,
    uplinkTone,
    downlinkTone,
    ,
    ,
    lat,
    lng,
    callSign,
    use,
    ,
    mode,
    ,
    ,
    irlp
]) => (
    [
        null,
        outputFrequency,
        inputFrequency,
        uplinkTone,
        downlinkTone,
        lat,
        lng,
        callSign,
        use === "OPEN",
        mode.includes("analog"),
        irlp
    ]
));

const stringifier = csv.stringify();

readStream.on("readable", () => {
    let data;
    while (data = readStream.read())
        parser.write(data);
});

parser.on("readable", () => {
    let data;
    while (data = parser.read())
        transformer.write(data);
});

transformer.on("readable", () => {
    let data;
    while (data = transformer.read())
        stringifier.write(data);
});

stringifier.on("readable", () => {
    let data;
    while (data = stringifier.read())
        writeStream.write(data);
});

readStream.on("end", () => {
    // wait for stringifier to finish writing
    while (stringifier.read())
        ;

    // update database with new data
    const child = spawn(`mysql --local-infile=1 -u ${process.env.RDS_USERNAME} -p'${process.env.RDS_PASSWORD}' -h ${process.env.RDS_HOST} -P ${process.env.RDS_PORT} -D ${process.env.RDS_DB_NAME} -e "load data local infile 'output.csv' into table repeaters fields terminated by ',' lines terminated by '\\n' ignore 1 lines"`, {
        stdio: "inherit",
        shell: true
    });

    // console.log(`mysql --local-infile=1 -u ${process.env.RDS_USERNAME} -p'${process.env.RDS_PASSWORD}' -h ${process.env.RDS_HOST} -P ${process.env.RDS_PORT} -D ${process.env.RDS_DB_NAME} -e "load data local infile 'output.csv' into table repeaters fields terminated by ',' lines terminated by '\\n' ignore 1 lines"`);

    // child.stdout.on("data", msg => console.log(msg.toString()));
    // child.stderr.on("data", err => console.error(err.toString()));
    child.on("exit", code => {
        if (code === 0) console.log("successfully updated database");
        else console.error("failed to update database");
    });
})