<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({ demo: { type: Object, required: true } });
const letters = (props.demo.letters || [...'WELCOME']).map(String);
const frames = ref(letters.map(() => null));
const stopped = ref(letters.map(() => false));
const spinning = ref(false);
const celebrated = ref(false);
const confetti = ref([]);
const message = ref('');
let ticker = null;
let timers = [];
let motionReduced = false;
let burstSequence = 0;

function clearTimers() {
  if (ticker !== null) { clearInterval(ticker); ticker = null; }
  timers.forEach(clearTimeout);
  timers = [];
}
function randomSymbol() {
  const symbols = props.demo.symbols || [];
  return symbols[Math.floor(Math.random() * symbols.length)] || null;
}
function finish() {
  spinning.value = false;
  celebrated.value = true;
  message.value = props.demo.readyMessage || 'Welcome!';
  if (!motionReduced) {
    burstSequence++;
    confetti.value = Array.from({ length: 52 }, (_, i) => ({
      id: burstSequence + '-' + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.45,
      duration: 1.5 + Math.random() * 1.2,
      color: ['#f4f829', '#35e36b', '#f96b63', '#7bc4ff', '#fff'][i % 5],
      direction: (Math.random() - 0.5) * 170
    }));
    timers.push(setTimeout(() => { confetti.value = []; }, 3400));
  }
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    // This tracks an explicit replay only, never the automatic first animation.
  }
}
function settleInstantly() {
  clearTimers();
  frames.value = letters.map(letter => ({ letter }));
  stopped.value = letters.map(() => true);
  celebrated.value = true;
  spinning.value = false;
  message.value = props.demo.readyMessage || 'Welcome!';
}
function spin(fromUser = false) {
  clearTimers();
  celebrated.value = false;
  message.value = '';
  confetti.value = [];
  if (fromUser && typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'welcome_replay');
  }
  if (motionReduced) {
    settleInstantly();
    return;
  }
  spinning.value = true;
  stopped.value = letters.map(() => false);
  frames.value = letters.map(() => randomSymbol());
  ticker = setInterval(() => {
    frames.value = frames.value.map((frame, index) =>
      stopped.value[index] ? frame : randomSymbol());
  }, 78);
  letters.forEach((letter, index) => {
    const id = setTimeout(() => {
      frames.value = frames.value.map((frame, i) => i === index ? { letter } : frame);
      stopped.value = stopped.value.map((value, i) => i === index ? true : value);
      if (index === letters.length - 1) {
        if (ticker !== null) { clearInterval(ticker); ticker = null; }
        finish();
      }
    }, 700 + index * 170);
    timers.push(id);
  });
}
onMounted(() => {
  motionReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  if (props.demo.autoSpin === false || motionReduced) settleInstantly();
  else spin();
});
onUnmounted(clearTimers);
</script>

<template>
  <div class="welcome-demo demo-ink">
    <div class="demo-heading">
      <div>
        <span class="demo-kicker">Original software · interactive demo</span>
        <h2>{{ demo.title }}</h2>
        <p>{{ demo.subtitle }}</p>
      </div>
      <span class="demo-source">Based on <a :href="demo.sourceRepo" target="_blank" rel="noopener noreferrer">Slot Machine (2023)</a></span>
    </div>
    <div class="slot-stage" aria-label="Seven animated reels spelling WELCOME">
      <div class="slot-rail">
        <div v-for="(letter, i) in letters" :key="i"
             class="slot-window" :class="{ 'slot-running': spinning && !stopped[i], 'slot-stopped': stopped[i] }">
          <span v-if="frames[i]?.letter" class="slot-letter" aria-hidden="true">{{ frames[i].letter }}</span>
          <img v-else-if="frames[i]?.image" :src="frames[i].image" :alt="frames[i].alt" aria-hidden="true" class="slot-fruit" />
          <span v-else class="slot-letter slot-inactive" aria-hidden="true">?</span>
        </div>
      </div>
      <span class="slot-line" aria-hidden="true"></span>
      <div v-if="confetti.length" class="slot-confetti" aria-hidden="true">
        <i v-for="piece in confetti" :key="piece.id"
           :style="{ left: piece.x + '%', background: piece.color,
                     animationDelay: piece.delay + 's', animationDuration: piece.duration + 's',
                     '--drift': piece.direction + 'px' }"></i>
      </div>
    </div>
    <div class="demo-controls">
      <span class="slot-message" aria-live="polite">{{ message || demo.description }}</span>
      <button class="demo-action" type="button" :disabled="spinning" @click="spin(true)">
        {{ spinning ? 'Spinning…' : demo.replayLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.demo-ink { background: #131b1a; color: #f0f7ed; border-radius: 18px; padding: clamp(18px,3vw,32px); box-shadow: 0 12px 35px #0002; }
.demo-heading { display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px; align-items:start; }
.demo-kicker { text-transform:uppercase; letter-spacing:.15em; font-size:.7rem; color:#a9ef95; font-weight:650; }
.demo-heading h2 { font-size:clamp(1.45rem,2.8vw,2.1rem); line-height:1.15; margin:8px 0; letter-spacing:.04em; }
.demo-heading p { margin:0; color:#c8d8cf; }
.demo-source { font-size:.76rem; color:#a6b9ac; }
.demo-source a { color:#bcee99; }
.slot-stage { position:relative; isolation:isolate; padding:32px 8px; overflow:hidden; background:radial-gradient(ellipse at center,#384830,#0b100e); margin:20px 0 14px; border:2px solid #354733; border-radius:14px; }
.slot-rail { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:clamp(3px,1vw,12px); max-width:830px; margin:auto; }
.slot-window { position:relative; aspect-ratio:.88; min-width:0; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:linear-gradient(180deg,#fff 0%,#f0eecb 48%,#d9d7ac 100%); box-shadow:inset 0 3px 7px #0003,0 2px 5px #0005; border:2px solid #ab9f61; color:#28432e; }
.slot-running { filter:blur(.7px); }
.slot-stopped { box-shadow:inset 0 3px 7px #0003,0 0 0 1px #b5ff7f,0 0 15px #88ff532c; }
.slot-letter { font-size:clamp(1.35rem,6vw,4.65rem); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:900; line-height:1; color:#166c30; text-shadow:2px 2px 0 #faeb29; }
.slot-inactive { opacity:.3; }
.slot-fruit { width:90%; height:85%; object-fit:contain; }
.slot-line { position:absolute; left:0; right:0; top:50%; height:2px; background:#f3ff4599; opacity:.28; pointer-events:none; }
.slot-confetti { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:2; }
.slot-confetti i { position:absolute; top:-18px; width:9px; height:14px; animation:slot-fall linear both; }
@keyframes slot-fall { to { transform: translate(var(--drift),360px) rotate(670deg); opacity:0; } }
.demo-controls { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
.slot-message { color:#c9debd; }
.demo-action { cursor:pointer; border:1px solid #baff60; border-radius:8px; color:#111f12; background:#baff60; font-weight:750; padding:.65rem 1.15rem; font-size:.95rem; }
.demo-action:disabled { opacity:.5; cursor:wait; }
.demo-action:focus-visible { outline:2px solid white; outline-offset:3px; }
@media (max-width:520px) { .slot-stage { padding:22px 3px; } .slot-window { border-width:1px; border-radius:5px; } .slot-rail { gap:3px; } .slot-letter { font-size:clamp(1.25rem,6vw,2rem); } }
@media(prefers-reduced-motion:reduce) { .slot-confetti { display:none; } .slot-running { filter:none; } }
</style>
