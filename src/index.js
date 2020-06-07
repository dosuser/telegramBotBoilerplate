let conf
let confDir;
if(process.env.NODE_ENV === 'development') {
    confDir = "./conf/dev/";
    conf = require("../conf/dev/conf").conf
} else {
    confDir = "./conf/prod/";
    conf = require("../conf/prod/conf").conf
}
console.log(conf)
const path = require('path');

const TelegramBot = require('node-telegram-bot-api');
const token = conf.telgramToken

const bot = new TelegramBot(token, {polling: true});

// Create a bot that uses 'polling' to fetch new updates
var admin = require("firebase-admin");


console.log(path.resolve(path.join(__dirname, confDir + conf.firebase.cert)));
target = confDir + conf.firebase.cert;
console.log(target);
admin.initializeApp({
    credential: admin.credential.cert(confDir + conf.firebase.cert),
    databaseURL: conf.firebase.databaseURL
});

let db = admin.firestore();

let Syno = require('syno');

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const menu = "/register register Synology Account";

    console.log(JSON.stringify(msg))
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, menu);
});

bot.onText(/\/register ([^ ]+) ([^ ]+) ([^ ]+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    console.log("received")

    const chatId = msg.chat.id;
    const id = match[1]
    const password = match[2]
    const address = match[3]


    const res = "id : " + id + ", password : " + password;

    try {
        let setAda = db.collection("ds").doc(chatId.toString()).set({
            id: id
            , password: password
            , address: address
        });
        setAda.then(function (writeResult) {
            console.log(JSON.stringify(writeResult));
        })

        // send back the matched "whatever" to the chat
        bot.sendMessage(chatId, res);
    } catch (e) {
        console.log(e)
        throw new e;
    }
});


// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    console.log("message" + JSON.stringify(msg))

    if (msg.text.toString().startsWith('/')) {
        return
    }
    if (isValidUrl(msg.text.toString()) == false) {
        bot.sendMessage(chatId, "download not supported text");
        return
    }

    const menu = "/register register Synology Account";

    getSettings(chatId, function (doc) {

            console.log(doc)
            const address = parseAddress(doc.address)

            var syno = new Syno({
                // Requests protocol : 'http' or 'https' (default: http)
                protocol: address.protocol,
                // DSM host : ip, domain name (default: localhost)
                host: address.host,
                // DSM port : port number (default: 5000)
                port: address.port,
                // DSM User account (required)
                account: doc.id,
                // DSM User password (required)
                passwd: doc.password,
                // DSM API version (optional, default: 6.0.2)
                apiVersion: '6.2.2'
                // ,otp_code: 944722
                // ,debug: true
            });

            console.log("start download : " + msg.text.toString());
            syno.dl.createTask({
                    'uri': msg.text.toString()
                },
                function (err) {
                    if (err == null) {
                        bot.sendMessage(chatId, "start download :" + msg.text.toString());
                    } else {
                        bot.sendMessage(chatId, "error download : " + console.log("download " + JSON.stringify(err)));
                    }
                });


        },
        function (error) {
            console.log(JSON.stringify(error));
        });

    console.log(JSON.stringify(msg))
});

const regex = /(https?):\/\/(([^\.\s:\/#\?]+\.){1,}([^\.\s:\/#\?]+)):?(\d+)?/g;

function parseAddress(addressInRaw) {
    const address = regex.exec(addressInRaw)
    if(address == null || address == undefined){
        return null;
    }
    return {
        protocol : address[1],
        host: address[2],
        port: (address[5] == undefined) ? 80:address[5]
    }
}
function isValidUrl(url) {
    if (url.startsWith("magnet")) {
        return true;
    }
    if (url.startsWith("http")) {
        return true;
    }
    return false;
}


bot.onText(/\/setting/, (msg) => {
    const chatId = msg.chat.id;

    try {
        db.collection('ds').doc(chatId.toString()).get()
            .then((doc) => {
                if (!doc.exists) {
                    console.log('No such document!');
                } else {
                    console.log('Document data:', doc.data());
                    bot.sendMessage(chatId, JSON.stringify(doc.data()));
                }
            })
            .catch((err) => {
                console.log('Error getting documents', err);
                bot.sendMessage(chatId, 'err');
            });

    } catch (e) {
        console.log(e)
    }
});

function getSettings(chatId, callback, errorCallback) {
    try {
        db.collection('ds').doc(chatId.toString()).get()
            .then((doc) => {
                if (!doc.exists) {
                    console.log('No such document!');
                } else {
                    console.log('Document data:', doc.data());
                    //bot.sendMessage(chatId, JSON.stringify(doc.data()));
                    callback(doc.data())
                }
            })
            .catch((err) => {
                console.log('Error getting documents', err);
                //bot.sendMessage(chatId, 'err');
                errorCallback(err)
            });

    } catch (e) {
        console.log(e)
        errorCallback(err)
    }

}