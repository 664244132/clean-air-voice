/**
 * UI Controller Module
 */

export class UIController {
  constructor() {
    this.statusDot = document.querySelector('#status-dot');
    this.statusText = document.querySelector('#status-text');
    this.micBtn = document.querySelector('#mic-btn');
    this.micIcon = document.querySelector('#mic-icon');
    this.stopIcon = document.querySelector('#stop-icon');
    this.micGlow = document.querySelector('#mic-glow');
    this.pulseRings = document.querySelector('#pulse-rings');
    this.transcriptBox = document.querySelector('#transcript-box');
    this.transcriptText = document.querySelector('#transcript-text');
    this.videoModal = document.querySelector('#video-modal');
    this.videoPlayer = document.querySelector('#video-player');
    this.closeVideoBtn = document.querySelector('#close-video-btn');
  }

  setStatus(state, message) {
    if (this.statusText) this.statusText.textContent = message;

    if (!this.statusDot) return;

    if (state === 'recording') {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.9)]';
    } else if (state === 'connecting') {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    } else if (state === 'ready') {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]';
    } else {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
    }
  }

  setMicState(isActive) {
    if (isActive) {
      if (this.micIcon) this.micIcon.classList.add('hidden');
      if (this.stopIcon) this.stopIcon.classList.remove('hidden');
      if (this.pulseRings) this.pulseRings.classList.remove('hidden');
      if (this.micGlow) {
        this.micGlow.style.boxShadow = '0 0 70px rgba(6,182,212,0.25), 0 0 140px rgba(6,182,212,0.1)';
      }
    } else {
      if (this.micIcon) this.micIcon.classList.remove('hidden');
      if (this.stopIcon) this.stopIcon.classList.add('hidden');
      if (this.pulseRings) this.pulseRings.classList.add('hidden');
      if (this.micGlow) {
        this.micGlow.style.boxShadow = 'none';
      }
    }
  }

  setTranscript(text, isInput = true) {
    if (!this.transcriptBox || !this.transcriptText) return;

    if (!text) {
      this.transcriptBox.classList.add('hidden');
      this.transcriptText.textContent = '';
      return;
    }

    this.transcriptBox.classList.remove('hidden');
    const prefix = isInput ? '🎙 ได้ยิน: ' : '🤖 AI: ';
    this.transcriptText.textContent = prefix + text;
  }

  showVideo() {
    if (!this.videoModal || !this.videoPlayer) return;
    this.videoModal.classList.remove('hidden');
    this.videoPlayer.currentTime = 0;
    this.videoPlayer.play().catch((err) => {
      console.warn('Video auto-play deferred:', err);
    });
  }

  hideVideo() {
    if (!this.videoModal || !this.videoPlayer) return;
    this.videoPlayer.pause();
    this.videoModal.classList.add('hidden');
  }

  onVideoEnded(callback) {
    if (!this.videoPlayer) return;
    this.videoPlayer.onended = () => {
      this.hideVideo();
      if (callback) callback();
    };
  }

  onCloseVideo(callback) {
    if (!this.closeVideoBtn) return;
    this.closeVideoBtn.onclick = () => {
      this.hideVideo();
      if (callback) callback();
    };
  }

  onMicClick(callback) {
    if (!this.micBtn) return;
    this.micBtn.onclick = callback;
  }
}
