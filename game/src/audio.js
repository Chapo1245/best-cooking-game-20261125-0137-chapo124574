// audio.js — one job: tiny synthesized kitchen sounds over WebAudio, no files.
// Every call is guarded: silence (never a crash) when audio is unavailable.
(function () {
  'use strict';

  var ctx = null;
  var muted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, gain, when) {
    if (muted) return;
    var ac = ensureCtx();
    if (!ac) return;
    try {
      var t0 = ac.currentTime + (when || 0);
      var osc = ac.createOscillator();
      var g = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(gain || 0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* sound is decoration, never fatal */ }
  }

  function noiseBurst(dur, gain) {
    if (muted) return;
    var ac = ensureCtx();
    if (!ac) return;
    try {
      var len = Math.floor(ac.sampleRate * dur);
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ac.createBufferSource();
      var g = ac.createGain();
      g.gain.value = gain || 0.08;
      src.buffer = buf;
      src.connect(g);
      g.connect(ac.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  var SOUNDS = {
    pickup: function () { tone(520, 0.08, 'triangle', 0.10); },
    chop: function () { noiseBurst(0.09, 0.14); tone(180, 0.07, 'square', 0.05); },
    sizzle: function () { noiseBurst(0.35, 0.06); },
    ding: function () { tone(880, 0.18, 'sine', 0.12); tone(1320, 0.25, 'sine', 0.08, 0.09); },
    serve: function () { tone(523, 0.12, 'triangle', 0.12); tone(659, 0.12, 'triangle', 0.12, 0.10); tone(784, 0.22, 'triangle', 0.12, 0.20); },
    bad: function () { tone(220, 0.22, 'sawtooth', 0.07); tone(165, 0.30, 'sawtooth', 0.07, 0.12); },
    order: function () { tone(660, 0.10, 'sine', 0.09); tone(990, 0.14, 'sine', 0.09, 0.10); },
    rush: function () { tone(440, 0.10, 'square', 0.07); tone(440, 0.10, 'square', 0.07, 0.14); tone(587, 0.16, 'square', 0.07, 0.28); }
  };

  function play(name) {
    var fn = SOUNDS[name];
    if (fn) fn();
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) { /* ignore */ }
    }
  }

  window.DAPUR_AUDIO = { play: play, toggleMute: toggleMute, unlock: unlock, isMuted: function () { return muted; } };
})();
