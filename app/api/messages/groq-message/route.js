import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function POST(request) {
  try {
    // Parse the incoming request body to get messages and streaming preference
    const { messages, stream = false } = await request.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // If client requested streaming
    if (stream) {
      try {
        // For React Native, we'll collect all chunks and return them as an array
        const completion = await groq.chat.completions.create({
          messages,
          model: "llama-3.3-70b-versatile",
          stream: true,
          temperature: 0.7,
          max_tokens: 512,
        });

        const chunks = [];
        let fullContent = '';

        // Collect all chunks
        for await (const chunk of completion) {
          if (chunk.choices?.[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            chunks.push(content);
            fullContent += content;
          }
        }

        // Return chunks for client-side streaming simulation
        return NextResponse.json({
          chunks: chunks,
          content: fullContent,
          model: 'llama-3.3-70b-versatile',
          isStreaming: true
        });

      } catch (streamError) {
        console.error("Streaming error:", streamError);
        // Fallback to non-streaming if streaming fails
        const completion = await groq.chat.completions.create({
          messages,
          model: "llama-3.3-70b-versatile",
        });

        return NextResponse.json({
          content: completion.choices[0]?.message?.content || "",
          model: completion.model,
          usage: completion.usage,
          isStreaming: false
        });
      }
    } 
    // Regular non-streaming response
    else {
      // Get completion from Groq
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
      });

      // Return the response
      return NextResponse.json({
        content: completion.choices[0]?.message?.content || "",
        model: completion.model,
        usage: completion.usage
      });
    }
    
  } catch (error) {
    console.error("Error in Groq API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}