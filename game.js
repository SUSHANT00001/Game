// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BASKET_WIDTH = 100;
const BASKET_HEIGHT = 30;
const STAR_SIZE = 20;
const INITIAL_STAR_SPEED = 2;
const SPEED_INCREASE_INTERVAL = 15000; // 15 seconds
const CATCH_ANIMATION_DURATION = 200; // Duration of catch animation in ms
const BASKET_SPEED = 12; // Increased base speed
const PARTICLE_COUNT = 15; // Number of particles per catch
const ACCELERATION = 2.5; // Increased acceleration rate
const DECELERATION = 0.2; // Reduced deceleration for smoother movement
const MAX_SPEED = 25; // Increased maximum speed
const EASING = 0.15; // Increased easing for more responsive movement
const WINNING_SCORE = 200; // Score needed to win
const COMBO_THRESHOLD = 3; // Number of stars needed for a combo
const COMBO_DURATION = 2000; // Combo duration in milliseconds

// Game state
let canvas, ctx;
let basket = { 
    x: 0, 
    y: 0, 
    catchAnimation: 0, 
    velocity: 0,
    targetX: 0,
    scale: 1,
    trail: [] // Array to store trail positions
};
let stars = [];
let particles = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameStartTime;
let starSpeed = INITIAL_STAR_SPEED;
let gameActive = false;
let keys = {};
let isDragging = false;
let dragOffset = 0;
let lastTime = 0;
let canvasScale = 1;
let difficultyLevel = 1;
let comboCount = 0;
let lastCatchTime = 0;
let backgroundStars = []; // Background stars for parallax effect

