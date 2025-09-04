import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import gamesService from '../../services/gamesService';
import TikTokNotification from '../../components/TikTokNotification';
import toast from 'react-hot-toast';

const Disparos = () => {
  const { user } = useAuth();

  // Estado de conexión / notificación
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState(null);

  // Estado del juego
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [damagePerHit, setDamagePerHit] = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [stats, setStats] = useState({ totalShots: 0, totalDamage: 0, totalGifts: 0, viewers: 0, totalCoins: 0 });
  const [gameSession, setGameSession] = useState(null);

  // Avatar que se mueve de lado a lado
  const [avatarX, setAvatarX] = useState(20); // porcentaje
  const [avatarDirection, setAvatarDirection] = useState(1); // 1 -> derecha, -1 -> izquierda

  // Disparo / cañón
  const [readyToFire, setReadyToFire] = useState(true);
  const [recoil, setRecoil] = useState(false);
  const [flash, setFlash] = useState(false);
  const [smoke, setSmoke] = useState(false);
  const [bulletId, setBulletId] = useState(0);
  const shotQueueRef = useRef(0);
  const [explosions, setExplosions] = useState([]);
  const [bulletActive, setBulletActive] = useState(false);
  const avatarXRef = useRef(avatarX);
  useEffect(() => { avatarXRef.current = avatarX; }, [avatarX]);

  // Balas por donación (1 bala por regalo recibido)
  const bulletsMapRef = useRef(new Map()); // key normalizado -> { name, bullets }
  const [bulletTop, setBulletTop] = useState([]); // [{ key, name, bullets }]
  const normalize = (s) => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  const getDisplayName = (payload) => (
    payload?.displayName || payload?.nickname || payload?.username || payload?.user || payload?.uniqueId || 'usuario'
  );
  const rebuildBulletTop = () => {
    const arr = Array.from(bulletsMapRef.current.values())
      .sort((a, b) => (b.bullets || 0) - (a.bullets || 0))
      .slice(0, 15)
      .map(v => ({ key: normalize(v.name), name: v.name, bullets: v.bullets }));
    setBulletTop(arr);
  };

  // Sumar balas manualmente a un donante ya existente
  const addManualBullets = (key, name, amount) => {
    try {
      const safeAmount = Math.max(1, Number(amount) || 1);
      const prev = bulletsMapRef.current.get(key) || { name, bullets: 0 };
      const next = { name: prev.name || name, bullets: (prev.bullets || 0) + safeAmount };
      bulletsMapRef.current.set(key, next);
      rebuildBulletTop();
      toast.success(`Añadidas ${safeAmount} balas a @${name}`);
    } catch {}
  };

  // Ancho de viewport para animaciones en píxeles (evitar mezclar unidades en Framer Motion)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Constantes de layout para alinear bala y avatar
  const AVATAR_TOP = 220; // bajar avatar
  const AVATAR_SIZE = 100;
  const BULLET_SIZE = 8;
  const EXPLOSION_SIZE = 60;
  const BULLET_TRAVEL_MS = 1200;
  const CANNON_CONTAINER_BOTTOM = 150; // <div> contenedor del cañón
  const CANNON_TUBE_BOTTOM = 35; // #cannon
  const CANNON_BOTTOM_FROM_VIEWPORT = CANNON_CONTAINER_BOTTOM + CANNON_TUBE_BOTTOM; // 185px

  // Altura objetivo para que la bala llegue al centro del avatar, relativa al #cannon
  const bulletTargetBottom = Math.max(
    viewportHeight
      ? viewportHeight - (AVATAR_TOP + AVATAR_SIZE / 2 + BULLET_SIZE / 2) - CANNON_BOTTOM_FROM_VIEWPORT
      : 340,
    200 // mínimo para no quedarse corto en pantallas bajas
  );

  // Helpers: storage de configuración por usuario
  const settingsStorageKey = (uid) => `disparos:settings:${uid || 'anon'}`;
  const loadSettings = (uid) => {
    try {
      const raw = localStorage.getItem(settingsStorageKey(uid));
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : null;
    } catch { return null; }
  };
  const saveSettings = (uid, obj) => {
    try { localStorage.setItem(settingsStorageKey(uid), JSON.stringify(obj)); } catch {}
  };

  useEffect(() => {
    if (!user) return; // esperar usuario listo
    (async () => {
      // 1) Cargar settings persistidos
      const persisted = loadSettings(user.id);
      const initialMax = Math.max(1, Number(persisted?.maxHealth ?? 100) || 100);
      const initialDmg = Math.max(1, Number(persisted?.damagePerHit ?? 1) || 1);
      setMaxHealth(initialMax);
      setDamagePerHit(initialDmg);
      setHealth(initialMax);

      // 2) Iniciar sesión de juego con settings actuales
      try {
        const response = await gamesService.startGame('disparos', { maxHealth: initialMax, damagePerHit: initialDmg });
        setGameSession(response.gameSession);
      } catch {}

      // 3) Conectar socket y unirse
      socketService.connect();
      const tiktokUsernameRaw = user.tiktokUsername || user.tiktok_username || '';
      const tiktokUsername = tiktokUsernameRaw ? String(tiktokUsernameRaw).replace(/^@+/, '').trim().toLowerCase() : null;
      socketService.joinGame('disparos', user.id, tiktokUsername);
      setupSocketListeners();
      toast.success('¡Cañón listo!');
    })();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reintento periódico: si no hay conexión de TikTok, volver a emitir join-game cada 10s
  useEffect(() => {
    if (!user) return;
  const tiktokUsernameRaw = user.tiktokUsername || user.tiktok_username || '';
  const tiktokUsername = tiktokUsernameRaw ? String(tiktokUsernameRaw).replace(/^@+/, '').trim().toLowerCase() : null;
    const id = setInterval(() => {
      if (!connected && tiktokUsername) {
        console.log('[Disparos] Reintento join-game...');
        socketService.joinGame('disparos', user.id, tiktokUsername);
      }
    }, 10000);
    return () => clearInterval(id);
  }, [user, connected]);

  const setupSocketListeners = () => {
    socketService.onTikTokConnected((payload) => {
      console.log('[Disparos] tiktok-connected', payload);
      setConnected(true);
      // Cargar viewers iniciales si vienen en el payload
      let v = null;
      if (payload && (payload.viewers ?? payload.viewerCount) != null) {
        v = payload.viewers ?? payload.viewerCount;
      } else if (payload?.status?.roomInfo) {
        const ri = payload.status.roomInfo;
        v = ri.viewer_count ?? ri.viewerCount ?? ri.user_count ?? ri?.data?.userCount ?? payload?.status?.data?.userCount ?? null;
      }
      if (v != null) {
        setStats((s) => ({ ...s, viewers: Number(v) || 0 }));
      }
      toast.success(`Conectado @${payload?.username || (user?.tiktokUsername || user?.tiktok_username) || ''}`);
    });
    socketService.onTikTokDisconnected(() => {
      console.log('[Disparos] tiktok-disconnected');
      setConnected(false);
      toast.error('Desconectado del live');
    });
    socketService.onTikTokError((data) => { console.error('[Disparos] tiktok-error', data); toast.error(data.error || 'Error TikTok'); });
    socketService.onTikTokGift((gift) => {
      console.log('[Disparos] tiktok-gift', gift);
      setConnected(true);
      setNotification(gift);
      setTimeout(() => setNotification(null), 2500);
      // Balas por moneda: sumar 1 bala por cada coin del regalo (siempre >=1)
      const coinsValue = Number(gift?.coinsValue ?? gift?.coins ?? gift?.totalCoins ?? gift?.diamondCount ?? 0) || 0;
      const unit = Number(gift?.diamondCount ?? gift?.coin ?? gift?.coinsPerGift ?? 0) || 0;
      const repeats = Number(gift?.repeatCount ?? gift?.repeat_count ?? gift?.streakCount ?? 1) || 1;
      const coinsTotal = coinsValue > 0 ? coinsValue : (unit * repeats || 0);
      const bulletsToAdd = Math.max(1, coinsTotal);
      try {
        const name = (getDisplayName(gift) || '').toString().replace(/^@+/, '').trim();
        const key = normalize(name);
        if (key) {
          const prev = bulletsMapRef.current.get(key) || { name, bullets: 0 };
          const next = { name: prev.name || name, bullets: (prev.bullets || 0) + bulletsToAdd };
          bulletsMapRef.current.set(key, next);
          rebuildBulletTop();
        }
      } catch {}
      setStats((s) => ({ ...s, totalGifts: s.totalGifts + 1, totalCoins: s.totalCoins + (coinsTotal || bulletsToAdd) }));
    });
    // Likes: también confirman conexión activa
    socketService.onTikTokLike((ev) => {
      console.log('[Disparos] tiktok-like', ev);
      setConnected(true);
    });
    // Viewers en vivo
    socketService.onTikTokViewers((payload) => {
  console.log('[Disparos] tiktok-viewers', payload);
      const v = Number(payload?.viewerCount ?? payload?.viewers ?? 0) || 0;
      setStats((s) => ({ ...s, viewers: v }));
      if (v > 0) setConnected(true);
    });
    // Chat: si dice "disparo" y tiene balas, dispara y consume 1
    socketService.onTikTokChat((msg) => {
  console.log('[Disparos] tiktok-chat', msg);
      setConnected(true);
      const text = (msg?.message || msg?.comment || '').toString();
      const norm = normalize(text).replace(/[^a-z0-9\s@]/g, ' ').replace(/\s+/g, ' ').trim();
      const saysShoot = /\b(disparo|dispara|fuego|shoot)\b/.test(norm);
      if (!saysShoot) return;
      const rawName = (getDisplayName(msg) || '').toString().replace(/^@+/, '').trim();
      const key = normalize(rawName);
      if (!key) return;
      const rec = bulletsMapRef.current.get(key);
      if (!rec || (rec.bullets || 0) <= 0) return;
      // Consumir bala y disparar
      bulletsMapRef.current.set(key, { name: rec.name || rawName, bullets: rec.bullets - 1 });
      rebuildBulletTop();
      toast(`💥 Disparo de @${rawName}`);
      enqueueShot();
    });
  };

  // Botón para reconectar manualmente al live de TikTok
  const handleManualReconnect = () => {
    if (!user) return;
    const tiktokUsername = user.tiktokUsername || user.tiktok_username || null;
    if (!tiktokUsername) {
      toast.error('Configura tu usuario de TikTok en el perfil');
      return;
    }
    toast('Reconectando a TikTok…');
    socketService.joinGame('disparos', user.id, tiktokUsername);
  };

  const cleanup = () => {
    socketService.removeAllEventListeners('tiktok-connected');
    socketService.removeAllEventListeners('tiktok-disconnected');
    socketService.removeAllEventListeners('tiktok-error');
    socketService.removeAllEventListeners('tiktok-gift');
  socketService.removeAllEventListeners('tiktok-viewers');
  socketService.removeAllEventListeners('tiktok-chat');
  socketService.removeAllEventListeners('tiktok-like');
    if (gameSession) {
      gamesService.endGame(gameSession.id, stats).catch(() => {});
    }
  };

  // Movimiento lateral del avatar
  useEffect(() => {
    let raf;
    let last = performance.now();
    const speed = 12; // % por segundo
    const step = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setAvatarX((prev) => {
        let x = prev + avatarDirection * speed * dt;
        if (x > 85) {
          x = 85; setAvatarDirection(-1);
        } else if (x < 15) {
          x = 15; setAvatarDirection(1);
        }
        return x;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [avatarDirection]);

  // Cola de disparos para no solapar animaciones
  const enqueueShot = () => {
    shotQueueRef.current += 1;
    runShotLoop();
  };

  const runShotLoop = async () => {
    if (!readyToFire || shotQueueRef.current <= 0) return;
    setReadyToFire(false);
    shotQueueRef.current -= 1;
    await fireOnce();
    setReadyToFire(true);
    if (shotQueueRef.current > 0) runShotLoop();
  };

  const fireOnce = async () => {
    // Animaciones visuales: recoil, flash, humo, bala
    setRecoil(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    setSmoke(true);
    setTimeout(() => setSmoke(false), 900);
    const id = Date.now();
  setBulletId(id); // disparar nueva bala
  setBulletActive(true);

    // Programar evaluación de impacto al final del vuelo de la bala
    setTimeout(() => {
      const hit = Math.abs(avatarXRef.current - 50) <= 8; // ventana 16%
  if (hit) {
    const damage = Math.max(1, Number(damagePerHit) || 1);
        setIsDamaged(true);
        setTimeout(() => setIsDamaged(false), 400);
        // Explosión en la posición actual del avatar
        setExplosions((arr) => [...arr, { id, x: avatarXRef.current }]);
        setTimeout(() => setExplosions((arr) => arr.filter((e) => e.id !== id)), 600);
        setHealth((prev) => {
          const next = Math.max(0, prev - damage);
          if (next <= 0) {
            toast.error('💀 ¡El avatar ha muerto!');
            setTimeout(() => {
      setHealth(maxHealth);
              toast.success('💖 ¡Revivió!');
            }, 2000);
          }
          return next;
        });
        setStats((s) => ({ ...s, totalDamage: s.totalDamage + damage }));
      }
      // En todos los casos, desmontar la bala al finalizar
      setBulletActive(false);
    }, BULLET_TRAVEL_MS);

    setStats((s) => ({ ...s, totalShots: s.totalShots + 1 }));

    // Fin del recoil
    setTimeout(() => setRecoil(false), 300);
  // Esperar fin del ciclo de disparo antes de permitir el siguiente
  await new Promise((res) => setTimeout(res, BULLET_TRAVEL_MS + 200));
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: 'linear-gradient(to bottom, #6eb5ff 0%, #b8e6b8 50%, #4a7c59 100%)' }}>
      {/* Notificación de regalo */}
      {notification && (
        <TikTokNotification notification={notification} onClose={() => setNotification(null)} />
      )}

      {/* Estado conexión + Viewers + Coins + Config */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, zIndex: 10, alignItems: 'center' }}>
        <div style={{ padding: '8px 12px', borderRadius: 12, background: connected ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
          {connected ? `🟢 Conectado @${user?.tiktokUsername || user?.tiktok_username}` : '🔴 Desconectado'}
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)' }}>
          👥 {stats.viewers.toLocaleString()} viewers
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(251,191,36,0.85), rgba(245,158,11,0.85))', color: '#1f2937', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', border: '1px solid rgba(251,191,36,0.6)' }}>
          💰 {stats.totalCoins.toLocaleString()} coins
        </div>
        <button onClick={() => setShowConfig(true)} style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer' }}>
          ⚙️ Configurar
        </button>
        {!connected && (user?.tiktokUsername || user?.tiktok_username) && (
          <button onClick={handleManualReconnect} style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(59,130,246,0.9)', color: 'white', fontWeight: 700, border: '1px solid rgba(59,130,246,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer' }}>
            🔄 Reconectar
          </button>
        )}
      </div>

      {/* Modal de Configuración */}
      {showConfig && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 360, background: 'linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: 20, color: 'white' }}>
            <h3 style={{ margin: 0, marginBottom: 12, fontWeight: 800 }}>⚙️ Configuración</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Vida máxima</span>
                <input type="number" min={1} max={9999} value={maxHealth} onChange={(e) => setMaxHealth(Math.max(1, Number(e.target.value) || 1))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'white' }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Daño por impacto</span>
                <input type="number" min={1} max={9999} value={damagePerHit} onChange={(e) => setDamagePerHit(Math.max(1, Number(e.target.value) || 1))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'white' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button onClick={() => setShowConfig(false)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.35)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => {
                  // Guardar y aplicar
                  const mh = Math.max(1, Number(maxHealth) || 1);
                  const dmg = Math.max(1, Number(damagePerHit) || 1);
                  // Persistir
                  if (user?.id) saveSettings(user.id, { maxHealth: mh, damagePerHit: dmg });
                  // Aplicar
                  setMaxHealth(mh);
                  setDamagePerHit(dmg);
                  setHealth(mh);
                  toast.success('Configuración aplicada');
                  setShowConfig(false);
                }} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: '1px solid rgba(34,197,94,0.6)', cursor: 'pointer', fontWeight: 700 }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Título */}
      <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', color: '#2c3e50', fontSize: 22, fontWeight: 'bold', textShadow: '1px 1px 3px rgba(255,255,255,0.7)' }}>
        🎯 Cañón Épico
      </div>

      {/* Panel derecho: Top de Donaciones (balas) */}
      <div style={{ position: 'absolute', top: 70, right: 16, width: 300, maxHeight: '70vh', overflowY: 'auto', background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(96,165,250,0.15))', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', paddingBottom: 8 }}>
        <div style={{ position: 'sticky', top: 0, background: 'rgba(30,58,138,0.35)', padding: '10px 12px', borderBottom: '1px solid rgba(59,130,246,0.35)', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <div style={{ color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎁 Top Donaciones (balas)</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>💣 {bulletTop.reduce((a,b)=>a+(b.bullets||0),0)}</span>
          </div>
          <div style={{ color: '#c7d2fe', fontSize: 12, marginTop: 4 }}>1 coin = 1 bala · Escribe "disparo" para usar una</div>
        </div>
        {bulletTop.length === 0 ? (
          <div style={{ color: '#cbd5e1', textAlign: 'center', padding: 16, fontSize: 13 }}>Sin donaciones aún</div>
        ) : (
          bulletTop.map((row, i) => (
            <div key={row.key} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{row.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>💣 {row.bullets}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button title="Añadir 1" onClick={() => addManualBullets(row.key, row.name, 1)} style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(34,197,94,0.2)', color: '#bbf7d0', cursor: 'pointer' }}>+1</button>
                        <button title="Añadir 5" onClick={() => addManualBullets(row.key, row.name, 5)} style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(34,197,94,0.2)', color: '#bbf7d0', cursor: 'pointer' }}>+5</button>
                        <button title="Añadir 10" onClick={() => addManualBullets(row.key, row.name, 10)} style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(34,197,94,0.2)', color: '#bbf7d0', cursor: 'pointer' }}>+10</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 6, height: 6, background: 'rgba(59,130,246,0.25)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((row.bullets / (bulletTop[0]?.bullets || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #ef4444)', borderRadius: 9999, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nubes (usar valores numéricos en px para evitar mezclar tipos) */}
      <motion.div
        style={{ position: 'absolute', top: 50, left: -100, width: 80, height: 40, background: '#fff', borderRadius: 50, opacity: 0.7 }}
        animate={{ x: [-100, viewportWidth + 100] }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
      />
      <motion.div
        style={{ position: 'absolute', top: 120, left: -80, width: 60, height: 30, background: '#fff', borderRadius: 50, opacity: 0.7 }}
        animate={{ x: [-80, viewportWidth + 80] }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity, delay: 10 }}
      />

      {/* Suelo */}
      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 150, background: 'linear-gradient(to bottom, #4a7c59, #2d5016)' }} />

  {/* Avatar moviéndose (más abajo) */}
  <div style={{ position: 'absolute', top: AVATAR_TOP, left: `${avatarX}%`, transform: 'translateX(-50%)', width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', background: 'linear-gradient(145deg, #667eea, #764ba2)', border: `6px solid ${isDamaged ? '#f44336' : '#ffffff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: isDamaged ? '0 0 40px rgba(244, 67, 54, 0.8)' : '0 0 24px rgba(0,0,0,0.25)' }}>
        {health <= 0 ? '💀' : '🧙‍♂️'}
      </div>

      {/* Explosiones en impacto */}
      <AnimatePresence>
        {explosions.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0.9, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: AVATAR_TOP + AVATAR_SIZE / 2,
              left: `${e.x}%`,
              transform: 'translate(-50%, -50%)',
              width: EXPLOSION_SIZE,
              height: EXPLOSION_SIZE,
              borderRadius: '50%',
              zIndex: 3,
              background: 'radial-gradient(circle, rgba(255,200,0,0.95) 0%, rgba(255,120,0,0.75) 50%, rgba(255,0,0,0.4) 70%, transparent 80%)',
              boxShadow: '0 0 30px rgba(255,160,0,0.8)'
            }}
          />
        ))}
      </AnimatePresence>

      {/* Barra de vida simple */}
      <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', width: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 'bold', marginBottom: 6, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          <span>{health <= 0 ? '💀 MUERTO' : health <= 20 ? '🩸 CRÍTICO' : health <= 50 ? '⚠️ HERIDO' : '💚 SALUDABLE'}</span>
          <span>{health}/{maxHealth}</span>
        </div>
        <div style={{ height: 18, borderRadius: 10, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(health / maxHealth) * 100}%`, background: health > 70 ? '#4caf50' : health > 30 ? '#ff9800' : '#f44336', transition: 'width 0.4s ease', borderRadius: 10 }} />
        </div>
      </div>

      {/* Cañón */}
      <div style={{ position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)', width: 200, height: 150 }}>
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 120, height: 50, background: 'linear-gradient(45deg, #333, #555, #333)', borderRadius: 6, boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }} />
        <div id="cannon" style={{ position: 'absolute', bottom: 35, left: '50%', transform: 'translateX(-50%)', width: 30, height: 70, background: 'linear-gradient(to right, #444, #666, #444)', borderRadius: 15, boxShadow: '0 0 20px rgba(0,0,0,0.5)', transition: 'transform 0.2s ease' }} className={recoil ? 'recoil' : ''}>
          <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 36, height: 20, background: 'radial-gradient(ellipse, #222, #111)', borderRadius: '50%', border: '2px solid #000' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 14, background: '#000', borderRadius: '50%', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)' }} />
          </div>
          {/* Flash */}
          <AnimatePresence>
            {flash && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.3 }} exit={{ opacity: 0, scale: 1 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 50, height: 50, background: 'radial-gradient(circle, #ffd700, #ff4500, transparent)', borderRadius: '50%' }} />
            )}
          </AnimatePresence>
          {/* Humo */}
          <AnimatePresence>
            {smoke && (
              <motion.div initial={{ opacity: 0.8, y: 0, scale: 1 }} animate={{ opacity: 0, y: -60, scale: 2 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }} style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 30, height: 30, background: 'radial-gradient(circle, rgba(180,180,180,0.8), transparent)', borderRadius: '50%' }} />
            )}
          </AnimatePresence>
          {/* Bala */}
          <AnimatePresence>
            {bulletActive && (
              <motion.div
                key={bulletId}
                initial={{ opacity: 1, bottom: 65 }}
                animate={{ opacity: 1, bottom: bulletTargetBottom }}
                transition={{ duration: BULLET_TRAVEL_MS / 1000, ease: 'easeOut' }}
                style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: BULLET_SIZE, height: BULLET_SIZE, background: 'radial-gradient(circle, #333, #111)', borderRadius: '50%' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botón manual (útil para pruebas) */}
      <button onClick={enqueueShot} disabled={!readyToFire} style={{ position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)', padding: '12px 25px', background: readyToFire ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : '#7f8c8d', color: 'white', border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 'bold', cursor: readyToFire ? 'pointer' : 'not-allowed', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        {readyToFire ? '🔥 DISPARAR 🔥' : '💥 ¡BOOM! 💥'}
      </button>

      {/* Estilos auxiliares para recoil */}
      <style>{`
        .recoil { animation: kick-back 0.3s ease-out; }
        @keyframes kick-back {
          0% { transform: translateX(-50%) translateY(0); }
          30% { transform: translateX(-50%) translateY(4px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Disparos;
