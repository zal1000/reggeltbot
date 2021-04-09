import * as admin from "firebase-admin";
import fs = require("fs");
import { Message } from "discord.js";
import { Langtypes, Guildconfig } from "../types";
import * as qdb from "quick.db";

module.exports = {
  name: "reggelt",
  async execute(message: Message) {
    const db = admin.firestore();

    const guildconfig: Guildconfig = qdb.get(`guild.${message.guild?.id}`);

    const guildlang = guildconfig?.lang || "en-US";

    const lang: Langtypes = JSON.parse(
      fs.readFileSync(`./lang/${guildlang}.json`, "utf8")
    );

    const data = JSON.parse(
      fs.readFileSync("./cache/global-bans.json", "utf8")
    );
    if (data.bans.find((element: any) => element === message.author.id)) {
      message.delete();
      message.author.send(lang.root.bans.reggeltGlobal);
      return;
    }

    if (
      message.content.toLowerCase().includes(lang.events.reggelt.keyWord) ||
      message.content.toLowerCase().includes("reggelt")
    ) {
      const ref = db.collection("dcusers").doc(message.author.id);
      const doc = await ref.get();

      const cdref = db
        .collection("dcusers")
        .doc(message.author.id)
        .collection("cooldowns")
        .doc(message.guild!.id);
      const cddoc = await cdref.get();

      const guildcd = guildconfig.cd;

      let rawcd = guildcd;

      const cdval = rawcd * 3600;

      const now = Math.floor(Date.now() / 1000);
      const cd = now + cdval;

      // on cooldown
      if (await checkcd(message)) {
        await message.delete();
        const nextTime = cddoc.data()!.reggeltcount;
        let cdmsg = lang.events.reggelt.onCooldown.replace(
          "%!CD%!",
          hhmmss(nextTime - now, lang)
        );
        await message.author.send(cdmsg);
      } else {
        if (
          !process.env.PROD &&
          rawcd <= 6 /*&& userdoc.data()!.reggeltcountcd < Date.now()*/
        ) {
          // update
          await reggeltupdateall();
          await reggeltupdatefs(message);
        }
        // cd update
        await cdref
          .update({
            reggeltcount: cd,
          })
          .then(async (d) => {
            // Reaction add here
            await react(doc.data()?.reggeltemote, message);
          });
      }
    } else {
      if (!message.deletable) {
        message.channel.send(lang.events.reggelt.noPerms).catch((err) => {
          message.guild!.owner!.send(lang.events.reggelt.noSend);
          console.error(err);
        });
      } else {
        message.delete();
        let nReggelt: string = lang.events.reggelt.notReggelt;
        let replyMSG = nReggelt
          .replace("%!GUILD%!", `${message.guild!.name}`)
          .replace("**%!KEYWORD%**", `**${lang.events.reggelt.keyWord}**`);
        message.author.send(replyMSG).catch(function (error: string) {
          message.reply("Error: " + error);
          console.error("Error:", error);
        });
      }

      await reggeltupdatefs(message, true);
    }
  },
};

async function checkcd(message: Message): Promise<boolean> {
  const db = admin.firestore();
  const user = message.author;
  const uref = db.collection("dcusers").doc(user.id);
  const cdref = uref.collection("cooldowns").doc(message.guild!.id);
  const cddoc = await cdref.get();
  const now = Math.floor(Date.now() / 1000);

  if (!cddoc.exists) {
    return false;
  }

  if (cddoc.data()?.reggeltcountcd && cddoc.data()?.reggeltcount > now) {
    return true;
  }

  return false;
}

async function react(reaction: string, message: Message) {
  if (reaction) {
    await message.react(reaction).catch((e) => {
      console.debug("cant react");
      message.react("☕").catch((e) => {
        console.debug("cant react");
      });
    });
  } else if (message.author.id === "183302720030113792") {
    message.react("🍵").catch((e) => {
      console.debug("cant react");
    });
  } else {
    message.react("☕").catch((e) => {
      console.debug("cant react");
    });
  }
}

async function reggeltupdateall() {
  let db = admin.firestore();
  const incrementCount = qdb.get("config.incrementCount");
  await db
    .collection("bots")
    .doc("reggeltbot-count-all")
    .update({
      reggeltcount: admin.firestore.FieldValue.increment(incrementCount),
    });
}

async function reggeltupdatefs(message: Message, decreased = false) {
  let db = admin.firestore();
  const reggeltRef = db.collection("dcusers").doc(message.author.id);
  const doc = await reggeltRef.get();

  //const userguildref = db.collection('dcusers').doc(message.author.id).collection('guilds').doc(message.guild!.id)
  //const userguilddoc = await userguildref.get();

  const incrementCount = qdb.get("config.incrementCount");
  const decreaseCount = qdb.get("config.decreaseCount");

  if (!doc.exists) {
    reggeltRef.set(
      {
        reggeltcount: decreased ? decreaseCount : incrementCount,
        reggeltcount1: decreased ? decreaseCount : incrementCount,
        tag: message.author.tag,
        username: message.author.username,
        pp: message.author.avatarURL(),
        coins: decreased ? decreaseCount : incrementCount,
      },
      { merge: true }
    );
  } else {
    if (!doc.data()?.coins) {
      reggeltRef.set(
        {
          reggeltcount: admin.firestore.FieldValue.increment(
            decreased ? decreaseCount : incrementCount
          ),
          reggeltcount1: admin.firestore.FieldValue.increment(
            decreased ? decreaseCount : incrementCount
          ),
          tag: message.author.tag,
          username: message.author.username,
          pp: message.author.avatarURL(),
          coins: doc.data()?.reggeltcount,
        },
        { merge: true }
      );
    } else {
      reggeltRef.set(
        {
          reggeltcount1: admin.firestore.FieldValue.increment(
            decreased ? decreaseCount : incrementCount
          ),
          reggeltcount: admin.firestore.FieldValue.increment(
            decreased ? decreaseCount : incrementCount
          ),
          tag: message.author.tag,
          username: message.author.username,
          pp: message.author.avatarURL(),
          coins: admin.firestore.FieldValue.increment(
            decreased ? decreaseCount : incrementCount
          ),
        },
        { merge: true }
      );
    }
  }
}

function hhmmss(time: number, lang: Langtypes): string {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  let str =
    `${hours} ${hours == 1 ? lang.time.hour : lang.time.hours} ` +
    `${minutes} ${minutes == 1 ? lang.time.minute : lang.time.minutes} ` +
    `${seconds} ${seconds == 1 ? lang.time.second : lang.time.seconds}`;

  return str;
}
