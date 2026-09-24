import clipboard from 'clipboardy'
import { execa } from 'execa'
import { release } from 'node:os'

/** @param {string} text */
export async function writeClipboard(text) {
  const wsl = process.platform === 'linux' && /microsoft/i.test(release())
  if (!wsl) return clipboard.write(text)

  // No WSL, clip.exe depende da página de código e altera as quebras de linha.
  // O PowerShell lê UTF-8 explicitamente; o conteúdo segue por stdin, nunca como código.
  await execa(
    'powershell.exe',
    [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      '$reader = [IO.StreamReader]::new([Console]::OpenStandardInput(), [Text.UTF8Encoding]::new($false, $true)); Set-Clipboard -Value $reader.ReadToEnd() -ErrorAction Stop'
    ],
    { input: text, encoding: 'utf8', stdout: 'ignore', maxBuffer: 4096, timeout: 15_000, windowsHide: true }
  )
}
