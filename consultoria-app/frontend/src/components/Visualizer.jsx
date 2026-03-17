import React, { useEffect, useState } from 'react';

export default function Visualizer({ socket, roomId }) {
  const [specs, setSpecs] = useState({
    width: 1.5,
    height: 2.0,
    glass: 'Templado',
    profile: 'Natural'
  });

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (payload) => {
      setSpecs(prev => ({ ...prev, [payload.key]: payload.value }));
    };
    socket.on('state-updated', handleUpdate);
    return () => socket.off('state-updated', handleUpdate);
  }, [socket]);

  // Determine dynamic aspect ratio for the visualizer box
  const boxWidth = Math.min(200, Math.max(100, specs.width * 100));
  const boxHeight = Math.min(300, Math.max(150, specs.height * 100));

  const profileColors = {
    'Natural': 'border-slate-300',
    'Negro': 'border-slate-800',
    'Madera': 'border-amber-700',
    'Blanco': 'border-slate-100'
  };

  return (
    <div className="glass-card flex flex-col h-full bg-slate-900/60 p-6 relative">
      <h2 className="text-xl font-bold font-['Outfit'] text-accent mb-6 flex items-center gap-2">
        <i className="fas fa-drafting-compass"></i> Esquema Dinámico
      </h2>
      
      <div className="flex-grow flex items-center justify-center relative bg-black/30 rounded-xl overflow-hidden p-8 border border-white/5">
        
        {/* The Graphic Representation */}
        <div 
          className={`relative flex items-center justify-center transition-all duration-500 border-[6px] rounded-sm bg-accent/10 shadow-[inset_0_0_20px_rgba(56,189,248,0.15)] ${profileColors[specs.profile] || 'border-accent'}`}
          style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
        >
          {/* Internal divisions (mock aesthetics) */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-current opacity-30 transform -translate-x-1/2"></div>
          
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-accent font-bold text-sm whitespace-nowrap">
            {specs.width}m
          </div>
          
          <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-accent font-bold text-sm whitespace-nowrap">
            {specs.height}m
          </div>
          
          <div className="absolute bottom-2 right-2 bg-success/20 text-success text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            {specs.glass}
          </div>
          
          <div className="absolute top-2 left-2 bg-accent/20 text-accent text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            {specs.profile}
          </div>
        </div>
      </div>
    </div>
  );
}
