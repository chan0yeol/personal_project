import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const filepath = path.join(POSTS_DIR, filename);
        const raw = fs.readFileSync(filepath, 'utf-8');
        const { data, content } = matter(raw);

        return NextResponse.json({
            title: data.title ?? '',
            date: data.date ? new Date(data.date).toISOString().slice(0, 16) : '',
            categories: (data.categories ?? []).join(', '),
            tags: (data.tags ?? []).join(', '),
            draft: data.draft ?? false,
            content: content.trim(),
        });
    } catch {
        return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const { title, content, categories, tags, draft, date } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
        }

        // 기존 파일 삭제
        const oldFilepath = path.join(POSTS_DIR, filename);
        fs.unlinkSync(oldFilepath);

        // 새 파일명 생성 (제목 변경 시 파일명도 변경)
        const slug = slugify(title, { lower: true, strict: true });
        const fileDate = date ? date.split('T')[0] : new Date().toISOString().split('T')[0];
        const dateTime = date ? `${date}:00+09:00` : `${new Date().toISOString().split('T')[0]}T21:00:00+09:00`;
        const newFilename = `${fileDate}-${slug}.md`;

        const categoriesArr = categories
            ? categories.split(',').map((c: string) => c.trim()).filter(Boolean)
            : [];
        const tagsArr = tags
            ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : [];

        const fileContent = `---
                            title: "${title}"
                            date: ${dateTime}
                            categories: [${categoriesArr.map((c: string) => `"${c}"`).join(', ')}]
                            tags: [${tagsArr.map((t: string) => `"${t}"`).join(', ')}]
                            draft: ${draft ?? false}
                            ---

                            ${content}`;

        fs.writeFileSync(path.join(POSTS_DIR, newFilename), fileContent, 'utf-8');

        return NextResponse.json({ success: true, filename: newFilename });
    } catch {
        return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    }
}