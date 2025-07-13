import { NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    // 🔄 Convert base64 string to buffer
    const base64Data = imageBase64.split(',')[1];
    const mime = imageBase64.match(/data:(.*?);base64/)[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // 🟡 Convert to Blob
    const file = new Blob([buffer], { type: mime });

    // 🚀 Connect to Gradio YOLOv8m Space
    const client = await Client.connect("sjain283/vizai-od");

    // 🎯 Send prediction request
    const result = await client.predict("/predict", {
      image: file, // ✅ Changed from 'img' to 'image'
    });

    // 🖼️ Convert annotated image URL to base64
    console.log("YOLO result:", result);
    
    // Get the annotated image URL from result
    const imageUrl = result.data[0].url;
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const annotatedImageBase64 = `data:image/webp;base64,${Buffer.from(imageBuffer).toString('base64')}`;
    
    return NextResponse.json({ 
      imageUrl: annotatedImageBase64, // Send base64 instead of URL
      detectedObjects: result.data[1] // Detection results array
    });
  } catch (err) {
    console.error("YOLO API error:", err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}