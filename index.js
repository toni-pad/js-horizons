const https = require('https');
const parseSearchData = require('./src/parseSearchData');

const ERROR_NOT_CONNECTED = new Error("Horizons is not connected. You must initialize it before making a request.");

const HORIZONS_URL = "horizons.jpl.nasa.gov";
const HORIZONS_PORT = 6775;
const HORIZONS_PROMPT = "Horizons> ";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var params = {
    host: HORIZONS_URL,
    port: HORIZONS_PORT,
    shellPrompt: HORIZONS_PROMPT,
    timeout: 10000,
    initialLFCR: true
};

class Horizons {
    #agentOptions;
    #httpAgent;
    #timeout = 4000;

    constructor(){
        this.#agentOptions = {
            keepAlive: false,
            host: 'ssd.jpl.nasa.gov',
            path: '/',
            port: 443,
            rejectUnauthorized: false,
            timeout: this.#timeout,
        };
        this.#httpAgent = new https.Agent(this.#agentOptions);
    }

    search(object, searhEphemeris, date) {
        return new Promise((resolve, reject) => {
            let query_string = `format=text&COMMAND='${object}'&OBJ_DATA='YES'&OUT_UNITS='KM-S'`;
            if (searhEphemeris || false) {
                const date_or_now = date || new Date();
                const format_date = (date_) => `${date_.getFullYear()}-${date_.getMonth() + 1}-${date_.getDay() + 1}`;
                const start_day = format_date(date_or_now);
                date_or_now.setDate(date_or_now.getDate() + 1);
                const stop_day = format_date(date_or_now);
                query_string += `&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='*@SSB'&START_TIME=${start_day}&STOP_TIME=${stop_day}&STEP_SIZE='1d'&QUANTITIES='1,29'`;
            }

            const options = {
                agent: this.#httpAgent,
                headers: {
                    accept: '*/*',
                },
                hostname: this.#agentOptions.host,
                method: 'get',
                path: `/api/horizons.api?${query_string}`,
                port: this.#agentOptions.port,
                timeout: this.#timeout,
            };

            const req = https.request(options, (res) => {
                const {statusCode} = res;
                if (statusCode != 200) {
                    res.resume();
                    const err = new Error(`Request Failed. Status Code: ${statusCode}`);
                    console.error(err.message);
                    reject(err);
                    return;
                }
              
                //res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        const data = parseSearchData(rawData);
                        resolve(data);
                    } catch (err) {
                        console.error(err.message);
                        reject(err);
                    }
                });
            });
            req.setTimeout(this.#timeout);
            req.on('error', (err) => {
                console.error(`ERROR: ${err.code} - ${err.message}`);
                reject(err);
            });
            req.on('timeout', () => {
                const err = new Error('ERROR: Request timeout.');
                console.error(`ERROR: ${err.message}`);
                reject(err);
                req.destroy();
            });

            req.end();
        });
    }
}


// class Horizons {
//     constructor() {
//         this._session = new Telnet();
//         this._connected = false;
//         this._stringBuffer = "";

//         this._session.on('ready', (prompt) => {
//             console.log(prompt);
//             this._connected = true;
//         });

//         this._session.on('connect', () => {
//             console.log(`Connecting to ${HORIZONS_URL}:${HORIZONS_PORT}...`);
//             this._connected = true;
//         });

//         this._session.on('data', (buffer) => {
//             this._stringBuffer += buffer.toString();
//         });

//         this._session.on('timeout', () => {
//             console.log("Socket timeout!");
//             this._session.end();
//         });

//         this._session.on('error', (error) => {
//             console.log("Error: ", error);
//         })

//         this._session.on('close', () => {
//             console.log("Connection closed");
//             this._connected = false;
//         });
//     }

//     initialize(cb) {
//         this._session.on('ready', (prompt) => {
//             cb(null, prompt);
//         });

//         this._session.connect(params);
//     }

//     close(cb) {
//         this._session.end();
//         cb && cb();
//     }

//     isConnected() {
//         return this._connected;
//     }

//     search(input, cb) {
//         if(!this._connected) {
//             throw new Error(ERROR_NOT_CONNECTED);
//         }

//         this._stringBuffer = "";

//         this._session.on('data', (buffer) => {
//             if(buffer.toString().match(HORIZONS_PROMPT) || buffer.toString().match("<cr>: ")) {
//                 const data = parseSearchData(this._stringBuffer);
//                 console.log("Raw buffer data: ", this._stringBuffer);
//                 cb(null, data);
//             }
//             else {
//                 if(buffer.toString().indexOf(">EXACT< name search")) {
//                     this._session.send("yes\r\n");
//                 }
//             }
//         });

//         this._session.send(`${input}\r\n`);
//     }
// }

module.exports = {
    ERROR_NOT_CONNECTED,
    Horizons,
};