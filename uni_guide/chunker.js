const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, 'docs');

function chunkMarkdown(content, filePath) {
  const relFile = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  const lines = content.split('\n');
  const chunks = [];

  let h1 = '', h2 = '', h3 = '';
  let currentHeading = '';
  let currentLines = [];
  let currentLevel = 0;

  function flushChunk() {
    const text = currentLines.join('\n').trim();
    if (!text || text.length < 30) return;

    const breadcrumb = [h1, h2, h3].filter(Boolean).join(' > ');
    const id = `${relFile}::${breadcrumb}::${currentHeading}`.replace(/\s+/g, '_');

    chunks.push({
      id,
      file: relFile,
      breadcrumb,
      title: currentHeading,
      content: `# ${breadcrumb ? breadcrumb + ' > ' : ''}${currentHeading}\n\n${text}`,
    });
  }

  for (const line of lines) {
    const h1m = line.match(/^# (.+)/);
    const h2m = line.match(/^## (.+)/);
    const h3m = line.match(/^### (.+)/);
    const h4m = line.match(/^#### (.+)/);

    if (h1m) {
      flushChunk();
      h1 = h1m[1].replace(/​/g, '').trim(); // zero-width space 제거
      h2 = ''; h3 = '';
      currentHeading = h1; currentLines = []; currentLevel = 1;
    } else if (h2m) {
      flushChunk();
      h2 = h2m[1].replace(/​/g, '').trim();
      h3 = '';
      currentHeading = h2; currentLines = []; currentLevel = 2;
    } else if (h3m) {
      flushChunk();
      h3 = h3m[1].replace(/​/g, '').trim();
      currentHeading = h3; currentLines = []; currentLevel = 3;
    } else if (h4m) {
      flushChunk();
      currentHeading = h4m[1].replace(/​/g, '').trim();
      currentLines = []; currentLevel = 4;
    } else {
      currentLines.push(line);
    }
  }

  flushChunk();
  return chunks;
}

function loadAllChunks() {
  const chunks = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf8');
        chunks.push(...chunkMarkdown(content, full));
      }
    }
  }

  walk(DOCS_DIR);
  return chunks;
}

// 직접 실행 시 결과 출력
if (require.main === module) {
  const chunks = loadAllChunks();
  console.log(`총 ${chunks.length}개 청크\n`);
  chunks.slice(0, 3).forEach((c, i) => {
    console.log(`[${i + 1}] ${c.file}`);
    console.log(`    breadcrumb: ${c.breadcrumb}`);
    console.log(`    title: ${c.title}`);
    console.log(`    length: ${c.content.length}자\n`);
  });
}

module.exports = { loadAllChunks };
