// Unity Ads configuration
const GAME_ID = '5776126';
const TEST_MODE = true;
const BANNER_PLACEMENT = 'Banner_Android';
const INTERSTITIAL_PLACEMENT = 'Interstitial_Android';
const REWARDED_PLACEMENT = 'Rewarded_Android';

let canvas, ctx, scoreElement, arrowsElement, gameOverElement, mainMenuElement, 
    levelCompleteElement, finalScoreElement, levelScoreElement, winnerElement;

// Game variables
let bubbles = [];
let arrows = [];
let bow;
let score = 0;
let currentLevel = 1;
let remainingArrows = 0;
let gameActive = false;

// Level configurations
const levels = {};

// Generate 50 levels with increasing difficulty
for (let i = 1; i <= 50; i++) {
    levels[i] = {
        bubbles: Math.min(5 + Math.floor(i * 0.8), 30),  // Starts with 5, gradually increases to max 30
        arrows: Math.min(10 + Math.floor(i * 0.5), 30),  // Starts with 10, gradually increases to max 30
        speed: Math.min(3 + Math.floor(i * 0.2), 8),     // Starts with 3, gradually increases to max 8
        unlocked: i === 1  // Only first level is unlocked initially
    };
}

// Game classes
class Bubble {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.dx = (Math.random() - 0.5) * speed;
        this.dy = (Math.random() - 0.5) * speed;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.dy = -this.dy;
        }

        this.x += this.dx;
        this.y += this.dy;
    }
}

class Arrow {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 10;
        this.width = 30;
        this.height = 5;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Arrow body
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -this.height);
        ctx.lineTo(this.width / 2 + 10, 0);
        ctx.lineTo(this.width / 2, this.height);
        ctx.fillStyle = '#FFA500';
        ctx.fill();
        ctx.closePath();
        
        ctx.restore();
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
}

class Bow {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 50;
        this.angle = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.arc(0, 0, 30, -Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// Game functions
function showMainMenu() {
    mainMenuElement.style.display = 'block';
    gameOverElement.style.display = 'none';
    levelCompleteElement.style.display = 'none';
    winnerElement.style.display = 'none';
    gameActive = false;

    const levelContainer = document.getElementById('levelContainer');
    levelContainer.innerHTML = '';
    
    for (let i = 1; i <= Object.keys(levels).length; i++) {
        const btn = document.createElement('button');
        btn.textContent = `Level ${i}`;
        btn.className = `level-btn ${levels[i].unlocked ? '' : 'locked'}`;
        btn.onclick = () => startLevel(i);
        btn.disabled = !levels[i].unlocked;
        levelContainer.appendChild(btn);
    }
}

function startLevel(level) {
    if (!levels[level].unlocked) return;

    // Show interstitial ad before starting level
    showInterstitialAd();

    currentLevel = level;
    score = 0;
    remainingArrows = levels[level].arrows;
    bubbles = [];
    arrows = [];
    bow = new Bow();
    
    for (let i = 0; i < levels[level].bubbles; i++) {
        bubbles.push(new Bubble(
            Math.random() * (canvas.width - 40) + 20,
            Math.random() * (canvas.height / 2 - 40) + 20,
            levels[level].speed
        ));
    }

    mainMenuElement.style.display = 'none';
    gameOverElement.style.display = 'none';
    levelCompleteElement.style.display = 'none';
    winnerElement.style.display = 'none';
    scoreElement.textContent = `Score: ${score}`;
    arrowsElement.textContent = `Arrows: ${remainingArrows}`;
    gameActive = true;
}

function nextLevel() {
    if (currentLevel === 50) {
        showWinner();
    } else if (currentLevel < Object.keys(levels).length) {
        levels[currentLevel + 1].unlocked = true;
        startLevel(currentLevel + 1);
    } else {
        showMainMenu();
    }
}

function showWinner() {
    gameActive = false;
    winnerElement.style.display = 'block';
    document.body.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
}

function restartLevel() {
    startLevel(currentLevel);
}

function checkCollisions() {
    for (let i = arrows.length - 1; i >= 0; i--) {
        for (let j = bubbles.length - 1; j >= 0; j--) {
            const dx = arrows[i].x - bubbles[j].x;
            const dy = arrows[i].y - bubbles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bubbles[j].radius + 5) {
                arrows.splice(i, 1);
                bubbles.splice(j, 1);
                score += 10;
                scoreElement.textContent = `Score: ${score}`;
                break;
            }
        }
    }
}

function gameOver() {
    gameActive = false;
    gameOverElement.style.display = 'block';
    finalScoreElement.textContent = score;
    showInterstitialAd();
}

function levelComplete() {
    gameActive = false;
    levelCompleteElement.style.display = 'block';
    levelScoreElement.textContent = score;
    showInterstitialAd();
}

function animate() {
    if (!gameActive) {
        requestAnimationFrame(animate);
        return;
    }
    
    ctx.fillStyle = 'rgba(26, 26, 46, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bow.draw();

    bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw();
    });

    arrows.forEach((arrow, index) => {
        arrow.update();
        arrow.draw();
        
        if (arrow.x < 0 || arrow.x > canvas.width || arrow.y < 0 || arrow.y > canvas.height) {
            arrows.splice(index, 1);
        }
    });

    checkCollisions();

    if (bubbles.length === 0) {
        levelComplete();
    } else if (remainingArrows === 0 && arrows.length === 0) {
        gameOver();
    }

    requestAnimationFrame(animate);
}