// Initialize background stars
function initBackgroundStars() {
    for (let i = 0; i < 50; i++) {
        backgroundStars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

// Draw background with parallax effect
function drawBackground() {
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw and update background stars
    backgroundStars.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
        }
        
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize background stars
    initBackgroundStars();
    
    // Create restart button
    createRestartButton();
    
    // Set initial basket position
    basket.x = (CANVAS_WIDTH - BASKET_WIDTH) / 2;
    basket.y = CANVAS_HEIGHT - BASKET_HEIGHT - 10;
    basket.targetX = basket.x;

    // Handle canvas scaling for different screen sizes
    handleResize();
    window.addEventListener('resize', handleResize);

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Start game
    startGame();
}

// Create restart button
function createRestartButton() {
    const button = document.createElement('button');
    button.id = 'restartButton';
    button.textContent = 'Restart Game';
    button.style.display = 'none';
    button.onclick = startGame;
    document.getElementById('gameContainer').appendChild(button);
}

// Handle window resize
function handleResize() {
    const container = document.getElementById('gameContainer');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale to fit the game in the container
    const scaleX = containerWidth / CANVAS_WIDTH;
    const scaleY = containerHeight / CANVAS_HEIGHT;
    canvasScale = Math.min(scaleX, scaleY);
    
    // Set canvas size
    canvas.style.width = `${CANVAS_WIDTH * canvasScale}px`;
    canvas.style.height = `${CANVAS_HEIGHT * canvasScale}px`;
}

// Handle touch start
function handleTouchStart(e) {
    if (!gameActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = (touch.clientX - rect.left) / canvasScale;
    const touchY = (touch.clientY - rect.top) / canvasScale;
    
    if (touchX >= basket.x && 
        touchX <= basket.x + BASKET_WIDTH && 
        touchY >= basket.y && 
        touchY <= basket.y + BASKET_HEIGHT) {
        isDragging = true;
        dragOffset = touchX - basket.x;
    }
}

// Handle touch move
function handleTouchMove(e) {
    if (!gameActive || !isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = (touch.clientX - rect.left) / canvasScale;
    
    const targetX = touchX - dragOffset;
    basket.targetX = Math.max(0, Math.min(CANVAS_WIDTH - BASKET_WIDTH, targetX));
}

// Handle touch end
function handleTouchEnd(e) {
    isDragging = false;
}

// Handle key down events
function handleKeyDown(e) {
    keys[e.key] = true;
}

// Handle key up events
function handleKeyUp(e) {
    keys[e.key] = false;
}

// Handle mouse down event
function handleMouseDown(e) {
    if (!gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasScale;
    const mouseY = (e.clientY - rect.top) / canvasScale;
    
    // Check if click is within basket bounds
    if (mouseX >= basket.x && 
        mouseX <= basket.x + BASKET_WIDTH && 
        mouseY >= basket.y && 
        mouseY <= basket.y + BASKET_HEIGHT) {
        isDragging = true;
        dragOffset = mouseX - basket.x;
        // Change cursor to indicate dragging
        canvas.style.cursor = 'grabbing';
    }
}

// Handle mouse up event
function handleMouseUp() {
    if (isDragging) {
        isDragging = false;
        // Reset cursor
        canvas.style.cursor = 'default';
    }
}

// Handle mouse movement
function handleMouseMove(e) {
    if (!gameActive || !isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasScale;
    
    // Move basket with drag offset and enhanced responsiveness
    const targetX = mouseX - dragOffset;
    basket.targetX = Math.max(0, Math.min(CANVAS_WIDTH - BASKET_WIDTH, targetX));
    
    // Add momentum to mouse movement
    const dx = targetX - basket.x;
    basket.velocity = dx * 0.2; // Add some momentum to the movement
}

// Start new game
function startGame() {
    gameActive = true;
    score = 0;
    stars = [];
    starSpeed = INITIAL_STAR_SPEED;
    gameStartTime = Date.now();
    difficultyLevel = 1;
    updateScore();
    
    // Hide restart button
    document.getElementById('restartButton').style.display = 'none';
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameActive) return;

    // Calculate delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    drawBackground();

    // Update star speed based on time
    const elapsedTime = Date.now() - gameStartTime;
    const newDifficultyLevel = Math.floor(elapsedTime / SPEED_INCREASE_INTERVAL) + 1;
    
    if (newDifficultyLevel > difficultyLevel) {
        difficultyLevel = newDifficultyLevel;
        starSpeed = INITIAL_STAR_SPEED + (difficultyLevel - 1);
        // Spawn a burst of stars when difficulty increases
        for (let i = 0; i < 5; i++) {
            spawnStar();
        }
    }

    // Update basket position and trail
    updateBasketPosition();
    updateBasketTrail();

    // Spawn new stars randomly
    if (Math.random() < 0.02) {
        spawnStar();
    }

    // Update and draw stars
    updateStars();

    // Update and draw particles
    updateParticles();

    // Draw basket
    drawBasket();

    // Check for win condition
    if (score >= WINNING_SCORE) {
        endGame(true);
        return;
    }

    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update basket position with smooth movement
function updateBasketPosition() {
    // Calculate distance to target
    const dx = basket.targetX - basket.x;
    
    // Apply enhanced easing with momentum
    const easingFactor = Math.abs(dx) > 5 ? EASING * 1.5 : EASING;
    basket.x += dx * easingFactor;
    
    // Apply keyboard controls with enhanced acceleration
    if (keys['ArrowLeft'] || keys['a']) {
        basket.velocity = Math.max(-MAX_SPEED, basket.velocity - ACCELERATION * 1.2);
    } else if (keys['ArrowRight'] || keys['d']) {
        basket.velocity = Math.min(MAX_SPEED, basket.velocity + ACCELERATION * 1.2);
    } else {
        // Apply smoother deceleration when no keys are pressed
        if (basket.velocity > 0) {
            basket.velocity = Math.max(0, basket.velocity - DECELERATION);
        } else if (basket.velocity < 0) {
            basket.velocity = Math.min(0, basket.velocity + DECELERATION);
        }
    }
    
    // Update position with velocity and momentum
    basket.x += basket.velocity;
    
    // Keep basket within canvas bounds with smooth bouncing
    if (basket.x < 0) {
        basket.x = 0;
        basket.velocity *= -0.5; // Bounce effect
    } else if (basket.x > CANVAS_WIDTH - BASKET_WIDTH) {
        basket.x = CANVAS_WIDTH - BASKET_WIDTH;
        basket.velocity *= -0.5; // Bounce effect
    }
    
    // Update target position to match current position when using keyboard
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['d']) {
        basket.targetX = basket.x;
    }
}

// Spawn a new star
function spawnStar() {
    stars.push({
        x: Math.random() * (CANVAS_WIDTH - STAR_SIZE),
        y: -STAR_SIZE,
        size: STAR_SIZE
    });
}

// Update star positions and check collisions
function updateStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        
        // Move star down
        star.y += starSpeed;

        // Check if star is caught
        if (star.y + STAR_SIZE >= basket.y &&
            star.x + STAR_SIZE >= basket.x &&
            star.x <= basket.x + BASKET_WIDTH) {
            score++;
            updateScore();
            createParticles(star.x + STAR_SIZE/2, star.y + STAR_SIZE/2);
            stars.splice(i, 1);
            // Start catch animation
            basket.catchAnimation = CATCH_ANIMATION_DURATION;
            continue;
        }

        // Remove star if it goes off screen
        if (star.y > CANVAS_HEIGHT) {
            stars.splice(i, 1);
            continue;
        }

        // Draw star with glow effect
        drawStar(star.x, star.y);
    }
}

// Draw a star with glow effect
function drawStar(x, y) {
    // Draw glow
    const gradient = ctx.createRadialGradient(
        x + STAR_SIZE/2, y + STAR_SIZE/2, 0,
        x + STAR_SIZE/2, y + STAR_SIZE/2, STAR_SIZE
    );
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x + STAR_SIZE/2, y + STAR_SIZE/2, STAR_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Draw star
    ctx.beginPath();
    ctx.fillStyle = 'yellow';
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x1 = x + STAR_SIZE/2 * Math.cos(angle);
        const y1 = y + STAR_SIZE/2 * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(x1, y1);
        } else {
            ctx.lineTo(x1, y1);
        }
    }
    
    ctx.closePath();
    ctx.fill();
}

