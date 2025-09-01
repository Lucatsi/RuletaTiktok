import React, { useState, useEffect } from 'react';

// Opciones de la ruleta con mejores premios (exactamente como en la imagen)
const ROULETTE_OPTIONS = [
  { label: '� FUEGO', color: '#ff6b6b', textColor: '#ffffff', probability: 0.15, rarity: 'common' },
  { label: '💎 DIAMANTE', color: '#ff9ff3', textColor: '#ffffff', probability: 0.05, rarity: 'legendary' },
  { label: '⭐ ESTRELLA', color: '#48dbfb', textColor: '#ffffff', probability: 0.12, rarity: 'rare' },
  { label: '🎁 REGALO', color: '#ff6348', textColor: '#ffffff', probability: 0.15, rarity: 'uncommon' },
  { label: '🎵 MÚSICA', color: '#5f27cd', textColor: '#ffffff', probability: 0.15, rarity: 'common' },
  { label: '� BONUS', color: '#00d2d3', textColor: '#ffffff', probability: 0.15, rarity: 'uncommon' },
  { label: '� TEATRO', color: '#54a0ff', textColor: '#ffffff', probability: 0.15, rarity: 'common' },
  { label: '🏆 TROFEO', color: '#feca57', textColor: '#ffffff', probability: 0.08, rarity: 'epic' }
];

// Utilidad simple para asignar un emoji a un regalo
const giftEmoji = (giftName = '') => {
  const map = {
    Rosa: '🌹', León: '🦁', Diamante: '💎', Corona: '👑', Guitarra: '🎸', Cohete: '🚀', Corazón: '💖', Estrella: '⭐'
  };
  return map[giftName] || '🎁';
};

