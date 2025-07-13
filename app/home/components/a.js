import Groq from "groq-sdk";

const groq = new Groq({
  apiKey:procsses.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function main() {
  const completion = await getGroqChatCompletion();
  console.log(completion.choices[0]?.message?.content || "");
}

export const getGroqChatCompletion = async () => {
  return groq.chat.completions.create({
    messages: [
      
      {
        role: "user",
        content: "return only a chat title if user prompt is explain this text",
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
};

main();