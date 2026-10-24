import * as baileys from 'baileys'
import { Client, Config } from '@neoxr/wb'
import fs from 'fs'
import handler from './handler.js'

const { version } = await baileys.fetchLatestWaWebVersion()

const sok = new Client({
    plugsdir: "plugins",
    presence: true,
    online: true,
    bypass_disappearing: true,
    pairing: {
        state: Config.pairing.useQR ? false : true,
        number: Config.pairing.number,
        code: Config.pairing.code
    },
    create_session: {
        type: Config.pairing.database,
        session: 'database/session'
    },
    stealth: 'desktop',
    custom_id: Config.owner.botName,
    bot: (id) => {
    return (id.startsWith('3EB0') && id.length === 40) || id.startsWith('BAE') || /[-]/.test(id)
},
    engines: [baileys],
    debug: false, 
}, {
    version,
    browser: baileys.Browsers.ubuntu('Firefox'),
    shouldIgnoreJid: jid => {
    return /(newsletter|bot)/.test(jid)
}
})

sok.on('connect', () => console.log('[ ENGINE ] ' + ' Menyambungkan ke WS'))
sok.on('error', error => console.log('[ ENGINE ]  ' + error))
sok.on('ready', () => console.log('[ ENGINE ] ' + ' Bot Siap Digunakan !'))
sok.on('message', ctx =>{
handler(ctx, sok).catch('[ ENGINE ]  ' + console.error)
})