// Unity Ads functions
function initializeAds() {
    // Wait for Unity Ads to be available
    if (typeof UnityAds === 'undefined') {
        setTimeout(initializeAds, 1000); // Try again in 1 second
        return;
    }

    try {
        UnityAds.initialize(GAME_ID, TEST_MODE, {
            onComplete: function() {
                console.log('Unity Ads initialization complete');
                loadBannerAd();
            },
            onFailed: function(error, message) {
                console.error('Unity Ads initialization failed:', error, message);
            }
        });
    } catch (error) {
        console.error('Error initializing Unity Ads:', error);
    }
}

function loadBannerAd() {
    try {
        UnityAds.Banner.load(BANNER_PLACEMENT, {
            width: '320',
            height: '50'
        });
        
        UnityAds.Banner.show(BANNER_PLACEMENT);
    } catch (error) {
        console.error('Error loading banner ad:', error);
    }
}

function showInterstitialAd() {
    try {
        if (UnityAds.isReady(INTERSTITIAL_PLACEMENT)) {
            UnityAds.show(INTERSTITIAL_PLACEMENT);
        } else {
            console.log('Interstitial ad not ready');
        }
    } catch (error) {
        console.error('Error showing interstitial ad:', error);
    }
}

// Initialize the game
function initGame() {
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    arrowsElement = document.getElementById('arrows');
    gameOverElement = document.getElementById('gameOver');
    mainMenuElement = document.getElementById('mainMenu');
    levelCompleteElement = document.getElementById('levelComplete');
    finalScoreElement = document.getElementById('finalScore');
    levelScoreElement = document.getElementById('levelScore');
    winnerElement = document.getElementById('winner');

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 600;

    // Initialize bow
    bow = new Bow();

    // Add event listeners
    canvas.addEventListener('mousemove', (e) => {
        if (!gameActive) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        bow.angle = Math.atan2(mouseY - bow.y, mouseX - bow.x);
    });

    canvas.addEventListener('click', () => {
        if (!gameActive || remainingArrows <= 0) return;
        
        const arrow = new Arrow(bow.x, bow.y, bow.angle);
        arrows.push(arrow);
        remainingArrows--;
        arrowsElement.textContent = `Arrows: ${remainingArrows}`;
    });

    // Start the game
    showMainMenu();
    animate();
}

// Start the game when the page loads
window.onload = function() {
    // Initialize Unity Ads first
    initializeAds();
    
    // Start the game
    initGame();
};