import { NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageBase64, caption, boxThreshold, textThreshold } = body;

    const base64Data = imageBase64.split(',')[1];
    const mime = imageBase64.match(/data:(.*?);base64/)[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const file = new Blob([buffer], { type: mime });

    						
const client = await Client.connect("sjain283/vizai-gd");
const result = await client.predict("/predict", { 
		input_image: file, 		
		grounding_caption:caption, 		
		box_threshold: boxThreshold, 		
		text_threshold: textThreshold, 
});
console.log(result)
    const imageUrl = result.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const annotatedImageBase64 = `data:image/webp;base64,${Buffer.from(imageBuffer).toString('base64')}`;

    return NextResponse.json({
      imageUrl: annotatedImageBase64,
      details: result.data[1] || null
    });

  } catch (err) {
    console.error("Grounding DINO API error:", err);
    return NextResponse.json({ error: 'Failed to process GroundingDINO image' }, { status: 500 });
  }
}
