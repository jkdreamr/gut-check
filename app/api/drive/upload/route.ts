// app/api/drive/upload/route.ts — proxy multipart uploads to /drive/upload.
// Accepts a multipart/form-data body with a "file" field, forwards to Newnal,
// and returns the resulting public CloudFront URL.

import { NextResponse, type NextRequest } from 'next/server';
import { uploadDriveFile } from '@/lib/newnal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file field required' }, { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const result = await uploadDriveFile(buf, file.type || 'application/octet-stream', file.name);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
