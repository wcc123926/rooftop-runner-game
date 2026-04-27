const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// 初始化排行榜文件
if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
}

// 获取排行榜
app.get('/api/leaderboard', (req, res) => {
    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        const leaderboard = JSON.parse(data);
        // 按分数排序，取前10名
        const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
        res.json(sorted);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        res.status(500).json({ error: 'Failed to read leaderboard' });
    }
});

// 提交成绩
app.post('/api/leaderboard', (req, res) => {
    try {
        const { 
            name, score, distance, coins, silverCoins, energyFragments,
            rewardModeCount, maxCombo,
            normalCoins, normalSilverCoins, normalEnergyFragments,
            rewardCoins, rewardSilverCoins, rewardEnergyFragments,
            normalScore, rewardScore, distanceScore,
            goalType, goalDescription, goalTarget, goalCompleted 
        } = req.body;
        
        if (!name || !score) {
            return res.status(400).json({ error: 'Name and score are required' });
        }
        
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        const leaderboard = JSON.parse(data);
        
        const newEntry = {
            name: name.substring(0, 10),
            score: parseInt(score),
            distance: parseInt(distance) || 0,
            coins: parseInt(coins) || 0,
            silverCoins: parseInt(silverCoins) || 0,
            energyFragments: parseInt(energyFragments) || 0,
            rewardModeCount: parseInt(rewardModeCount) || 0,
            maxCombo: parseInt(maxCombo) || 0,
            normalCoins: parseInt(normalCoins) || 0,
            normalSilverCoins: parseInt(normalSilverCoins) || 0,
            normalEnergyFragments: parseInt(normalEnergyFragments) || 0,
            rewardCoins: parseInt(rewardCoins) || 0,
            rewardSilverCoins: parseInt(rewardSilverCoins) || 0,
            rewardEnergyFragments: parseInt(rewardEnergyFragments) || 0,
            normalScore: parseInt(normalScore) || 0,
            rewardScore: parseInt(rewardScore) || 0,
            distanceScore: parseInt(distanceScore) || 0,
            goalType: goalType || null,
            goalDescription: goalDescription || null,
            goalTarget: goalTarget || null,
            goalCompleted: goalCompleted || false,
            date: new Date().toISOString()
        };
        
        leaderboard.push(newEntry);
        
        // 只保留前100名以控制文件大小
        const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 100);
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(sorted, null, 2));
        
        res.json({ success: true, message: 'Score saved successfully' });
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

app.listen(PORT, () => {
    console.log(`Rooftop Runner Game Server running on http://localhost:${PORT}`);
    console.log(`Open your browser and visit http://localhost:${PORT} to play the game`);
});
