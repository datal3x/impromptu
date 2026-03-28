/* ───────────────────────────────────────────
   Impromptu - Speaking Practice App
   State machine, timer, and controls
   ─────────────────────────────────────────── */

// ─── Frameworks ──────────────────────────────

const FRAMEWORKS = {
  storyarc: {
    name: 'Story Arc',
    steps: [
      { letter: 'H', label: 'Hook', hint: 'Grab attention with a bold statement', timePercent: 15 },
      { letter: 'D', label: 'Detail', hint: 'Add context and background', timePercent: 25 },
      { letter: 'E', label: 'Example', hint: 'Share a specific example or story', timePercent: 40 },
      { letter: 'C', label: 'Close', hint: 'End with a memorable conclusion', timePercent: 20 }
    ]
  },
  prep: {
    name: 'PREP',
    steps: [
      { letter: 'P', label: 'Point', hint: 'State your main point clearly', timePercent: 15 },
      { letter: 'R', label: 'Reason', hint: 'Explain why you believe this', timePercent: 25 },
      { letter: 'E', label: 'Example', hint: 'Give a concrete example', timePercent: 40 },
      { letter: 'P', label: 'Point', hint: 'Restate your point to close', timePercent: 20 }
    ]
  },
  star: {
    name: 'STAR',
    steps: [
      { letter: 'S', label: 'Situation', hint: 'Set the scene and context', timePercent: 20 },
      { letter: 'T', label: 'Task', hint: 'Describe the challenge or task', timePercent: 15 },
      { letter: 'A', label: 'Action', hint: 'Explain what you did', timePercent: 40 },
      { letter: 'R', label: 'Result', hint: 'Share the outcome and lesson', timePercent: 25 }
    ]
  }
};

// ─── Timer ────────────────────────────────────

class Timer {
  constructor(durationMs, onTick, onComplete) {
    this.duration = durationMs;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.startTime = null;
    this.rafId = null;
    this.running = false;
    this.paused = false;
    this.elapsedAtPause = 0;
  }

  start() {
    this.startTime = performance.now();
    this.running = true;
    this.paused = false;
    this.elapsedAtPause = 0;
    this._tick();
  }

  _tick() {
    if (!this.running || this.paused) return;
    var now = performance.now();
    var elapsed = (now - this.startTime) + this.elapsedAtPause;
    var remaining = Math.max(0, this.duration - elapsed);
    var progress = Math.min(1, elapsed / this.duration);

    this.onTick(elapsed, remaining, progress);

    if (remaining <= 0) {
      this.running = false;
      this.onComplete();
      return;
    }
    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    var now = performance.now();
    this.elapsedAtPause += (now - this.startTime);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.startTime = performance.now();
    this._tick();
  }

  stop() {
    this.running = false;
    this.paused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  handleVisibility() {
    if (!this.running || this.paused) return;
    if (document.hidden) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
    } else {
      this._tick();
    }
  }
}

// ─── App State ────────────────────────────────

var currentState = 'idle';
var currentTimer = null;
var currentTopic = null;
var currentFramework = 'storyarc';
var transitionTarget = 'prep';
var lastCountdownValue = null;

// ─── Helpers ──────────────────────────────────

