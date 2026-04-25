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
        this.floatingTexts = [];
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 120;
        
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
        // 跳跃粒子 - 更明显的效果
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                velocityX: (Math.random() - 0.5) * 6,
                velocityY: Math.random() * 4 + 2,
                size: 4 + Math.random() * 5,
                color: '#64c8ff',
                glowColor: '#64c8ff',
                life: 40,
                maxLife: 40
            });
        }
        
        // 添加跳跃时的视觉提示 - 玩家颜色变化
        this.player.jumpFlash = 10;
    }
    
    createSlideParticles() {
        // 下滑粒子 - 更明显的效果
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                velocityX: -this.speed + Math.random() * 3 - 2,
                velocityY: -Math.random() * 3 - 1,
                size: 3 + Math.random() * 4,
                color: '#ff6b6b',
                glowColor: '#ff6b6b',
                life: 30,
                maxLife: 30
            });
        }
        
        // 添加下滑时的视觉提示
        this.player.slideFlash = 10;
    }
    
    createCoinParticles(x, y) {
        // 金币收集粒子 - 更明显的效果
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                size: 5 + Math.random() * 6,
                color: '#ffd700',
                glowColor: '#ffd700',
                life: 35,
                maxLife: 35
            });
        }
        
        // 添加额外的星星粒子
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: (Math.random() - 0.5) * 10 - 3,
                size: 3 + Math.random() * 4,
                color: '#ffec8b',
                glowColor: '#ffec8b',
                life: 40,
                maxLife: 40,
                isStar: true
            });
        }
        
        // 添加金币收集时的视觉提示
        this.coinFlash = 15;
        
        // 添加浮动文本显示获得的分数
        this.createFloatingText(x, y, '+' + (100 * this.combo), '#ffd700');
    }
    
    createFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 60,
            maxLife: 60,
            velocityY: -2
        });
    }
    
    createHitParticles(x, y) {
        // 受击粒子 - 更强烈的效果
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 12,
                velocityY: (Math.random() - 0.5) * 12,
                size: 5 + Math.random() * 8,
                color: '#ff4757',
                glowColor: '#ff4757',
                life: 40,
                maxLife: 40
            });
        }
        
        // 添加额外的警告粒子
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 15,
                velocityY: (Math.random() - 0.5) * 15,
                size: 3 + Math.random() * 5,
                color: '#ff6348',
                glowColor: '#ff6348',
                life: 35,
                maxLife: 35
            });
        }
        
        // 添加受击时的视觉提示
        this.player.hitFlash = 20;
        this.screenShake = 15;
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
            { type: 'billboard', width: 60, height: 80, color: '#ff4757', glowColor: '#ff6b6b' },
            { type: 'ac', width: 50, height: 40, color: '#ff6348', glowColor: '#ff7f50' },
            { type: 'bar', width: 80, height: 20, color: '#ff4757', glowColor: '#ff6b6b', low: true },
            { type: 'billboard', width: 50, height: 70, color: '#ff4757', glowColor: '#ff6b6b' }
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
        
        // 更新视觉提示变量
        if (this.player.jumpFlash && this.player.jumpFlash > 0) {
            this.player.jumpFlash--;
        }
        if (this.player.slideFlash && this.player.slideFlash > 0) {
            this.player.slideFlash--;
        }
        if (this.player.hitFlash && this.player.hitFlash > 0) {
            this.player.hitFlash--;
        }
        if (this.coinFlash && this.coinFlash > 0) {
            this.coinFlash--;
        }
        if (this.screenShake && this.screenShake > 0) {
            this.screenShake--;
        }
        
        // 更新无敌时间
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        // 更新浮动文本
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.y += ft.velocityY;
            ft.life--;
            return ft.life > 0;
        });
        
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
                
                // 如果在无敌状态，不造成伤害
                if (this.invincible) {
                    continue;
                }
                
                this.takeDamage(25);
                this.createHitParticles(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2
                );
                
                // 启动无敌时间
                this.invincible = true;
                this.invincibleTimer = this.invincibleDuration;
                
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
        
        // 应用屏幕震动效果
        if (this.screenShake && this.screenShake > 0) {
            const shakeIntensity = this.screenShake * 0.5;
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
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
        
        // 绘制金币收集时的全屏闪光效果
        if (this.coinFlash && this.coinFlash > 0) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
            const alpha = this.coinFlash / 15 * 0.3;
            this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        // 恢复状态
        this.ctx.restore();
        
        // 绘制浮动文本
        this.drawFloatingTexts();
        
        // 绘制无敌状态提示
        this.drawInvincibleUI();
    }
    
    drawFloatingTexts() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换到屏幕坐标
        
        // 将所有浮动文本累积显示在右上角，避免遮挡游戏画面
        let textOffsetY = 0;
        
        for (const ft of this.floatingTexts) {
            const alpha = ft.life / ft.maxLife;
            const fadeOutStart = ft.maxLife * 0.3; // 最后30%时间开始淡出
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 3;
            
            // 显示在屏幕右上角，靠近UI区域
            const screenX = this.canvas.width - 30;
            const screenY = 120 + textOffsetY;
            
            // 向上飘动效果
            const floatOffset = (ft.maxLife - ft.life) * 0.5;
            
            this.ctx.fillText(ft.text, screenX, screenY - floatOffset);
            
            // 每个文本之间有间隔
            textOffsetY += 30;
        }
        
        this.ctx.restore();
    }
    
    drawInvincibleUI() {
        if (this.invincible && this.gameState === 'playing') {
            this.ctx.save();
            
            // 计算无敌时间剩余百分比
            const remainingPercent = this.invincibleTimer / this.invincibleDuration;
            
            // 在屏幕左上角显示无敌状态提示，靠近现有UI，不遮挡游戏画面
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
            
            // 显示在左上角，靠近分数显示
            const posX = 30;
            const posY = this.canvas.height < 500 ? 80 : 110; // 根据屏幕高度调整
            
            // 显示恢复提示
            if (this.invincibleTimer < 30) {
                // 即将恢复时显示更明显的提示
                const flashAlpha = this.invincibleTimer % 6 < 3 ? 0.9 : 0.5;
                this.ctx.globalAlpha = flashAlpha;
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText('恢复中...', posX, posY);
                
                // 显示倒计时（小一点）
                const countdown = Math.ceil(this.invincibleTimer / 60);
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(countdown > 0 ? countdown + 's' : '!', posX + 70, posY);
            } else {
                // 正常无敌状态显示 - 小而不显眼
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'left';
                
                // 绘制小型无敌时间进度条
                const barWidth = 80;
                const barHeight = 6;
                const barX = posX;
                const barY = posY;
                
                // 背景
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
                
                // 进度条
                this.ctx.fillStyle = '#64c8ff';
                this.ctx.fillRect(barX, barY, barWidth * remainingPercent, barHeight);
                
                // 文字提示（小一点）
                this.ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.fillText('无敌', barX + barWidth + 8, barY + 5);
            }
            
            this.ctx.restore();
        }
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
            const alpha = 0.2 + i * 0.1;
            
            for (const building of bgLayer.buildings) {
                // 绘制建筑物主体 - 使用更暗的颜色，与前景区分开
                const baseGray = 15 + i * 10;
                this.ctx.fillStyle = `rgba(${baseGray}, ${baseGray}, ${baseGray + 10}, ${alpha})`;
                this.ctx.fillRect(
                    building.x - cameraX * bgLayer.speed * 0.5,
                    this.canvas.height - building.height,
                    building.width,
                    building.height
                );
                
                // 绘制建筑物轮廓
                this.ctx.strokeStyle = `rgba(${baseGray + 20}, ${baseGray + 20}, ${baseGray + 30}, ${alpha * 0.5})`;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    building.x - cameraX * bgLayer.speed * 0.5,
                    this.canvas.height - building.height,
                    building.width,
                    building.height
                );
                
                // 绘制窗户 - 使用更柔和的颜色
                for (const window of building.windows) {
                    if (window.lit) {
                        // 亮窗户 - 使用柔和的暖黄色
                        this.ctx.fillStyle = `rgba(255, 240, 200, ${0.5 * alpha})`;
                        // 添加微弱的发光效果
                        this.ctx.shadowColor = 'rgba(255, 240, 200, 0.3)';
                        this.ctx.shadowBlur = 5;
                    } else {
                        // 暗窗户 - 使用非常暗的颜色
                        this.ctx.fillStyle = `rgba(20, 20, 30, ${0.3 * alpha})`;
                        this.ctx.shadowBlur = 0;
                    }
                    this.ctx.fillRect(
                        building.x + window.x - cameraX * bgLayer.speed * 0.5,
                        this.canvas.height - building.height + window.y,
                        window.width,
                        window.height
                    );
                    this.ctx.shadowBlur = 0;
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
            
            // 绘制平台主体 - 使用更暗的中性色，与障碍物区分开
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // 绘制平台顶部边缘 - 使用稍微亮一点的颜色
            this.ctx.fillStyle = '#16213e';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 15);
            
            // 绘制平台纹理 - 更明显的标记
            this.ctx.fillStyle = '#0f3460';
            for (let i = 0; i < platform.width; i += 60) {
                // 绘制水平线
                this.ctx.fillRect(platform.x + i, platform.y + 20, 40, 3);
                // 绘制垂直线
                this.ctx.fillRect(platform.x + i + 20, platform.y + 25, 3, 10);
            }
            
            // 平台边缘高光
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
        }
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            this.ctx.save();
            
            // 计算障碍物与玩家的距离，用于接近警告效果
            const distanceToPlayer = obstacle.x - this.player.x;
            let glowIntensity = 15;
            let warningAlpha = 0;
            
            // 当障碍物接近时，增加发光强度并显示警告
            if (distanceToPlayer > 0 && distanceToPlayer < 400) {
                glowIntensity = 15 + (400 - distanceToPlayer) / 400 * 20;
                warningAlpha = (400 - distanceToPlayer) / 400 * 0.6;
                
                // 对于低矮横杆，添加特殊的下滑提示
                if (obstacle.low && distanceToPlayer < 300) {
                    // 在障碍物上方显示下滑提示
                    this.ctx.save();
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
                    
                    const screenX = obstacle.x - this.player.x + this.canvas.width * 0.3;
                    const screenY = obstacle.y - 60;
                    
                    if (screenX > 0 && screenX < this.canvas.width) {
                        this.ctx.fillStyle = `rgba(255, 107, 107, ${warningAlpha})`;
                        this.ctx.font = 'bold 20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('⬇ 下滑!', screenX, screenY);
                    }
                    this.ctx.restore();
                }
            }
            
            // 添加发光效果 - 根据距离调整
            this.ctx.shadowColor = obstacle.glowColor || '#ff6b6b';
            this.ctx.shadowBlur = glowIntensity;
            
            // 添加接近警告边框
            if (warningAlpha > 0) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${warningAlpha})`;
                this.ctx.lineWidth = 3 + warningAlpha * 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.strokeRect(
                    obstacle.x - 10,
                    obstacle.y - 10,
                    obstacle.width + 20,
                    obstacle.height + 20
                );
                this.ctx.setLineDash([]);
            }
            
            // 根据类型绘制不同的障碍物
            if (obstacle.type === 'billboard') {
                // 广告牌
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 广告牌边框
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 警告符号
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⚠', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                
            } else if (obstacle.type === 'ac') {
                // 空调外机
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 空调边框
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 空调细节
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 8);
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 25, obstacle.width - 10, 8);
                
                // 警告标记
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('!', obstacle.x + obstacle.width / 2, obstacle.y + 17);
                
            } else if (obstacle.type === 'bar') {
                // 低矮横杆
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 横杆边框
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 横杆支架
                this.ctx.fillStyle = '#ff6348';
                this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height, 5, 60);
                this.ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height, 5, 60);
                
                // 支架边框
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.strokeRect(obstacle.x, obstacle.y + obstacle.height, 5, 60);
                this.ctx.strokeRect(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height, 5, 60);
                
                // 横杆上的警告条纹
                this.ctx.fillStyle = '#ffffff';
                for (let i = 0; i < obstacle.width; i += 20) {
                    this.ctx.fillRect(obstacle.x + i, obstacle.y + 5, 10, 10);
                }
            }
            
            this.ctx.restore();
        }
    }
    
    drawCoins() {
        for (const coin of this.coinsList) {
            if (!coin.collected) {
                this.ctx.save();
                this.ctx.translate(coin.x, coin.y);
                
                // 添加强烈的发光效果
                this.ctx.shadowColor = '#ffd700';
                this.ctx.shadowBlur = 20;
                
                // 旋转效果
                const scaleX = Math.cos(coin.rotation);
                this.ctx.scale(scaleX, 1);
                
                // 金币主体 - 使用更亮的金色
                this.ctx.fillStyle = '#ffec8b';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 金币内部渐变
                const gradient = this.ctx.createRadialGradient(
                    -coin.radius * 0.3, -coin.radius * 0.3, 0,
                    0, 0, coin.radius
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#ffec8b');
                gradient.addColorStop(1, '#ffd700');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius - 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 金币边缘
                this.ctx.strokeStyle = '#ffb700';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                // 金币符号 - 使用更明显的颜色
                if (Math.abs(scaleX) > 0.3) {
                    this.ctx.fillStyle = '#ff8c00';
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('★', 0, 0);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // 玩家主体颜色
        let bodyColor = this.player.isSliding ? '#ff6b6b' : '#64c8ff';
        let outlineColor = this.player.isSliding ? '#ff4757' : '#4090ff';
        let glowIntensity = 0;
        let playerAlpha = 1;
        
        // 处理无敌状态
        if (this.invincible) {
            // 无敌状态闪烁 - 透明度变化
            if (this.invincibleTimer < 30) {
                // 即将结束时快速闪烁
                playerAlpha = this.invincibleTimer % 6 < 3 ? 0.4 : 1;
            } else {
                // 正常无敌状态
                playerAlpha = this.invincibleTimer % 10 < 5 ? 0.6 : 1;
            }
            
            // 无敌光环
            this.ctx.save();
            this.ctx.globalAlpha = 0.3 * (1 - this.invincibleTimer / this.invincibleDuration);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            const radius = Math.max(this.player.width, this.player.height) + 10;
            this.ctx.arc(this.player.width / 2, this.player.height / 2, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        // 应用透明度
        this.ctx.globalAlpha = playerAlpha;
        
        // 处理闪烁效果
        if (this.player.hitFlash && this.player.hitFlash > 0) {
            // 受击闪烁 - 白色/红色交替
            if (this.player.hitFlash % 4 < 2) {
                bodyColor = '#ffffff';
                outlineColor = '#ff4757';
            }
            glowIntensity = 20;
        } else if (this.player.jumpFlash && this.player.jumpFlash > 0) {
            // 跳跃闪烁 - 蓝色增强
            glowIntensity = 15;
        } else if (this.player.slideFlash && this.player.slideFlash > 0) {
            // 下滑闪烁 - 红色增强
            glowIntensity = 15;
        }
        
        // 添加发光效果
        if (glowIntensity > 0) {
            this.ctx.shadowColor = outlineColor;
            this.ctx.shadowBlur = glowIntensity;
        }
        
        // 绘制玩家
        if (this.player.isSliding) {
            // 下滑状态 - 更明显的视觉效果
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(0, 0, this.player.width + 20, this.player.height);
            
            // 轮廓
            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(0, 0, this.player.width + 20, this.player.height);
            
            // 下滑时的表情 - 眼睛眯起
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(8, 10, 8, 3);
            this.ctx.fillRect(24, 10, 8, 3);
            
        } else if (this.player.isJumping) {
            // 跳跃状态 - 更明显的视觉效果
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(0, 0, this.player.width, this.player.height);
            
            // 轮廓
            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(0, 0, this.player.width, this.player.height);
            
            // 跳跃时的表情 - 眼睛睁大
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(10, 15, 6, 0, Math.PI * 2);
            this.ctx.arc(30, 15, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 瞳孔
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(12, 15, 2, 0, Math.PI * 2);
            this.ctx.arc(32, 15, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else {
            // 正常奔跑状态
            this.ctx.fillStyle = bodyColor;
            this.ctx.fillRect(0, 0, this.player.width, this.player.height);
            
            // 轮廓
            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(0, 0, this.player.width, this.player.height);
            
            // 眼睛
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(10, 15, 5, 0, Math.PI * 2);
            this.ctx.arc(30, 15, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 瞳孔
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(11, 15, 2, 0, Math.PI * 2);
            this.ctx.arc(31, 15, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 奔跑动画效果
            const legOffset = Math.sin(Date.now() * 0.015) * 8;
            this.ctx.fillStyle = outlineColor;
            this.ctx.fillRect(5, 50, 12, 12 + legOffset);
            this.ctx.fillRect(23, 50, 12, 12 - legOffset);
        }
        
        // 清除发光效果
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / (particle.maxLife || 30);
            const size = particle.size * (0.5 + alpha * 0.5);
            
            this.ctx.save();
            
            // 添加发光效果
            if (particle.glowColor) {
                this.ctx.shadowColor = particle.glowColor;
                this.ctx.shadowBlur = 15 * alpha;
            }
            
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = alpha;
            
            if (particle.isStar) {
                // 绘制星星形状
                this.drawStar(particle.x, particle.y, 5, size, size / 2);
            } else {
                // 绘制圆形
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.globalAlpha = 1;
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        }
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
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
