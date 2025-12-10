'use client';

import { useState } from 'react';
import Button from '../../UI/Button/Button';
import Input from '../../UI/Input/Input';
import Select from '../../UI/Select/Select';
import styles from '../LoginForm/LoginForm.module.css';

interface RegisterFormProps {
  onRegister: (
    email: string,
    password: string,
    phone: string,
    country: string,
    city: string,
    name: string,
    last_name: string,
    english: string,
    current_salary: number | null,
    desired_salary: number | null,
    years_experience: number | null,
    primary_education_institution: string,
    preferred_work_modality: string[],
    age: number | null,
    gender: string
  ) => Promise<void>;
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
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [english, setEnglish] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [desiredSalary, setDesiredSalary] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [primaryEducationInstitution, setPrimaryEducationInstitution] = useState('');
  const [preferredWorkModality, setPreferredWorkModality] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword || !phone || !country || !city || 
        !name || !lastName || !english || !age || !gender) {
      setError('Por favor, completa todos los campos requeridos');
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
      await onRegister(
        email,
        password,
        phone,
        country,
        city,
        name,
        lastName,
        english,
        currentSalary ? parseFloat(currentSalary) : null,
        desiredSalary ? parseFloat(desiredSalary) : null,
        yearsExperience ? parseInt(yearsExperience) : null,
        primaryEducationInstitution,
        preferredWorkModality,
        age ? parseInt(age) : null,
        gender
      );
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

        <Input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="Nombre"
          required
          autoComplete="given-name"
          disabled={isLoading}
        />

        <Input
          type="text"
          id="lastName"
          name="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          label="Apellido"
          required
          autoComplete="family-name"
          disabled={isLoading}
        />

        <Select
          id="english"
          name="english"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          label="Nivel de Inglés"
          required
          disabled={isLoading}
          options={[
            { value: 'A1', label: 'A1 - Principiante' },
            { value: 'A2', label: 'A2 - Básico' },
            { value: 'B1', label: 'B1 - Intermedio' },
            { value: 'B2', label: 'B2 - Intermedio Alto' },
            { value: 'C1', label: 'C1 - Avanzado' },
            { value: 'C2', label: 'C2 - Nativo' },
          ]}
        />

        <Input
          type="number"
          id="currentSalary"
          name="currentSalary"
          value={currentSalary}
          onChange={(e) => setCurrentSalary(e.target.value)}
          label="Salario Actual (opcional)"
          autoComplete="off"
          disabled={isLoading}
        />

        <Input
          type="number"
          id="desiredSalary"
          name="desiredSalary"
          value={desiredSalary}
          onChange={(e) => setDesiredSalary(e.target.value)}
          label="Salario Pretendido (opcional)"
          autoComplete="off"
          disabled={isLoading}
        />

        <Input
          type="number"
          id="yearsExperience"
          name="yearsExperience"
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          label="Años de Experiencia (opcional)"
          autoComplete="off"
          disabled={isLoading}
        />

        <Input
          type="text"
          id="primaryEducationInstitution"
          name="primaryEducationInstitution"
          value={primaryEducationInstitution}
          onChange={(e) => setPrimaryEducationInstitution(e.target.value)}
          label="Instituto de Estudio Principal (opcional)"
          autoComplete="organization"
          disabled={isLoading}
        />

        <Select
          id="preferredWorkModality"
          name="preferredWorkModality"
          value={preferredWorkModality}
          onChange={(e: any) => {
            const values = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
            setPreferredWorkModality(values);
          }}
          label="Modalidad de Preferencia (opcional, puedes seleccionar múltiples)"
          disabled={isLoading}
          multiple
          options={[
            { value: 'on-site', label: 'Presencial (On-site)' },
            { value: 'remote', label: 'Remoto (Remote)' },
            { value: 'hybrid', label: 'Híbrido (Hybrid)' },
          ]}
        />

        <Input
          type="number"
          id="age"
          name="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          label="Edad"
          required
          autoComplete="off"
          disabled={isLoading}
        />

        <Select
          id="gender"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          label="Género"
          required
          disabled={isLoading}
          options={[
            { value: 'male', label: 'Masculino' },
            { value: 'female', label: 'Femenino' },
          ]}
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

