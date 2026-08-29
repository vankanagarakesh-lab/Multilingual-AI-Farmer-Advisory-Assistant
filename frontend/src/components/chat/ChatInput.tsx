import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Mic, 
  Square, 
  Globe, 
  Plus, 
  Camera, 
  Image as ImageIcon, 
  X 
} from 'lucide-react';
import { transcribeVoice } from '../../services/api';
import { CameraModal } from './CameraModal';

interface ChatInputProps {
  onSendMessage: (message: string, responseLanguage?: string, attachedImage?: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry?: () => void;
  initialLanguage?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  errorMessage,
  onRetry,
  initialLanguage = 'en'
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Response & Voice Language: 'en' | 'te' | 'hi'
  const [selectedLang, setSelectedLang] = useState<'en' | 'te' | 'hi'>(() => {
    const clean = (initialLanguage || 'en').toLowerCase();
    if (clean.includes('te') || clean.includes('telugu')) return 'te';
    if (clean.includes('hi') || clean.includes('hindi')) return 'hi';
    return 'en';
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  // Close attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    if (isAttachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachmentMenuOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setVoiceError('Please upload a valid plant or crop image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    setIsAttachmentMenuOpen(false);
    if (e.target) e.target.value = '';
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setAttachedImage(imageDataUrl);
    setIsCameraModalOpen(false);
  };

  const cycleLanguage = () => {
    setSelectedLang((prev) => {
      if (prev === 'en') return 'te';
      if (prev === 'te') return 'hi';
      return 'en';
    });
  };

  const getMicLangCode = () => {
    if (selectedLang === 'te') return 'te-IN';
    if (selectedLang === 'hi') return 'hi-IN';
    return 'en-IN';
  };

  const getLangDisplay = () => {
    if (selectedLang === 'te') return 'తెలుగు';
    if (selectedLang === 'hi') return 'हिंदी';
    return 'English';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = !!input.trim();
    const hasImage = !!attachedImage;
    if ((!hasText && !hasImage) || isLoading || isRecording || isProcessingVoice) return;

    let finalPrompt = input.trim();
    if (!finalPrompt && hasImage) {
      if (selectedLang === 'te') {
        finalPrompt = 'దయచేసి ఈ మొక్క/పంట ఆకు ఫోటోను పరిశీలించి తెగులు లేదా సమస్య నివారణ సలహా ఇవ్వండి.';
      } else if (selectedLang === 'hi') {
        finalPrompt = 'कृपया इस पौधे/पत्ती की फोटो देखकर रोग या समस्या का समाधान बताएं।';
      } else {
        finalPrompt = 'Please analyze this crop/plant leaf image and diagnose any symptoms, pests, or disease problems.';
      }
    }

    onSendMessage(finalPrompt, selectedLang, attachedImage || undefined);
    setInput('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startRecording = async () => {
    setVoiceError(null);

    // 1. Try Browser Web Speech Recognition API first (real-time live speech to text)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getMicLangCode();

        let finalTranscript = input ? input + " " : "";

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setInput(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setVoiceError("Microphone access denied. Please grant microphone permission in your browser.");
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        return;
      } catch (err) {
        console.warn("Web Speech API initialization failed, falling back to audio recording:", err);
      }
    }

    // 2. Fallback to MediaRecorder + Backend STT Upload
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceError("Voice recording is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (audioBlob.size === 0) {
          setVoiceError("Recorded audio was empty. Please try speaking again.");
          setIsProcessingVoice(false);
          return;
        }

        setIsProcessingVoice(true);
        try {
          const result = await transcribeVoice(audioBlob);
          if (result && result.text && !result.text.includes("successfully")) {
            setInput((prev) => (prev ? prev + " " + result.text : result.text));
          } else if (result && result.text) {
            setInput(result.text);
          } else {
            setVoiceError("Could not recognize speech. Please speak clearly.");
          }
        } catch (err: any) {
          console.error("Voice transcription failed:", err);
          setVoiceError(err?.response?.data?.detail || "Voice transcription failed. Please try again.");
        } finally {
          setIsProcessingVoice(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setVoiceError("Microphone access denied or unavailable. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  return (
    <div className="p-3 md:p-4 bg-slate-900/90 border-t border-slate-800/80 sticky bottom-0 z-20">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Hidden File Picker Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Camera Capture Viewfinder Modal */}
        <CameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={handleCameraCapture}
        />

        {/* Image Attachment Preview */}
        {attachedImage && (
          <div className="relative inline-flex items-center p-1.5 bg-slate-800 border border-emerald-500/40 rounded-2xl shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <img 
              src={attachedImage} 
              alt="Crop upload preview" 
              className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0" 
            />
            <div className="ml-2.5 mr-6 text-xs">
              <p className="font-semibold text-emerald-400">Crop / Plant Leaf Attached</p>
              <p className="text-[11px] text-slate-400">Click send for AI agricultural diagnosis</p>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition"
              title="Remove attached photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Banners */}
        {(errorMessage || voiceError) && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{voiceError || errorMessage}</span>
            </div>
            {errorMessage && onRetry && (
              <button
                onClick={onRetry}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold flex items-center space-x-1 transition text-xs shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Recording / Voice Processing Banners */}
        {isRecording && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
              <span className="font-semibold">🎙 Listening live ({getLangDisplay()})... Speak into microphone</span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Done Speaking</span>
            </button>
          </div>
        )}

        {/* Loading Banner */}
        {isLoading && !isProcessingVoice && (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium px-2 py-1 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>🌾 KRISHI AI is analyzing your crop query...</span>
          </div>
        )}

        {/* Form Input with Plus (+) Attachment Button, Microphone & Language Selector */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          {/* Plus (+) Button for Attachments */}
          <div className="relative" ref={attachmentMenuRef}>
            <button
              type="button"
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              disabled={isLoading || isRecording || isProcessingVoice}
              title="Attach crop photo or open camera"
              className={`
                p-3 mr-2 rounded-2xl border transition duration-150 flex items-center justify-center active:scale-95
                ${attachedImage 
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'}
              `}
            >
              <Plus className={`w-4 h-4 transition-transform duration-200 ${isAttachmentMenuOpen ? 'rotate-45 text-rose-400' : ''}`} />
            </button>

            {/* Attachment Menu Popup */}
            {isAttachmentMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAttachmentMenuOpen(false);
                    setIsCameraModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-600 hover:text-white transition flex items-center space-x-2.5"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Take Plant Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAttachmentMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-600 hover:text-white transition flex items-center space-x-2.5"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>Upload Image</span>
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask KRISHI AI in ${getLangDisplay()}... or use + to attach crop photo`}
            disabled={isLoading || isRecording || isProcessingVoice}
            className="
              w-full py-3.5 pl-4 pr-36 rounded-2xl bg-slate-800/90 border border-slate-700/80
              text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500/80
              focus:ring-2 focus:ring-emerald-500/20 transition resize-none disabled:opacity-50
            "
          />

          <div className="absolute right-2.5 flex items-center space-x-1.5">
            {/* Language Selector Toggle */}
            <button
              type="button"
              onClick={cycleLanguage}
              title={`Switch language (Currently: ${getLangDisplay()} - click to change)`}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600 transition flex items-center space-x-1"
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span>{selectedLang === 'te' ? 'తెలుగు' : selectedLang === 'hi' ? 'हिंदी' : 'EN'}</span>
            </button>

            {/* Microphone Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading || isProcessingVoice}
                title={`Speak to KRISHI AI in ${getLangDisplay()}`}
                className="
                  p-2 rounded-xl bg-slate-700 hover:bg-emerald-600/80 text-emerald-300 hover:text-white
                  disabled:opacity-40 transition flex items-center justify-center active:scale-95
                "
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                title="Stop Recording"
                className="
                  p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white
                  transition flex items-center justify-center active:scale-95 animate-pulse
                "
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachedImage) || isLoading || isRecording || isProcessingVoice}
              className="
                p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white
                disabled:opacity-40 disabled:hover:bg-emerald-600 transition shadow-md shadow-emerald-950
                flex items-center justify-center active:scale-95
              "
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
          <span>🌾 KRISHI AI Plant Health Advisor</span>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
          >
            <Mic className="w-3 h-3 inline" />
            <span>🎤 Click to Speak ({getLangDisplay()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
