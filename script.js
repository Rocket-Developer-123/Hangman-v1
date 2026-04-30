/* ============================================================
   SYSTEM BREACH — script.js
   2-Player Pass-and-Play Hangman Game Logic
   ============================================================ */

'use strict';

/* --- Constants -------------------------------------------- */
const MAX_MISTAKES = 6;
const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];
const THREAT_LEVELS = [
  { label: 'MINIMAL',   cls: '' },
  { label: 'LOW',       cls: '' },
  { label: 'MODERATE',  cls: '' },
  { label: 'ELEVATED',  cls: 'danger' },
  { label: 'HIGH',      cls: 'danger' },
  { label: 'CRITICAL',  cls: 'danger' },
  { label: 'LOCKOUT',   cls: 'danger' }
];

/* --- State ------------------------------------------------ */
let secretWord   = '';
let guessedLetters = new Set();
let mistakes     = 0;

/* --- DOM Refs --------------------------------------------- */
const phase1      = document.getElementById('phase-1');
const phase2      = document.getElementById('phase-2');
const secretInput = document.getElementById('secret-word');
const lockBtn     = document.getElementById('lock-btn');
const wordError   = document.getElementById('word-error');
const wordDisplay = document.getElementById('word-display');
const breachBar   = document.getElementById('breach-bar');
const mistakeCount= document.getElementById('mistake-count');
const threatLevel = document.getElementById('threat-level');
const wrongLetters= document.getElementById('wrong-letters');
const overlay     = document.getElementById('overlay');
const overlayIcon = document.getElementById('overlay-icon');
const overlayTitle= document.getElementById('overlay-title');
const overlaySub  = document.getElementById('overlay-sub');
const revealWord  = document.getElementById('reveal-word');
const rebootBtn   = document.getElementById('reboot-btn');

/* ============================================================
   PHASE 1 — INPUT HANDLING
   ============================================================ */

lockBtn.addEventListener('click', handleLock);

secretInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLock();
});

function handleLock() {
  const val = secretInput.value.trim().toUpperCase();

  /* Validation: letters only, min 2 chars */
  if (!/^[A-Z]{2,}$/.test(val)) {
    wordError.classList.remove('hidden');
    secretInput.classList.add('shake');
    secretInput.addEventListener('animationend', () => {
      secretInput.classList.remove('shake');
    }, { once: true });
    return;
  }

  wordError.classList.add('hidden');
  secretWord = val;

  /* Transition to Phase 2 */
  phase1.classList.remove('active');
  phase2.classList.add('active');
  initPhase2();
}

/* ============================================================
   PHASE 2 — GAME SETUP
   ============================================================ */

function initPhase2() {
  guessedLetters.clear();
  mistakes = 0;

  buildWordDisplay();
  updateBreachBar();
  updateWrongLetters();
  buildKeyboard();
}

/* Build the masked word slots */
function buildWordDisplay() {
  wordDisplay.innerHTML = '';
  for (let i = 0; i < secretWord.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'letter-slot';

    const charEl = document.createElement('div');
    charEl.className = 'letter-char';
    charEl.dataset.letter = secretWord[i];
    charEl.dataset.index  = i;
    charEl.textContent    = secretWord[i];

    const line = document.createElement('div');
    line.className = 'letter-underline';

    slot.appendChild(charEl);
    slot.appendChild(line);
    wordDisplay.appendChild(slot);
  }
}

/* Build the on-screen QWERTY keyboard */
function buildKeyboard() {
  KEYBOARD_ROWS.forEach((row, ri) => {
    const rowEl = document.getElementById(`row-${ri + 1}`);
    rowEl.innerHTML = '';
    row.forEach(letter => {
      const key = document.createElement('button');
      key.className  = 'key';
      key.textContent= letter;
      key.dataset.letter = letter;
      key.setAttribute('aria-label', `Letter ${letter}`);

      key.addEventListener('click', () => handleGuess(letter, key));
      rowEl.appendChild(key);
    });
  });
}

/* ============================================================
   GUESS LOGIC
   ============================================================ */

