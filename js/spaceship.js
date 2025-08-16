class SpaceShooter {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Configuração do canvas responsivo
    this.setupCanvas();
    
    // Estado do jogo
    this.gameRunning = false;
    this.gamePaused = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    // Objetos do jogo
    this.player = {
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 80,
      width: 50,
      height: 40,
      speed: 5
    };
    
    this.bullets = [];
    this.meteors = [];
    this.particles = [];
    this.stars = [];
    
    // Configurações do jogo
    this.bulletSpeed = 7;
    this.meteorSpeed = 2;
    this.meteorSpawnRate = 0.02;
    
    // Controles
    this.keys = {};
    
    // Inicializar
    this.initializeStars();
    this.setupEventListeners();
    this.updateDisplay();
  }

  setupCanvas() {
    // Ajustar canvas para responsividade
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth - 40; // padding
    const maxWidth = 800;
    const maxHeight = 600;
    
    if (containerWidth < maxWidth) {
      const ratio = containerWidth / maxWidth;
      this.canvas.width = containerWidth;
      this.canvas.height = maxHeight * ratio;
    } else {
      this.canvas.width = maxWidth;
      this.canvas.height = maxHeight;
    }
  }

  initializeStars() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 0.5
      });
    }
  }

  setupEventListeners() {
    // Controles do teclado
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      // Pausar/Despausar
      if (e.code === 'KeyP') {
        this.pauseGame();
      }
      
      // Iniciar jogo com espaço se não estiver rodando
      if (e.code === 'Space' && !this.gameRunning && !this.gamePaused) {
        this.startGame();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Redimensionamento da janela
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.player.x = this.canvas.width / 2 - 25;
    });
  }

  startGame() {
    if (this.gameRunning) return;
    
    this.gameRunning = true;
    this.gamePaused = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    // Resetar posições
    this.player.x = this.canvas.width / 2 - 25;
    this.player.y = this.canvas.height - 80;
    
    // Limpar arrays
    this.bullets = [];
    this.meteors = [];
    this.particles = [];
    
    // Configurações iniciais
    this.meteorSpeed = 2;
    this.meteorSpawnRate = 0.02;
    
    this.updateDisplay();
    this.hideMessage();
    document.getElementById('playBtnText').textContent = 'Reiniciar';
    document.getElementById('gameStatus').textContent = '🚀';
    
    this.gameLoop();
  }

  pauseGame() {
    if (!this.gameRunning) return;
    
    this.gamePaused = !this.gamePaused;
    const pauseScreen = document.getElementById('pauseScreen');
    
    if (this.gamePaused) {
      pauseScreen.classList.add('show');
      document.getElementById('gameStatus').textContent = '⏸️';
    } else {
      pauseScreen.classList.remove('show');
      document.getElementById('gameStatus').textContent = '🚀';
      this.gameLoop();
    }
  }

  gameLoop() {
    if (!this.gameRunning || this.gamePaused) return;
    
    this.update();
    this.draw();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Movimento do jogador
    if ((this.keys['ArrowLeft'] || this.keys['KeyA']) && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if ((this.keys['ArrowRight'] || this.keys['KeyD']) && this.player.x < this.canvas.width - this.player.width) {
      this.player.x += this.player.speed;
    }
    
    // Atirar
    if (this.keys['Space']) {
      this.shoot();
    }
    
    // Atualizar estrelas
    this.updateStars();
    
    // Spawnar meteoros
    if (Math.random() < this.meteorSpawnRate + (this.level * 0.005)) {
      this.spawnMeteor();
    }
    
    // Atualizar balas
    this.updateBullets();
    
    // Atualizar meteoros
    this.updateMeteors();
    
    // Atualizar partículas
    this.updateParticles();
    
    // Verificar colisões
    this.checkCollisions();
    
    // Verificar level up
    this.checkLevelUp();
  }

  updateStars() {
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });
  }

  shoot() {
    // Limitar taxa de tiro
    const now = Date.now();
    if (!this.lastShot || now - this.lastShot > 150) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 10
      });
      this.lastShot = now;
    }
  }

  spawnMeteor() {
    const size = Math.random() * 30 + 20;
    this.meteors.push({
      x: Math.random() * (this.canvas.width - size),
      y: -size,
      width: size,
      height: size,
      speed: this.meteorSpeed + Math.random() * 2,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }

  updateBullets() {
    this.bullets = this.bullets.filter(bullet => {
      bullet.y -= this.bulletSpeed;
      return bullet.y > 0;
    });
  }

  updateMeteors() {
    this.meteors.forEach(meteor => {
      meteor.y += meteor.speed;
      meteor.rotation += meteor.rotationSpeed;
    });
    
    // Remove meteoros que saíram da tela
    this.meteors = this.meteors.filter(meteor => meteor.y < this.canvas.height + 50);
  }

  updateParticles() {
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;
    });
    
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  checkCollisions() {
    // Bala vs Meteoro
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.meteors.length - 1; j >= 0; j--) {
        if (this.collision(this.bullets[i], this.meteors[j])) {
          // Criar partículas de explosão
          this.createExplosion(this.meteors[j].x + this.meteors[j].width / 2, 
                              this.meteors[j].y + this.meteors[j].height / 2);
          
          // Remover bala e meteoro
          this.bullets.splice(i, 1);
          this.meteors.splice(j, 1);
          
          // Aumentar pontuação
          this.score += 10;
          this.updateDisplay();
          break;
        }
      }
    }
    
    // Jogador vs Meteoro
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      if (this.collision(this.player, this.meteors[i])) {
        // Criar explosão
        this.createExplosion(this.player.x + this.player.width / 2, 
                            this.player.y + this.player.height / 2);
        
        // Remover meteoro
        this.meteors.splice(i, 1);
        
        // Perder vida
        this.lives--;
        this.updateDisplay();
        
        if (this.lives <= 0) {
          this.gameOver();
        } else {
          this.showMessage('💥 Colisão! Cuidado! 💥', 'lose', 2000);
          document.getElementById('gameStatus').textContent = '😵';
          setTimeout(() => {
            if (this.gameRunning) {
              document.getElementById('gameStatus').textContent = '🚀';
            }
          }, 2000);
        }
        break;
      }
    }
  }

  collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        maxLife: 30,
        alpha: 1,
        color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`
      });
    }
  }

  checkLevelUp() {
    const newLevel = Math.floor(this.score / 100) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.meteorSpeed += 0.5;
      this.meteorSpawnRate += 0.01;
      this.showMessage(`🎉 Nível ${this.level}! 🎉`, 'level-up', 2000);
      this.updateDisplay();
    }
  }

  gameOver() {
    this.gameRunning = false;
    this.showMessage(`💥 Game Over! Pontuação: ${this.score} 💥`, 'lose');
    document.getElementById('gameStatus').textContent = '💀';
    document.getElementById('playBtnText').textContent = 'Iniciar';
  }

  draw() {
    // Limpar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Desenhar estrelas
    this.drawStars();
    
    // Desenhar jogador
    this.drawPlayer();
    
    // Desenhar balas
    this.drawBullets();
    
    // Desenhar meteoros
    this.drawMeteors();
    
    // Desenhar partículas
    this.drawParticles();
  }

  drawStars() {
    this.ctx.fillStyle = '#ffffff';
    this.stars.forEach(star => {
      this.ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    this.ctx.globalAlpha = 1;
  }

  drawPlayer() {
    this.ctx.fillStyle = '#00aaff';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Detalhes da nave
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(this.player.x + 20, this.player.y + 5, 10, 30);
    
    // Propulsores
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.fillRect(this.player.x + 5, this.player.y + 35, 8, 10);
    this.ctx.fillRect(this.player.x + 37, this.player.y + 35, 8, 10);
  }

  drawBullets() {
    this.ctx.fillStyle = '#00ffff';
    this.bullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      
      // Efeito de brilho
      this.ctx.shadowColor = '#00ffff';
      this.ctx.shadowBlur = 5;
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      this.ctx.shadowBlur = 0;
    });
  }

  drawMeteors() {
    this.meteors.forEach(meteor => {
      this.ctx.save();
      this.ctx.translate(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2);
      this.ctx.rotate(meteor.rotation);
      
      // Meteoro
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(-meteor.width / 2, -meteor.height / 2, meteor.width, meteor.height);
      
      // Detalhes do meteoro
      this.ctx.fillStyle = '#a0522d';
      this.ctx.fillRect(-meteor.width / 3, -meteor.height / 3, meteor.width / 2, meteor.height / 2);
      
      this.ctx.restore();
    });
  }

  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    this.ctx.globalAlpha = 1;
  }

  updateDisplay() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('level').textContent = this.level;
  }

  showMessage(text, type, duration = 0) {
    const messageEl = document.getElementById('gameMessage');
    messageEl.textContent = text;
    messageEl.className = `game-message show ${type}`;
    
    if (duration > 0) {
      setTimeout(() => this.hideMessage(), duration);
    }
  }

  hideMessage() {
    const messageEl = document.getElementById('gameMessage');
    messageEl.className = 'game-message';
  }
}

// Funções globais
function startGame() {
  if (window.spaceGame) {
    window.spaceGame.startGame();
  }
}

function pauseGame() {
  if (window.spaceGame) {
    window.spaceGame.pauseGame();
  }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
  window.spaceGame = new SpaceShooter();
});