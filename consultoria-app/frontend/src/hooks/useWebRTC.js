import { useEffect, useRef, useState } from 'react';

export default function useWebRTC(socket, roomId, isInitiator) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const peerConnection = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { target: roomId, candidate: event.candidate });
          }
        };

        // If initiator (advisor), create the offer
        if (isInitiator) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit('offer', { target: roomId, sdp: offer });
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    startCall();

    socket.on('offer', async (payload) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { target: roomId, sdp: answer });
    });

    socket.on('answer', async (payload) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    socket.on('ice-candidate', async (payload) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [socket, roomId, isInitiator]);

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  return { localStream, remoteStream, toggleCamera, toggleMic, cameraActive, micActive };
}
