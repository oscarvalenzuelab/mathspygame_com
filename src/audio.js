class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.oscillators = [];
        this.pulseInterval = null;
        this.melodyTimeout = null;
        this.sequencePattern = [
            { freq: 392, duration: 0.35 },
            { freq: 440, duration: 0.35 },
            { freq: 523, duration: 0.4 },
            { freq: 415, duration: 0.35 },
            { freq: 466, duration: 0.35 },
            { freq: 554, duration: 0.45 },
            { freq: 349, duration: 0.4 },
            { freq: 392, duration: 0.4 }
        ];
    }

    initContext() {
        if (this.audioCtx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.audioCtx = new AudioCtx();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.12;
        this.masterGain.connect(this.audioCtx.destination);
    }

    startBackgroundMusic() {
        if (this.isPlaying) return;
        this.initContext();
        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.createAmbientPad();
        this.createSpyPulse();
        this.startAliasSequence();
        this.isPlaying = true;
    }

    stopBackgroundMusic() {
        if (!this.audioCtx || !this.isPlaying) return;

        this.oscillators.forEach(node => {
            try {
                node.stop();
            } catch (err) {
                // Ignore if already stopped
            }
            node.disconnect?.();
        });
        this.oscillators = [];

        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }

        if (this.melodyTimeout) {
            clearTimeout(this.melodyTimeout);
            this.melodyTimeout = null;
        }

        this.isPlaying = false;
    }

    canPlaySfx() {
        if (!this.audioCtx) {
            this.initContext();
        }
        if (!this.audioCtx) return false;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return true;
    }

    createAmbientPad() {
        const frequencies = [220, 277, 330]; // Minor chord vibe
        frequencies.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sawtooth';

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500 + index * 80;

            const gain = this.audioCtx.createGain();
            gain.gain.value = 0.035 + index * 0.01;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            this.oscillators.push(osc);
        });

        // Add a subtle bass underneath
        const bassOsc = this.audioCtx.createOscillator();
        bassOsc.type = 'triangle';
        bassOsc.frequency.value = 110;
        const bassGain = this.audioCtx.createGain();
        bassGain.gain.value = 0.06;
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start();
        this.oscillators.push(bassOsc);
    }

    createSpyPulse() {
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
        }

        this.pulseInterval = setInterval(() => {
            if (!this.audioCtx || this.audioCtx.state === 'closed') return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880; // high pitched ping

            gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, this.audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.45);
        }, 1400);
    }

    startAliasSequence() {
        const totalDuration = this.sequencePattern.reduce((acc, note) => acc + note.duration + 0.05, 0);

        const playSequence = () => {
            if (!this.audioCtx) return;
            let startTime = this.audioCtx.currentTime;
            this.sequencePattern.forEach(note => {
                this.scheduleNote(note.freq, startTime, note.duration);
                startTime += note.duration + 0.04;
            });

            this.melodyTimeout = setTimeout(playSequence, totalDuration * 1000);
        };

        playSequence();
    }

    scheduleNote(frequency, startTime, duration) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        osc.onended = () => {
            const idx = this.oscillators.indexOf(osc);
            if (idx >= 0) this.oscillators.splice(idx, 1);
        };
        this.oscillators.push(osc);
    }

    playShot() {
        if (!this.canPlaySfx()) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 320;

        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.12);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);
    }

    playItemPickup() {
        if (!this.canPlaySfx()) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(900, this.audioCtx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);
    }

    playDoorSuccess() {
        if (!this.canPlaySfx()) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(650, this.audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.25);
    }

    playDoorBlocked() {
        if (!this.canPlaySfx()) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, this.audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
    }

    playExplosion() {
        if (!this.canPlaySfx()) return;
        const bufferSize = this.audioCtx.sampleRate * 0.5;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
        noise.stop(this.audioCtx.currentTime + 0.5);
    }
}

export default AudioManager;
