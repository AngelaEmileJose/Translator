"use client";

import { Camera, Upload, X } from "lucide-react";
import { Button } from "./button";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

interface CameraInputProps {
    onImageSelect: (file: File) => void;
    isProcessing?: boolean;
    className?: string;
}

export function CameraInput({ onImageSelect, isProcessing, className }: CameraInputProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            setStream(mediaStream);
            setIsCameraOpen(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access camera. Please check permissions or use Upload Image instead.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                        setPreview(URL.createObjectURL(file));
                        onImageSelect(file);
                        stopCamera();
                    }
                }, "image/jpeg", 0.95);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(file));
            onImageSelect(file);
        }
    };

    const clearImage = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className={cn("space-y-4", className)}>
            {isCameraOpen ? (
                <div className="space-y-2">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border bg-black"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={capturePhoto}
                            className="flex-1"
                        >
                            Capture
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={stopCamera}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : !preview ? (
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startCamera}
                        disabled={isProcessing}
                        className="flex-1"
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex-1"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-contain rounded-lg border bg-slate-50"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {isProcessing && (
                <div className="text-sm text-center text-muted-foreground">
                    Processing image...
                </div>
            )}
        </div>
    );
}
