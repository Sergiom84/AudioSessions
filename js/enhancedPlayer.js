// EnhancedPlayer.js - Advanced Audio Player with Spectrum Analysis
// Includes AudioContext effects, visualization, and enhanced controls

class EnhancedAudioPlayer {
    constructor(options = {}) {
        this.options = {
            enableSpectrum: options.enableSpectrum !== false,
            enableEqualizer: options.enableEqualizer || false,
            enableEffects: options.enableEffects || false,
            enableVisualization: options.enableVisualization !== false,
            fftSize: options.fftSize || 2048,
            smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
            bufferSize: options.bufferSize || 2048,
            crossfadeTime: options.crossfadeTime || 1.0,
            ...options
        };

        // Audio components
        this.audioContext = null;
        this.audioElement = null;
        this.sourceNode = null;
        this.analyserNode = null;
        this.gainNode = null;
        this.eqNodes = [];
        this.effectsChain = [];

        // Spectrum analysis data
        this.frequencyData = null;
        this.timeData = null;
        this.spectrumCanvas = null;
        this.spectrumContext = null;
        this.animationFrame = null;

        // Player state
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1.0;
        this.crossfading = false;

        // Event handlers
        this.eventHandlers = {
            timeupdate: [],
            ended: [],
            error: [],
            loadstart: [],
            loadeddata: [],
            canplaythrough: [],
            spectrumupdate: [],
            statechange: []
        };

        // Buffer management
        this.bufferManager = {
            buffers: new Map(),
            preloadQueue: [],
            maxBuffers: 10
        };

        this.init();
    }

    async init() {
        console.log('EnhancedPlayer: Initializing...');
        
        try {
            await this.initAudioContext();
            this.setupEventSystem();
            console.log('EnhancedPlayer: Initialization complete');
        } catch (error) {
            console.error('EnhancedPlayer: Initialization failed:', error);
            throw error;
        }
    }

