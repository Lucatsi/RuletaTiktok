import React, { useState, useEffect, useRef } from 'react';
import TikTokNotification from '../../components/TikTokNotification';
import socketService from '../../services/socketService';
import rouletteService from '../../services/rouletteService';
import { useAuth } from '../../contexts/AuthContext.jsx';

function Ruleta() {
  const { user } = useAuth();

  // Estado principal
  const [activeTab, setActiveTab] = useState('both');
  const [donations, setDonations] = useState([]);
  const [likeTotals, setLikeTotals] = useState({});
  const [donorTotals, setDonorTotals] = useState({});
  const lastLikeTotalRef = useRef({});
  const seenLikesRef = useRef(new Set());
  const seenGiftsMapRef = useRef(new Map()); // key: userId|giftId -> { ts, count, coins }
  const [chatMessages, setChatMessages] = useState([]);
  const seenMessagesRef = useRef(new Set());
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({ totalSpins: 0, totalGifts: 0, totalCoins: 0, viewers: 0, totalLikes: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isFinalWinner, setIsFinalWinner] = useState(false);
  const [particles, setParticles] = useState([]);
  const [lastDonationOutcome, setLastDonationOutcome] = useState(null); // { donorName, remainingLives, eliminated }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [acceptingParticipants, setAcceptingParticipants] = useState(false);
  // Modo: 'classic' (eliminación) o 'donation' (vidas)
  const [mode, setMode] = useState('classic');
  // Donaciones: jugadores con vidas acumuladas (1 moneda = 1 vida)
  const [donatePlayers, setDonatePlayers] = useState([]); // [{ key, name, lives, color }]
  const donateMapRef = useRef(new Map());

  // Configuraciones y modal
  const [showConfig, setShowConfig] = useState(false);
  const [configurations, setConfigurations] = useState([]);
  const defaultOptions = [];
  const [rouletteOptions, setRouletteOptions] = useState([]);
  const [tempOptions, setTempOptions] = useState([]);
  const [currentConfigId, setCurrentConfigId] = useState(null);
  const [spinHistory, setSpinHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  // Guía visual de selección (línea desde la flecha al centro)
  const SHOW_SELECTION_GUIDE = true; // ponlo en false para ocultarla después de verificar
  const POINTER_OFFSET_DEG = 0; // 0°: guía vertical, misma referencia que la flecha
  // Participantes añadidos por chat (único hasta reset)
  const participantsRef = useRef(new Set());
  // Índice de color para participantes y paleta de colores bien diferenciados
  const participantColorIndexRef = useRef(0);
  const participantPalette = [
    '#e11d48', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981',
    '#f97316', '#84cc16', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
    '#d946ef', '#db2777', '#16a34a', '#65a30d', '#2563eb', '#0891b2', '#dc2626', '#9333ea'
  ];

  const getNextParticipantColor = (prevHex) => {
    let attempts = 0;
    while (attempts < participantPalette.length) {
      const color = participantPalette[participantColorIndexRef.current % participantPalette.length];
      participantColorIndexRef.current += 1;
      if (!prevHex || color.toLowerCase() !== String(prevHex).toLowerCase()) {
        return color;
      }
      attempts += 1;
    }
    // Fallback (nunca debería llegar): devuelve el primero
    return participantPalette[0];
  };

  const normalize = (s) => (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const colorFromName = (name) => {
    // Color HSL determinista según el nombre
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const h = hash % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  // Utils
  const parseOptions = (opt) => {
    try {
      const arr = Array.isArray(opt) ? opt : (typeof opt === 'string' ? JSON.parse(opt) : []);
      return arr.map(o => ({
        label: o.label || 'Premio',
        color: o.color || '#8b5cf6',
        textColor: o.textColor || '#ffffff',
        emoji: o.emoji || '🎁',
        probability: typeof o.probability === 'number' ? o.probability : 1,
        rarity: o.rarity || 'common'
      }));
    } catch {
      // Si no hay opciones válidas, dejar vacío por defecto
      return [];
    }
  };

  const chooseWeighted = (options) => {
    const weights = options.map(o => (typeof o.probability === 'number' && o.probability > 0 ? o.probability : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < options.length; i++) {
      if (r < weights[i]) return options[i];
      r -= weights[i];
    }
    return options[options.length - 1];
  };

  // Preferir nombre real/visible
  const getDisplayName = (payload) => {
    return (
      payload?.displayName ||
      payload?.nickname ||
      payload?.username ||
      payload?.user ||
      payload?.uniqueId ||
      'usuario'
    );
  };

  // Helpers de storage para participantes por usuario
  const participantsStorageKey = (uid) => `roulette:participants:${uid}`;
  const acceptingStorageKey = (uid) => `roulette:accepting:${uid}`;
  const sessionStorageKey = (uid) => `roulette:session:${uid}`;

  const saveParticipantsToStorage = (uid, options) => {
    try {
      const onlyParticipants = (options || []).filter(o => o?.isParticipant);
      localStorage.setItem(participantsStorageKey(uid), JSON.stringify(onlyParticipants));
    } catch {}
  };

  const loadParticipantsFromStorage = (uid) => {
    try {
      const raw = localStorage.getItem(participantsStorageKey(uid));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  // Cargar configuraciones al inicio (sin auto-aplicar, ruleta vacía por defecto)
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await rouletteService.getConfigurations();
      setConfigurations(configs || []);
      // No auto-cargar ninguna configuración para mantener vacía salvo elección manual
    } catch (e) {
      console.error('Error al cargar configuraciones:', e);
      setError(e.message || 'Error de configuraciones');
    } finally {
      setLoading(false);
    }
  };

  // Inicialización de sesión y restauración de participantes
  useEffect(() => {
    loadConfigurations();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Mantener una sessionId estable entre recargas hasta que se haga Reset
    const existing = localStorage.getItem(sessionStorageKey(user.id));
    const sid = existing || `session-${Date.now()}`;
    if (!existing) localStorage.setItem(sessionStorageKey(user.id), sid);
    setSessionId(sid);
    // Restaurar participantes persistidos
    const saved = loadParticipantsFromStorage(user.id);
    if (Array.isArray(saved) && saved.length > 0) {
      setRouletteOptions(saved);
      setTempOptions(saved);
      // Rellenar set de participantes para dedupe
      try {
        saved.forEach(o => {
          const name = String(o?.label || '').replace(/^@+/, '').trim();
          const key = normalize(name);
          if (key) participantsRef.current.add(key);
        });
      } catch {}
    }
  // Bandera de inscripciones (por defecto cerrada)
  const acc = localStorage.getItem(acceptingStorageKey(user.id));
  setAcceptingParticipants(acc === 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Socket: unión y listeners
  useEffect(() => {
    if (!user) return;

    socketService.connect();
    const tiktokUsername = user.tiktokUsername || user.tiktok_username || null;
    socketService.joinGame('roulette', user.id, tiktokUsername);

    const onConnected = (payload) => {
      setIsConnected(true);
      let v = null;
      if (payload && (payload.viewers ?? payload.viewerCount) != null) {
        v = payload.viewers ?? payload.viewerCount;
      } else if (payload?.status?.roomInfo) {
        const ri = payload.status.roomInfo;
        v = ri.viewer_count ?? ri.viewerCount ?? ri.user_count ?? ri?.data?.userCount ?? payload?.status?.data?.userCount ?? null;
      }
      if (v != null) {
        setStats(prev => ({ ...prev, viewers: Number(v) || 0 }));
      }
    };
      const onDisconnected = () => {
        setIsConnected(false);
      };
      const onViewers = (payload) => {
        const v = Number(payload?.viewerCount ?? payload?.viewers ?? 0) || 0;
        setStats(prev => ({ ...prev, viewers: v }));
        if (v > 0) setIsConnected(true);
      };
  const onChat = (msg) => {
  // Cualquier evento de chat confirma conexión al live
  setIsConnected(true);
      // Dedupe: usar id si viene; si no, construir firma estable por 2s
      const baseUser = msg?.user || msg?.username || msg?.uniqueId || 'u';
      const baseText = (msg?.message || msg?.comment || '').trim();
      const timeBucket = Math.floor((msg?.timestamp || Date.now()) / 2000);
      const id = msg?.id || `${baseUser}-${baseText}-${timeBucket}`;
      if (seenMessagesRef.current.has(id)) return;
      seenMessagesRef.current.add(id);
      if (seenMessagesRef.current.size > 400) {
        // limpiar claves antiguas para evitar crecimiento infinito
        seenMessagesRef.current = new Set(Array.from(seenMessagesRef.current).slice(-300));
      }

  // Detectar frase "yo quiero participar" y variantes (tolerante a tildes/typos/emoji/puntuación)
  const norm = normalize(baseText);
  const cleaned = norm.replace(/[^a-z0-9\s@]/g, ' ').replace(/\s+/g, ' ').trim();
  // Variantes para "quiero":
  const quiero = /(quiero|kiero|qiero|qro|kro|kero|qero)/;
  // Variantes/sinónimos de unirse (muy permisivo a typos comunes):
  const unirse = /(particip|partisip|part\b|entrar|entro|meter|meteme|unir|sumar|anotar|apuntar|jugar|juego|ruleta)/;
  const wantsToJoin =
    // "(yo )?quiero ... (participar/entrar/etc)"
    new RegExp(`(\\byo\\s+)?${quiero.source}\\s+${unirse.source}`).test(cleaned) ||
    // Frases cortas típicas
    /\b(yo\s+)?participo\b/.test(cleaned) ||
    /\bme\s+apunto\b/.test(cleaned) ||
    /\b(apuntame|apuntarme|apuntenme|apuntame)\b/.test(cleaned) ||
    /\b(anotame|anotarme|anotenme)\b/.test(cleaned) ||
    /\b(me\s+uno|me\s+sumo)\b/.test(cleaned) ||
    /\b(sumame|sumarme|sumenme)\b/.test(cleaned) ||
    /\b(agregame|agregarme|incluyeme|incluyanme)\b/.test(cleaned) ||
    /\b(meteme|metanme|ponme)\b/.test(cleaned) ||
    // "particip" en general (participo/participar/participa)
    /\bparticip\w*\b/.test(cleaned);
  if (wantsToJoin && acceptingParticipants && !isSpinning) {
        const key = normalize(msg?.username || msg?.uniqueId || baseUser);
        if (!participantsRef.current.has(key)) {
          participantsRef.current.add(key);
          const disp = (getDisplayName(msg) || '').toString().replace(/^@+/, '').trim();
          const lastColor = (rouletteOptions[rouletteOptions.length - 1] || {}).color;
          const opt = {
            label: `@${disp}`,
            color: getNextParticipantColor(lastColor),
            textColor: '#ffffff',
            emoji: '🙋',
            probability: 1,
            rarity: 'common',
            isParticipant: true
          };
          setRouletteOptions(prev => {
            const next = [...prev, opt];
            if (user?.id) saveParticipantsToStorage(user.id, next);
            return next;
          });
          setTempOptions(prev => [...prev, opt]);
        }
      }
      const item = {
        id,
        user: getDisplayName(msg),
        message: baseText,
        timestamp: msg?.timestamp || Date.now()
      };
      setChatMessages(prev => [item, ...prev].slice(0, 150));
    };
  const onLike = (ev) => {
  // Confirmar conexión al recibir likes
  setIsConnected(true);
      const u = getDisplayName(ev);
      const totalLikeCount = Number(ev?.totalLikeCount);
      const likeInc = Math.max(1, Number(ev?.likeCount) || 0); // contar 1 por cada like del evento
      // Dedupe: mismo usuario y mismo totalLikeCount => ignorar duplicado exacto
      if (!Number.isNaN(totalLikeCount)) {
        const key = `${u}-${totalLikeCount}`;
        if (seenLikesRef.current.has(key)) return;
        seenLikesRef.current.add(key);
        if (seenLikesRef.current.size > 500) {
          seenLikesRef.current = new Set(Array.from(seenLikesRef.current).slice(-400));
        }
      }
      setLikeTotals(prev => {
        const next = { ...prev, [u]: (prev[u] || 0) + likeInc };
        lastLikeTotalRef.current = next;
        return next;
      });
      if (!Number.isNaN(totalLikeCount)) {
        setStats(prev => ({ ...prev, totalLikes: totalLikeCount }));
      }
    };
    const onGift = (gift) => {
  // Confirmar conexión al recibir gifts
  setIsConnected(true);
  const count = Number(gift?.giftCount ?? gift?.count ?? gift?.repeatCount ?? 1);
  const coins = Number(gift?.coinsValue ?? gift?.coins ?? gift?.diamondCount ?? 0);
  const repeatEnd = !!gift?.repeatEnd;
  const giftType = Number(gift?.giftType ?? 0);
      const name = getDisplayName(gift);
      // Dedupe robusto: por usuario único (uniqueId) + giftId en ventana 8s
      try {
        const userKey = normalize(gift?.username || gift?.uniqueId || gift?.donorName || name);
        const giftKey = (gift?.giftId != null) ? String(gift.giftId) : normalize(gift?.giftName || gift?.gift || 'gift');
        const sig = `${userKey}|${giftKey}`;
        const now = Date.now();
        const prev = seenGiftsMapRef.current.get(sig);
        if (prev && (now - prev.ts) < 1000) {
          // Ignorar sólo si es exactamente igual (mismo conteo y monedas) en ~1s (duplicado real)
          if (count === prev.count && coins === prev.coins) {
            return;
          }
        }
        // Actualizar registro
        seenGiftsMapRef.current.set(sig, { ts: now, count, coins });
        // Limpieza ocasional
        if (seenGiftsMapRef.current.size > 600) {
          const cutoff = now - 120000; // 2 min
          for (const [k, v] of seenGiftsMapRef.current.entries()) {
            if (!v || (v.ts || 0) < cutoff) seenGiftsMapRef.current.delete(k);
          }
        }
      } catch {}
      const donation = {
        id: gift?.id || `${Date.now()}-${Math.random()}`,
        user: name,
        avatar: '🎁',
        count,
        gift: gift?.giftName ?? gift?.gift ?? 'Gift',
        coins,
        repeatEnd,
        giftType,
        lifeAdded: Math.max(0, Math.floor(coins)),
        type: 'gift',
        timestamp: Date.now()
      };
      setDonations(prev => [donation, ...prev].slice(0, 200));
      if (coins > 0) {
        setDonorTotals(prev => ({ ...prev, [name]: (prev[name] || 0) + coins }));
        // Modo donaciones: acumular vidas 1:1 por usuario
        const raw = (name || '').toString().replace(/^@+/, '').trim();
        const key = normalize(raw);
        if (key) {
          setDonatePlayers(prev => {
            const map = new Map(donateMapRef.current);
            const existing = map.get(key);
            const color = existing?.color || colorFromName(raw);
            const updated = {
              key,
              name: existing?.name || raw,
              color,
              lives: (existing?.lives || 0) + Math.max(0, Math.floor(coins))
            };
            map.set(key, updated);
            donateMapRef.current = map;
            return Array.from(map.values());
          });
        }
      }
      setStats(prev => ({ ...prev, totalGifts: prev.totalGifts + 1, totalCoins: prev.totalCoins + (coins || 0) }));
      setNotification({ title: `Gracias @${donation.user}!`, message: `x${donation.count} ${donation.gift}`, coins: donation.coins, emoji: '🎁' });
      // Auto-giro solo en modo donaciones
      if (mode === 'donation') {
        spinRoulette(true, donation.id);
      }
    };

    socketService.onTikTokConnected(onConnected);
    socketService.onTikTokDisconnected(onDisconnected);
    socketService.onTikTokChat(onChat);
  socketService.onTikTokLike(onLike);
  socketService.onTikTokViewers(onViewers);
    socketService.onTikTokGift(onGift);

    return () => {
      socketService.removeAllEventListeners('tiktok-connected');
      socketService.removeAllEventListeners('tiktok-disconnected');
      socketService.removeAllEventListeners('tiktok-chat');
      socketService.removeAllEventListeners('tiktok-like');
    socketService.removeAllEventListeners('tiktok-gift');
    socketService.removeAllEventListeners('tiktok-viewers');
    };
  }, [user, acceptingParticipants, mode]);

  const handleManualReconnect = () => {
    if (!user) return;
    const tiktokUsername = user.tiktokUsername || user.tiktok_username || null;
    socketService.joinGame('roulette', user.id, tiktokUsername);
  };

  // Lógica de la ruleta
  // Construir snapshot de opciones para modo donaciones
  const buildDonationOptionsSnapshot = () => {
    return donatePlayers
      .filter(p => (p?.lives || 0) > 0)
      .map(p => ({
        label: `@${p.name} ❤️ ${p.lives}`,
        color: p.color || colorFromName(p.name),
        textColor: '#ffffff',
        emoji: '❤️',
        probability: Math.max(1, Number(p.lives) || 1),
        rarity: 'common',
        donorKey: p.key
      }));
  };

  const spinRoulette = async (triggeredByDonation = false, donationId = null) => {
    const current = mode === 'donation' ? buildDonationOptionsSnapshot() : [...rouletteOptions];
    if (isSpinning || current.length === 0) return;
    // Si solo queda 1 opción, ya hay ganador final sin girar
    if (current.length === 1) {
      const only = current[0];
      setWinner(only);
      setIsFinalWinner(true);
      setShowWinner(true);
      return;
    }
    // Congelar opciones durante este giro para que no cambie la geometría
    const optionsSnapshot = [...current];
    const anglePer = 360 / optionsSnapshot.length;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    // Ángulo aleatorio para que el ganador sea determinado por la flecha
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + extraSpins * 360 + randomAngle;
    const start = Date.now();

    setIsSpinning(true);
    setRotation(totalRotation);

    setTimeout(async () => {
  setIsSpinning(false);
  // Calcular el índice ganador según la flecha (top)
  const norm = ((totalRotation % 360) + 360) % 360; // 0..359
  // Offset fino por si el puntero visual (triángulo/círculo) no coincide exactamente con las 12 en punto
  const pointerOffsetDeg = POINTER_OFFSET_DEG; // usar el mismo valor que la guía visual
  const fromTop = ((360 - norm + pointerOffsetDeg) % 360 + 360) % 360; // ángulo 0..360 bajo la flecha
  // Selección exacta: el sector cuyo intervalo angular contiene la línea (sin centrar)
  const selectedIndex = Math.floor(fromTop / anglePer) % optionsSnapshot.length;
  const selectedOption = optionsSnapshot[selectedIndex];
  setWinner(selectedOption);
  setIsFinalWinner(false);
  setShowWinner(true);
      const duration = Math.max(1, Math.round((Date.now() - start) / 1000));
      setStats(prev => ({ ...prev, totalSpins: prev.totalSpins + 1 }));

      try {
        if (currentConfigId && sessionId) {
          const newSpinNumber = (spinHistory?.[0]?.spin_number || 0) + 1;
          await rouletteService.recordSpin(
            currentConfigId,
            sessionId,
            selectedOption,
            newSpinNumber,
            totalRotation,
            duration,
            triggeredByDonation,
            donationId,
            stats.viewers
          );

          if (activeTab === 'history') {
            setSpinHistory(prev => ([{
              id: Date.now(),
              winner_option: JSON.stringify(selectedOption),
              spin_number: newSpinNumber,
              rotation_degrees: totalRotation,
              duration_seconds: duration,
              triggered_by_donation: !!triggeredByDonation,
              viewer_count: stats.viewers,
              created_at: new Date().toISOString(),
              roulette_name: 'Ruleta Épica'
            }, ...(prev || [])]));
          }
        }
      } catch (e) {
        console.error('Error al registrar el giro:', e);
      }

      if (mode === 'classic') {
        // Modo eliminación: remover la opción seleccionada del tablero
        setRouletteOptions(prev => {
          // Preferir coincidencia por contenido para evitar errores si la lista cambió durante el giro
          let idx = prev.findIndex(o =>
            o && selectedOption &&
            o.label === selectedOption.label &&
            o.color === selectedOption.color &&
            (o.emoji || '') === (selectedOption.emoji || '')
          );
          if (idx === -1) {
            // Fallback al índice calculado contra el snapshot si las longitudes son iguales
            if (prev.length === optionsSnapshot.length && selectedIndex >= 0 && selectedIndex < prev.length) {
              idx = selectedIndex;
            }
          }
          let next = prev;
          if (idx !== -1) {
            next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
          }
          // Persistir solo participantes si aplica
          try { if (user?.id) saveParticipantsToStorage(user.id, next); } catch {}
          // Mantener en tempOptions también
          setTempOptions(next);
          // Si queda 1, declararlo ganador final
          if (next.length === 1) {
            setTimeout(() => {
              setWinner(next[0]);
              setIsFinalWinner(true);
              setShowWinner(true);
            }, 200); // pequeño delay tras cerrar el modal anterior
          }
          return next;
        });
      } else {
        // Modo donaciones: restar 1 vida al ganador, eliminar si queda en 0
        const k = selectedOption?.donorKey;
        if (k) {
          setDonatePlayers(prev => {
            const map = new Map(prev.map(p => [p.key, { ...p }]));
            const item = map.get(k);
            if (!item) return prev;
            const before = Number(item.lives || 0);
            const after = Math.max(0, before - 1);
            item.lives = after;
            // Registrar resultado para el modal
            try {
              setLastDonationOutcome({ donorName: item.name, remainingLives: after, eliminated: after === 0 });
            } catch {}
            if (item.lives <= 0) {
              map.delete(k);
            } else {
              map.set(k, item);
            }
            const next = Array.from(map.values());
            donateMapRef.current = new Map(next.map(p => [p.key, p]));
            const alive = next.filter(p => (p.lives || 0) > 0);
            if (alive.length === 1) {
              setTimeout(() => {
                setWinner({ label: `@${alive[0].name}`, emoji: '🏆' });
                setIsFinalWinner(true);
                setShowWinner(true);
              }, 200);
            }
            return next;
          });
        }
      }

      // Ocultar ganador luego de 5s
      setTimeout(() => {
        setShowWinner(false);
  setTimeout(() => { setWinner(null); setLastDonationOutcome(null); }, 500);
      }, 5000);
    }, 4000);
  };

  // Acciones de historial/estadísticas
  const loadSpinHistory = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const data = await rouletteService.getSpinHistory(sessionId, 50, 0);
      setSpinHistory(data || []);
    } catch (e) {
      console.error('Error al cargar historial:', e);
      setError(e.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async () => {
    const clearLocal = () => {
  // Solo reiniciar conteos de la ruleta
  setStats(prev => ({ ...prev, totalSpins: 0 }));
      setRotation(0);
      setWinner(null);
      setShowWinner(false);
  // No tocar donaciones, likes, ni chat
  setParticles([]);
      // Limpiar participantes añadidos por chat
      participantsRef.current = new Set();
      // Dejar la ruleta completamente vacía después de reset
      setRouletteOptions([]);
      setTempOptions([]);
      // Limpiar almacenamiento y reiniciar índice de colores
  try {
        if (user?.id) {
          localStorage.removeItem(participantsStorageKey(user.id));
          const newSid = `session-${Date.now()}`;
          localStorage.setItem(sessionStorageKey(user.id), newSid);
          setSessionId(newSid);
      // Abrir inscripciones tras reset
      localStorage.setItem(acceptingStorageKey(user.id), 'true');
        }
      } catch {}
      participantColorIndexRef.current = 0;
    setAcceptingParticipants(true);
    };

    try {
      setLoading(true);
      // Limpiar UI inmediatamente
      clearLocal();
      // Intentar reset en backend (solo ruleta)
      if (currentConfigId && sessionId) {
        await rouletteService.resetRouletteStats(sessionId, currentConfigId);
      }
      alert('Ruleta reseteada (participantes y giros). Likes, chat y donaciones se mantienen.');
    } catch (e) {
      console.error('Error al resetear estadísticas:', e);
      alert('No se pudo resetear en el servidor, pero la ruleta local fue limpiada.');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async () => {
    if (!currentConfigId) return;
    if (!confirm('¿Estás seguro de eliminar el historial de esta ruleta?')) return;
    try {
      setLoading(true);
      await rouletteService.deleteRouletteHistory(currentConfigId);
      setSpinHistory([]);
      alert('Historial eliminado');
    } catch (e) {
      console.error('Error al eliminar historial:', e);
      alert('Error al eliminar historial: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar la configuración
  const openConfig = () => {
    setTempOptions([...rouletteOptions]);
    setShowConfig(true);
  };

  const closeConfig = () => {
    setShowConfig(false);
    setTempOptions([...rouletteOptions]);
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      
      if (currentConfigId) {
        // Actualizar configuración existente
        const currentConfig = configurations.find(c => c.id === currentConfigId);
        if (currentConfig) {
          await rouletteService.updateConfiguration(
            currentConfigId,
            currentConfig.name,
            currentConfig.description,
            tempOptions
          );
        }
      } else {
        // Crear nueva configuración
        const newConfig = await rouletteService.createConfiguration(
          'Nueva Ruleta',
          'Configuración personalizada',
          tempOptions
        );
        setCurrentConfigId(newConfig.id);
        setConfigurations(prev => [...prev, newConfig]);
      }
      
      setRouletteOptions([...tempOptions]);
      setShowConfig(false);
      
      // Recargar configuraciones para mantener sincronizado
      await loadConfigurations();
      
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar configuración: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    const newOption = {
      label: 'NUEVO',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      textColor: '#ffffff',
      emoji: '🎁',
      probability: 1 / (tempOptions.length + 1),
      rarity: 'common'
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

  // Cambiar configuración activa
  const changeConfiguration = async (configId) => {
    try {
      const config = configurations.find(c => c.id === configId);
      if (config) {
        setCurrentConfigId(configId);
  const options = parseOptions(config.options);
        setRouletteOptions(options);
        setTempOptions(options);
      }
    } catch (error) {
      console.error('Error al cambiar configuración:', error);
    }
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

  // Config para likes (tap-tap): cuántos likes llenan la barra al 100%
  const LIKE_BAR_TARGET = 100; // ajustable
  const getDonationBar = (donation) => {
    if (donation?.type === 'like') {
      const pct = Math.min(((Number(donation.count) || 0) / LIKE_BAR_TARGET) * 100, 100);
      return {
        percent: pct,
        gradient: 'linear-gradient(45deg, #22c55e, #16a34a, #059669)'
      };
    }
    const pct = Math.min(((Number(donation.coins) || 0) / 500) * 100, 100);
    return {
      percent: pct,
      gradient: 'linear-gradient(45deg, #fbbf24, #f59e0b, #ef4444)'
    };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Notificación de TikTok (agradecimiento donación) */}
      <TikTokNotification
        notification={notification}
        onClose={() => setNotification(null)}
      />
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

  <div style={{ display: 'flex', height: '100vh' }}>
        {/* Columna izquierda: Chat en vivo */}
        <div style={{
          width: '380px',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(59, 130, 246, 0.2), rgba(0, 0, 0, 0.4))',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(59, 130, 246, 0.35)',
          display: 'flex',
          flexDirection: 'column',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(59, 130, 246, 0.35)',
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.25), rgba(147, 51, 234, 0.15))'
          }}>
            <h3 style={{ color: 'white', margin: 0, fontWeight: 'bold' }}>💬 Chat en Vivo</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontSize: '0.875rem' }}>📭 Aún no hay mensajes</div>
            ) : (
              chatMessages.slice(0, 150).map(msg => (
                <div key={msg.id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {msg.user?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>@{msg.user}</span>
                        <span style={{ color: '#c4b5fd', fontSize: '0.7rem' }}>{formatTime(msg.timestamp)}</span>
                      </div>
                      <div style={{ marginTop: '6px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '8px 10px', borderRadius: '10px', color: '#e5e7eb', fontSize: '0.9rem' }}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
              <div style={{
                color: 'white',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px 16px',
                borderRadius: '9999px',
                backdropFilter: 'blur(8px)'
              }}>
                👍 {stats.totalLikes.toLocaleString()} likes
              </div>
              {/* Botones de modo en la misma línea */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setMode('classic')}
                  style={{
                    background: mode === 'classic' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '9999px',
                    padding: '6px 10px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  🎯 Eliminación
                </button>
                <button
                  onClick={() => setMode('donation')}
                  style={{
                    background: mode === 'donation' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '9999px',
                    padding: '6px 10px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  ❤️ Donaciones
                </button>
              </div>
              {!isConnected && (user?.tiktokUsername || user?.tiktok_username) && (
                <button
                  onClick={handleManualReconnect}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  🔁 Reconectar TikTok
                </button>
              )}
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

          {/* (Título y subtítulo removidos) */}

          {/* Ruleta principal + botones laterales */}
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            {/* Acciones laterales (izquierda) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '-120px',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 35
            }}>
              <button
                onClick={resetStats}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🔄 Resetear
              </button>
              <button
                onClick={openConfig}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  opacity: loading ? 0.6 : 1
                }}
              >
                ⚙️ Configurar
              </button>
            </div>

            {/* Acciones laterales (derecha) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '-120px',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 35
            }}>
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) loadSpinHistory();
                }}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  opacity: loading ? 0.6 : 1
                }}
              >
                📊 Historial
              </button>
              <button
                onClick={deleteHistory}
                disabled={loading || !currentConfigId}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: (loading || !currentConfigId) ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  opacity: (loading || !currentConfigId) ? 0.6 : 1
                }}
              >
                🗑️ Borrar
              </button>
            </div>
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
                borderTop: '4px solid #f87171',
                pointerEvents: 'none'
              }}></div>
              
              {/* Aro exterior con luces LED */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'relative',
                  width: '640px',
                  height: '640px',
                  borderRadius: '50%',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  padding: '8px',
                  background: 'conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)',
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}>
                  {/* Luces LED animadas alrededor */}
                  {Array.from({ length: 36 }, (_, i) => {
                    const angle = (360 / 36) * i;
                    const x = 50 + 48 * Math.cos((angle - 90) * Math.PI / 180);
                    const y = 50 + 48 * Math.sin((angle - 90) * Math.PI / 180);
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
          <svg width="100%" height="100%" viewBox="0 0 640 640">
                      {(mode === 'donation' ? buildDonationOptionsSnapshot() : rouletteOptions).map((option, index, arr) => {
                        const angle = 360 / arr.length;
                        const startAngle = index * angle;
                        const endAngle = (index + 1) * angle;
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
            const radius = 300;
            const cx = 320, cy = 320;
                        const x1 = cx + radius * Math.cos(startRad);
                        const y1 = cy + radius * Math.sin(startRad);
                        const x2 = cx + radius * Math.cos(endRad);
                        const y2 = cy + radius * Math.sin(endRad);
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = [
                          `M ${cx} ${cy}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          `Z`
                        ].join(' ');
                        const textAngle = startAngle + angle / 2;
                        const textRad = (textAngle - 90) * Math.PI / 180;
            const textRadius = 225;
                        const textX = cx + textRadius * Math.cos(textRad);
                        const textY = cy + textRadius * Math.sin(textRad);
                        
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
                      width: '112px',
                      height: '112px',
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
                        width: '92px',
                        height: '92px',
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

                {/* Línea guía de selección (opcional) */}
                {SHOW_SELECTION_GUIDE && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      zIndex: 29
                    }}
                  >
                    {/* La línea debe permanecer con la misma referencia que el puntero: vertical con offset */}
          <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: '2px',
                        height: '320px',
                        background: 'rgba(34,197,94,0.95)',
                        boxShadow: '0 0 8px rgba(34,197,94,0.7)',
                        transform: `translateX(-50%) rotate(${POINTER_OFFSET_DEG}deg)`,
                        transformOrigin: '50% 20px',
                        opacity: 0.9,
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selector de modo movido al header superior */}

          {/* (Botones laterales izquierdos: Resetear y Configurar) */}

          {/* Modal de resultado: Eliminado o Ganador Final */}
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
                background: isFinalWinner
                  ? 'linear-gradient(45deg, #fbbf24, #f59e0b, #ef4444)'
                  : 'linear-gradient(45deg, #ef4444, #dc2626, #b91c1c)',
                color: 'white',
                padding: '32px 48px',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: isFinalWinner ? '4px solid #fde047' : '4px solid #fecaca',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center'
              }}>
                {/* Botón de cerrar */}
                <button
                  onClick={() => {
                    setShowWinner(false);
                    setTimeout(() => { setWinner(null); setLastDonationOutcome(null); }, 500);
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
                    fontWeight: 'bold',
                    zIndex: 20
                  }}
                >
                  ✕
                </button>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isFinalWinner
                    ? 'linear-gradient(45deg, rgba(253, 224, 71, 0.2), rgba(251, 146, 60, 0.2))'
                    : 'linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                  animation: 'pulse 2s infinite',
                  pointerEvents: 'none'
                }}></div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    animation: 'pulse 2s infinite'
                  }}>{isFinalWinner ? '🎉 ¡GANADOR FINAL! 🎉' : '❌ Eliminado'}</h2>
                  
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
                  {!isFinalWinner && (
                    <p style={{
                      fontSize: '1.25rem',
                      opacity: 0.9,
                      textTransform: 'none',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '4px 16px',
                      borderRadius: '9999px',
                      display: 'inline-block'
                    }}>
                      {mode === 'donation' && lastDonationOutcome
                        ? (lastDonationOutcome.eliminated
                            ? 'Eliminado (sin vidas)'
                            : `Pierde 1 vida · ❤️ ${lastDonationOutcome.remainingLives} restantes`)
                        : 'Eliminado de la ruleta'}
                    </p>
                  )}
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


          {/* Stats rápidas - abajo a la izquierda */}
          <div style={{
            position: 'absolute',
                bottom: '24px',
            left: '24px',
            display: 'flex',
                width: '240px',
                height: '120px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(236, 72, 153, 0.35))',
              backdropFilter: 'blur(16px)',
              color: 'white',
              padding: '12px 18px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(139, 92, 246, 0.45)',
              boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.35), 0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50%'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>🎯</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>{stats.totalSpins}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9, color: '#e9d5ff', marginTop: '2px', fontWeight: 700 }}>GIROS</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(5, 150, 105, 0.35))',
              backdropFilter: 'blur(16px)',
              color: 'white',
              padding: '12px 18px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(34, 197, 94, 0.45)',
              boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.35), 0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50%'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>🎁</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>{stats.totalGifts}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9, color: '#d1fae5', marginTop: '2px', fontWeight: 700 }}>REGALOS</div>
            </div>
          </div>
        </div>

  {/* Panel lateral derecho con pestañas (sin Chat) */}
        <div style={{
          width: '380px',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(147, 51, 234, 0.2), rgba(0, 0, 0, 0.4))',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(147, 51, 234, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden'
        }}>
          {/* Pestañas del panel */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(147, 51, 234, 0.3)',
            background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))'
          }}>
            <button
              onClick={() => setActiveTab('donations')}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: 'none',
                background: activeTab === 'donations' 
                  ? 'linear-gradient(45deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                  : 'transparent',
                color: activeTab === 'donations' ? '#ffffff' : '#c4b5fd',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'donations' ? '2px solid #8b5cf6' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              🎁 Donaciones
            </button>
            <button
              onClick={() => setActiveTab('both')}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: 'none',
                background: activeTab === 'both' 
                  ? 'linear-gradient(45deg, rgba(2, 132, 199, 0.35), rgba(59, 130, 246, 0.35))'
                  : 'transparent',
                color: activeTab === 'both' ? '#ffffff' : '#c4b5fd',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'both' ? '2px solid #60a5fa' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              🧩 Ambos
            </button>
            {/* (Pestaña Chat eliminada) */}
            <button
              onClick={() => setActiveTab('likes')}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: 'none',
                background: activeTab === 'likes' 
                  ? 'linear-gradient(45deg, rgba(34, 197, 94, 0.35), rgba(5, 150, 105, 0.35))'
                  : 'transparent',
                color: activeTab === 'likes' ? '#ffffff' : '#c4b5fd',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'likes' ? '2px solid #22c55e' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              👍 Top Likes
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                if (spinHistory.length === 0) loadSpinHistory();
              }}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: 'none',
                background: activeTab === 'history' 
                  ? 'linear-gradient(45deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                  : 'transparent',
                color: activeTab === 'history' ? '#ffffff' : '#c4b5fd',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'history' ? '2px solid #8b5cf6' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              📊 Historial
            </button>
          </div>

          {/* Header del panel */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(147, 51, 234, 0.3)',
            background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
          }}>
            {activeTab === 'donations' ? (
              <>
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
              </>
            ) : activeTab === 'both' ? (
              <>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>🧩 Donaciones y Top Likes</h3>
                <p style={{
                  color: '#c4b5fd',
                  fontSize: '0.875rem'
                }}>Vista combinada: donaciones a la izquierda, likes a la derecha · Total likes: {stats.totalLikes.toLocaleString()}</p>
              </>
            ) : activeTab === 'likes' ? (
              <>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>👍 Top Likes</h3>
                <p style={{
                  color: '#c4b5fd',
                  fontSize: '0.875rem'
                }}>1 por like · Total likes del live: {stats.totalLikes.toLocaleString()}</p>
              </>
            ) : activeTab === 'chat' ? (
              <>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>💬 Chat en Vivo</h3>
                <p style={{
                  color: '#c4b5fd',
                  fontSize: '0.875rem'
                }}>Mensajes más recientes</p>
              </>
            ) : (
              <>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>📊 Historial de Giros</h3>
                <p style={{
                  color: '#c4b5fd',
                  fontSize: '0.875rem'
                }}>Últimos giros registrados ({spinHistory.length})</p>
              </>
            )}
          </div>
          
          {/* Contenido del panel */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Vista combinada */}
            {activeTab === 'both' && (
              <div style={{ display: 'flex', height: '100%' }}>
                {/* Donaciones (izquierda) */}
                <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid rgba(147, 51, 234, 0.2)' }}>
                  {donations.filter(d => d.type !== 'like').map((donation) => (
                    <div
                      key={donation.id}
                      style={{ padding: '16px', borderBottom: '1px solid rgba(147, 51, 234, 0.1)', transition: 'all 0.3s ease', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #ef4444)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                          {donation.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{donation.user}</h4>
                            <span style={{ color: '#c4b5fd', fontSize: '0.75rem' }}>{formatTime(donation.timestamp)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <p style={{ color: '#e9d5ff', fontSize: '0.875rem' }}>
                              {donation.type === 'like' ? `Likes x${donation.count}` : `${donation.count}x ${donation.gift}`}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {Number(donation.coins) > 0 && (<span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.875rem' }}>{donation.coins}💰</span>)}
                              {typeof donation.lifeAdded === 'number' && donation.lifeAdded > 0 && (<span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.875rem' }}>❤️ +{donation.lifeAdded}</span>)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {(() => { const bar = getDonationBar(donation); return (
                        <div style={{ marginTop: '12px', height: '8px', background: 'rgba(88, 28, 135, 0.5)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: bar.gradient, borderRadius: '9999px', width: `${bar.percent}%`, transition: 'width 0.8s ease-out' }} />
                        </div>
                      ); })()}
                    </div>
                  ))}
                </div>
                {/* Top Likes (derecha) */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(147, 51, 234, 0.2)', background: 'rgba(16, 185, 129, 0.1)', position: 'sticky', top: 0 }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>👍 Top Likes · Total: {stats.totalLikes.toLocaleString()}</span>
                  </div>
                  <div>
                    {(() => {
                      const entries = Object.entries(likeTotals);
                      if (entries.length === 0) return (<div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontSize: '0.875rem' }}>📭 Aún no hay likes</div>);
                      const sorted = entries.map(([user, count]) => ({ user, count })).sort((a, b) => b.count - a.count).slice(0, 15);
                      const top = sorted[0]?.count || 1;
                      return sorted.map((row, i) => (
                        <div key={row.user} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(147, 51, 234, 0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>{i + 1}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{row.user}</span>
                                <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.85rem' }}>👍 {row.count}</span>
                              </div>
                              <div style={{ marginTop: '6px', height: '6px', background: 'rgba(16, 185, 129, 0.25)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min((row.count / top) * 100, 100)}%`, height: '100%', background: 'linear-gradient(45deg, #22c55e, #16a34a, #059669)', borderRadius: '9999px', transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Vista Donaciones */}
            {activeTab === 'donations' && (
              donations.filter(d => d.type !== 'like').map((donation) => (
                <div
                  key={donation.id}
                  style={{ padding: '16px', borderBottom: '1px solid rgba(147, 51, 234, 0.1)', transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #ef4444)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      {donation.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{donation.user}</h4>
                        <span style={{ color: '#c4b5fd', fontSize: '0.75rem' }}>{formatTime(donation.timestamp)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <p style={{ color: '#e9d5ff', fontSize: '0.875rem' }}>{donation.count}x {donation.gift}</p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {Number(donation.coins) > 0 && (<span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.875rem' }}>{donation.coins}💰</span>)}
                          {typeof donation.lifeAdded === 'number' && donation.lifeAdded > 0 && (<span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.875rem' }}>❤️ +{donation.lifeAdded}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {(() => { const bar = getDonationBar(donation); return (
                    <div style={{ marginTop: '12px', height: '8px', background: 'rgba(88, 28, 135, 0.5)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: bar.gradient, borderRadius: '9999px', width: `${bar.percent}%`, transition: 'width 0.8s ease-out' }} />
                    </div>
                  ); })()}
                </div>
              ))
            )}

            {/* Vista Chat */}
            {/* (Pestaña Chat eliminada: el chat ahora está en la columna izquierda) */}

            {/* Vista Likes */}
            {activeTab === 'likes' && (
              (() => {
                const entries = Object.entries(likeTotals);
                if (entries.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', fontSize: '0.875rem' }}>
                      📭 Aún no hay likes
                      <br />
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Cuando recibas likes, verás el ranking aquí</span>
                    </div>
                  );
                }
                const sorted = entries.map(([user, count]) => ({ user, count })).sort((a, b) => b.count - a.count).slice(0, 30);
                const top = sorted[0]?.count || 1;
                return sorted.map((row, i) => (
                  <div key={row.user} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(147, 51, 234, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{row.user}</span>
                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>👍 {row.count}</span>
                        </div>
                        <div style={{ marginTop: '8px', height: '8px', background: 'rgba(16, 185, 129, 0.25)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((row.count / top) * 100, 100)}%`, height: '100%', background: 'linear-gradient(45deg, #22c55e, #16a34a, #059669)', borderRadius: '9999px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()
            )}

            {/* Vista Historial */}
            {activeTab === 'history' && (
              loading ? (
                <div style={{ textAlign: 'center', color: 'white', padding: '40px', fontSize: '0.875rem' }}>🔄 Cargando historial...</div>
              ) : spinHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', fontSize: '0.875rem' }}>
                  📭 No hay giros registrados aún
                  <br />
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>¡Gira la ruleta para ver el historial!</span>
                </div>
              ) : (
                spinHistory.slice(0, 20).map((spin) => (
                  <div
                    key={spin.id}
                    style={{ padding: '12px 16px', borderBottom: '1px solid rgba(147, 51, 234, 0.1)', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                        {JSON.parse(spin.winner_option).emoji || '🎁'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {JSON.parse(spin.winner_option).label}
                          </span>
                          <span style={{ color: '#c4b5fd', fontSize: '0.65rem', background: 'rgba(139, 92, 246, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>#{spin.spin_number}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>👥 {spin.viewer_count}</span>
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>⏱️ {spin.duration_seconds}s</span>
                          </div>
                          <span style={{ color: '#9ca3af', fontSize: '0.65rem' }}>
                            {new Date(spin.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {spin.triggered_by_donation && (
                          <div style={{ color: '#fbbf24', fontSize: '0.65rem', marginTop: '2px' }}>💰 Activado por donación</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
          
          {/* Footer del panel */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid rgba(147, 51, 234, 0.3)',
            background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
          }}>
            {activeTab === 'donations' ? (
              /* Footer de donaciones */
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
            ) : (
              /* Footer de historial */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <p style={{
                    color: '#8b5cf6',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    🎯 {stats.totalSpins}
                  </p>
                  <p style={{
                    color: '#c4b5fd',
                    fontSize: '0.875rem'
                  }}>Giros totales</p>
                </div>
                
                {/* Botones de acción del historial */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => loadSpinHistory()}
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🔄 Actualizar
                  </button>
                  
                  <button
                    onClick={deleteHistory}
                    disabled={loading || !currentConfigId || spinHistory.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: (loading || !currentConfigId || spinHistory.length === 0) ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      opacity: (loading || !currentConfigId || spinHistory.length === 0) ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🗑️ Limpiar
                  </button>
                  
                  <button
                    onClick={() => setShowHistory(true)}
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📋 Ver Todo
                  </button>
                </div>
              </div>
            )}
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
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

            {/* Selector de configuraciones guardadas */}
            {configurations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>Configuraciones Guardadas:</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {configurations.map(config => (
                    <button
                      key={config.id}
                      onClick={() => changeConfiguration(config.id)}
                      style={{
                        background: currentConfigId === config.id 
                          ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        border: currentConfigId === config.id ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: 'white',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {config.name}
                      {config.is_default && ' (Predeterminada)'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
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
                  gridTemplateColumns: '1fr 1fr 80px 80px 40px',
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
                    value={option.emoji || '🎁'}
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
                  <select
                    value={option.rarity || 'common'}
                    onChange={(e) => updateOption(index, 'rarity', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="common" style={{ background: '#1e293b', color: 'white' }}>Común</option>
                    <option value="uncommon" style={{ background: '#1e293b', color: 'white' }}>Poco común</option>
                    <option value="rare" style={{ background: '#1e293b', color: 'white' }}>Raro</option>
                    <option value="epic" style={{ background: '#1e293b', color: 'white' }}>Épico</option>
                    <option value="legendary" style={{ background: '#1e293b', color: 'white' }}>Legendario</option>
                  </select>
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
                disabled={loading}
                style={{
                  background: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={saveConfig}
                disabled={loading}
                style={{
                  background: loading 
                    ? '#6b7280' 
                    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial */}
      {showHistory && (
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                📊 Historial de Giros
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'white', 
                padding: '40px' 
              }}>
                Cargando historial...
              </div>
            ) : spinHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#9ca3af', 
                padding: '40px' 
              }}>
                No hay giros registrados aún
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {spinHistory.map((spin, index) => (
                  <div
                    key={spin.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '15px',
                      marginBottom: '10px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr 1fr 1fr',
                      gap: '15px',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        marginBottom: '5px' 
                      }}>
                        {JSON.parse(spin.winner_option).emoji || '🎁'}
                      </div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.75rem' 
                      }}>
                        Giro #{spin.spin_number}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        marginBottom: '5px' 
                      }}>
                        {JSON.parse(spin.winner_option).label}
                      </div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.875rem' 
                      }}>
                        {spin.roulette_name || 'Ruleta Épica'}
                      </div>
                      {spin.triggered_by_donation && (
                        <div style={{ 
                          color: '#fbbf24', 
                          fontSize: '0.75rem' 
                        }}>
                          💰 Activado por donación
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: 'white', 
                        fontWeight: 'bold' 
                      }}>
                        {spin.viewer_count} 👥
                      </div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.75rem' 
                      }}>
                        {spin.duration_seconds}s
                      </div>
                    </div>
                    
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '0.75rem',
                      textAlign: 'right' 
                    }}>
                      {new Date(spin.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginTop: '20px'
            }}>
              <button
                onClick={() => loadSpinHistory()}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🔄 Actualizar
              </button>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
          zIndex: 9999,
          cursor: 'pointer'
        }} onClick={() => setError(null)}>
          {error}
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

export default Ruleta;