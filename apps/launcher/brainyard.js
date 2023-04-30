#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

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
  console.log('Cloning Brainyard repo...')
  execSync(`git clone --depth 1 https://github.com/ericvicenti/brainyard.git "${repoPath}"`)
}

// Reset the repository to the latest version
execSync('git fetch --all --prune', { cwd: repoPath })
execSync('git reset --hard origin/main', { cwd: repoPath })

// Check if we need to build the app
const currentCommit = execSync('git rev-parse HEAD', { cwd: repoPath }).toString().trim()
const lastBuiltCommitFile = path.join(repoPath, '.lastBuiltCommit')
const lastBuiltCommit = fs.existsSync(lastBuiltCommitFile)
  ? fs.readFileSync(lastBuiltCommitFile, 'utf8').trim()
  : ''

if (currentCommit !== lastBuiltCommit) {
  console.log('Building Brainyard app...')
  execSync('yarn', { cwd: repoPath })
  execSync('yarn main:build', { cwd: repoPath })

  // Save the current commit hash as the last built commit
  fs.writeFileSync(lastBuiltCommitFile, currentCommit)
}

// Start the app
const app = spawn('yarn', ['main:start'], {
  cwd: repoPath,
  stdio: 'inherit',
  env: {
    ...process.env,
    BRAINYARD_DIR: dataPath,
    PORT: 48888,
  },
})

app.on('error', (error) => {
  console.error('Brainyard app error:', error)
})

app.on('message', (message) => {
  console.log('Brainyard app message:', message)
})

app.stdout.on('data', async (data) => {
  // Wait for the server to be ready before opening the browser
  if (data.includes('ready - started server on')) {
    const open = await import('open').then((module) => module.default)
    open(`http://localhost:${process.env.PORT || 48888}`)
  }
})

app.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`)
})

app.on('close', (code) => {
  console.log(`Brainyard app exited with code ${code}`)
})