function handleGuess(letter, keyEl) {
  if (guessedLetters.has(letter)) return;
  guessedLetters.add(letter);

  keyEl.classList.add('used');

  if (secretWord.includes(letter)) {
    /* Correct guess — reveal matching letters */
    keyEl.classList.add('correct');
    revealLetters(letter);

    if (isWordComplete()) {
      setTimeout(showWin, 400);
    }
  } else {
    /* Wrong guess */
    keyEl.classList.add('wrong');
    mistakes++;
    updateBreachBar();
    updateWrongLetters();

    if (mistakes >= MAX_MISTAKES) {
      setTimeout(showLoss, 400);
    }
  }
}

/* Reveal all instances of a correctly guessed letter */
function revealLetters(letter) {
  const chars = wordDisplay.querySelectorAll(`.letter-char[data-letter="${letter}"]`);
  chars.forEach(el => {
    /* Stagger reveal for multiple instances */
    const delay = Array.from(wordDisplay.querySelectorAll('.letter-char'))
      .indexOf(el) * 30;
    setTimeout(() => el.classList.add('revealed'), delay);
  });
}

function isWordComplete() {
  return [...secretWord].every(ch => guessedLetters.has(ch));
}

/* ============================================================
   UI UPDATES
   ============================================================ */

function updateBreachBar() {
  const pct = (mistakes / MAX_MISTAKES) * 100;
  breachBar.style.width = pct + '%';
  mistakeCount.textContent = `${mistakes} / ${MAX_MISTAKES}`;

  const t = THREAT_LEVELS[mistakes];
  const span = threatLevel.querySelector('span');
  span.textContent = t.label;
  threatLevel.className = 'threat-level ' + t.cls;
}

function updateWrongLetters() {
  const wrong = [...guessedLetters].filter(l => !secretWord.includes(l));
  wrongLetters.textContent = wrong.join('  ');
}

/* ============================================================
   ENDGAME
   ============================================================ */

function showWin() {
  /* Reveal all letters with glow effect */
  wordDisplay.querySelectorAll('.letter-char').forEach(el => {
    el.classList.add('revealed', 'correct-end');
  });

  overlayIcon.textContent  = '✅';
  overlayTitle.textContent = 'SYSTEM HACKED!';
  overlayTitle.className   = 'overlay-title win';
  overlaySub.textContent   = `ACCESS GRANTED — Keyword cracked in ${mistakes} error${mistakes !== 1 ? 's' : ''}.`;
  revealWord.textContent   = secretWord;
  overlay.classList.remove('hidden');
}

function showLoss() {
  /* Reveal the full word on loss */
  wordDisplay.querySelectorAll('.letter-char').forEach(el => {
    el.classList.add('revealed');
  });

  overlayIcon.textContent  = '💀';
  overlayTitle.textContent = 'LOCKOUT!';
  overlayTitle.className   = 'overlay-title loss';
  overlaySub.textContent   = 'SECURITY PROTOCOLS ENGAGED. System locked.';
  revealWord.textContent   = secretWord;
  overlay.classList.remove('hidden');
}

/* ============================================================
   REBOOT
   ============================================================ */

rebootBtn.addEventListener('click', reboot);

function reboot() {
  secretWord = '';
  guessedLetters.clear();
  mistakes = 0;

  /* Reset input */
  secretInput.value = '';
  wordError.classList.add('hidden');

  /* Hide overlay */
  overlay.classList.add('hidden');

  /* Swap phases */
  phase2.classList.remove('active');
  phase1.classList.add('active');

  /* Clear phase 2 UI */
  wordDisplay.innerHTML = '';
  wrongLetters.textContent = '';
  breachBar.style.width = '0%';
  mistakeCount.textContent = '0 / 6';

  const span = threatLevel.querySelector('span');
  span.textContent = 'MINIMAL';
  threatLevel.className = 'threat-level';

  /* Clear keyboard rows */
  ['row-1','row-2','row-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });

  /* Focus input on reboot */
  setTimeout(() => secretInput.focus(), 100);
}

/* ============================================================
   INIT — Focus input on load
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  secretInput.focus();
});
