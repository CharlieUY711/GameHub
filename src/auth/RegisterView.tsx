/**
 * RegisterView.tsx — Pantalla de registro
 * Nombre, email, password, perfil (adulto/junior), PIN parental, avatar
 */
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const AVATARES = ['🎮', '🏆', '🎯', '🎲', '🃏', '♟️', '🎳', '🎪'];

export function RegisterView({ onVolver }: { onVolver?: () => void }) {
  const { registrar, buscarUsuarioPorNombre, error } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState<'adulto' | 'junior'>('adulto');
  const [pinParental, setPinParental] = useState('');
  const [nombreAdulto, setNombreAdulto] = useState('');
  const [adultoEncontrado, setAdultoEncontrado] = useState<any>(null);
  const [avatar, setAvatar] = useState('🎮');
  const [cargando, setCargando] = useState(false);
  const [buscandoAdulto, setBuscandoAdulto] = useState(false);

  const handleBuscarAdulto = async () => {
    if (!nombreAdulto) return;
    setBuscandoAdulto(true);
    try {
      const adulto = await buscarUsuarioPorNombre(nombreAdulto);
      setAdultoEncontrado(adulto);
      if (!adulto) {
        alert('No se encontró un usuario adulto con ese nombre');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscandoAdulto(false);
    }
  };

  const handleRegistrar = async () => {
    if (!nombre || !email || !password) {
      alert('Completa todos los campos');
      return;
    }

    if (perfil === 'junior') {
      if (!pinParental || pinParental.length !== 4) {
        alert('El PIN parental debe tener 4 dígitos');
        return;
      }
      if (!adultoEncontrado) {
        alert('Debes buscar y seleccionar un usuario adulto');
        return;
      }
    }

    setCargando(true);
    try {
      await registrar({
        nombre,
        email,
        password,
        perfil,
        pin_parental: perfil === 'junior' ? pinParental : undefined,
        creado_por: perfil === 'junior' ? adultoEncontrado.id : undefined,
        avatar,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logo}>🎮 GameHub</div>
      <div style={styles.subtitle}>Crear cuenta</div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.form}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={styles.input}
          disabled={cargando}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          disabled={cargando}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          disabled={cargando}
        />

        <div style={styles.perfilGroup}>
          <div style={styles.label}>Perfil:</div>
          <div style={styles.perfilButtons}>
            <button
              style={{
                ...styles.perfilButton,
                ...(perfil === 'adulto' ? styles.perfilButtonActive : {}),
              }}
              onClick={() => setPerfil('adulto')}
              disabled={cargando}
            >
              👨 Adulto
            </button>
            <button
              style={{
                ...styles.perfilButton,
                ...(perfil === 'junior' ? styles.perfilButtonActive : {}),
              }}
              onClick={() => setPerfil('junior')}
              disabled={cargando}
            >
              👦 Junior
            </button>
          </div>
        </div>

        {perfil === 'junior' && (
          <>
            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="PIN parental (4 dígitos)"
                value={pinParental}
                onChange={(e) => setPinParental(e.target.value.replace(/\D/g, '').slice(0, 4))}
                style={styles.input}
                maxLength={4}
                inputMode="numeric"
                disabled={cargando}
              />
            </div>

            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Nombre del usuario adulto"
                value={nombreAdulto}
                onChange={(e) => setNombreAdulto(e.target.value)}
                style={styles.input}
                disabled={cargando}
              />
              <button
                style={styles.buttonBuscar}
                onClick={handleBuscarAdulto}
                disabled={cargando || buscandoAdulto || !nombreAdulto}
              >
                {buscandoAdulto ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {adultoEncontrado && (
              <div style={styles.adultoEncontrado}>
                ✅ Usuario encontrado: {adultoEncontrado.nombre} {adultoEncontrado.avatar}
              </div>
            )}
          </>
        )}

        <div style={styles.avatarGroup}>
          <div style={styles.label}>Avatar:</div>
          <div style={styles.avatarGrid}>
            {AVATARES.map((av) => (
              <button
                key={av}
                style={{
                  ...styles.avatarButton,
                  ...(avatar === av ? styles.avatarButtonActive : {}),
                }}
                onClick={() => setAvatar(av)}
                disabled={cargando}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        <button
          style={styles.buttonRegistrar}
          onClick={handleRegistrar}
          disabled={cargando}
        >
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>

        {onVolver && (
          <button
            style={styles.linkButton}
            onClick={onVolver}
            disabled={cargando}
          >
            Volver a iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Courier New', monospace",
  },
  logo: {
    fontSize: 48,
    fontWeight: 900,
    color: '#FF6B35',
    textAlign: 'center',
    letterSpacing: 8,
    textShadow: '0 0 40px #FF6B3560',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  error: {
    background: '#ff4444',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    maxWidth: 400,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  input: {
    width: '100%',
    height: 56,
    background: '#1a1a1a',
    border: '2px solid #333',
    borderRadius: 12,
    padding: '0 20px',
    fontSize: 16,
    color: '#fff',
    fontFamily: "'Courier New', monospace",
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  perfilGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    color: '#888',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  perfilButtons: {
    display: 'flex',
    gap: 12,
  },
  perfilButton: {
    flex: 1,
    height: 56,
    background: '#1a1a1a',
    border: '2px solid #333',
    borderRadius: 12,
    fontSize: 16,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  perfilButtonActive: {
    background: '#FF6B35',
    borderColor: '#FF6B35',
  },
  inputGroup: {
    display: 'flex',
    gap: 12,
  },
  buttonBuscar: {
    height: 56,
    padding: '0 24px',
    background: '#333',
    border: '2px solid #333',
    borderRadius: 12,
    fontSize: 16,
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  adultoEncontrado: {
    background: '#1a1a1a',
    border: '2px solid #4caf50',
    borderRadius: 12,
    padding: '12px 20px',
    color: '#4caf50',
    fontSize: 14,
    textAlign: 'center',
  },
  avatarGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  avatarButton: {
    height: 64,
    background: '#1a1a1a',
    border: '2px solid #333',
    borderRadius: 12,
    fontSize: 32,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  avatarButtonActive: {
    background: '#FF6B35',
    borderColor: '#FF6B35',
    transform: 'scale(1.1)',
  },
  buttonRegistrar: {
    width: '100%',
    height: 56,
    background: '#FF6B35',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 12,
  },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: '#FF6B35',
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'underline',
    marginTop: 12,
  },
};
