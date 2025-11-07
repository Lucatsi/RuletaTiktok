import { useState, useEffect } from 'react';
import socketService from '../../services/socketService';

function RouletteOverlay() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isFinalWinner, setIsFinalWinner] = useState(false);
  const [particles, setParticles] = useState([]);
  const [rouletteOptions, setRouletteOptions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Conectar al socket para recibir actualizaciones
  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (!socket.connected) {
      socket.connect();
    }

    // Monitorear estado de conexión
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    setIsConnected(socket.connected);

    // Escuchar eventos de la ruleta
    socket.on('rouletteUpdate', (data) => {
      if (data.rotation !== undefined) setRotation(data.rotation);
      if (data.isSpinning !== undefined) setIsSpinning(data.isSpinning);
      if (data.winner !== undefined) setWinner(data.winner);
      if (data.showWinner !== undefined) setShowWinner(data.showWinner);
      if (data.isFinalWinner !== undefined) setIsFinalWinner(data.isFinalWinner);
      if (data.particles !== undefined) setParticles(data.particles);
      if (data.options !== undefined) setRouletteOptions(data.options);
    });

    socket.on('spinStart', (data) => {
      setIsSpinning(true);
      setShowWinner(false);
      setWinner(null);
      if (data.options !== undefined) setRouletteOptions(data.options);
    });

    socket.on('spinEnd', (data) => {
      if (data.rotation !== undefined) setRotation(data.rotation);
      if (data.winner) {
        setWinner(data.winner);
        setShowWinner(true);
        setIsFinalWinner(data.isFinalWinner || false);
        setTimeout(() => setShowWinner(false), 3000);
      }
      setIsSpinning(false);
    });

    socket.on('optionsUpdate', (data) => {
      if (data.options) setRouletteOptions(data.options);
    });

    return () => {
      socket.off('rouletteUpdate');
      socket.off('spinStart');
      socket.off('spinEnd');
      socket.off('optionsUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const createParticles = () => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random()
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  useEffect(() => {
    if (showWinner && winner) {
      createParticles();
    }
  }, [showWinner, winner]);

  const segmentAngle = rouletteOptions.length > 0 ? 360 / rouletteOptions.length : 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent overflow-hidden">
      {/* Indicador de conexión discreto */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          isConnected 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white animate-pulse'
        }`}>
          {isConnected ? '🔴 VIVO' : '⚠️ DESCONECTADO'}
        </div>
      </div>
      
      {/* Contenedor de la ruleta */}
      <div className="relative w-[600px] h-[600px]">
        {/* Flecha indicadora */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30" style={{ top: '20px' }}>
          <div className="w-0 h-0 border-l-[25px] border-r-[25px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"></div>
        </div>

        {/* Ruleta */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* SVG de la ruleta */}
            <svg
              className="w-full h-full drop-shadow-2xl"
              viewBox="0 0 400 400"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
              }}
            >
              {/* Círculo exterior (borde) */}
              <circle cx="200" cy="200" r="195" fill="#1f2937" stroke="#fbbf24" strokeWidth="6" />
              
              {/* Segmentos */}
              {rouletteOptions.map((option, index) => {
                const startAngle = index * segmentAngle - 90;
                const endAngle = startAngle + segmentAngle;
                const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = 200 + 185 * Math.cos(startRad);
                const y1 = 200 + 185 * Math.sin(startRad);
                const x2 = 200 + 185 * Math.cos(endRad);
                const y2 = 200 + 185 * Math.sin(endRad);

                const pathData = `M 200 200 L ${x1} ${y1} A 185 185 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                const midAngle = startAngle + segmentAngle / 2;
                const textRadius = 120;
                const textX = 200 + textRadius * Math.cos((midAngle * Math.PI) / 180);
                const textY = 200 + textRadius * Math.sin((midAngle * Math.PI) / 180);

                // Obtener el nombre del participante
                const displayName = option.name || option.label || 'Participante';

                return (
                  <g key={option.key || index}>
                    <path d={pathData} fill={option.color} stroke="#1f2937" strokeWidth="2" />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="18"
                      fontWeight="bold"
                      style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        transform: `rotate(${midAngle + 90}deg)`,
                        transformOrigin: `${textX}px ${textY}px`
                      }}
                    >
                      {displayName}
                    </text>
                  </g>
                );
              })}

              {/* Círculo central */}
              <circle cx="200" cy="200" r="40" fill="#fbbf24" stroke="#1f2937" strokeWidth="4" />
              <circle cx="200" cy="200" r="30" fill="#1f2937" />
            </svg>
          </div>
        </div>

        {/* Animación de ganador */}
        {showWinner && winner && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="text-center animate-bounce">
              <div 
                className={`text-6xl font-black px-8 py-4 rounded-2xl shadow-2xl ${
                  isFinalWinner 
                    ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-900' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                }`}
                style={{
                  textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
                  border: '4px solid white'
                }}
              >
                {isFinalWinner ? '🏆 GANADOR FINAL 🏆' : '✨ GANADOR ✨'}
              </div>
              <div className="text-5xl font-bold text-white mt-4 bg-black bg-opacity-70 px-6 py-3 rounded-xl">
                {winner.name || winner.label || winner}
              </div>
            </div>
          </div>
        )}

        {/* Partículas de celebración */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute text-4xl pointer-events-none animate-ping"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          >
            {['🎉', '🎊', '✨', '⭐', '🌟'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Mensaje si no hay opciones */}
      {rouletteOptions.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold bg-black bg-opacity-70 px-8 py-4 rounded-xl">
          Esperando configuración...
        </div>
      )}
    </div>
  );
}

export default RouletteOverlay;
