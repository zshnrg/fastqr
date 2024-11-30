'use client'

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Webcam = dynamic(() => import('react-webcam'), { ssr: false });
import jsQR from 'jsqr';

import { Button } from "@/components/ui/button";
import { 
  SwitchCamera,
  CircleHelp,
  LoaderCircle,
  ClipboardCopy,
  CircleX
 } from "lucide-react";
import { toast } from 'sonner';

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
  const cameraRef = useRef(null);

  useEffect(() => {
    // Detect available media devices
    navigator.mediaDevices.enumerateDevices().then((deviceList) => {
      const videoDevices = deviceList.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setCurrentDevice(videoDevices[0].deviceId); // Set default camera
      }
    });

    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true }).then(() => {
      setHasPermission(true);
    });

    const timer = setInterval(() => {
      handleScan();
      console.log(isDrawerOpen);
    }, 100);

  }, []);


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
    setCurrentDevice(devices[nextIndex].deviceId);
  };

  const handleScan = () => {
    const imageSrc = cameraRef.current.getScreenshot();

    if (imageSrc) {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setQrData(code.data);
          setIsDrawerOpen(true);

          if (!isDrawerOpen) {
            toast.success('QR Code scanned successfully!');
          }
        }
      };
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
      <div id="container" className="w-screen h-svh flex flex-col relative">
        <div id="scanner" className="w-full h-full bg-black">
          {/* Loading */}
          {!hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Color white */}
              <LoaderCircle className="animate-spin text-primary" size="64" />
            </div>
          )}

          {/* Camera */}
          {currentDevice && (
            <Webcam
              videoConstraints={{ deviceId: currentDevice }}
              className="w-full h-full object-cover"
              screenshotFormat="image/jpeg"
              onUserMediaError={handleError}
              audio={false}
              onClick={handleScan}
              ref={cameraRef}
            />
          )}
        </div>

        {/* Hovering controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center bg-white p-3 rounded-2xl shadow-md gap-2">
          <Button onClick={switchCamera} className="w-full rounded-xl">
            <SwitchCamera />
            Switch Camera
          </Button>
          <Button onClick={() => alert('Help clicked!')} className="rounded-xl" variant="secondary">
            <CircleHelp />
          </Button>
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
              <div className="flex items-center gap-2">
                <p className='py-2 px-4 bg-gray-100 rounded-xl text-sm font-mono'>
                  {qrData}
                </p>
                <Button onClick={() => {
                  navigator.clipboard.writeText(qrData);
                  toast.success('Copied to clipboard!');
                }} className="rounded-xl" variant="secondary">
                  <ClipboardCopy />
                </Button>
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
      
  );
}
