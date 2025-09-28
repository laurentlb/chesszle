const canvas = document.getElementById("chessBoard");
const ctx = canvas.getContext("2d");

const CELL_SIZE = 50; // Size of each cell in pixels


class Level {
    constructor({ width, height, par, grid, pieces }) {
        this.width = width;
        this.height = height;
        this.par = par;
        this.grid = grid.map(row => [...row]); // Deep copy of grid
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

let currentLevel = null;
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
        console.log("Rendering highlights for", selectedPiece);
        highlightValidMoves(selectedPiece);
    }
}

// Update the move count display
function updateMoveCount() {
    infoContainer.innerHTML = `Moves: ${moveHistory.length} / Par: ${currentLevel.par}`;
    restartButton.disabled = moveHistory.length === 0; // Enable restart only if history is not empty
}

// Function to check if the level is cleared
function isLevelCleared(level) {
    const firstValue = level.grid[0][0];
    return level.grid.every(row => row.every(cell => cell === firstValue));
}

// Update the level cleared message
function updateLevelClearedMessage() {
    if (currentLevel.isCleared()) {
        const currentLevelData = levels[currentLevelIndex];
        const moves = moveHistory.length;

        // Update the bestMoves if it's null or if the current moves are fewer
        if (currentLevelData.bestMoves === null || moves < currentLevelData.bestMoves) {
            currentLevelData.bestMoves = moves;
            updateLevelList();
        }

        nextLevelButton.style.display = "block"; // Show the "Next Level" button
        nextLevelButton.disabled = false; // Enable the "Next Level" button
    } else {
        nextLevelButton.style.display = "none"; // Hide the "Next Level" button
    }
}

let moveHistory = []; // Store the history of moves, including grid and pieces

const levels = [
    {
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
        ],
        bestMoves: null // Track the minimum number of moves
    },
    {
        width: 8,
        height: 8,
        par: 8,
        grid: [
            [1, 1, 1, 0, 0, 0, 0, 0],
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
        ],
        bestMoves: null // Track the minimum number of moves
    }
];

let currentLevelIndex = 0;

function loadLevel(levelData) {
    currentLevel = new Level(levelData); // Initialize currentLevel
    moveHistory = []; // Clear the undo list
    selectedPiece = null; // Deselect any selected piece
    updateMoveCount();
    render(currentLevel);
    updateLevelClearedMessage();
    updateCurrentLevelDisplay();
    updateLevelList(); // Update the level list display
}

function loadNextLevel() {
    if (currentLevelIndex < levels.length - 1) {
        currentLevelIndex++;
        loadLevel(levels[currentLevelIndex]);
    }
}

