class TetrisGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('nextCanvas');
    this.nextCtx = this.nextCanvas.getContext('2d');
    
    // UI Elements
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.scoreElement = document.getElementById('score');
    this.linesElement = document.getElementById('lines');
    this.levelElement = document.getElementById('level');
    this.highScoreElement = document.getElementById('highScore');

    // Game dimensions
    this.ROWS = 20;
    this.COLS = 10;
    this.BLOCK_SIZE = 30;
    
    // Colors adapted to ATF Soluções theme
    this.COLORS = {
      I: '#00aaff',      // Azul principal
      O: '#0099ee',      // Azul claro
      T: '#005577',      // Azul escuro
      S: '#66ccff',      // Azul muito claro
      Z: '#003366',      // Azul muito escuro
      J: '#0088cc',      // Azul médio
      L: '#004488',      // Azul médio escuro
      EMPTY: '#0f1115',  // Fundo
      GRID: '#1a1a2e',   // Grid
      SHADOW: '#00445580' // Sombra
    };

    // Tetris pieces (tetrominoes)
    this.PIECES = {
      I: [
        [[1,1,1,1]],
        [[1],[1],[1],[1]]
      ],
      O: [
        [[1,1],[1,1]]
      ],
      T: [
        [[0,1,0],[1,1,1]],
        [[1,0],[1,1],[1,0]],
        [[1,1,1],[0,1,0]],
        [[0,1],[1,1],[0,1]]
      ],
      S: [
        [[0,1,1],[1,1,0]],
        [[1,0],[1,1],[0,1]]
      ],
      Z: [
        [[1,1,0],[0,1,1]],
        [[0,1],[1,1],[1,0]]
      ],
      J: [
        [[1,0,0],[1,1,1]],
        [[1,1],[1,0],[1,0]],
        [[1,1,1],[0,0,1]],
        [[0,1],[0,1],[1,1]]
      ],
      L: [
        [[0,0,1],[1,1,1]],
        [[1,0],[1,0],[1,1]],
        [[1,1,1],[1,0,0]],
        [[1,1],[0,1],[0,1]]
      ]
    };

    // Game state
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.highScore = this.getHighScore();
    this.gameRunning = false;
    this.gamePaused = false;
    this.dropTime = 0;
    this.lastTime = 0;

    this.setupEventListeners();
    this.updateUI();
    this.drawBoard();
    this.generateNextPiece();
    this.drawNextPiece();
  }

  createEmptyBoard() {
    return Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
  }

  setupEventListeners() {
    this.startBtn.addEventListener('click', () => this.startGame());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.resetBtn.addEventListener('click', () => this.resetGame());

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Mobile controls
    document.getElementById('leftBtn').addEventListener('click', () => this.movePiece(-1, 0));
    document.getElementById('rightBtn').addEventListener('click', () => this.movePiece(1, 0));
    document.getElementById('downBtn').addEventListener('click', () => this.movePiece(0, 1));
    document.getElementById('rotateBtn').addEventListener('click', () => this.rotatePiece());
    document.getElementById('dropBtn').addEventListener('click', () => this.hardDrop());

    // Prevent arrow keys from scrolling
    document.addEventListener('keydown', (e) => {
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  handleKeyPress(event) {
    if (!this.gameRunning || this.gamePaused) {
      if (event.key.toLowerCase() === 'p') {
        this.togglePause();
      }
      return;
    }

    switch(event.code) {
      case 'ArrowLeft':
        this.movePiece(-1, 0);
        break;
      case 'ArrowRight':
        this.movePiece(1, 0);
        break;
      case 'ArrowDown':
        this.movePiece(0, 1);
        break;
      case 'ArrowUp':
        this.rotatePiece();
        break;
      case 'Space':
        this.hardDrop();
        break;
      case 'KeyP':
        this.togglePause();
        break;
    }
  }

  startGame() {
    if (!this.gameRunning) {
      this.gameRunning = true;
      this.gamePaused = false;
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.pauseBtn.textContent = 'PAUSAR';
      this.spawnPiece();
      this.gameLoop();
    }
  }

  togglePause() {
    if (this.gameRunning) {
      this.gamePaused = !this.gamePaused;
      this.pauseBtn.textContent = this.gamePaused ? 'CONTINUAR' : 'PAUSAR';
      if (!this.gamePaused) {
        this.gameLoop();
      }
    }
  }

  resetGame() {
    this.gameRunning = false;
    this.gamePaused = false;
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropTime = 0;
    
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.pauseBtn.textContent = 'PAUSAR';
    
    this.updateUI();
    this.drawBoard();
    this.generateNextPiece();
    this.drawNextPiece();
  }

  spawnPiece() {
    if (!this.nextPiece) {
      this.generateNextPiece();
    }
    
    this.currentPiece = this.nextPiece;
    this.currentPiece.x = Math.floor((this.COLS - this.currentPiece.shape[0].length) / 2);
    this.currentPiece.y = 0;
    
    this.generateNextPiece();
    this.drawNextPiece();

    // Check game over
    if (this.checkCollision(this.currentPiece)) {
      this.gameOver();
    }
  }

  generateNextPiece() {
    const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    
    this.nextPiece = {
      type: type,
      shape: this.PIECES[type][0],
      rotation: 0,
      x: 0,
      y: 0,
      color: this.COLORS[type]
    };
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return;
    
    const newPiece = {
      ...this.currentPiece,
      x: this.currentPiece.x + dx,
      y: this.currentPiece.y + dy
    };

    if (!this.checkCollision(newPiece)) {
      this.currentPiece = newPiece;
      this.drawBoard();
    } else if (dy > 0) {
      // Piece landed
      this.placePiece();
    }
  }

  rotatePiece() {
    if (!this.currentPiece) return;
    
    const rotations = this.PIECES[this.currentPiece.type];
    const nextRotation = (this.currentPiece.rotation + 1) % rotations.length;
    
    const rotatedPiece = {
      ...this.currentPiece,
      shape: rotations[nextRotation],
      rotation: nextRotation
    };

    if (!this.checkCollision(rotatedPiece)) {
      this.currentPiece = rotatedPiece;
      this.drawBoard();
    }
  }

  hardDrop() {
    if (!this.currentPiece) return;
    
    while (!this.checkCollision({
      ...this.currentPiece,
      y: this.currentPiece.y + 1
    })) {
      this.currentPiece.y++;
      this.score += 2; // Bonus points for hard drop
    }
    
    this.placePiece();
  }

  checkCollision(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          
          if (newX < 0 || newX >= this.COLS || 
              newY >= this.ROWS || 
              (newY >= 0 && this.board[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  placePiece() {
    // Place piece on board
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardY = this.currentPiece.y + y;
          const boardX = this.currentPiece.x + x;
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.type;
          }
        }
      }
    }

    // Clear completed lines
    this.clearLines();
    
    // Spawn next piece
    this.spawnPiece();
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(this.COLS).fill(0));
        linesCleared++;
        y++; // Check the same row again
      }
    }

    if (linesCleared > 0) {
      // Update score based on lines cleared
      const lineScores = [0, 100, 300, 500, 800];
      const baseScore = lineScores[linesCleared] || 800;
      this.score += baseScore * this.level;
      
      this.lines += linesCleared;
      
      // Level up every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
      }
      
      this.updateUI();
    }
  }

  getDropSpeed() {
    return Math.max(50, 1000 - (this.level - 1) * 50);
  }

  gameLoop(time = 0) {
    if (!this.gameRunning || this.gamePaused) return;

    const deltaTime = time - this.lastTime;
    this.dropTime += deltaTime;
    this.lastTime = time;

    if (this.dropTime >= this.getDropSpeed()) {
      this.movePiece(0, 1);
      this.dropTime = 0;
    }

    this.drawBoard();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  drawBoard() {
    // Clear canvas
    this.ctx.fillStyle = this.COLORS.EMPTY;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = this.COLORS.GRID;
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
      this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.BLOCK_SIZE);
      this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
      this.ctx.stroke();
    }

    // Draw placed pieces
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y][x]) {
          this.drawBlock(x, y, this.COLORS[this.board[y][x]], true);
        }
      }
    }

    // Draw ghost piece (shadow)
    if (this.currentPiece) {
      const ghostPiece = {...this.currentPiece};
      while (!this.checkCollision({...ghostPiece, y: ghostPiece.y + 1})) {
        ghostPiece.y++;
      }
      
      if (ghostPiece.y !== this.currentPiece.y) {
        this.drawPiece(ghostPiece, this.COLORS.SHADOW, false);
      }
    }

    // Draw current piece
    if (this.currentPiece) {
      this.drawPiece(this.currentPiece, this.currentPiece.color, true);
    }

    // Draw game over overlay
    if (!this.gameRunning && this.currentPiece) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#00aaff';
      this.ctx.font = 'bold 24px Courier New';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER!', this.canvas.width/2, this.canvas.height/2 - 30);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Courier New';
      this.ctx.fillText(`SCORE FINAL: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 10);
    }
  }

  drawPiece(piece, color, solid) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          this.drawBlock(piece.x + x, piece.y + y, color, solid);
        }
      }
    }
  }

  drawBlock(x, y, color, solid = true) {
    const pixelX = x * this.BLOCK_SIZE;
    const pixelY = y * this.BLOCK_SIZE;
    
    if (solid) {
      // Draw filled block with gradient
      const gradient = this.ctx.createLinearGradient(
        pixelX, pixelY, 
        pixelX + this.BLOCK_SIZE, pixelY + this.BLOCK_SIZE
      );
      gradient.addColorStop(0, this.lightenColor(color, 20));
      gradient.addColorStop(1, color);
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
      
      // Draw border
      this.ctx.strokeStyle = this.lightenColor(color, 40);
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
    } else {
      // Draw ghost/shadow piece
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
    }
  }

  drawNextPiece() {
    // Clear next canvas
    this.nextCtx.fillStyle = this.COLORS.EMPTY;
    this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    if (!this.nextPiece) return;

    const shape = this.nextPiece.shape;
    const blockSize = 25;
    const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const pixelX = offsetX + x * blockSize;
          const pixelY = offsetY + y * blockSize;
          
          // Draw block with gradient
          const gradient = this.nextCtx.createLinearGradient(
            pixelX, pixelY,
            pixelX + blockSize, pixelY + blockSize
          );
          gradient.addColorStop(0, this.lightenColor(this.nextPiece.color, 20));
          gradient.addColorStop(1, this.nextPiece.color);
          
          this.nextCtx.fillStyle = gradient;
          this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);
          
          // Draw border
          this.nextCtx.strokeStyle = this.lightenColor(this.nextPiece.color, 40);
          this.nextCtx.lineWidth = 1;
          this.nextCtx.strokeRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);
        }
      }
    }
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  gameOver() {
    this.gameRunning = false;
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.pauseBtn.textContent = 'PAUSAR';

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    this.updateUI();
    this.drawBoard();

    setTimeout(() => {
      const message = this.score === this.highScore && this.score > 0 
        ? `🏆 NOVO RECORDE! 🏆\n\nScore final: ${this.score}\nLinhas: ${this.lines}\nNível: ${this.level}\n\nParabéns! Você estabeleceu um novo recorde!\n\nClique em RESETAR para jogar novamente.`
        : `Fim de jogo!\n\nScore final: ${this.score}\nLinhas: ${this.lines}\nNível: ${this.level}\n\nClique em RESETAR para jogar novamente.`;
      alert(message);
    }, 100);
  }

  updateUI() {
    this.scoreElement.textContent = this.score.toLocaleString();
    this.linesElement.textContent = this.lines;
    this.levelElement.textContent = this.level;
    this.highScoreElement.textContent = this.highScore.toLocaleString();
  }

  getHighScore() {
    return parseInt(localStorage.getItem('atfTetrisHighScore') || '0');
  }

  saveHighScore() {
    localStorage.setItem('atfTetrisHighScore', this.highScore.toString());
  }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new TetrisGame();
});