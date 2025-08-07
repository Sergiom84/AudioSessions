// Reproductor Global Simplificado con soporte mejorado para Android
class SimpleAudioPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentSession = null;
        // Detección mejorada de dispositivos
        this.isAndroid = /Android/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0);
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                       'ontouchstart' in window;
        this.userInteracted = false;

        console.log('SimpleAudioPlayer - Dispositivo detectado:', {
            isAndroid: this.isAndroid,
            isIOS: this.isIOS,
            isMobile: this.isMobile,
            userAgent: navigator.userAgent
        });
        this.init();
    }

    init() {
        this.createPlayerUI();
        this.bindEvents();
        this.setupMobileSupport();
    }

    createPlayerUI() {
        // Ajustar UI para móviles
        const mobileStyles = this.isMobile ? `
            padding: 15px 10px;
            font-size: 14px;
        ` : `
            padding: 10px;
        `;

        const buttonSize = this.isMobile ? '44px' : '40px'; // Botones más grandes en móvil
        const volumeDisplay = this.isMobile ? 'none' : 'block'; // Ocultar volumen en móvil

        const playerHTML = `
            <div id="globalPlayer" style="position: fixed; bottom: 0; left: 0; right: 0; background: #111; color: white; z-index: 1000; display: none; ${mobileStyles}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img id="playerCover" src="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                    <div style="flex: 1; min-width: 0;">
                        <div id="playerTitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">No hay audio</div>
                        <div id="playerProgress" style="width: 100%; height: ${this.isMobile ? '6px' : '4px'}; background: #333; margin-top: 5px; border-radius: 3px; cursor: pointer;">
                            <div id="playerProgressBar" style="height: 100%; background: #00ff88; width: 0%; border-radius: 3px; transition: width 0.1s ease;"></div>
                        </div>
                    </div>
                    <button id="playPauseBtn" style="
                        background: #00ff88;
                        border: none;
                        padding: 10px;
                        cursor: pointer;
                        border-radius: 50%;
                        width: ${buttonSize};
                        height: ${buttonSize};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        touch-action: manipulation;
                        user-select: none;
                    ">▶️</button>
                    <input id="volumeSlider" type="range" min="0" max="1" step="0.1" value="0.7" style="width: 100px; display: ${volumeDisplay};">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', playerHTML);

        // Agregar evento click a la barra de progreso para seek
        document.getElementById('playerProgress').addEventListener('click', (e) => {
            if (this.audio && this.audio.duration) {
                const rect = e.target.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const newTime = percent * this.audio.duration;
                this.audio.currentTime = newTime;
                console.log('Seek a:', newTime, 'segundos');
            }
        });
    }

    bindEvents() {
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.setVolume(e.target.value));

        // Atajos de teclado básicos (solo para desktop)
        if (!this.isMobile) {
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.togglePlay();
                }
            });
        }
    }

    setupMobileSupport() {
        // Configurar eventos táctiles para móviles
        if (this.isMobile) {
            console.log('Configurando soporte móvil para:', this.isAndroid ? 'Android' : (this.isIOS ? 'iOS' : 'Móvil genérico'));

            // Detectar primera interacción del usuario (requerida para autoplay en móviles)
            const enableAudioContext = () => {
                this.userInteracted = true;
                console.log('Primera interacción del usuario detectada');
                document.removeEventListener('touchstart', enableAudioContext);
                document.removeEventListener('click', enableAudioContext);
            };

            document.addEventListener('touchstart', enableAudioContext, { once: true, passive: true });
            document.addEventListener('click', enableAudioContext, { once: true });

            // Eventos táctiles específicos para el botón de play/pause
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) {
                // Eventos touch para Android
                if (this.isAndroid) {
                    playPauseBtn.addEventListener('touchstart', (e) => {
                        console.log('Android: touchstart en play/pause');
                        e.target.style.transform = 'scale(0.95)';
                    }, { passive: true });

                    playPauseBtn.addEventListener('touchend', (e) => {
                        console.log('Android: touchend en play/pause');
                        e.target.style.transform = 'scale(1)';
                        e.preventDefault();
                        this.togglePlay();
                    }, { passive: false });
                }

                // Eventos touch para iOS
                if (this.isIOS) {
                    playPauseBtn.addEventListener('touchstart', (e) => {
                        console.log('iOS: touchstart en play/pause');
                        e.target.style.transform = 'scale(0.95)';
                    }, { passive: true });

                    playPauseBtn.addEventListener('touchend', (e) => {
                        console.log('iOS: touchend en play/pause');
                        e.target.style.transform = 'scale(1)';
                    }, { passive: true });
                }
            }
        }
    }

    loadSession(session) {
        if (!session.audio_url || session.audio_url === '#') return;

        console.log('Cargando sesión:', session.title, 'en dispositivo:', {
            isAndroid: this.isAndroid,
            isIOS: this.isIOS,
            userInteracted: this.userInteracted
        });

        this.currentSession = session;

        if (this.audio) {
            this.audio.pause();
            this.audio.removeEventListener('timeupdate', this.updateProgress);
            this.audio.removeEventListener('ended', this.onEnded);
        }

        // Crear nuevo elemento de audio con configuraciones específicas para móviles
        this.audio = new Audio();

        // Configuraciones específicas para Android
        if (this.isAndroid) {
            this.audio.preload = 'metadata'; // Cargar solo metadatos inicialmente
            this.audio.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
        } else if (this.isIOS) {
            this.audio.preload = 'none'; // iOS prefiere none para evitar problemas
        } else {
            this.audio.preload = 'auto'; // Desktop puede cargar completamente
        }

        this.audio.src = session.audio_url;
        this.audio.volume = 0.7;

        // Actualizar UI
        document.getElementById('playerCover').src = session.cover || '';
        document.getElementById('playerTitle').textContent = session.title || 'Audio sin título';
        document.getElementById('globalPlayer').style.display = 'block';

        // Eventos de audio con manejo de errores mejorado
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('loadstart', () => {
            console.log('Cargando audio...', session.title);
        });
        this.audio.addEventListener('canplay', () => {
            console.log('Audio listo para reproducir:', session.title);
        });
        this.audio.addEventListener('error', (e) => {
            console.error('Error de audio:', e.target.error, 'para sesión:', session.title);
            this.handleAudioError(e.target.error);
        });
        this.audio.addEventListener('stalled', () => {
            console.warn('Audio estancado, reintentando...', session.title);
        });

        // Para móviles, no reproducir automáticamente si no hay interacción del usuario
        if (this.isMobile && !this.userInteracted) {
            console.log('Móvil sin interacción del usuario - esperando click para reproducir');
            document.getElementById('playPauseBtn').textContent = '▶️';
            this.isPlaying = false;
        } else {
            this.play();
        }
    }

    play() {
        if (!this.audio) return;

        console.log('Intentando reproducir audio en:', this.isAndroid ? 'Android' : (this.isIOS ? 'iOS' : 'Desktop'));

        const playPromise = this.audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Reproducción iniciada exitosamente');
                this.isPlaying = true;
                document.getElementById('playPauseBtn').textContent = '⏸️';
                this.userInteracted = true; // Marcar que el usuario ha interactuado
            }).catch(error => {
                console.error('Error al reproducir:', error.name, error.message);

                // Manejo específico de errores para Android
                if (this.isAndroid) {
                    if (error.name === 'NotAllowedError') {
                        console.log('Android: Autoplay bloqueado - esperando interacción del usuario');
                        this.showPlayButton();
                    } else if (error.name === 'NotSupportedError') {
                        console.log('Android: Formato no soportado - intentando fallback');
                        this.tryAudioFallback();
                    }
                } else {
                    this.showPlayButton();
                }
            });
        }
    }

    showPlayButton() {
        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶️';
        console.log('Mostrando botón de play - se requiere interacción del usuario');
    }

    tryAudioFallback() {
        if (this.currentSession && this.currentSession.audio_url) {
            // Intentar con formato MP3 si la URL original no es MP3
            const originalUrl = this.currentSession.audio_url;
            if (!originalUrl.toLowerCase().includes('.mp3')) {
                const mp3Url = originalUrl.replace(/\.(flac|wav|ogg)(\?.*)?$/i, '.mp3$2');
                console.log('Intentando fallback MP3:', mp3Url);
                this.audio.src = mp3Url;
                this.audio.load();
            }
        }
    }

    handleAudioError(error) {
        console.error('Error de audio:', error);
        let errorMessage = 'Error desconocido';

        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    errorMessage = 'Reproducción abortada';
                    break;
                case error.MEDIA_ERR_NETWORK:
                    errorMessage = 'Error de red';
                    break;
                case error.MEDIA_ERR_DECODE:
                    errorMessage = 'Error de decodificación';
                    if (this.isAndroid) {
                        this.tryAudioFallback();
                        return;
                    }
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Formato no soportado';
                    if (this.isAndroid) {
                        this.tryAudioFallback();
                        return;
                    }
                    break;
            }
        }

        document.getElementById('playerTitle').textContent = `Error: ${errorMessage}`;
        this.showPlayButton();
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            document.getElementById('playPauseBtn').textContent = '▶️';
        }
    }

    togglePlay() {
        console.log('Toggle play - Estado actual:', this.isPlaying, 'Dispositivo:', {
            isAndroid: this.isAndroid,
            userInteracted: this.userInteracted
        });

        // Marcar que el usuario ha interactuado (importante para políticas de autoplay)
        this.userInteracted = true;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = volume;
        }
    }

    updateProgress() {
        if (this.audio) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('playerProgressBar').style.width = progress + '%';
        }
    }

    onEnded() {
        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶️';
    }
}

// Inicializar reproductor global
let globalPlayer;
document.addEventListener('DOMContentLoaded', () => {
    globalPlayer = new SimpleAudioPlayer();
});

// Función global para reproducir sesiones
function playSession(session) {
    if (globalPlayer) {
        globalPlayer.loadSession(session);
    }
}
