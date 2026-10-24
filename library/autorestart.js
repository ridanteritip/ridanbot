import { Config } from '@neoxr/wb';
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline/promises'

const rl = createInterface({ input: process.stdin, output: process.stdout })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMP_DIR = path.resolve(__dirname, '../database/Temporary')
await fs.mkdir(TEMP_DIR, { recursive: true });

const cleanTemp = async () => {
    try {
        const files = await fs.readdir(TEMP_DIR)
        await Promise.all(files.map(async file => {
            if (file.endsWith('.file')) return
            const filePath = path.join(TEMP_DIR, file)
            try {
                const stats = await fs.stat(filePath)
                if (stats.isFile()) await fs.unlink(filePath)
            } catch {
                console.warn(chalk.blue(`[ ENGINE ] Skip: ${file}`))
            }
        }))
    } catch (e) {
        console.error(chalk.red('[ ENGINE ] Error cleaning: ' + e.message))
    }
}

const startAutoClean = async () => {
    cleanTemp()
    setInterval(cleanTemp, 60 * 60 * 1000)
}

let botProcess = null
let startTime = Date.now()
let restartCount = 0
let reconnectDelay = 3000
const MAX_RECONNECT_DELAY = 30000

const getRuntime = (ms = Date.now() - startTime) => {
    const d = Math.floor(ms / 86400000)
    const h = Math.floor((ms % 86400000) / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${d}h ${h}j ${m}m ${s}d`
}


const startBot = () => {
    restartCount++
    console.log(chalk.cyan(`[ ENGINE ] Starting bot... | Runtime: ${getRuntime()} | Restart ke-${restartCount}`))

    botProcess = spawn(process.argv[0], ['--no-warnings', path.join(__dirname, Config.start)], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        cwd: path.join(__dirname, '..'),
        env: {
            ...process.env,
            MAIN_START_TIME: startTime,
            RESTART_NOTIFY: process.env.RESTART_NOTIFY || ''
        }
    })

    delete process.env.RESTART_NOTIFY

    botProcess.on('message', data => {
        if (data?.type === 'reset') {
            process.env.RESTART_NOTIFY = data.notify
            const old = botProcess
            botProcess = null
            reconnectDelay = 3000
            old.kill()
            setTimeout(startBot, 1000)
        }
    })

    botProcess.on('close', code => {
        if (!botProcess) return
        const color = code === 0 ? chalk.blue : chalk.red
        console.log(color(`[ ENGINE ] Bot stopped | Code: ${code} | Runtime: ${getRuntime()}`))
        console.log(chalk.blue(`[ ENGINE ] Restarting in ${reconnectDelay / 1000}s...`))
        setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
            startBot()
        }, reconnectDelay)
    })

    botProcess.on('error', err => {
        console.error(chalk.red(`[ ENGINE ] Gagal start bot\nError: ${err.message}`))
        setTimeout(startBot, reconnectDelay)
    })

    botProcess.on('spawn', () => {
        reconnectDelay = 3000
    })
}

if (Config.restart?.time > 0) {
    setInterval(() => {
        console.log(chalk.blue(`[ ENGINE ] Auto restart triggered | Runtime: ${getRuntime()}`))
        if (botProcess) botProcess.kill()
    }, Config.restart.time * 3600000)
}

process.on('SIGINT', () => {
    console.log(chalk.blue(`\n[ ENGINE ] Stopping... | Total runtime: ${getRuntime()} | Total restart: ${restartCount}`))
    if (botProcess) botProcess.kill()
    process.exit(0)
})

process.on('SIGTERM', () => {
    if (botProcess) botProcess.kill()
    process.exit(0)
})

console.clear()

const major = parseInt(process.versions.node.split('.')[0], 10)
if (major < 22) {
    console.error(
        chalk.red(`\n  Requires Node.js 22+\n`) +
        chalk.blue(`   Current: Node.js ${process.versions.node}\n`)
    )
    process.exit(1)
}

const teks = Config.restart?.time > 0 ? `Every ${Config.restart.time} jam` : 'Mati'
console.log(chalk.blue(`[ ENGINE ] Auto restart: ${teks}\n`))

const runUpdate = (packages) => {
    return new Promise((resolve) => {
        const args = packages.length ? ['install', ...packages] : ['update']
        const label = packages.length ? packages.join(', ') : 'semua package'

        console.log(chalk.cyan(`\n[UPDATE] Memulai update: ${label}`))
        console.log(chalk.gray(`[UPDATE] Perintah: npm ${args.join(' ')}\n`))

        const proc = spawn('npm', args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: path.join(__dirname, '..'),
            shell: true
        })

        const rlOut = createInterface({ input: proc.stdout, crlfDelay: Infinity })
        const rlErr = createInterface({ input: proc.stderr, crlfDelay: Infinity })

        rlOut.on('line', line => {
            if (line.trim()) console.log(chalk.white(`[npm] ${line}`))
        })

        rlErr.on('line', line => {
            if (!line.trim()) return
            // npm progress bars / warnings tampilkan dengan warna berbeda
            if (line.startsWith('npm warn') || line.startsWith('npm WARN')) {
                console.log(chalk.yellow(`[npm] ${line}`))
            } else {
                console.log(chalk.gray(`[npm] ${line}`))
            }
        })

        proc.on('close', code => {
            if (code === 0) {
                console.log(chalk.green(`\n[UPDATE] ✓ Selesai: ${label}`))
            } else {
                console.log(chalk.red(`\n[UPDATE] ✗ Gagal (exit code ${code})`))
            }
            resolve(code)
        })

        proc.on('error', err => {
            console.error(chalk.red(`[UPDATE] Error: ${err.message}`))
            resolve(1)
        })
    })
}

const startCli = async () => {
    while (true) {
        const cmd = (await rl.question('')).trim()

        if (cmd === '/rs') {
            console.log(chalk.blue(`[ ENGINE ] Manual restart triggered | Runtime: ${getRuntime()}`))
            if (botProcess) {
                reconnectDelay = 3000
                botProcess.kill()
            } else {
                startBot()
            }
        } else if (cmd.startsWith('/update')) {
            const parts = cmd.slice('/update'.length).trim()
            const packages = parts ? parts.split(/\s+/) : []
            await runUpdate(packages)
        }
    }
}

startBot()
startAutoClean()
startCli()