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
const PARTICLE_COUNT = 10; // Number of particles per catch
const ACCELERATION = 2.5; // Increased acceleration rate
const DECELERATION = 0.2; // Reduced deceleration for smoother movement
const MAX_SPEED = 25; // Increased maximum speed
const EASING = 0.15; // Increased easing for more responsive movement
const WINNING_SCORE = 200; // Score needed to win

// Game state
let canvas, ctx;
let basket = { 
    x: 0, 
    y: 0, 
    catchAnimation: 0, 
    velocity: 0,
    targetX: 0,
    scale: 1 
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

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
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

    // Update basket position with smooth movement
    updateBasketPosition();

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
    
    // Apply catch animation
    if (basket.catchAnimation > 0) {
        const progress = basket.catchAnimation / CATCH_ANIMATION_DURATION;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        ctx.translate(basket.x + BASKET_WIDTH/2, basket.y + BASKET_HEIGHT/2);
        ctx.scale(scale, 2 - scale);
        ctx.translate(-(basket.x + BASKET_WIDTH/2), -(basket.y + BASKET_HEIGHT/2));
        basket.catchAnimation -= 16;
    }

    // Add slight tilt based on movement
    const tilt = basket.velocity * 0.02;
    ctx.translate(basket.x + BASKET_WIDTH/2, basket.y + BASKET_HEIGHT/2);
    ctx.rotate(tilt);
    ctx.translate(-(basket.x + BASKET_WIDTH/2), -(basket.y + BASKET_HEIGHT/2));

    // Draw bucket body with gradient
    const gradient = ctx.createLinearGradient(
        basket.x, basket.y,
        basket.x, basket.y + BASKET_HEIGHT
    );
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#654321');
    
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

    // Draw bucket handle with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(basket.x + BASKET_WIDTH/2, basket.y - 10, 15, Math.PI, 0);
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.restore();
}

// Create particles for catch effect
function createParticles(x, y) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        const speed = 2 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: `hsl(${Math.random() * 60 + 30}, 100%, 50%)` // Yellow to orange
        });
    }
}

// Update and draw particles
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
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
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