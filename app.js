(() => {
  /* ===============================
   🔒 PREVENT MOBILE REFRESH / SCROLL
================================ */

let lastTouchYGlobal = 0;

// Stop pull-to-refresh & swipe navigation
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 1) {
      lastTouchYGlobal = e.touches[0].clientY;
    }
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (e) => {
    const currentY = e.touches[0].clientY;

    // 🔥 prevent downward pull (refresh)
    if (currentY > lastTouchYGlobal) {
      e.preventDefault();
    }

    lastTouchYGlobal = currentY;
  },
  { passive: false }
);

  const namePopup = document.getElementById('name-popup');
  const nameInput = document.getElementById('name-input');
  const submitNameBtn = document.getElementById('submit-name');
  const startPage = document.getElementById('start-page');
  const startBtn = document.getElementById('start-btn');
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const leaderboard = document.getElementById('leaderboard');
  const leaderboardList = document.getElementById('leaderboard-list');
  const closeLeaderboardBtn = document.getElementById('close-leaderboard');
  const settings = document.getElementById('settings');
  const nameChangeInput = document.getElementById('name-change');
  const changeNameBtn = document.getElementById('change-name-btn');
  const closeSettingsBtn = document.getElementById('close-settings');
  const changeSkinDiv = document.getElementById('change-skin');
  const gameContainer = document.getElementById('game-container');
  const backToMenuBtn = document.getElementById('back-to-menu-btn');

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const speedEl = document.getElementById('speed');
  const gameOverScreen = document.getElementById('game-over-screen');
  const gameOverScore = document.getElementById('game-over-score');
  const restartBtn = document.getElementById('restart-btn');
  const pauseIndicator = document.getElementById('pause-indicator');

  const COLS = 18;
  const ROWS = 18;
  const CELL_SIZE = canvas.width / COLS;
  const DIRS = {
    LEFT:  { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP:    { x: 0, y: -1 },
    DOWN:  { x: 0, y: 1 }
  };
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD', '#E74C3C', '#3498DB', '#2ECC71', '#1ABC9C', '#F39C12', '#D35400', '#C0392B', '#9B59B6', '#2980B9', '#27AE60', '#8E44AD', '#34495E', '#2C3E50', '#ECF0F1', '#95A5A6'];

  let playerName = localStorage.getItem('snakePlayerName') || '';
  let playerSkinColor = localStorage.getItem('snakeSkinColor') || '#4b8bf5';
  let highestScore = +localStorage.getItem('snakeHighestScore') || 0;

  let snake = [{x:9, y:9}];
  let direction = DIRS.RIGHT;
  let nextDirection = direction;
  let food = null;
  let score = 0;
  let speed = 5;
  let speedLevel = 1;
  const maxSpeedLevel = 10;
  const speedIncrementScoreStep = 5;
  let lastMoveTime = 0;
  let gameOver = false;
  let paused = false;
  let moveProgress = 0;
  let lastHeadPos = { x: 9, y: 9 };
  let nextHeadPos = { x: 9, y: 9 };
  let touchStartX = null;
  let touchStartY = null;
  const minSwipeDist = 5;

  function trapFocus(container) {
    const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]';
    let focusableElements = container.querySelectorAll(focusableElementsString);
    focusableElements = Array.prototype.slice.call(focusableElements);

    if(focusableElements.length === 0) return;

    let firstTabStop = focusableElements[0];
    let lastTabStop = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', function(e) {
      if (e.key === 'Tab' || e.keyCode === 9) {
        if (e.shiftKey) {
          if (document.activeElement === firstTabStop) {
            e.preventDefault();
            lastTabStop.focus();
          }
        } else {
          if (document.activeElement === lastTabStop) {
            e.preventDefault();
            firstTabStop.focus();
          }
        }
      }
    });
  }

  function updateLeaderboard() {
    leaderboardList.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = playerName + ': ' + highestScore;
    leaderboardList.appendChild(li);
  }

  let selectedSkinColor = playerSkinColor;
  function renderSkinColors() {
    changeSkinDiv.innerHTML = '';
    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.classList.add('color-option');
      colorOption.style.backgroundColor = color;
      if(color === selectedSkinColor) colorOption.classList.add('selected');
      colorOption.addEventListener('click', () => {
        selectedSkinColor = color;
        playerSkinColor = color;
        localStorage.setItem('snakeSkinColor', playerSkinColor);
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        colorOption.classList.add('selected');
      });
      changeSkinDiv.appendChild(colorOption);
    });
  }

  if(!playerName) {
    namePopup.classList.remove('hidden');
    startPage.classList.remove('visible');
    gameContainer.setAttribute('aria-hidden', 'true');
    trapFocus(namePopup);
  } else {
    namePopup.classList.add('hidden');
    startPage.classList.add('visible');
    gameContainer.setAttribute('aria-hidden', 'true');
  }

  submitNameBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if(val.length === 0) {
      alert('Please enter a name');
      nameInput.focus();
      return;
    }
    playerName = val;
    localStorage.setItem('snakePlayerName', playerName);
    namePopup.classList.add('hidden');
    startPage.classList.add('visible');
    gameContainer.setAttribute('aria-hidden', 'true');
    trapFocus(startPage);
  });

  startBtn.addEventListener('click', () => {
    startPage.classList.remove('visible');
    gameContainer.setAttribute('aria-hidden', 'false');
    resetGame();
    gameLoop();
    canvas.focus();
  });

