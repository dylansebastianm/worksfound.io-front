'use client';

import { useState, useEffect, useRef } from 'react';
import LoginForm from '../components/Forms/LoginForm/LoginForm';
import RegisterForm from '../components/Forms/RegisterForm/RegisterForm';
import Input from '../components/UI/Input/Input';
import { FaLinkedin, FaPlay, FaStop } from 'react-icons/fa';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null);
  const [linkedinEmail, setLinkedinEmail] = useState('');
  const [linkedinPassword, setLinkedinPassword] = useState('');
  const [isLinkedinLogin, setIsLinkedinLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado para saber si el usuario está logueado en worksfound
  const [userId, setUserId] = useState<string | null>(null); // ID del usuario logueado
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false); // Estado para saber si LinkedIn está realmente vinculado
  const [isScraping, setIsScraping] = useState(false); // Estado para saber si se está realizando el scraping
  const [isAutoApplyRunning, setIsAutoApplyRunning] = useState(false); // Estado para saber si auto-apply está activo
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoApplyStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Función para verificar el estado de conexión de LinkedIn
  const checkLinkedinConnection = async (user_id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/linkedin/connection-status?user_id=${user_id}`);
      const data = await response.json();
      
      if (data.is_connected) {
        setIsLinkedinConnected(true);
        return data;
      } else {
        setIsLinkedinConnected(false);
        return data;
      }
    } catch (error) {
      console.error('Error verificando conexión de LinkedIn:', error);
      setIsLinkedinConnected(false);
      return null;
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setStatus({ message: 'Iniciando sesión...', type: 'info' });

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          message: '✓✓✓ ¡Bienvenido! Sesión iniciada correctamente.', 
          type: 'success' 
        });
        setIsAuthenticated(true);
        // Asegurarse de usar el ID numérico del usuario, no el email
        const user_id = data.user?.id || data.user_id || email;
        setUserId(user_id.toString()); // Guardar el user_id del usuario logueado (convertir a string)
        
        // Verificar si LinkedIn está conectado
        checkLinkedinConnection(user_id);
        
        setIsLoading(false);
      } else {
        setStatus({ message: `Error: ${data.error}`, type: 'error' });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      setStatus({ message: 'Error conectando con el servidor', type: 'error' });
      setIsLoading(false);
    }
  };

  const handleIngestJobs = async () => {
    if (!userId) {
      setStatus({ 
        message: 'Error: No se encontró el ID de usuario', 
        type: 'error' 
      });
      return;
    }

    setIsScraping(true);
    setStatus({ 
      message: '⏳ Iniciando ingesta de ofertas...', 
      type: 'info' 
    });

    try {
      const response = await fetch(`${API_URL}/api/jobs/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          url: 'https://www.linkedin.com/jobs/search/?currentJobId=4337151097&distance=25&f_AL=true&f_TPR=r2592000&geoId=100446943&keywords=fullstack%20developer&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true',
          max_jobs: 5
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          message: `✓✓✓ Ingesta completada: ${data.jobs_saved} ofertas guardadas en la base de datos`, 
          type: 'success' 
        });
        
        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          setStatus(null);
        }, 5000);
      } else {
        setStatus({ 
          message: `Error: ${data.error}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error realizando ingesta:', error);
      setStatus({ 
        message: 'Error conectando con el servidor para realizar la ingesta', 
        type: 'error' 
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleToggleAutoApply = async () => {
    if (!userId) {
      setStatus({ 
        message: 'Error: No se encontró el ID de usuario', 
        type: 'error' 
      });
      return;
    }

    const newState = !isAutoApplyRunning;

    try {
      const response = await fetch(`${API_URL}/api/auto-apply/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          enabled: newState
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAutoApplyRunning(newState);
        setStatus({ 
          message: newState ? '🚀 Auto-apply activado' : '⏹️ Auto-apply detenido', 
          type: newState ? 'info' : 'success' 
        });
        
        // Si se activó, empezar a verificar el estado periódicamente
        if (newState) {
          startAutoApplyStatusPolling();
        } else {
          // Si se detuvo, limpiar el polling
          if (autoApplyStatusIntervalRef.current) {
            clearInterval(autoApplyStatusIntervalRef.current);
            autoApplyStatusIntervalRef.current = null;
          }
        }
      } else {
        setStatus({ 
          message: `Error: ${data.error}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error toggling auto-apply:', error);
      setStatus({ 
        message: 'Error conectando con el servidor', 
        type: 'error' 
      });
    }
  };

  const startAutoApplyStatusPolling = () => {
    // Limpiar polling anterior si existe
    if (autoApplyStatusIntervalRef.current) {
      clearInterval(autoApplyStatusIntervalRef.current);
    }

    // Polling cada 3 segundos para verificar el estado
    autoApplyStatusIntervalRef.current = setInterval(async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_URL}/api/auto-apply/status?user_id=${userId}`);
        const data = await response.json();

        if (data.success) {
          setIsAutoApplyRunning(data.is_running);
          
          // Si se detuvo, limpiar el polling
          if (!data.is_running && autoApplyStatusIntervalRef.current) {
            clearInterval(autoApplyStatusIntervalRef.current);
            autoApplyStatusIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error verificando estado de auto-apply:', error);
      }
    }, 3000);
  };

  // Verificar estado de auto-apply al cargar si LinkedIn está conectado
  useEffect(() => {
    if (isLinkedinConnected && userId) {
      // Verificar estado inicial
      fetch(`${API_URL}/api/auto-apply/status?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsAutoApplyRunning(data.is_running);
            if (data.is_running) {
              startAutoApplyStatusPolling();
            }
          }
        })
        .catch(err => console.error('Error verificando estado inicial de auto-apply:', err));
    }

    return () => {
      if (autoApplyStatusIntervalRef.current) {
        clearInterval(autoApplyStatusIntervalRef.current);
      }
    };
  }, [isLinkedinConnected, userId]);

  const handleRegister = async (email: string, password: string, phone: string, country: string, city: string) => {
    setIsLoading(true);
    setStatus({ message: 'Registrando cuenta...', type: 'info' });

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, phone, country, city }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          message: '✓✓✓ ¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.', 
          type: 'success' 
        });
        // Cambiar a formulario de login después de 2 segundos
        setTimeout(() => {
          setIsLogin(true);
          setStatus(null);
        }, 2000);
        setIsLoading(false);
      } else {
        setStatus({ message: `Error: ${data.error}`, type: 'error' });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error registrándose:', error);
      setStatus({ message: 'Error conectando con el servidor', type: 'error' });
      setIsLoading(false);
    }
  };

  const handleLinkedinLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setStatus({ message: 'Abriendo ventana de login de LinkedIn...', type: 'info' });

    try {
      const response = await fetch(`${API_URL}/api/linkedin/start-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          user_id: userId || email, // Usar el user_id del usuario logueado
        }),
      });

      const data = await response.json();

      if (data.success && data.session_id) {
        setLoginSessionId(data.session_id);
        setStatus({ 
          message: '✓ Ventana abierta. Por favor, completa el login en la ventana del navegador (incluyendo el reCAPTCHA si aparece).', 
          type: 'info' 
        });
        
        // Empezar a hacer polling inmediatamente (cada 2 segundos)
        // El backend capturará las cookies automáticamente cuando detecte li_at
        // El polling verificará cada 2 segundos si el estado cambió a 'completed'
        startPollingLoginStatus(data.session_id);
      } else {
        setStatus({ message: `Error: ${data.error}`, type: 'error' });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error iniciando login de LinkedIn:', error);
      setStatus({ message: 'Error conectando con el servidor', type: 'error' });
      setIsLoading(false);
    }
  };

  const startPollingLoginStatus = (sessionId: string) => {
    // Limpiar polling anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Polling cada 2 segundos para detectar rápidamente cuando las cookies se capturen
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/linkedin/check-login-status?session_id=${sessionId}`);
        const data = await response.json();

        // Si la sesión no se encuentra, puede ser que el login se completó y la sesión fue eliminada
        if (!data.success && data.error === 'Sesión no encontrada') {
          // Detener el polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Verificar si LinkedIn está conectado (puede que se haya guardado antes de eliminar la sesión)
          if (userId) {
            const connectionData = await checkLinkedinConnection(userId);
            if (connectionData && connectionData.is_connected) {
              setIsLinkedinConnected(true);
              setStatus({ 
                message: '✓✓✓ Vinculado LinkedIn - Tu cuenta está conectada y lista para auto-aplicar.', 
                type: 'success' 
              });
            } else {
              setStatus({ 
                message: 'El login se completó pero no se pudo verificar la conexión. Por favor, intenta vincular nuevamente.', 
                type: 'error' 
              });
            }
          } else {
            setStatus({ 
              message: 'El login se completó pero no se pudo verificar la conexión. Por favor, intenta vincular nuevamente.', 
              type: 'error' 
            });
          }
          
          setIsLoading(false);
          setLoginSessionId(null);
          setIsLinkedinLogin(false);
          return;
        }

        if (data.status === 'completed') {
          // Login exitoso - Cookies capturadas y guardadas
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setIsLinkedinConnected(true); // Marcar LinkedIn como conectado
          setIsLoading(false);
          setLoginSessionId(null);
          setIsLinkedinLogin(false); // Volver a la vista principal
          setStatus(null); // Limpiar el status inmediatamente
          
          // Verificar el estado de conexión para asegurarse
          if (userId) {
            checkLinkedinConnection(userId);
          }
        } else if (data.status === 'waiting') {
          // Cookies aún no capturadas - NO hacer nada, solo esperar
          // El backend está capturando las cookies automáticamente
          // No actualizar el estado, solo seguir esperando silenciosamente
          return;
        } else if (data.status === 'timeout' || data.status === 'error') {
          // Error o timeout
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setStatus({ message: `Error: ${data.error || 'Tiempo de espera agotado'}`, type: 'error' });
          setIsLoading(false);
          setLoginSessionId(null);
        }
        // Si está 'pending' o 'in_progress', seguir esperando
      } catch (error) {
        console.error('Error verificando estado de login:', error);
        // Detener el polling si hay un error de red
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setStatus({ message: 'Error conectando con el servidor', type: 'error' });
        setIsLoading(false);
        setLoginSessionId(null);
      }
    }, 2000); // Polling cada 2 segundos para detectar rápidamente cuando las cookies se capturen
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {!isAuthenticated ? (
          // Mostrar formularios de login/registro si NO está autenticado
          <>
            {isLogin ? (
              <LoginForm
                onLogin={handleLogin}
                onSwitchToRegister={() => setIsLogin(false)}
                isLoading={isLoading}
              />
            ) : (
              <RegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => setIsLogin(true)}
                isLoading={isLoading}
              />
            )}

            {status && (
              <div className={`${styles.status} ${styles[status.type]}`}>
                {status.message}
              </div>
            )}
          </>
        ) : !isLinkedinLogin ? (
          // Mostrar opción de vincular LinkedIn si está autenticado pero no está en el flujo de LinkedIn
          <>
            {status && (
              <div className={`${styles.status} ${styles[status.type]}`}>
                {status.message}
              </div>
            )}

            {/* Mostrar carta de LinkedIn conectado o botón para vincular */}
            {isLinkedinConnected ? (
              <div className={styles.linkedinCard}>
                <div className={styles.linkedinCardHeader}>
                  <div className={styles.linkedinCardLogo}>
                    <FaLinkedin />
                  </div>
                  <div className={styles.linkedinCardContent}>
                    <span className={styles.linkedinCardStatus}>Conectado</span>
                  </div>
                  <div className={styles.linkedinCardActions}>
                    <button
                      className={styles.autoApplyButton}
                      onClick={handleToggleAutoApply}
                      disabled={!userId}
                      title={isAutoApplyRunning ? 'Detener auto-apply' : 'Activar auto-apply'}
                    >
                      {isAutoApplyRunning ? <FaStop /> : <FaPlay />}
                    </button>
                    <button
                      className={styles.linkedinCardDisconnect}
                      onClick={() => {
                        // Por ahora sin funcionalidad
                        console.log('Desconectar LinkedIn (funcionalidad pendiente)');
                      }}
                      title="Desconectar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <button
                  className={styles.ingestButton}
                  onClick={handleIngestJobs}
                  disabled={isScraping || !userId}
                >
                  {isScraping ? 'Ingestando...' : 'Realizar ingesta'}
                </button>
              </div>
            ) : (
              <div className={styles.linkedinSection}>
                <button
                  onClick={() => {
                    setIsLinkedinLogin(true);
                    setStatus(null); // Limpiar el mensaje de bienvenida al entrar al formulario de LinkedIn
                  }}
                  className={styles.linkedinButton}
                  disabled={isLoading}
                >
                  <FaLinkedin /> Vincular cuenta de LinkedIn
                </button>
              </div>
            )}
          </>
        ) : (
          // Mostrar formulario de vinculación de LinkedIn
          <div className={styles.linkedinLoginContainer}>
            <div className={styles.logo}>
              <FaLinkedin />
            </div>
            <h1 className={styles.title}>Vincular LinkedIn</h1>
            <p className={styles.subtitle}>
              Ingresa tus credenciales de LinkedIn para vincular tu cuenta
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (linkedinEmail && linkedinPassword) {
                  handleLinkedinLogin(linkedinEmail, linkedinPassword);
                }
              }}
              className={styles.form}
            >
              <Input
                type="email"
                id="linkedin-email"
                name="linkedin-email"
                value={linkedinEmail}
                onChange={(e) => setLinkedinEmail(e.target.value)}
                label="Email de LinkedIn"
                required
                disabled={isLoading || loginSessionId !== null}
              />
              
              <Input
                type="password"
                id="linkedin-password"
                name="linkedin-password"
                value={linkedinPassword}
                onChange={(e) => setLinkedinPassword(e.target.value)}
                label="Contraseña de LinkedIn"
                required
                disabled={isLoading || loginSessionId !== null}
              />
              {loginSessionId && (
                <div className={styles.waitingMessage}>
                  <p>⏳ Esperando a que completes el login en la ventana del navegador...</p>
                  <p className={styles.smallText}>
                    Si aparece un reCAPTCHA, resuélvelo en esa ventana. 
                    La ventana se cerrará automáticamente cuando el login se complete.
                  </p>
                </div>
              )}
              {isLinkedinConnected && (
                <div className={styles.authenticatedMessage}>
                  <p>✅ Vinculado LinkedIn</p>
                  <p className={styles.smallText}>
                    Tu cuenta está conectada y lista para auto-aplicar.
                  </p>
                </div>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || loginSessionId !== null}
              >
                {isLoading || loginSessionId 
                  ? 'Procesando...' 
                  : 'Vincular LinkedIn'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLinkedinLogin(false);
                  setLinkedinEmail('');
                  setLinkedinPassword('');
                  setStatus(null);
                  setLoginSessionId(null);
                }}
                className={styles.cancelBtn}
                disabled={isLoading || loginSessionId !== null}
              >
                Cancelar
              </button>
              {status && status.type !== 'success' && (
                <div className={`${styles.status} ${styles[status.type]}`}>
                  {status.message}
                </div>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
