const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const number = req.query.number?.replace(/[^0-9]/g,'');
    if(!number) return res.json({error:'Number missing'});

    const dir = path.join('/tmp', number);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
    
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console.log)
      },
      printQRInTerminal: false,
      browser: ["Ubuntu","Chrome","20.0.04"]
    });
    
    sock.ev.on('creds.update', saveCreds);
    await delay(3000);
    
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
    
    const code = await sock.requestPairingCode(number);
    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
    res.json({code: formatted});
    
  } catch(e){
    console.error(e);
    res.status(500).json({error: e.message});
  }
        }
