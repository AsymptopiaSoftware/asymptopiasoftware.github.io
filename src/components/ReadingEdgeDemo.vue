<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  tokenizeParagraph, chooseMissingTokens, choicesForPlaceholder,
  checkReconstruction, pointsForReconstruction
} from '../lib/reading-edge.js';

const props = defineProps({ demo: { type: Object, required: true } });
const tokens = tokenizeParagraph(props.demo.paragraph || '');
const phase = ref('read');
const pct = ref(props.demo.missingPercent || 18);
const missing = ref([]);
const answers = ref({});
const points = ref(0);
const feedback = ref('');
const imageIndex = ref(0);
const modal = ref(null);
const activeId = ref(null);
const options = ref([]);
const muted = ref(true);
const images = props.demo.images || [];
const image = computed(() => images[imageIndex.value] || null);
const missingSet = computed(() => new Set(missing.value));
const score = computed(() => missing.value.length);
function speak(text) {
  if (muted.value || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}
function newMissing(previous = []) {
  missing.value = chooseMissingTokens(tokens, pct.value, previous);
  answers.value = {};
  feedback.value = '';
}
function begin() {
  newMissing();
  phase.value = 'reconstruct';
  speak('Now reconstruct the paragraph to earn some points.');
}
function openChoice(id) {
  if (phase.value !== 'reconstruct') return;
  activeId.value = id;
  options.value = choicesForPlaceholder(tokens, missing.value, id);
  modal.value?.showModal();
}
function selectChoice(choice) {
  if (activeId.value === null) return;
  answers.value = { ...answers.value, [activeId.value]: choice };
  modal.value?.close();
}
function check() {
  if (phase.value !== 'reconstruct') return;
  const passed = checkReconstruction(tokens, missing.value, answers.value);
  if (passed) {
    points.value += pointsForReconstruction(missing.value, true);
    phase.value = 'success';
    feedback.value = props.demo.successLabel + ' You earned ' + score.value + ' points.';
    speak(feedback.value);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'reading_edge_demo_complete');
    }
  } else {
    phase.value = 'failed';
    feedback.value = props.demo.failureLabel;
    speak('Something is not quite right. Try the same paragraph again.');
  }
}
function retry() {
  const prior = [...missing.value];
  newMissing(prior);
  phase.value = 'reconstruct';
}
function readAgain() {
  phase.value = 'read';
  feedback.value = '';
  missing.value = [];
  answers.value = {};
}
function nextImage() {
  if (!images.length) return;
  imageIndex.value = (imageIndex.value + 1) % images.length;
}
function changeWords() {
  if (phase.value !== 'reconstruct') return;
  newMissing(missing.value);
}
function toggleSound() {
  muted.value = !muted.value;
  if (muted.value) window.speechSynthesis?.cancel();
}
onMounted(() => {
  muted.value = !('speechSynthesis' in window);
});
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
});
</script>

