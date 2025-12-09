'use client';

import { useState } from 'react';
import Button from '../../UI/Button/Button';
import Input from '../../UI/Input/Input';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
}

export default function LoginForm({ onLogin, onSwitchToRegister, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.title}>Inicia sesión en tu cuenta</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Correo electrónico"
          required
          autoComplete="email"
          disabled={isLoading}
        />

        <Input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Contraseña"
          required
          autoComplete="current-password"
          disabled={isLoading}
        />

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>

        <div className={styles.switchForm}>
          <p>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className={styles.linkButton}
            >
              Regístrate
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

