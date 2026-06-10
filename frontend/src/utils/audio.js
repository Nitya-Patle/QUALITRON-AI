export const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Play 3 rapid "BEEP-BEEP-BEEP" alert sounds
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Sawtooth wave sounds more like an industrial buzzer/alarm
      oscillator.type = "sawtooth"; 
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + i * 0.2); // 800Hz is sharp
      
      // Volume envelope: quick attack, quick fade
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.2 + 0.15);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime + i * 0.2);
      oscillator.stop(ctx.currentTime + i * 0.2 + 0.15);
    }
  } catch (e) {
    console.error("Audio Beep Error:", e);
  }
};
