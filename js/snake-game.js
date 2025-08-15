class SnakeGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.currentScoreElement = document.getElementById('currentScore');
    this.highScoreElement = document.getElementById('highScore');

    // Game settings
    this.BOARD_WIDTH = 400;
    this.BOARD_HEIGHT = 400;
    this.UNIT_SIZE = 20;
    this.gameSpeed = 150;

    // Colors adapted to ATF Soluções theme
    this.BG_COLOR = '#0f1115';
    this.SNAKE_COLOR = '#00aaff';          // Azul principal do site
    this.SNAKE_HEAD_COLOR = '#0099ee';     // Azul mais claro para a cabeça
    this.FOOD_COLOR = '#005577';           // Azul escuro para contraste
    this.GRID_COLOR = '#1a1a2e';           // Cinza escuro para o grid
    this.BORDER_COLOR = '#00aaff';         // Azul para bordas

    // Game state
    this.snake = [{x: 0, y: 0}];
    this.food = this.createFood();
    this.direction = {x: this.UNIT_SIZE, y: 0};
    this.score = 0;
    this.highScore = this.getHighScore();
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameLoop = null;

    this.setupEventListeners();
    this.updateScoreDisplay();
    this.drawGame();
  }

  setupEventListeners() {
    this.startBtn.addEventListener('click', () => this.startGame());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.resetBtn.addEventListener('click', () => this.resetGame());

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.changeDirection(e));
    
    // Mobile controls
    const mobileButtons = document.querySelectorAll('.mobile-btn');
    mobileButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const direction = e.currentTarget.getAttribute('data-direction');
        this.handleMobileDirection(direction);
      });
    });
    
    // Prevent arrow keys from scrolling the page
    document.addEventListener('keydown', (e) => {
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  handleMobileDirection(direction) {
    if (!this.gameRunning || this.gamePaused) return;

    const currentDirection = this.direction;
    let newDirection = {...currentDirection};

    switch(direction) {
      case 'up':
        if (currentDirection.y === 0) {
          newDirection = {x: 0, y: -this.UNIT_SIZE};
        }
        break;
      case 'down':
        if (currentDirection.y === 0) {
          newDirection = {x: 0, y: this.UNIT_SIZE};
        }
        break;
      case 'left':
        if (currentDirection.x === 0) {
          newDirection = {x: -this.UNIT_SIZE, y: 0};
        }
        break;
      case 'right':
        if (currentDirection.x === 0) {
          newDirection = {x: this.UNIT_SIZE, y: 0};
        }
        break;
    }

    this.direction = newDirection;
  }

  createFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * (this.BOARD_WIDTH / this.UNIT_SIZE)) * this.UNIT_SIZE,
        y: Math.floor(Math.random() * (this.BOARD_HEIGHT / this.UNIT_SIZE)) * this.UNIT_SIZE
      };
    } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
    return food;
  }

  startGame() {
    if (!this.gameRunning) {
      this.gameRunning = true;
      this.gamePaused = false;
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.pauseBtn.textContent = 'PAUSAR';
      this.runGameLoop();
    }
  }

  togglePause() {
    if (this.gameRunning) {
      this.gamePaused = !this.gamePaused;
      this.pauseBtn.textContent = this.gamePaused ? 'CONTINUAR' : 'PAUSAR';
      if (!this.gamePaused) {
        this.runGameLoop();
      }
    }
  }

  resetGame() {
    this.gameRunning = false;
    this.gamePaused = false;
    this.snake = [{x: 0, y: 0}];
    this.food = this.createFood();
    this.direction = {x: this.UNIT_SIZE, y: 0};
    this.score = 0;
    this.gameSpeed = 150;
    
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.pauseBtn.textContent = 'PAUSAR';
    
    this.updateScoreDisplay();
    this.drawGame();
    
    if (this.gameLoop) {
      clearTimeout(this.gameLoop);
    }
  }

  changeDirection(event) {
    if (!this.gameRunning || this.gamePaused) return;

    const key = event.key.toLowerCase();
    const currentDirection = this.direction;

    let newDirection = {...currentDirection};

    switch(key) {
      case 'arrowup':
      case 'w':
        if (currentDirection.y === 0) {
          newDirection = {x: 0, y: -this.UNIT_SIZE};
        }
        break;
      case 'arrowdown':
      case 's':
        if (currentDirection.y === 0) {
          newDirection = {x: 0, y: this.UNIT_SIZE};
        }
        break;
      case 'arrowleft':
      case 'a':
        if (currentDirection.x === 0) {
          newDirection = {x: -this.UNIT_SIZE, y: 0};
        }
        break;
      case 'arrowright':
      case 'd':
        if (currentDirection.x === 0) {
          newDirection = {x: this.UNIT_SIZE, y: 0};
        }
        break;
    }

    this.direction = newDirection;
  }

  moveSnake() {
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    this.snake.unshift(head);

    // Check if food eaten
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.food = this.createFood();
      // Increase speed slightly
      if (this.gameSpeed > 80) {
        this.gameSpeed = Math.max(80, this.gameSpeed - 3);
      }
    } else {
      this.snake.pop();
    }

    this.updateScoreDisplay();
  }

  checkCollisions() {
    const head = this.snake[0];

    // Wall collision
    if (head.x < 0 || head.x >= this.BOARD_WIDTH || 
        head.y < 0 || head.y >= this.BOARD_HEIGHT) {
      return true;
    }

    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        return true;
      }
    }

    return false;
  }

  drawGame() {
    // Clear canvas
    this.ctx.fillStyle = this.BG_COLOR;
    this.ctx.fillRect(0, 0, this.BOARD_WIDTH, this.BOARD_HEIGHT);

    // Draw grid
    this.ctx.strokeStyle = this.GRID_COLOR;
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.BOARD_WIDTH; i += this.UNIT_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.BOARD_HEIGHT);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.BOARD_HEIGHT; i += this.UNIT_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.BOARD_WIDTH, i);
      this.ctx.stroke();
    }

    // Draw snake with gradient effect
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Snake head with special styling
        this.ctx.fillStyle = this.SNAKE_HEAD_COLOR;
        this.ctx.fillRect(segment.x + 1, segment.y + 1, this.UNIT_SIZE - 2, this.UNIT_SIZE - 2);
        
        // Add border to head
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(segment.x + 1, segment.y + 1, this.UNIT_SIZE - 2, this.UNIT_SIZE - 2);
        
        // Add eyes to the head
        this.ctx.fillStyle = '#000000';
        const eyeSize = 3;
        this.ctx.fillRect(segment.x + 5, segment.y + 5, eyeSize, eyeSize);
        this.ctx.fillRect(segment.x + 12, segment.y + 5, eyeSize, eyeSize);
      } else {
        // Snake body with gradient
        const alpha = 1 - (index * 0.05); // Gradual transparency
        this.ctx.fillStyle = this.SNAKE_COLOR + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        this.ctx.fillRect(segment.x + 1, segment.y + 1, this.UNIT_SIZE - 2, this.UNIT_SIZE - 2);
        
        this.ctx.strokeStyle = this.BORDER_COLOR + '80'; // Semi-transparent border
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(segment.x + 1, segment.y + 1, this.UNIT_SIZE - 2, this.UNIT_SIZE - 2);
      }
    });

    // Draw food with pulsing effect
    const time = Date.now() * 0.005;
    const pulseSize = 2 + Math.sin(time) * 1;
    
    this.ctx.fillStyle = this.FOOD_COLOR;
    this.ctx.fillRect(
      this.food.x + pulseSize, 
      this.food.y + pulseSize, 
      this.UNIT_SIZE - (pulseSize * 2), 
      this.UNIT_SIZE - (pulseSize * 2)
    );
    
    // Food border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.food.x + pulseSize, 
      this.food.y + pulseSize, 
      this.UNIT_SIZE - (pulseSize * 2), 
      this.UNIT_SIZE - (pulseSize * 2)
    );
  }

  runGameLoop() {
    if (!this.gameRunning || this.gamePaused) return;

    this.moveSnake();

    if (this.checkCollisions()) {
      this.gameOver();
      return;
    }

    this.drawGame();
    this.gameLoop = setTimeout(() => this.runGameLoop(), this.gameSpeed);
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

    // Draw game over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.BOARD_WIDTH, this.BOARD_HEIGHT);

    // Game over text
    this.ctx.fillStyle = '#00aaff';
    this.ctx.font = 'bold 28px Courier New';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER!', this.BOARD_WIDTH/2, this.BOARD_HEIGHT/2 - 30);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px Courier New';
    this.ctx.fillText(`SCORE FINAL: ${this.score}`, this.BOARD_WIDTH/2, this.BOARD_HEIGHT/2 + 10);

    if (this.score === this.highScore && this.score > 0) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.font = 'bold 16px Courier New';
      this.ctx.fillText('🏆 NOVO RECORDE! 🏆', this.BOARD_WIDTH/2, this.BOARD_HEIGHT/2 + 40);
    }

    this.updateScoreDisplay();
    
    setTimeout(() => {
      const message = this.score === this.highScore && this.score > 0 
        ? `🏆 NOVO RECORDE! 🏆\n\nScore final: ${this.score}\n\nParabéns! Você estabeleceu um novo recorde!\n\nClique em RESETAR para jogar novamente.`
        : `Fim de jogo!\n\nScore final: ${this.score}\n\nClique em RESETAR para jogar novamente.`;
      alert(message);
    }, 100);
  }

  updateScoreDisplay() {
    this.currentScoreElement.textContent = this.score;
    this.highScoreElement.textContent = this.highScore;
  }

  getHighScore() {
    return parseInt(localStorage.getItem('atfSnakeHighScore') || '0');
  }

  saveHighScore() {
    localStorage.setItem('atfSnakeHighScore', this.highScore.toString());
  }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new SnakeGame();
});