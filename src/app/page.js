'use client'

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Webcam = dynamic(() => import('react-webcam'), { ssr: false });
import jsQR from 'jsqr';

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { 
  SwitchCamera,
  CircleHelp,
 } from "lucide-react";

export default function Scanner() {
  const [hasPermission, setHasPermission] = useState(false);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const cameraRef = useRef(null);
  const drawerTriggerRef = useRef(null);

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
    }, 100);

    if (!isScanning){
      clearInterval(timer);
    }

  }, [isScanning]);

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
          setIsScanning(false);

          // Pause camera
          cameraRef.current.video.pause();
          if (drawerTriggerRef.current) {
            drawerTriggerRef.current.click();
          }
        }
      };
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <Drawer shouldScaleBackground>
      <div id="container" className="w-screen h-screen flex flex-col relative">
        <div id="scanner" className="w-full h-full">
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
          <DrawerTrigger ref={drawerTriggerRef}/>
        </div>
      </div>
      
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose>
            <Button  className="hidden" ref={drawerTriggerRef}></Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
