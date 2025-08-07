// Reproductor Global Simplificado con soporte mejorado para Android
class SimpleAudioPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentSession = null;
        // Detección mejorada de dispositivos
        this.isAndroid = /Android/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.userAgentData?.platform === 'macOS' && navigator.maxTouchPoints > 0);
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                       'ontouchstart' in window;
        this.userInteracted = false;

        // Sistema de logging mejorado para Android
        this.debugMode = true;
        this.logs = [];

        this.log('INIT', 'SimpleAudioPlayer - Dispositivo detectado:', {
            isAndroid: this.isAndroid,
            isIOS: this.isIOS,
            isMobile: this.isMobile,
            userAgent: navigator.userAgent,
            audioSupport: !!window.Audio,
            touchSupport: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints
        });
        this.init();
    }

    init() {
        this.createPlayerUI();
        this.bindEvents();
        this.setupMobileSupport();
    }

    log(type, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            data,
            device: this.isAndroid ? 'Android' : (this.isIOS ? 'iOS' : 'Desktop')
        };

        this.logs.push(logEntry);

        // Mantener solo los últimos 50 logs
        if (this.logs.length > 50) {
            this.logs.shift();
        }

        // Log a consola con formato
        const devicePrefix = this.isAndroid ? '[ANDROID]' : (this.isIOS ? '[iOS]' : '[DESKTOP]');
        if (data) {
            console.log(`${devicePrefix} [${type}] ${message}`, data);
        } else {
            console.log(`${devicePrefix} [${type}] ${message}`);
        }

        // Mostrar en UI si existe el contenedor de logs
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logContainer = document.getElementById('debugLogs');
        if (logContainer && this.debugMode) {
            const lastLogs = this.logs.slice(-10); // Mostrar últimos 10 logs
            logContainer.innerHTML = lastLogs.map(log =>
                `<div style="margin: 2px 0; font-size: 11px; color: ${this.getLogColor(log.type)}">
                    [${log.timestamp.split('T')[1].split('.')[0]}] ${log.type}: ${log.message}
                    ${log.data ? '<br>' + JSON.stringify(log.data, null, 2) : ''}
                </div>`
            ).join('');
        }
    }

    getLogColor(type) {
        switch(type) {
            case 'ERROR': return '#ff6b6b';
            case 'WARN': return '#ffd93d';
            case 'SUCCESS': return '#6bcf7f';
            case 'AUDIO': return '#74c0fc';
            case 'CLICK': return '#ffa8a8';
            default: return '#fff';
        }
    }

    getLogs() {
        return this.logs;
    }

    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
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
        const progressBar = document.getElementById('playerProgress');
        progressBar.addEventListener('click', (e) => {
            if (this.audio && this.audio.duration) {
                const rect = e.target.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const newTime = percent * this.audio.duration;
                this.seekTo(newTime);
                this.log('CLICK', 'Seek desde barra de progreso', {
                    percent: percent,
                    newTime: newTime,
                    duration: this.audio.duration
                });
            }
        });

        // Eventos táctiles para la barra de progreso en móviles
        if (this.isMobile) {
            let isDragging = false;

            progressBar.addEventListener('touchstart', () => {
                isDragging = true;
                this.log('CLICK', 'Touch start en barra de progreso');
            }, { passive: true });

            progressBar.addEventListener('touchmove', (e) => {
                if (isDragging && this.audio && this.audio.duration) {
                    const rect = progressBar.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));

                    // Actualizar visualmente sin cambiar el audio aún
                    document.getElementById('playerProgressBar').style.width = (percent * 100) + '%';
                }
            }, { passive: true });

            progressBar.addEventListener('touchend', (e) => {
                if (isDragging && this.audio && this.audio.duration) {
                    const rect = progressBar.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (e.changedTouches[0].clientX - rect.left) / rect.width));
                    const newTime = percent * this.audio.duration;
                    this.seekTo(newTime);
                    this.log('CLICK', 'Touch seek completado', {
                        percent: percent,
                        newTime: newTime
                    });
                }
                isDragging = false;
            }, { passive: true });
        }
    }

    bindEvents() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const volumeSlider = document.getElementById('volumeSlider');

        // Eventos de click para desktop
        playPauseBtn.addEventListener('click', () => {
            this.log('CLICK', 'Click en play/pause (desktop)');
            this.togglePlay();
        });

        volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Eventos táctiles específicos para móviles
        if (this.isMobile) {
            this.log('INIT', 'Configurando eventos táctiles para móvil');

            // Prevenir eventos click duplicados en móviles
            playPauseBtn.addEventListener('click', (e) => {
                if (this.isMobile) {
                    e.preventDefault();
                    this.log('CLICK', 'Click prevenido en móvil - usando touch events');
                }
            });

            // Touch events para el botón play/pause
            playPauseBtn.addEventListener('touchstart', (e) => {
                this.log('CLICK', 'Touch start en play/pause');
                e.target.style.transform = 'scale(0.95)';
            }, { passive: true });

            playPauseBtn.addEventListener('touchend', (e) => {
                this.log('CLICK', 'Touch end en play/pause - ejecutando togglePlay');
                e.target.style.transform = 'scale(1)';
                e.preventDefault();
                this.togglePlay();
            }, { passive: false });
        }

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
            this.log('INIT', 'Configurando soporte móvil para:', this.isAndroid ? 'Android' : (this.isIOS ? 'iOS' : 'Móvil genérico'));

            // Detectar primera interacción del usuario (requerida para autoplay en móviles)
            const enableAudioContext = () => {
                this.userInteracted = true;
                this.log('SUCCESS', 'Primera interacción del usuario detectada');
                document.removeEventListener('touchstart', enableAudioContext);
                document.removeEventListener('click', enableAudioContext);
            };

            document.addEventListener('touchstart', enableAudioContext, { once: true, passive: true });
            document.addEventListener('click', enableAudioContext, { once: true });

            // Los eventos táctiles ya están configurados en bindEvents()
            this.log('INIT', 'Eventos táctiles configurados en bindEvents()');
        }
    }

    loadSession(session) {
        if (!session.audio_url || session.audio_url === '#') {
            this.log('ERROR', 'URL de audio inválida', { session });
            return;
        }

        this.log('AUDIO', 'Cargando sesión:', {
            title: session.title,
            url: session.audio_url,
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
            this.log('AUDIO', 'Iniciando carga de audio', { title: session.title });
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.log('AUDIO', 'Metadatos cargados', {
                duration: this.audio.duration,
                title: session.title
            });
        });

        this.audio.addEventListener('canplay', () => {
            this.log('SUCCESS', 'Audio listo para reproducir', {
                title: session.title,
                duration: this.audio.duration,
                readyState: this.audio.readyState
            });
        });

        this.audio.addEventListener('canplaythrough', () => {
            this.log('SUCCESS', 'Audio completamente cargado', { title: session.title });
        });

        this.audio.addEventListener('error', (e) => {
            this.log('ERROR', 'Error de audio', {
                error: e.target.error,
                code: e.target.error ? e.target.error.code : 'unknown',
                message: e.target.error ? e.target.error.message : 'unknown',
                title: session.title,
                url: session.audio_url
            });
            this.handleAudioError(e.target.error);
        });

        this.audio.addEventListener('stalled', () => {
            this.log('WARN', 'Audio estancado', {
                title: session.title,
                currentTime: this.audio.currentTime,
                buffered: this.audio.buffered.length
            });
        });

        this.audio.addEventListener('waiting', () => {
            this.log('WARN', 'Audio esperando datos', { title: session.title });
        });

        this.audio.addEventListener('playing', () => {
            this.log('SUCCESS', 'Audio reproduciendo', { title: session.title });
        });

        this.audio.addEventListener('pause', () => {
            this.log('AUDIO', 'Audio pausado', { title: session.title });
        });

        // Para móviles, no reproducir automáticamente si no hay interacción del usuario
        if (this.isMobile && !this.userInteracted) {
            this.log('WARN', 'Móvil sin interacción del usuario - esperando click para reproducir', {
                isMobile: this.isMobile,
                userInteracted: this.userInteracted
            });
            document.getElementById('playPauseBtn').textContent = '▶️';
            this.isPlaying = false;
        } else {
            this.log('AUDIO', 'Iniciando reproducción automática');
            this.play();
        }
    }

    play() {
        if (!this.audio) {
            this.log('ERROR', 'No hay elemento de audio para reproducir');
            return;
        }

        this.log('AUDIO', 'Intentando reproducir audio', {
            device: this.isAndroid ? 'Android' : (this.isIOS ? 'iOS' : 'Desktop'),
            readyState: this.audio.readyState,
            paused: this.audio.paused,
            currentTime: this.audio.currentTime,
            duration: this.audio.duration,
            src: this.audio.src
        });

        const playPromise = this.audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.log('SUCCESS', 'Reproducción iniciada exitosamente', {
                    currentTime: this.audio.currentTime,
                    duration: this.audio.duration,
                    volume: this.audio.volume
                });
                this.isPlaying = true;
                document.getElementById('playPauseBtn').textContent = '⏸️';
                this.userInteracted = true; // Marcar que el usuario ha interactuado
            }).catch(error => {
                this.log('ERROR', 'Error al reproducir', {
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                });

                // Manejo específico de errores para Android
                if (this.isAndroid) {
                    if (error.name === 'NotAllowedError') {
                        this.log('WARN', 'Android: Autoplay bloqueado - esperando interacción del usuario');
                        this.showPlayButton();
                    } else if (error.name === 'NotSupportedError') {
                        this.log('WARN', 'Android: Formato no soportado - intentando fallback');
                        this.tryAudioFallback();
                    } else {
                        this.log('ERROR', 'Android: Error desconocido', { error });
                        this.showPlayButton();
                    }
                } else {
                    this.showPlayButton();
                }
            });
        } else {
            this.log('WARN', 'play() no devolvió una Promise');
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
            this.log('AUDIO', 'Pausando audio manualmente');
            this.audio.pause();
            this.isPlaying = false;
            document.getElementById('playPauseBtn').textContent = '▶️';
        }
    }

    stop() {
        if (this.audio) {
            this.log('AUDIO', 'Deteniendo audio');
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
            document.getElementById('playPauseBtn').textContent = '▶️';
            this.updateProgress();
        }
    }

    seekTo(time) {
        if (this.audio && this.audio.duration) {
            const newTime = Math.max(0, Math.min(time, this.audio.duration));
            this.log('AUDIO', 'Seeking to time', {
                requestedTime: time,
                actualTime: newTime,
                duration: this.audio.duration
            });
            this.audio.currentTime = newTime;
            this.updateProgress();
        }
    }

    seekRelative(seconds) {
        if (this.audio) {
            const newTime = this.audio.currentTime + seconds;
            this.log('AUDIO', 'Seeking relative', {
                currentTime: this.audio.currentTime,
                offset: seconds,
                newTime: newTime
            });
            this.seekTo(newTime);
        }
    }

    togglePlay() {
        this.log('CLICK', 'Toggle play - Estado actual', {
            isPlaying: this.isPlaying,
            isAndroid: this.isAndroid,
            userInteracted: this.userInteracted,
            hasAudio: !!this.audio,
            audioSrc: this.audio ? this.audio.src : 'none'
        });

        // Marcar que el usuario ha interactuado (importante para políticas de autoplay)
        this.userInteracted = true;

        if (this.isPlaying) {
            this.log('AUDIO', 'Pausando audio');
            this.pause();
        } else {
            this.log('AUDIO', 'Iniciando reproducción desde toggle');
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
