// Global Audio Player
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
        this.init();
    }

    init() {
        this.createPlayer();
        this.bindEvents();
        this.loadFromStorage();
    }

    createPlayer() {
        // Create player HTML
        const playerHTML = `
            <div class="global-audio-player" id="globalPlayer">
                <div class="global-player-content">
                    <div class="global-player-info">
                        <div class="global-player-title" id="globalPlayerTitle">Título de sesión</div>
                        <div class="global-player-subtitle" id="globalPlayerSubtitle">Artista</div>
                    </div>
                    <div class="global-player-controls">
                        <button class="global-control-btn" id="globalPlayBtn">▶</button>
                    </div>
                    <div class="global-player-progress">
                        <span class="global-time" id="globalCurrentTime">0:00</span>
                        <div class="global-progress-bar" id="globalProgressBar">
                            <div class="global-progress-fill" id="globalProgressFill"></div>
                        </div>
                        <span class="global-time" id="globalTotalTime">0:00</span>
                    </div>
                    <button class="global-player-close" id="globalPlayerClose">×</button>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', playerHTML);

        // Get references
        this.player = document.getElementById('globalPlayer');
        this.progressFill = document.getElementById('globalProgressFill');
        this.currentTimeEl = document.getElementById('globalCurrentTime');
        this.totalTimeEl = document.getElementById('globalTotalTime');
        this.playBtn = document.getElementById('globalPlayBtn');
        this.titleEl = document.getElementById('globalPlayerTitle');
        this.subtitleEl = document.getElementById('globalPlayerSubtitle');
    }

    bindEvents() {
        // Play/pause button
        this.playBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Progress bar click
        document.getElementById('globalProgressBar').addEventListener('click', (e) => {
            if (this.audio) {
                const rect = e.target.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            }
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
            }
        });
    }

    startSession(sessionData) {
        console.log('Starting global session:', sessionData);
        
        // Stop current audio if playing
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        // Create new audio element
        this.audio = new Audio(sessionData.audioUrl);
        this.currentSession = sessionData;

        // Update UI
        this.titleEl.textContent = sessionData.title;
        this.subtitleEl.textContent = sessionData.subtitle;

        // Audio event listeners
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playBtn.textContent = '▶';
            this.playBtn.classList.remove('playing');
            this.progressFill.style.width = '0%';
            this.currentTimeEl.textContent = '0:00';
        });

        this.audio.addEventListener('loadstart', () => {
            console.log('Global audio loading started');
        });

        this.audio.addEventListener('canplay', () => {
            console.log('Global audio can play');
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Global audio error:', e);
        });

        // Start playing
        this.play();
        this.show();
        this.saveToStorage();
    }

    play() {
        if (this.audio) {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.playBtn.textContent = '⏸';
                this.playBtn.classList.add('playing');
                console.log('Global audio playing');
            }).catch(e => {
                console.error('Global audio play error:', e);
            });
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            this.playBtn.textContent = '▶';
            this.playBtn.classList.remove('playing');
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
        this.hide();
        this.clearStorage();
        console.log('Global audio stopped');
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    updateProgress() {
        if (this.audio) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = percent + '%';
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    formatTime(seconds) {
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

    saveToStorage() {
        if (this.currentSession) {
            localStorage.setItem('globalPlayer', JSON.stringify({
                session: this.currentSession,
                currentTime: this.audio ? this.audio.currentTime : 0,
                isPlaying: this.isPlaying
            }));
        }
    }

    loadFromStorage() {
        const saved = localStorage.getItem('globalPlayer');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Auto-resume is disabled to avoid unexpected audio playback
                // Users need to manually start sessions
                console.log('Saved session found but auto-resume disabled');
            } catch (e) {
                console.error('Error loading saved session:', e);
            }
        }
    }

    clearStorage() {
        localStorage.removeItem('globalPlayer');
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
            window.globalAudioPlayer.startSession(sessionData);
        });
    }
};