function formatTime(ms) {
  var totalSeconds = Math.ceil(ms / 1000);
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function selectTopic() {
  var category = document.getElementById('category-filter').value;
  var difficulty = document.getElementById('difficulty-filter').value;
  var usedIds = JSON.parse(localStorage.getItem('impromptu-usedTopics') || '[]');

  var pool = TOPICS;
  if (category) pool = pool.filter(function(t) { return t.category === category; });
  if (difficulty) pool = pool.filter(function(t) { return t.difficulty === difficulty; });

  var available = pool.filter(function(t) { return !usedIds.includes(t.id); });

  if (available.length === 0) {
    localStorage.setItem('impromptu-usedTopics', '[]');
    available = pool;
  }

  var topic = available[Math.floor(Math.random() * available.length)];

  usedIds.push(topic.id);
  localStorage.setItem('impromptu-usedTopics', JSON.stringify(usedIds));

  return topic;
}

function updateStageDots(state) {
  document.querySelectorAll('.dot').forEach(function(dot) {
    dot.classList.toggle('active', dot.dataset.stage === state);
  });
}

function getActiveStepIndex(progress, steps) {
  var cumulative = 0;
  for (var i = 0; i < steps.length; i++) {
    cumulative += steps[i].timePercent / 100;
    if (progress < cumulative) return i;
  }
  return steps.length - 1;
}

// ─── State Machine ────────────────────────────

function setState(newState) {
  // Stop any running timer
  if (currentTimer) {
    currentTimer.stop();
    currentTimer = null;
  }

  // Reset pause button
  var pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.textContent = 'Pause';
    pauseBtn.setAttribute('aria-label', 'Pause');
  }

  currentState = newState;
  document.body.dataset.state = newState;

  // Update stage dots for timed stages
  if (newState === 'topic' || newState === 'prep' || newState === 'speech') {
    updateStageDots(newState);
  } else if (newState === 'transition') {
    updateStageDots(transitionTarget);
  } else {
    updateStageDots('');
  }

  // Initialize state
  switch (newState) {
    case 'idle':
      initIdle();
      break;
    case 'topic':
      initTopic();
      break;
    case 'transition':
      initTransition();
      break;
    case 'prep':
      initPrep();
      break;
    case 'speech':
      initSpeech();
      break;
    case 'complete':
      initComplete();
      break;
  }
}

// ─── IDLE ─────────────────────────────────────

function initIdle() {
  // Load saved settings
  var savedFramework = localStorage.getItem('impromptu-framework') || 'storyarc';
  var savedCategory = localStorage.getItem('impromptu-category') || '';
  var savedDifficulty = localStorage.getItem('impromptu-difficulty') || '';

  currentFramework = savedFramework;

  // Set active toggle button
  document.querySelectorAll('.toggle-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.framework === savedFramework);
  });

  // Set select values
  document.getElementById('category-filter').value = savedCategory;
  document.getElementById('difficulty-filter').value = savedDifficulty;

  // Focus start button
  var startBtn = document.querySelector('.btn-start');
  if (startBtn) startBtn.focus();
}

// ─── TOPIC (5s) ───────────────────────────────

function initTopic() {
  currentTopic = selectTopic();

  // Set topic text in all places
  document.getElementById('topic-text').textContent = currentTopic.text;
  document.getElementById('prep-topic-text').textContent = currentTopic.text;
  document.getElementById('speech-topic-text').textContent = currentTopic.text;

  // Reset progress bar
  var progressBar = document.getElementById('progress-bar');
  progressBar.style.width = '0%';

  // Trigger topic-reveal animation
  var topicText = document.getElementById('topic-text');
  topicText.classList.remove('topic-reveal');
  void topicText.offsetWidth; // force reflow
  topicText.classList.add('topic-reveal');

  // Set transition target for after topic
  transitionTarget = 'prep';

  currentTimer = new Timer(5000,
    function(elapsed, remaining, progress) {
      progressBar.style.width = (progress * 100) + '%';
    },
    function() {
      setState('transition');
    }
  );
  currentTimer.start();
}

// ─── TRANSITION (5s) ──────────────────────────

