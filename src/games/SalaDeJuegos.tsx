/**
 * SalaDeJuegos.tsx — Vista de sala de juegos con mesas visuales
 * Ruleta de pie, mesa ping pong, mesa cartas, mesa grande
 */
import React from 'react';
import { useAuth } from '../auth/AuthContext';

interface SalaDeJuegosProps {
  onSeleccionarJuego: (juego: string) => void;
}

export function SalaDeJuegos({ onSeleccionarJuego }: SalaDeJuegosProps) {
  const { usuario } = useAuth();

  return (
    <div style={styles.container}>
      {/* Fondo de sala */}
      <div style={styles.background}>
        <div style={styles.floor} />
        <div style={styles.walls} />
        <div style={styles.ceiling} />
      </div>

      {/* Título */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎮 SALA DE JUEGOS</h1>
        <div style={styles.subtitle}>Bienvenido, {usuario?.nombre || 'Jugador'}</div>
      </div>

      {/* Mesas */}
      <div style={styles.mesasContainer}>
        {/* Ruleta de pie */}
        <div style={styles.mesaContainer}>
          <div className="mesa-hover" style={styles.ruletaMesa} onClick={() => onSeleccionarJuego('ruleta')}>
            <div style={styles.ruletaBase} />
            <div style={styles.ruletaRueda}>
              <div style={styles.ruletaCentro}>🎰</div>
            </div>
            <div style={styles.mesaLabel}>RULETA</div>
          </div>
        </div>

        {/* Mesa Ping Pong */}
        <div style={styles.mesaContainer}>
          <div className="mesa-hover" style={styles.pingPongMesa} onClick={() => onSeleccionarJuego('pong')}>
            <div style={styles.pingPongNet} />
            <div style={styles.mesaLabel}>PING PONG</div>
          </div>
        </div>

        {/* Mesa Cartas (Poker/Blackjack) */}
        <div style={styles.mesaContainer}>
          <div className="mesa-hover" style={styles.cartasMesa} onClick={() => onSeleccionarJuego('poker')}>
            <div style={styles.cartasFelt} />
            <div style={styles.cartasIcon}>🃏</div>
            <div style={styles.mesaLabel}>POKER / BLACKJACK</div>
          </div>
        </div>

        {/* Mesa Grande (Trivial, Generala, Dominó, Batalla Naval) */}
        <div style={styles.mesaContainer}>
          <div className="mesa-hover" style={styles.mesaGrande} onClick={() => onSeleccionarJuego('menu-grande')}>
            <div style={styles.mesaGrandeTop} />
            <div style={styles.mesaGrandeIcon}>🎲</div>
            <div style={styles.mesaLabel}>TRIVIAL • GENERALA • DOMINÓ • BATALLA</div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div style={styles.instructions}>
        Haz clic en una mesa para jugar
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  background: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  floor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%)',
    boxShadow: 'inset 0 10px 50px rgba(0, 0, 0, 0.5)',
  },
  walls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    background: 'linear-gradient(180deg, #0f1419 0%, #1a1a2e 100%)',
  },
  ceiling: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
    background: 'radial-gradient(ellipse at center, #2a2a3e 0%, #0f1419 100%)',
    boxShadow: 'inset 0 -20px 50px rgba(0, 0, 0, 0.3)',
  },
  header: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 'clamp(32px, 6vw, 64px)',
    fontWeight: 900,
    color: '#FF6B35',
    textShadow: '0 0 20px #FF6B35, 0 0 40px #FF6B35',
    letterSpacing: '0.2em',
    marginBottom: 8,
    fontFamily: "'Courier New', monospace",
  },
  subtitle: {
    fontSize: 'clamp(14px, 2vw, 20px)',
    color: '#4ECDC4',
    textShadow: '0 0 10px #4ECDC4',
    letterSpacing: '0.1em',
  },
  mesasContainer: {
    position: 'relative',
    zIndex: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 40,
    maxWidth: '1400px',
    width: '100%',
    marginTop: 20,
  },
  mesaContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Ruleta de pie
  ruletaMesa: {
    position: 'relative',
    width: 200,
    height: 280,
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  ruletaBase: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 40,
    background: 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
    borderRadius: '8px 8px 0 0',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  ruletaRueda: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 180,
    height: 180,
    background: 'radial-gradient(circle, #1a1a1a 0%, #0a0a0a 100%)',
    borderRadius: '50%',
    border: '8px solid #FF6B35',
    boxShadow: '0 0 30px #FF6B35, inset 0 0 30px rgba(255, 107, 53, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruletaCentro: {
    fontSize: 48,
    filter: 'drop-shadow(0 0 10px #FF6B35)',
  },
  // Mesa Ping Pong
  pingPongMesa: {
    position: 'relative',
    width: 280,
    height: 160,
    background: 'linear-gradient(135deg, #2d5016 0%, #1a3009 100%)',
    borderRadius: 12,
    border: '4px solid #8B4513',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  pingPongNet: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: 'translateY(-50%)',
    height: 4,
    background: 'linear-gradient(90deg, transparent 0%, #fff 20%, #fff 80%, transparent 100%)',
    borderTop: '2px solid #333',
    borderBottom: '2px solid #333',
  },
  // Mesa Cartas
  cartasMesa: {
    position: 'relative',
    width: 300,
    height: 200,
    background: 'linear-gradient(135deg, #0d5d1a 0%, #0a4a14 100%)',
    borderRadius: '50%',
    border: '6px solid #8B4513',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartasFelt: {
    position: 'absolute',
    inset: 6,
    background: 'radial-gradient(circle, #0d5d1a 0%, #0a4a14 100%)',
    borderRadius: '50%',
  },
  cartasIcon: {
    position: 'relative',
    zIndex: 2,
    fontSize: 64,
    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
  },
  // Mesa Grande
  mesaGrande: {
    position: 'relative',
    width: 400,
    height: 300,
    background: 'linear-gradient(135deg, #2d5016 0%, #1a3009 100%)',
    borderRadius: 20,
    border: '6px solid #8B4513',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mesaGrandeTop: {
    position: 'absolute',
    inset: 6,
    background: 'radial-gradient(ellipse at center, #2d5016 0%, #1a3009 100%)',
    borderRadius: 14,
  },
  mesaGrandeIcon: {
    position: 'relative',
    zIndex: 2,
    fontSize: 72,
    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
  },
  mesaLabel: {
    position: 'absolute',
    bottom: -30,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 700,
    textShadow: '0 0 10px #FF6B35',
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
    fontFamily: "'Courier New', monospace",
  },
  instructions: {
    position: 'relative',
    zIndex: 10,
    marginTop: 40,
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

// Agregar hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .mesa-hover:hover {
      transform: scale(1.05) translateY(-5px) !important;
    }
  `;
  document.head.appendChild(style);
}
