// The Reading Edge core exercise. Faithfully based on the author's
// MyAssignment.vue and MyText.vue, without Firebase or Quasar dependencies.
export function tokenizeParagraph(text) {
  return (String(text).match(/\s+|\S+/g) || []).map((value, id) => ({
    id,
    value,
    isWord: !/^\s+$/.test(value)
  }));
}

export function shuffled(values, random = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function chooseMissingTokens(tokens, percentage = 18, previous = [], random = Math.random) {
  const eligible = tokens.filter(t => t.isWord).map(t => t.id);
  if (!eligible.length) return [];
  const percent = Math.min(60, Math.max(1, Number(percentage) || 18));
  const count = Math.min(eligible.length, Math.max(1, Math.round(eligible.length * percent / 100)));
  let chosen = shuffled(eligible, random).slice(0, count).sort((a, b) => a - b);
  // A failed answer means a fresh group of missing words, not the same exercise.
  if (eligible.length > count && previous.length === count && chosen.every((id, i) => id === previous[i])) {
    const replacement = eligible.find(id => !chosen.includes(id));
    chosen = [...chosen.slice(1), replacement].sort((a, b) => a - b);
  }
  return chosen;
}

export function choicesForPlaceholder(tokens, missing, tokenId, random = Math.random) {
  const correct = tokens[tokenId]?.value;
  if (!correct) return [];
  // The original game chooses distractors from the missing-word list;
  // only fall back to the other paragraph words for very short passages.
  const candidates = [
    ...missing.map(id => tokens[id]?.value),
    ...tokens.filter(t => t.isWord).map(t => t.value)
  ].filter(v => v !== undefined && v !== correct);
  const distinct = [...new Set(shuffled(candidates, random))].slice(0, 4);
  return shuffled([correct, ...distinct], random);
}

export function checkReconstruction(tokens, missing, answers) {
  // The author intentionally designed an all-or-nothing result.
  return missing.length > 0 && missing.every(id => answers[id] === tokens[id].value);
}

export function pointsForReconstruction(missing, passed) {
  return passed ? missing.length : 0;
}
