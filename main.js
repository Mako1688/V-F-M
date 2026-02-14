/* ============================================================
   FOR LOIS - Love Slot Machine
   Pure JS  |  Terminal aesthetic  |  Green theme
   ============================================================ */

// -- Rewards --------------------------------------------------
var REWARDS = [
  { symbol: '*mwah*',  name: 'Kiss',    color: '#e91e63', message: 'A Big Wet Sloppy MWAHHH!' },
  { symbol: '(>_<)',   name: 'Hug',     color: '#66bb6a', message: 'The Biggest Warmest Huggy!' },
  { symbol: '~*~',    name: 'Massage', color: '#26a69a', message: 'A soothing body tingling massage from head to toe!' },
  { symbol: '@}->--', name: 'Flowers', color: '#43a047', message: 'A flower bouquet for Amora!' },
  { symbol: '>^^<',   name: 'Frog',    color: '#2e7d32', message: "WHAAAT! How'd a frog get in here?!" },
  { symbol: '=][=',   name: 'Gorsha',  color: '#ff9800', message: 'Gorsha twime! Let me feed you some injera!' },
  { symbol: '(o)~s',  name: 'Tomato',  color: '#ef5350', message: 'Tomato with salt! Your favorite lil snack!' },
  { symbol: '(^.^)',  name: 'Panda',   color: '#78909c', message: 'A panda! Perfect for snuggling at night!' },
  { symbol: '777',    name: 'Jackpot', color: '#ffd740', message: 'ALL THE THINGS AT THE SAME TIME! You get EVERYTHING!' },
];

var NUM_COPIES = 10;
var SCORE_KEY  = 'loveSlotScore';
var REEL_H     = 100; // matches CSS --reel-h

// -- State ----------------------------------------------------
var isSpinning = false;

// -- Helpers --------------------------------------------------
function $(id) { return document.getElementById(id); }

// -- Score System ---------------------------------------------
function getScore() { return parseInt(localStorage.getItem(SCORE_KEY) || '0', 10); }

function addScore(pts) {
  var oldScore = getScore();
  var newScore = oldScore + pts;
  localStorage.setItem(SCORE_KEY, newScore.toString());
  animateScoreCountUp(oldScore, newScore);
}

function animateScoreCountUp(from, to) {
  var pts = to - from;
  var duration = Math.min(1200, Math.max(400, pts * 30));
  var startTime = null;
  var els = document.querySelectorAll('.score-val');

  // Show +X inline next to each score
  els.forEach(function (el) {
    // Remove any existing +X span
    var old = el.parentNode.querySelector('.score-plus');
    if (old) old.remove();
    var plus = document.createElement('span');
    plus.className = 'score-plus';
    plus.textContent = ' + ' + pts;
    el.parentNode.appendChild(plus);
  });

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(from + pts * eased);

    els.forEach(function (el) {
      el.textContent = current;
    });

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      els.forEach(function (el) {
        el.textContent = to;
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
        // Remove the +X
        var plus = el.parentNode.querySelector('.score-plus');
        if (plus) plus.remove();
      });
    }
  }

  requestAnimationFrame(tick);
}

function updateScoreDisplays(animate) {
  var s = getScore();
  document.querySelectorAll('.score-val').forEach(function (el) {
    el.textContent = s;
  });
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -- Reel Init ------------------------------------------------
function initReels() {
  for (var i = 1; i <= 3; i++) {
    var strip = $('strip' + i);
    strip.innerHTML = '';
    for (var c = 0; c < NUM_COPIES; c++) {
      REWARDS.forEach(function (r) {
        var item = document.createElement('div');
        item.className = 'reel-item';

        var sym = document.createElement('span');
        sym.className = 'reel-sym';
        sym.textContent = r.symbol;
        sym.style.color = r.color;

        var lbl = document.createElement('span');
        lbl.className = 'reel-lbl';
        lbl.textContent = r.name;
        lbl.style.color = r.color;

        item.appendChild(sym);
        item.appendChild(lbl);
        strip.appendChild(item);
      });
    }
  }
}

// -- Spin a Single Reel (returns promise) ---------------------
function spinReel(reelNum, targetIdx, duration) {
  return new Promise(function (resolve) {
    var strip = $('strip' + reelNum);
    var sets  = 4 + reelNum;
    var total = sets * REWARDS.length + targetIdx;
    var off   = -(total * REEL_H);

    strip.style.transition = 'none';
    strip.style.transform  = 'translateY(0)';
    void strip.offsetHeight;

    setTimeout(function () {
      strip.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.08, 0.75, 0.28, 1)';
      strip.style.transform  = 'translateY(' + off + 'px)';
      setTimeout(resolve, duration + 50);
    }, 60);
  });
}

// -- Clear / Apply Reel Glow ----------------------------------
function clearGlows() {
  for (var i = 1; i <= 3; i++) {
    $('reel' + i).classList.remove('matched', 'matched-gold');
  }
}
function glowReels(cls) {
  for (var i = 1; i <= 3; i++) {
    $('reel' + i).classList.add(cls);
  }
}

// -- Weighted Random (higher match odds) ----------------------
// ~20% force triple match, ~25% near-miss (first two match), ~55% fully random
function pickTargets() {
  var roll = Math.random();
  if (roll < 0.20) {
    var t = Math.floor(Math.random() * REWARDS.length);
    return [t, t, t];
  } else if (roll < 0.45) {
    var t = Math.floor(Math.random() * REWARDS.length);
    return [t, t, Math.floor(Math.random() * REWARDS.length)];
  } else {
    return [
      Math.floor(Math.random() * REWARDS.length),
      Math.floor(Math.random() * REWARDS.length),
      Math.floor(Math.random() * REWARDS.length),
    ];
  }
}

