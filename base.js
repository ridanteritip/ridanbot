import { wadl, buffdl, sukses, gagal, loading, Api, Bold } from '../library/extras.js';
import { Config } from '@neoxr/wb'

/** contoh donlot media wa
 * 
 *  const t = m ! m.quoted
 *  const mtype = t.mtype
    const allowedTypes = ['imageMessage'] // videoMessage, stickerMessage, documentMessage, audioMessage
    if (!allowedTypes) return new Error("Gagal")
    const buffer = await wadl(m) // return langsung buffer
 */


/**
 * cara pake example
 * const url = args[0]
 * if (!url) return example()
 * 
 * note:
 * 
 * example wajib diisi
 */

//main plugin

export const run = {
    usage: ['test'],
    premium: false,
    hidden: false,
    owner: false,
    admin: false,
    tags: [''],
    example: '',
    async async(m, { sock, args, text, command, example }) {

    }
}