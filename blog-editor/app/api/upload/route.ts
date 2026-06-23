import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images');

export async function POST(req: NextRequest) {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '파일 없음' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

        return NextResponse.json({ url: `/images/${filename}` });
    } catch {
        return NextResponse.json({ error: '업로드 실패' }, { status: 500 });
    }
}