<template>
  <div class="reading-edge-demo demo-ink">
    <div class="demo-heading">
      <div>
        <span class="demo-kicker">Interactive reading · the original exercise</span>
        <h2>{{ demo.title }}</h2>
        <p>{{ demo.subtitle }}</p>
      </div>
      <a :href="demo.originalApp" target="_blank" rel="noopener noreferrer" class="demo-original">Open Reading Edge</a>
    </div>

    <div class="reading-stage" :class="{ 'answer-failed': phase === 'failed', 'answer-success': phase === 'success' }">
      <img v-if="image" class="reading-bg" :src="image.src" :alt="image.alt" loading="lazy" />
      <div class="reading-scrim"></div>
      <div class="reading-text-panel">
        <div class="reading-topline">
          <strong>{{ demo.paragraphTitle }}</strong>
          <span class="reading-step">{{ phase === 'read' ? '1 / 2 · READ' : '2 / 2 · RECONSTRUCT' }}</span>
        </div>
        <p v-if="phase === 'read'" class="reading-copy">{{ demo.paragraph }}</p>
        <p v-else class="reading-copy">
          <template v-for="token in tokens" :key="token.id">
            <button v-if="missingSet.has(token.id)"
              type="button" class="choose"
              :class="{ 'filled': answers[token.id] !== undefined }"
              :disabled="phase !== 'reconstruct'"
              :aria-label="'Choose missing word ' + (missing.indexOf(token.id) + 1)"
              @click="openChoice(token.id)">{{ answers[token.id] ?? '[choose]' }}</button>
            <span v-else>{{ token.value }}</span>
          </template>
        </p>
        <div class="reading-feedback" role="status" aria-live="polite">{{ feedback }}</div>
      </div>
      <div class="reading-image-caption" v-if="image">
        <span>{{ image.caption }}</span>
        <button class="image-next" type="button" @click="nextImage" :disabled="images.length < 2" aria-label="Show next image">Next image ›</button>
      </div>
    </div>

    <div class="reading-controls">
      <div class="reading-actions">
        <button v-if="phase === 'read'" type="button" class="demo-action" @click="begin">{{ demo.startLabel }}</button>
        <button v-if="phase === 'reconstruct'" type="button" class="demo-action" @click="check">{{ demo.checkLabel }}</button>
        <button v-if="phase === 'failed'" type="button" class="demo-action" @click="retry">{{ demo.retryLabel }}</button>
        <button v-if="phase === 'success'" type="button" class="demo-action" @click="readAgain">{{ demo.replayLabel }}</button>
        <button v-if="phase === 'reconstruct'" type="button" class="demo-action outline" @click="changeWords">Redo missing words</button>
      </div>
      <div class="reading-options">
        <label :for="'reading-pct'">Missing words: {{ pct }}%</label>
        <input id="reading-pct" v-model.number="pct" type="range" min="5" max="40" step="1"
            :disabled="phase === 'failed' || phase === 'success'" aria-label="Percentage of missing words" />
        <button type="button" class="sound-toggle" @click="toggleSound">{{ muted ? 'Sound off' : 'Sound on' }}</button>
        <span class="points">Points: {{ points }}</span>
      </div>
    </div>

    <div class="reading-credit">
      <p>{{ demo.passageNote }} <a :href="demo.passageSource" target="_blank" rel="noopener noreferrer">Article source</a></p>
      <p v-if="image">
        Photo: {{ image.attribution }} ·
        <a :href="image.source" target="_blank" rel="noopener noreferrer">Image source</a> ·
        <a :href="image.licenseUrl" target="_blank" rel="noopener noreferrer">{{ image.license }}</a>
      </p>
    </div>

    <dialog ref="modal" class="word-dialog" @click="(ev) => { if (ev.target === modal) modal.close(); }">
      <h3>Choose correct word</h3>
      <p>Which word belongs in this exact position?</p>
      <div class="word-options">
        <button v-for="choice in options" :key="choice" type="button" @click="selectChoice(choice)">{{ choice }}</button>
      </div>
      <button type="button" class="cancel-word" @click="modal?.close()">Cancel</button>
    </dialog>
  </div>
</template>