// Draw the basket with enhanced animations
function drawBasket() {
    ctx.save();
    
    // Draw basket trail
    if (basket.trail.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.moveTo(basket.trail[0].x + BASKET_WIDTH/2, basket.trail[0].y + BASKET_HEIGHT/2);
        
        for (let i = 1; i < basket.trail.length; i++) {
            ctx.lineTo(basket.trail[i].x + BASKET_WIDTH/2, basket.trail[i].y + BASKET_HEIGHT/2);
        }
        ctx.stroke();
    }
    
    // Apply catch animation
    if (basket.catchAnimation > 0) {
        const progress = basket.catchAnimation / CATCH_ANIMATION_DURATION;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        ctx.translate(basket.x + BASKET_WIDTH/2, basket.y + BASKET_HEIGHT/2);
        ctx.scale(scale, 2 - scale);
        ctx.translate(-(basket.x + BASKET_WIDTH/2), -(basket.y + BASKET_HEIGHT/2));
        basket.catchAnimation -= 16;
    }

    // Add tilt based on movement
    const tilt = basket.velocity * 0.02;
    ctx.translate(basket.x + BASKET_WIDTH/2, basket.y + BASKET_HEIGHT/2);
    ctx.rotate(tilt);
    ctx.translate(-(basket.x + BASKET_WIDTH/2), -(basket.y + BASKET_HEIGHT/2));

    // Draw bucket with enhanced effects
    const gradient = ctx.createLinearGradient(
        basket.x, basket.y,
        basket.x, basket.y + BASKET_HEIGHT
    );
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#654321');
    
    // Add glow effect
    ctx.shadowColor = 'rgba(255, 255, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(basket.x, basket.y);
    ctx.lineTo(basket.x + BASKET_WIDTH, basket.y);
    ctx.lineTo(basket.x + BASKET_WIDTH - 10, basket.y + BASKET_HEIGHT);
    ctx.lineTo(basket.x + 10, basket.y + BASKET_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Draw bucket rim with shine
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(basket.x, basket.y);
    ctx.lineTo(basket.x + BASKET_WIDTH, basket.y);
    ctx.stroke();

    // Draw bucket handle with enhanced shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(basket.x + BASKET_WIDTH/2, basket.y - 10, 15, Math.PI, 0);
    ctx.stroke();

    ctx.restore();
}

// Update basket trail
function updateBasketTrail() {
    basket.trail.push({ x: basket.x, y: basket.y });
    if (basket.trail.length > 10) {
        basket.trail.shift();
    }
}

// Create particles with enhanced effects
function createParticles(x, y) {
    const colors = ['#FFD700', '#FFA500', '#FF4500', '#FF6347'];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 4 + 2
        });
    }
}

// Update and draw particles with enhanced effects
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

// End game
function endGame(isWin) {
    gameActive = false;
    
    // Show game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        isWin ? 'You Win!' : 'Game Over!',
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 50
    );
    
    ctx.font = '24px Arial';
    ctx.fillText(
        `Final Score: ${score}`,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
    );
    
    // Show restart button
    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'block';
    restartButton.style.position = 'absolute';
    restartButton.style.left = '50%';
    restartButton.style.top = '60%';
    restartButton.style.transform = 'translate(-50%, -50%)';
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highScore').textContent = `High Score: ${highScore}`;
    }
}

// Start the game when the page loads
window.onload = init; 
