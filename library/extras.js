import https from 'https'
import http from 'http'
import NeoxrApi from '@neoxr/api'
import { Config } from '@neoxr/wb';
import FormData from 'form-data'
import fs from 'fs'
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type'

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

export const buffdl = async (url) => {
    const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
    })
    return Buffer.from(data)
}

export const gagal = async (m) => {
    await m.react(Config.emoji.gagal)
}
export const sukses = async (m) => {
    await m.react(Config.emoji.sukses)
}
export const loading = async (m) => {
    await m.react(Config.emoji.loading)
}

export const getRuntime = (ms = Date.now() - startTime) => {
    const d = Math.floor(ms / 86400000)
    const h = Math.floor((ms % 86400000) / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${d}h ${h}j ${m}m ${s}d`
}

export const tourl = async (input) => {
    const form = new FormData()
    const type = await fileTypeFromBuffer(input)

    form.append('file', input, {
        filename: `file.${type.ext}`,
        contentType: type.mime
    })
    const res = await axios.post('https://up.ridan.web.id/upload', form, {
        headers: form.getHeaders()
    })
    const json = res.data
    if (!json.status) return console.log(json)
    return json.url
}

export const wadl = async (m) => {
    const q = m.quoted
    const target = q || m
    const buf = await target.download()
    return buf
}
export const Api = new NeoxrApi('https://api.neoxr.eu/api', Config.key.neoxr)

export const date = () => new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

export const Bold = (text) => {
    const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bold = [...'𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵']
    text = String(text ?? '')

    return text.split('').map(c => {
        const idx = normal.indexOf(c)
        return idx === -1 ? c : bold[idx]
    }).join('')
}

export const parseAmount = (input) => {
    const str = String(input).trim().toLowerCase().replace(',', '.')
    const match = str.match(/^(\d+(?:\.\d+)?)(p|k|jt)?$/)
    if (!match) return null

    const [, numStr, unit] = match
    const num = parseFloat(numStr)

    let amount
    switch (unit) {
        case 'jt':
            amount = num * 1_000_000
            break
        case 'k':
            amount = num * 1_000
            break
        case 'p':
        default:
            amount = num
    }

    amount = Math.round(amount)
    if (amount > 1_000_000) return null
    return amount
}