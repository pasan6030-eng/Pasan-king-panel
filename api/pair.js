const const{ default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const fs = require('fs');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const number = req.query.number?.replace(/[^0-9]/g,'');
  if(!number) return res.status(400).json({error:'Number nathuwa'});

  try {
    const dir = '/tmp/' + number;
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console.log)
      },
      printQRInTerminal: false,
      browser: ["Pasan King", "Chrome", "1.0"]
    });
    sock.ev.on('creds.update', saveCreds);
    await delay(2000);
    let code = await sock.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join('-') || code;
    return res.json({code});
  } catch(e){
    console.log(e);
    return res.status(500).json({error: e.message});
  }
}
