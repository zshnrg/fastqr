'use client'

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

import jsQR from 'jsqr';

import { Button } from "@/components/ui/button";
import { 
  SwitchCamera,
  CircleHelp,
  LoaderCircle,
  ClipboardCopy,
  CircleX
 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

function isLink(text) {
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/;
  return urlRegex.test(text);
}

export default function Scanner() {
  const [hasPermission, setHasPermission] = useState(false);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [countDown, setCountDown] = useState(5);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const router = useRouter()

  useEffect(() => {
    const getDevices = async () => {
      try {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => console.log('Media stream:', stream))
          .catch(error => console.error('Error accessing media devices:', error));

        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('All Available Devices:', devices)
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setDevices(videoDevices);

        console.log('Devices:', videoDevices);

        if (videoDevices.length === 0) {
          console.error("No video devices found.");
          router.push("/unavailable")
        }

        // If on a mobile device, use the back camera by default
        if (navigator.userAgent.includes("Mobile")) {
          setCurrentDevice(videoDevices[videoDevices.length - 1].deviceId);
          return;
        }
        setCurrentDevice(videoDevices[0].deviceId);
      } catch (err) {
        console.error("Device enumeration error:", err);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    let stream;
  
    const startCamera = async () => {
      try {
        console.log('Starting camera:', currentDevice);
        if (videoRef.current && videoRef.current.srcObject) {
          // Stop the existing stream
          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
  
        // Get the new stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: currentDevice },
        });
  
        setHasPermission(true);
  
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
  
          // Ensure play is called only after the stream is attached
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };
  
    if (currentDevice) {
      startCamera();
    }
  
    // Cleanup on component unmount or when currentDevice changes
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentDevice]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Check if the source width is 0.
        // This happens when the camera is not ready yet.
        if (canvas.width === 0) {
          return;
        }

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data !== qrData) {
          setQrData(code.data);
          setIsDrawerOpen(true);
          toast.success("QR Code scanned successfully!");
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [qrData]);

  useEffect(() => {
    let countdownTimer;
    if (isDrawerOpen && isLink(qrData)) {
      countdownTimer = setInterval(() => {
        setCountDown((prev) => {
          if (prev === 1) {
            clearInterval(countdownTimer);
            // Redirect to the link
            window.location.href = qrData;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountDown(5); // Reset countdown when drawer is closed
    }

    return () => clearInterval(countdownTimer);
  }, [isDrawerOpen, qrData]);


  const switchCamera = () => {
    const currentIndex = devices.findIndex((device) => device.deviceId === currentDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    console.log('Switching camera to:', devices[nextIndex].deviceId);
    setCurrentDevice(devices[nextIndex].deviceId)
  };

  return (
    <Dialog>

      <div id="container" className="w-screen h-svh flex flex-col relative">
        <div id="scanner" className="w-full h-full bg-black">
          {/* Loading */}
          {!hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Color white */}
              <LoaderCircle className="animate-spin text-white" size="64" />
            </div>
          )}

          {/* Camera */}
          <video ref={videoRef} className="w-full h-full object-cover" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        {/* Hovering controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center bg-white p-3 rounded-2xl shadow-md gap-2">
          <Button onClick={switchCamera} className="w-full rounded-xl">
            <SwitchCamera />
            Switch Camera
          </Button>
          <DialogTrigger asChild>
            <Button className="rounded-xl" variant="secondary">
              <CircleHelp />
            </Button>
          </DialogTrigger>
        </div>

        {/* Drawer */}
        {/* Dark blur background */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black opacity-75" hidden={!isDrawerOpen}></div>
        {/* Drawer content */}

        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-md" hidden={!isDrawerOpen}>
          <div id='drawer' className="flex flex-col gap-4 p-4">
            <div id='header' className="flex items-center justify-between">
              <h2 className="text-lg font-bold">QR Code Successfully Scanned</h2>
              <Button onClick={() => setIsDrawerOpen(false)} className="rounded-xl" variant="secondary">
                <CircleX />
              </Button>
            </div>
            <div id='content' className="flex flex-col items-center gap-2">
              <div className="flex items-start gap-2">
                <p className='py-2 px-4 bg-gray-100 rounded-xl text-sm font-mono max-h-48 overflow-auto'>
                  {qrData}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => {
                      navigator.clipboard.writeText(qrData);
                      toast.success('Copied to clipboard!');
                    }} className="rounded-xl" variant="secondary">
                      <ClipboardCopy />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>
              </div>

              {isLink(qrData) && (
                <label className="text-sm text-primary cursor-pointer">
                  This QR code is a link. You will be redirected to the link in {countDown} seconds.
                </label>
              )}
            </div>
          </div>
          <div id='footer' className="flex items-center justify-center gap-2 rounded-xl p-2 bg-gray-100 text-sm text-gray-600">
            <div>
              Made by <a href="www.github.com/zshnrg" target="_blank" className="text-primary">zshnrg</a>
            </div>
            <div>
              © 2024
            </div>
          </div>
        </div>
      </div>

      {/* Help dialog */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
          <DialogDescription>
            Need help? Here are some tips to get you started.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className='p-4 bg-gray-100 rounded-xl'>
            <h3 className="text-md font-bold text-gray-800">How to use the QR scanner?</h3>
            <p className="text-sm">
              Simply hover your camera over a QR code and it will be scanned automatically.
            </p>
          </div>
          <div className='p-4 bg-gray-100 rounded-xl'>
            <h3 className="text-md font-bold text-gray-800">What if the QR code is a link?</h3>
            <p className="text-sm">
              If the QR code is a link, you will be redirected to the link automatically.
            </p>
          </div>
          <div className='p-4 bg-gray-100 rounded-xl'>
            <h3 className="text-md font-bold text-gray-800">How to switch cameras?</h3>
            <p className="text-sm">
              Click the switch camera button to switch between available cameras.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
