import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

export async function POST(req) {
  try {
    const { prompt, imageBase64, lang = "en" } = await req.json();

    if (!prompt || !imageBase64) {
      return NextResponse.json({ error: "Prompt or image missing" }, { status: 400 });
    }

    // Convert base64 to Blob
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.match(/data:(.*?);base64/)?.[1] || "image/png";
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: mimeType });

    // Use Gradio Client SDK
    const client = await Client.connect("sjain283/vizai-nlp");
    const result = await client.predict("/predict", {
      prompt: prompt,
      image: blob,
      lang: lang
    })
    return NextResponse.json(
      result.data[0] ||result.data 
    );

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to process request", message: err.message }, { status: 500 });
  }
}
