"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { renerPredictions } from "@/lib/render-prediction";

interface CocoSsdModel {
  detect(
    video: HTMLVideoElement,
    options?: unknown,
    confidenceThreshold?: number
  ): Promise<unknown>;
}

let detectionInterval: NodeJS.Timeout;

const ObjectDetectionPageComponent = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const runObjectDetection = async (net: CocoSsdModel) => {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      // Set canvas dimensions to match video
      const video = webcamRef.current.video;
      canvasRef.current.width = video!.videoWidth;
      canvasRef.current.height = video!.videoHeight;

      // Perform object detection
      const detectedObjects = await net.detect(video!, undefined, 0.6);
      console.log(detectedObjects);

      const context = canvasRef.current.getContext("2d");
      renerPredictions(detectedObjects as never, context as never);
    }
  };

  const runCocoModel = useCallback(async () => {
    setIsLoading(true);
    await tf.setBackend("webgl");
    await tf.ready();
    const net = await cocoSSDLoad();
    setIsLoading(false);

    detectionInterval = setInterval(() => {
      runObjectDetection(net);
    }, 500); // Change to 500ms to reduce re-rendering frequency
  }, []);

  useEffect(() => {
    runCocoModel();

    // Cleanup interval on unmount to prevent memory leaks
    return () => {
      clearInterval(detectionInterval);
    };
  }, [runCocoModel]);

  useEffect(() => {
    const video = webcamRef.current?.video;
    if (video && video.readyState === 4) {
      // Ensure webcam dimensions match the video stream
      video.width = video.videoWidth;
      video.height = video.videoHeight;
    }
  }, [webcamRef.current?.video?.readyState]);

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  return (
    <div className="border">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="relative">
          {/* Webcam */}
          <Webcam
            ref={webcamRef}
            videoConstraints={{ facingMode }}
            className="w-96 h-96 rounded-md"
            muted
          />
          {/* Canvas for detection overlay */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 z-50 w-96 h-96 rounded-md"
          />

          <button
            onClick={toggleCamera}
            className="mt-4 p-2 bg-blue-500 text-white rounded"
          >
            Switch Camera
          </button>
        </div>
      )}
    </div>
  );
};

export default ObjectDetectionPageComponent;
