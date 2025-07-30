// Global Audio Player - Versión mejorada con manejo de errores
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
        this.volumeControl = null;
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
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
                        <div class="volume-control">
                            <button class="volume-btn" id="volumeBtn">🔊</button>
                            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100">
                        </div>
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
        this.volumeControl = document.getElementById('volumeSlider');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.statusEl = document.getElementById('playerStatus');
        this.loadingEl = document.getElementById('loadingIndicator');
    }

    bindEvents() {
        // Play/pause button
        this.playBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Progress bar click
        document.getElementById('globalProgressBar').addEventListener('click', (e) => {
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
            }
        });

        // Volume controls
        this.volumeControl.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        this.volumeBtn.addEventListener('click', () => {
            this.toggleMute();
        });

        // Close button
        document.getElementById('globalPlayerClose').addEventListener('click', () => {
            this.stop();
        });

        // Listen for play events from other players
        window.addEventListener('globalPlayerStart', (e) => {
            this.startSession(e.detail);
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden, global player continues');
            } else {
                console.log('Page visible, global player active');
                // Verificar si el audio sigue siendo válido
                if (this.audio && this.audio.error) {
                    this.handleAudioError(this.audio.error);
                }
            }
        });

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
                    case 'ArrowUp':
                        e.preventDefault();
                        this.adjustVolume(0.1);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.adjustVolume(-0.1);
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

        // Create new audio element
        this.audio = new Audio();
        this.setupAudioEventListeners();
        
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
        if (this.audio && !this.isLoading) {
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Global audio playing');
                        this.setStatus('');
                    })
                    .catch(error => {
                        console.error('Global audio play error:', error);
                        this.setStatus('Error al reproducir');
                    });
            }
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            console.log('Global audio paused');
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
        if (this.isPlaying) {
            this.pause();
            
            // Sync with main player
            const mainAudio = document.getElementById('mainAudioPlayer');
            if (mainAudio && !mainAudio.paused) {
                mainAudio.pause();
                window.userPausedAudio = true;
            }
        } else {
            this.play();
            
            // Sync with main player
            const mainAudio = document.getElementById('mainAudioPlayer');
            if (mainAudio && mainAudio.paused) {
                mainAudio.currentTime = this.audio.currentTime;
                mainAudio.play().catch(e => console.log('Main audio sync play failed:', e));
                window.userPausedAudio = false;
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

    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
            this.updateVolumeUI();
        }
    }

    adjustVolume(delta) {
        if (this.audio) {
            this.setVolume(this.audio.volume + delta);
        }
    }

    toggleMute() {
        if (this.audio) {
            this.audio.muted = !this.audio.muted;
            this.updateVolumeUI();
        }
    }

    updateVolumeUI() {
        if (this.audio && this.volumeControl && this.volumeBtn) {
            this.volumeControl.value = this.audio.volume * 100;
            this.volumeBtn.textContent = this.audio.muted || this.audio.volume === 0 ? '🔇' : 
                                       this.audio.volume < 0.5 ? '🔉' : '🔊';
        }
    }

    updateProgress() {
        if (this.audio && this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = percent + '%';
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
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
                const data = JSON.parse(saved);
                // Auto-resume is disabled to avoid unexpected audio playback
                console.log('Saved session found but auto-resume disabled for better UX');
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