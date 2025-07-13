'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import styles from"./recorder.module.css"
const SpeechRecognizer = forwardRef(({ onResult }, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-IN';
      } else {
        setError('Speech Recognition not supported.');
      }
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech Recognition not supported.');
      return;
    }

    setError('');
    recognitionRef.current.start();
    setIsListening(true);

    recognitionRef.current.onresult = (event) => {
      const finalTranscript = event.results[0][0].transcript;
      onResult(finalTranscript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      setError('Error: ' + event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  // Expose startListening and stopListening to parent through ref
  useImperativeHandle(ref, () => ({
    startListening,
    stopListening
  }));

  return (
    <div style={{ marginTop: '20px' }}>
      <div onClick={isListening ? stopListening : startListening}>
        {isListening ?
          <button className={styles.stopButton}>

            <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="black"><path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" /></svg>
          </button>
          :
          <button className={styles.startButton}>
            <svg xmlns="http://www.w3.org/2000/svg" height="27px" viewBox="0 -960 960 960" width="27px" fill="black"><path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" /></svg>
          </button>
}
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
});

export default SpeechRecognizer;
