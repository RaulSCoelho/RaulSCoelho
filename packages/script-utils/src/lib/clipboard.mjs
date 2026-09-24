import clipboard from 'clipboardy'
import { spawn } from 'node:child_process'
import { release } from 'node:os'

/** @param {string} text */
export async function writeClipboard(text) {
  const wsl = process.platform === 'linux' && /microsoft/i.test(release())
  if (!wsl) return clipboard.write(text)

  // No WSL, clip.exe depende da página de código e altera as quebras de linha.
  // O PowerShell lê UTF-8 explicitamente; o conteúdo segue por stdin, nunca como código.
  await new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '$reader = [IO.StreamReader]::new([Console]::OpenStandardInput(), [Text.UTF8Encoding]::new($false, $true)); Set-Clipboard -Value $reader.ReadToEnd() -ErrorAction Stop'
      ],
      { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true }
    )
    let errorOutput = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      errorOutput = (errorOutput + chunk).slice(-4096)
    })
    child.on('error', reject)
    child.stdin.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(undefined)
      else reject(new Error(`PowerShell falhou (${code}): ${errorOutput.trim()}`))
    })
    child.stdin.end(text, 'utf8')
  })
}