function updateCurrentLevelDisplay() {
    const currentLevel = levels[currentLevelIndex];
    // document.getElementById("currentLevel").textContent = `Level: ${currentLevelIndex + 1}`;
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
    if (targetX < 0 || targetX >= currentLevel.width || targetY < 0 || targetY >= currentLevel.height) {
        return false; // Out of bounds
    }

    // Check if the target square is a wall or occupied by another piece
    if (currentLevel.grid[targetY][targetX] === -1 || currentLevel.pieces.some(p => p.x === targetX && p.y === targetY)) {
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
        if (currentLevel.grid[y][x] === -1 || currentLevel.pieces.some(p => p.x === x && p.y === y)) {
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
        renderBoard(currentLevel);
        currentLevel.pieces.forEach(p => {
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
    currentLevel.updateGrid(x, y);
}

function updatePathColors(piece, targetX, targetY) {
    const visitedSquares = getVisitedSquares(piece, targetX, targetY);
    visitedSquares.forEach(({ x, y }) => {
        updateColor(x, y);
    });
}

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
    loadLevel(levels[currentLevelIndex]); // Load the initial level
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

// Function to undo the last move
function undoLastMove() {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    const { piece, previousX, previousY, grid, pieces } = lastMove;

    // Restore the grid and pieces
    currentLevel.grid = grid.map(row => [...row]); // Deep copy of the grid
    currentLevel.pieces = pieces.map(p => ({ ...p })); // Deep copy of all pieces

    // Update selectedPiece to match the restored piece on the board
    selectedPiece = currentLevel.getPieceAt(previousX, previousY);

    updateMoveCount(); // Update the display
    render(currentLevel); // Render the restored state
    updateLevelClearedMessage(); // Check if the level is cleared

    // Disable the undo button if no moves are left
    if (moveHistory.length === 0) {
        undoButton.disabled = true;
    }
}

// Modify the canvas click event to save move history
canvas.addEventListener("click", (event) => {
    const { x, y } = getClickCoordinates(event);

    if (currentLevel.isWall(x, y)) return;

    const pieceOnSquare = currentLevel.getPieceAt(x, y);
    if (pieceOnSquare) {
        if (selectedPiece === pieceOnSquare) {
            selectedPiece = null; // Deselect if the same piece is clicked
        } else {
            selectedPiece = pieceOnSquare;
        }
        render(currentLevel);
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
    for (let y = 0; y < currentLevel.height; y++) {
        for (let x = 0; x < currentLevel.width; x++) {
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

        if (currentLevel.grid[y][x] === 1) {
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
        updateMoveCount();
        render(currentLevel);
        updateLevelClearedMessage();
    });
}

function saveMoveHistory(piece, targetX, targetY) {
    moveHistory.push({
        piece,
        previousX: piece.x,
        previousY: piece.y,
        grid: currentLevel.grid.map(row => [...row]), // Deep copy of the grid
        pieces: currentLevel.pieces.map(p => ({ ...p })) // Deep copy of all pieces
    });
    undoButton.disabled = false; // Enable the undo button
    updateMoveCount(); // Update the move count display
}

const restartButton = document.getElementById("restartButton");
const nextLevelButton = document.getElementById("nextLevelButton");

function restartLevel() {
    if (moveHistory.length > 0) {
        const firstState = moveHistory[0]; // Get the initial state
        currentLevel.grid = firstState.grid.map(row => [...row]); // Restore the grid
        currentLevel.pieces = firstState.pieces.map(p => ({ ...p })); // Restore the pieces
    }
    undoButton.disabled = true; // Disable the undo button
    selectedPiece = null; // Deselect any selected piece
    updateMoveCount(); // Update the move count display
    render(currentLevel); // Render the restored state
}

function loadNextLevel() {
    if (currentLevelIndex < levels.length - 1) {
        currentLevelIndex++;
        loadLevel(levels[currentLevelIndex]);
    }
}

function updateLevelList() {
    const levelList = document.getElementById("levelList");
    levelList.innerHTML = ""; // Clear the list

    levels.forEach((level, index) => {
        const isAccessible = index === 0 || levels[index - 1].bestMoves !== null;

        // Create the level card
        const levelCard = document.createElement("div");
        levelCard.className = "levelCard";
        levelCard.style.backgroundColor = isAccessible ? "#1e1e1e" : "#555";
        levelCard.style.color = isAccessible ? "#ffffff" : "#888";
        levelCard.style.cursor = isAccessible ? "pointer" : "not-allowed";

        // Highlight the current level
        if (index === currentLevelIndex) {
            levelCard.style.border = "2px solid #4caf50"; // Green border for the current level
        }

        if (isAccessible) {
            levelCard.addEventListener("click", () => {
                currentLevelIndex = index;
                loadLevel(levels[currentLevelIndex]);
            });
        }

        // Level number
        const levelNumber = document.createElement("h4");
        levelNumber.className = "levelNumber";
        levelNumber.textContent = `Level ${index + 1}`;

        // Best score and par
        const scoreInfo = document.createElement("p");
        scoreInfo.className = "levelScore";
        scoreInfo.innerHTML = `<strong>${level.bestMoves ?? "--"}</strong> / <strong>${level.par}</strong>`;
        if (level.bestMoves !== null && level.bestMoves <= level.par) {
            scoreInfo.style.color = "#4caf50"; // Green for par or better
        }

        // Append elements to the card
        levelCard.appendChild(levelNumber);
        levelCard.appendChild(scoreInfo);

        // Add the card to the grid
        levelList.appendChild(levelCard);
    });
}

// Attach event listeners to the buttons
restartButton.addEventListener("click", restartLevel);
nextLevelButton.addEventListener("click", loadNextLevel);
// Attach the undo button click event
undoButton.addEventListener("click", undoLastMove);

// Initialize the first level
loadLevel(levels[currentLevelIndex]);
undoButton.addEventListener("click", undoLastMove);

// Initialize the first level
loadLevel(levels[currentLevelIndex]);
