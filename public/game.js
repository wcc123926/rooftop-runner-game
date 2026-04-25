class RooftopRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.combo = 1;
        this.health = 100;
        
        this.speed = 5;
        this.baseSpeed = 5;
        this.maxSpeed = 15;
        this.speedIncrement = 0.001;
        
        this.player = {
            x: 100,
            y: 0,
            width: 40,
            height: 60,
            velocityY: 0,
            velocityX: 0,
            isJumping: false,
            isSliding: false,
            slideTimer: 0,
            slideDuration: 30,
            groundY: 0
        };
        
        this.platforms = [];
        this.obstacles = [];
        this.coinsList = [];
        this.particles = [];
        this.backgrounds = [];
        
        this.gravity = 0.6;
        this.jumpForce = -15;
        
        this.keys = {
            up: false,
            down: false
        };
        
        this.lastPlatformX = 0;
        this.platformGap = 300;
        this.scoreDisplay = {
            score: 0,
            distance: 0,
            coins: 0,
            combo: 1
        };
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.generateBackground();
        this.gameLoop();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.player.groundY = this.canvas.height - 150;
        this.player.y = this.player.groundY;
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.keys.up = true;
                if (this.gameState === 'playing') {
                    this.jump();
                }
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                e.preventDefault();
                this.keys.down = true;
                if (this.gameState === 'playing') {
                    this.slide();
                }
            }
            if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.keys.up = false;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.keys.down = false;
            }
        });
        
        // 窗口大小改变
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // UI按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('saveScoreBtn').addEventListener('click', () => this.saveScore());
        
        // 移动端控制按钮
        const jumpBtn = document.getElementById('jumpBtn');
        const slideBtn = document.getElementById('slideBtn');
        
        // 跳跃按钮
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.jump();
            }
        });
        
        jumpBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.jump();
            }
        });
        
        // 下滑按钮
        slideBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.slide();
            }
        });
        
        slideBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.slide();
            }
        });
    }
    
    generateBackground() {
        this.backgrounds = [];
        
        // 多层背景，营造深度感
        for (let layer = 0; layer < 3; layer++) {
            const bgLayer = {
                buildings: [],
                speed: (layer + 1) * 0.3,
                x: 0
            };
            
            // 生成建筑物
            let x = 0;
            while (x < this.canvas.width + 500) {
                const height = 100 + Math.random() * 200 - layer * 50;
                const width = 80 + Math.random() * 120;
                bgLayer.buildings.push({
                    x: x,
                    width: width,
                    height: height,
                    windows: []
                });
                
                // 生成窗户
                const windowRows = Math.floor(height / 30);
                const windowCols = Math.floor(width / 30);
                for (let row = 0; row < windowRows; row++) {
                    for (let col = 0; col < windowCols; col++) {
                        if (Math.random() > 0.3) {
                            bgLayer.buildings[bgLayer.buildings.length - 1].windows.push({
                                x: 10 + col * 30,
                                y: 10 + row * 30,
                                width: 15,
                                height: 20,
                                lit: Math.random() > 0.5
                            });
                        }
                    }
                }
                
                x += width + 20 + Math.random() * 40;
            }
            
            this.backgrounds.push(bgLayer);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetGame();
        document.getElementById('startScreen').classList.remove('active');
        document.getElementById('gameUI').style.display = 'block';
        document.getElementById('mobileControls').style.display = 'flex';
    }
    
    resetGame() {
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.combo = 1;
        this.health = 100;
        this.speed = this.baseSpeed;
        
        this.player.y = this.player.groundY;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.slideTimer = 0;
        this.player.height = 60;
        
        this.platforms = [];
        this.obstacles = [];
        this.coinsList = [];
        this.particles = [];
        this.lastPlatformX = 0;
        
        // 初始平台
        this.generateInitialPlatforms();
        
        this.updateScoreDisplay();
        this.updateHealthBar();
    }
    
    generateInitialPlatforms() {
        // 创建起始平台
        this.platforms.push({
            x: 0,
            y: this.player.groundY + 60,
            width: this.canvas.width * 2,
            height: 150,
            isGap: false
        });
        
        this.lastPlatformX = this.canvas.width * 2;
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').classList.add('active');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseScreen').classList.remove('active');
        }
    }
    
    restartGame() {
        document.getElementById('gameOverScreen').classList.remove('active');
        document.getElementById('pauseScreen').classList.remove('active');
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
        document.getElementById('gameOverScreen').classList.add('active');
        
        // 更新最终分数
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('finalDistance').textContent = Math.floor(this.distance);
        document.getElementById('finalCoins').textContent = this.coins;
        
        // 加载排行榜
        this.loadLeaderboard();
    }
    
    jump() {
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.createJumpParticles();
        }
    }
    
    slide() {
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.isSliding = true;
            this.player.slideTimer = this.player.slideDuration;
            this.player.height = 30;
            this.player.y = this.player.groundY + 30;
            this.createSlideParticles();
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: Math.random() * 2,
                size: 3 + Math.random() * 3,
                color: '#64c8ff',
                life: 30
            });
        }
    }
    
    createSlideParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                velocityX: -this.speed + Math.random() * 2,
                velocityY: -Math.random() * 2,
                size: 2 + Math.random() * 2,
                color: '#ff6b6b',
                life: 20
            });
        }
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 6,
                velocityY: (Math.random() - 0.5) * 6,
                size: 4 + Math.random() * 4,
                color: '#ffd700',
                life: 25
            });
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                size: 3 + Math.random() * 5,
                color: '#ff4757',
                life: 30
            });
        }
    }
    
    generatePlatforms() {
        // 生成新的平台
        while (this.lastPlatformX < this.canvas.width + this.player.x + 500) {
            const isGap = Math.random() < 0.2;
            
            if (isGap) {
                // 断裂平台
                const gapWidth = 100 + Math.random() * 100;
                this.platforms.push({
                    x: this.lastPlatformX,
                    y: this.player.groundY + 60,
                    width: gapWidth,
                    height: 150,
                    isGap: true
                });
                this.lastPlatformX += gapWidth;
                
                // 在间隙后生成正常平台
                const platformWidth = 200 + Math.random() * 300;
                this.platforms.push({
                    x: this.lastPlatformX,
                    y: this.player.groundY + 60,
                    width: platformWidth,
                    height: 150,
                    isGap: false
                });
                this.lastPlatformX += platformWidth;
            } else {
                // 正常平台
                const platformWidth = 300 + Math.random() * 400;
                this.platforms.push({
                    x: this.lastPlatformX,
                    y: this.player.groundY + 60,
                    width: platformWidth,
                    height: 150,
                    isGap: false
                });
                this.lastPlatformX += platformWidth;
            }
            
            // 在平台上生成障碍物
            const platform = this.platforms[this.platforms.length - 1];
            if (!platform.isGap && Math.random() < 0.7) {
                this.generateObstacle(platform);
            }
            
            // 生成金币
            if (Math.random() < 0.5) {
                this.generateCoins(platform);
            }
        }
        
        // 移除超出屏幕的平台
        this.platforms = this.platforms.filter(p => p.x + p.width > this.player.x - this.canvas.width);
        
        // 移除超出屏幕的障碍物
        this.obstacles = this.obstacles.filter(o => o.x + o.width > this.player.x - this.canvas.width);
        
        // 移除超出屏幕的金币
        this.coinsList = this.coinsList.filter(c => c.x > this.player.x - this.canvas.width);
    }
    
    generateObstacle(platform) {
        const obstacleTypes = [
            { type: 'billboard', width: 60, height: 80, color: '#4a4a6a' },
            { type: 'ac', width: 50, height: 40, color: '#5a5a7a' },
            { type: 'bar', width: 80, height: 20, color: '#3a3a5a', low: true },
            { type: 'billboard', width: 50, height: 70, color: '#4a4a6a' }
        ];
        
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const x = platform.x + 50 + Math.random() * (platform.width - 150);
        
        let y;
        if (obstacleType.low) {
            // 低矮横杆，位置在上方
            y = this.player.groundY - 40;
        } else {
            y = this.player.groundY + 60 - obstacleType.height;
        }
        
        this.obstacles.push({
            x: x,
            y: y,
            width: obstacleType.width,
            height: obstacleType.height,
            type: obstacleType.type,
            color: obstacleType.color,
            low: obstacleType.low || false
        });
    }
    
    generateCoins(platform) {
        const coinCount = 3 + Math.floor(Math.random() * 5);
        const startX = platform.x + 100 + Math.random() * (platform.width - 200);
        const y = this.player.groundY - 50 - Math.random() * 80;
        
        for (let i = 0; i < coinCount; i++) {
            this.coinsList.push({
                x: startX + i * 40,
                y: y,
                radius: 12,
                collected: false,
                rotation: 0
            });
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新速度
        if (this.speed < this.maxSpeed) {
            this.speed += this.speedIncrement;
        }
        
        // 更新距离和分数
        this.distance += this.speed * 0.1;
        this.score = this.distance * 10 + this.coins * 100 * this.combo;
        
        // 玩家移动
        this.player.x += this.speed;
        
        // 应用重力
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // 更新下滑状态
        if (this.player.isSliding) {
            this.player.slideTimer--;
            if (this.player.slideTimer <= 0) {
                this.player.isSliding = false;
                this.player.height = 60;
                this.player.y = this.player.groundY;
            }
        }
        
        // 平台碰撞检测
        let onPlatform = false;
        let inGap = false;
        
        for (const platform of this.platforms) {
            if (platform.isGap) {
                // 检查是否在间隙上方
                if (this.player.x + this.player.width > platform.x &&
                    this.player.x < platform.x + platform.width) {
                    inGap = true;
                }
            } else {
                // 检查是否在平台上
                if (this.player.x + this.player.width > platform.x &&
                    this.player.x < platform.x + platform.width) {
                    // 玩家在平台上方
                    if (this.player.y + this.player.height >= platform.y &&
                        this.player.y + this.player.height <= platform.y + 20 &&
                        this.player.velocityY >= 0) {
                        this.player.y = platform.y - this.player.height;
                        this.player.velocityY = 0;
                        this.player.isJumping = false;
                        onPlatform = true;
                    }
                }
            }
        }
        
        // 如果在间隙中且没有在平台上，玩家会掉下去
        if (inGap && !onPlatform) {
            // 玩家在间隙上方时，不做特殊处理，让重力自然下落
        }
        
        // 检查玩家是否掉出屏幕
        if (this.player.y > this.canvas.height) {
            this.gameOver();
            return;
        }
        
        // 障碍物碰撞检测
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(this.player, obstacle)) {
                // 对于低矮横杆，可以通过下滑避开
                if (obstacle.low && this.player.isSliding) {
                    continue;
                }
                
                this.takeDamage(25);
                this.createHitParticles(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2
                );
                
                // 短暂无敌时间
                obstacle.collided = true;
                setTimeout(() => {
                    obstacle.collided = false;
                }, 1000);
                
                // 重置连击
                this.combo = 1;
            }
        }
        
        // 金币收集
        for (const coin of this.coinsList) {
            if (!coin.collected) {
                coin.rotation += 0.1;
                
                // 简单的圆形碰撞检测
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const dx = playerCenterX - coin.x;
                const dy = playerCenterY - coin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < coin.radius + 20) {
                    coin.collected = true;
                    this.coins++;
                    this.combo++;
                    this.createCoinParticles(coin.x, coin.y);
                    
                    // 更新分数显示
                    this.updateScoreDisplay();
                }
            }
        }
        
        // 生成新平台
        this.generatePlatforms();
        
        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.x += p.velocityX;
            p.y += p.velocityY;
            p.velocityY += 0.1;
            p.life--;
            return p.life > 0;
        });
        
        // 更新背景
        for (const bgLayer of this.backgrounds) {
            bgLayer.x -= this.speed * bgLayer.speed * 0.5;
            
            // 循环背景
            for (const building of bgLayer.buildings) {
                building.x -= this.speed * bgLayer.speed * 0.5;
                
                // 如果建筑超出屏幕左边缘，将其移到右边
                if (building.x + building.width < 0) {
                    // 找到最右边的建筑
                    let maxX = 0;
                    for (const b of bgLayer.buildings) {
                        if (b.x + b.width > maxX) {
                            maxX = b.x + b.width;
                        }
                    }
                    building.x = maxX + 20 + Math.random() * 40;
                    
                    // 随机更新窗户灯光
                    for (const window of building.windows) {
                        window.lit = Math.random() > 0.5;
                    }
                }
            }
        }
        
        // 更新UI
        this.updateScoreDisplay();
    }
    
    checkCollision(player, obstacle) {
        if (obstacle.collided) return false;
        
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        // 屏幕震动效果
        this.shakeScreen();
        
        if (this.health <= 0) {
            this.gameOver();
        }
    }
    
    shakeScreen() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('shake');
        setTimeout(() => {
            gameContainer.classList.remove('shake');
        }, 300);
    }
    
    updateScoreDisplay() {
        document.getElementById('scoreValue').textContent = Math.floor(this.score);
        document.getElementById('distanceValue').textContent = Math.floor(this.distance) + 'm';
        document.getElementById('coinsValue').textContent = this.coins;
        document.getElementById('comboValue').textContent = 'x' + this.combo;
    }
    
    updateHealthBar() {
        const healthFill = document.querySelector('.health-fill');
        healthFill.style.width = Math.max(0, this.health) + '%';
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算相机偏移
        const cameraX = this.player.x - this.canvas.width * 0.3;
        
        // 保存状态
        this.ctx.save();
        
        // 绘制星星背景
        this.drawStars();
        
        // 绘制背景建筑物
        this.drawBackgrounds(cameraX);
        
        // 应用相机变换
        this.ctx.translate(-cameraX, 0);
        
        // 绘制平台
        this.drawPlatforms();
        
        // 绘制障碍物
        this.drawObstacles();
        
        // 绘制金币
        this.drawCoins();
        
        // 绘制玩家
        this.drawPlayer();
        
        // 绘制粒子
        this.drawParticles();
        
        // 恢复状态
        this.ctx.restore();
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + this.player.x * 0.1) % this.canvas.width;
            const y = (i * 73) % (this.canvas.height * 0.6);
            const size = (Math.sin(Date.now() * 0.001 + i) + 1) * 1.5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBackgrounds(cameraX) {
        for (let i = this.backgrounds.length - 1; i >= 0; i--) {
            const bgLayer = this.backgrounds[i];
            const alpha = 0.3 + i * 0.2;
            
            for (const building of bgLayer.buildings) {
                // 绘制建筑物主体
                this.ctx.fillStyle = `rgba(${30 + i * 20}, ${30 + i * 20}, ${50 + i * 20}, ${alpha})`;
                this.ctx.fillRect(
                    building.x - cameraX * bgLayer.speed * 0.5,
                    this.canvas.height - building.height,
                    building.width,
                    building.height
                );
                
                // 绘制窗户
                for (const window of building.windows) {
                    if (window.lit) {
                        this.ctx.fillStyle = `rgba(255, 220, 100, ${0.7 * alpha})`;
                    } else {
                        this.ctx.fillStyle = `rgba(50, 50, 70, ${0.5 * alpha})`;
                    }
                    this.ctx.fillRect(
                        building.x + window.x - cameraX * bgLayer.speed * 0.5,
                        this.canvas.height - building.height + window.y,
                        window.width,
                        window.height
                    );
                }
            }
        }
    }
    
    drawPlatforms() {
        for (const platform of this.platforms) {
            if (platform.isGap) {
                // 间隙不绘制
                continue;
            }
            
            // 绘制平台主体
            this.ctx.fillStyle = '#2a2a4a';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // 绘制平台顶部边缘
            this.ctx.fillStyle = '#3a3a5a';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 10);
            
            // 绘制平台纹理
            this.ctx.fillStyle = '#1a1a3a';
            for (let i = 0; i < platform.width; i += 40) {
                this.ctx.fillRect(platform.x + i, platform.y + 15, 2, 5);
            }
        }
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            this.ctx.save();
            
            // 根据类型绘制不同的障碍物
            if (obstacle.type === 'billboard') {
                // 广告牌
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 广告牌边框
                this.ctx.strokeStyle = '#64c8ff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 广告牌内容（简化）
                this.ctx.fillStyle = '#64c8ff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('广告', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                
            } else if (obstacle.type === 'ac') {
                // 空调外机
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 空调细节
                this.ctx.fillStyle = '#4a4a6a';
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 25, obstacle.width - 10, 10);
                
            } else if (obstacle.type === 'bar') {
                // 低矮横杆
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 横杆支架
                this.ctx.fillStyle = '#4a4a6a';
                this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height, 5, 60);
                this.ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height, 5, 60);
            }
            
            this.ctx.restore();
        }
    }
    
    drawCoins() {
        for (const coin of this.coinsList) {
            if (!coin.collected) {
                this.ctx.save();
                this.ctx.translate(coin.x, coin.y);
                
                // 旋转效果
                const scaleX = Math.cos(coin.rotation);
                this.ctx.scale(scaleX, 1);
                
                // 金币主体
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 金币边缘
                this.ctx.strokeStyle = '#ffb700';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 金币符号
                if (Math.abs(scaleX) > 0.3) {
                    this.ctx.fillStyle = '#ffb700';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('$', 0, 0);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // 玩家主体颜色
        const bodyColor = this.player.isSliding ? '#ff6b6b' : '#64c8ff';
        const outlineColor = this.player.isSliding ? '#ff4757' : '#4090ff';
        
        // 绘制玩家
        if (this.player.isSliding) {
            // 下滑状态
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(0, 0, this.player.width + 20, this.player.height);
            
            // 轮廓
            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.player.width + 20, this.player.height);
            
        } else if (this.player.isJumping) {
            // 跳跃状态
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(0, 0, this.player.width, this.player.height);
            
            // 轮廓
            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.player.width, this.player.height);
            
            // 跳跃时的表情（简单的眼睛）
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(10, 15, 5, 0, Math.PI * 2);
            this.ctx.arc(30, 15, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else {
            // 正常奔跑状态
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(0, 0, this.player.width, this.player.height);
            
            // 轮廓
            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.player.width, this.player.height);
            
            // 眼睛
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(10, 15, 5, 0, Math.PI * 2);
            this.ctx.arc(30, 15, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 奔跑动画效果
            const legOffset = Math.sin(Date.now() * 0.01) * 5;
            this.ctx.fillStyle = outlineColor;
            this.ctx.fillRect(5, 50, 10, 10 + legOffset);
            this.ctx.fillRect(25, 50, 10, 10 - legOffset);
        }
        
        this.ctx.restore();
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / 30;
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }
    
    async loadLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();
            
            const leaderboardList = document.getElementById('leaderboardList');
            leaderboardList.innerHTML = '';
            
            if (leaderboard.length === 0) {
                leaderboardList.innerHTML = '<p style="text-align: center; color: #a0a0c0;">暂无记录</p>';
                return;
            }
            
            leaderboard.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                
                let rankColor = '#a0a0c0';
                if (index === 0) rankColor = '#ffd700'; // 金牌
                else if (index === 1) rankColor = '#c0c0c0'; // 银牌
                else if (index === 2) rankColor = '#cd7f32'; // 铜牌
                
                item.innerHTML = `
                    <span class="leaderboard-rank" style="color: ${rankColor}">${index + 1}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score}</span>
                `;
                
                leaderboardList.appendChild(item);
            });
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            document.getElementById('leaderboardList').innerHTML = 
                '<p style="text-align: center; color: #ff6b6b;">加载排行榜失败</p>';
        }
    }
    
    async saveScore() {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('请输入昵称');
            return;
        }
        
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    score: Math.floor(this.score),
                    distance: Math.floor(this.distance),
                    coins: this.coins
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('成绩保存成功！');
                this.loadLeaderboard();
                document.getElementById('saveScoreBtn').disabled = true;
                document.getElementById('saveScoreBtn').textContent = '已保存';
            } else {
                alert('保存失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving score:', error);
            alert('保存失败，请稍后重试');
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new RooftopRunner();
});
