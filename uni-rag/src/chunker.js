const path = require('path')

// 함수 시작 라인 감지 패턴
const FN_PATTERNS = [
  // function name(...) {
  /^\s*function\s+(\w[\w$]*)\s*\(/,
  // name = function(...) {  /  obj.prop = function(...) {
  /^\s*([\w$][\w$.]*)\s*=\s*function\s*(?:\w+\s*)?\(/,
  // var/const/let name = function(...) {
  /^\s*(?:var|let|const)\s+(\w[\w$]*)\s*=\s*function\s*(?:\w+\s*)?\(/,
  // name: function(...) {  (object literal)
  /^\s*(\w[\w$]*)\s*:\s*function\s*(?:\w+\s*)?\(/,
]

const SKIP_NAMES = new Set(['if', 'for', 'while', 'switch', 'catch', 'return'])

function findFunctionEnd(lines, startLine) {
  let depth = 0
  let started = false
  const limit = Math.min(startLine + 120, lines.length)

  for (let i = startLine; i < limit; i++) {
    const line = lines[i]
    let inStr = false
    let strCh = ''

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (inStr) {
        if (ch === strCh && line[j - 1] !== '\\') inStr = false
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inStr = true; strCh = ch
      } else if (ch === '/' && line[j + 1] === '/') {
        break // 줄 주석
      } else if (ch === '{') {
        depth++; started = true
      } else if (ch === '}') {
        depth--
        if (started && depth === 0) return i
      }
    }
  }
  return Math.min(startLine + 80, limit - 1)
}

function extractChunks(content, filePath, sourceDir) {
  const relFile = path.relative(sourceDir, filePath).replace(/\\/g, '/')
  const lines = content.split('\n')
  const chunks = []
  const seen = new Set()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let fnName = null

    for (const pattern of FN_PATTERNS) {
      const m = pattern.exec(line)
      if (m) {
        fnName = m[1] || m[2]
        break
      }
    }

    if (!fnName || SKIP_NAMES.has(fnName)) continue

    const endLine = findFunctionEnd(lines, i)
    const code = lines.slice(i, endLine + 1).join('\n').trim()
    if (code.length < 15) continue

    const id = `${relFile}:${fnName}:${i}`
    if (seen.has(id)) continue
    seen.add(id)

    chunks.push({
      id,
      file: relFile,
      fnName,
      code: code.slice(0, 4000),
      startLine: i + 1
    })
  }

  // 함수 감지 못한 파일은 파일 전체를 하나의 청크로
  if (chunks.length === 0 && content.trim().length > 20) {
    chunks.push({
      id: relFile,
      file: relFile,
      fnName: path.basename(filePath, '.js'),
      code: content.slice(0, 4000),
      startLine: 1
    })
  }

  return chunks
}

module.exports = { extractChunks }