function initTransition() {
  var label = document.getElementById('transition-label');
  var countdown = document.getElementById('transition-countdown');
  var transitionTopic = document.getElementById('transition-topic');

  // Show topic during both transitions
  transitionTopic.textContent = currentTopic ? currentTopic.text : '';

  if (transitionTarget === 'prep') {
    label.textContent = 'Preparation begins in...';
  } else {
    label.textContent = 'Your speech begins in...';
  }

  countdown.textContent = '5';
  lastCountdownValue = 5;

  // Trigger initial animation
  countdown.classList.remove('countdown-pop');
  void countdown.offsetWidth;
  countdown.classList.add('countdown-pop');

  currentTimer = new Timer(5000,
    function(elapsed, remaining, progress) {
      var value = Math.ceil(remaining / 1000);
      if (value < 1) value = 1;
      if (value !== lastCountdownValue) {
        lastCountdownValue = value;
        countdown.textContent = String(value);
        // Re-trigger pop animation
        countdown.classList.remove('countdown-pop');
        void countdown.offsetWidth;
        countdown.classList.add('countdown-pop');
      }
    },
    function() {
      setState(transitionTarget);
    }
  );
  currentTimer.start();
}

// ─── PREP (60s) ───────────────────────────────

function initPrep() {
  var fw = FRAMEWORKS[currentFramework];
  var stepper = document.getElementById('prep-stepper');
  var ring = document.getElementById('prep-timer-ring');
  var display = document.getElementById('prep-timer-display');

  // Build stepper
  stepper.innerHTML = fw.steps.map(function(step, i) {
    return '<div class="step" data-index="' + i + '">' +
      '<div class="step-letter">' + step.letter + '</div>' +
      '<div class="step-content">' +
        '<div class="step-label">' + step.label + '</div>' +
        '<div class="step-hint">' + step.hint + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  // Reset timer ring
  ring.style.strokeDashoffset = '0';
  display.textContent = '01:00';

  // Set transition target for after prep
  transitionTarget = 'speech';

  currentTimer = new Timer(60000,
    function(elapsed, remaining, progress) {
      // Update ring
      ring.style.strokeDashoffset = String(565.49 * progress);

      // Update display
      display.textContent = formatTime(remaining);

      // Update stepper active step
      var activeIndex = getActiveStepIndex(progress, fw.steps);
      stepper.querySelectorAll('.step').forEach(function(stepEl, i) {
        stepEl.classList.toggle('completed', i < activeIndex);
        stepEl.classList.toggle('active', i === activeIndex);
      });
    },
    function() {
      setState('transition');
    }
  );
  currentTimer.start();
}

// ─── SPEECH (60s) ─────────────────────────────

function initSpeech() {
  var fw = FRAMEWORKS[currentFramework];
  var speechFramework = document.getElementById('speech-framework');
  var ring = document.getElementById('speech-timer-ring');
  var display = document.getElementById('speech-timer-display');
  var timerContainer = ring.closest('.timer-container');

  // Build compact framework
  speechFramework.innerHTML = fw.steps.map(function(step, i) {
    return '<span class="step-ref" data-index="' + i + '">' + step.label + '</span>';
  }).join('<span class="step-sep">›</span>');

  // Reset timer ring
  ring.style.strokeDashoffset = '0';
  ring.classList.remove('warning', 'critical');
  if (timerContainer) timerContainer.classList.remove('warning');
  display.textContent = '01:00';

  currentTimer = new Timer(60000,
    function(elapsed, remaining, progress) {
      // Update ring
      ring.style.strokeDashoffset = String(565.49 * progress);

      // Update display
      display.textContent = formatTime(remaining);

      // Update compact framework active step
      var activeIndex = getActiveStepIndex(progress, fw.steps);
      speechFramework.querySelectorAll('.step-ref').forEach(function(ref, i) {
        ref.classList.toggle('completed', i < activeIndex);
        ref.classList.toggle('active', i === activeIndex);
      });

      // Warning states
      if (remaining <= 5000) {
        ring.classList.add('warning', 'critical');
        if (timerContainer) timerContainer.classList.add('warning');
      } else if (remaining <= 10000) {
        ring.classList.add('warning');
        ring.classList.remove('critical');
        if (timerContainer) timerContainer.classList.add('warning');
      } else {
        ring.classList.remove('warning', 'critical');
        if (timerContainer) timerContainer.classList.remove('warning');
      }
    },
    function() {
      setState('complete');
    }
  );
  currentTimer.start();
}

// ─── COMPLETE ─────────────────────────────────

function initComplete() {
  // Increment session count
  var sessions = parseInt(localStorage.getItem('impromptu-sessions') || '0', 10) + 1;
  localStorage.setItem('impromptu-sessions', String(sessions));

  // Show stats
  document.getElementById('stats-topic').textContent = currentTopic ? currentTopic.text : '';
  document.getElementById('stats-framework').textContent = FRAMEWORKS[currentFramework].name;
  document.getElementById('stats-sessions').textContent = 'Session #' + sessions;

  // Reset confetti animation by re-inserting all pieces
  var confettiContainer = document.querySelector('.confetti-container');
  if (confettiContainer) {
    var pieces = confettiContainer.querySelectorAll('.confetti-piece');
    pieces.forEach(function(piece) {
      var clone = piece.cloneNode(true);
      piece.parentNode.replaceChild(clone, piece);
    });
  }

  // Focus Go Again button
  var againBtn = document.querySelector('.btn-again');
  if (againBtn) againBtn.focus();
}

// ─── Event Listeners ──────────────────────────

document.addEventListener('DOMContentLoaded', function() {

  // Help overlay
  var helpOverlay = document.getElementById('help-overlay');
  document.getElementById('btn-help').addEventListener('click', function() {
    helpOverlay.classList.add('active');
  });
  document.getElementById('btn-help-close').addEventListener('click', function() {
    helpOverlay.classList.remove('active');
  });
  helpOverlay.addEventListener('click', function(e) {
    if (e.target === helpOverlay) helpOverlay.classList.remove('active');
  });

  // Tips overlay
  var tipsOverlay = document.getElementById('tips-overlay');
  document.getElementById('btn-tips').addEventListener('click', function() {
    tipsOverlay.classList.add('active');
  });
  document.getElementById('btn-tips-close').addEventListener('click', function() {
    tipsOverlay.classList.remove('active');
  });
  tipsOverlay.addEventListener('click', function(e) {
    if (e.target === tipsOverlay) tipsOverlay.classList.remove('active');
  });

  // Framework toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.toggle-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentFramework = btn.dataset.framework;
      localStorage.setItem('impromptu-framework', currentFramework);
    });
  });

  // Category filter
  document.getElementById('category-filter').addEventListener('change', function() {
    localStorage.setItem('impromptu-category', this.value);
  });

  // Difficulty filter
  document.getElementById('difficulty-filter').addEventListener('change', function() {
    localStorage.setItem('impromptu-difficulty', this.value);
  });

  // Start button
  document.querySelector('.btn-start').addEventListener('click', function() {
    setState('topic');
  });

  // Go Again button
  document.querySelector('.btn-again').addEventListener('click', function() {
    setState('topic');
  });

  // Change Settings button
  document.querySelector('.btn-settings-link').addEventListener('click', function() {
    setState('idle');
  });

  // Pause/Resume control
  var pauseBtn = document.getElementById('btn-pause');
  pauseBtn.addEventListener('click', function() {
    if (!currentTimer) return;
    if (currentTimer.paused) {
      currentTimer.resume();
      pauseBtn.textContent = 'Pause';
      pauseBtn.setAttribute('aria-label', 'Pause');
    } else {
      currentTimer.pause();
      pauseBtn.textContent = 'Resume';
      pauseBtn.setAttribute('aria-label', 'Resume');
    }
  });

  // New Topic control
  document.querySelector('.ctrl-new').addEventListener('click', function() {
    setState('topic');
  });

  // Visibility change for timer accuracy
  document.addEventListener('visibilitychange', function() {
    if (currentTimer) currentTimer.handleVisibility();
  });

  // Initialize to idle
  setState('idle');
});
