class Minesweeper {
  constructor() {
    this.board = [];
    this.gameStarted = false;
    this.gameEnded = false;
    this.timer = 0;
    this.timerInterval = null;
    this.flagCount = 0;
    
    this.difficulties = {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 16, cols: 16, mines: 40 },
      hard: { rows: 16, cols: 30, mines: 99 }
    };
    
    this.currentDifficulty = 'easy';
    this.rows = this.difficulties.easy.rows;
    this.cols = this.difficulties.easy.cols;
    this.mines = this.difficulties.easy.mines;
    
    this.initializeEventListeners();
    this.newGame();
  }

  initializeEventListeners() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelector('.difficulty-btn.active').classList.remove('active');
        e.target.classList.add('active');
        this.currentDifficulty = e.target.dataset.level;
        const diff = this.difficulties[this.currentDifficulty];
        this.rows = diff.rows;
        this.cols = diff.cols;
        this.mines = diff.mines;
        this.newGame();
      });
    });
  }

  newGame() {
    this.gameStarted = false;
    this.gameEnded = false;
    this.timer = 0;
    this.flagCount = 0;
    this.clearTimer();
    this.updateDisplay();
    this.hideMessage();
    this.initializeBoard();
    this.renderBoard();
    document.getElementById('gameStatus').textContent = '😊';
  }

  initializeBoard() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      this.board[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.board[r][c] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        };
      }
    }
  }

  placeMines(firstClickR, firstClickC) {
    let minesPlaced = 0;
    while (minesPlaced < this.mines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      
      // Não coloque mina na primeira célula clicada ou onde já tem mina
      if (!this.board[r][c].isMine && !(r === firstClickR && c === firstClickC)) {
        this.board[r][c].isMine = true;
        minesPlaced++;
      }
    }
    this.calculateAdjacentMines();
  }

  calculateAdjacentMines() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (this.isValidCell(nr, nc) && this.board[nr][nc].isMine) {
                count++;
              }
            }
          }
          this.board[r][c].adjacentMines = count;
        }
      }
    }
  }

  isValidCell(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  renderBoard() {
    const boardElement = document.getElementById('gameBoard');
    boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
    boardElement.innerHTML = '';

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        
        cell.addEventListener('click', (e) => this.handleCellClick(e, r, c));
        cell.addEventListener('contextmenu', (e) => this.handleCellRightClick(e, r, c));
        
        this.updateCellDisplay(cell, r, c);
        boardElement.appendChild(cell);
      }
    }
  }

  updateCellDisplay(cellElement, r, c) {
    const cell = this.board[r][c];
    cellElement.className = 'cell';
    cellElement.textContent = '';

    if (cell.isFlagged) {
      cellElement.classList.add('flagged');
      cellElement.textContent = '🚩';
    } else if (cell.isRevealed) {
      cellElement.classList.add('revealed');
      if (cell.isMine) {
        cellElement.classList.add('mine');
        cellElement.textContent = '💣';
      } else if (cell.adjacentMines > 0) {
        cellElement.textContent = cell.adjacentMines;
        cellElement.classList.add(`number-${cell.adjacentMines}`);
      }
    }
  }

  handleCellClick(e, r, c) {
    e.preventDefault();
    if (this.gameEnded || this.board[r][c].isFlagged || this.board[r][c].isRevealed) {
      return;
    }

    if (!this.gameStarted) {
      this.gameStarted = true;
      this.placeMines(r, c);
      this.startTimer();
    }

    this.revealCell(r, c);
    this.updateBoard();
    this.checkGameEnd();
  }

  handleCellRightClick(e, r, c) {
    e.preventDefault();
    if (this.gameEnded || this.board[r][c].isRevealed) {
      return;
    }

    this.board[r][c].isFlagged = !this.board[r][c].isFlagged;
    this.flagCount += this.board[r][c].isFlagged ? 1 : -1;
    this.updateBoard();
    this.updateDisplay();
  }

  revealCell(r, c) {
    if (!this.isValidCell(r, c) || this.board[r][c].isRevealed || this.board[r][c].isFlagged) {
      return;
    }

    this.board[r][c].isRevealed = true;

    if (this.board[r][c].isMine) {
      this.gameEnd(false);
      return;
    }

    // Se não há minas adjacentes, revele células vizinhas
    if (this.board[r][c].adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          this.revealCell(r + dr, c + dc);
        }
      }
    }
  }

  updateBoard() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cellElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        this.updateCellDisplay(cellElement, r, c);
      }
    }
  }

  checkGameEnd() {
    let revealedCount = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c].isRevealed && !this.board[r][c].isMine) {
          revealedCount++;
        }
      }
    }

    const totalNonMines = this.rows * this.cols - this.mines;
    if (revealedCount === totalNonMines) {
      this.gameEnd(true);
    }
  }

  gameEnd(won) {
    this.gameEnded = true;
    this.clearTimer();

    if (won) {
      this.showMessage('🎉 Parabéns! Você ganhou! 🎉', 'win');
      document.getElementById('gameStatus').textContent = '😎';
    } else {
      this.showMessage('💥 Game Over! Tente novamente! 💥', 'lose');
      document.getElementById('gameStatus').textContent = '😵';
      this.revealAllMines();
    }
  }

  revealAllMines() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c].isMine) {
          this.board[r][c].isRevealed = true;
        }
      }
    }
    this.updateBoard();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.updateDisplay();
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateDisplay() {
    document.getElementById('mineCount').textContent = Math.max(0, this.mines - this.flagCount).toString().padStart(2, '0');
    document.getElementById('timer').textContent = this.timer.toString().padStart(3, '0');
  }

  showMessage(text, type) {
    const messageEl = document.getElementById('gameMessage');
    messageEl.textContent = text;
    messageEl.className = `game-message show ${type}`;
  }

  hideMessage() {
    const messageEl = document.getElementById('gameMessage');
    messageEl.className = 'game-message';
  }
}

// Função global para o botão "Novo Jogo"
function newGame() {
  if (window.game) {
    window.game.newGame();
  }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
  window.game = new Minesweeper();
});

// Prevenir menu de contexto padrão no jogo
document.addEventListener('contextmenu', (e) => {
  if (e.target.classList.contains('cell')) {
    e.preventDefault();
  }
});