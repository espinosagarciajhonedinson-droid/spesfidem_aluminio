import React, { useEffect, useState } from 'react';

const DESIGNS = [
  { id: 'd1', title: 'Puerta Baño Corrediza', img: 'https://images.unsplash.com/photo-1600566753086-00f18efc2291?auto=format&fit=crop&q=80&w=400' },
  { id: 'd2', title: 'Ventana Panorámica', img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=400' },
  { id: 'd3', title: 'Espejo LED Flotante', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
  { id: 'd4', title: 'División Oficina', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400' }
];

export default function Gallery({ socket, roomId }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (payload) => {
      if (payload.key === 'selected_design') {
        setSelectedId(payload.value);
      }
    };
    socket.on('state-updated', handleUpdate);
    return () => socket.off('state-updated', handleUpdate);
  }, [socket]);

  const handleSelect = (id) => {
    setSelectedId(id);
    if (socket && roomId) {
      socket.emit('update-state', { roomId, key: 'selected_design', value: id });
    }
  };

  return (
    <div className="glass-card flex flex-col p-6 h-full">
      <h2 className="text-xl font-bold font-['Outfit'] text-accent mb-6 flex items-center gap-2">
        <i className="fas fa-images"></i> Diseños de Referencia
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
        {DESIGNS.map(design => (
          <div 
            key={design.id}
            onClick={() => handleSelect(design.id)}
            className={`relative aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
              selectedId === design.id 
                ? 'border-success shadow-[0_0_20px_rgba(16,185,129,0.3)] transform scale-[1.02]' 
                : 'border-transparent hover:border-accent/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]'
            }`}
          >
            <img src={design.img} alt={design.title} className="w-full h-full object-cover" />
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
              <h3 className="text-white text-xs font-bold leading-tight">{design.title}</h3>
            </div>
            
            {selectedId === design.id && (
              <div className="absolute top-2 right-2 bg-success text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                <i className="fas fa-check text-xs"></i>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
