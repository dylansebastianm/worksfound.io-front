'use client';

import { useState } from 'react';
import Button from '../../UI/Button/Button';
import Input from '../../UI/Input/Input';
import styles from '../LoginForm/LoginForm.module.css';

interface RegisterFormProps {
  onRegister: (email: string, password: string, phone: string, country: string, city: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export default function RegisterForm({ onRegister, onSwitchToLogin, isLoading = false }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword || !phone || !country || !city) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await onRegister(email, password, phone, country, city);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.title}>Crea tu cuenta</h1>

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
          autoComplete="new-password"
          disabled={isLoading}
        />

        <Input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          label="Confirmar contraseña"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />

        <Input
          type="tel"
          id="phone"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          label="Teléfono"
          required
          autoComplete="tel"
          disabled={isLoading}
        />

        <Input
          type="text"
          id="country"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          label="País"
          required
          autoComplete="country"
          disabled={isLoading}
        />

        <Input
          type="text"
          id="city"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          label="Ciudad"
          required
          autoComplete="address-level2"
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
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </Button>

        <div className={styles.switchForm}>
          <p>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className={styles.linkButton}
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

