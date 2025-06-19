const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player properties
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 15 // Increased speed for better responsiveness
};

// Obstacle properties
let obstacles = [];
let obstacleSpawnCounter = 0;
const obstacleSpawnInterval = 120; // Spawn new obstacle every 120 frames

// Game state
let score = 0;
let gameOver = false;

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function movePlayer(event) {
    if (gameOver) return;

    if (event.key === 'ArrowLeft') {
        player.x -= player.speed;
    } else if (event.key === 'ArrowRight') {
        player.x += player.speed;
    }

    // Prevent player from moving outside canvas boundaries
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

function spawnObstacle() {
    obstacleSpawnCounter++;
    if (obstacleSpawnCounter >= obstacleSpawnInterval) {
        obstacleSpawnCounter = 0;
        const minWidth = 30;
        const maxWidth = 100;
        const width = Math.random() * (maxWidth - minWidth) + minWidth;
        const x = Math.random() * (canvas.width - width);
        obstacles.push({
            x: x,
            y: 0, // Start at the top
            width: width,
            height: 20,
            color: 'red',
            speed: 3 + Math.random() * 2 // Random speed between 3 and 5
        });
    }
}

function updateObstacles() {
    if (gameOver) return;

    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacle.speed;

        // If obstacle goes off-screen, remove it and potentially spawn a new one (or reset)
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1); // Remove obstacle
            // To maintain a certain number of obstacles or continuous flow,
            // you might want to ensure a new one is spawned soon after.
            // For this version, spawnObstacle handles adding new ones periodically.
        }
    });
}


function detectCollision() {
    if (gameOver) return;

    obstacles.forEach(obstacle => {
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            gameOver = true;
        }
    });
}

function updateScore() {
    if (gameOver) return;
    // Increment score for every frame the game is running (or base it on time/distance)
    score++;
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 25);
}

function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
        // Stop the loop by not calling requestAnimationFrame
        return;
    }

    drawPlayer();
    spawnObstacle(); // Handles adding new obstacles based on its internal counter
    updateObstacles();
    drawObstacles();
    detectCollision();
    updateScore(); // Update score every frame
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Event listener for keydown
document.addEventListener('keydown', movePlayer);

// Initial call to start the game
gameLoop();
