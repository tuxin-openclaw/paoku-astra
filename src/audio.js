export function createAudio() {
  let context; let enabled = true;
  return {
    setEnabled(value) { enabled = value; },
    unlock() { try { context ||= new (window.AudioContext || window.webkitAudioContext)(); context.resume().catch(() => {}); } catch { /* Audio is optional. */ } },
    play(type) {
      if (!enabled || !context || context.state !== 'running') return;
      const now = context.currentTime; const oscillator = context.createOscillator(); const gain = context.createGain();
      const notes = { fish: [880, 1320, .12], jump: [280, 580, .16], land: [120, 70, .08], crash: [180, 40, .4], start: [440, 880, .25] };
      const [from, to, length] = notes[type] || notes.fish; oscillator.type = type === 'crash' ? 'sawtooth' : 'sine'; oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + length);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(type === 'crash' ? .065 : .12, now + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + length);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(now); oscillator.stop(now + length + .02);
    },
    dispose() { context?.close().catch(() => {}); }
  };
}
