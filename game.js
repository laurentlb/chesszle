const canvas = document.getElementById("chessBoard");
const ctx = canvas.getContext("2d");

const CELL_SIZE = 50; // Size of each cell in pixels

// Preload images for all piece types
function preloadImages() {
    const images = {};
    ["rook", "bishop", "knight", "wall"].forEach(type => {
        const img = new Image();
        img.src = `img/${type}.svg`;
        images[type] = img;
    });
    return images;
}

const pieceImages = preloadImages();

function getColor(value) {
    return COLORS[value === 0 ? 0 : 1];
}

function renderBoard(level) {
    const { width, height, grid } = level;
    canvas.width = width * CELL_SIZE;
    canvas.height = height * CELL_SIZE;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = grid[y][x];
            if (value === -1) {
                // Draw wall
                ctx.drawImage(pieceImages["wall"], x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                // Draw regular square
                ctx.fillStyle = getColor(value);
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawPiece(piece, x, y) {
    const { type, color } = piece;
    const img = pieceImages[type];
    ctx.drawImage(img, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function renderPieces(level) {
    const { pieces } = level;

    pieces.forEach(piece => {
        drawPiece(piece, piece.x, piece.y);
    });
}

let level1 = null; // Define level1 before using it
let moveCount = 0; // Initialize move counter

// Create a container to display move count and par
const infoContainer = document.createElement("div");
infoContainer.style.textAlign = "center";
infoContainer.style.marginBottom = "10px";
infoContainer.innerHTML = `Moves: ${moveCount} / Par: 0`;
canvas.parentNode.insertBefore(infoContainer, canvas);

// Create a container for the level cleared message
const levelClearedMessage = document.createElement("div");
levelClearedMessage.style.textAlign = "center";
levelClearedMessage.style.marginTop = "10px";
levelClearedMessage.style.color = "green";
levelClearedMessage.style.fontSize = "20px";
levelClearedMessage.style.display = "none"; // Initially hidden
levelClearedMessage.textContent = "Level Cleared!";
canvas.parentNode.insertBefore(levelClearedMessage, canvas.nextSibling);

// Update the move count display
function updateMoveCount() {
    infoContainer.innerHTML = `Moves: ${moveCount} / Par: ${level1.par}`;
}

// Function to check if the level is cleared
function isLevelCleared(level) {
    const firstValue = level.grid[0][0];
    return level.grid.every(row => row.every(cell => cell === firstValue));
}

// Update the level cleared message
function updateLevelClearedMessage(level) {
    if (isLevelCleared(level)) {
        levelClearedMessage.style.display = "block"; // Show the message
    } else {
        levelClearedMessage.style.display = "none"; // Hide the message
    }
}

function loadLevel(level) {
    moveCount = 0; // Reset move count when loading a new level
    level1 = level; // Assign the level to level1
    updateMoveCount(); // Update the display
    renderBoard(level);
    renderPieces(level);
    updateLevelClearedMessage(level); // Reset the level cleared message
}

// Update the move count display
function updateMoveCount() {
    infoContainer.innerHTML = `Moves: ${moveCount} / Par: ${level1.par}`;
}

function getVisitedSquares(piece, targetX, targetY) {
    const visited = [];
    const { x: startX, y: startY } = piece;

    if (piece.type === "rook") {
        if (startX === targetX) {
            // Vertical movement
            const [minY, maxY] = [startY, targetY].sort((a, b) => a - b);
            for (let y = minY + 1; y < maxY; y++) {
                visited.push({ x: startX, y });
            }
        } else if (startY === targetY) {
            // Horizontal movement
            const [minX, maxX] = [startX, targetX].sort((a, b) => a - b);
            for (let x = minX + 1; x < maxX; x++) {
                visited.push({ x, y: startY });
            }
        }
    } else if (piece.type === "bishop") {
        // Diagonal movement
        const dx = targetX > startX ? 1 : -1;
        const dy = targetY > startY ? 1 : -1;

        let x = startX + dx;
        let y = startY + dy;

        while (x !== targetX && y !== targetY) {
            visited.push({ x, y });
            x += dx;
            y += dy;
        }
    }

    return visited;
}

function isValidMove(piece, targetX, targetY) {
    if (targetX < 0 || targetX >= level1.width || targetY < 0 || targetY >= level1.height) {
        return false; // Out of bounds
    }
    const dx = Math.abs(targetX - piece.x);
    const dy = Math.abs(targetY - piece.y);

    // Check if the move is valid based on the piece type
    let valid = false;
    switch (piece.type) {
        case "rook":
            valid = dx === 0 || dy === 0; // Rook moves in straight lines
            break;
        case "bishop":
            valid = dx === dy; // Bishop moves diagonally
            break;
        case "knight":
            valid = (dx === 2 && dy === 1) || (dx === 1 && dy === 2); // Knight moves in "L" shape
            break;
        default:
            return false;
    }

    if (!valid) {
        return false;
    }

    // Get the squares visited during the move
    const visitedSquares = getVisitedSquares(piece, targetX, targetY);

    // Check if any visited square is a wall or occupied by another piece
    for (const { x, y } of visitedSquares) {
        if (level1.grid[y][x] === -1 || level1.pieces.some(p => p.x === x && p.y === y)) {
            return false;
        }
    }

    // Check if the target square is a wall or occupied by another piece
    if (level1.grid[targetY][targetX] === -1 || level1.pieces.some(p => p.x === targetX && p.y === targetY)) {
        return false;
    }

    return true;
}

function animatePieceMove(piece, targetX, targetY, callback) {
    const startX = piece.x * CELL_SIZE;
    const startY = piece.y * CELL_SIZE;
    const endX = targetX * CELL_SIZE;
    const endY = targetY * CELL_SIZE;

    const frames = 10;
    let frame = 0;

    function step() {
        const progress = frame / frames;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        // Clear the board and redraw everything except the moving piece
        renderBoard(level1);
        level1.pieces.forEach(p => {
            if (p !== piece) {
                drawPiece(p, p.x, p.y);
            }
        });

        // Draw the moving piece at its current position
        drawPiece(piece, currentX / CELL_SIZE, currentY / CELL_SIZE);

        frame++;
        if (frame <= frames) {
            requestAnimationFrame(step);
        } else {
            // Update the color of the squares the piece moved through
            if (piece.type === "rook" || piece.type === "bishop") {
                updatePathColors(piece, targetX, targetY);
            }

            piece.x = targetX;
            piece.y = targetY;
            updateColor(level1.grid, targetX, targetY, piece.color);

            callback();
        }
    }

    step();
}

const COLORS = {
    0: "#75481dff",
    1: "#c3c98dff"
};

// Remove the colorScheme event listener
// Remove the logic for other color schemes in getColor
function getColor(value) {
    return COLORS[value === 0 ? 0 : 1];
}

// Remove the sevenToOne checkbox logic
// Update the color of the squares the piece moved through
function updateColor(grid, x, y, color) {
    // Flip the color for binary scheme
    grid[y][x] = grid[y][x] === 0 ? 1 : 0;
}

function updatePathColors(piece, targetX, targetY) {
    const visitedSquares = getVisitedSquares(piece, targetX, targetY);
    visitedSquares.forEach(({ x, y }) => {
        updateColor(level1.grid, x, y, piece.color);
    });
}

// Example level
level1 = {
    "width": 8,
    "height": 8,
    "par": 8,
    "grid": [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 1, 0],
        [1, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 0]
    ],
    "pieces": [{ "type": "rook", "x": 0, "y": 0, "color": 1 }, { "type": "rook", "x": 7, "y": 6, "color": 4 }, { "type": "bishop", "x": 2, "y": 2, "color": 2 }, { "type": "bishop", "x": 2, "y": 3, "color": 2 }, { "type": "knight", "x": 4, "y": 4, "color": 4 }]
};

// Wait until images are loaded before loading the level
Promise.all(Object.values(pieceImages).map(img => { 
    return new Promise((resolve) => {
        if (img.complete) {
            resolve();
        } else {
            img.onload = resolve;
            img.onerror = resolve; // Proceed even if image fails to load
        }
    });
})).then(() => {
    loadLevel(level1); // Load the initial level
});

function formatLevelCompact(level) {
    let json = JSON.stringify(level, null, 4);
    // Postprocess to make arrays compact
    json = json.replace(/\[\s+([^\]]+?)\s+\]/g, (match, inner) => {
        return `[${inner.replace(/\s+/g, ' ')}]`;
    });
    return json;
}

document.getElementById("levelEditor").value = formatLevelCompact(level1);

document.getElementById("loadLevelButton").addEventListener("click", () => {
    try {
        const newLevel = JSON.parse(document.getElementById("levelEditor").value);
        loadLevel(newLevel); // Load the new level
    } catch (error) {
        alert("Invalid level format. Please ensure the JSON is correct.");
        console.error("Failed to load level:", error);
    }
});

let moveHistory = []; // Store the history of moves

// Create an undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.style.display = "block";
undoButton.style.margin = "10px auto";
undoButton.disabled = true; // Initially disabled
canvas.parentNode.insertBefore(undoButton, canvas);

// Function to undo the last move
function undoLastMove() {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    const { piece, previousX, previousY, previousGrid } = lastMove;

    // Restore the piece's position
    piece.x = previousX;
    piece.y = previousY;

    // Restore the grid state
    level1.grid = previousGrid;

    moveCount--; // Decrement the move count
    updateMoveCount(); // Update the display
    renderBoard(level1);
    renderPieces(level1);
    updateLevelClearedMessage(level1); // Check if the level is cleared

    // Disable the undo button if no moves are left
    if (moveHistory.length === 0) {
        undoButton.disabled = true;
    }
}

// Modify the canvas click event to save move history
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);

    // Prevent selecting or moving to a wall
    if (level1.grid[y][x] === -1) {
        return;
    }

    const pieceOnSquare = level1.pieces.find(p => p.x === x && p.y === y);
    if (pieceOnSquare) {
        selectedPiece = pieceOnSquare;
    } else if (selectedPiece) {
        // Attempt to move the selected piece
        if (isValidMove(selectedPiece, x, y)) {
            // Save the current state before making the move
            moveHistory.push({
                piece: selectedPiece,
                previousX: selectedPiece.x,
                previousY: selectedPiece.y,
                previousGrid: JSON.parse(JSON.stringify(level1.grid)) // Deep copy of the grid
            });

            undoButton.disabled = false; // Enable the undo button

            animatePieceMove(selectedPiece, x, y, () => {
                selectedPiece.x = x;
                selectedPiece.y = y;
                moveCount++; // Increment move count
                updateMoveCount(); // Update the display
                renderBoard(level1);
                renderPieces(level1);
                updateLevelClearedMessage(level1); // Check if the level is cleared
            });
        }
    }
});

// Attach the undo button click event
undoButton.addEventListener("click", undoLastMove);
