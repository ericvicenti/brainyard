#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
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

// Ensure the support directory exists
fs.mkdirSync(supportDir, { recursive: true })

const repoPath = path.join(supportDir, 'repo')
const dataPath = path.join(supportDir, 'data')

// Clone the Brainyard repository if it doesn't exist
if (!fs.existsSync(repoPath)) {
  console.log('⏱️  Downloading Brainyard Repository.')
  execSync(`git clone --depth 1 https://github.com/ericvicenti/brainyard.git "${repoPath}"`)
} else {
  console.log('⏱️  Updating Brainyard Repository.')

  // Reset the repository to the latest version
  execSync('git fetch --all --prune', { cwd: repoPath })
  execSync('git reset --hard origin/main', { cwd: repoPath })
}

// Check if we need to build the app
const currentCommit = execSync('git rev-parse HEAD', { cwd: repoPath }).toString().trim()
const lastBuiltCommitFile = path.join(repoPath, '.lastBuiltCommit')
const lastBuiltCommit = fs.existsSync(lastBuiltCommitFile)
  ? fs.readFileSync(lastBuiltCommitFile, 'utf8').trim()
  : ''

let out = []

function serverOutput(text) {
  out.push(text)
  if (verbose) console.log(text)
}

if (currentCommit !== lastBuiltCommit) {
  console.log('⚙️  Building.')
  execSync('yarn', { cwd: repoPath })
  execSync('yarn main:build', { cwd: repoPath })

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
