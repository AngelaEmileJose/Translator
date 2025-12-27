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
  const [outputText, setOutputText] = useState("");
  const [sourceLang, setSourceLang] = useState("ko");
  const [targetLang, setTargetLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [mode, setMode] = useState<"text" | "camera">("text");
  const [kContextData, setKContextData] = useState<any>(null);

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
    try {
      // Using browser-based Tesseract via CDN
      // @ts-ignore - Tesseract loaded via script tag
      const Tesseract = window.Tesseract;

      const { data: { text } } = await Tesseract.recognize(file, sourceLang === 'ko' ? 'kor' : 'eng', {
        logger: (m: any) => console.log(m)
      });

      setInputText(text);
      setMode("text"); // Switch back to text mode to show extracted text
    } catch (error) {
      console.error("OCR error:", error);
      alert("Failed to extract text from image. Please try again.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Next.js Translator
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Translate text instantly with our premium tool.
          </p>
        </header>

        <Card className="border shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="pb-4 border-b space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2 justify-center">
              <Button
                variant={mode === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("text")}
              >
                <Type className="h-4 w-4 mr-2" />
                Text Input
              </Button>
              <Button
                variant={mode === "camera" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("camera")}
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
            </div>

            {/* Language Selectors */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

              <div className="flex-1 w-full">
                <Select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => {
                  const temp = sourceLang;
                  setSourceLang(targetLang);
                  setTargetLang(temp);
                }}
              >
                <ArrowRightLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </Button>

              <div className="flex-1 w-full">
                <Select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x h-[300px] md:h-[400px]">
              <div className="flex flex-col h-full">
                {mode === "camera" ? (
                  <div className="p-6">
                    <CameraInput
                      onImageSelect={handleImageSelect}
                      isProcessing={isProcessingImage}
                    />
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="Enter text to translate..."
                      className="flex-1 resize-none border-none focus-visible:ring-0 p-6 text-lg bg-transparent"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="p-4 flex justify-between items-center text-sm text-slate-400">
                      <span>{inputText.length} chars</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex-1 p-6 overflow-y-auto">
                  {outputText ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Translation</h3>
                        <p className="text-lg text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                          {outputText}
                        </p>
                      </div>

                      {kContextData && (
                        <>
                          <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Politeness Level</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{kContextData.politeness_level}</p>
                          </div>

                          <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Context Clue</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">{kContextData.context_clue}</p>
                          </div>

                          {kContextData.word_breakdown && kContextData.word_breakdown.length > 0 && (
                            <div className="border-t pt-4">
                              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Word Breakdown</h3>
                              <div className="space-y-2">
                                {kContextData.word_breakdown.map((item: any, idx: number) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.word}</span>
                                    <span className="text-slate-600 dark:text-slate-400"> → {item.meaning}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Safe Score</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${kContextData.safe_score >= 7
                                      ? 'bg-green-500'
                                      : kContextData.safe_score >= 4
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                  style={{ width: `${kContextData.safe_score * 10}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {kContextData.safe_score}/10
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                      Translation will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end">
            <Button
              size="lg"
              className="w-full md:w-auto px-8"
              onClick={handleTranslate}
              disabled={isTranslating || !inputText.trim()}
            >
              {isTranslating ? "Translating..." : "Translate"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
