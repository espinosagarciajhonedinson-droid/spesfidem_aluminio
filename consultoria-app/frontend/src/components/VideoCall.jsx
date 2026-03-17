import useWebRTC from '../hooks/useWebRTC';
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

export default function VideoCall({ socket, roomId, isInitiator }) {
  const { localStream, remoteStream, toggleCamera, toggleMic, cameraActive, micActive } = useWebRTC(socket, roomId, isInitiator);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Remote Video (Client/Avisor Full Size) */}
      <div className="relative glass-card flex-grow flex items-center justify-center overflow-hidden bg-black/50">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-text-muted">
            <i className="fas fa-spinner fa-spin text-3xl mb-3 text-accent"></i>
            <p>Esperando conexión del otro lado...</p>
          </div>
        )}
        
        {/* Local Video Picture-in-Picture */}
        <div className="absolute bottom-4 right-4 w-32 h-44 bg-slate-800 border-2 border-accent/50 rounded-lg overflow-hidden shadow-2xl">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform -scale-x-100"
          />
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 bg-slate-900/80 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">
          <button 
            onClick={toggleMic}
            className={`p-3 rounded-full transition-all ${micActive ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80 hover:bg-red-500'}`}
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button 
            onClick={toggleCamera}
            className={`p-3 rounded-full transition-all ${cameraActive ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80 hover:bg-red-500'}`}
          >
            {cameraActive ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
