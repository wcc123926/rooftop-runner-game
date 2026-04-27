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
        
        this.silverCoins = 0;
        this.energyFragments = 0;
        this.rewardProgress = 0;
        this.rewardProgressMax = 100;
        this.rewardModeActive = false;
        this.rewardModeTimer = 0;
        this.rewardModeDuration = 1200;
        this.rewardModeCount = 0;
        this.rewardPatterns = [];
        
        this.currentCombo = 0;
        this.maxCombo = 0;
        
        this.normalCoins = 0;
        this.normalSilverCoins = 0;
        this.normalEnergyFragments = 0;
        this.rewardCoins = 0;
        this.rewardSilverCoins = 0;
        this.rewardEnergyFragments = 0;
        
        this.lastCollectTime = 0;
        this.comboTimeout = 60;
        
        this.player = {
            x: 100,
            y: 0,
            width: 40,
            height: 60,
            velocityY: 0,
            velocityX: 0,
            isJumping: false,
            jumpCount: 0,
            maxJumps: 2,
            isSliding: false,
            slideHold: false,
            slideTimer: 0,
            slideDuration: 30,
            groundY: 0
        };
        
        this.platforms = [];
        this.obstacles = [];
        this.coinsList = [];
        this.silverCoinsList = [];
        this.energyFragmentsList = [];
        this.powerUps = [];
        this.particles = [];
        this.backgrounds = [];
        this.floatingTexts = [];
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 120;
        
        // 道具状态
        this.powerUpActive = {
            shield: false,
            magnet: false,
            speedBoots: false
        };
        this.powerUpTimers = {
            shield: 0,
            magnet: 0,
            speedBoots: 0
        };
        this.powerUpDurations = {
            shield: 600,
            magnet: 600,
            speedBoots: 600
        };
        
        // 小目标系统
        this.currentGoal = null;
        this.goalProgress = 0;
        this.goalTypes = ['coins', 'distance', 'dodge'];
        this.consecutiveDodges = 0;
        this.obstaclesPassed = [];
        
        // 加速鞋的速度加成
        this.speedMultiplier = 1;
        this.baseSpeedMultiplier = 1;
        
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
            silverCoins: 0,
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
                this.player.slideHold = true;
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
                this.player.slideHold = false;
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
            this.player.slideHold = true;
            if (this.gameState === 'playing') {
                this.slide();
            }
        });
        
        slideBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.player.slideHold = true;
            if (this.gameState === 'playing') {
                this.slide();
            }
        });
        
        slideBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.player.slideHold = false;
        });
        
        slideBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.player.slideHold = false;
        });
        
        slideBtn.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            this.player.slideHold = false;
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
        this.silverCoins = 0;
        this.energyFragments = 0;
        this.rewardProgress = 0;
        this.rewardModeActive = false;
        this.rewardModeTimer = 0;
        this.rewardModeCount = 0;
        this.rewardPatterns = [];
        this.combo = 1;
        this.health = 100;
        this.speed = this.baseSpeed;
        
        this.currentCombo = 0;
        this.maxCombo = 0;
        
        this.normalCoins = 0;
        this.normalSilverCoins = 0;
        this.normalEnergyFragments = 0;
        this.rewardCoins = 0;
        this.rewardSilverCoins = 0;
        this.rewardEnergyFragments = 0;
        
        this.lastCollectTime = 0;
        
        this.player.y = this.player.groundY;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.jumpCount = 0;
        this.player.isSliding = false;
        this.player.slideHold = false;
        this.player.slideTimer = 0;
        this.player.height = 60;
        
        this.platforms = [];
        this.obstacles = [];
        this.coinsList = [];
        this.silverCoinsList = [];
        this.energyFragmentsList = [];
        this.powerUps = [];
        this.particles = [];
        this.lastPlatformX = 0;
        
        // 重置道具状态
        this.powerUpActive = {
            shield: false,
            magnet: false,
            speedBoots: false
        };
        this.powerUpTimers = {
            shield: 0,
            magnet: 0,
            speedBoots: 0
        };
        this.speedMultiplier = 1;
        
        // 重置小目标系统
        this.consecutiveDodges = 0;
        this.obstaclesPassed = [];
        this.generateGoal();
        
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
    
    generateGoal() {
        const goalType = this.goalTypes[Math.floor(Math.random() * this.goalTypes.length)];
        let target, description;
        
        switch(goalType) {
            case 'coins':
                target = 5 + Math.floor(Math.random() * 10);
                description = `收集 ${target} 个金币`;
                break;
            case 'distance':
                target = 500 + Math.floor(Math.random() * 500);
                description = `跑到 ${target} 米`;
                break;
            case 'dodge':
                target = 3 + Math.floor(Math.random() * 4);
                description = `连续躲过 ${target} 个障碍`;
                break;
        }
        
        this.currentGoal = {
            type: goalType,
            target: target,
            description: description,
            completed: false
        };
        this.goalProgress = 0;
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
        
        const normalScore = this.normalCoins * 100 + this.normalSilverCoins * 50 + this.normalEnergyFragments * 25;
        const rewardScore = this.rewardCoins * 100 + this.rewardSilverCoins * 50 + this.rewardEnergyFragments * 25;
        const distanceScore = Math.floor(this.distance * 10);
        
        // 更新最终分数
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('finalDistance').textContent = Math.floor(this.distance);
        
        // 更新详细统计
        document.getElementById('normalCoins').textContent = this.normalCoins;
        document.getElementById('normalSilverCoins').textContent = this.normalSilverCoins;
        document.getElementById('normalEnergyFragments').textContent = this.normalEnergyFragments;
        document.getElementById('normalScore').textContent = normalScore;
        
        document.getElementById('rewardCoins').textContent = this.rewardCoins;
        document.getElementById('rewardSilverCoins').textContent = this.rewardSilverCoins;
        document.getElementById('rewardEnergyFragments').textContent = this.rewardEnergyFragments;
        document.getElementById('rewardScore').textContent = rewardScore;
        
        document.getElementById('rewardModeCount').textContent = this.rewardModeCount;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        document.getElementById('distanceScore').textContent = distanceScore;
        
        // 更新小目标完成情况
        if (this.currentGoal) {
            const goalStatusEl = document.getElementById('goalStatus');
            const goalDescriptionEl = document.getElementById('goalDescription');
            const goalResultEl = document.getElementById('goalResult');
            
            goalStatusEl.style.display = 'block';
            goalDescriptionEl.textContent = this.currentGoal.description;
            
            if (this.currentGoal.completed) {
                goalResultEl.textContent = '✓ 完成!';
                goalResultEl.style.color = '#00ff00';
            } else {
                goalResultEl.textContent = '✗ 未完成';
                goalResultEl.style.color = '#ff6b6b';
            }
        }
        
        // 加载排行榜
        this.loadLeaderboard();
    }
    
    jump() {
        if (!this.player.isSliding && this.player.jumpCount < this.player.maxJumps) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.jumpCount++;
            this.createJumpParticles();
            
            if (this.player.jumpCount === 2) {
                this.createDoubleJumpParticles();
            }
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
    
    createDoubleJumpParticles() {
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: Math.random() * 6 + 1,
                size: 5 + Math.random() * 6,
                color: '#a0d8ff',
                glowColor: '#a0d8ff',
                life: 45,
                maxLife: 45
            });
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
    
    createSilverCoinParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 7,
                velocityY: (Math.random() - 0.5) * 7,
                size: 4 + Math.random() * 5,
                color: '#c0c0c0',
                glowColor: '#c0c0c0',
                life: 30,
                maxLife: 30
            });
        }
        
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8 - 2,
                size: 2 + Math.random() * 3,
                color: '#e8e8e8',
                glowColor: '#e8e8e8',
                life: 35,
                maxLife: 35,
                isStar: true
            });
        }
        
        this.silverCoinFlash = 10;
        this.createFloatingText(x, y, '+' + (50 * this.combo), '#c0c0c0');
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
            
            if (this.rewardModeActive) {
                // 奖励模式：只生成连续平坦的跑道，没有坑洞
                const platformWidth = 800; // 奖励模式下用大的连续平台
                this.platforms.push({
                    x: this.lastPlatformX,
                    y: this.player.groundY + 60,
                    width: platformWidth,
                    height: 150,
                    isGap: false,
                    isRewardModePlatform: true
                });
                this.lastPlatformX += platformWidth;
                // 奖励模式下不生成障碍和普通收集物
            } else {
                // 普通模式：生成包含坑洞的平台
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
                
                // 生成银币
                if (Math.random() < 0.6) {
                    this.generateSilverCoins(platform);
                }
                
                // 生成能量碎片
                if (Math.random() < 0.4) {
                    this.generateEnergyFragments(platform);
                }
                
                // 生成道具
                if (Math.random() < 0.2) {
                    this.generatePowerUp(platform);
                }
            }
        }
        
        // 移除超出屏幕的平台
        this.platforms = this.platforms.filter(p => p.x + p.width > this.player.x - this.canvas.width);
        
        // 移除超出屏幕的障碍物（奖励模式时不移除，因为不生成新的）
        if (!this.rewardModeActive) {
            this.obstacles = this.obstacles.filter(o => o.x + o.width > this.player.x - this.canvas.width);
        }
        
        // 移除超出屏幕的金币
        this.coinsList = this.coinsList.filter(c => c.x > this.player.x - this.canvas.width);
        
        // 移除超出屏幕的银币
        this.silverCoinsList = this.silverCoinsList.filter(c => c.x > this.player.x - this.canvas.width);
        
        // 移除超出屏幕的能量碎片
        this.energyFragmentsList = this.energyFragmentsList.filter(c => c.x > this.player.x - this.canvas.width);
        
        // 移除超出屏幕的道具
        this.powerUps = this.powerUps.filter(p => p.x > this.player.x - this.canvas.width);
    }
    
    generatePowerUp(platform) {
        const powerUpTypes = [
            { type: 'shield', name: '护盾', color: '#00ff00', glowColor: '#00ff00' },
            { type: 'magnet', name: '磁铁', color: '#ff00ff', glowColor: '#ff00ff' },
            { type: 'speedBoots', name: '加速鞋', color: '#00ffff', glowColor: '#00ffff' }
        ];
        
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const x = platform.x + 100 + Math.random() * (platform.width - 200);
        const y = this.player.groundY - 80 - Math.random() * 50;
        
        this.powerUps.push({
            x: x,
            y: y,
            radius: 18,
            type: powerUpType.type,
            name: powerUpType.name,
            color: powerUpType.color,
            glowColor: powerUpType.glowColor,
            collected: false,
            rotation: 0,
            bobOffset: Math.random() * Math.PI * 2
        });
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
    
    generateSilverCoins(platform) {
        const coinCount = 4 + Math.floor(Math.random() * 6);
        const startX = platform.x + 80 + Math.random() * (platform.width - 160);
        const y = this.player.groundY - 40 - Math.random() * 70;
        
        for (let i = 0; i < coinCount; i++) {
            this.silverCoinsList.push({
                x: startX + i * 35,
                y: y,
                radius: 10,
                collected: false,
                rotation: 0
            });
        }
    }
    
    generateEnergyFragments(platform) {
        const fragmentCount = 2 + Math.floor(Math.random() * 4);
        const startX = platform.x + 120 + Math.random() * (platform.width - 240);
        const y = this.player.groundY - 60 - Math.random() * 100;
        
        for (let i = 0; i < fragmentCount; i++) {
            this.energyFragmentsList.push({
                x: startX + i * 45,
                y: y + Math.sin(i) * 20,
                radius: 15,
                collected: false,
                rotation: 0,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    createEnergyFragmentParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 9,
                velocityY: (Math.random() - 0.5) * 9,
                size: 5 + Math.random() * 6,
                color: '#9b59b6',
                glowColor: '#9b59b6',
                life: 40,
                maxLife: 40
            });
        }
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 11,
                velocityY: (Math.random() - 0.5) * 11 - 4,
                size: 3 + Math.random() * 4,
                color: '#e8daef',
                glowColor: '#e8daef',
                life: 45,
                maxLife: 45,
                isStar: true
            });
        }
        
        this.energyFragmentFlash = 12;
        this.createFloatingText(x, y, '+' + (25 * this.combo), '#9b59b6');
    }
    
    updateCombo() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastCollectTime < this.comboTimeout * 16.67) {
            this.currentCombo++;
            if (this.currentCombo > this.maxCombo) {
                this.maxCombo = this.currentCombo;
            }
        } else {
            this.currentCombo = 1;
        }
        
        this.lastCollectTime = currentTime;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新道具计时器
        this.updatePowerUpTimers();
        
        // 计算实际速度（包含加速鞋加成）
        const effectiveSpeed = this.speed * this.speedMultiplier;
        
        // 更新速度
        if (this.speed < this.maxSpeed) {
            this.speed += this.speedIncrement;
        }
        
        // 更新奖励模式计时器
        if (this.rewardModeActive) {
            this.rewardModeTimer--;
            if (this.rewardModeTimer <= 0) {
                this.endRewardMode();
            }
        }
        
        // 更新距离和分数
        this.distance += effectiveSpeed * 0.1;
        this.score = this.distance * 10 + this.coins * 100 * this.combo + this.silverCoins * 50 * this.combo + this.energyFragments * 25 * this.combo;
        
        // 更新小目标进度
        this.updateGoalProgress();
        
        // 磁铁效果 - 吸引金币、银币和能量碎片
        if (this.powerUpActive.magnet) {
            this.attractCoins();
            this.attractSilverCoins();
            this.attractEnergyFragments();
        }
        
        // 玩家移动
        this.player.x += effectiveSpeed;
        
        // 应用重力
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // 更新下滑状态
        if (this.player.isSliding) {
            if (this.player.slideHold && !this.player.isJumping) {
                // 如果按住下滑键且不在跳跃中，重置下滑计时器
                this.player.slideTimer = this.player.slideDuration;
            } else if (!this.player.slideHold && !this.player.isJumping) {
                // 如果松开下滑键且不在跳跃中，立即结束滑行
                this.player.isSliding = false;
                this.player.height = 60;
                this.player.y = this.player.groundY;
                this.player.slideTimer = 0;
            } else {
                // 在跳跃中滑行，等待落地或松开
                this.player.slideTimer--;
                if (this.player.slideTimer <= 0) {
                    this.player.isSliding = false;
                    this.player.height = 60;
                }
            }
        } else if (this.player.slideHold && !this.player.isJumping && this.player.jumpCount === 0) {
            // 如果按住下滑键且在地面上，开始滑行
            this.slide();
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
                        this.player.jumpCount = 0;
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
        
        // 障碍物碰撞检测和躲避计数
        for (const obstacle of this.obstacles) {
            const distanceToPlayer = obstacle.x - this.player.x;
            
            // 检查障碍物是否已经被玩家通过（用于躲避计数）
            if (distanceToPlayer < -obstacle.width && !this.obstaclesPassed.includes(obstacle)) {
                // 玩家成功躲过了这个障碍物
                this.obstaclesPassed.push(obstacle);
                
                // 检查是否是成功躲避（没有碰撞）
                // 如果障碍物没有被标记为collided，说明成功躲避
                if (!obstacle.collided) {
                    if (this.currentGoal && this.currentGoal.type === 'dodge' && !this.currentGoal.completed) {
                        this.consecutiveDodges++;
                        this.goalProgress = this.consecutiveDodges;
                        
                        if (this.consecutiveDodges >= this.currentGoal.target) {
                            this.currentGoal.completed = true;
                            this.createFloatingText(
                                this.player.x + this.player.width / 2,
                                this.player.y - 50,
                                '目标完成!',
                                '#00ff00'
                            );
                        }
                    }
                }
            }
            
            if (this.checkCollision(this.player, obstacle)) {
                // 对于低矮横杆，可以通过下滑避开
                if (obstacle.low && this.player.isSliding) {
                    continue;
                }
                
                // 标记为已碰撞
                obstacle.collided = true;
                
                // 重置连续躲避计数
                this.consecutiveDodges = 0;
                if (this.currentGoal && this.currentGoal.type === 'dodge') {
                    this.goalProgress = 0;
                }
                
                // 如果有护盾，消耗护盾而不是受伤
                if (this.powerUpActive.shield) {
                    this.powerUpActive.shield = false;
                    this.powerUpTimers.shield = 0;
                    this.createFloatingText(
                        this.player.x + this.player.width / 2,
                        this.player.y - 50,
                        '护盾抵挡!',
                        '#00ff00'
                    );
                    this.createHitParticles(
                        this.player.x + this.player.width / 2,
                        this.player.y + this.player.height / 2
                    );
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
                    this.updateCombo();
                    
                    if (this.rewardModeActive) {
                        this.rewardCoins++;
                    } else {
                        this.normalCoins++;
                    }
                    
                    this.createCoinParticles(coin.x, coin.y);
                    
                    // 更新小目标进度（金币收集）
                    if (this.currentGoal && this.currentGoal.type === 'coins' && !this.currentGoal.completed) {
                        this.goalProgress++;
                        if (this.goalProgress >= this.currentGoal.target) {
                            this.currentGoal.completed = true;
                            this.createFloatingText(
                                this.player.x + this.player.width / 2,
                                this.player.y - 50,
                                '目标完成!',
                                '#00ff00'
                            );
                        }
                    }
                    
                    // 更新奖励进度
                    if (!this.rewardModeActive) {
                        this.updateRewardProgress(10);
                    }
                    
                    // 更新分数显示
                    this.updateScoreDisplay();
                }
            }
        }
        
        // 银币收集
        for (const coin of this.silverCoinsList) {
            if (!coin.collected) {
                coin.rotation += 0.12;
                
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const dx = playerCenterX - coin.x;
                const dy = playerCenterY - coin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < coin.radius + 18) {
                    coin.collected = true;
                    this.silverCoins++;
                    this.combo++;
                    this.updateCombo();
                    
                    if (this.rewardModeActive) {
                        this.rewardSilverCoins++;
                    } else {
                        this.normalSilverCoins++;
                    }
                    
                    this.createSilverCoinParticles(coin.x, coin.y);
                    
                    // 更新小目标进度（金币收集也包含银币）
                    if (this.currentGoal && this.currentGoal.type === 'coins' && !this.currentGoal.completed) {
                        this.goalProgress++;
                        if (this.goalProgress >= this.currentGoal.target) {
                            this.currentGoal.completed = true;
                            this.createFloatingText(
                                this.player.x + this.player.width / 2,
                                this.player.y - 50,
                                '目标完成!',
                                '#00ff00'
                            );
                        }
                    }
                    
                    // 更新奖励进度
                    if (!this.rewardModeActive) {
                        this.updateRewardProgress(5);
                    }
                    
                    // 更新分数显示
                    this.updateScoreDisplay();
                }
            }
        }
        
        // 能量碎片收集
        for (const fragment of this.energyFragmentsList) {
            if (!fragment.collected) {
                fragment.rotation += 0.08;
                
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const dx = playerCenterX - fragment.x;
                const dy = playerCenterY - fragment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < fragment.radius + 22) {
                    fragment.collected = true;
                    this.energyFragments++;
                    this.combo++;
                    this.updateCombo();
                    
                    if (this.rewardModeActive) {
                        this.rewardEnergyFragments++;
                    } else {
                        this.normalEnergyFragments++;
                    }
                    
                    this.createEnergyFragmentParticles(fragment.x, fragment.y);
                    
                    // 更新小目标进度（金币收集也包含能量碎片）
                    if (this.currentGoal && this.currentGoal.type === 'coins' && !this.currentGoal.completed) {
                        this.goalProgress++;
                        if (this.goalProgress >= this.currentGoal.target) {
                            this.currentGoal.completed = true;
                            this.createFloatingText(
                                this.player.x + this.player.width / 2,
                                this.player.y - 50,
                                '目标完成!',
                                '#00ff00'
                            );
                        }
                    }
                    
                    // 更新奖励进度
                    if (!this.rewardModeActive) {
                        this.updateRewardProgress(8);
                    }
                    
                    // 更新分数显示
                    this.updateScoreDisplay();
                }
            }
        }
        
        // 奖励模式图案收集
        if (this.rewardModeActive) {
            this.collectRewardPatterns();
        }
        
        // 道具收集
        for (const powerUp of this.powerUps) {
            if (!powerUp.collected) {
                powerUp.rotation += 0.05;
                
                // 简单的圆形碰撞检测
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const dx = playerCenterX - powerUp.x;
                const dy = playerCenterY - powerUp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < powerUp.radius + 25) {
                    powerUp.collected = true;
                    this.collectPowerUp(powerUp);
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
            bgLayer.x -= effectiveSpeed * bgLayer.speed * 0.5;
            
            // 循环背景
            for (const building of bgLayer.buildings) {
                building.x -= effectiveSpeed * bgLayer.speed * 0.5;
                
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
    
    updatePowerUpTimers() {
        // 护盾
        if (this.powerUpActive.shield && this.powerUpTimers.shield > 0) {
            this.powerUpTimers.shield--;
            if (this.powerUpTimers.shield <= 0) {
                this.powerUpActive.shield = false;
            }
        }
        
        // 磁铁
        if (this.powerUpActive.magnet && this.powerUpTimers.magnet > 0) {
            this.powerUpTimers.magnet--;
            if (this.powerUpTimers.magnet <= 0) {
                this.powerUpActive.magnet = false;
            }
        }
        
        // 加速鞋
        if (this.powerUpActive.speedBoots && this.powerUpTimers.speedBoots > 0) {
            this.powerUpTimers.speedBoots--;
            if (this.powerUpTimers.speedBoots <= 0) {
                this.powerUpActive.speedBoots = false;
                this.speedMultiplier = 1;
            }
        }
    }
    
    updateGoalProgress() {
        if (!this.currentGoal || this.currentGoal.completed) return;
        
        if (this.currentGoal.type === 'distance') {
            this.goalProgress = Math.floor(this.distance);
            if (this.goalProgress >= this.currentGoal.target) {
                this.currentGoal.completed = true;
                this.createFloatingText(
                    this.player.x + this.player.width / 2,
                    this.player.y - 50,
                    '目标完成!',
                    '#00ff00'
                );
            }
        }
    }
    
    attractCoins() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const attractRadius = 300;
        
        for (const coin of this.coinsList) {
            if (!coin.collected) {
                const dx = playerCenterX - coin.x;
                const dy = playerCenterY - coin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < attractRadius && distance > 0) {
                    const speed = 8 * (1 - distance / attractRadius);
                    coin.x += (dx / distance) * speed;
                    coin.y += (dy / distance) * speed;
                }
            }
        }
    }
    
    attractEnergyFragments() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const attractRadius = 300;
        
        for (const fragment of this.energyFragmentsList) {
            if (!fragment.collected) {
                const dx = playerCenterX - fragment.x;
                const dy = playerCenterY - fragment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < attractRadius && distance > 0) {
                    const speed = 7 * (1 - distance / attractRadius);
                    fragment.x += (dx / distance) * speed;
                    fragment.y += (dy / distance) * speed;
                }
            }
        }
    }
    
    collectPowerUp(powerUp) {
        switch(powerUp.type) {
            case 'shield':
                this.powerUpActive.shield = true;
                this.powerUpTimers.shield = this.powerUpDurations.shield;
                this.createFloatingText(
                    powerUp.x,
                    powerUp.y,
                    '获得护盾!',
                    '#00ff00'
                );
                break;
                
            case 'magnet':
                this.powerUpActive.magnet = true;
                this.powerUpTimers.magnet = this.powerUpDurations.magnet;
                this.createFloatingText(
                    powerUp.x,
                    powerUp.y,
                    '获得磁铁!',
                    '#ff00ff'
                );
                break;
                
            case 'speedBoots':
                this.powerUpActive.speedBoots = true;
                this.powerUpTimers.speedBoots = this.powerUpDurations.speedBoots;
                this.speedMultiplier = 1.5;
                this.createFloatingText(
                    powerUp.x,
                    powerUp.y,
                    '获得加速!',
                    '#00ffff'
                );
                break;
        }
        
        // 收集粒子效果
        this.createPowerUpParticles(powerUp.x, powerUp.y, powerUp.color);
    }
    
    createPowerUpParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: (Math.random() - 0.5) * 10,
                size: 4 + Math.random() * 5,
                color: color,
                glowColor: color,
                life: 40,
                maxLife: 40
            });
        }
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
        document.getElementById('silverCoinsValue').textContent = this.silverCoins;
        document.getElementById('energyFragmentsValue').textContent = this.energyFragments;
        document.getElementById('comboValue').textContent = 'x' + this.combo;
        document.getElementById('currentComboValue').textContent = this.currentCombo;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
        
        if (this.rewardModeActive) {
            document.getElementById('rewardModeDisplay').style.display = 'flex';
            document.getElementById('rewardModeTimer').textContent = Math.ceil(this.rewardModeTimer / 60) + 's';
        } else {
            document.getElementById('rewardModeDisplay').style.display = 'none';
        }
    }
    
    attractSilverCoins() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const attractRadius = 300;
        
        for (const coin of this.silverCoinsList) {
            if (!coin.collected) {
                const dx = playerCenterX - coin.x;
                const dy = playerCenterY - coin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < attractRadius && distance > 0) {
                    const speed = 7 * (1 - distance / attractRadius);
                    coin.x += (dx / distance) * speed;
                    coin.y += (dy / distance) * speed;
                }
            }
        }
    }
    
    updateRewardProgress(amount) {
        this.rewardProgress += amount;
        
        if (this.rewardProgress >= this.rewardProgressMax) {
            this.rewardProgress = this.rewardProgressMax;
            this.startRewardMode();
        }
    }
    
    startRewardMode() {
        this.rewardModeActive = true;
        this.rewardModeTimer = this.rewardModeDuration;
        this.rewardModeCount++;
        this.rewardProgress = 0;
        
        // 清理所有普通内容 - 障碍、收集物、道具
        this.obstacles = [];
        this.coinsList = [];
        this.silverCoinsList = [];
        this.energyFragmentsList = [];
        this.powerUps = [];
        
        // 计算玩家当前位置，确保从当前位置开始生成平坦跑道
        const playerCurrentX = this.player.x;
        
        // 创建从玩家位置向前延伸的平坦跑道
        this.platforms = [];
        
        // 先创建一个从玩家位置向前延伸的平台，确保玩家不会掉下去
        const initialPlatformStart = Math.max(0, playerCurrentX - 200);
        this.platforms.push({
            x: initialPlatformStart,
            y: this.player.groundY + 60,
            width: playerCurrentX + this.canvas.width * 2 - initialPlatformStart,
            height: 150,
            isGap: false,
            isRewardModePlatform: true
        });
        
        // 更新 lastPlatformX 到新平台的末端
        this.lastPlatformX = playerCurrentX + this.canvas.width * 2;
        
        // 确保玩家在地面上
        if (this.player.y > this.player.groundY) {
            this.player.y = this.player.groundY;
        }
        
        this.createFloatingText(
            this.player.x + this.player.width / 2,
            this.player.y - 50,
            '奖励模式!',
            '#ff69b4'
        );
        
        this.generateRewardPatterns();
    }
    
    endRewardMode() {
        this.rewardModeActive = false;
        this.rewardPatterns = [];
        this.rewardProgress = 0;
        
        // 从玩家当前位置开始重新生成普通平台
        const playerCurrentX = this.player.x;
        
        // 清理奖励模式平台，从当前位置开始重新生成
        this.platforms = [];
        
        // 创建一个初始平台确保玩家不会掉下去
        this.platforms.push({
            x: Math.max(0, playerCurrentX - 200),
            y: this.player.groundY + 60,
            width: this.canvas.width,
            height: 150,
            isGap: false
        });
        
        this.lastPlatformX = Math.max(0, playerCurrentX - 200) + this.canvas.width;
        
        // 确保玩家在地面上
        if (this.player.y > this.player.groundY) {
            this.player.y = this.player.groundY;
            this.player.velocityY = 0;
        }
        
        this.createFloatingText(
            this.player.x + this.player.width / 2,
            this.player.y - 50,
            '奖励结束',
            '#808080'
        );
    }
    
    generateRewardPatterns() {
        this.rewardPatterns = [];
        
        const patterns = [
            { type: 'line', description: '水平线' },
            { type: 'wave', description: '波浪线' },
            { type: 'circle', description: '圆环' },
            { type: 'heart', description: '心形' },
            { type: 'star', description: '星形' },
            { type: 'arrow', description: '箭头' },
            { type: 'stairs', description: '阶梯' },
            { type: 'doubleCurve', description: '双层曲线' }
        ];
        
        const baseX = this.player.x + this.canvas.width * 0.8;
        const numPatterns = 3;
        
        for (let p = 0; p < numPatterns; p++) {
            const patternType = patterns[Math.floor(Math.random() * patterns.length)];
            const startX = baseX + p * 450;
            const centerY = this.player.groundY - 120 - Math.random() * 80;
            
            this.generatePatternItems(patternType.type, startX, centerY);
        }
    }
    
    generatePatternItems(patternType, startX, centerY) {
        const items = [];
        const spacing = 25;
        
        switch(patternType) {
            case 'line':
                for (let i = 0; i < 12; i++) {
                    items.push({
                        x: startX + i * spacing,
                        y: centerY,
                        type: i % 3 === 0 ? 'gold' : (i % 3 === 1 ? 'silver' : 'energy'),
                        collected: false,
                        rotation: 0
                    });
                }
                break;
                
            case 'wave':
                for (let i = 0; i < 14; i++) {
                    const y = centerY + Math.sin(i * Math.PI / 3) * 50;
                    items.push({
                        x: startX + i * spacing,
                        y: y,
                        type: i % 2 === 0 ? 'gold' : 'silver',
                        collected: false,
                        rotation: 0
                    });
                }
                break;
                
            case 'circle':
                const radius = 70;
                const points = 20;
                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    items.push({
                        x: startX + Math.cos(angle) * radius,
                        y: centerY + Math.sin(angle) * radius,
                        type: i % 4 === 0 ? 'gold' : (i % 4 === 2 ? 'energy' : 'silver'),
                        collected: false,
                        rotation: 0
                    });
                }
                break;
                
            case 'heart':
                const heartPoints = 18;
                for (let i = 0; i < heartPoints; i++) {
                    const t = (i / heartPoints) * Math.PI * 2;
                    const x = 16 * Math.pow(Math.sin(t), 3);
                    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                    items.push({
                        x: startX + x * 3.5,
                        y: centerY + y * 3.5,
                        type: i % 3 === 0 ? 'gold' : (i % 3 === 1 ? 'energy' : 'silver'),
                        collected: false,
                        rotation: 0
                    });
                }
                break;
                
            case 'star':
                const starPoints = 10;
                const outerRadius = 80;
                const innerRadius = 40;
                for (let i = 0; i < starPoints; i++) {
                    const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2;
                    const r = i % 2 === 0 ? outerRadius : innerRadius;
                    items.push({
                        x: startX + Math.cos(angle) * r,
                        y: centerY + Math.sin(angle) * r,
                        type: i % 2 === 0 ? 'gold' : 'silver',
                        collected: false,
                        rotation: 0
                    });
                }
                break;
                
            case 'arrow':
                const arrowLength = 10;
                for (let i = 0; i < arrowLength; i++) {
                    items.push({
                        x: startX + i * spacing,
                        y: centerY,
                        type: i < arrowLength - 2 ? 'silver' : 'gold',
                        collected: false,
                        rotation: 0
                    });
                }
                items.push({
                    x: startX + (arrowLength - 1) * spacing,
                    y: centerY - 30,
                    type: 'gold',
                    collected: false,
                    rotation: 0
                });
                items.push({
                    x: startX + (arrowLength - 1) * spacing,
                    y: centerY + 30,
                    type: 'gold',
                    collected: false,
                    rotation: 0
                });
                items.push({
                    x: startX + (arrowLength - 2) * spacing,
                    y: centerY - 20,
                    type: 'energy',
                    collected: false,
                    rotation: 0
                });
                items.push({
                    x: startX + (arrowLength - 2) * spacing,
                    y: centerY + 20,
                    type: 'energy',
                    collected: false,
                    rotation: 0
                });
                break;
                
            case 'stairs':
                const stairCount = 8;
                for (let i = 0; i < stairCount; i++) {
                    for (let j = 0; j <= i; j++) {
                        items.push({
                            x: startX + j * spacing,
                            y: centerY - i * 25,
                            type: i % 2 === 0 ? 'gold' : 'silver',
                            collected: false,
                            rotation: 0
                        });
                    }
                }
                for (let i = 0; i < 4; i++) {
                    items.push({
                        x: startX + (stairCount - 1) * spacing,
                        y: centerY - i * 25 - 25,
                        type: 'energy',
                        collected: false,
                        rotation: 0
                    });
                }
                break;
                
            case 'doubleCurve':
                const curvePoints = 16;
                for (let i = 0; i < curvePoints; i++) {
                    const t = i / curvePoints;
                    const y1 = centerY + Math.sin(t * Math.PI * 2) * 40;
                    const y2 = centerY - 60 + Math.sin(t * Math.PI * 2 + Math.PI) * 30;
                    
                    items.push({
                        x: startX + i * spacing,
                        y: y1,
                        type: i % 2 === 0 ? 'gold' : 'silver',
                        collected: false,
                        rotation: 0
                    });
                    
                    items.push({
                        x: startX + i * spacing,
                        y: y2,
                        type: i % 3 === 0 ? 'energy' : 'silver',
                        collected: false,
                        rotation: 0
                    });
                }
                break;
        }
        
        for (const item of items) {
            this.rewardPatterns.push({
                x: item.x,
                y: item.y,
                type: item.type,
                collected: item.collected,
                rotation: item.rotation,
                radius: item.type === 'gold' ? 12 : 10
            });
        }
    }
    
    collectRewardPatterns() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        for (const item of this.rewardPatterns) {
            if (!item.collected) {
                item.rotation += 0.15;
                
                const dx = playerCenterX - item.x;
                const dy = playerCenterY - item.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < item.radius + 25) {
                    item.collected = true;
                    this.combo++;
                    this.updateCombo();
                    
                    if (item.type === 'gold') {
                        this.coins++;
                        this.rewardCoins++;
                        this.createCoinParticles(item.x, item.y);
                    } else if (item.type === 'silver') {
                        this.silverCoins++;
                        this.rewardSilverCoins++;
                        this.createSilverCoinParticles(item.x, item.y);
                    } else if (item.type === 'energy') {
                        this.energyFragments++;
                        this.rewardEnergyFragments++;
                        this.createEnergyFragmentParticles(item.x, item.y);
                    }
                    
                    this.updateScoreDisplay();
                }
            }
        }
        
        // 清理已收集且超出屏幕的图案，避免数组无限增长
        this.rewardPatterns = this.rewardPatterns.filter(item => 
            !item.collected || item.x > this.player.x - this.canvas.width
        );
        
        // 优化：检查是否需要生成新图案
        // 不是所有图案被吃完才生成，而是检查视野前方是否有足够的未收集图案
        const visiblePatterns = this.rewardPatterns.filter(item => 
            !item.collected && item.x > this.player.x
        );
        
        // 找到最右边图案的位置
        let rightmostX = this.player.x;
        for (const item of this.rewardPatterns) {
            if (!item.collected && item.x > rightmostX) {
                rightmostX = item.x;
            }
        }
        
        // 如果最右边图案已经被玩家超过，或者视野前方图案太少，生成新图案
        const needsMorePatterns = rightmostX < this.player.x + this.canvas.width * 0.5 || 
            visiblePatterns.length < 8;
        
        if (needsMorePatterns && this.rewardModeActive) {
            this.generateMoreRewardPatterns();
        }
    }
    
    generateMoreRewardPatterns() {
        // 增量生成奖励图案，避免卡顿
        const patterns = [
            { type: 'line', description: '水平线' },
            { type: 'wave', description: '波浪线' },
            { type: 'circle', description: '圆环' },
            { type: 'heart', description: '心形' },
            { type: 'star', description: '星形' },
            { type: 'arrow', description: '箭头' },
            { type: 'stairs', description: '阶梯' },
            { type: 'doubleCurve', description: '双层曲线' }
        ];
        
        // 找到当前最右边的图案位置
        let baseX = this.player.x + this.canvas.width * 0.8;
        for (const item of this.rewardPatterns) {
            if (!item.collected && item.x > baseX) {
                baseX = item.x;
            }
        }
        
        // 只生成1-2个图案，避免一次生成太多导致卡顿
        const numPatterns = 1 + Math.floor(Math.random() * 2);
        
        for (let p = 0; p < numPatterns; p++) {
            const patternType = patterns[Math.floor(Math.random() * patterns.length)];
            const startX = baseX + p * 400;
            const centerY = this.player.groundY - 100 - Math.random() * 100;
            
            this.generatePatternItems(patternType.type, startX, centerY);
        }
    }
    
    updateHealthBar() {
        const healthFill = document.querySelector('.health-fill');
        healthFill.style.width = Math.max(0, this.health) + '%';
    }
    
    render() {
        // 清空画布 - 奖励模式时用白色天空，夜景用深色
        if (this.rewardModeActive) {
            // 奖励模式：白色天空背景，带渐变效果
            const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            skyGradient.addColorStop(0, '#ffffff');
            skyGradient.addColorStop(0.5, '#f0f8ff');
            skyGradient.addColorStop(1, '#e6f3ff');
            this.ctx.fillStyle = skyGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 普通模式：夜景
            this.ctx.fillStyle = '#0a0a1a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
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
        
        // 普通模式下绘制星星和夜景建筑
        if (!this.rewardModeActive) {
            // 绘制星星背景
            this.drawStars();
            
            // 绘制背景建筑物
            this.drawBackgrounds(cameraX);
        }
        
        // 应用相机变换
        this.ctx.translate(-cameraX, 0);
        
        // 绘制平台
        this.drawPlatforms();
        
        // 绘制障碍物
        this.drawObstacles();
        
        // 绘制金币
        this.drawCoins();
        
        // 绘制银币
        this.drawSilverCoins();
        
        // 绘制能量碎片
        this.drawEnergyFragments();
        
        // 绘制奖励模式图案
        if (this.rewardModeActive) {
            this.drawRewardPatterns();
        }
        
        // 绘制道具
        this.drawPowerUps();
        
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
        
        // 绘制道具状态UI
        this.drawPowerUpUI();
        
        // 绘制奖励模式顶部提示
        this.drawRewardModeTopUI();
        
        // 绘制小目标UI
        this.drawGoalUI();
        
        // 绘制奖励进度UI
        this.drawRewardProgressUI();
    }
    
    drawSilverCoins() {
        for (const coin of this.silverCoinsList) {
            if (!coin.collected) {
                this.ctx.save();
                this.ctx.translate(coin.x, coin.y);
                
                this.ctx.shadowColor = '#c0c0c0';
                this.ctx.shadowBlur = 15;
                
                const scaleX = Math.cos(coin.rotation);
                this.ctx.scale(scaleX, 1);
                
                this.ctx.fillStyle = '#e8e8e8';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                const gradient = this.ctx.createRadialGradient(
                    -coin.radius * 0.3, -coin.radius * 0.3, 0,
                    0, 0, coin.radius
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#e8e8e8');
                gradient.addColorStop(1, '#c0c0c0');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius - 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#a0a0a0';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                if (Math.abs(scaleX) > 0.3) {
                    this.ctx.fillStyle = '#808080';
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('◆', 0, 0);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    drawEnergyFragments() {
        for (const fragment of this.energyFragmentsList) {
            if (!fragment.collected) {
                this.ctx.save();
                this.ctx.translate(fragment.x, fragment.y);
                
                const pulse = Math.sin(Date.now() * 0.005 + fragment.pulsePhase) * 0.2 + 1;
                
                this.ctx.shadowColor = '#9b59b6';
                this.ctx.shadowBlur = 20 * pulse;
                
                const scaleX = Math.cos(fragment.rotation);
                this.ctx.scale(scaleX, 1);
                
                this.ctx.fillStyle = '#e8daef';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, fragment.radius * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                
                const gradient = this.ctx.createRadialGradient(
                    -fragment.radius * 0.3, -fragment.radius * 0.3, 0,
                    0, 0, fragment.radius * pulse
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#e8daef');
                gradient.addColorStop(1, '#9b59b6');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, fragment.radius * pulse - 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#8e44ad';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                if (Math.abs(scaleX) > 0.3) {
                    this.ctx.fillStyle = '#7d3c98';
                    this.ctx.font = 'bold 18px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('◆', 0, 0);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    drawRewardPatterns() {
        for (const item of this.rewardPatterns) {
            if (!item.collected) {
                this.ctx.save();
                this.ctx.translate(item.x, item.y);
                
                let mainColor, borderColor, glowColor, symbol;
                const isGold = item.type === 'gold';
                const isSilver = item.type === 'silver';
                const isEnergy = item.type === 'energy';
                
                if (isGold) {
                    mainColor = '#ffec8b';
                    borderColor = '#ffb700';
                    glowColor = '#ffd700';
                    symbol = '★';
                } else if (isSilver) {
                    mainColor = '#e8e8e8';
                    borderColor = '#a0a0a0';
                    glowColor = '#c0c0c0';
                    symbol = '◆';
                } else {
                    mainColor = '#e8daef';
                    borderColor = '#8e44ad';
                    glowColor = '#9b59b6';
                    symbol = '◆';
                }
                
                const pulse = Math.sin(Date.now() * 0.008 + item.x * 0.01) * 0.15 + 1;
                
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 30 * pulse;
                
                const scaleX = Math.cos(item.rotation);
                this.ctx.scale(scaleX, 1);
                
                this.ctx.fillStyle = mainColor;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, item.radius * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                
                const gradient = this.ctx.createRadialGradient(
                    -item.radius * 0.3, -item.radius * 0.3, 0,
                    0, 0, item.radius * pulse
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, mainColor);
                gradient.addColorStop(1, isGold ? '#ffd700' : (isSilver ? '#c0c0c0' : '#9b59b6'));
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, item.radius * pulse - 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = borderColor;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                if (Math.abs(scaleX) > 0.3) {
                    this.ctx.fillStyle = isGold ? '#ff8c00' : (isSilver ? '#808080' : '#7d3c98');
                    this.ctx.font = isGold ? 'bold 16px Arial' : (isEnergy ? 'bold 18px Arial' : 'bold 14px Arial');
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(symbol, 0, 0);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    drawRewardProgressUI() {
        if (this.gameState !== 'playing') return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const barWidth = 200;
        const barHeight = 20;
        const posX = this.canvas.width / 2 - barWidth / 2;
        const posY = this.canvas.height - 50;
        
        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(posX - 1, posY - 1, barWidth + 2, barHeight + 2);
        
        // 边框
        this.ctx.strokeStyle = this.rewardModeActive ? '#ff69b4' : '#64c8ff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(posX - 1, posY - 1, barWidth + 2, barHeight + 2);
        
        // 进度条
        if (!this.rewardModeActive) {
            const progressPercent = this.rewardProgress / this.rewardProgressMax;
            const gradient = this.ctx.createLinearGradient(posX, posY, posX + barWidth, posY);
            gradient.addColorStop(0, '#64c8ff');
            gradient.addColorStop(1, '#ff69b4');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(posX, posY, barWidth * progressPercent, barHeight);
            
            // 文字
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('奖励进度', posX + barWidth / 2, posY - 5);
        } else {
            // 奖励模式倒计时
            const remainingSeconds = Math.ceil(this.rewardModeTimer / 60);
            const progressPercent = this.rewardModeTimer / this.rewardModeDuration;
            
            // 闪烁效果
            const pulseAlpha = remainingSeconds <= 5 ? 
                (Math.sin(Date.now() * 0.01) + 1) * 0.3 + 0.4 : 0.7;
            
            const gradient = this.ctx.createLinearGradient(posX, posY, posX + barWidth, posY);
            gradient.addColorStop(0, `rgba(255, 105, 180, ${pulseAlpha})`);
            gradient.addColorStop(1, `rgba(255, 182, 193, ${pulseAlpha})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(posX, posY, barWidth * progressPercent, barHeight);
            
            // 文字
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = remainingSeconds <= 5 ? '#ff4757' : '#ff69b4';
            this.ctx.fillText(`奖励模式: ${remainingSeconds}s`, posX + barWidth / 2, posY - 5);
        }
        
        this.ctx.restore();
    }
    
    drawPowerUps() {
        for (const powerUp of this.powerUps) {
            if (!powerUp.collected) {
                this.ctx.save();
                this.ctx.translate(powerUp.x, powerUp.y);
                
                // 上下浮动效果
                const bobOffset = Math.sin(Date.now() * 0.003 + powerUp.bobOffset) * 8;
                this.ctx.translate(0, bobOffset);
                
                // 添加强烈的发光效果
                this.ctx.shadowColor = powerUp.glowColor;
                this.ctx.shadowBlur = 25;
                
                // 旋转效果
                const scaleX = Math.cos(powerUp.rotation);
                this.ctx.scale(scaleX, 1);
                
                // 绘制道具主体 - 圆形背景
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fill();
                
                // 内部渐变效果
                const gradient = this.ctx.createRadialGradient(
                    -powerUp.radius * 0.3, -powerUp.radius * 0.3, 0,
                    0, 0, powerUp.radius
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                gradient.addColorStop(0.5, powerUp.color);
                gradient.addColorStop(1, powerUp.color);
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerUp.radius - 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 边缘
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 绘制道具图标
                if (Math.abs(scaleX) > 0.2) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    this.ctx.font = 'bold 18px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    
                    let icon = '';
                    switch(powerUp.type) {
                        case 'shield':
                            icon = '🛡';
                            break;
                        case 'magnet':
                            icon = '🧲';
                            break;
                        case 'speedBoots':
                            icon = '⚡';
                            break;
                    }
                    this.ctx.fillText(icon, 0, 0);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    drawPowerUpUI() {
        if (this.gameState !== 'playing') return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 显示位置 - 屏幕底部中间上方
        const startX = this.canvas.width / 2 - 150;
        const startY = this.canvas.height - 80;
        let currentX = startX;
        
        const activePowerUps = [];
        
        if (this.powerUpActive.shield) {
            activePowerUps.push({
                type: 'shield',
                name: '护盾',
                timer: this.powerUpTimers.shield,
                duration: this.powerUpDurations.shield,
                color: '#00ff00',
                icon: '🛡'
            });
        }
        
        if (this.powerUpActive.magnet) {
            activePowerUps.push({
                type: 'magnet',
                name: '磁铁',
                timer: this.powerUpTimers.magnet,
                duration: this.powerUpDurations.magnet,
                color: '#ff00ff',
                icon: '🧲'
            });
        }
        
        if (this.powerUpActive.speedBoots) {
            activePowerUps.push({
                type: 'speedBoots',
                name: '加速',
                timer: this.powerUpTimers.speedBoots,
                duration: this.powerUpDurations.speedBoots,
                color: '#00ffff',
                icon: '⚡'
            });
        }
        
        // 计算总宽度以居中
        const totalWidth = activePowerUps.length * 100 - 20;
        let x = this.canvas.width / 2 - totalWidth / 2;
        
        for (const powerUp of activePowerUps) {
            const remainingPercent = powerUp.timer / powerUp.duration;
            const remainingSeconds = Math.ceil(powerUp.timer / 60);
            
            // 背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(x, startY, 80, 50);
            
            // 边框
            this.ctx.strokeStyle = powerUp.color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, startY, 80, 50);
            
            // 图标
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillText(powerUp.icon, x + 40, startY + 22);
            
            // 倒计时
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(remainingSeconds + 's', x + 40, startY + 42);
            
            // 进度条背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x + 5, startY + 45, 70, 4);
            
            // 进度条
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(x + 5, startY + 45, 70 * remainingPercent, 4);
            
            x += 90;
        }
        
        this.ctx.restore();
    }
    
    drawGoalUI() {
        if (!this.currentGoal || this.gameState !== 'playing') return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 显示位置 - 奖励模式时显示在顶部右侧，普通模式在顶部中央
        let posX, posY;
        if (this.rewardModeActive) {
            // 奖励模式时，小目标显示在右上角
            posX = this.canvas.width - 140;
            posY = 100;
        } else {
            // 普通模式时，显示在顶部中央
            posX = this.canvas.width / 2;
            posY = 150;
        }
        
        // 背景
        this.ctx.fillStyle = this.currentGoal.completed ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(posX - 120, posY - 30, 240, 60);
        
        // 边框
        this.ctx.strokeStyle = this.currentGoal.completed ? '#00ff00' : '#64c8ff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(posX - 120, posY - 30, 240, 60);
        
        // 标题
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.currentGoal.completed ? '#00ff00' : '#c0c0e0';
        this.ctx.fillText(this.currentGoal.completed ? '✓ 目标完成!' : '小目标', posX, posY - 10);
        
        // 描述
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = this.currentGoal.completed ? '#00ff00' : '#ffffff';
        this.ctx.fillText(this.currentGoal.description, posX, posY + 12);
        
        // 进度
        if (!this.currentGoal.completed) {
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = '#64c8ff';
            
            let progressText = '';
            switch(this.currentGoal.type) {
                case 'coins':
                    progressText = `${this.goalProgress}/${this.currentGoal.target}`;
                    break;
                case 'distance':
                    progressText = `${Math.floor(this.distance)}/${this.currentGoal.target}m`;
                    break;
                case 'dodge':
                    progressText = `${this.goalProgress}/${this.currentGoal.target}`;
                    break;
            }
            this.ctx.fillText(progressText, posX, posY + 28);
        }
        
        this.ctx.restore();
    }
    
    // 绘制奖励模式顶部提示
    drawRewardModeTopUI() {
        if (!this.rewardModeActive || this.gameState !== 'playing') return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 显示位置 - 顶部左侧
        const posX = 20;
        const posY = 100;
        const remainingSeconds = Math.ceil(this.rewardModeTimer / 60);
        
        // 闪烁效果 - 倒计时快结束时更明显
        const isUrgent = remainingSeconds <= 5;
        const pulseAlpha = isUrgent ? 
            (Math.sin(Date.now() * 0.015) + 1) * 0.3 + 0.5 : 0.8;
        
        // 背景
        this.ctx.fillStyle = `rgba(255, 105, 180, ${pulseAlpha * 0.3})`;
        this.ctx.fillRect(posX, posY - 25, 180, 50);
        
        // 边框
        this.ctx.strokeStyle = isUrgent ? '#ff4757' : '#ff69b4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(posX, posY - 25, 180, 50);
        
        // 标题
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = isUrgent ? '#ff4757' : '#ff69b4';
        this.ctx.fillText('★ 奖励模式 ★', posX + 10, posY);
        
        // 倒计时
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`剩余: ${remainingSeconds}秒`, posX + 10, posY + 18);
        
        this.ctx.restore();
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
            
            if (this.rewardModeActive) {
                // 奖励模式：简洁的白色跑道样式
                // 跑道主体 - 淡灰色
                this.ctx.fillStyle = '#e8e8e8';
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // 跑道顶部边缘 - 稍微深一点的灰色
                this.ctx.fillStyle = '#d0d0d0';
                this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
                
                // 简洁的跑道线 - 只有简单的分隔线
                this.ctx.fillStyle = '#c0c0c0';
                for (let i = 0; i < platform.width; i += 100) {
                    this.ctx.fillRect(platform.x + i, platform.y + 10, 60, 2);
                }
            } else {
                // 普通模式：原来的夜景样式
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
                
                const goalStatus = entry.goalCompleted ? '✓' : '✗';
                const goalColor = entry.goalCompleted ? '#00ff00' : '#ff6b6b';
                
                item.innerHTML = `
                    <span class="leaderboard-rank" style="color: ${rankColor}">${index + 1}</span>
                    <span class="leaderboard-name">
                        ${entry.name}
                        ${entry.goalType ? `<span class="goal-badge" style="color: ${goalColor}; margin-left: 8px; font-size: 0.85rem;">${goalStatus}</span>` : ''}
                    </span>
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
        
        const normalScore = this.normalCoins * 100 + this.normalSilverCoins * 50 + this.normalEnergyFragments * 25;
        const rewardScore = this.rewardCoins * 100 + this.rewardSilverCoins * 50 + this.rewardEnergyFragments * 25;
        const distanceScore = Math.floor(this.distance * 10);
        
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
                    coins: this.coins,
                    silverCoins: this.silverCoins,
                    energyFragments: this.energyFragments,
                    rewardModeCount: this.rewardModeCount,
                    maxCombo: this.maxCombo,
                    normalCoins: this.normalCoins,
                    normalSilverCoins: this.normalSilverCoins,
                    normalEnergyFragments: this.normalEnergyFragments,
                    rewardCoins: this.rewardCoins,
                    rewardSilverCoins: this.rewardSilverCoins,
                    rewardEnergyFragments: this.rewardEnergyFragments,
                    normalScore: normalScore,
                    rewardScore: rewardScore,
                    distanceScore: distanceScore,
                    goalType: this.currentGoal ? this.currentGoal.type : null,
                    goalDescription: this.currentGoal ? this.currentGoal.description : null,
                    goalTarget: this.currentGoal ? this.currentGoal.target : null,
                    goalCompleted: this.currentGoal ? this.currentGoal.completed : false
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
