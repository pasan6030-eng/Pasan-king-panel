const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const number = (req.query.number || '').replace(/[^0-9]/g,'');
    if(!number) return res.status(400).json({error:'Number missing'});

    const dir = path.join('/tmp', 'auth_' + number);
    if(fs.existsSync(dir)) fs.rmSync(dir, {recursive:true, force:true});
    fs.mkdirSync(dir, {recursive:true});
    
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      printQRInTerminal: false,
      browser: ["Chrome","Chrome","110.0.0.0"]
    });
    
    sock.ev.on('creds.update', saveCreds);
    await delay(2000);
    
    if(!sock.authState.creds.registered){
        const code = await sock.requestPairingCode(number);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
        res.json({code: formatted});
    } else {
        res.json({error: 'Already registered'});
    }
  } catch(e){
    console.error(e);
    res.status(500).json({error: e.toString()});
  }
}
