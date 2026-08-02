import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Enforce 5MB file size limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    // Enforce valid image MIME types
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Strip EXIF metadata (GPS tags, camera data, timestamps) to preserve student physical anonymity.
    // Calling .rotate() auto-orients based on EXIF orientation header prior to stripping.
    let processedBuffer: Buffer;
    let ext = '.jpg';

    if (file.type.toLowerCase() === 'image/png') {
      processedBuffer = await sharp(inputBuffer).rotate().png({ quality: 85 }).toBuffer();
      ext = '.png';
    } else if (file.type.toLowerCase() === 'image/webp') {
      processedBuffer = await sharp(inputBuffer).rotate().webp({ quality: 85 }).toBuffer();
      ext = '.webp';
    } else {
      processedBuffer = await sharp(inputBuffer).rotate().jpeg({ quality: 85 }).toBuffer();
      ext = '.jpg';
    }

    // Save to public/uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, processedBuffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: unknown) {
    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'File upload failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
