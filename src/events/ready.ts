import * as admin from 'firebase-admin';
import fs = require('fs');
import DBL = require('dblapi.js');
import { Client } from 'discord.js'
//import * as axios from 'axios';

module.exports = {
    name: 'ready',
    execute(bot: Client) {
        bot.on("ready", async () => {

            if(!process.env.PROD) {
                //waikupdate(bot)
            }

            sendCommands()

            const dblToken = (await admin.firestore().collection('bots').doc('reggeltbot').get()).data()?.dblToken
            const dbl = new DBL(dblToken, bot);
            dbl.on('posted', () => {
                console.log('posted')
            })
            dbl.webhook?.on('vote', vote => {
                console.log(`User with ID ${vote.user} just voted!`);
                console.log(vote)
                admin.firestore().collection('dbl').add({
                    vote: vote
                })
            });
            const bansRef = admin.firestore().collection('bots').doc('reggeltbot').collection('bans').doc('global');
            bansRef.onSnapshot(snap => {
                const bans = {
                    bans: snap.data()!.bans
                }
                console.log(bans)
                fs.writeFileSync('./cache/global-bans.json', JSON.stringify(bans))
            })
        
        
            console.log(`${bot.user!.username} has started`);
            const doc = admin.firestore().collection("bots").doc("reggeltbot-count-all");
            doc.onSnapshot((docSnapshot: any) => {
                bot.user?.setActivity(`for ${docSnapshot.data().reggeltcount} morning message`, {type: "WATCHING"});
            }, (err: any) => {
                console.log(`Encountered error: ${err}`);
                bot.user?.setActivity(`Encountered error: ${err}`, {type: "PLAYING"});
            });
        
        });
    }
}

function sendCommands() {
/*
    send({
        "name": "count",
        "description": "Ennyiszer köszöntél be a #reggelt csatornába",
        "options": [
            {
                "name": "user",
                "description": "The user to get",
                "type": 6,
                "required": false
            }
        ]
    })
    */
    
}
/*
async function send(data: any) {
    
    axios.default.post('', {
        data: data,
        headers: {
            'Authorization': `Bot ${(await getBotToken())}`,
        }
    })
}

async function getBotToken() {
    const PROD = process.env.PROD;
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

*/
/*
async function waikupdate(bot: Client) {
    const db = admin.firestore();

    const waik = await bot.guilds.fetch('541446521313296385');

    const metrics = db.doc(`bots/reggeltbot/config/${waik.id}`);

    metrics.update({
        m3: 0,
        m6: 0,
        y1: 0,
        y2: 0,
    })
    const logchannel = await bot.channels.fetch('763040615080263700', false, true);
    if(logchannel.isText()) {
        logchannel.send("Waik members sync started")
    }
    waik.members.cache.forEach(async member => {


        //const joinref = await admin.firestore().doc(`dcusers/${member.id}/guilds/${waik.id}`).get();
        const join = member.joinedTimestamp!;
        const m3 = 3 * 2592000000;
        const m6 = 6 * 2592000000;
        const y1 = 12 * 2592000000;
        const y2 = 24 * 2592000000;
        const now = Date.now();

        //console.log(join)


        if(join + y2 < now) {
            waik.member(member.id)?.roles.remove("814303109966200864").then(async member => {
                if(logchannel.isText()) {
                    logchannel.send("Waik members sync started")
                }
            }).catch

            waik.member(member.id)?.roles.add('814303501512343622').then(member => sendlog(member, undefined, "y2")).catch(e => sendlog(member, e.message, "y2"))
            metrics.update({
                y2: admin.firestore.FieldValue.increment(1),
            })
        } else if(join + y1 < now) {
            waik.member(member.id)?.roles.add('814303109966200864').then(member => sendlog(member, undefined, "y1")).catch(e => sendlog(member, e.message, "y1"))
            metrics.update({
                y1: admin.firestore.FieldValue.increment(1),
            })
        } else if(join + m6 < now) {
            waik.member(member.id)?.roles.add('814302832031301683').then(member => sendlog(member, undefined, "m2")).catch(e => sendlog(member, e.message, "m6"))
            metrics.update({
                m6: admin.firestore.FieldValue.increment(1),
            })
        } else if(join + m3 < now) {
            //waik.member(member.id)?.roles.add('814302832031301683').catch(e => console.error(e.message))
            metrics.update({
                m3: admin.firestore.FieldValue.increment(1),
            })
        }

    })

    async function sendlog(member: GuildMember, err: string | undefined, role: string) {
        const logchannel = await bot.channels.fetch('763040615080263700', false, true);
        if(logchannel.isText()) {
            if(err) {
                if(role === "y2") {
                    logchannel.send(`<@${member.id}> failed to added to **y2** Error: **${err}**`)
                } else if(role === "y1") {
                    logchannel.send(`<@${member.id}> failed to added to **y1** Error: **${err}**`)
                } else if(role === "m6") {
                    logchannel.send(`<@${member.id}> failed to added to **m6** Error: **${err}**`)
                }

                // Err end
            } else {
                if(role === "y2") {
                    logchannel.send(`<@${member.id}> added to **y2**`)
                } else if(role === "y1") {
                    logchannel.send(`<@${member.id}> added to **y1**`)
                } else if(role === "m6") {
                    logchannel.send(`<@${member.id}> added to **m6**`)
                }
            }
        }
    }
}
*/