<style scoped>
.demo-ink { background:#151e19; color:#f5f8f0; border-radius:18px; padding:clamp(18px,3vw,32px); box-shadow:0 12px 35px #0002; }
.demo-heading { display:flex; flex-wrap:wrap; align-items:start; justify-content:space-between; gap:16px; margin-bottom:19px; }
.demo-kicker { color:#b9f394; font-size:.7rem; font-weight:650; text-transform:uppercase; letter-spacing:.14em; }
.demo-heading h2 { margin:7px 0; font-size:clamp(1.5rem,2.8vw,2.1rem); }
.demo-heading p { margin:0; color:#c2d5c6; }
.demo-original { color:#a9ed90; font-size:.85rem; }
.reading-stage { border:3px solid #465a4c; border-radius:14px; min-height:360px; overflow:hidden; position:relative; display:flex; flex-direction:column; justify-content:space-between; isolation:isolate; background:#263b31; }
.reading-stage.answer-failed { border-color:#ff746b; }
.reading-stage.answer-success { border-color:#9eff69; }
.reading-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:-2; }
.reading-scrim { position:absolute; inset:0; background:linear-gradient(90deg,#101b1de8,#101b1db0 70%,#101b1d80); z-index:-1; }
.reading-text-panel { padding:clamp(17px,3vw,30px); }
.reading-topline { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; color:#dcf1d5; }
.reading-step { color:#acd499; font-size:.72rem; letter-spacing:.09em; white-space:nowrap; font-weight:700; }
.reading-copy { white-space:pre-wrap; font-size:clamp(1rem,1.65vw,1.24rem); line-height:1.9; font-weight:580; text-wrap:pretty; margin:19px 0 12px; }
.choose { display:inline; border:1px solid #eede64; color:#fff0a6; background:#2f3940; border-radius:5px; padding:2px 5px; margin:1px 2px; font:inherit; font-size:.9em; font-weight:800; cursor:pointer; }
.choose.filled { color:#fff; border-color:#7ce6a2; background:#1a6a49; }
.choose:disabled { cursor:default; }
.choose:focus-visible { outline:2px solid white; outline-offset:2px; }
.reading-feedback { color:#fff7d1; font-weight:700; min-height:1.3rem; }
.reading-image-caption { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:8px 16px; background:#08120ece; color:#e3e6dc; font-size:.78rem; }
.image-next { color:#d4ff9d; background:transparent; border:1px solid #b8cf9b; border-radius:5px; padding:5px 9px; cursor:pointer; }
.image-next:disabled { opacity:.4; cursor:default; }
.reading-controls { display:flex; justify-content:space-between; flex-wrap:wrap; gap:15px; padding-top:18px; }
.reading-actions { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.demo-action { background:#b9fb7e; color:#142216; border:1px solid #b9fb7e; border-radius:8px; padding:9px 13px; font-weight:750; cursor:pointer; }
.demo-action.outline { background:transparent; color:#c9ffac; }
.demo-action:focus-visible,.sound-toggle:focus-visible,.image-next:focus-visible { outline:2px solid #fff; outline-offset:3px; }
.reading-options { display:flex; align-items:center; gap:8px 13px; flex-wrap:wrap; font-size:.8rem; }
.reading-options input { accent-color:#b9fb7e; width:96px; }
.sound-toggle { background:transparent; border:1px solid #728b7b; color:#dbf3da; border-radius:7px; padding:7px 10px; cursor:pointer; }
.points { border:1px solid #779b79; border-radius:6px; padding:7px 11px; color:#c5f19c; font-weight:700; }
.reading-credit { color:#9fb2a5; font-size:.7rem; line-height:1.5; margin-top:15px; }
.reading-credit p { margin:3px 0; }
.reading-credit a { color:#c2f39b; }
.word-dialog { max-width:min(400px,calc(100vw - 32px)); width:100%; border:1px solid #82c595; border-radius:12px; background:#202e24; color:#edf8eb; padding:23px; box-shadow:0 24px 80px #0008; }
.word-dialog::backdrop { background:#050e0aaa; }
.word-dialog h3 { margin:0 0 8px; }
.word-dialog p { color:#bdd4bf; margin:0 0 15px; }
.word-options { display:grid; gap:8px; }
.word-options button { background:#314737; border:1px solid #779981; color:#fff; padding:10px; text-align:left; font-size:1rem; border-radius:7px; cursor:pointer; }
.word-options button:hover,.word-options button:focus-visible { background:#496951; }
.cancel-word { margin-top:15px; color:#d0dfd0; background:none; border:0; text-decoration:underline; cursor:pointer; }
@media (max-width:700px) { .reading-stage { min-height:440px; } .reading-copy { line-height:1.9; } .reading-controls { flex-direction:column; } }
</style>
