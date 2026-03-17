import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import VideoCall from './components/VideoCall';
import Workspace from './components/Workspace';
import Visualizer from './components/Visualizer';
import Gallery from './components/Gallery';

// Conectar al backend WebSocket (usamos localhost asumiendo desarrollo, o la IP local)
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : `http://${window.location.hostname}:3001`;

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    setRoomId(newRoomId);
    setIsInitiator(true);
    socket.emit('join-room', newRoomId, () => {
      setJoined(true);
    });
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    
    setRoomId(inputRoomId);
    setIsInitiator(false);
    socket.emit('join-room', inputRoomId, () => {
      setJoined(true);
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    alert('Enlace copiado al portapapeles');
  };

  // Check URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && socket && !joined) {
      setInputRoomId(roomFromUrl);
      // Auto join logic if desired, or let them click join.
    }
  }, [socket, joined]);

  if (!joined) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <img src="/logo.png" alt="Spesfidem" className="h-12 mx-auto mb-6 opacity-80" onError={(e) => e.target.style.display='none'} />
          <h1 className="text-3xl font-bold font-['Outfit'] mb-2 text-white">Consultoría Visual</h1>
          <p className="text-text-muted mb-8 text-sm">Plataforma compartida en tiempo real</p>
          
          <button 
            onClick={createRoom}
            className="w-full bg-accent hover:bg-sky-400 text-slate-900 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] mb-6"
          >
            <i className="fas fa-plus-circle mr-2"></i> Crear Nueva Sesión (Asesor)
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-text-muted font-semibold uppercase tracking-widest">O</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          
          <form onSubmit={joinRoom} className="flex gap-2">
            <input 
              type="text" 
              placeholder="ID de la Sala"
              value={inputRoomId}
              onChange={e => setInputRoomId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 focus:border-accent rounded-xl px-4 text-white outline-none transition-colors"
            />
            <button 
              type="submit"
              disabled={!inputRoomId.trim()}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Unirse
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-deep text-text-main p-4 gap-4 overflow-hidden">
      {/* Top Header */}
      <header className="glass-card flex items-center justify-between px-6 py-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <i className="fas fa-video text-accent"></i>
          </div>
          <div>
            <h1 className="font-['Outfit'] font-bold text-lg leading-tight tracking-wide">Consultoría Spesfidem</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs text-text-muted font-medium">Sincronización Activa</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm font-mono tracking-wider flex items-center gap-2">
            <span className="text-text-muted">SALA:</span> 
            <span className="text-accent font-bold">{roomId}</span>
          </div>
          <button 
            onClick={copyLink}
            className="bg-accent/10 hover:bg-accent/20 text-accent p-2 rounded-full transition-colors border border-accent/20"
            title="Copiar Enlace"
          >
            <i className="fas fa-link"></i>
          </button>
        </div>
      </header>

      {/* Main Grid Work Area */}
      <main className="flex-1 grid grid-cols-12 gap-4 h-full min-h-0">
        
        {/* Left Col: Video & Visualizer */}
        <div className="col-span-4 flex flex-col gap-4 h-full min-h-0">
          <div className="flex-1 min-h-0 border border-white/10 rounded-2xl overflow-hidden glass-card">
            <VideoCall socket={socket} roomId={roomId} isInitiator={isInitiator} />
          </div>
          <div className="h-[40%] shrink-0">
            <Visualizer socket={socket} roomId={roomId} />
          </div>
        </div>

        {/* Middle Col: Params Workspace */}
        <div className="col-span-4 h-full min-h-0">
          <Workspace socket={socket} roomId={roomId} />
        </div>

        {/* Right Col: Gallery */}
        <div className="col-span-4 h-full min-h-0">
          <Gallery socket={socket} roomId={roomId} />
        </div>

      </main>
    </div>
  );
}

export default App;
