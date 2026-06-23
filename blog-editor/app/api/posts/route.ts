import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export async function POST(req: NextRequest) {
    try {
        const { title, content, categories, tags, draft, date } = await req.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: '제목과 내용을 입력해주세요.' },
                { status: 400 }
            );
        }

        const slug = slugify(title, { lower: true, strict: true });

        if (!slug) {
            return NextResponse.json(
                { error: '유효한 제목을 입력해주세요. 특수문자만으로는 제목을 만들 수 없습니다.' },
                { status: 400 }
            );
        }

        const fileDate = date ? date.split('T')[0] : new Date().toISOString().split('T')[0];
        const dateTime = date ? `${date}:00+09:00` : `${new Date().toISOString().split('T')[0]}T21:00:00+09:00`;
        const filename = `${fileDate}-${slug}.md`;

        const categoriesArr = categories
            ? categories.split(',').map((c: string) => c.trim()).filter(Boolean)
            : [];
        const tagsArr = tags
            ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : [];

        // 들여쓰기 없이 문자열 생성
        const fileContent = `---
title: "${title}"
date: ${dateTime}
categories: [${categoriesArr.map((c: string) => `"${c}"`).join(', ')}]
tags: [${tagsArr.map((t: string) => `"${t}"`).join(', ')}]
draft: ${draft ?? false}
---

${content}`;

        fs.writeFileSync(path.join(POSTS_DIR, filename), fileContent, 'utf-8');

        return NextResponse.json({ success: true, filename });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: '저장 실패' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const files = fs.readdirSync(POSTS_DIR);

        const posts = files
            .filter(f => f.endsWith('.md'))
            .map(f => {
                try {
                    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
                    const { data } = matter(raw);

                    const postDate = data.date ? new Date(data.date) : null;

                    if (!postDate || isNaN(postDate.getTime())) {
                        console.error(`Invalid or missing date in file: ${f}. Skipping.`);
                        return null;
                    }

                    return {
                        filename: f,
                        title: data.title ?? '',
                        date: postDate.toISOString().slice(0, 16).replace('T', ' '),
                        categories: data.categories ?? [],
                        tags: data.tags ?? [],
                        draft: data.draft ?? false,
                    };
                } catch (e) {
                    console.error(`Error parsing file ${f}:`, e);
                    return null;
                }
            })
            .filter(Boolean)
            .sort((a, b) => {
                // a and b are non-null here because of filter(Boolean)
                return new Date(b!.date).getTime() - new Date(a!.date).getTime()
            });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error reading posts:', error);
        return NextResponse.json({ posts: [] });
    }
}
