"use client";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import ChatComponent from "../llm/page";
import styles from "./Home.module.css";
import SpeechRecognizer from "../components/recorder";
import { useRouter } from "next/navigation";
import axios from "axios";
import Groq from "groq-sdk";
export default function Home() {
  const router = useRouter()
  const [userDetails, setUserDetails] = useState()
  useEffect(() => {
    const user = localStorage.getItem('userId');
    console.log("User ID from localStorage:", user);

    if (user) {
      axios.post('/api/userDetails', { id: user })
        .then(res => {
          console.log("Response from API:", res.data);
          if (res.data.userDetail) {
            setUserDetails(res.data.userDetail); // Access the userDetail field
          } else {
            console.error("User not found");
            router.push('/auth/signup');
          }
        })
        .catch(err => {
          console.error("Error fetching user details:", err);
          router.push('/auth/signup');
        });
    } else {
      router.push('/auth/signup');
    }
  }, [router]);

  // Add a useEffect to log userDetails when it changes
  useEffect(() => {
    if (userDetails) {
      console.log(userDetails); // Logs the updated userDetails
    }
  }, [userDetails]);

  const webcamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [msgId, setmsgId] = useState()
  const [Keyboard, setKeyboard] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [status, setStatus] = useState("");
  const [Image, setImage] = useState(false);
  const [Submittinh, setSubmittinh] = useState(false)
  const [prompt, setPrompt] = useState(""); // New state for prompt
  const [Chat, setChat] = useState(false)
  const [Systemmessage, setSystemmessage] = useState(false)
  const [FUM, setFUM] = useState("")
  const [text, setText] = useState('');
  const [URL, setURL] = useState()
  const [Title, setTitle] = useState("New Chat");
  useEffect(() => {
    setURL("https://narwhal-selected-likely.ngrok-free.app/req")
  }
    , [])
  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const generateResults = async (prompt) => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
      });
      return completion.choices[0]?.message?.content || "No content generated.";
    } catch (error) {
      console.error("Error generating results:", error);
      return "Failed to generate results.";
    }
  };
  function speak(text) {
    if (!text || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN' || "hi-IN"; // or 'hi-IN' for Hindi

    speechSynthesis.cancel(); // optional: cancel previous speech
    speechSynthesis.speak(utterance);
  }

  const handleResult = async (finalText) => {
    setText(finalText); // you can use it however you want
    speak("Processing, please wait");
    console.log('Recognized Text:', finalText);
    setSubmittinh(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      // Add prompt to formData
      formData.append("prompt", finalText);

      const res = await fetch(URL, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      console.log(result);
      const title = await generateResults(`return only a chat title if user prompt is ${finalText}`);
      setTitle(title);
      if (result.useLLM) {

        setFUM(result.message)
        if (result.systemMeaage) {
          setSystemmessage(`You are a helpful AI vision assistant who give short answers big only if required with a image with following details ${result.systemMeaage}`)
        } else {
          setSystemmessage("You are a helpful AI vision assistant who give short answers big only if required")
        }
        await axios.post('/api/messages/create-chat', {
          title: title,
          userId: userDetails?._id || localStorage.getItem('userId'),
          image: imageSrc, // base64 from webcamRef
          messages: [{ type: "image", content: result.annotated_image || false }, { type: "user", content: finalText }],
        })
          .then(res => {
            console.log("Chat created successfully", res.data);
            setmsgId(res.data.id);
          })
          .catch(err => {
            console.error("Error creating chat:", err);
          });
        setChat(true)
      } else {
        setStatus(result.message);
        setImage(result.annotated_image);
        speak(result.message);
        axios.post('/api/messages/create-chat', {
          title: title,
          userId: localStorage.getItem('userId'),
          image: imageSrc, // base64 from webcamRef
          messages: [{ type: "image", content: result.annotated_image || false }, { type: "user", content: finalText }, { type: "assistant", content: result.message }],
        })
          .then(res => {
            console.log("Chat created successfully", res.data);
            setmsgId(res.data.id);
          })
          .catch(err => {
            console.error("Error creating chat:", err);
          });
        setFUM("Explain this");
        setSystemmessage(`You are a helpful AI vision assistant who give short answers big only if required with a image with following details ${result.message}`)

      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("Failed to process image. Please try again.");
    } finally {
      setSubmittinh(false);
    }
  };
  // Fetch camera devices
  useEffect(() => {
    async function fetchDevices() {
      try {
        // Request camera permissions
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Enumerate devices after permissions are granted
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(device => device.kind === "videoinput");
        setDevices(videoDevices);

        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        } else {
          setStatus("No video input devices found.");
        }
      } catch (err) {
        console.error("Error accessing camera devices:", err);
        setStatus("Unable to access camera devices. Please check permissions.");
      }
    }

    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      const constraints = {
        video: {
          deviceId: { exact: selectedDeviceId },
          facingMode: 'environment', // Use back camera on mobile
        },
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error('Error accessing video device:', err);
          setStatus("Unable to access the selected camera.");
        });
    }
  }, [selectedDeviceId]);

  const captureAndUpload = async () => {
    setSubmittinh(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      // Add prompt to formData
      formData.append("prompt", prompt);

      const res = await fetch(URL, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      console.log(result);
      const title = await generateResults(`return only a chat title if user prompt is ${prompt}`);
      setTitle(title);
      setStatus(result.message);
      setImage(result.annotated_image);
      if (result.useLLM) {

        setFUM(result.message)
        if (result.systemMeaage) {
          setSystemmessage(`You are a helpful AI vision assistant who give short answers big only if required with a image with following details ${result.systemMeaage}`)
        } else {
          setSystemmessage("You are a helpful AI vision assistant who give short answers big only if required")
        }
        await axios.post('/api/messages/create-chat', {
          title: title,
          userId: userDetails?._id || localStorage.getItem('userId'),
          image: imageSrc, // base64 from webcamRef
          messages: [{ type: "image", content: result.annotated_image || false }, { type: "user", content: prompt }],
        })
          .then(res => {
            console.log("Chat created successfully", res.data);
            setmsgId(res.data.id);
          })
          .catch(err => {
            console.error("Error creating chat:", err);
          });
        setChat(true)
      } else {
        setStatus(result.message);
        setImage(result.annotated_image);
        speak(result.message);
        await axios.post('/api/messages/create-chat', {
          title: title,
          userId: localStorage.getItem('userId'),
          image: imageSrc, // base64 from webcamRef
          messages: [{ type: "image", content: result.annotated_image || false }, { type: "user", content: prompt }, { type: "assistant", content: result.message }],
        })
          .then(res => {
            console.log("Chat created successfully", res.data);
            setmsgId(res.data.id);
          })
          .catch(err => {
            console.error("Error creating chat:", err);
          });
        setFUM("Explain this");
        setSystemmessage(`You are a helpful AI vision assistant who give short answers big only if required with a image with following details ${result.message}`)


      };

    } catch (error) {
      console.error("Error:", error);
      setStatus("Failed to process image. Please try again.");
    } finally {
      setSubmittinh(false);
    }
  };


  return (

    <div className={styles.box}>
      {Chat ? (
        <div className="mt-4">
          <ChatComponent
            systemMessage={Systemmessage}
            firstUserMessage={FUM}
            msgId={msgId}
          />
          <button onClick={() => setChat(false)} className={styles.button}>camera</button>
        </div>
      ) : (


        <div>
          {/* webcam */}

          {selectedDeviceId && (
            <>
           
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ deviceId: selectedDeviceId }}
                className={styles.webcamBackground}
              />
            <div className={styles.webcamContainer}>
              
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ deviceId: selectedDeviceId }}
                className={styles.webcam}
              />
            </div>
             </>
          )}

          <div className={styles.controlBox}>


            <div className={styles.promptContainer}>
              {Keyboard ? (
                <>
                  <div className="flex flex-col  ">
            
                  <input
                    type="text"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to detect..."
                    className={styles.promptInput}
                  />
                  <div className="mt-4 flex justify-around items-end">
                    <button className={styles.button} onClick={() => { setKeyboard(false) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/></svg>
                  </button>
                    {Submittinh ? (
                      <button disabled  className={styles.captureAndUploadProcess}>
                        
                        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z" /></svg>
                      </button>
                    ) : (
                      <button
                      onClick={captureAndUpload}
                      className={styles.captureAndUploadButton}
                      disabled={!prompt.trim()}
                      >
                      <svg xmlns="http://www.w3.org/2000/svg" height="27px" viewBox="0 -960 960 960" width="27px" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z" /></svg>
                      </button>

                    )}
                    {devices.length > 1 && (
                      <button
                        className={styles.button}
                        onClick={() => {
                          setSelectedDeviceId(prevId => {
                            const currentIndex = devices.findIndex(device => device.deviceId === prevId);
                            const nextIndex = (currentIndex + 1) % devices.length;
                            return devices[nextIndex].deviceId;
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M320-280q-33 0-56.5-23.5T240-360v-240q0-33 23.5-56.5T320-680h40l40-40h160l40 40h40q33 0 56.5 23.5T720-600v240q0 33-23.5 56.5T640-280H320Zm0-80h320v-240H320v240Zm160-40q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400ZM342-940q34-11 68.5-15.5T480-960q94 0 177.5 33.5t148 93Q870-774 911-693.5T960-520h-80q-7-72-38-134.5t-79.5-110Q714-812 651-842t-135-36l62 62-56 56-180-180ZM618-20Q584-9 549.5-4.5T480 0q-94 0-177.5-33.5t-148-93Q90-186 49-266.5T0-440h80q8 72 38.5 134.5t79 110Q246-148 309-118t135 36l-62-62 56-56L618-20ZM480-480Z" /></svg>
                      </button>
                    )}
                  
                  </div>
        </div>
                </>) : (

                <>
                {text && 
                  <div className={styles.recognizedTextContainer}>
                      <p>{text || 'Listening...'}</p>
                  </div>
}
                  <div className="flex  justify-around items-end ">
                    <button className={styles.button} onClick={() => { setKeyboard(true) }}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm160-40h320v-80H320v80ZM200-440h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM200-560h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM160-280v-400 400Z" /></svg></button>
                    <SpeechRecognizer onResult={handleResult} />
                    {devices.length > 1 && (
                      <button
                        className={styles.button}
                        onClick={() => {
                          setSelectedDeviceId(prevId => {
                            const currentIndex = devices.findIndex(device => device.deviceId === prevId);
                            const nextIndex = (currentIndex + 1) % devices.length;
                            return devices[nextIndex].deviceId;
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M320-280q-33 0-56.5-23.5T240-360v-240q0-33 23.5-56.5T320-680h40l40-40h160l40 40h40q33 0 56.5 23.5T720-600v240q0 33-23.5 56.5T640-280H320Zm0-80h320v-240H320v240Zm160-40q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400ZM342-940q34-11 68.5-15.5T480-960q94 0 177.5 33.5t148 93Q870-774 911-693.5T960-520h-80q-7-72-38-134.5t-79.5-110Q714-812 651-842t-135-36l62 62-56 56-180-180ZM618-20Q584-9 549.5-4.5T480 0q-94 0-177.5-33.5t-148-93Q90-186 49-266.5T0-440h80q8 72 38.5 134.5t79 110Q246-148 309-118t135 36l-62-62 56-56L618-20ZM480-480Z" /></svg>
                      </button>
                    )}
                  </div>
                </>)}
            </div>
          </div>

          {/* Webcam preview */}



          {Image && (
            <div className={styles.processedImageContainer}>
              <h2 className={styles.processedImageTitle}>Processed Image:</h2>
              <img
                src={`data:image/jpeg;base64,${Image}`}
                alt="Processed"
                className={styles.processedImage}
              />
            </div>
          )}

          {status && (
            <p className={styles.statusMessage}>
              {status}
              <button onClick={() => setChat(true)}>Continue chat</button>
            </p>
          )}
        </div>
      )}

    </div>
  )
}