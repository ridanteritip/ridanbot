import { Config } from '@neoxr/wb'

const getBody = (ctx) =>
  ctx.body ??
  ctx.m?.text ??
  ctx.m?.msg?.conversation ??
  ctx.m?.msg?.extendedTextMessage?.text ??
  ''

const parseCommand = (body) => {
  const configured = Config.prefix ?? ['.']
  const prefixes = (Array.isArray(configured) ? configured : [configured])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  const prefix = prefixes.find(p => body.startsWith(p))
  if (!prefix) return null

  const [command, ...args] = body.slice(prefix.length).trim().split(/\s+/)
  if (!command) return null

  return { prefix, command: command.toLowerCase(), args, text: args.join(' ') }
}

export default async function handler(ctx, client) {
  const m = ctx.m
  if (!m) return

  const parsed = parseCommand(getBody(ctx))
  if (!parsed) return

  if (m.fromMe) return

  const plugins = ctx.plugins ?? {}

  for (const plugin of Object.values(plugins)) {
    const run = plugin?.run
    if (!run?.usage) continue

    const usages = Array.isArray(run.usage) ? run.usage : [run.usage]
    if (!usages.map(x => x.toLowerCase()).includes(parsed.command)) continue
    await run.async(m, {
      ...ctx,
      sock: client,
      ...parsed,
      example: async () => {
        const example = run.example || Config.cmd?.example || ''
        await m.reply(`Contoh penggunaan:\n${example}`)
      }
    })

    return
  }
}