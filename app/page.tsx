'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [resumeText, setResumeText] = useState('');
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const previousTranscriptRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Browser does not support speech recognition');
      return;
    }

    // Check for saved API key
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setShowApiInput(false);
    }
    
    // Check for saved resume
    const savedResume = localStorage.getItem('user_resume');
    if (savedResume) {
      setResumeText(savedResume);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Process speech when there's a pause
  useEffect(() => {
    if (!isActive || !transcript || transcript === previousTranscriptRef.current) return;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout to detect pause in speech
    timeoutRef.current = setTimeout(() => {
      if (transcript !== previousTranscriptRef.current) {
        const newText = transcript.slice(previousTranscriptRef.current.length).trim();
        
        // Check if the new text contains a question
        if (newText && (
          newText.includes('?') || 
          newText.toLowerCase().startsWith('what') || 
          newText.toLowerCase().startsWith('how') || 
          newText.toLowerCase().startsWith('why') || 
          newText.toLowerCase().startsWith('when') || 
          newText.toLowerCase().startsWith('where') || 
          newText.toLowerCase().startsWith('which') ||
          newText.toLowerCase().startsWith('can') ||
          newText.toLowerCase().startsWith('could')
        )) {
          processQuestion(newText);
          previousTranscriptRef.current = transcript;
        }
      }
    }, 1500); // Wait 1.5 seconds of silence before processing
    
  }, [transcript, isActive]);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an OpenAI API key');
      return false;
    }
    
    localStorage.setItem('openai_api_key', apiKey);
    setShowApiInput(false);
    toast.success('API key saved!');
    return true;
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/pdf' && 
        file.type !== 'text/plain' && 
        file.type !== 'application/msword' && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast.error('Please upload a PDF, TXT, or DOC/DOCX file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setResumeText(result);
        localStorage.setItem('user_resume', result);
        toast.success('Resume uploaded successfully');
        setShowResumeUpload(false);
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file');
    };

    // For PDFs and DOCs we'll just store the fact that they were uploaded
    // In a real app, you'd use a PDF/DOC parsing library
    if (file.type === 'application/pdf' || 
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const resumeInfo = `Resume uploaded: ${file.name}`;
      setResumeText(resumeInfo);
      localStorage.setItem('user_resume', resumeInfo);
      toast.success('Resume uploaded successfully');
      setShowResumeUpload(false);
      return;
    }

    reader.readAsText(file);
  };

  const clearResume = () => {
    setResumeText('');
    localStorage.removeItem('user_resume');
    toast.success('Resume data cleared');
  };

  const startListening = () => {
    if (showApiInput) {
      if (!saveApiKey()) return;
    }
    
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported');
      return;
    }

    setIsActive(true);
    previousTranscriptRef.current = '';
    setTranscript('');
    setResponses([]);

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        toast.error(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Restart if still active
      if (isActive && recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    recognition.start();
    toast.success('Listening started');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsActive(false);
    toast.success('Listening stopped');
  };

  const processQuestion = async (question: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question, 
          apiKey,
          resumeText: resumeText || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setResponses(prev => [...prev, { question, answer: data.answer }]);
    } catch (error) {
      toast.error('Failed to get AI response');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setShowApiInput(true);
    toast.success('API key removed');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-0">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3sl font-bold text-center mb-1">AI Interview Assistant</h1>
        
        {showApiInput ? (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-medium text-sm mb-0">Enter Your OpenAI API Key:</h2>
            <div className="flex space-x-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={saveApiKey}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end mb-4">
            <button
              onClick={resetApiKey}
              className="text-sm text-gray-600 underline"
            >
              Change API Key
            </button>
          </div>
        )}
        
        {/* Resume upload section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-medium text-lg">Your Resume/CV:</h2>
            <button
              onClick={() => setShowResumeUpload(!showResumeUpload)}
              className="text-blue-600 text-sm"
            >
              {showResumeUpload ? 'Cancel' : resumeText ? 'Change' : 'Upload'}
            </button>
          </div>

          {showResumeUpload ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleResumeUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded mb-2"
              >
                Select Resume File
              </button>
              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, TXT (max 5MB)
              </p>
            </div>
          ) : (
            <div>
              {resumeText ? (
                <div className="relative">
                  <div className="bg-gray-50 p-3 rounded max-h-[150px] overflow-y-auto text-sm">
                    {resumeText.length > 500 
                      ? resumeText.substring(0, 500) + '...' 
                      : resumeText}
                  </div>
                  <button
                    onClick={clearResume}
                    className="absolute top-2 right-2 text-red-500 text-xs"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  Upload your resume 
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-center mb-2">
          <button
            onClick={isActive ? stopListening : startListening}
            className={`px-6 py-3 rounded-full font-medium text-white shadow-md ${
              isActive ? 'bg-red-500' : 'bg-blue-600'
            }`}
          >
            {isActive ? 'Stop Listening' : 'Start Listening'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-1 mb-2">
          <h2 className="font-medium text-xs mb-1">Conversation:</h2>
          <div className="bg-gray-50 p-0 rounded min-h-[100px] max-h-[300px] overflow-y-auto">
            {transcript || 'Start speaking...'}
          </div>
        </div>

        {responses.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-medium text-lg mb-2">Answers:</h2>
            <div className="space-y-4">
              {responses.map((item, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <p className="font-medium text-gray-800">{item.question}</p>
                  <p className="text-gray-600 mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
            Processing question...
          </div>
        )}
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-1">1. Enter your OpenAI API key (get one from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OpenAI</a>)</p>
          <p className="mb-1">2. Upload your resume/CV for personalized answers</p>
          <p className="mb-1">3. Click "Start Listening" and start your conversation</p>
          <p className="mb-1">4. Any time you ask a question, the AI will automatically detect it and provide an answer</p>
          <p>Works best in Chrome and Edge browsers</p>
        </div>
      </div>
    </main>
  );
} 