leaderboardBtn.addEventListener('click', () => {
  updateLeaderboard();
  startPage.classList.remove('visible');
  leaderboard.classList.add('visible');
  leaderboard.setAttribute('aria-hidden', 'false');

  // Hide back to menu while leaderboard is open
  backToMenuBtn.style.display = 'none';

  trapFocus(leaderboard);
});

closeLeaderboardBtn.addEventListener('click', () => {
  leaderboard.classList.remove('visible');
  leaderboard.setAttribute('aria-hidden', 'true');

  // Show back to menu again
  backToMenuBtn.style.display = 'block';

  startPage.classList.add('visible');
  trapFocus(startPage);
});


  settingsBtn.addEventListener('click', () => {
    nameChangeInput.value = playerName;
    renderSkinColors();
    startPage.classList.remove('visible');
    settings.classList.add('visible');
    settings.setAttribute('aria-hidden', 'false');
    trapFocus(settings);
  });

  changeNameBtn.addEventListener('click', () => {
    const newName = nameChangeInput.value.trim();
    if(newName.length === 0) {
      alert('Name cannot be empty');
      return;
    }
    playerName = newName;
    localStorage.setItem('snakePlayerName', playerName);
    alert('Name changed to: ' + playerName);
  });

 closeSettingsBtn.addEventListener('click', () => {
  settings.classList.remove('visible');
  settings.setAttribute('aria-hidden', 'true');

  // Show back to menu again
  backToMenuBtn.style.display = 'block';

  startPage.classList.add('visible');
  trapFocus(startPage);
});

backToMenuBtn.addEventListener('click', () => {
  gameOver = true;
  gameContainer.setAttribute('aria-hidden', 'true');
  startPage.classList.add('visible');
  trapFocus(startPage);
});