export default function Ruleta() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [tempOptions, setTempOptions] = useState([...ROULETTE_OPTIONS]);
  const [rouletteOptions, setRouletteOptions] = useState([...ROULETTE_OPTIONS]);
  const [showWinner, setShowWinner] = useState(false);
  const [donations, setDonations] = useState([
    { id: 1, user: 'streamer123', gift: 'Rosa', count: 5, coins: 250, avatar: '🌹', timestamp: Date.now() - 5000 },
    { id: 2, user: 'gamer456', gift: 'Diamante', count: 1, coins: 500, avatar: '💎', timestamp: Date.now() - 15000 },
    { id: 3, user: 'viewer789', gift: 'Corazón', count: 3, coins: 150, avatar: '💖', timestamp: Date.now() - 30000 }
  ]);
  const [stats, setStats] = useState({ totalSpins: 42, totalGifts: 156, totalCoins: 12450, viewers: 1234 });
  const [isConnected, setIsConnected] = useState(true);
  const [particles, setParticles] = useState([]);

  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    // Calcular rotación aleatoria (múltiples vueltas + ángulo final)
    const spins = 5 + Math.random() * 5; // Entre 5 y 10 vueltas
    const finalAngle = Math.random() * 360; // Ángulo final aleatorio
    const totalRotation = rotation + (spins * 360) + finalAngle;
    
    setRotation(totalRotation);

    // Stats
    setStats((p) => ({ ...p, totalSpins: p.totalSpins + 1 }));

    // Partículas decorativas
    createParticles();

    setTimeout(() => {
      // Calcular en qué posición se detuvo la ruleta
      const normalizedRotation = totalRotation % 360;
      const optionAngle = 360 / rouletteOptions.length;
      
      // La flecha apunta hacia arriba (0°), calculamos desde esa posición
      // Como la ruleta gira en sentido horario, invertimos el cálculo
      let adjustedRotation = (360 - normalizedRotation) % 360;
      
      // Ajustar por el punto de inicio de cada segmento (centro del segmento)
      adjustedRotation = (adjustedRotation + (optionAngle / 2)) % 360;
      
      const selectedIndex = Math.floor(adjustedRotation / optionAngle);
      
      // Asegurar que el índice esté dentro del rango
      const winnerIndex = selectedIndex >= rouletteOptions.length ? 0 : selectedIndex;
      const selectedOption = rouletteOptions[winnerIndex];

      console.log('Rotación total:', totalRotation);
      console.log('Rotación normalizada:', normalizedRotation);
      console.log('Rotación ajustada:', adjustedRotation);
      console.log('Índice seleccionado:', winnerIndex);
      console.log('Elemento ganador:', selectedOption.label);

      setWinner(selectedOption);
      setShowWinner(true);
      setIsSpinning(false);
      
      // Ocultar ganador después de 5 segundos
      setTimeout(() => {
        setShowWinner(false);
        setTimeout(() => setWinner(null), 500); // Esperar a que termine la animación
      }, 5000);
    }, 4000);
  };

  // Función para resetear estadísticas
  const resetStats = () => {
    setStats({ totalSpins: 0, totalGifts: 0, totalCoins: 0, viewers: 0 });
    setRotation(0);
    setWinner(null);
    setShowWinner(false);
    setDonations([]);
    setParticles([]);
  };

  // Funciones para manejar la configuración
  const openConfig = () => {
    setTempOptions([...rouletteOptions]);
    setShowConfig(true);
  };

  const closeConfig = () => {
    setShowConfig(false);
  };

  const saveConfig = () => {
    setRouletteOptions([...tempOptions]);
    setShowConfig(false);
  };

  const addOption = () => {
    const newOption = {
      label: 'NUEVO',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      textColor: '#ffffff',
      emoji: '🎁',
      probability: 1 / (tempOptions.length + 1)
    };
    setTempOptions([...tempOptions, newOption]);
  };

  const removeOption = (index) => {
    if (tempOptions.length > 2) {
      const newOptions = tempOptions.filter((_, i) => i !== index);
      setTempOptions(newOptions);
    }
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...tempOptions];
    newOptions[index][field] = value;
    setTempOptions(newOptions);
  };

  const createParticles = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      emoji: ['🎉', '⭐', '💫', '🎊'][Math.floor(Math.random() * 4)]
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3000);
  };

  const formatTime = (timestamp) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Fondo animado */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          width: '288px',
          height: '288px',
          background: '#8b5cf6',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'pulse 3s infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '128px',
          right: '80px',
          width: '384px',
          height: '384px',
          background: '#3b82f6',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'pulse 3s infinite 1s'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '128px',
          width: '320px',
          height: '320px',
          background: '#ec4899',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'pulse 3s infinite 2s'
        }}></div>
      </div>

      {/* Partículas de celebración */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            fontSize: '32px',
            pointerEvents: 'none',
            zIndex: 50,
            animation: 'bounce 3s ease-out forwards'
          }}
        >
          {particle.emoji}
        </div>
      ))}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Panel principal de la ruleta */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          position: 'relative'
        }}>
          {/* Header con estado */}
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            right: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '9999px',
                background: isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${isConnected ? '#22c55e' : '#ef4444'}`
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  marginRight: '8px',
                  background: isConnected ? '#22c55e' : '#ef4444',
                  animation: isConnected ? 'pulse 2s infinite' : 'none'
                }}></div>
                <span style={{ color: 'white', fontWeight: '500' }}>
                  {isConnected ? '🔴 EN VIVO' : 'DESCONECTADO'}
                </span>
              </div>
              <div style={{
                color: 'white',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px 16px',
                borderRadius: '9999px',
                backdropFilter: 'blur(8px)'
              }}>
                👥 {stats.viewers.toLocaleString()} viewers
              </div>
            </div>
            <div style={{
              color: 'white',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '8px 16px',
              borderRadius: '9999px',
              backdropFilter: 'blur(8px)'
            }}>
              <span style={{ color: '#fbbf24' }}>💰</span> {stats.totalCoins.toLocaleString()} coins
            </div>
          </div>

          {/* Título épico */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            transform: 'scale(1)',
            transition: 'transform 0.3s ease'
          }}>
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fbbf24, #ef4444, #ec4899)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              animation: 'pulse 2s infinite'
            }}>
              🎰 RULETA ÉPICA
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#d1d5db' }}>¡Los regalos giran la suerte!</p>
          </div>

          {/* Ruleta principal */}
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            {/* Base de la ruleta */}
            <div style={{ position: 'relative' }}>
              {/* Soporte/Base */}
              <div style={{
                position: 'absolute',
                bottom: '-64px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '160px',
                height: '80px',
                background: 'linear-gradient(to bottom, #ef4444, #dc2626, #991b1b)',
                borderRadius: '0 0 50% 50%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                borderTop: '4px solid #f87171'
              }}></div>
              
              {/* Aro exterior con luces LED */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'relative',
                  width: '400px',
                  height: '400px',
                  borderRadius: '50%',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  padding: '8px',
                  background: 'conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)',
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}>
                  {/* Luces LED animadas alrededor */}
                  {Array.from({ length: 32 }, (_, i) => {
                    const angle = (360 / 32) * i;
                    const x = 50 + 47 * Math.cos((angle - 90) * Math.PI / 180);
                    const y = 50 + 47 * Math.sin((angle - 90) * Math.PI / 180);
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isSpinning ? '#fde047' : '#facc15',
                          boxShadow: isSpinning 
                            ? '0 0 12px #fde047, 0 0 24px #fde047, 0 0 36px #fde047' 
                            : '0 0 8px #fde047',
                          animation: isSpinning ? `ping 0.3s infinite ${i * 50}ms` : 'none'
                        }}
                      />
                    );
                  })}

                  {/* Ruleta interior */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '4px solid rgba(255, 255, 255, 0.5)'
                  }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 400">
                      {rouletteOptions.map((option, index) => {
                        const angle = 360 / rouletteOptions.length;
                        const startAngle = index * angle;
                        const endAngle = (index + 1) * angle;
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
                        const radius = 185;
                        const x1 = 200 + radius * Math.cos(startRad);
                        const y1 = 200 + radius * Math.sin(startRad);
                        const x2 = 200 + radius * Math.cos(endRad);
                        const y2 = 200 + radius * Math.sin(endRad);
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = [
                          `M 200 200`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          `Z`
                        ].join(' ');
                        const textAngle = startAngle + angle / 2;
                        const textRad = (textAngle - 90) * Math.PI / 180;
                        const textRadius = 130;
                        const textX = 200 + textRadius * Math.cos(textRad);
                        const textY = 200 + textRadius * Math.sin(textRad);
                        
                        return (
                          <g key={index}>
                            <defs>
                              <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={option.color} />
                                <stop offset="100%" stopColor={option.color} stopOpacity="0.8" />
                              </linearGradient>
                            </defs>
                            <path 
                              d={pathData} 
                              fill={`url(#gradient-${index})`} 
                              stroke="#ffffff" 
                              strokeWidth="2"
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                            />
                            <text 
                              x={textX} 
                              y={textY} 
                              textAnchor="middle" 
                              dominantBaseline="middle" 
                              fill="white" 
                              fontSize="12" 
                              fontWeight="bold" 
                              transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                            >
                              {option.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* Centro */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fde047, #facc15, #eab308)',
                      border: '4px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 10
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fef3c7, #fde047)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fef9e7'
                      }}>
                        {isSpinning ? '🌀' : '⚡'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Puntero */}
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 30
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderLeft: '16px solid transparent',
                      borderRight: '16px solid transparent',
                      borderBottom: '32px solid #fbbf24',
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '12px solid transparent',
                      borderRight: '12px solid transparent',
                      borderBottom: '24px solid #fde047'
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '24px',
                      background: 'linear-gradient(135deg, #fde047, #facc15)',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resultado ganador - flotante */}
          {winner && showWinner && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 999,
              animation: showWinner ? 'bounce 0.5s ease-out' : 'fadeOut 0.5s ease-out',
              pointerEvents: 'auto'
            }}>
              <div style={{
                background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #ef4444)',
                color: 'white',
                padding: '32px 48px',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '4px solid #fde047',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center'
              }}>
                {/* Botón de cerrar */}
                <button
                  onClick={() => {
                    setShowWinner(false);
                    setTimeout(() => setWinner(null), 500);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(45deg, rgba(253, 224, 71, 0.2), rgba(251, 146, 60, 0.2))',
                  animation: 'pulse 2s infinite'
                }}></div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    animation: 'pulse 2s infinite'
                  }}>🎉 ¡GANADOR! 🎉</h2>
                  
                  {/* Emoji del elemento ganador */}
                  <div style={{
                    fontSize: '4rem',
                    marginBottom: '12px',
                    animation: 'bounce 1s infinite'
                  }}>
                    {winner.emoji}
                  </div>
                  
                  {/* Nombre del elemento ganador */}
                  <p style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    marginBottom: '8px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {winner.label}
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    opacity: 0.9,
                    textTransform: 'capitalize',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '4px 16px',
                    borderRadius: '9999px',
                    display: 'inline-block'
                  }}>
                    {winner.rarity}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón de giro manual */}
          <button
            onClick={spinRoulette}
            disabled={isSpinning}
            style={{
              padding: '24px 48px',
              borderRadius: '16px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              transform: isSpinning ? 'scale(0.95)' : 'scale(1)',
              background: isSpinning 
                ? '#6b7280' 
                : 'linear-gradient(45deg, #8b5cf6, #ec4899, #ef4444)',
              color: isSpinning ? '#9ca3af' : 'white',
              boxShadow: isSpinning 
                ? 'none' 
                : '0 10px 30px rgba(147, 51, 234, 0.4), 0 0 20px rgba(147, 51, 234, 0.2)',
              ':hover': {
                transform: isSpinning ? 'scale(0.95)' : 'scale(1.05)'
              }
            }}
          >
            {isSpinning ? '🌀 GIRANDO...' : '🎰 GIRAR RULETA'}
          </button>

          {/* Botones de configuración y reseteo - más abajo */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '50%',
            transform: 'translateX(50%)',
            display: 'flex',
            gap: '12px',
            zIndex: 25
          }}>
            {/* Botón de configuración */}
            <button
              onClick={openConfig}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.875rem',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                ':hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              ⚙️ CONFIGURAR
            </button>
            
            {/* Botón de reseteo */}
            <button
              onClick={resetStats}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.875rem',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease',
                ':hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              🔄 RESETEAR
            </button>
          </div>

          {/* Stats rápidas - abajo a la izquierda */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            display: 'flex',
            gap: '16px',
            zIndex: 30
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
              backdropFilter: 'blur(16px)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>{stats.totalSpins}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>GIROS</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(5, 150, 105, 0.3))',
              backdropFilter: 'blur(16px)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>{stats.totalGifts}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>REGALOS</div>
            </div>
          </div>
        </div>

        {/* Panel lateral de donaciones */}
        <div style={{
          width: '320px',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(147, 51, 234, 0.2), rgba(0, 0, 0, 0.4))',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(147, 51, 234, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          {/* Header del panel */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(147, 51, 234, 0.3)',
            background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>🎁 Donaciones en Vivo</h3>
            <p style={{
              color: '#c4b5fd',
              fontSize: '0.875rem'
            }}>Los regalos más recientes</p>
          </div>
          
          {/* Lista de donaciones */}
          <div style={{
            flex: 1,
            overflowY: 'auto'
          }}>
            {donations.map((donation, index) => (
              <div
                key={donation.id}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(147, 51, 234, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(147, 51, 234, 0.1)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #ef4444)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    {donation.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        @{donation.user}
                      </h4>
                      <span style={{
                        color: '#c4b5fd',
                        fontSize: '0.75rem'
                      }}>
                        {formatTime(donation.timestamp)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px'
                    }}>
                      <p style={{
                        color: '#e9d5ff',
                        fontSize: '0.875rem'
                      }}>
                        {donation.count}x {donation.gift}
                      </p>
                      <span style={{
                        color: '#fbbf24',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {donation.coins}💰
                      </span>
                    </div>
                  </div>
                </div>
                {/* Barra de valor */}
                <div style={{
                  marginTop: '12px',
                  height: '8px',
                  background: 'rgba(88, 28, 135, 0.5)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #ef4444)',
                    borderRadius: '9999px',
                    width: `${Math.min((donation.coins / 500) * 100, 100)}%`,
                    transition: 'width 1s ease-out'
                  }} />
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer del panel */}
          <div style={{
            padding: '24px',
            borderTop: '1px solid rgba(147, 51, 234, 0.3)',
            background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                color: '#fbbf24',
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                💰 {stats.totalCoins.toLocaleString()}
              </p>
              <p style={{
                color: '#c4b5fd',
                fontSize: '0.875rem'
              }}>Total de monedas hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configuración */}
      {showConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              🎯 Configurar Ruleta
            </h2>
            
            <div style={{
              display: 'grid',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {tempOptions.map((option, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 80px 40px',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Texto"
                  />
                  <input
                    type="color"
                    value={option.color}
                    onChange={(e) => updateOption(index, 'color', e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={option.emoji}
                    onChange={(e) => updateOption(index, 'emoji', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: 'white',
                      textAlign: 'center',
                      fontSize: '1rem'
                    }}
                    placeholder="🎁"
                  />
                  <button
                    onClick={() => removeOption(index)}
                    disabled={tempOptions.length <= 2}
                    style={{
                      background: tempOptions.length <= 2 ? '#6b7280' : '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px',
                      color: 'white',
                      cursor: tempOptions.length <= 2 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <button
                onClick={addOption}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                ➕ Agregar Opción
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={closeConfig}
                style={{
                  background: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={saveConfig}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-30px,0);
          }
          70% {
            transform: translate3d(0,-15px,0);
          }
          90% {
            transform: translate3d(0,-4px,0);
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}