    // Initialize Web Audio Context
    async initAudioContext() {
        if (this.audioContext) return;

        try {
            // Create AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Handle suspended context (required by browser policies)
            if (this.audioContext.state === 'suspended') {
                console.log('EnhancedPlayer: AudioContext suspended, waiting for user interaction...');
            }

            // Create base nodes
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);

            // Setup analyzer for spectrum analysis
            if (this.options.enableSpectrum) {
                this.setupSpectrumAnalyzer();
            }

            // Setup equalizer
            if (this.options.enableEqualizer) {
                this.setupEqualizer();
            }

            console.log('EnhancedPlayer: AudioContext initialized');
        } catch (error) {
            console.error('EnhancedPlayer: AudioContext initialization failed:', error);
            throw error;
        }
    }

    // Setup spectrum analyzer
    setupSpectrumAnalyzer() {
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = this.options.fftSize;
        this.analyserNode.smoothingTimeConstant = this.options.smoothingTimeConstant;

        // Create data arrays
        this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount);

        console.log('EnhancedPlayer: Spectrum analyzer initialized');
    }

    // Setup equalizer bands
    setupEqualizer() {
        const frequencies = [60, 170, 350, 1000, 3500, 10000]; // Standard EQ frequencies
        
        this.eqNodes = frequencies.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = 0;
            return filter;
        });

        // Connect EQ chain
        this.connectEqualizer();
        
        console.log('EnhancedPlayer: Equalizer initialized with', frequencies.length, 'bands');
    }

    // Connect equalizer in audio chain
    connectEqualizer() {
        if (this.eqNodes.length === 0) return;

        // Connect first EQ node to source
        let previousNode = this.sourceNode;
        
        // Chain EQ nodes
        this.eqNodes.forEach((eqNode, index) => {
            if (previousNode) {
                previousNode.connect(eqNode);
            }
            previousNode = eqNode;
        });

        // Connect last EQ node to analyzer/gain
        if (previousNode) {
            if (this.analyserNode) {
                previousNode.connect(this.analyserNode);
                this.analyserNode.connect(this.gainNode);
            } else {
                previousNode.connect(this.gainNode);
            }
        }
    }

    // Load and play audio
    async loadAndPlay(audioUrl, options = {}) {
        console.log('EnhancedPlayer: Loading audio:', audioUrl);

        try {
            // Resume AudioContext if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create or reuse audio element
            if (!this.audioElement) {
                this.audioElement = new Audio();
                this.setupAudioElement();
            }

            // Load audio
            this.audioElement.src = audioUrl;
            this.audioElement.load();

            // Wait for enough data to play
            await new Promise((resolve, reject) => {
                const onCanPlay = () => {
                    this.audioElement.removeEventListener('canplaythrough', onCanPlay);
                    this.audioElement.removeEventListener('error', onError);
                    resolve();
                };

                const onError = (error) => {
                    this.audioElement.removeEventListener('canplaythrough', onCanPlay);
                    this.audioElement.removeEventListener('error', onError);
                    reject(error);
                };

                this.audioElement.addEventListener('canplaythrough', onCanPlay);
                this.audioElement.addEventListener('error', onError);
            });

            // Connect to Web Audio
            await this.connectAudioElement();

            // Start playback if requested
            if (options.autoplay !== false) {
                await this.play();
            }

            this.emit('loadeddata', { url: audioUrl });
            
        } catch (error) {
            console.error('EnhancedPlayer: Load failed:', error);
            this.emit('error', { error, url: audioUrl });
            throw error;
        }
    }

    // Setup audio element event listeners
    setupAudioElement() {
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
        });

        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
        });

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.stopSpectrum();
            this.emit('ended', {});
        });

        this.audioElement.addEventListener('error', (error) => {
            console.error('EnhancedPlayer: Audio element error:', error);
            this.emit('error', { error });
        });

        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.startSpectrum();
            this.emit('statechange', { playing: true });
        });

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.stopSpectrum();
            this.emit('statechange', { playing: false });
        });
    }

    // Connect audio element to Web Audio
    async connectAudioElement() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }

        // Create MediaElementSource
        this.sourceNode = this.audioContext.createMediaElementAudioSource(this.audioElement);

        // Connect audio chain
        if (this.options.enableEqualizer && this.eqNodes.length > 0) {
            this.connectEqualizer();
        } else if (this.analyserNode) {
            this.sourceNode.connect(this.analyserNode);
            this.analyserNode.connect(this.gainNode);
        } else {
            this.sourceNode.connect(this.gainNode);
        }

        console.log('EnhancedPlayer: Audio element connected to Web Audio');
    }

    // Play audio
    async play() {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            await this.audioElement.play();
            this.isPlaying = true;
            this.startSpectrum();
            
            console.log('EnhancedPlayer: Playback started');
        } catch (error) {
            console.error('EnhancedPlayer: Play failed:', error);
            throw error;
        }
    }

    // Pause audio
    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isPlaying = false;
            this.stopSpectrum();
        }
    }

    // Stop audio
    stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isPlaying = false;
            this.stopSpectrum();
        }
    }

    // Seek to time
    seekTo(time) {
        if (this.audioElement) {
            this.audioElement.currentTime = Math.max(0, Math.min(time, this.duration));
        }
    }

    // Set volume
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
    }

    // Crossfade to new track
    async crossfadeTo(newUrl, fadeTime = 1.0) {
        if (this.crossfading) return;
        
        console.log('EnhancedPlayer: Crossfading to:', newUrl);
        this.crossfading = true;

        try {
            // Create second audio element for crossfade
            const newAudio = new Audio();
            newAudio.src = newUrl;
            newAudio.volume = 0;
            
            await new Promise((resolve, reject) => {
                newAudio.addEventListener('canplaythrough', resolve);
                newAudio.addEventListener('error', reject);
                newAudio.load();
            });

            // Start new track
            await newAudio.play();

            // Crossfade
            const fadeSteps = 50;
            const stepTime = (fadeTime * 1000) / fadeSteps;
            
            for (let i = 0; i <= fadeSteps; i++) {
                const progress = i / fadeSteps;
                const oldVolume = this.volume * (1 - progress);
                const newVolume = this.volume * progress;

                this.audioElement.volume = oldVolume;
                newAudio.volume = newVolume;

                await new Promise(resolve => setTimeout(resolve, stepTime));
            }

            // Switch to new audio
            this.stop();
            this.audioElement = newAudio;
            this.setupAudioElement();
            await this.connectAudioElement();

        } catch (error) {
            console.error('EnhancedPlayer: Crossfade failed:', error);
        } finally {
            this.crossfading = false;
        }
    }

    // Start spectrum visualization
    startSpectrum() {
        if (!this.options.enableSpectrum || !this.analyserNode || this.animationFrame) {
            return;
        }

        const updateSpectrum = () => {
            if (!this.isPlaying) return;

            // Get frequency and time data
            this.analyserNode.getByteFrequencyData(this.frequencyData);
            this.analyserNode.getByteTimeDomainData(this.timeData);

            // Emit spectrum data
            this.emit('spectrumupdate', {
                frequencyData: this.frequencyData,
                timeData: this.timeData
            });

            // Draw visualization if canvas available
            if (this.spectrumCanvas) {
                this.drawSpectrum();
            }

            this.animationFrame = requestAnimationFrame(updateSpectrum);
        };

        updateSpectrum();
    }

    // Stop spectrum visualization
    stopSpectrum() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Draw spectrum on canvas
    drawSpectrum() {
        if (!this.spectrumContext || !this.frequencyData) return;

        const canvas = this.spectrumCanvas;
        const ctx = this.spectrumContext;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Draw frequency bars
        const barWidth = width / this.frequencyData.length;
        let x = 0;

        for (let i = 0; i < this.frequencyData.length; i++) {
            const barHeight = (this.frequencyData[i] / 255) * height;
            
            // Color based on frequency
            const hue = (i / this.frequencyData.length) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth;
        }
    }

    // Setup spectrum canvas
    setupSpectrumCanvas(canvas) {
        this.spectrumCanvas = canvas;
        this.spectrumContext = canvas.getContext('2d');
        
        // Setup canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        this.spectrumContext.scale(devicePixelRatio, devicePixelRatio);
        
        console.log('EnhancedPlayer: Spectrum canvas setup complete');
    }

    // EQ controls
    setEQBand(bandIndex, gain) {
        if (this.eqNodes[bandIndex]) {
            this.eqNodes[bandIndex].gain.value = Math.max(-12, Math.min(12, gain));
        }
    }

    getEQBand(bandIndex) {
        return this.eqNodes[bandIndex] ? this.eqNodes[bandIndex].gain.value : 0;
    }

    resetEQ() {
        this.eqNodes.forEach(node => {
            node.gain.value = 0;
        });
    }

    // Get audio analysis data
    getAnalysisData() {
        if (!this.frequencyData || !this.timeData) return null;

        // Calculate RMS (volume level)
        let rms = 0;
        for (let i = 0; i < this.timeData.length; i++) {
            rms += Math.pow((this.timeData[i] - 128) / 128, 2);
        }
        rms = Math.sqrt(rms / this.timeData.length);

        // Calculate dominant frequency
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            if (this.frequencyData[i] > maxValue) {
                maxValue = this.frequencyData[i];
                maxIndex = i;
            }
        }
        
        const dominantFreq = (maxIndex * this.audioContext.sampleRate) / (this.analyserNode.fftSize * 2);

        return {
            rms,
            dominantFrequency: dominantFreq,
            frequencyData: Array.from(this.frequencyData),
            timeData: Array.from(this.timeData),
            timestamp: performance.now()
        };
    }

    // Event system
    addEventListener(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        }
    }

    removeEventListener(event, handler) {
        if (this.eventHandlers[event]) {
            const index = this.eventHandlers[event].indexOf(handler);
            if (index > -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('EnhancedPlayer: Event handler error:', error);
                }
            });
        }
    }

    // Setup event system
    setupEventSystem() {
        // Handle visibility change to pause/resume analysis
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.stopSpectrum();
            } else if (!document.hidden && this.isPlaying) {
                this.startSpectrum();
            }
        });
    }

    // Get current state
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume,
            crossfading: this.crossfading,
            hasAnalyzer: !!this.analyserNode,
            hasEqualizer: this.eqNodes.length > 0,
            audioContextState: this.audioContext ? this.audioContext.state : 'none'
        };
    }

    // Cleanup
    destroy() {
        console.log('EnhancedPlayer: Cleaning up...');
        
        this.stopSpectrum();
        this.pause();
        
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        // Clear event handlers
        Object.keys(this.eventHandlers).forEach(event => {
            this.eventHandlers[event] = [];
        });
    }
}

// Export for use in other modules
window.EnhancedAudioPlayer = EnhancedAudioPlayer;

console.log('EnhancedAudioPlayer: Module loaded successfully');