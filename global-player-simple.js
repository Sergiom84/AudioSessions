// Reproductor Global Simplificado
class SimpleAudioPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentSession = null;
        this.init();
    }

    init() {
        this.createPlayerUI();
        this.bindEvents();
    }

    createPlayerUI() {
        const playerHTML = `
            <div id="globalPlayer" style="position: fixed; bottom: 0; left: 0; right: 0; background: #111; color: white; padding: 10px; z-index: 1000; display: none;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img id="playerCover" src="" style="width: 50px; height: 50px; object-fit: cover;">
                    <div style="flex: 1;">
                        <div id="playerTitle">No hay audio</div>
                        <div id="playerProgress" style="width: 100%; height: 4px; background: #333; margin-top: 5px;">
                            <div id="playerProgressBar" style="height: 100%; background: #00ff88; width: 0%;"></div>
                        </div>
                    </div>
                    <button id="playPauseBtn" style="background: #00ff88; border: none; padding: 10px; cursor: pointer;">⏸️</button>
                    <input id="volumeSlider" type="range" min="0" max="1" step="0.1" value="0.7" style="width: 100px;">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', playerHTML);
    }

    bindEvents() {
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Atajos de teclado básicos
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.togglePlay();
            }
        });
    }

    loadSession(session) {
        if (!session.audio_url || session.audio_url === '#') return;
        
        this.currentSession = session;
        
        if (this.audio) {
            this.audio.pause();
        }
        
        this.audio = new Audio(session.audio_url);
        this.audio.volume = 0.7;
        
        // Actualizar UI
        document.getElementById('playerCover').src = session.cover;
        document.getElementById('playerTitle').textContent = session.title;
        document.getElementById('globalPlayer').style.display = 'block';
        
        // Eventos de audio
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('loadstart', () => console.log('Cargando audio...'));
        this.audio.addEventListener('canplay', () => console.log('Audio listo para reproducir'));
        
        this.play();
    }

    play() {
        if (this.audio) {
            this.audio.play().then(() => {
                this.isPlaying = true;
                document.getElementById('playPauseBtn').textContent = '⏸️';
            }).catch(e => console.error('Error al reproducir:', e));
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            document.getElementById('playPauseBtn').textContent = '▶️';
        }
    }

    togglePlay() {
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
