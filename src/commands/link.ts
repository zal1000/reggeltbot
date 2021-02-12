import * as admin from 'firebase-admin';
import https = require('https');
module.exports = {
    name: 'link',
    async execute(message: any, args: any) {
        if(!args[0]){
            message.reply("Please provide your email");
        } else if(!args[1]) {
            message.reply("Please provide your link code");
        } else {
            botTypeing(message.channel.id);
            admin
                .auth()
                .getUserByEmail(args[0])
                .then((userRecord: any) => {
                    return accountLink(userRecord, message);
                })
                .catch((error: any) => {
                    console.log("Error fetching user data:", error);
                });
            
        }
    }
}

async function accountLink(userRecord: { uid: any; }, message: { content: string; author: { id: any; }; reply: (arg0: string, arg1: undefined) => void; }) {
    const db = admin.firestore();
    let messageArray = message.content.split(" ");
    //let cmd = messageArray[0];
    let args: any = messageArray.slice(1);
    const userRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    const dcUserRef = db.collection("dcusers").doc(message.author.id);
    // eslint-disable-next-line no-unused-vars
    //const dcUserDoc = await dcUserRef.get();

    if(userDoc.data()!.dclinked) {
        message.reply("This account is already linked!", args[1]);
    } else if(`${userDoc.data()!.dclink}` === args[1]) {
        dcUserRef.update({
            uid: message.author.id,
        });
        userRef.update({
            dclink: admin.firestore.FieldValue.delete(),
            dclinked: true,
            dcid: message.author.id,
        });
        message.reply("Account linked succesfuly!", undefined);
    } else {
        message.reply("Error linking account", undefined);
    }
}

async function botTypeing(channel: any) {
    const data = JSON.stringify({});
    console.log((await getBotToken(process.env.PROD)).token);
      
    const options = {
        hostname: 'discord.com',
        port: 443,
        path: `/api/v8/channels/${channel}/typing`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': `Bot ${(await getBotToken(process.env.PROD)).token}`,
            
        }
    };
      
    const req = https.request(options, (res: any) => {
        console.log(`statusCode: ${res.statusCode}`);
      
        res.on('data', (d: string | Buffer) => {
            process.stdout.write(d);
        });
    });
      
    req.on('error', (error: any) => {
        console.error(error);
    });
      
    req.write(data);
    req.end();
}

async function getBotToken(PROD: string | undefined) {
    const db = admin.firestore();
    const botRef = db.collection("bots").doc("reggeltbot");
    const doc = await botRef.get();
    if(PROD === "false") {
        return {
            token: doc.data()!.testtoken,
        };
    } else if(PROD === "beta") {
        return {
            token: doc.data()!.betatoken,
        };
    } else {
        return {
            token: doc.data()!.token,
        };
    } 
}