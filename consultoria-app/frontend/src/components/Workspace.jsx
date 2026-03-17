import { useState, useEffect } from 'react';

export default function Workspace({ socket, roomId }) {
  const [state, setState] = useState({
    width: 1.5,
    height: 2.0,
    profile: 'Natural',
    glass: 'Templado',
    mirror: 'Ninguno',
    notes: ''
  });

  useEffect(() => {
    if (!socket) return;
    
    const handleStateUpdate = (payload) => {
      setState(prev => ({ ...prev, [payload.key]: payload.value }));
    };

    socket.on('state-updated', handleStateUpdate);

    return () => socket.off('state-updated', handleStateUpdate);
  }, [socket]);

  const handleChange = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
    if (socket && roomId) {
      socket.emit('update-state', { roomId, key, value });
    }
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-y-auto">
      <h2 className="text-xl font-bold font-['Outfit'] text-accent mb-6 flex items-center gap-2">
        <i className="fas fa-tools"></i> Especificaciones
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Ancho (m)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-control" 
            value={state.width} 
            onChange={e => handleChange('width', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Alto (m)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-control" 
            value={state.height} 
            onChange={e => handleChange('height', e.target.value)} 
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Perfil de Aluminio</label>
        <select className="form-control" value={state.profile} onChange={e => handleChange('profile', e.target.value)}>
          <option value="Natural">Natural (Plata)</option>
          <option value="Negro">Negro Intenso</option>
          <option value="Madera">Acabado Madera</option>
          <option value="Blanco">Blanco</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Tipo de Vidrio</label>
        <select className="form-control" value={state.glass} onChange={e => handleChange('glass', e.target.value)}>
          <option value="Templado">Templado de Seguridad</option>
          <option value="Laminado">Laminado Acústico</option>
          <option value="Flotado">Flotado Crudo</option>
          <option value="Esmerilado">Esmerilado/Sandblasting</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Opciones de Espejo</label>
        <select className="form-control" value={state.mirror} onChange={e => handleChange('mirror', e.target.value)}>
          <option value="Ninguno">Ninguno</option>
          <option value="Biselado">Biselado</option>
          <option value="LED">Con Luz LED Integrada</option>
          <option value="Flotado">Flotado Simple</option>
          <option value="Mosaico">Mosaico</option>
        </select>
      </div>

      <div className="flex-grow flex flex-col mt-auto">
        <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Notas de Consulta</label>
        <textarea 
          className="form-control flex-grow resize-none min-h-[120px]" 
          placeholder="Observaciones adicionales, detalles del cliente..."
          value={state.notes}
          onChange={e => handleChange('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
