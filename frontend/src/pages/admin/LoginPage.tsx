import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #E8F5E9 0%, #E3F2FD 50%, #F3E5F5 100%)',
    direction: 'rtl' as const,
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '48px 40px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    width: '100%',
    maxWidth: '420px',
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logoG: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#4CAF50',
  },
  logoMath: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#1565C0',
  },
  subtitle: {
    color: '#555770',
    fontSize: '14px',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A2E',
  },
  input: {
    padding: '12px 16px',
    border: '1.5px solid #E8E8EE',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    transition: '0.25s',
    direction: 'ltr' as const,
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #4CAF50, #1565C0)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: '0.25s',
    marginTop: '8px',
  },
  error: {
    color: '#d32f2f',
    background: '#FFEBEE',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('שגיאה בהתחברות — בדוק אימייל וסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div>
            <span style={styles.logoG}>G</span>
            <span style={styles.logoMath}>Math</span>
          </div>
          <div style={styles.subtitle}>כניסת מנהל</div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <label style={styles.label}>
            אימייל
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmath.co.il"
              required
              autoFocus
            />
          </label>

          <label style={styles.label}>
            סיסמה
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  );
}
