const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let lives = 3;
let gameOver = false;
let gamePaused = false; // Future use
let gameStarted = false;

let playerBullets = [];
let enemyBullets = [];
let enemies = [];

const gameFont = "'Press Start 2P', cursive";

// Player Ship
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 30,
    speed: 10,
    color: 'cyan',
    shootCooldown: 300, // milliseconds
    lastShotTime: 0
};

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Simple triangle shape for player
    // ctx.beginPath();
    // ctx.moveTo(player.x + player.width / 2, player.y);
    // ctx.lineTo(player.x, player.y + player.height);
    // ctx.lineTo(player.x + player.width, player.y + player.height);
    // ctx.closePath();
    // ctx.fillStyle = player.color;
    // ctx.fill();
}

// Player Bullets
const playerBulletProps = {
    width: 5,
    height: 15,
    speed: 12,
    color: 'yellow'
};

function fireBullet() {
    const currentTime = Date.now();
    if (currentTime - player.lastShotTime > player.shootCooldown) {
        playerBullets.push({
            x: player.x + player.width / 2 - playerBulletProps.width / 2,
            y: player.y - playerBulletProps.height,
            width: playerBulletProps.width,
            height: playerBulletProps.height,
            speed: playerBulletProps.speed,
            color: playerBulletProps.color
        });
        player.lastShotTime = currentTime;
    }
}

function drawPlayerBullets() {
    playerBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function updatePlayerBullets() {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.y -= bullet.speed;
        if (bullet.y + bullet.height < 0) {
            playerBullets.splice(i, 1);
        }
    }
}

// Enemies
const enemyProps = {
    width: 40,
    height: 30,
    color: 'magenta',
    rows: 4,
    cols: 8,
    gap: 15, // Gap between enemies
    moveSpeed: 1.5, // Horizontal speed
    moveDirection: 1, // 1 for right, -1 for left
    verticalDrop: 20, // How much they drop when hitting edge
    shootInterval: 1000, // ms, how often an enemy might shoot
    lastEnemyShotTime: 0,
    swoopChance: 0.001 // Chance per frame an enemy might swoop
};
let enemyFormationX = 50; // Initial X position of the formation
let enemyFormationY = 50; // Initial Y position of the formation

function createEnemies() {
    enemies = []; // Clear existing enemies
    for (let r = 0; r < enemyProps.rows; r++) {
        for (let c = 0; c < enemyProps.cols; c++) {
            enemies.push({
                x: c * (enemyProps.width + enemyProps.gap), // Relative to formation
                y: r * (enemyProps.height + enemyProps.gap), // Relative to formation
                width: enemyProps.width,
                height: enemyProps.height,
                color: enemyProps.color,
                alive: true,
                swooping: false,
                swoopTargetY: 0,
                swoopSpeed: 3
            });
        }
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemyFormationX + enemy.x, enemyFormationY + enemy.y, enemy.width, enemy.height);
        }
    });
}

function updateEnemies() {
    let hitEdge = false;
    enemyFormationX += enemyProps.moveSpeed * enemyProps.moveDirection;

    // Check if formation hits canvas edges
    for (const enemy of enemies) {
        if (enemy.alive) {
            const currentX = enemyFormationX + enemy.x;
            if (currentX + enemy.width > canvas.width || currentX < 0) {
                hitEdge = true;
                break;
            }
        }
    }

    if (hitEdge) {
        enemyProps.moveDirection *= -1; // Change direction
        enemyFormationY += enemyProps.verticalDrop; // Move down
        // Prevent moving too far down
        if (enemyFormationY + enemyProps.rows * (enemyProps.height + enemyProps.gap) > player.y - player.height) {
             // Optional: gameOver if enemies reach player height
             // gameOver = true;
        }
    }

    // Basic enemy shooting
    if (Date.now() - enemyProps.lastEnemyShotTime > enemyProps.shootInterval) {
        enemyFire();
        enemyProps.lastEnemyShotTime = Date.now();
    }

    // Basic swooping (simplified: just move down and up)
    enemies.forEach(enemy => {
        if(enemy.alive && !enemy.swooping && Math.random() < enemyProps.swoopChance) {
            enemy.swooping = true;
            enemy.swoopStartY = enemyFormationY + enemy.y; // Store original y
            enemy.swoopTargetY = canvas.height; // Swoop all the way down
        }

        if(enemy.swooping) {
            const actualEnemyY = enemyFormationY + enemy.y; // Current position in formation

            if (!enemy.returning) { // Moving down
                 enemy.y += enemy.swoopSpeed; // Relative y increases
                 if (enemyFormationY + enemy.y >= enemy.swoopTargetY) {
                     enemy.returning = true; // Start returning
                 }
            } else { // Moving up
                enemy.y -= enemy.swoopSpeed;
                if (enemyFormationY + enemy.y <= enemy.swoopStartY) { // Returned to original relative y
                    enemy.y = enemy.swoopStartY - enemyFormationY; // Reset relative y precisely
                    enemy.swooping = false;
                    enemy.returning = false;
                }
            }
        }
    });
}


// Enemy Bullets
const enemyBulletProps = {
    width: 5,
    height: 10,
    speed: 5,
    color: 'red'
};

