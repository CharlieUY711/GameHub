/**
 * RuletaView.tsx — Ruleta Casino Multijugador
 * Supabase Realtime — funciona en redes distintas
 * Optimizado para celular
 */
import React, { useState, useEffect, useRef } from 'react';

// ─── Config Supabase ─────────────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qhnmxvexkizcsmivfuam.supabase.co';
const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobm14dmV4a2l6Y3NtaXZmdWFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyMTI4MSwiZXhwIjoyMDg2Nzk3MjgxfQ.b2N86NyMG4F3CXcgTnzOjqx7AZPyDTa4QFFCtOSK42s';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${SUPA_KEY}`,
  'Prefer': 'return=representation',
};

// ─── Constantes ────────────────────────────────────────────────────────────
const FICHAS_INICIALES = 1000;
const NUMEROS_RULETA = 37; // 0-36

// Números rojos en la ruleta europea
const NUMEROS_ROJOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const NUMEROS_NEGROS = Array.from({ length: 37 }, (_, i) => i).filter(n => n !== 0 && !NUMEROS_ROJOS.includes(n));

// ─── Tipos ───────────────────────────────────────────────────────────────────
type TipoApuesta = 'numero' | 'color' | 'paridad' | 'docena';

interface Apuesta {
  tipo: TipoApuesta;
  valor: string | number; // 'rojo' | 'negro' | 'par' | 'impar' | '1-12' | '13-24' | '25-36' | número 0-36
  monto: number;
}

interface Jugador {
  nombre: string;
  fichas: number;
  apuestas: Apuesta[];
}

interface EstadoSala {
  jugadores: Record<string, Jugador>;
  estado: 'esperando' | 'apostando' | 'girando' | 'resultado';
  resultado?: number;
  ganancias?: Record<string, number>;
}

