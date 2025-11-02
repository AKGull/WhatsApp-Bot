import { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason, downloadMediaMessage } from "baileys";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import pino from "pino";
import chalk from "chalk";
console.log(chalk.blue("Starting Bot ... \n \n"));

(async function start() {
  const session = await useMultiFileAuthState("session");
  const bot = makeWASocket({
    auth: session.state,
    browser: Browsers.macOS("Chrome"),
    logger: pino({ level: "silent" })
  });

  if (!bot.user && !bot.authState.creds.registered) {

    const waNumber = "923408870810";
    const pair = "12345678";

    await new Promise(resolve => setTimeout(resolve, 7000));

    const code = await bot.requestPairingCode(waNumber, pair);

    const format = code.slice(0, 4) + "-" + code.slice(4);

    console.log(chalk.red("Enter this Code in Your Whatsapp > Linked Devices"));

    console.log(chalk.blue("Pairing code:"), chalk.bgBlue(format));
  }

  bot.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("Logged Out !!! \n Deleting Session ..."));
        await fs.rm("./session", { recursive: true, force: true });
      } else if (reason === DisconnectReason.connectionLost) {
        console.log(chalk.red("No Internet Connection !"));
      }
    }

    if (connection === "open") {
      console.log(chalk.bold.red.bgGreen("Connected Successfully with: +" + bot.user.id.split(":")[0]));
    }
  });
  bot.ev.on("messages.upsert", async ({ type, messages }) => {

    const msg = messages[0];

    const text = msg?.message?.extendedTextMessage?.text;

    const quotedMessage = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const isimg = quotedMessage?.imageMessage?.viewOnce === true;

    const isvideo = quotedMessage?.videoMessage?.viewOnce === true;

    const isvoice = quotedMessage?.audioMessage?.viewOnce === true;

    if (isimg) {
      const imageDir = './Downloads/Images';
      await fs.mkdir(imageDir, { recursive: true });
      const fakeMsg = { message: quotedMessage };
      const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
      const Mtype = quotedMessage?.imageMessage?.mimetype ?? 'image/jpeg';
      const ext = Mtype.split('/')[1] || 'jpeg';
      const filename = `${imageDir}/image-${Date.now()}.${ext}`;
      await fs.writeFile(filename, buffer);
      console.log("Image Saved Successfully");
    }

    if (isvideo) {
      const videoDir = './Downloads/Videos';
      await fs.mkdir(videoDir, { recursive: true });
      const fakeMsg = { message: quotedMessage };
      const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
      const Mtype = quotedMessage?.videoMessage?.mimetype ?? 'video/mp4';
      const ext = Mtype.split('/')[1] || 'mp4';
      const filename = `${videoDir}/video-${Date.now()}.${ext}`;
      await fs.writeFile(filename, buffer);
      console.log("Video Saved Successfully:", filename);
    }

    if (isvoice) {
      const audioDir = './Downloads/Audios';
      await fs.mkdir(audioDir, { recursive: true });

      const fakeMsg = { message: quotedMessage };
      const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
      const Mtype = quotedMessage?.audioMessage?.mimetype ?? 'audio/mp3';
      const ext = "opus";
      const filename = `${audioDir}/audio-${Date.now()}.${ext}`;
      await fs.writeFile(filename, buffer);
      console.log("Audio Saved Successfully:", filename);
    }

  });

  bot.ev.on("creds.update", session.saveCreds);
})();
