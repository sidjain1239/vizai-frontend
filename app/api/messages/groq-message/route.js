import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function POST(request) {
  try {
    // Parse the incoming request body to get messages
    const { messages } = await request.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get completion from Groq (non-streaming only)
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 512,
    });

    // Return the response
    return NextResponse.json({
      content: completion.choices[0]?.message?.content || "",
      model: completion.model,
      usage: completion.usage
    });
    
  } catch (error) {
    console.error("Error in Groq API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
