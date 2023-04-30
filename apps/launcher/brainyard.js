#!/usr/bin/env node

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

console.log('🚀 Brainyard App Launcher')

const verbose = !!process.env.VERBOSE
const port = 48888

if (verbose) console.log('📣 Verbose Mode.')

// Determine the support directory based on the user's OS
const supportDir = {
  darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Brainyard'),
  linux: path.join(os.homedir(), '.brainyard'),
  win32: path.join(os.homedir(), 'AppData', 'Local', 'Brainyard'),
}[os.platform()]

const repoPath = path.join(supportDir, 'repo')
const dataPath = path.join(supportDir, 'data')

async function spawnWithOutput(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options)

    child.stdout.on('data', (data) => {
      const logLines = data.toString().split('\n')
      logLines.forEach((line) => {
        if (line && verbose) {
          console.log(`📣 ${line}`)
        }
      })
    })

    child.stderr.on('data', (data) => {
      const errorLines = data.toString().split('\n')
      errorLines.forEach((line) => {
        if (line && verbose) {
          console.error(`🚨 ${line}`)
        }
      })
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

startup().catch((error) => {
  console.error('🚨 Brainyard Launcher has failed you.')
  console.error(error)
  process.exit(1)
})

async function startup() {
  // Ensure the support directory exists
  fs.mkdirSync(supportDir, { recursive: true })

  // Clone the Brainyard repository if it doesn't exist
  if (!fs.existsSync(repoPath)) {
    console.log('⏱️  Downloading Brainyard Repository.')
    await spawnWithOutput('git', [
      'clone',
      '--depth',
      '1',
      'https://github.com/ericvicenti/brainyard.git',
      repoPath,
    ])
  } else {
    console.log('⏱️  Updating Brainyard Repository.')

    // Reset the repository to the latest version
    await spawnWithOutput('git', ['fetch', '--all', '--prune'], { cwd: repoPath })
    await spawnWithOutput('git', ['reset', '--hard', 'origin/main'], { cwd: repoPath })
  }

  // Check if we need to build the app
  const currentCommit = execSync('git rev-parse HEAD', { cwd: repoPath }).toString().trim()
  const lastBuiltCommitFile = path.join(repoPath, '.lastBuiltCommit')
  const lastBuiltCommit = fs.existsSync(lastBuiltCommitFile)
    ? (await fs.promises.readFile(lastBuiltCommitFile, 'utf8')).trim()
    : ''

  if (currentCommit !== lastBuiltCommit) {
    console.log('⚙️  Building.')
    await spawnWithOutput('yarn', [], { cwd: repoPath })
    await spawnWithOutput('yarn', ['main:build'], { cwd: repoPath })

    // Save the current commit hash as the last built commit
    fs.writeFileSync(lastBuiltCommitFile, currentCommit)
  } else {
    console.log('✅ Using existing Build.')
  }

  console.log('▶️  Starting Local Server.')

  const app = spawn('yarn', ['main:start'], {
    cwd: repoPath,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BRAINYARD_DIR: dataPath,
      PORT: port,
    },
  })

  app.on('error', (error) => {
    console.error('Brainyard app error:', error)
  })

  app.on('message', (message) => {
    console.log('Brainyard app message:', message)
  })

  const out = []

  function serverOutput(text) {
    out.push(text)
    if (verbose) console.log(text)
  }

  const startupTimeout = setTimeout(() => {
    console.error(`🚨 App could not start up!`)
    console.error(out.join('\n'))
    process.exit(1)
  }, 8000)

  app.stdout.on('data', async (data) => {
    const logLines = data.toString().split('\n')
    logLines.forEach((line) => {
      if (line) {
        serverOutput(`📣 ${line}`)
      }
    })

    // Wait for the server to be ready before opening the browser
    if (data.includes('ready - started server on')) {
      const open = await import('open').then((module) => module.default)
      clearTimeout(startupTimeout)
      const localUrl = `http://localhost:${port}`
      console.log(`✅ Server Started at ${localUrl}`)
      console.log('🌐 Launching...')
      open(localUrl)
    }
  })

  app.stderr.on('data', (data) => {
    const errorLines = data.toString().split('\n')
    errorLines.forEach((line) => {
      if (line) {
        serverOutput(`🚨 ${line}`)
      }
    })
  })

  app.on('close', (code) => {
    console.log(`Brainyard app exited with code ${code}`)
  })

  process.on('exit', () => {
    console.log('✂️  Brainyard Shutdown.')
    app.kill()
  })

  process.on('SIGINT', () => {
    process.exit()
  })

  process.on('SIGTERM', () => {
    process.exit()
  })
}
