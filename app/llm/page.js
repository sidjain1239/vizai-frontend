"use client";

import { useState, useEffect, useRef } from "react";
import Groq from "groq-sdk";
import styles from "./chat.module.css";
import SpeechRecognizer from "../components/recorder";
import axios from "axios";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function ChatComponent({ systemMessage, firstUserMessage, msgId }) {
  const speechRef = useRef();
  const handleStart = () => {
    try {
      speechRef.current?.startListening();
    } catch (error) {


    }
  };

  const handleStop = () => {
    speechRef.current?.stopListening();
  };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);
  function speak(text) {
    if (!text || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN' || "hi-IN"; // or 'hi-IN' for Hindi

    speechSynthesis.cancel(); // optional: cancel previous speech
    utterance.onend = () => {
      console.log("Speech finished. Starting speech recognition...");
      handleStart(); // Start speech recognition after speaking
    };
    speechSynthesis.speak(utterance);
  }
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize chat automatically on component mount
  useEffect(() => {
    initializeChat();
  }, []);

  // Create API messages array with system message + last 4 user/assistant messages
  const createApiMessages = (fullConversationHistory) => {
    const systemMsg = fullConversationHistory.find(msg => msg.role === "system");
    const nonSystemMessages = fullConversationHistory.filter(msg => msg.role !== "system");
    const recentMessages = nonSystemMessages.slice(-4);
    return systemMsg ? [systemMsg, ...recentMessages] : recentMessages;
  };

  // Get Groq chat stream with provided messages
  const getGroqChatStream = async (messages) => {
    return groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 512,
      top_p: 1,
      stop: null,
      stream: true,
    });
  };

  // Stream chat response with provided messages
  const streamChatResponse = async (messages, onChunk, onComplete, onError) => {
    try {
      const stream = await getGroqChatStream(messages);
      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      onError(error);
    }
  };

  // Initialize chat
  const initializeChat =async () => {
    const initialMessages = [
      { role: "system", content: systemMessage },
      { role: "user", content: firstUserMessage }
    ];

    setConversationHistory(initialMessages);
    // setMessages([{ role: "user", content: firstUserMessage }]);

    await handleFirstResponse(initialMessages, firstUserMessage);
   
  };

  // Handle the first AI response
const handleFirstResponse = async (messages, userMessage) => {
  setLoading(true);
  let assistantResponse = "";

  const apiMessages = createApiMessages(messages);

  try {
    await streamChatResponse(
      apiMessages,
      (chunk) => {
        assistantResponse += chunk; // Accumulate chunks into a single response
      },
      async (fullResponse) => {
        speak(fullResponse); // Speak the full response
        setMessages([
          { role: "user", content: userMessage },
          { role: "assistant", content: fullResponse }
        ]);
        setConversationHistory(prev => [...prev, { role: "assistant", content: fullResponse }]);

        // // Save the assistant's response to the server only once
        await  axios.post('/api/messages/update-msg', {
          id: msgId,
          type: "assistant",
          content: fullResponse,
        })
        .then(res => {
          console.log("Assistant chat created successfully", res.data);
        })
        .catch(err => {
          console.error("Error creating assistant chat:", err);
        });
        setLoading(false);
        return fullResponse;
      },
      (error) => {
        console.error("Error:", error);
        setLoading(false);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again."
        }]);
      }
    );
  } catch (error) {
    console.error("Error in first response:", error);
    setLoading(false);
  }
};
  const handleResult = async (finalText) => {

    console.log('Recognized Text:', finalText);

    if (!finalText.trim() || loading) return;

    const userMessage = finalText.trim();
    const updatedMessages = [...messages, { role: "user", content: userMessage }];
    const updatedConversationHistory = [...conversationHistory, { role: "user", content: userMessage }];
    axios.post('/api/messages/update-msg', {
      id: msgId, type: "user", content: userMessage,
    })
      .then(res => {
        console.log("Chat created successfully", res.data);
      })
      .catch(err => {
        console.error("Error creating chat:", err);
      });
    setMessages(updatedMessages);
    setConversationHistory(updatedConversationHistory);
    setInput("");
    setLoading(true);

    const apiMessages = createApiMessages(updatedConversationHistory);

    let assistantResponse = "";

    try {
      await streamChatResponse(
        apiMessages,
        (chunk) => {
          assistantResponse += chunk;
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: assistantResponse }
          ]);

        },
        (fullResponse) => {

          speak(fullResponse);
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: fullResponse }
          ]);
          setConversationHistory(prev => [...prev, { role: "assistant", content: fullResponse }]);


          axios.post('/api/messages/update-msg', {
            id: msgId, type: "assistant", content: fullResponse,
          })
            .then(res => {
              console.log("Assistant chat created successfully", res.data);
            })
            .catch(err => {
              console.error("Error creating assistant chat:", err);
            });
          setLoading(false);

        },
        (error) => {
          console.error("Error:", error);
          setLoading(false);
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again."
          }]);
        }
      );
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setLoading(false);
    }
  }
  // Handle user messages after initialization
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const updatedMessages = [...messages, { role: "user", content: userMessage }];
    const updatedConversationHistory = [...conversationHistory, { role: "user", content: userMessage }];
    axios.post('/api/messages/update-msg', {
      id: msgId, type: "user", content: userMessage,
    })
      .then(res => {
        console.log("Chat created successfully", res.data);
      })
      .catch(err => {
        console.error("Error creating chat:", err);
      });
    setMessages(updatedMessages);
    setConversationHistory(updatedConversationHistory);
    setInput("");
    setLoading(true);

    const apiMessages = createApiMessages(updatedConversationHistory);

    let assistantResponse = "";

    try {
      await streamChatResponse(
        apiMessages,
        (chunk) => {
          assistantResponse += chunk;
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: assistantResponse }
          ]);
        },
        (fullResponse) => {
          speak(fullResponse);
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: fullResponse }
          ]);
          axios.post('/api/messages/update-msg', {
            id: msgId, type: "assistant", content: fullResponse,
          })

            .then(res => {
              console.log("Assistant chat created successfully", res.data);
            })
            .catch(err => {
              console.error("Error creating assistant chat:", err);
            });
          setConversationHistory(prev => [...prev, { role: "assistant", content: fullResponse }]);
          setLoading(false);
        },
        (error) => {
          console.error("Error:", error);
          setLoading(false);
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again."
          }]);
        }
      );
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setLoading(false);
    }
  };

  function stopSpeech() {
    speechSynthesis.cancel();
    handleStop();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI Chat Assistant</h1>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.messageWrapper} ${styles[msg.role]}`}>
            <div className={`${styles.messageBubble} ${styles[msg.role]}`}>
              <div className={styles.messageHeader}>
                {msg.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div className={styles.messageContent}>{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.messageWrapper} ${styles.loading}`}>
            <div className={`${styles.messageBubble} ${styles.loading}`}>
              <div className={styles.messageHeader}>AI Assistant</div>
              <div className={`${styles.messageContent} ${styles.loadingText}`}>Typing...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className={styles.messagesEnd} />
      </div>
      <SpeechRecognizer onResult={handleResult} ref={speechRef} />
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          className={styles.messageInput}
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`${styles.sendButton} ${input.trim() && !loading ? styles.enabled : styles.disabled}`}
        >
          {loading ? "..." : "Send"}
        </button>
        <button onClick={stopSpeech}>Stop audio</button>
      </form>
    </div>
  );
}