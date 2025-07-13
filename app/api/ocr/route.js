import { NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64, lang } = body;
    const base64Data = imageBase64.split(',')[1];
    const mime = imageBase64.match(/data:(.*?);base64/)[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const file = new Blob([buffer], { type: mime });

    const client = await Client.connect("sjain283/vizai-ocr");

    const result = await client.predict("//predict", {
      img: file,               // ✅ Required image
      lang: lang || "en",      // ✅ Language
    });

    return NextResponse.json({ text: result.data });
  } catch (err) {
    console.error("OCR API error:", err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
