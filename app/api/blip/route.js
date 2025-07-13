// app/api/blip/route.js
import { NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    const base64Data = imageBase64.split(',')[1];
    const mime = imageBase64.match(/data:(.*?);base64/)[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const file = new Blob([buffer], { type: mime });

    const client = await Client.connect("sjain283/vizia-imgcap");

    const result = await client.predict("/predict", {
      input: file, // ⚠️ must match the param name expected by your Space
    });

    return NextResponse.json({ caption: result.data });
  } catch (err) {
    console.error("Captioning API error:", err);
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
  }
}
