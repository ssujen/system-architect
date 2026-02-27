/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Send, 
  ClipboardList, 
  Layout, 
  ChevronRight, 
  CheckCircle2, 
  Copy, 
  RefreshCw,
  Smartphone,
  ArrowLeft,
  Settings,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSystemPlan, SystemPlan } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<SystemPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Web Speech API
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const result = await generateSystemPlan(transcript);
      setPlan(result);
    } catch (err) {
      setError('Failed to generate plan. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setError('Failed to copy to clipboard');
    }
  };

  const reset = () => {
    setPlan(null);
    setTranscript('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#1C1B1F] font-sans selection:bg-indigo-100">
      {/* Android Status Bar Simulation */}
      <div className="h-8 bg-white flex items-center justify-between px-6 text-xs font-medium text-gray-500">
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[8px]">5G</div>
          <Smartphone size={12} />
        </div>
      </div>

      {/* App Bar */}
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          {plan ? (
            <button onClick={reset} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Layout size={20} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold tracking-tight">System Architect</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kotlin Prototype</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Settings size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 pb-32">
        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">What are we building?</h2>
                <p className="text-gray-500 text-sm">Dictate your system requirements and I'll generate a structured plan for Antigravity.</p>
              </div>

              {/* Dictation Area */}
              <div className="relative group">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Tap the mic to start dictating or type here..."
                  className="w-full h-64 p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-xl shadow-gray-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all resize-none text-lg leading-relaxed outline-none"
                />
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    RECORDING
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95",
                    isRecording 
                      ? "bg-red-500 text-white ring-8 ring-red-100" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 ring-8 ring-indigo-50"
                  )}
                >
                  {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={!transcript.trim() || isProcessing}
                  className="w-full py-4 bg-[#1C1B1F] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-black shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Architecting System...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Generate Development Plan
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Summary Card */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">System Summary</h3>
                  <button onClick={() => copyToClipboard(plan.summary)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative">
                    {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} className="text-gray-400" />}
                  </button>
                </div>
                <p className="text-gray-800 leading-relaxed">{plan.summary}</p>
              </section>

              {/* Itemized List */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Core Requirements</h3>
                  <ClipboardList size={18} className="text-gray-400" />
                </div>
                <ul className="space-y-3">
                  {plan.itemizedList.map((item, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Development Plan */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Development Roadmap</h3>
                {plan.developmentPlan.map((phase, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <h4 className="font-bold text-gray-900">{phase.phase}</h4>
                    </div>
                    <ul className="space-y-2 ml-11">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(plan, null, 2))}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all",
                    copied ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-indigo-600 text-white shadow-indigo-100"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={20} />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copy Full Plan for Antigravity
                    </>
                  )}
                </button>
                <button 
                  onClick={reset}
                  className="w-full py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Start New Architecture
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
      </main>

      {/* Android Navigation Bar Simulation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-12">
        <div className="w-4 h-4 border-2 border-gray-400 rounded-sm rotate-45" />
        <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
        <div className="w-4 h-4 border-2 border-gray-400 rounded-sm" />
      </div>
    </div>
  );
}
