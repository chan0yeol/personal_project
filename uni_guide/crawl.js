const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://unidocu.unipost.co.kr';
const OUT_DIR = path.join(__dirname, 'docs');

const PAGES = [
  { file: 'intro.md',                          path: '/docs/guide/' },
  { file: 'global-objects/index.md',           path: '/docs/guide/global-objects/' },
  { file: 'global-objects/nst.md',             path: '/docs/guide/global-objects/nst.html' },
  { file: 'global-objects/mls.md',             path: '/docs/guide/global-objects/mls.html' },
  { file: '$u/index.md',                        path: '/docs/guide/$u/' },
  { file: '$u/page.md',                         path: '/docs/guide/$u/page.html' },
  { file: '$u/popup.md',                        path: '/docs/guide/$u/popup.html' },
  { file: '$u/ajax.md',                         path: '/docs/guide/$u/ajax.html' },
  { file: '$u/util.md',                         path: '/docs/guide/$u/util.html' },
  { file: '$u/util-date.md',                    path: '/docs/guide/$u/util-date.html' },
  { file: '$u/util-localstorage.md',            path: '/docs/guide/$u/util-localstorage.html' },
  { file: 'grid/index.md',                      path: '/docs/guide/grid/' },
  { file: 'grid/data-access.md',               path: '/docs/guide/grid/data-access.html' },
  { file: 'grid/data-methods.md',              path: '/docs/guide/grid/data-methods.html' },
  { file: 'grid/data-retrieval.md',            path: '/docs/guide/grid/data-retrieval.html' },
  { file: 'grid/events.md',                    path: '/docs/guide/grid/events.html' },
  { file: 'modules/efi.md',                    path: '/docs/guide/modules/efi.html' },
  { file: 'modules/ewf.md',                    path: '/docs/guide/modules/ewf.html' },
  { file: 'modules/ecar.md',                   path: '/docs/guide/modules/ecar.html' },
  { file: 'modules/efa.md',                    path: '/docs/guide/modules/efa.html' },
  { file: 'cache/index.md',                    path: '/docs/guide/cache/' },
  { file: 'cache/browser-vs-server.md',        path: '/docs/guide/cache/browser-vs-server.html' },
  { file: 'cache/when-to-clear.md',            path: '/docs/guide/cache/when-to-clear.html' },
  { file: 'cache/cache-busting.md',            path: '/docs/guide/cache/cache-busting.html' },

  // 코딩 가이드
  { file: 'coding-guide/index.md',                          path: '/docs/coding-guide/' },
  { file: 'coding-guide/quality/var-to-const-let.md',       path: '/docs/coding-guide/quality/var-to-const-let.html' },
  { file: 'coding-guide/quality/naming-conventions.md',     path: '/docs/coding-guide/quality/naming-conventions.html' },
  { file: 'coding-guide/quality/magic-numbers.md',          path: '/docs/coding-guide/quality/magic-numbers.html' },
  { file: 'coding-guide/syntax/es6-features.md',            path: '/docs/coding-guide/syntax/es6-features.html' },
  { file: 'coding-guide/syntax/loop-performance.md',        path: '/docs/coding-guide/syntax/loop-performance.html' },
  { file: 'coding-guide/async/sync-vs-async.md',            path: '/docs/coding-guide/async/sync-vs-async.html' },
  { file: 'coding-guide/async/promises-async-await.md',     path: '/docs/coding-guide/async/promises-async-await.html' },
  { file: 'coding-guide/async/callback-hell.md',            path: '/docs/coding-guide/async/callback-hell.html' },
  { file: 'coding-guide/functional/functional-programming.md', path: '/docs/coding-guide/functional/functional-programming.html' },
];

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchHTML(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function htmlToMarkdown(html) {
  // article 또는 main 콘텐츠 영역 추출
  let content = html;

  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentMatch = content.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (articleMatch) content = articleMatch[1];
  else if (mainMatch) content = mainMatch[1];
  else if (contentMatch) content = contentMatch[1];

  // 스크립트/스타일 제거
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

  // 코드 블록
  content = content.replace(/<pre[^>]*><code[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_, lang, code) => `\`\`\`${lang}\n${decodeHtml(code)}\`\`\`\n`);
  content = content.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_, code) => `\`\`\`\n${decodeHtml(code)}\`\`\`\n`);
  content = content.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi,
    (_, code) => `\`${decodeHtml(code)}\``);

  // 헤딩
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${stripTags(t)}\n\n`);
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${stripTags(t)}\n\n`);
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${stripTags(t)}\n\n`);
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `#### ${stripTags(t)}\n\n`);

  // 리스트
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${stripTags(t).trim()}\n`);
  content = content.replace(/<\/ul>/gi, '\n');
  content = content.replace(/<\/ol>/gi, '\n');

  // 테이블
  content = content.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => stripTags(m[1]).trim());
    return `| ${cells.join(' | ')} |\n`;
  });

  // 강조
  content = content.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, t) => `**${stripTags(t)}**`);
  content = content.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, t) => `**${stripTags(t)}**`);
  content = content.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, t) => `*${stripTags(t)}*`);

  // 단락/줄바꿈
  content = content.replace(/<p[^>]*>/gi, '');
  content = content.replace(/<\/p>/gi, '\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');

  // 나머지 태그 제거
  content = stripTags(content);

  // HTML 엔티티 디코딩
  content = decodeHtml(content);

  // 연속 빈줄 정리
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  return content;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function decodeHtml(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function crawl() {
  for (const page of PAGES) {
    const url = BASE_URL + page.path;
    const outPath = path.join(OUT_DIR, page.file);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    try {
      process.stdout.write(`크롤링: ${page.path} ... `);
      const html = await fetchHTML(url);
      const md = htmlToMarkdown(html);
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`완료 (${md.length}자)`);
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }

    // 서버 부하 방지
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n전체 완료!');
}

crawl();
