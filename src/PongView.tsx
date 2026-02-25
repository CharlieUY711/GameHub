/**
 * PongView.tsx — Ping Pong Multijugador
 * Supabase Realtime — funciona en redes distintas
 * Touch optimizado para celular
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Config Supabase ─────────────────────────────────────────────────────────
const SUPA_URL = 'https://qhnmxvexkizcsmivfuam.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobm14dmV4a2l6Y3NtaXZmdWFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyMTI4MSwiZXhwIjoyMDg2Nzk3MjgxfQ.b2N86NyMG4F3CXcgTnzOjqx7AZPyDTa4QFFCtOSK42s';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${SUPA_KEY}`,
  'Prefer': 'return=representation',
};

// ─── Constantes del juego ────────────────────────────────────────────────────
const W = 100; // coordenadas lógicas %
const H = 100;
const PADDLE_H = 18;
const PADDLE_W = 2.5;
const BALL_SIZE = 2.8;
const SPEED_INIT = 1.4;
const SPEED_MAX = 3.5;
const WIN_SCORE = 7;
const TICK_MS = 30; // solo el host corre la física

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Sala {
  id: string;
  estado: 'esperando' | 'jugando' | 'terminado';
  jugador1: string | null;
  jugador2: string | null;
  score1: number;
  score2: number;
  ball_x: number;
  ball_y: number;
  ball_vx: number;
  ball_vy: number;
  paddle1_y: number;
  paddle2_y: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

async function getSala(id: string): Promise<Sala | null> {
  const r = await fetch(`${SUPA_URL}/rest/v1/pong_salas?id=eq.${id}`, { headers: HEADERS });
  const d = await r.json();
  return d[0] || null;
}

async function patchSala(id: string, data: Partial<Sala>) {
  await fetch(`${SUPA_URL}/rest/v1/pong_salas?id=eq.${id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(data),
  });
}

async function crearSala(id: string, nombre: string): Promise<void> {
  await fetch(`${SUPA_URL}/rest/v1/pong_salas`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      id, estado: 'esperando', jugador1: nombre, jugador2: null,
      score1: 0, score2: 0,
      ball_x: 50, ball_y: 50, ball_vx: SPEED_INIT, ball_vy: SPEED_INIT,
      paddle1_y: 50, paddle2_y: 50,
    }),
  });
}

async function unirSala(id: string, nombre: string): Promise<boolean> {
  const sala = await getSala(id);
  if (!sala || sala.jugador2) return false;
  await patchSala(id, { jugador2: nombre, estado: 'jugando' });
  return true;
}

// ─── Componente principal ────────────────────────────────────────────────────
export function PongView() {
  const [fase, setFase] = useState<'lobby' | 'sala' | 'juego'>('lobby');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [jugador, setJugador] = useState<1 | 2>(1);
  const [sala, setSala] = useState<Sala | null>(null);
  const [error, setError] = useState('');
  const [esperando, setEsperando] = useState(false);

  // ── Crear sala ──────────────────────────────────────────────────────────────
  const handleCrear = async () => {
    if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
    const code = genCode();
    await crearSala(code, nombre.trim());
    setCodigo(code);
    setJugador(1);
    setFase('sala');
    setEsperando(true);
  };

  // ── Unirse ──────────────────────────────────────────────────────────────────
  const handleUnirse = async () => {
    if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
    if (!codigoInput.trim()) { setError('Ingresá el código'); return; }
    const ok = await unirSala(codigoInput.toUpperCase(), nombre.trim());
    if (!ok) { setError('Sala no encontrada o ya llena'); return; }
    setCodigo(codigoInput.toUpperCase());
    setJugador(2);
    setFase('juego');
  };

  // ── Polling en sala de espera ────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'sala' || !esperando) return;
    const iv = setInterval(async () => {
      const s = await getSala(codigo);
      if (s?.estado === 'jugando') {
        setSala(s);
        setFase('juego');
        setEsperando(false);
        clearInterval(iv);
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [fase, esperando, codigo]);

  // ── Render fases ─────────────────────────────────────────────────────────────
  if (fase === 'lobby') return <Lobby nombre={nombre} setNombre={setNombre} codigoInput={codigoInput} setCodigoInput={setCodigoInput} error={error} setError={setError} onCrear={handleCrear} onUnirse={handleUnirse} />;
  if (fase === 'sala') return <SalaEspera codigo={codigo} nombre={nombre} />;
  if (fase === 'juego') return <Juego codigo={codigo} jugador={jugador} nombreLocal={nombre} salaInicial={sala} />;
  return null;
}

// ─── Lobby ───────────────────────────────────────────────────────────────────
function Lobby({ nombre, setNombre, codigoInput, setCodigoInput, error, setError, onCrear, onUnirse }: any) {
  return (
    <div style={styles.fullPage}>
      <div style={styles.court}>
        <div style={styles.centerLine} />
        <div style={styles.netDot(20)} />
        <div style={styles.netDot(40)} />
        <div style={styles.netDot(60)} />
        <div style={styles.netDot(80)} />
      </div>
      <div style={styles.lobbyCard}>
        <div style={styles.title}>PONG</div>
        <div style={styles.subtitle}>Multijugador en tiempo real</div>

        <input
          style={styles.input}
          placeholder="Tu nombre"
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError(''); }}
          maxLength={12}
        />

        <button style={styles.btnPrimary} onClick={onCrear}>
          🏓 Crear sala
        </button>

        <div style={styles.divider}><span>o uníte con código</span></div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...styles.input, flex: 1, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 4, fontSize: 20, fontWeight: 700 }}
            placeholder="ABCD"
            value={codigoInput}
            onChange={e => { setCodigoInput(e.target.value.toUpperCase()); setError(''); }}
            maxLength={4}
          />
          <button style={styles.btnSecondary} onClick={onUnirse}>Unirse</button>
        </div>

        {error && <div style={styles.errorMsg}>{error}</div>}
      </div>
    </div>
  );
}

// ─── Sala de espera ───────────────────────────────────────────────────────────
function SalaEspera({ codigo, nombre }: { codigo: string; nombre: string }) {
  return (
    <div style={styles.fullPage}>
      <div style={styles.court}><div style={styles.centerLine} /></div>
      <div style={styles.lobbyCard}>
        <div style={styles.title}>PONG</div>
        <div style={{ color: '#aaa', fontSize: 15, marginBottom: 24 }}>Hola, <b style={{ color: '#fff' }}>{nombre}</b></div>
        <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Compartí este código con tu oponente:</div>
        <div style={styles.codigoGrande}>{codigo}</div>
        <div style={{ color: '#666', fontSize: 13, marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={styles.dot} />
          Esperando oponente...
        </div>
      </div>
    </div>
  );
}

// ─── Juego ───────────────────────────────────────────────────────────────────
function Juego({ codigo, jugador, nombreLocal, salaInicial }: { codigo: string; jugador: 1 | 2; nombreLocal: string; salaInicial: Sala | null }) {
  const [sala, setSala] = useState<Sala | null>(salaInicial);
  const salaRef = useRef<Sala | null>(salaInicial);
  const canvasRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [ganador, setGanador] = useState('');
  const isHost = jugador === 1;

  // ── Sync remoto cada 30ms ────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(async () => {
      const s = await getSala(codigo);
      if (!s) return;
      salaRef.current = s;
      setSala({ ...s });

      if (s.score1 >= WIN_SCORE || s.score2 >= WIN_SCORE) {
        setGanador(s.score1 >= WIN_SCORE ? (s.jugador1 || 'J1') : (s.jugador2 || 'J2'));
        setGameOver(true);
        clearInterval(iv);
      }
    }, isHost ? 100 : 50);
    return () => clearInterval(iv);
  }, [codigo, isHost]);

  // ── Física (solo host) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isHost) return;

    const tick = async () => {
      const s = salaRef.current;
      if (!s || s.estado !== 'jugando') return;

      let { ball_x, ball_y, ball_vx, ball_vy, paddle1_y, paddle2_y, score1, score2 } = s;

      ball_x += ball_vx;
      ball_y += ball_vy;

      // Rebote techo/piso
      if (ball_y <= 0 || ball_y >= H - BALL_SIZE) ball_vy = -ball_vy;

      // Rebote paleta 1 (izquierda)
      if (ball_x <= PADDLE_W + 1.5 && ball_y + BALL_SIZE >= paddle1_y && ball_y <= paddle1_y + PADDLE_H) {
        ball_vx = Math.abs(ball_vx) * 1.05;
        ball_vy += (ball_y + BALL_SIZE / 2 - (paddle1_y + PADDLE_H / 2)) * 0.1;
        ball_vx = Math.min(ball_vx, SPEED_MAX);
        ball_x = PADDLE_W + 1.5;
      }

      // Rebote paleta 2 (derecha)
      if (ball_x >= W - PADDLE_W - BALL_SIZE - 1.5 && ball_y + BALL_SIZE >= paddle2_y && ball_y <= paddle2_y + PADDLE_H) {
        ball_vx = -Math.abs(ball_vx) * 1.05;
        ball_vy += (ball_y + BALL_SIZE / 2 - (paddle2_y + PADDLE_H / 2)) * 0.1;
        ball_vx = Math.max(ball_vx, -SPEED_MAX);
        ball_x = W - PADDLE_W - BALL_SIZE - 1.5;
      }

      // Punto
      if (ball_x < 0) {
        score2++;
        ball_x = 50; ball_y = 50;
        ball_vx = SPEED_INIT; ball_vy = SPEED_INIT * (Math.random() > 0.5 ? 1 : -1);
      }
      if (ball_x > W) {
        score1++;
        ball_x = 50; ball_y = 50;
        ball_vx = -SPEED_INIT; ball_vy = SPEED_INIT * (Math.random() > 0.5 ? 1 : -1);
      }

      const update: Partial<Sala> = { ball_x, ball_y, ball_vx, ball_vy, score1, score2 };
      if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) update.estado = 'terminado';

      salaRef.current = { ...s, ...update };
      setSala(prev => ({ ...prev!, ...update }));
      await patchSala(codigo, update);
    };

    tickRef.current = setInterval(tick, TICK_MS);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isHost, codigo]);

  // ── Touch / mouse en paleta ──────────────────────────────────────────────────
  const handleMove = useCallback(async (clientY: number) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientY - rect.top) / rect.height) * 100;
    const paddleY = Math.max(0, Math.min(H - PADDLE_H, pct - PADDLE_H / 2));
    const field = jugador === 1 ? 'paddle1_y' : 'paddle2_y';
    salaRef.current = { ...salaRef.current!, [field]: paddleY };
    setSala(prev => prev ? { ...prev, [field]: paddleY } : prev);
    await patchSala(codigo, { [field]: paddleY });
  }, [jugador, codigo]);

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);

  if (!sala) return <div style={{ ...styles.fullPage, color: '#888', fontSize: 16 }}>Cargando...</div>;

  const { ball_x, ball_y, paddle1_y, paddle2_y, score1, score2, jugador1, jugador2 } = sala;

  return (
    <div style={styles.fullPage}>
      {/* Score */}
      <div style={styles.scoreBar}>
        <div style={jugador === 1 ? styles.scoreActive : styles.scoreInactive}>
          <span style={styles.scoreName}>{jugador1 || 'J1'}{jugador === 1 ? ' 👈' : ''}</span>
          <span style={styles.scoreNum}>{score1}</span>
        </div>
        <div style={styles.scoreCenter}>●</div>
        <div style={jugador === 2 ? styles.scoreActive : styles.scoreInactive}>
          <span style={styles.scoreNum}>{score2}</span>
          <span style={styles.scoreName}>{jugador === 2 ? '👈 ' : ''}{jugador2 || 'J2'}</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        style={styles.canvas}
        onTouchMove={onTouchMove}
        onMouseMove={onMouseMove}
      >
        {/* Línea central */}
        <div style={styles.centerLine} />

        {/* Paleta 1 */}
        <div style={{
          position: 'absolute',
          left: `${PADDLE_W * 0.3}%`,
          top: `${paddle1_y}%`,
          width: `${PADDLE_W}%`,
          height: `${PADDLE_H}%`,
          background: jugador === 1 ? '#FF6B35' : '#555',
          borderRadius: 4,
          boxShadow: jugador === 1 ? '0 0 12px #FF6B3580' : 'none',
          transition: 'top 0.03s linear',
        }} />

        {/* Paleta 2 */}
        <div style={{
          position: 'absolute',
          right: `${PADDLE_W * 0.3}%`,
          top: `${paddle2_y}%`,
          width: `${PADDLE_W}%`,
          height: `${PADDLE_H}%`,
          background: jugador === 2 ? '#FF6B35' : '#555',
          borderRadius: 4,
          boxShadow: jugador === 2 ? '0 0 12px #FF6B3580' : 'none',
          transition: 'top 0.03s linear',
        }} />

        {/* Pelota */}
        <div style={{
          position: 'absolute',
          left: `${ball_x}%`,
          top: `${ball_y}%`,
          width: `${BALL_SIZE}%`,
          height: `${BALL_SIZE * 1.5}%`,
          background: '#fff',
          borderRadius: '50%',
          boxShadow: '0 0 10px #ffffff80',
        }} />

        {/* Instrucción */}
        <div style={styles.instruccion}>
          {jugador === 1 ? '← Tu paleta' : 'Tu paleta →'}
        </div>
      </div>

      {/* Game over */}
      {gameOver && (
        <div style={styles.overlay}>
          <div style={styles.gameOverCard}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B35', marginBottom: 8 }}>
              {ganador} ganó
            </div>
            <div style={{ fontSize: 18, color: '#888', marginBottom: 24 }}>
              {score1} — {score2}
            </div>
            <button style={styles.btnPrimary} onClick={() => window.location.reload()}>
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  fullPage: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', monospace",
    overflow: 'hidden',
    userSelect: 'none',
  },
  court: {
    position: 'absolute',
    inset: 0,
    opacity: 0.04,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    background: '#fff',
    transform: 'translateX(-50%)',
  },
  lobbyCard: {
    position: 'relative',
    background: '#111',
    border: '1px solid #222',
    borderRadius: 16,
    padding: '36px 28px',
    width: '90%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  title: {
    fontSize: 48,
    fontWeight: 900,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 12,
    textShadow: '0 0 40px #FF6B3560',
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -8,
    marginBottom: 8,
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    background: '#FF6B35',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 1,
  },
  btnSecondary: {
    background: '#222',
    color: '#FF6B35',
    border: '1px solid #333',
    borderRadius: 10,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#333',
    fontSize: 12,
  },
  errorMsg: {
    background: '#3a1a1a',
    color: '#ff6b6b',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    textAlign: 'center',
  },
  codigoGrande: {
    fontSize: 52,
    fontWeight: 900,
    color: '#FF6B35',
    textAlign: 'center',
    letterSpacing: 16,
    textShadow: '0 0 30px #FF6B3560',
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4ECDC4',
    boxShadow: '0 0 8px #4ECDC4',
  },
  scoreBar: {
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#111',
    borderBottom: '1px solid #1a1a1a',
  },
  scoreActive: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
  },
  scoreInactive: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    opacity: 0.5,
  },
  scoreName: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
  },
  scoreNum: {
    fontSize: 36,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1,
  },
  scoreCenter: {
    color: '#333',
    fontSize: 20,
  },
  canvas: {
    position: 'relative',
    width: '100%',
    maxWidth: 500,
    flex: 1,
    background: '#0d0d0d',
    overflow: 'hidden',
    cursor: 'none',
    touchAction: 'none',
  },
  instruccion: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 11,
    color: '#333',
    letterSpacing: 1,
    whiteSpace: 'nowrap' as const,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 20,
    padding: '40px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
  },
};

// Helpers de estilos inline para netDot
(styles as any).netDot = (top: number): React.CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: `${top}%`,
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#fff',
  transform: 'translateX(-50%)',
});

export default PongView;