function enemyFire() {
    const aliveEnemies = enemies.filter(e => e.alive && !e.swooping);
    if (aliveEnemies.length > 0) {
        const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
        const shootingEnemy = aliveEnemies[randomIndex];
        enemyBullets.push({
            x: enemyFormationX + shootingEnemy.x + shootingEnemy.width / 2 - enemyBulletProps.width / 2,
            y: enemyFormationY + shootingEnemy.y + shootingEnemy.height,
            width: enemyBulletProps.width,
            height: enemyBulletProps.height,
            speed: enemyBulletProps.speed,
            color: enemyBulletProps.color
        });
    }
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.y += bullet.speed;
        if (bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

// Collision Detection
function checkCollisions() {
    // Player bullets vs Enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (enemy.alive) {
                const enemyActualX = enemyFormationX + enemy.x;
                const enemyActualY = enemyFormationY + enemy.y;
                if (
                    bullet.x < enemyActualX + enemy.width &&
                    bullet.x + bullet.width > enemyActualX &&
                    bullet.y < enemyActualY + enemy.height &&
                    bullet.y + bullet.height > enemyActualY
                ) {
                    enemy.alive = false;
                    playerBullets.splice(i, 1);
                    score += 100;
                    // Check for win condition (all enemies defeated)
                    if (enemies.every(e => !e.alive)) {
                        // For now, just log or display a message, can implement next level later
                        console.log("All enemies defeated!");
                        // Could set a flag like `levelComplete = true;`
                        // And then in gameLoop, handle this state (e.g., show message, then createEnemies() again)
                         setTimeout(resetLevel, 2000); // Go to next wave after 2s
                    }
                    break; // Bullet can only hit one enemy
                }
            }
        }
    }

    // Enemy bullets vs Player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            enemyBullets.splice(i, 1);
            lives--;
            if (lives <= 0) {
                gameOver = true;
            }
            break;
        }
    }

    // Player vs Enemy (including swooping enemies)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.alive) {
            const enemyActualX = enemyFormationX + enemy.x;
            const enemyActualY = enemyFormationY + enemy.y;
            if (
                player.x < enemyActualX + enemy.width &&
                player.x + player.width > enemyActualX &&
                player.y < enemyActualY + enemy.height &&
                player.y + player.height > enemyActualY
            ) {
                enemy.alive = false; // Enemy also dies
                lives--;
                 if (lives <= 0) {
                    gameOver = true;
                }
                // Optional: Create an explosion effect or sound
                break;
            }
        }
    }
}


// Game UI & State
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = `16px ${gameFont}`;
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 20, 30);
}

function drawLives() {
    ctx.fillStyle = 'white';
    ctx.font = `16px ${gameFont}`;
    ctx.textAlign = 'right';
    ctx.fillText('Lives: ' + lives, canvas.width - 20, 30);
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = `30px ${gameFont}`;
    ctx.textAlign = 'center';
    ctx.fillText('ASTRO BLASTER X-9', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = `20px ${gameFont}`;
    ctx.fillText('Press ENTER to Start', canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = `14px ${gameFont}`;
    ctx.fillText('Left/Right Arrows to Move', canvas.width/2, canvas.height/2 + 60);
    ctx.fillText('Space to Shoot', canvas.width/2, canvas.height/2 + 90);

}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = `40px ${gameFont}`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillStyle = 'white';
    ctx.font = `20px ${gameFont}`;
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = `16px ${gameFont}`;
    ctx.fillText('Press ENTER to Restart', canvas.width / 2, canvas.height / 2 + 60);
}


function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = true; // Set to true after first start
    playerBullets = [];
    enemyBullets = [];
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 60;
    enemyFormationX = 50;
    enemyFormationY = 50;
    enemyProps.moveDirection = 1;
    createEnemies();
    gameLoop(); // Restart the loop
}

function resetLevel() {
    // Called when all enemies are defeated
    playerBullets = [];
    enemyBullets = [];
    enemyFormationX = 50;
    enemyFormationY = 50;
    enemyProps.moveDirection = 1;
    createEnemies(); // Create a new wave
    // Optionally increase difficulty (e.g., enemyProps.moveSpeed += 0.1;)
}


// Game Loop
function gameLoop() {
    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop); // Keep listening for start
        return;
    }

    if (gameOver) {
        drawGameOver();
        // Event listener for restart is handled globally
        return; // Stop game updates
    }

    // Clear canvas
    ctx.fillStyle = '#000020'; // Dark blue space background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Updates
    updatePlayerBullets();
    updateEnemyBullets();
    updateEnemies(); // Includes enemy movement and shooting logic
    checkCollisions();

    // Drawings
    drawPlayer();
    drawEnemies();
    drawPlayerBullets();
    drawEnemyBullets();
    drawScore();
    drawLives();

    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.addEventListener('keydown', (event) => {
    if (!gameStarted && event.key === 'Enter') {
        gameStarted = true;
        resetGame(); // Start the game properly
        return; // Prevent other key actions on this press
    }
    if (gameOver && event.key === 'Enter') {
        resetGame();
        return;
    }

    if (!gameOver && gameStarted) {
        if (event.key === 'ArrowLeft') {
            player.x -= player.speed;
        } else if (event.key === 'ArrowRight') {
            player.x += player.speed;
        } else if (event.key === ' ') { // Space bar
            event.preventDefault(); // Prevent page scrolling
            fireBullet();
        }

        // Prevent player from moving off-screen
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }
});

// Initial setup
// createEnemies(); // Now called in resetGame
gameLoop(); // Start the loop, which will initially show start screen