interface Sala {
  id: string;
  estado_json: EstadoSala;
  host: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

async function getSala(id: string): Promise<Sala | null> {
  const r = await fetch(`${SUPA_URL}/rest/v1/ruleta_salas?id=eq.${id}`, { headers: HEADERS });
  const d = await r.json();
  return d[0] || null;
}

async function patchSala(id: string, data: Partial<Sala>) {
  await fetch(`${SUPA_URL}/rest/v1/ruleta_salas?id=eq.${id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(data),
  });
}

async function crearSala(id: string, nombre: string): Promise<void> {
  const estadoInicial: EstadoSala = {
    jugadores: {
      [nombre]: {
        nombre,
        fichas: FICHAS_INICIALES,
        apuestas: [],
      },
    },
    estado: 'apostando',
  };

  await fetch(`${SUPA_URL}/rest/v1/ruleta_salas`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      id,
      host: nombre,
      estado_json: estadoInicial,
    }),
  });
}

async function unirSala(id: string, nombre: string): Promise<boolean> {
  const sala = await getSala(id);
  if (!sala) return false;

  const estado = sala.estado_json;
  if (estado.jugadores[nombre]) return false; // Ya está en la sala

  estado.jugadores[nombre] = {
    nombre,
    fichas: FICHAS_INICIALES,
    apuestas: [],
  };

  await patchSala(id, { estado_json: estado });
  return true;
}

// ─── Componente principal ────────────────────────────────────────────────────
export function RuletaView() {
  const [fase, setFase] = useState<'lobby' | 'sala'>('lobby');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [sala, setSala] = useState<Sala | null>(null);
  const [error, setError] = useState('');
  const [esHost, setEsHost] = useState(false);

  // ── Crear sala ──────────────────────────────────────────────────────────────
  const handleCrear = async () => {
    if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
    const code = genCode();
    await crearSala(code, nombre.trim());
    setCodigo(code);
    setEsHost(true);
    setFase('sala');
  };

  // ── Unirse ──────────────────────────────────────────────────────────────────
  const handleUnirse = async () => {
    if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
    if (!codigoInput.trim()) { setError('Ingresá el código'); return; }
    const ok = await unirSala(codigoInput.toUpperCase(), nombre.trim());
    if (!ok) { setError('Sala no encontrada'); return; }
    setCodigo(codigoInput.toUpperCase());
    setEsHost(false);
    setFase('sala');
  };

  // ── Polling de sala ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'sala' || !codigo) return;
    const iv = setInterval(async () => {
      const s = await getSala(codigo);
      if (s) setSala(s);
    }, 1000);
    return () => clearInterval(iv);
  }, [fase, codigo]);

  // ── Render fases ────────────────────────────────────────────────────────────
  if (fase === 'lobby') {
    return (
      <Lobby
        nombre={nombre}
        setNombre={setNombre}
        codigoInput={codigoInput}
        setCodigoInput={setCodigoInput}
        error={error}
        setError={setError}
        onCrear={handleCrear}
        onUnirse={handleUnirse}
      />
    );
  }

  if (fase === 'sala' && sala) {
    return (
      <SalaApuestas
        codigo={codigo}
        nombre={nombre}
        sala={sala}
        esHost={esHost}
        onActualizarSala={setSala}
      />
    );
  }

  return <div style={styles.fullPage}>Cargando...</div>;
}

// ─── Lobby ───────────────────────────────────────────────────────────────────
function Lobby({ nombre, setNombre, codigoInput, setCodigoInput, error, setError, onCrear, onUnirse }: any) {
  return (
    <div style={styles.fullPage}>
      <div style={styles.casinoBg} />
      <div style={styles.lobbyCard}>
        <div style={styles.title}>🎰 RULETA</div>
        <div style={styles.subtitle}>Casino Multijugador</div>

        <input
          style={styles.input}
          placeholder="Tu nombre"
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError(''); }}
          maxLength={12}
        />

        <button style={styles.btnPrimary} onClick={onCrear}>
          🎲 Crear sala
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

// ─── Sala de Apuestas ────────────────────────────────────────────────────────
function SalaApuestas({ codigo, nombre, sala, esHost, onActualizarSala }: {
  codigo: string;
  nombre: string;
  sala: Sala;
  esHost: boolean;
  onActualizarSala: (s: Sala) => void;
}) {
  const estado = sala.estado_json;
  const jugador = estado.jugadores[nombre];
  const [montoApuesta, setMontoApuesta] = useState(10);
  const [tipoApuesta, setTipoApuesta] = useState<TipoApuesta>('numero');
  const [valorApuesta, setValorApuesta] = useState<string | number>('');
  const [girando, setGirando] = useState(false);
  const [error, setError] = useState('');
  const ruletaRef = useRef<HTMLDivElement>(null);

  const todosApostaron = Object.values(estado.jugadores).every(j => j.apuestas.length > 0);

  // ── Agregar apuesta ─────────────────────────────────────────────────────────
  const handleApostar = async () => {
    if (!valorApuesta && tipoApuesta === 'numero') {
      setError('Seleccioná un número');
      return;
    }
    if (!valorApuesta && tipoApuesta !== 'numero') {
      setError('Seleccioná una opción');
      return;
    }
    if (montoApuesta > jugador.fichas) {
      setError('No tenés suficientes fichas');
      return;
    }
    if (montoApuesta <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    const nuevaApuesta: Apuesta = {
      tipo: tipoApuesta,
      valor: tipoApuesta === 'numero' ? Number(valorApuesta) : valorApuesta,
      monto: montoApuesta,
    };

    const nuevoEstado = { ...estado };
    nuevoEstado.jugadores[nombre].apuestas.push(nuevaApuesta);
    nuevoEstado.jugadores[nombre].fichas -= montoApuesta;

    await patchSala(codigo, { estado_json: nuevoEstado });
    onActualizarSala({ ...sala, estado_json: nuevoEstado });
    setValorApuesta('');
    setError('');
  };

  // ── Girar ruleta ────────────────────────────────────────────────────────────
  const handleGirar = async () => {
    if (!todosApostaron) return;

    setGirando(true);
    const nuevoEstado = { ...estado, estado: 'girando' as const };
    await patchSala(codigo, { estado_json: nuevoEstado });

    // Animación de giro (3-5 segundos)
    const duracion = 3000 + Math.random() * 2000;
    const resultado = Math.floor(Math.random() * NUMEROS_RULETA);
    const gradosPorNumero = 360 / NUMEROS_RULETA;
    
    // Obtener rotación actual
    let rotacionActual = 0;
    if (ruletaRef.current) {
      const style = window.getComputedStyle(ruletaRef.current);
      const matrix = style.transform || style.webkitTransform;
      if (matrix && matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        rotacionActual = Math.round(Math.atan2(b, a) * (180 / Math.PI));
      }
    }
    
    // Calcular nueva rotación: rotación actual + múltiples vueltas + posición del resultado
    // El 0 está en la parte superior, así que necesitamos ajustar
    const posicionResultado = (resultado * gradosPorNumero);
    const vueltas = 5 + Math.random() * 2; // 5-7 vueltas
    const nuevaRotacion = rotacionActual + (vueltas * 360) + (360 - posicionResultado);

    if (ruletaRef.current) {
      ruletaRef.current.style.transition = `transform ${duracion}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
      ruletaRef.current.style.transform = `rotate(${nuevaRotacion}deg)`;
    }

    setTimeout(async () => {
      // Calcular ganancias
      const ganancias: Record<string, number> = {};
      
      Object.entries(nuevoEstado.jugadores).forEach(([nombreJugador, jug]) => {
        let gananciaTotal = 0;
        
        jug.apuestas.forEach(apuesta => {
          let gano = false;
          let multiplicador = 1;

          switch (apuesta.tipo) {
            case 'numero':
              gano = apuesta.valor === resultado;
              multiplicador = 35;
              break;
            case 'color':
              if (resultado === 0) {
                gano = false; // 0 es verde, no gana rojo ni negro
              } else if (apuesta.valor === 'rojo') {
                gano = NUMEROS_ROJOS.includes(resultado);
                multiplicador = 2;
              } else if (apuesta.valor === 'negro') {
                gano = NUMEROS_NEGROS.includes(resultado);
                multiplicador = 2;
              }
              break;
            case 'paridad':
              if (resultado === 0) {
                gano = false; // 0 no es par ni impar
              } else if (apuesta.valor === 'par') {
                gano = resultado % 2 === 0;
                multiplicador = 2;
              } else if (apuesta.valor === 'impar') {
                gano = resultado % 2 === 1;
                multiplicador = 2;
              }
              break;
            case 'docena':
              const num = resultado;
              if (apuesta.valor === '1-12') {
                gano = num >= 1 && num <= 12;
                multiplicador = 3;
              } else if (apuesta.valor === '13-24') {
                gano = num >= 13 && num <= 24;
                multiplicador = 3;
              } else if (apuesta.valor === '25-36') {
                gano = num >= 25 && num <= 36;
                multiplicador = 3;
              }
              break;
          }

          if (gano) {
            gananciaTotal += apuesta.monto * multiplicador;
          }
        });

        ganancias[nombreJugador] = gananciaTotal;
        nuevoEstado.jugadores[nombreJugador].fichas += gananciaTotal;
      });

      nuevoEstado.estado = 'resultado';
      nuevoEstado.resultado = resultado;
      nuevoEstado.ganancias = ganancias;

      await patchSala(codigo, { estado_json: nuevoEstado });
      onActualizarSala({ ...sala, estado_json: nuevoEstado });
      setGirando(false);
    }, duracion);
  };

