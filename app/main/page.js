'use client';

import { useState } from 'react';

export default function MainPage() {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState('');
  const [textResult, setTextResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResultImage(null);
    setTextResult(null);

    try {
      let imageBase64 = null;

      if (imageFile) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const body = {
        prompt,
        imageBase64,
        lang: 'en',
      };

      const response = await fetch('/api/main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.textOutput) setTextResult(data.textOutput);
      if (data.imageOutput) setResultImage(data.imageOutput);

    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">AI Vision Model</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your prompt"
            required
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">Image File</label>
          <input
            type="file"
            id="image"
            onChange={(e) => setImageFile(e.target.files[0])}
            accept="image/*"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !prompt}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {textResult && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Text Output:</h3>
          <pre className="bg-gray-100 p-4 rounded-lg shadow-md whitespace-pre-wrap">{textResult}</pre>
        </div>
      )}

      {resultImage && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Result Image:</h3>
          <img
            src={resultImage}
            alt="Processed Result"
            className="w-full rounded-lg shadow-md"
            onError={() => setError('Failed to load result image')}
          />
        </div>
      )}
    </div>
  );
}
