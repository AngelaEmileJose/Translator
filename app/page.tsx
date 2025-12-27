"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { languages } from "../lib/languages";
import { CameraInput } from "../components/ui/camera-input";
import { Camera, Type } from "lucide-react";

export default function Translator() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState<any>("");
  const [sourceLang, setSourceLang] = useState("ko");
  const [targetLang, setTargetLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [mode, setMode] = useState<"text" | "camera">("text");
  const [kContextData, setKContextData] = useState<any>(null);

  const renderOutput = (content: any) => {
    if (!content) return null;
    if (typeof content === 'string') return content;

    // Handle structured menu/list response
    return (
      <div className="space-y-4 text-left w-full">
        {content.title && <h3 className="text-xl font-bold text-indigo-300 mb-4 border-b border-indigo-500/30 pb-2">{content.title}</h3>}

        {/* Render sections if available */}
        {content.sections && Array.isArray(content.sections) && content.sections.map((section: any, idx: number) => (
          <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4 hover:bg-white/10 transition-colors">
            {/* Section Title */}
            {(section.title || section.category) && (
              <h4 className="font-bold text-white mb-3 text-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                {section.title || section.category}
              </h4>
            )}

            {/* Items List */}
            <ul className="space-y-3">
              {section.items && Array.isArray(section.items) && section.items.map((item: any, i: number) => (
                <li key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-200 font-medium text-base">{item.name || item.text}</span>
                    {/* Korean name fallback if available */}
                    {item.korean_name && <span className="text-xs text-slate-500 font-light">{item.korean_name}</span>}
                    {/* Description/Ingredients */}
                    {item.description && <span className="text-xs text-indigo-200/70 italic mt-0.5">{item.description}</span>}
                  </div>
                  {item.price && <span className="text-emerald-400 font-bold font-mono ml-0 sm:ml-4 mt-1 sm:mt-0 shrink-0">{item.price}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {content.notes && (
          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 text-sm text-yellow-200/80 italic flex gap-2">
            <span>📝</span>
            <span>{content.notes}</span>
          </div>
        )}
      </div>
    );
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setKContextData(null);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          sourceLang,
          targetLang
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();

      if (data.error) {
        setOutputText(data.error);
      } else {
        setOutputText(data.natural_translation);
        setKContextData(data);
      }
    } catch (error) {
      console.error("Translation error:", error);
      setOutputText("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    setIsProcessingImage(true);
    setKContextData(null);
    setOutputText("");

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64String = reader.result as string;
        // Remove "data:image/jpeg;base64," prefix
        const base64Content = base64String.split(',')[1];

        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: "", // No text for image translation
              image: base64Content,
              mimeType: file.type,
              sourceLang,
              targetLang
            })
          });

          if (!response.ok) {
            throw new Error('Translation failed');
          }

          const data = await response.json();

          if (data.error) {
            setOutputText(data.error);
          } else {
            setOutputText(data.natural_translation);
            setKContextData(data);
          }
        } catch (error) {
          console.error("Translation error:", error);
          setOutputText("Translation failed. Please try again.");
        } finally {
          setIsProcessingImage(false);
        }
      };

      reader.onerror = (error) => {
        console.error("File reading error:", error);
        alert("Failed to read image file.");
        setIsProcessingImage(false);
      };

    } catch (error) {
      console.error("Image processing error:", error);
      alert("Failed to process image. Please try again.");
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-8 relative z-10">

        {/* Header - Seoul Night Style */}
        <header className="text-center space-y-2 mb-12">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              K-Context
            </span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-light tracking-wide">
            Understand the <span className="font-semibold text-purple-300">nuance</span> behind the Korean.
          </p>
        </header>

        {/* Main Glass Card */}
        <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Controls Header */}
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between bg-white/5">
            {/* Mode Toggle */}
            <div className="flex bg-black/40 p-1 rounded-full border border-white/5">
              <button
                onClick={() => setMode("text")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mode === "text"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span>Text</span>
                </div>
              </button>
              <button
                onClick={() => setMode("camera")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mode === "camera"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span>Camera</span>
                </div>
              </button>
            </div>

            {/* Language Selection */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:w-40 relative">
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code} className="bg-slate-900">{name}</option>
                  ))}
                </select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                onClick={() => {
                  const temp = sourceLang;
                  setSourceLang(targetLang);
                  setTargetLang(temp);
                }}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1 md:w-40 relative">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code} className="bg-slate-900">{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-[400px]">
            {/* Input Section */}
            <div className="flex flex-col h-full bg-white/[0.02]">
              {mode === "camera" ? (
                <div className="p-6 h-full flex flex-col justify-center">
                  <div className="rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-black/20 relative group hover:border-indigo-500/50 transition-colors">
                    <CameraInput
                      onImageSelect={handleImageSelect}
                      isProcessing={isProcessingImage}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <Textarea
                    placeholder="Enter Korean text here..."
                    className="flex-1 resize-none border-none focus-visible:ring-0 p-8 text-xl md:text-2xl bg-transparent text-white placeholder:text-slate-600 leading-relaxed"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="p-6 flex justify-between items-center border-t border-white/5 bg-black/20">
                    <span className="text-xs text-slate-500 font-mono">{inputText.length} chars</span>
                    <Button
                      onClick={() => setInputText('')}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-500 hover:text-white hover:bg-white/5"
                      disabled={!inputText}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full bg-black/20 relative">
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {outputText ? (
                  <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                        Translation
                      </h3>
                      <div className="text-xl md:text-2xl text-white font-medium leading-relaxed">
                        {renderOutput(outputText)}
                      </div>
                    </div>

                    {kContextData && (
                      <div className="space-y-6 pt-2">
                        {/* Politeness Badge */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Politeness Level</h3>
                          <p className="text-slate-200">{kContextData.politeness_level}</p>
                        </div>

                        {/* Foreigner Context - NEW */}
                        {kContextData.practical_tips && (
                          <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-2">
                              💡 Foreigner Context
                            </h3>
                            <p className="text-indigo-100/90 leading-relaxed text-sm">
                              {kContextData.practical_tips}
                            </p>
                          </div>
                        )}

                        {/* Context & Nuance */}
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-2">Context Clue</h3>
                          <p className="text-slate-300 italic leading-relaxed border-l-2 border-pink-500/30 pl-4">
                            "{kContextData.context_clue}"
                          </p>
                        </div>

                        {/* Word Breakdown */}
                        {kContextData.word_breakdown && kContextData.word_breakdown.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">Word Breakdown</h3>
                            <div className="grid gap-2">
                              {kContextData.word_breakdown.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors">
                                  <span className="font-semibold text-white">{item.word}</span>
                                  <div className="h-px bg-white/10 flex-1 mx-4 group-hover:bg-white/20 transition-colors"></div>
                                  <span className="text-slate-400 group-hover:text-slate-300">{item.meaning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Safety Score */}
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">Safety Score</h3>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${kContextData.safe_score >= 8 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                  kContextData.safe_score >= 5 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                                    'bg-gradient-to-r from-red-600 to-red-500'
                                  }`}
                                style={{ width: `${kContextData.safe_score * 10}%` }}
                              />
                            </div>
                            <span className={`text-lg font-bold ${kContextData.safe_score >= 8 ? 'text-emerald-400' :
                              kContextData.safe_score >= 5 ? 'text-orange-400' :
                                'text-red-400'
                              }`}>
                              {kContextData.safe_score}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-light tracking-wide">Enter text or scan image</p>
                  </div>
                )}
              </div>

              {/* Translate Action Area */}
              <div className="p-6 border-t border-white/10 bg-black/40">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleTranslate}
                  disabled={isTranslating || !inputText.trim()}
                >
                  {isTranslating ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Translating...</span>
                    </div>
                  ) : (
                    "Translate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-slate-500 text-sm font-light">
          <p>Powered by Google Gemini 2.5 Flash</p>
        </footer>
      </div>
    </div>
  );
}
