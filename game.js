const canvas = document.getElementById("chessBoard");
const ctx = canvas.getContext("2d");

const CELL_SIZE = 50; // Size of each cell in pixels


class Level {
    constructor({ width, height, par, grid, pieces }) {
        this.width = width;
        this.height = height;
        this.par = par;
        this.grid = grid;
        this.pieces = pieces.map(p => ({ ...p })); // Deep copy of pieces
    }

    getPieceAt(x, y) {
        return this.pieces.find(p => p.x === x && p.y === y);
    }

    isWall(x, y) {
        return this.grid[y][x] === -1;
    }

    updateGrid(x, y) {
        this.grid[y][x] = this.grid[y][x] === 0 ? 1 : 0;
    }

    resetGrid(grid) {
        this.grid = grid.map(row => [...row]); // Deep copy of grid
    }

    isCleared() {
        const firstValue = this.grid[0][0];
        return this.grid.every(row => row.every(cell => cell === firstValue));
    }
}

// Replace level1 with an instance of Level
let level1 = new Level({
    width: 8,
    height: 8,
    par: 8,
    grid: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 1, 0],
        [1, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 0]
    ],
    pieces: [
        { type: "rook", x: 0, y: 0 },
        { type: "rook", x: 7, y: 6 },
        { type: "bishop", x: 2, y: 2 },
        { type: "bishop", x: 2, y: 3 },
        { type: "knight", x: 4, y: 4 }
    ]
});

let selectedPiece = null; // Currently selected piece

// Preload images for all piece types and board squares
function preloadImages() {
    const images = {};
    ["rook", "bishop", "knight", "wall"].forEach(type => {
        const img = new Image();
        img.src = `img/${type}.svg`; // SVG files for pieces and walls
        images[type] = img;
    });
    ["square_dark", "square_light"].forEach(type => {
        const img = new Image();
        img.src = `img/${type}.png`; // PNG files for board squares
        images[type] = img;
    });
    return images;
}

const pieceImages = preloadImages();

function renderBoard(level) {
    const { width, height, grid } = level;
    canvas.width = width * CELL_SIZE;
    canvas.height = height * CELL_SIZE;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = grid[y][x];
            const squareImage = value === 0 ? pieceImages["square_light"] : pieceImages["square_dark"];

            if (value === -1) {
                // Draw wall
                ctx.drawImage(pieceImages["wall"], x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                // Draw square using the appropriate image
                ctx.drawImage(squareImage, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawPiece(piece, x, y) {
    const { type } = piece;
    const img = pieceImages[type];
    ctx.drawImage(img, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function renderPieces(level) {
    const { pieces } = level;

    pieces.forEach(piece => {
        drawPiece(piece, piece.x, piece.y);
    });
}

function render(level) {
    renderBoard(level);
    renderPieces(level);
    if (selectedPiece) {
        highlightValidMoves(selectedPiece);
    }
}

let moveCount = 0; // Initialize move counter

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
function updateLevelClearedMessage() {
    if (level1.isCleared()) {
        levelClearedMessage.style.display = "block"; // Show the message
    } else {
        levelClearedMessage.style.display = "none"; // Hide the message
    }
}

function loadLevel(levelData) {
    moveCount = 0; // Reset move count when loading a new level
    level1 = new Level(levelData); // Create a new Level instance
    updateMoveCount();
    render(level1);
    updateLevelClearedMessage();
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

    // Check if the target square is a wall or occupied by another piece
    if (level1.grid[targetY][targetX] === -1 || level1.pieces.some(p => p.x === targetX && p.y === targetY)) {
        return false;
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
            updateColor(targetX, targetY, piece.color);

            callback();
        }
    }

    step();
}

// Update the color of the squares the piece moved through
function updateColor(x, y) {
    level1.updateGrid(x, y);
}

function updatePathColors(piece, targetX, targetY) {
    const visitedSquares = getVisitedSquares(piece, targetX, targetY);
    visitedSquares.forEach(({ x, y }) => {
        updateColor(x, y);
    });
}

// Example level
level1 = new Level({
    width: 8,
    height: 8,
    par: 8,
    grid: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 1, 0],
        [1, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 0]
    ],
    pieces: [
        { type: "rook", x: 0, y: 0 },
        { type: "rook", x: 7, y: 6 },
        { type: "bishop", x: 2, y: 2 },
        { type: "bishop", x: 2, y: 3 },
        { type: "knight", x: 4, y: 4 }
    ]
});

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

/*
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
*/

let moveHistory = []; // Store the history of moves

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
    updateLevelClearedMessage(); // Check if the level is cleared

    // Disable the undo button if no moves are left
    if (moveHistory.length === 0) {
        undoButton.disabled = true;
    }
}

// Modify the canvas click event to save move history
canvas.addEventListener("click", (event) => {
    const { x, y } = getClickCoordinates(event);

    if (level1.isWall(x, y)) return;

    const pieceOnSquare = level1.getPieceAt(x, y);
    if (pieceOnSquare) {
        if (selectedPiece === pieceOnSquare) {
            selectedPiece = null; // Deselect if the same piece is clicked
        } else {
            selectedPiece = pieceOnSquare;
        }
        render(level1);
    } else if (selectedPiece) {
        handlePieceMove(selectedPiece, x, y);
    }
});

function getClickCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor((event.clientX - rect.left) / CELL_SIZE),
        y: Math.floor((event.clientY - rect.top) / CELL_SIZE),
    };
}

function highlightValidMoves(piece) {
    const validMoves = [];
    for (let y = 0; y < level1.height; y++) {
        for (let x = 0; x < level1.width; x++) {
            if (isValidMove(piece, x, y)) {
                validMoves.push({ x, y });
            }
        }
    }

    // Draw small circles to indicate valid moves
    validMoves.forEach(({ x, y }) => {
        const centerX = x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 6;

        if (level1.grid[y][x] === 1) {
            ctx.fillStyle = "rgba(54, 135, 107, 0.8)"; // Semi-transparent green
        } else {
            ctx.fillStyle = "rgba(90, 129, 121, 0.8)"; // Semi-transparent green
        }
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Modify handlePieceMove to clear highlights after moving
function handlePieceMove(piece, targetX, targetY) {
    if (!isValidMove(piece, targetX, targetY)) return;

    saveMoveHistory(piece, targetX, targetY);

    animatePieceMove(piece, targetX, targetY, () => {
        piece.x = targetX;
        piece.y = targetY;
        moveCount++;
        updateMoveCount();
        render(level1);
        updateLevelClearedMessage();
    });
}

function saveMoveHistory(piece, targetX, targetY) {
    moveHistory.push({
        piece,
        previousX: piece.x,
        previousY: piece.y,
        previousGrid: level1.grid.map(row => [...row]), // Deep copy of grid
    });
    undoButton.disabled = false; // Enable the undo button
}

// Attach the undo button click event
undoButton.addEventListener("click", undoLastMove);