  // ── Nueva ronda ────────────────────────────────────────────────────────────
  const handleNuevaRonda = async () => {
    const nuevoEstado: EstadoSala = {
      jugadores: Object.fromEntries(
        Object.entries(estado.jugadores).map(([nombreJugador, jug]) => [
          nombreJugador,
          { ...jug, apuestas: [] },
        ])
      ),
      estado: 'apostando',
    };

    await patchSala(codigo, { estado_json: nuevoEstado });
    onActualizarSala({ ...sala, estado_json: nuevoEstado });
    
    // Resetear ruleta manteniendo la posición actual pero sin transición
    if (ruletaRef.current) {
      const style = window.getComputedStyle(ruletaRef.current);
      const matrix = style.transform || style.webkitTransform;
      let rotacionActual = 0;
      if (matrix && matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        rotacionActual = Math.round(Math.atan2(b, a) * (180 / Math.PI));
      }
      // Normalizar a 0-360
      rotacionActual = ((rotacionActual % 360) + 360) % 360;
      ruletaRef.current.style.transition = 'none';
      ruletaRef.current.style.transform = `rotate(${rotacionActual}deg)`;
      // Forzar reflow
      void ruletaRef.current.offsetHeight;
    }
  };

  return (
    <div style={styles.fullPage}>
      <div style={styles.casinoBg} />
      
      <div style={styles.salaContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.codigoDisplay}>Sala: {codigo}</div>
          <div style={styles.fichasDisplay}>
            💰 {jugador.fichas} fichas
          </div>
        </div>

        {/* Ruleta */}
        <div style={styles.ruletaContainer}>
          <div style={styles.ruletaWrapper}>
            <div ref={ruletaRef} style={styles.ruleta}>
              {Array.from({ length: NUMEROS_RULETA }, (_, i) => {
                const esRojo = NUMEROS_ROJOS.includes(i);
                const esNegro = NUMEROS_NEGROS.includes(i);
                const esVerde = i === 0;
                const grados = (i * 360) / NUMEROS_RULETA;

                return (
                  <div
                    key={i}
                    style={{
                      ...styles.numeroRuleta,
                      background: esVerde ? '#0a5a0a' : esRojo ? '#8b0000' : '#000',
                      color: '#fff',
                      transform: `rotate(${grados}deg)`,
                      transformOrigin: '0% 100%',
                    }}
                  >
                    <span style={{ transform: `rotate(-${grados}deg)` }}>{i}</span>
                  </div>
                );
              })}
            </div>
            <div style={styles.ruletaFlecha}>▼</div>
          </div>

          {estado.estado === 'resultado' && estado.resultado !== undefined && (
            <div style={styles.resultadoDisplay}>
              <div style={styles.resultadoNumero}>{estado.resultado}</div>
              {estado.ganancias && estado.ganancias[nombre] > 0 && (
                <div style={styles.gananciaDisplay}>
                  +{estado.ganancias[nombre]} fichas! 🎉
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mesa de apuestas */}
        {estado.estado === 'apostando' && (
          <div style={styles.mesaApuestas}>
            <div style={styles.mesaTitle}>Mesa de Apuestas</div>

            {/* Tipo de apuesta */}
            <div style={styles.tipoApuestaContainer}>
              <button
                style={{
                  ...styles.btnTipoApuesta,
                  background: tipoApuesta === 'numero' ? '#d4af37' : '#1a1a1a',
                }}
                onClick={() => { setTipoApuesta('numero'); setValorApuesta(''); }}
              >
                Número (35x)
              </button>
              <button
                style={{
                  ...styles.btnTipoApuesta,
                  background: tipoApuesta === 'color' ? '#d4af37' : '#1a1a1a',
                }}
                onClick={() => { setTipoApuesta('color'); setValorApuesta(''); }}
              >
                Color (2x)
              </button>
              <button
                style={{
                  ...styles.btnTipoApuesta,
                  background: tipoApuesta === 'paridad' ? '#d4af37' : '#1a1a1a',
                }}
                onClick={() => { setTipoApuesta('paridad'); setValorApuesta(''); }}
              >
                Par/Impar (2x)
              </button>
              <button
                style={{
                  ...styles.btnTipoApuesta,
                  background: tipoApuesta === 'docena' ? '#d4af37' : '#1a1a1a',
                }}
                onClick={() => { setTipoApuesta('docena'); setValorApuesta(''); }}
              >
                Docena (3x)
              </button>
            </div>

            {/* Selector de valor según tipo */}
            {tipoApuesta === 'numero' && (
              <div style={styles.numerosGrid}>
                {Array.from({ length: NUMEROS_RULETA }, (_, i) => (
                  <button
                    key={i}
                    style={{
                      ...styles.btnNumero,
                      background: i === 0 ? '#0a5a0a' : NUMEROS_ROJOS.includes(i) ? '#8b0000' : '#000',
                      border: valorApuesta === i ? '3px solid #d4af37' : '1px solid #333',
                    }}
                    onClick={() => setValorApuesta(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>
            )}

            {tipoApuesta === 'color' && (
              <div style={styles.opcionesGrid}>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === 'rojo' ? '#8b0000' : '#1a1a1a',
                    border: valorApuesta === 'rojo' ? '3px solid #d4af37' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('rojo')}
                >
                  🔴 Rojo
                </button>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === 'negro' ? '#000' : '#1a1a1a',
                    border: valorApuesta === 'negro' ? '3px solid #d4af37' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('negro')}
                >
                  ⚫ Negro
                </button>
              </div>
            )}

            {tipoApuesta === 'paridad' && (
              <div style={styles.opcionesGrid}>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === 'par' ? '#d4af37' : '#1a1a1a',
                    border: valorApuesta === 'par' ? '3px solid #fff' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('par')}
                >
                  Par
                </button>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === 'impar' ? '#d4af37' : '#1a1a1a',
                    border: valorApuesta === 'impar' ? '3px solid #fff' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('impar')}
                >
                  Impar
                </button>
              </div>
            )}

            {tipoApuesta === 'docena' && (
              <div style={styles.opcionesGrid}>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === '1-12' ? '#d4af37' : '#1a1a1a',
                    border: valorApuesta === '1-12' ? '3px solid #fff' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('1-12')}
                >
                  1-12
                </button>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === '13-24' ? '#d4af37' : '#1a1a1a',
                    border: valorApuesta === '13-24' ? '3px solid #fff' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('13-24')}
                >
                  13-24
                </button>
                <button
                  style={{
                    ...styles.btnOpcion,
                    background: valorApuesta === '25-36' ? '#d4af37' : '#1a1a1a',
                    border: valorApuesta === '25-36' ? '3px solid #fff' : '1px solid #333',
                  }}
                  onClick={() => setValorApuesta('25-36')}
                >
                  25-36
                </button>
              </div>
            )}

            {/* Monto */}
            <div style={styles.montoContainer}>
              <div style={styles.montoLabel}>Monto:</div>
              <div style={styles.montoButtons}>
                {[10, 25, 50, 100].map(m => (
                  <button
                    key={m}
                    style={{
                      ...styles.btnMonto,
                      background: montoApuesta === m ? '#d4af37' : '#1a1a1a',
                    }}
                    onClick={() => setMontoApuesta(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="number"
                style={styles.inputMonto}
                value={montoApuesta}
                onChange={e => setMontoApuesta(Number(e.target.value) || 0)}
                min={1}
                max={jugador.fichas}
              />
            </div>

            {/* Botón apostar */}
            <button
              style={{
                ...styles.btnApostar,
                opacity: valorApuesta === '' ? 0.5 : 1,
              }}
              onClick={handleApostar}
              disabled={valorApuesta === ''}
            >
              Apostar {montoApuesta} fichas
            </button>

            {error && <div style={styles.errorMsg}>{error}</div>}

            {/* Mis apuestas */}
            {jugador.apuestas.length > 0 && (
              <div style={styles.misApuestas}>
                <div style={styles.misApuestasTitle}>Mis apuestas:</div>
                {jugador.apuestas.map((ap, idx) => (
                  <div key={idx} style={styles.apuestaItem}>
                    {ap.tipo === 'numero' && `Número ${ap.valor}`}
                    {ap.tipo === 'color' && `Color ${ap.valor}`}
                    {ap.tipo === 'paridad' && ap.valor}
                    {ap.tipo === 'docena' && `Docena ${ap.valor}`}
                    {' '}- {ap.monto} fichas
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones de control */}
        {estado.estado === 'apostando' && esHost && (
          <div style={styles.controlContainer}>
            <button
              style={{
                ...styles.btnGirar,
                opacity: todosApostaron ? 1 : 0.5,
              }}
              onClick={handleGirar}
              disabled={!todosApostaron || girando}
            >
              {todosApostaron ? '🎰 Girar Ruleta' : 'Esperando apuestas...'}
            </button>
          </div>
        )}

        {estado.estado === 'girando' && (
          <div style={styles.controlContainer}>
            <div style={styles.girandoText}>🎰 Girando...</div>
          </div>
        )}

        {estado.estado === 'resultado' && esHost && (
          <div style={styles.controlContainer}>
            <button style={styles.btnNuevaRonda} onClick={handleNuevaRonda}>
              Nueva Ronda
            </button>
          </div>
        )}

        {/* Jugadores */}
        <div style={styles.jugadoresContainer}>
          <div style={styles.jugadoresTitle}>Jugadores:</div>
          {Object.values(estado.jugadores).map((jug, idx) => (
            <div key={idx} style={styles.jugadorItem}>
              <span style={{ fontWeight: jug.nombre === nombre ? 700 : 400 }}>
                {jug.nombre} {jug.nombre === nombre && '(Tú)'}
              </span>
              <span style={{ color: '#d4af37' }}>💰 {jug.fichas}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  fullPage: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    background: '#0a0a0a',
    fontFamily: "'Courier New', monospace",
    overflow: 'auto',
    userSelect: 'none',
  },
  casinoBg: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, #1a0a0a 0%, #0a0a0a 100%)',
    opacity: 0.3,
    zIndex: 0,
  },
  lobbyCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)',
    border: '2px solid #d4af37',
    borderRadius: 16,
    padding: '36px 28px',
    width: '90%',
    maxWidth: 360,
    margin: '50px auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    zIndex: 10,
    boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 48,
    fontWeight: 900,
    color: '#d4af37',
    textAlign: 'center',
    letterSpacing: 8,
    textShadow: '0 0 20px rgba(212, 175, 55, 0.8)',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -8,
    marginBottom: 8,
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
    color: '#000',
    border: 'none',
    borderRadius: 10,
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
  },
  btnSecondary: {
    background: '#1a1a1a',
    color: '#d4af37',
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
    textAlign: 'center',
  },
  errorMsg: {
    background: '#3a1a1a',
    color: '#ff6b6b',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    textAlign: 'center',
  },
  salaContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
    margin: '0 auto',
    padding: '20px',
    zIndex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)',
    border: '1px solid #d4af37',
    borderRadius: 10,
  },
  codigoDisplay: {
    fontSize: 18,
    fontWeight: 700,
    color: '#d4af37',
    letterSpacing: 4,
  },
  fichasDisplay: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
  },
  ruletaContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    margin: '0 auto 30px',
    aspectRatio: '1/1',
  },
  ruletaWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  ruleta: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '8px solid #d4af37',
    background: '#0a0a0a',
    overflow: 'hidden',
    boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
  },
  numeroRuleta: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: '50%',
    height: '50%',
    transformOrigin: '0% 100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '8%',
    fontSize: 14,
    fontWeight: 700,
    border: '1px solid #333',
  },
  ruletaFlecha: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 32,
    color: '#d4af37',
    textShadow: '0 0 10px rgba(212, 175, 55, 0.8)',
    zIndex: 10,
  },
  resultadoDisplay: {
    marginTop: 20,
    textAlign: 'center',
  },
  resultadoNumero: {
    fontSize: 64,
    fontWeight: 900,
    color: '#d4af37',
    textShadow: '0 0 20px rgba(212, 175, 55, 0.8)',
  },
  gananciaDisplay: {
    fontSize: 24,
    fontWeight: 700,
    color: '#4ECDC4',
    marginTop: 10,
  },
  mesaApuestas: {
    background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)',
    border: '2px solid #d4af37',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  mesaTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#d4af37',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipoApuestaContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
    marginBottom: 16,
  },
  btnTipoApuesta: {
    padding: '10px',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  numerosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 4,
    marginBottom: 16,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  btnNumero: {
    aspectRatio: '1/1',
    border: '1px solid #333',
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  opcionesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 8,
    marginBottom: 16,
  },
  btnOpcion: {
    padding: '12px',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  montoContainer: {
    marginBottom: 16,
  },
  montoLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  montoButtons: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  },
  btnMonto: {
    flex: 1,
    padding: '8px',
    border: '1px solid #333',
    borderRadius: 6,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  inputMonto: {
    width: '100%',
    padding: '10px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 6,
    color: '#fff',
    fontSize: 16,
    outline: 'none',
  },
  btnApostar: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#000',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 16,
  },
  misApuestas: {
    marginTop: 16,
    padding: '12px',
    background: '#1a1a1a',
    borderRadius: 8,
    border: '1px solid #333',
  },
  misApuestasTitle: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  apuestaItem: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  controlContainer: {
    textAlign: 'center',
    marginBottom: 20,
  },
  btnGirar: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#000',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
  },
  girandoText: {
    fontSize: 24,
    fontWeight: 700,
    color: '#d4af37',
    textShadow: '0 0 10px rgba(212, 175, 55, 0.8)',
  },
  btnNuevaRonda: {
    padding: '14px 28px',
    background: '#1a1a1a',
    border: '2px solid #d4af37',
    borderRadius: 10,
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  jugadoresContainer: {
    background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)',
    border: '1px solid #333',
    borderRadius: 12,
    padding: '16px',
  },
  jugadoresTitle: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
  },
  jugadorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
};

export default RuletaView;
