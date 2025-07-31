// Global Audio Player - Versión mejorada con logging para diagnóstico móvil
class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.isVisible = false;
        this.createLoggerUI();
    }

    log(type, message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        // Detección mejorada de móvil incluyendo iOS específicamente
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent) ||
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                         'ontouchstart' in window;
        
        const logEntry = {
            timestamp,
            type,
            message,
            data,
            isMobile,
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0),
            userAgent: navigator.userAgent.substring(0, 50) + '...'
        };

        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        // También log normal para debugging
        console.log(`[${type.toUpperCase()}] ${message}`, data || '');
        
        this.updateLoggerUI();
    }

    createLoggerUI() {
        const loggerHTML = `
            <div id="debugLogger" style="position: fixed; top: 0; right: 0; width: 300px; height: 400px; background: rgba(0,0,0,0.9); color: white; z-index: 10000; transform: translateX(280px); transition: transform 0.3s; font-family: monospace; font-size: 11px;">
                <div style="padding: 10px; border-bottom: 1px solid #333; background: #111;">
                    <button id="debugToggle" style="background: #007acc; color: white; border: none; padding: 5px 10px; cursor: pointer; font-size: 12px;">📋 DEBUG</button>
                    <button id="debugClear" style="background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-left: 5px; font-size: 10px;">CLEAR</button>
                    <button id="debugExport" style="background: #28a745; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-left: 5px; font-size: 10px;">EXPORT</button>
                </div>
                <div id="debugContent" style="padding: 10px; height: 350px; overflow-y: auto;">
                    <div style="color: #28a745;">Debug Logger iniciado</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loggerHTML);

        // Detectar iOS y auto-abrir debug si estamos en player.html
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0);
        const isPlayerPage = window.location.pathname.includes('player.html') || 
                             document.body.getAttribute('data-page') === 'player';

        if (isIOS && isPlayerPage) {
            this.log('INFO', 'iOS detectado en player.html - auto-abriendo debug');
            setTimeout(() => {
                this.isVisible = true;
                const logger = document.getElementById('debugLogger');
                if (logger) {
                    logger.style.transform = 'translateX(0)';
                }
            }, 1000);
        }

        // Bind events con múltiples métodos para iOS
        this.bindDebugEvents();
    }

    bindDebugEvents() {
        const debugToggle = document.getElementById('debugToggle');
        const debugClear = document.getElementById('debugClear');
        const debugExport = document.getElementById('debugExport');

        // Múltiples event listeners para asegurar que funcionen en iOS
        const events = ['click', 'touchend', 'touchstart'];
        
        events.forEach(eventType => {
            if (debugToggle) {
                debugToggle.addEventListener(eventType, (e) => {
                    if (eventType === 'touchstart') return; // Solo procesar en touchend o click
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggle();
                    this.log('INFO', `Debug toggle activado via ${eventType}`);
                }, { passive: false });
            }

            if (debugClear) {
                debugClear.addEventListener(eventType, (e) => {
                    if (eventType === 'touchstart') return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.clear();
                    this.log('INFO', `Debug clear activado via ${eventType}`);
                }, { passive: false });
            }

            if (debugExport) {
                debugExport.addEventListener(eventType, (e) => {
                    if (eventType === 'touchstart') return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.export();
                    this.log('INFO', `Debug export activado via ${eventType}`);
                }, { passive: false });
            }
        });

        // Test de eventos en toda la página para diagnosticar problemas
        this.setupEventDiagnostics();
    }

    setupEventDiagnostics() {
        // Interceptar todos los eventos de clic en la página
        ['click', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                const elementInfo = {
                    tag: e.target.tagName,
                    id: e.target.id || 'sin-id',
                    class: e.target.className || 'sin-class',
                    position: { x: e.clientX || 0, y: e.clientY || 0 }
                };

                this.log('CLICK', `Evento ${eventType} detectado`, elementInfo);
                
                // Si es un botón importante, log adicional
                if (e.target.id === 'playPauseBtn' || e.target.id === 'downloadBtn') {
                    this.log('WARN', `Evento en botón crítico: ${e.target.id}`, {
                        eventType: eventType,
                        prevented: e.defaultPrevented,
                        propagationStopped: e.cancelBubble
                    });
                }
            }, true); // Usar capture para interceptar antes que otros handlers
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const logger = document.getElementById('debugLogger');
        logger.style.transform = this.isVisible ? 'translateX(0)' : 'translateX(280px)';
    }

    clear() {
        this.logs = [];
        this.updateLoggerUI();
    }

    export() {
        const logData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            logs: this.logs
        };

        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    updateLoggerUI() {
        const content = document.getElementById('debugContent');
        if (!content) return;

        const html = this.logs.map(log => {
            const color = {
                'ERROR': '#dc3545',
                'WARN': '#ffc107',
                'INFO': '#17a2b8',
                'SUCCESS': '#28a745',
                'CLICK': '#007bff',
                'AUDIO': '#6f42c1'
            }[log.type] || '#fff';

            return `<div style="margin-bottom: 8px; border-left: 3px solid ${color}; padding-left: 8px;">
                <div style="color: ${color}; font-weight: bold;">[${log.timestamp}] ${log.type}</div>
                <div style="color: #ccc;">${log.message}</div>
                ${log.data ? `<div style="color: #888; font-size: 10px;">${JSON.stringify(log.data).substring(0, 100)}...</div>` : ''}
            </div>`;
        }).join('');

        content.innerHTML = html;
    }
}

class GlobalAudioPlayer {
    constructor() {
        this.audio = null;
        this.currentSession = null;
        this.isPlaying = false;
        this.player = null;
        this.progressFill = null;
        this.currentTimeEl = null;
        this.totalTimeEl = null;
        this.playBtn = null;
        this.titleEl = null;
        this.subtitleEl = null;
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Inicializar logger de debug
        this.logger = new DebugLogger();
        this.logger.log('INFO', 'GlobalAudioPlayer inicializando...', {
            userAgent: navigator.userAgent,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            supportsAudio: !!window.Audio,
            supportsMediaSession: 'mediaSession' in navigator
        });
        
        this.init();
        
        // Diagnóstico inicial para móvil
        this.performMobileDiagnostics();
    }

    // Persistencia de posición de audio
    saveAudioPosition(sessionId, currentTime, duration) {
        if (!sessionId || !currentTime || !duration) return;
        
        const position = {
            sessionId: sessionId,
            currentTime: currentTime,
            duration: duration,
            timestamp: Date.now(),
            percentage: (currentTime / duration) * 100
        };

        try {
            localStorage.setItem(`audioPosition_${sessionId}`, JSON.stringify(position));
            this.logger.log('INFO', 'Posición de audio guardada', position);
        } catch (e) {
            this.logger.log('ERROR', 'Error guardando posición de audio', { error: e.message });
        }
    }

    loadAudioPosition(sessionId) {
        if (!sessionId) return null;

        try {
            const saved = localStorage.getItem(`audioPosition_${sessionId}`);
            if (saved) {
                const position = JSON.parse(saved);
                // Solo restaurar si fue guardado en las últimas 24 horas
                const isRecent = (Date.now() - position.timestamp) < (24 * 60 * 60 * 1000);
                
                if (isRecent) {
                    this.logger.log('SUCCESS', 'Posición de audio restaurada', position);
                    return position;
                } else {
                    localStorage.removeItem(`audioPosition_${sessionId}`);
                    this.logger.log('INFO', 'Posición de audio expirada, eliminada');
                }
            }
        } catch (e) {
            this.logger.log('ERROR', 'Error cargando posición de audio', { error: e.message });
        }
        
        return null;
    }

    // Media Session para pantalla de bloqueo
    setupMediaSession(sessionData) {
        if (!('mediaSession' in navigator)) {
            this.logger.log('ERROR', 'MediaSession no soportado en este navegador');
            return false;
        }

        try {
            this.logger.log('INFO', 'Configurando MediaSession...', {
                title: sessionData.title,
                hasArtwork: !!sessionData.artwork,
                artworkUrl: sessionData.artwork
            });

            // Configurar artwork con URLs absolutas y múltiples formatos para iOS
            let artworkArray = [];
            if (sessionData.artwork) {
                // Asegurar URL absoluta
                let artworkUrl = sessionData.artwork;
                if (artworkUrl.startsWith('./') || artworkUrl.startsWith('attached_assets/')) {
                    artworkUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/${artworkUrl.replace(/^\.\//, '')}`;
                } else if (artworkUrl.startsWith('/')) {
                    artworkUrl = `${window.location.origin}${artworkUrl}`;
                } else if (!artworkUrl.startsWith('http')) {
                    artworkUrl = `${window.location.origin}/${artworkUrl}`;
                }

                // iOS específico: usar múltiples tamaños y tipos
                const sizes = ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'];
                sizes.forEach(size => {
                    artworkArray.push({
                        src: artworkUrl,
                        sizes: size,
                        type: 'image/png'
                    });
                    // Añadir también como JPEG para mayor compatibilidad
                    artworkArray.push({
                        src: artworkUrl,
                        sizes: size,
                        type: 'image/jpeg'
                    });
                });

                this.logger.log('INFO', 'Artwork configurado', {
                    originalUrl: sessionData.artwork,
                    absoluteUrl: artworkUrl,
                    artworkCount: artworkArray.length
                });
            }

            // Configurar metadata con solo el título de la sesión
            navigator.mediaSession.metadata = new MediaMetadata({
                title: sessionData.title || 'Sesión de Audio',
                artist: '', // Sin artista como solicitado
                album: '',  // Sin álbum como solicitado
                artwork: artworkArray
            });

            this.logger.log('SUCCESS', 'MediaMetadata configurado - Solo título', {
                metadataTitle: navigator.mediaSession.metadata.title,
                artworkCount: navigator.mediaSession.metadata.artwork.length,
                firstArtworkSrc: navigator.mediaSession.metadata.artwork[0]?.src,
                sessionDataPassed: {
                    title: sessionData.title,
                    artworkOriginal: sessionData.artwork
                }
            });

            // Configurar controles de media session
            navigator.mediaSession.setActionHandler('play', () => {
                this.logger.log('INFO', 'MediaSession: play solicitado desde pantalla de bloqueo');
                this.play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                this.logger.log('INFO', 'MediaSession: pause solicitado desde pantalla de bloqueo');
                this.pause();
            });

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details.seekOffset || 10;
                this.logger.log('INFO', 'MediaSession: seekbackward solicitado desde pantalla de bloqueo', { skipTime });
                this.seekRelative(-skipTime);
            });

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details.seekOffset || 10;
                this.logger.log('INFO', 'MediaSession: seekforward solicitado desde pantalla de bloqueo', { skipTime });
                this.seekRelative(skipTime);
            });

            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime) {
                    this.logger.log('INFO', 'MediaSession: seekto solicitado desde pantalla de bloqueo', { seekTime: details.seekTime });
                    this.seekTo(details.seekTime);
                }
            });

            // Para iOS: forzar actualización del estado
            if (this.audio && !this.audio.paused) {
                navigator.mediaSession.playbackState = 'playing';
            } else {
                navigator.mediaSession.playbackState = 'paused';
            }

            this.logger.log('SUCCESS', 'MediaSession configurado completamente', {
                title: sessionData.title,
                hasArtwork: !!sessionData.artwork,
                artworkArrayLength: artworkArray.length,
                playbackState: navigator.mediaSession.playbackState,
                actionsConfigured: ['play', 'pause', 'seekbackward', 'seekforward', 'seekto']
            });

            return true;

        } catch (error) {
            this.logger.log('ERROR', 'Error configurando MediaSession', { 
                error: error.message,
                stack: error.stack?.substring(0, 200) + '...'
            });
            return false;
        }
    }

    // Actualizar posición en MediaSession
    updateMediaSessionPosition() {
        if ('mediaSession' in navigator && this.audio && !isNaN(this.audio.duration)) {
            try {
                const positionData = {
                    duration: this.audio.duration,
                    playbackRate: this.audio.playbackRate,
                    position: this.audio.currentTime
                };

                navigator.mediaSession.setPositionState(positionData);
                
                this.logger.log('INFO', 'MediaSession posición actualizada', {
                    currentTime: Math.floor(this.audio.currentTime),
                    duration: Math.floor(this.audio.duration),
                    percentage: Math.floor((this.audio.currentTime / this.audio.duration) * 100) + '%'
                });

            } catch (error) {
                this.logger.log('ERROR', 'Error actualizando posición en MediaSession', { 
                    error: error.message,
                    hasAudio: !!this.audio,
                    audioDuration: this.audio ? this.audio.duration : 'no audio'
                });
            }
        } else {
            this.logger.log('WARN', 'No se puede actualizar MediaSession posición', {
                hasMediaSession: 'mediaSession' in navigator,
                hasAudio: !!this.audio,
                hasValidDuration: this.audio ? !isNaN(this.audio.duration) : false
            });
        }
    }

    performMobileDiagnostics() {
        // Detección mejorada de móvil e iOS
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent) ||
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                         'ontouchstart' in window;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0);
        
        this.logger.log('INFO', 'Diagnóstico móvil iniciado', {
            isMobile: isMobile,
            isIOS: isIOS,
            platform: navigator.platform,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            orientation: screen.orientation ? screen.orientation.type : 'desconocido',
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : 'no disponible',
            userAgent: navigator.userAgent
        });

        // Test de capacidades de audio específico para iOS
        if (window.Audio) {
            const testAudio = new Audio();
            const audioCapabilities = {
                canPlayMP3: testAudio.canPlayType('audio/mpeg'),
                canPlayAAC: testAudio.canPlayType('audio/aac'),
                canPlayFLAC: testAudio.canPlayType('audio/flac'),
                canPlayM4A: testAudio.canPlayType('audio/mp4'),
                autoplaySupported: testAudio.autoplay !== undefined,
                volume: testAudio.volume,
                muted: testAudio.muted
            };

            this.logger.log('INFO', 'Capacidades de audio', audioCapabilities);

            // Test específico para iOS autoplay
            if (isIOS) {
                this.logger.log('INFO', 'Dispositivo iOS detectado - testing autoplay restrictions');
                this.testIOSAutoplay(testAudio);
            }
        }

        // Test de eventos táctiles
        if (isMobile) {
            this.testTouchEvents();
        }
    }

    testIOSAutoplay(audio) {
        // Test de autoplay en iOS
        audio.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAC6u7u7u7u7u7u7u7u7';
        audio.load();
        
        const playPromise = audio.play();
        if (playPromise) {
            playPromise.then(() => {
                this.logger.log('SUCCESS', 'iOS: Autoplay permitido');
                audio.pause();
            }).catch(err => {
                this.logger.log('WARN', 'iOS: Autoplay bloqueado (normal)', {
                    error: err.name,
                    message: err.message
                });
            });
        }
    }

    testTouchEvents() {
        this.logger.log('INFO', 'Testing touch events...');
        
        const testElement = document.createElement('div');
        testElement.style.position = 'absolute';
        testElement.style.width = '1px';
        testElement.style.height = '1px';
        testElement.style.opacity = '0';
        testElement.style.pointerEvents = 'none';
        document.body.appendChild(testElement);

        let touchSupported = false;
        
        testElement.addEventListener('touchstart', () => {
            touchSupported = true;
        });

        // Simular evento touch
        if (typeof TouchEvent !== 'undefined') {
            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true
            });
            testElement.dispatchEvent(touchEvent);
        }

        setTimeout(() => {
            this.logger.log('INFO', 'Touch events test completado', {
                touchSupported: touchSupported,
                TouchEventExists: typeof TouchEvent !== 'undefined',
                ontouchstart: 'ontouchstart' in window
            });
            document.body.removeChild(testElement);
        }, 100);
    }

    setAudioElement(audioEl) {
        this.logger.log('AUDIO', 'setAudioElement llamado', {
            hasAudioEl: !!audioEl,
            currentAudio: !!this.audio,
            audioElSrc: audioEl ? audioEl.src : null
        });

        if (!audioEl) {
            this.logger.log('ERROR', 'setAudioElement: audioEl es null o undefined');
            return;
        }

        // Preserve state of previous element
        let wasPlaying = false;
        let currentTime = 0;

        if (this.audio && this.audio !== audioEl) {
            wasPlaying = !this.audio.paused;
            currentTime = this.audio.currentTime;

            try {
                this.audio.pause();
                this.logger.log('AUDIO', 'Audio anterior pausado', { wasPlaying, currentTime });
            } catch (e) {
                this.logger.log('ERROR', 'No se pudo pausar el audio anterior', { error: e.message });
                console.warn('Could not pause previous audio element', e);
            }
        }

        this.audio = audioEl;
        this.audio.currentTime = currentTime;
        this.audio.volume = 1;
        this.setupAudioEventListeners();

        if (wasPlaying) {
            this.audio.play().catch(e => {
                this.logger.log('ERROR', 'Falló reproducción automática tras cambio de audio', { error: e.message });
                console.warn('Sync play failed', e);
            });
        }

        this.updateMediaSession();
    }

    init() {
        this.createPlayer();
        this.bindEvents();
        this.loadFromStorage();
    }

    createPlayer() {
        // Create player HTML with improved controls
        const playerHTML = `
            <div class="global-audio-player" id="globalPlayer">
                <div class="global-player-content">
                    <div class="global-player-info">
                        <div class="global-player-title" id="globalPlayerTitle">Selecciona una sesión</div>
                    </div>
                    <div class="global-player-controls">
                        <button class="global-control-btn" id="globalPlayBtn" disabled>▶</button>
                    </div>
                    <div class="global-player-progress">
                        <span class="global-time" id="globalCurrentTime">0:00</span>
                        <div class="global-progress-bar" id="globalProgressBar">
                            <div class="global-progress-fill" id="globalProgressFill"></div>
                            <div class="global-progress-buffer" id="globalProgressBuffer"></div>
                        </div>
                        <span class="global-time" id="globalTotalTime">0:00</span>
                    </div>
                    <div class="player-status" id="playerStatus"></div>
                    <button class="global-player-close" id="globalPlayerClose">×</button>
                </div>
                <div class="loading-indicator" id="loadingIndicator" style="display: none;">
                    <div class="spinner"></div>
                    <span>Cargando...</span>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', playerHTML);

        // Get references
        this.player = document.getElementById('globalPlayer');
        this.progressFill = document.getElementById('globalProgressFill');
        this.progressBuffer = document.getElementById('globalProgressBuffer');
        this.currentTimeEl = document.getElementById('globalCurrentTime');
        this.totalTimeEl = document.getElementById('globalTotalTime');
        this.playBtn = document.getElementById('globalPlayBtn');
        this.titleEl = document.getElementById('globalPlayerTitle');
        this.statusEl = document.getElementById('playerStatus');
        this.loadingEl = document.getElementById('loadingIndicator');
    }

    bindEvents() {
        this.logger.log('INFO', 'Configurando event listeners...');

        // Play/pause button
        this.playBtn.addEventListener('click', (e) => {
            this.logger.log('CLICK', 'Click en botón global play/pause', {
                event: e.type,
                target: e.target.tagName,
                disabled: this.playBtn.disabled,
                hasAudio: !!this.audio,
                isPlaying: this.isPlaying
            });
            this.togglePlayPause();
        });

        // Progress bar click
        document.getElementById('globalProgressBar').addEventListener('click', (e) => {
            this.logger.log('CLICK', 'Click en barra de progreso global', {
                hasAudio: !!this.audio,
                hasDuration: this.audio ? !!this.audio.duration : false,
                clientX: e.clientX,
                targetWidth: e.target.getBoundingClientRect().width
            });

            if (this.audio && this.audio.duration) {
                const rect = e.target.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const newTime = percent * this.audio.duration;
                this.seekTo(newTime);
                
                // Sync with main player if exists
                const mainAudio = document.getElementById('mainAudioPlayer');
                if (mainAudio && mainAudio.duration) {
                    mainAudio.currentTime = newTime;
                }
            } else {
                this.logger.log('WARN', 'No se puede hacer seek: audio no disponible o sin duración');
            }
        });



        // Close button
        document.getElementById('globalPlayerClose').addEventListener('click', () => {
            this.logger.log('CLICK', 'Click en botón cerrar reproductor global');
            this.stop();
        });

        // Listen for play events from other players
        window.addEventListener('globalPlayerStart', (e) => {
            this.logger.log('INFO', 'Evento globalPlayerStart recibido', e.detail);
            this.startSession(e.detail);
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logger.log('INFO', 'Página oculta, reproductor global continúa');
                console.log('Page hidden, global player continues');
            } else {
                this.logger.log('INFO', 'Página visible, reproductor global activo');
                console.log('Page visible, global player active');
                // Verificar si el audio sigue siendo válido
                if (this.audio && this.audio.error) {
                    this.handleAudioError(this.audio.error);
                }
            }
        });

        // Eventos táctiles específicos para móvil
        if ('ontouchstart' in window) {
            this.logger.log('INFO', 'Dispositivo táctil detectado, configurando eventos touch');
            
            // Touch events para el botón de play
            this.playBtn.addEventListener('touchstart', (e) => {
                this.logger.log('CLICK', 'Touchstart en botón global play/pause', {
                    targetElement: e.target.tagName,
                    touches: e.touches.length,
                    disabled: this.playBtn.disabled
                });
            });

            this.playBtn.addEventListener('touchend', (e) => {
                this.logger.log('CLICK', 'Touchend en botón global play/pause');
                e.preventDefault(); // Prevenir doble evento
            });

            // Touch events para la barra de progreso
            document.getElementById('globalProgressBar').addEventListener('touchstart', (e) => {
                this.logger.log('CLICK', 'Touchstart en barra de progreso global', {
                    touches: e.touches.length,
                    hasAudio: !!this.audio
                });
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Solo si el reproductor está activo y no hay inputs enfocados
            if (this.isPlayerActive() && !this.isInputFocused()) {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        this.togglePlayPause();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.seekRelative(-10);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.seekRelative(10);
                        break;
                }
            }
        });
    }

    startSession(sessionData) {
        console.log('Starting global session:', sessionData);
        
        // Validar datos de sesión
        if (!this.validateSessionData(sessionData)) {
            this.showError('Datos de sesión inválidos');
            return;
        }
        
        // Reset retry count
        this.retryCount = 0;
        
        // Stop current audio if playing
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        this.showLoading(true);
        this.currentSession = sessionData;

        this.updateMediaSession();

        // Create new audio element
        this.audio = new Audio();
        this.audio.volume = 1;
        this.setupAudioEventListeners();

        // Restore progress if same session stored
        if (this.savedState && this.savedState.session && this.savedState.session.title === sessionData.title) {
            const savedTime = this.savedState.currentTime || 0;
            this.audio.addEventListener('loadedmetadata', () => {
                this.seekTo(Math.min(savedTime, this.audio.duration || savedTime));
            }, { once: true });
        }
        
        // Update UI immediately
        this.titleEl.textContent = sessionData.title;
        
        // Start loading audio
        this.loadAudio(sessionData.audioUrl);
    }

    validateSessionData(sessionData) {
        return sessionData && 
               sessionData.title && 
               sessionData.audioUrl && 
               sessionData.audioUrl !== '#';
    }

    setupAudioEventListeners() {
        if (!this.audio) return;

        // Loading events
        this.audio.addEventListener('loadstart', () => {
            console.log('Global audio loading started');
            this.showLoading(true);
            this.setStatus('Cargando...');
        });

        this.audio.addEventListener('loadedmetadata', () => {
            console.log('Global audio metadata loaded');
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
            this.playBtn.disabled = false;
        });

        this.audio.addEventListener('canplay', () => {
            console.log('Global audio can play');
            this.showLoading(false);
            this.setStatus('Listo para reproducir');
        });

        this.audio.addEventListener('canplaythrough', () => {
            console.log('Global audio can play through');
            this.setStatus('');
        });

        // Progress events
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('progress', () => {
            this.updateBuffer();
        });

        // Playback events
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.playBtn.textContent = '⏸';
            this.playBtn.classList.add('playing');
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.playBtn.textContent = '▶';
            this.playBtn.classList.remove('playing');
        });

        this.audio.addEventListener('ended', () => {
            this.onTrackEnded();
        });

        // Error handling
        this.audio.addEventListener('error', (e) => {
            this.handleAudioError(e);
        });

        this.audio.addEventListener('stalled', () => {
            console.warn('Audio stalled');
            this.setStatus('Conexión lenta...');
        });

        this.audio.addEventListener('waiting', () => {
            this.setStatus('Buffering...');
        });

        this.audio.addEventListener('playing', () => {
            this.setStatus('');
        });
    }

    loadAudio(audioUrl) {
        if (!this.audio) return;
        
        try {
            this.audio.src = audioUrl;
            this.audio.load();
            
            // Auto-start playing after loading
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Auto-play successful');
                        this.show();
                        this.saveToStorage();
                    })
                    .catch(error => {
                        console.warn('Auto-play prevented:', error);
                        this.show();
                        this.setStatus('Click para reproducir');
                    });
            }
        } catch (error) {
            this.handleAudioError(error);
        }
    }

    handleAudioError(error) {
        console.error('Audio error:', error);
        this.showLoading(false);
        
        let errorMessage = 'Error de reproducción';
        
        if (error.target && error.target.error) {
            switch(error.target.error.code) {
                case error.target.error.MEDIA_ERR_ABORTED:
                    errorMessage = 'Reproducción cancelada';
                    break;
                case error.target.error.MEDIA_ERR_NETWORK:
                    errorMessage = 'Error de red';
                    break;
                case error.target.error.MEDIA_ERR_DECODE:
                    errorMessage = 'Error de formato de audio';
                    break;
                case error.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Formato no soportado';
                    break;
                default:
                    errorMessage = 'Error desconocido';
            }
        }
        
        this.setStatus(`❌ ${errorMessage}`);
        
        // Intentar retry automático
        if (this.retryCount < this.maxRetries && this.currentSession) {
            this.retryCount++;
            this.setStatus(`Reintentando... (${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => {
                this.loadAudio(this.currentSession.audioUrl);
            }, 2000);
        } else {
            this.playBtn.disabled = true;
            this.showError(errorMessage);
        }
    }

    onTrackEnded() {
        this.isPlaying = false;
        this.playBtn.textContent = '▶';
        this.playBtn.classList.remove('playing');
        this.progressFill.style.width = '0%';
        this.currentTimeEl.textContent = '0:00';
        this.setStatus('Sesión finalizada');
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (!this.isPlaying) {
                this.hide();
            }
        }, 5000);
    }

    play() {
        this.logger.log('AUDIO', 'play() llamado', {
            hasAudio: !!this.audio,
            isLoading: this.isLoading,
            audioPaused: this.audio ? this.audio.paused : null,
            audioReadyState: this.audio ? this.audio.readyState : null
        });

        if (!this.audio) {
            this.logger.log('ERROR', 'play(): No hay elemento de audio');
            return;
        }

        if (this.isLoading) {
            this.logger.log('WARN', 'play(): Audio aún cargando, ignorando llamada');
            return;
        }

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.logger.log('SUCCESS', 'Audio global reproduciendo correctamente');
                    console.log('Global audio playing');
                    this.setStatus('');
                    
                    // Actualizar MediaSession state para iOS
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'playing';
                        this.updateMediaSessionPosition();
                        this.logger.log('INFO', 'MediaSession playbackState actualizado a playing');
                    }
                })
                .catch(error => {
                    this.logger.log('ERROR', 'Error al reproducir audio global', {
                        error: error.message,
                        name: error.name,
                        audioSrc: this.audio ? this.audio.src : null
                    });
                    console.error('Global audio play error:', error);
                    this.setStatus('Error al reproducir');
                });
        } else {
            this.logger.log('WARN', 'play(): playPromise es undefined');
        }
    }

    pause() {
        this.logger.log('AUDIO', 'pause() llamado', {
            hasAudio: !!this.audio,
            isPlaying: this.isPlaying
        });

        if (this.audio) {
            this.audio.pause();
            this.logger.log('SUCCESS', 'Audio global pausado');
            console.log('Global audio paused');
            
            // Actualizar MediaSession state para iOS
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
                this.logger.log('INFO', 'MediaSession playbackState actualizado a paused');
            }
        } else {
            this.logger.log('WARN', 'pause(): No hay elemento de audio');
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
        this.currentSession = null;
        this.playBtn.textContent = '▶';
        this.playBtn.classList.remove('playing');
        this.playBtn.disabled = true;
        this.hide();
        this.clearStorage();
        this.setStatus('');
        console.log('Global audio stopped');
    }

    togglePlayPause() {
        this.logger.log('AUDIO', 'togglePlayPause llamado', {
            isPlaying: this.isPlaying,
            hasAudio: !!this.audio,
            audioPaused: this.audio ? this.audio.paused : null,
            audioSrc: this.audio ? this.audio.src : null
        });

        if (!this.audio) {
            this.logger.log('ERROR', 'togglePlayPause: No hay elemento de audio disponible');
            return;
        }

        if (this.isPlaying) {
            this.logger.log('AUDIO', 'Pausando reproductor global...');
            this.pause();
            
            // Sync with main player
            const mainAudio = document.getElementById('mainAudioPlayer');
            if (mainAudio && !mainAudio.paused) {
                mainAudio.pause();
                window.userPausedAudio = true;
                this.logger.log('AUDIO', 'Audio principal sincronizado - pausado');
            }
        } else {
            this.logger.log('AUDIO', 'Iniciando reproducción en reproductor global...');
            this.play();
            
            // Sync with main player
            const mainAudio = document.getElementById('mainAudioPlayer');
            if (mainAudio && mainAudio.paused) {
                mainAudio.currentTime = this.audio.currentTime;
                mainAudio.play().catch(e => {
                    this.logger.log('ERROR', 'Falló sincronización con audio principal', { error: e.message });
                    console.log('Main audio sync play failed:', e);
                });
                window.userPausedAudio = false;
                this.logger.log('AUDIO', 'Audio principal sincronizado - reproduciendo');
            }
        }
    }

    seekTo(time) {
        if (this.audio && this.audio.duration) {
            this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
        }
    }

    seekRelative(seconds) {
        if (this.audio) {
            this.seekTo(this.audio.currentTime + seconds);
        }
    }



    updateProgress() {
        if (this.audio && this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = percent + '%';
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);

            // Persist progress
            this.saveToStorage();
        }
    }

    updateBuffer() {
        if (this.audio && this.audio.duration && this.progressBuffer) {
            try {
                const buffered = this.audio.buffered;
                if (buffered.length > 0) {
                    const bufferEnd = buffered.end(buffered.length - 1);
                    const bufferPercent = (bufferEnd / this.audio.duration) * 100;
                    this.progressBuffer.style.width = bufferPercent + '%';
                }
            } catch (e) {
                // Ignore buffering errors
            }
        }
    }

    formatTime(seconds) {
        if (!seconds || !isFinite(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    show() {
        this.player.classList.add('active');
    }

    hide() {
        this.player.classList.remove('active');
    }

    showLoading(show) {
        this.isLoading = show;
        if (this.loadingEl) {
            this.loadingEl.style.display = show ? 'flex' : 'none';
        }
    }

    setStatus(message) {
        if (this.statusEl) {
            this.statusEl.textContent = message;
            this.statusEl.style.display = message ? 'block' : 'none';
        }
    }

    showError(message) {
        this.setStatus(`❌ ${message}`);
        setTimeout(() => {
            this.setStatus('');
        }, 5000);
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `player-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    isPlayerActive() {
        return this.player && this.player.classList.contains('active');
    }

    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }

    updateMediaSession() {
        if (!('mediaSession' in navigator) || !this.currentSession) return;

        const extractImage = (html) => {
            if (!html) return '';
            const match = html.match(/src="([^"]+)"/i);
            return match ? match[1] : '';
        };

        const artworkUrl = this.currentSession.artworkUrl || extractImage(this.currentSession.cover);

        navigator.mediaSession.metadata = new MediaMetadata({
            title: this.currentSession.title || '',
            artist: this.currentSession.artist || '',
            album: this.currentSession.subtitle || '',
            artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }] : []
        });

        if (this.audio) {
            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skip = details.seekOffset || 10;
                this.seekRelative(-skip);
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skip = details.seekOffset || 10;
                this.seekRelative(skip);
            });
        }
    }

    saveToStorage() {
        if (this.currentSession) {
            try {
                localStorage.setItem('globalPlayer', JSON.stringify({
                    session: this.currentSession,
                    currentTime: this.audio ? this.audio.currentTime : 0,
                    isPlaying: this.isPlaying,
                    volume: this.audio ? this.audio.volume : 1
                }));
            } catch (e) {
                console.warn('Could not save to localStorage:', e);
            }
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('globalPlayer');
            if (saved) {
                this.savedState = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading saved session:', e);
            localStorage.removeItem('globalPlayer');
        }
    }

    clearStorage() {
        try {
            localStorage.removeItem('globalPlayer');
            localStorage.removeItem('continueGlobalPlayer');
            localStorage.removeItem('globalPlayerSession');
        } catch (e) {
            console.warn('Could not clear localStorage:', e);
        }
    }
}

// Initialize global player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.globalAudioPlayer = new GlobalAudioPlayer();
    console.log('Global audio player initialized');

    document.querySelectorAll('.nav-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (history.length > 1) {
                history.back();
            } else {
                window.location.href = btn.getAttribute('href') || 'index.html';
            }
        });
    });
});

// Function to start global player from any page
window.startGlobalPlayer = (sessionData) => {
    if (window.globalAudioPlayer) {
        window.globalAudioPlayer.startSession(sessionData);
    } else {
        // Queue the session to start when player is ready
        document.addEventListener('DOMContentLoaded', () => {
            if (window.globalAudioPlayer) {
                window.globalAudioPlayer.startSession(sessionData);
            }
        });
    }
};