// When opening settings, hide the back-to-menu button
settingsBtn.addEventListener('click', () => {
  settings.classList.add('visible');
  settings.setAttribute('aria-hidden', 'false');

  // Hide back to menu while in settings
  backToMenuBtn.style.display = 'none';

  trapFocus(settings);
});


  function randomPosition() {
    return {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  }

  function positionsEqual(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  function placeFood() {
    let newPos;
    do {
      newPos = randomPosition();
    } while (snake.some(segment => positionsEqual(segment, newPos)));
    food = newPos;
  }

  function resetGame() {
    snake = [{x:9, y:9}];
    direction = DIRS.RIGHT;
    nextDirection = direction;
    score = 0;
    speedLevel = 1;
    speed = 5;
    gameOver = false;
    paused = false;
    lastMoveTime = 0;
    moveProgress = 0;
    lastHeadPos = { x: 9, y: 9 };
    nextHeadPos = { x: 9, y: 9 };
    placeFood();
    scoreEl.textContent = score;
    speedEl.textContent = speedLevel;
    gameOverScreen.classList.remove('visible');
    pauseIndicator.style.display = 'none';
    canvas.focus();
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function interpPos(startPos, endPos, t) {
    return {
      x: lerp(startPos.x, endPos.x, t),
      y: lerp(startPos.y, endPos.y, t)
    };
  }

  function drawCell(x, y, color, radius=0) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    ctx.fillStyle = color;
    const r = radius > 0 ? radius : CELL_SIZE / 2 * 0.9;
    ctx.beginPath();
    if(radius > 0) {
      ctx.moveTo(px + r, py);
      ctx.arc(px + r, py + r, r, -Math.PI/2, Math.PI/2, false);
      ctx.lineTo(px + r * 2, py + CELL_SIZE - r);
      ctx.arc(px + r, py + CELL_SIZE - r, r, Math.PI/2, 3*Math.PI/2, false);
      ctx.closePath();
    } else {
      ctx.arc(px + CELL_SIZE/2, py + CELL_SIZE/2, CELL_SIZE/2 * 0.9, 0, 2 * Math.PI);
    }
    ctx.fill();
  }

  function drawSnake(t) {
    let interpSegments = [];
    if(snake.length === 1) {
      let pos = interpPos(lastHeadPos, nextHeadPos, moveProgress);
      interpSegments.push(pos);
    } else {
      let headInterp = interpPos(lastHeadPos, nextHeadPos, moveProgress);
      interpSegments[snake.length - 1] = headInterp;
      for(let i = snake.length - 2; i >= 0; i--) {
        let currentPos = snake[i];
        let nextPos = snake[i + 1];
        interpSegments[i] = interpPos(currentPos, nextPos, moveProgress);
      }
    }
    ctx.shadowColor = '#2f74e3cc';
    ctx.shadowBlur = 6;

    for(let i = 0; i < interpSegments.length; i++) {
      let pos = interpSegments[i];
      if(i === interpSegments.length - 1) {
        drawCell(pos.x, pos.y, '#f0f8ff', CELL_SIZE * 0.4);
        ctx.fillStyle = playerSkinColor;
        drawCell(pos.x, pos.y, playerSkinColor);
      } else {
        ctx.fillStyle = playerSkinColor;
        drawCell(pos.x, pos.y, playerSkinColor);
      }
    }
    ctx.shadowBlur = 0;
  }

  function drawFood(t) {
    const pulse = Math.sin(t / 300) * 0.3 + 1;
    ctx.shadowColor = '#ff6d4c';
    ctx.shadowBlur = 15 * pulse;
    drawCell(food.x, food.y, `rgba(255,111,76,${0.7 + 0.3 * pulse})`, CELL_SIZE * 0.5);
    ctx.shadowBlur = 0;
  }

  function update() {
    if (gameOver || paused) return;

    let now = performance.now();
    let timeSinceMove = now - lastMoveTime;
    if (timeSinceMove < 1000 / speed) return;

    lastMoveTime = now;
    moveProgress = 0;

    if ((nextDirection.x !== -direction.x || nextDirection.y !== -direction.y) && (nextDirection.x !== 0 || nextDirection.y !== 0)) {
      direction = nextDirection;
    }

    let head = snake[snake.length - 1];
    lastHeadPos = {...head};
    let newHead = { x: head.x + direction.x, y: head.y + direction.y };

    if (newHead.x < 0) newHead.x = COLS - 1;
    else if (newHead.x >= COLS) newHead.x = 0;
    if (newHead.y < 0) newHead.y = ROWS - 1;
    else if (newHead.y >= ROWS) newHead.y = 0;

    nextHeadPos = {...newHead};

    if (snake.some(seg => positionsEqual(seg, newHead))) {
      endGame();
      return;
    }

    snake.push(newHead);

    if (positionsEqual(newHead, food)) {
      score++;
      if(score > highestScore){
        highestScore = score;
        localStorage.setItem('snakeHighestScore', highestScore);
      }
      scoreEl.textContent = score;

      if (score % speedIncrementScoreStep === 0 && speedLevel < maxSpeedLevel) {
        speedLevel++;
        speed += 2;
        speedEl.textContent = speedLevel;
      }

      placeFood();
    } else {
      snake.shift();
    }
  }

  function draw(t) {
    if (!gameOver && !paused) {
      let now = performance.now();
      let elapsed = now - lastMoveTime;
      let frameTime = 1000 / speed;
      moveProgress = Math.min(elapsed / frameTime, 1);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for(let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for(let j = 0; j <= ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL_SIZE);
      ctx.lineTo(canvas.width, j * CELL_SIZE);
      ctx.stroke();
    }

    drawFood(t);
    drawSnake(t);

    if (paused) {
      pauseIndicator.style.display = 'block';
    } else {
      pauseIndicator.style.display = 'none';
    }
  }

  function gameLoop(t = 0) {
    update();
    draw(t);
    if(!gameOver) window.requestAnimationFrame(gameLoop);
  }

  window.addEventListener('keydown', e => {
    if (gameOver) return;
    switch(e.key) {
      case 'ArrowUp': case 'w': case 'W':
        if(direction !== DIRS.DOWN) nextDirection = DIRS.UP; break;
      case 'ArrowDown': case 's': case 'S':
        if(direction !== DIRS.UP) nextDirection = DIRS.DOWN; break;
      case 'ArrowLeft': case 'a': case 'A':
        if(direction !== DIRS.RIGHT) nextDirection = DIRS.LEFT; break;
      case 'ArrowRight': case 'd': case 'D':
        if(direction !== DIRS.LEFT) nextDirection = DIRS.RIGHT; break;
      case ' ':
      case 'Spacebar':
        togglePause();
        break;
    }
  });

document.addEventListener(
  'touchstart',
  e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
    e.preventDefault(); // 🔥 BLOCK SCROLL
  },
  { passive: false }
);


document.addEventListener(
  'touchend',
  e => {
    if (gameOver) return;
    if (touchStartX === null || touchStartY === null) return;

    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > minSwipeDist && direction !== DIRS.LEFT)
        nextDirection = DIRS.RIGHT;
      else if (dx < -minSwipeDist && direction !== DIRS.RIGHT)
        nextDirection = DIRS.LEFT;
    } else {
      if (dy > minSwipeDist && direction !== DIRS.UP)
        nextDirection = DIRS.DOWN;
      else if (dy < -minSwipeDist && direction !== DIRS.DOWN)
        nextDirection = DIRS.UP;
    }

    touchStartX = null;
    touchStartY = null;
    e.preventDefault(); // 🔥 STOP BROWSER ACTION
  },
  { passive: false }
);



  function togglePause() {
    if(gameOver) return;
    paused = !paused;
    if(!paused) {
      lastMoveTime = performance.now();
    }
  }

  function endGame() {
    gameOver = true;
    gameOverScore.textContent = "Your Score: " + score;
    gameOverScreen.classList.add('visible');
  }

  restartBtn.addEventListener('click', () => {
    resetGame();
    gameLoop();
  });

  backToMenuBtn.addEventListener('click', () => {
    gameOver = true;
    gameContainer.setAttribute('aria-hidden', 'true');
    startPage.classList.add('visible');
    trapFocus(startPage);
  });
  
  if(playerName) {
    startPage.classList.add('visible');
    gameContainer.setAttribute('aria-hidden', 'true');
  } else {
    namePopup.classList.remove('hidden');
    startPage.classList.remove('visible');
    gameContainer.setAttribute('aria-hidden', 'true');
  }
})();