// -- Main Spin ------------------------------------------------
async function spin() {
  if (isSpinning) return;
  isSpinning = true;

  var btn = $('spin-btn');
  var res = $('result');
  var txt = $('result-text');

  btn.disabled = true;
  btn.textContent = '. . .';
  res.classList.add('hidden');
  clearGlows();

  // Button press animation + particle burst
  btn.classList.remove('btn-press');
  void btn.offsetWidth;
  btn.classList.add('btn-press');
  buttonBurst(btn);

  // Pick targets (weighted — higher match odds)
  var targets = pickTargets();
  var t1 = targets[0], t2 = targets[1], t3 = targets[2];

  // Spin all 3 reels simultaneously with staggered stop times
  await Promise.all([
    spinReel(1, t1, 1800),
    spinReel(2, t2, 2200),
    spinReel(3, t3, 2600),
  ]);

  // Evaluate
  var allMatch = t1 === t2 && t2 === t3;

  if (allMatch) {
    var rw = REWARDS[t1];
    var isMega = rw.name === 'Jackpot';

    startParticles();
    res.classList.remove('hidden');

    glowReels(isMega ? 'matched-gold' : 'matched');

    if (isMega) {
      var list = REWARDS
        .filter(function (r) { return r.name !== 'Jackpot'; })
        .map(function (r) { return r.symbol + ' ' + r.name; })
        .join('<br>');
      txt.innerHTML =
        '<span class="mega">+++ 777 MEGA SUPER DUPER CRAZY JACKPOT +++</span><br>' +
        'OMG LITERALLY EVERYTHING ALL AT ONCE AHHHHHHH!<br>' +
        '<div class="all-list">' + list + '</div>';
      addScore(100);
    } else {
      txt.innerHTML =
        '<span class="win">*** MATCH! ***</span><br>' +
        '<strong>' + rw.symbol + '</strong> ' + rw.message + '<br>' +
        'Triple ' + rw.name + '!';
      addScore(rand(10, 50));
    }
  }
  // No match = silent (no message shown)

  isSpinning = false;
  btn.disabled = false;
  btn.textContent = '> SPIN TO WIN!!! ';
}

// -- Button Burst Particles -----------------------------------
function buttonBurst(btn) {
  var box = $('particles');
  var rect = btn.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  var count = 20;
  var chars = ['*', '+', '~', 'o', '^', '<3', '#', 'x'];
  var colors = ['#66bb6a','#43a047','#a5d6a7','#ffd740','#e91e63','#81c784','#26a69a'];

  for (var i = 0; i < count; i++) {
    (function (idx) {
      var el = document.createElement('div');
      el.className = 'p-btn-burst';
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.fontSize = (Math.random() * 12 + 10) + 'px';
      el.style.color = colors[Math.floor(Math.random() * colors.length)];

      var angle = Math.random() * Math.PI * 2;
      var dist = Math.random() * 120 + 40;
      el.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--by', Math.sin(angle) * dist + 'px');
      el.style.animationDuration = (Math.random() * 0.5 + 0.4) + 's';

      box.appendChild(el);
      setTimeout(function () { el.remove(); }, 1000);
    })(i);
  }
}

// -- Particles ------------------------------------------------
var P_CHARS  = ['*', '+', 'x', 'o', '~', '^', '<3', '.', '#', '@'];
var P_COLORS = ['#2e7d32','#43a047','#66bb6a','#a5d6a7','#e91e63','#ffd740','#26a69a','#81c784'];

function mkParticle(box, cls, life) {
  var el = document.createElement('div');
  el.className   = cls;
  el.textContent = P_CHARS[Math.floor(Math.random() * P_CHARS.length)];
  el.style.left              = Math.random() * 100 + '%';
  el.style.fontSize          = (Math.random() * 16 + 14) + 'px';
  el.style.color             = P_COLORS[Math.floor(Math.random() * P_COLORS.length)];
  el.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
  box.appendChild(el);
  setTimeout(function () { el.remove(); }, life);
}

function startParticles() {
  var box = $('particles');
  for (var i = 0; i < 15; i++) {
    (function () {
      // Half rise from bottom, half fall from top
      var cls = i < 7 ? 'p-rise' : 'p-fall';
      setTimeout(function () { mkParticle(box, cls, 5000); }, Math.random() * 3000);
    })();
  }
}

// -- Intro Particles ------------------------------------------
var introTimer;
function startIntro() {
  var box = $('intro-p');
  if (!box) return;
  introTimer = setInterval(function () { mkParticle(box, 'p-float', 7000); }, 500);
}
function stopIntro() {
  if (introTimer) { clearInterval(introTimer); introTimer = null; }
}

// -- Intro Transition -----------------------------------------
function setupIntro() {
  $('enter-btn').addEventListener('click', function () {
    var intro = $('intro');
    var slot  = $('slot');

    intro.classList.add('fade-out');
    setTimeout(function () {
      intro.style.display = 'none';
      stopIntro();
      slot.classList.remove('hidden');
      slot.classList.add('fade-in');
    }, 850);
  });
}

// -- Boot -----------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  initReels();
  setupIntro();
  updateScoreDisplays(false);
  $('spin-btn').addEventListener('click', spin);
  startIntro();
});
