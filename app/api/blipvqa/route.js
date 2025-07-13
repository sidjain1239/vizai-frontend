import { NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(req) {
  try {
    const { imageBase64, question } = await req.json();

    const base64Data = imageBase64.split(',')[1];
    const mime = imageBase64.match(/data:(.*?);base64/)[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Emulate Gradio's expected format: dict with base64 "url"
    const gradioImageInput = {
      url: `data:${mime};base64,${base64Data}`,
      orig_name: 'image.jpg',
      mime_type: mime,
      size: buffer.length,
      is_stream: false,
      meta: {
        _type: 'gradio.FileData',
      },
    };

    const client = await Client.connect('sjain283/vizai-qa');

    const result = await client.predict("/predict", {
      image: gradioImageInput,
      question: question || '',
    });

    return NextResponse.json({ text: result?.data || '' });
  } catch (err) {
    console.error('VQA API error:', err);
    return NextResponse.json({ error: 'VQA failed' }, { status: 500 });
  }
}
