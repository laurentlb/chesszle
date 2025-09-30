const canvas = document.getElementById("chessBoard");
const nextLevelButton = document.getElementById("nextLevelButton");
const levelSelectorButton = document.getElementById("levelSelectorButton");
const modalOverlay = document.getElementById("modalOverlay");
const ctx = canvas.getContext("2d");

const CELL_SIZE = 200; // Size of each cell in pixels


class Level {
    constructor({ width, height, par, grid, pieces }) {
        this.width = width;
        this.height = height;
        this.par = par;
        this.grid = grid.map(row => [...row]); // Deep copy of grid
        this.pieces = pieces.map(p => ({ ...p })); // Deep copy of pieces
        // Assign default color if not specified
        this.pieces.forEach(p => {
            if (!p.color) {
                p.color = "black";
            }
        });
    }

    getPieceAt(x, y) {
        return this.pieces.find(p => p.x === x && p.y === y);
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

    getVisitedSquares(piece, targetX, targetY) {
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

    updatePathColors(piece, targetX, targetY) {
        const visitedSquares = this.getVisitedSquares(piece, targetX, targetY);
        visitedSquares.forEach(({ x, y }) => {
            currentLevel.updateGrid(x, y);
        });
    }

    isValidMove(piece, targetX, targetY) {
        if (targetX < 0 || targetX >= currentLevel.width || targetY < 0 || targetY >= currentLevel.height) {
            return false; // Out of bounds
        }

        // Check if the target square is occupied by another piece
        if (currentLevel.pieces.some(p => p.x === targetX && p.y === targetY && p.color === piece.color)) {
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
        const visitedSquares = this.getVisitedSquares(piece, targetX, targetY);

        // Check if any visited square is occupied by another piece
        for (const { x, y } of visitedSquares) {
            if (currentLevel.pieces.some(p => p.x === x && p.y === y)) {
                return false;
            }
        }

        return true;
    }
}

let currentLevel = null;
let selectedPiece = null; // Currently selected piece
let currentTurn = "white"; // White starts the game
let moveHistory = []; // Store the history of moves, including grid and pieces
let currentLevelIndex = 0;

// Preload images for all piece types and board squares
function preloadImages() {
    const images = {};
    ["rook", "bishop", "knight"].forEach(type => {
        // Load black pieces
        const img = new Image();
        img.src = `img/${type}.svg`; // SVG files for black pieces
        images[type] = img;

        // Load white pieces
        const imgWhite = new Image();
        imgWhite.src = `img/${type}w.svg`; // SVG files for white pieces
        images[`${type}w`] = imgWhite;
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

            // Draw square using the appropriate image
            ctx.drawImage(squareImage, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

function drawPiece(piece, x, y) {
    const { type, color } = piece;
    const img = pieceImages[color === "white" ? `${type}w` : type]; // Use white or black piece image
    ctx.drawImage(img, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function render(level) {
    renderBoard(level);
    level.pieces.forEach(piece => {
        drawPiece(piece, piece.x, piece.y);
    });

    updateTurn();
    updateMoveCount();

    if (selectedPiece) {
        highlightValidMoves(selectedPiece);
    }
    nextLevelButton.disabled = !levels[currentLevelIndex].bestMoves;
}

// Update the move count display
function updateMoveCount() {
    const bestMoves = levels[currentLevelIndex].bestMoves;

    if (bestMoves) {
        parInfo.innerHTML = `${moveHistory.length} (${bestMoves})`;
        parInfo.title = `${moveHistory.length} moves (best score: ${bestMoves})`;
    } else {
        parInfo.innerHTML = `${moveHistory.length}`;
        parInfo.title = `${moveHistory.length} moves`;
    }

    const isPerfect = !!(bestMoves && bestMoves <= levels[currentLevelIndex].par);
    document.getElementById("perfectScore").style.display = isPerfect ? "block" : "none";
    parInfo.classList.toggle("bestScore", isPerfect);

    restartButton.disabled = moveHistory.length === 0; // Enable restart only if history is not empty
    undoButton.disabled = moveHistory.length === 0; // Enable undo only if history is not empty
}

// Update the level cleared message
function checkVictory() {
    if (currentLevel.isCleared()) {
        const currentLevelData = levels[currentLevelIndex];
        const moves = moveHistory.length;

        // Update the bestMoves if it's null or if the current moves are fewer
        if (!currentLevelData.bestMoves || moves < currentLevelData.bestMoves) {
            currentLevelData.bestMoves = moves;
            saveProgress(); // Save progress when the best score is updated
        }
        selectedPiece = null; // Deselect any selected piece
    }
}

function loadLevel(levelData) {
    currentLevel = new Level(levelData); // Initialize currentLevel
    moveHistory = []; // Clear the undo list
    selectedPiece = null; // Deselect any selected piece
    levelSelectorButton.textContent = `Level ${currentLevelIndex + 1}`;
    render(currentLevel);
}

function loadNextLevel() {
    if (currentLevelIndex < levels.length - 1) {
        currentLevelIndex++;
        loadLevel(levels[currentLevelIndex]);
    } else {
        toggleModal("congratulationsPopup", true); // Show the popup if it's the last level
    }
}

function animatePieceMove(piece, targetX, targetY, callback) {
    const startX = piece.x * CELL_SIZE;
    const startY = piece.y * CELL_SIZE;
    const endX = targetX * CELL_SIZE;
    const endY = targetY * CELL_SIZE;

    const frames = 10;
    let frame = 0;

    function step() {
        let progress = frame / frames;
        progress = progress * progress * (3.0 - 2.0 * progress);
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
            callback();
        }
    }

    step();
}

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
    if (moveHistory.length === 0) {
        return;
    }

    const lastMove = moveHistory.pop();
    const { previousX, previousY, grid, pieces } = lastMove;

    // Restore the grid and pieces
    currentLevel.grid = grid.map(row => [...row]); // Deep copy of the grid
    currentLevel.pieces = pieces.map(p => ({ ...p })); // Deep copy of all pieces

    // Update selectedPiece to match the restored piece on the board
    selectedPiece = currentLevel.getPieceAt(previousX, previousY);

    render(currentLevel); // Render the restored state
}

// Modify the canvas click event to save move history
canvas.addEventListener("click", (event) => {
    const { x, y } = getClickCoordinates(event);

    const pieceOnSquare = currentLevel.getPieceAt(x, y);
    if (selectedPiece && currentLevel.isValidMove(selectedPiece, x, y)) {
        handlePieceMove(selectedPiece, x, y);
    } else if (pieceOnSquare) {
        if (currentTurn && pieceOnSquare.color !== currentTurn) {
            selectedPiece = null; // Deselect if the piece color doesn't match the turn
        } else if (selectedPiece === pieceOnSquare) {
            selectedPiece = null; // Deselect if the same piece is clicked
        } else {
            selectedPiece = pieceOnSquare;
        }
        render(currentLevel);
    } else if (selectedPiece) {
        selectedPiece = null; // Deselect if clicked on an invalid square
        render(currentLevel);
    }
});

// Add event listener for mousemove to update the cursor style
canvas.addEventListener("mousemove", (event) => {
    const { x, y } = getClickCoordinates(event);
    const pieceOnSquare = currentLevel.getPieceAt(x, y);

    if (pieceOnSquare) {
        canvas.style.cursor = "pointer"; // Show clickable cursor
    } else if (selectedPiece && currentLevel.isValidMove(selectedPiece, x, y)) {
        canvas.style.cursor = "pointer"; // Show clickable cursor
    } else {
        canvas.style.cursor = "default"; // Default cursor
    }
});

function getClickCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; // Horizontal scaling factor
    const scaleY = canvas.height / rect.height; // Vertical scaling factor

    return {
        x: Math.floor((event.clientX - rect.left) * scaleX / CELL_SIZE),
        y: Math.floor((event.clientY - rect.top) * scaleY / CELL_SIZE),
    };
}

function highlightValidMoves(piece) {
    const validMoves = [];
    for (let y = 0; y < currentLevel.height; y++) {
        for (let x = 0; x < currentLevel.width; x++) {
            if (currentLevel.isValidMove(piece, x, y)) {
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

// Update the turn-switch logic to work after undo and restart, and ensure the turn is determined based on the number of moves modulo 2. Handle cases where only one color remains, and prevent selecting pieces of the wrong color.
function updateTurn() {
    const hasWhite = currentLevel.pieces.some(piece => piece.color === "white");
    const hasBlack = currentLevel.pieces.some(piece => piece.color === "black");

    if (hasWhite && hasBlack) {
        currentTurn = moveHistory.length % 2 === 0 ? "white" : "black"; // Determine turn based on move count
    } else {
        currentTurn = null; // No alternation needed if only one color remains
    }
    if (selectedPiece && currentTurn && selectedPiece.color !== currentTurn) {
        selectedPiece = null; // Deselect if the piece color doesn't match the turn
    }

    const display = document.getElementById("display-message");
    if (currentLevel.isCleared()) {
        display.textContent = "Level Cleared!";
        return;
    }
    display.textContent = currentTurn
        ? `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)} to play.`
        : "";
}

// Modify handlePieceMove to clear highlights after moving
function handlePieceMove(piece, targetX, targetY) {
    if (!currentLevel.isValidMove(piece, targetX, targetY)) {
        selectedPiece = null;
        render(currentLevel);
        return;
    }

    saveMoveHistory(piece);

    const targetPiece = currentLevel.getPieceAt(targetX, targetY);

    // If the target square has a piece of the opposite color, remove it
    if (targetPiece && targetPiece.color !== piece.color) {
        currentLevel.pieces = currentLevel.pieces.filter(p => p !== targetPiece);
    }

    animatePieceMove(piece, targetX, targetY, () => {
        // Update the color of the squares the piece moved through
        if (piece.type === "rook" || piece.type === "bishop") {
            currentLevel.updatePathColors(piece, targetX, targetY);
        }

        currentLevel.updateGrid(targetX, targetY);

        piece.x = targetX;
        piece.y = targetY;
        checkVictory();
        render(currentLevel);
    });
}

function saveMoveHistory(piece) {
    moveHistory.push({
        previousX: piece.x,
        previousY: piece.y,
        grid: currentLevel.grid.map(row => [...row]), // Deep copy of the grid
        pieces: currentLevel.pieces.map(p => ({ ...p })) // Deep copy of all pieces
    });
}

function restartLevel() {
    if (moveHistory.length > 0) {
        const firstState = moveHistory[0]; // Get the initial state
        currentLevel.grid = firstState.grid.map(row => [...row]); // Restore the grid
        currentLevel.pieces = firstState.pieces.map(p => ({ ...p })); // Restore the pieces
    }
    loadLevel(currentLevel); // Reload the current level to reset state
}

// Show or hide the level selector modal
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.style.display = "block";
        modalOverlay.style.display = "block";
    } else {
        modal.style.display = "none";
        modalOverlay.style.display = "none";
    }
}

// Populate the level list in the modal
function populateLevelList() {
    const levelList = document.getElementById("levelList");
    levelList.innerHTML = ""; // Clear the list

    levels.forEach((level, index) => {
        const isAccessible = index === 0 || levels[index - 1].bestMoves || levels[index].bestMoves;

        // Create the level card
        const levelCard = document.createElement("div");
        levelCard.className = "levelCard";

        // Highlight the current level
        if (index === currentLevelIndex) {
            levelCard.classList.add("current");
        }

        // Level number
        const levelNumber = document.createElement("div");
        levelNumber.className = "levelNumber";
        levelNumber.textContent = `${index + 1}`;
        levelCard.appendChild(levelNumber);

        if (isAccessible) {
            levelCard.addEventListener("click", () => {
                currentLevelIndex = index;
                loadLevel(levels[currentLevelIndex]);
                toggleModal("levelSelectorModal", false); // Close the modal after selecting a level
            });

            // Best score
            const scoreInfo = document.createElement("div");
            scoreInfo.className = "score";
            scoreInfo.textContent = `${level.bestMoves ?? "--"}`;
            if (level.bestMoves !== null && level.bestMoves <= level.par) {
                const star = document.createElement("div");
                star.textContent = "★";
                star.classList.add("perfect");
                levelCard.appendChild(star);
                levelCard.classList.add("bestScore");
            }

            // Append elements to the card
            levelCard.appendChild(scoreInfo);

        } else {
            levelCard.classList.add("disabled");
        }

        // Add the card to the grid
        levelList.appendChild(levelCard);
    });
}


function editor(pieces) {
    currentLevel.id = "editor-level"; // Assign a unique ID for the editor level
    // Create a blank grid
    const blankGrid = Array.from({ length: currentLevel.height }, () =>
        Array(currentLevel.width).fill(0)
    );

    // Reset the current level with the blank grid and provided pieces
    currentLevel.grid = blankGrid;
    currentLevel.pieces = pieces.map(p => ({ ...p })); // Deep copy of pieces

    moveHistory = []; // Clear the move history
    selectedPiece = null; // Deselect any selected piece

    updateMoveCount(); // Update the move count display
    render(currentLevel); // Render the blank board with the new pieces
}

// Save the current level as compact JSON
function editorSave() {
    const levelData = {
        id: `level-${Date.now()}`, // Generate a unique ID using the current timestamp
        width: currentLevel.width,
        height: currentLevel.height,
        par: moveHistory.length, // Set par to the current number of moves
        grid: currentLevel.grid, // Current grid state
        pieces: moveHistory[0].pieces
    };

    console.log(formatLevelCompact(levelData));
    return JSON.stringify(levelData, null, 0); // Compact JSON
}

// Save progress to session storage
function saveProgress() {
    const progress = levels.map(level => ({
        id: level.id,
        bestMoves: level.bestMoves
    }));
    sessionStorage.setItem("chesszleProgress", JSON.stringify(progress));
}

// Load progress from session storage
function loadProgress() {
    const progress = JSON.parse(sessionStorage.getItem("chesszleProgress")) || [];
    progress.forEach(savedLevel => {
        const level = levels.find(l => l.id === savedLevel.id);
        if (level) {
            level.bestMoves = savedLevel.bestMoves;
        }
    });
    // find the first incomplete level
    currentLevelIndex = levels.findIndex(level => !level.bestMoves);
    if (currentLevelIndex === -1) {
        currentLevelIndex = levels.length - 1; // All levels completed, stay on the last level
    }
}

// Call loadProgress when the page loads
loadProgress();

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

// Event listeners
levelSelectorButton.addEventListener("click", () => {
    populateLevelList();
    toggleModal("levelSelectorModal", true);
});

modalOverlay.addEventListener("click", () => {
    toggleModal("levelSelectorModal", false);
    toggleModal("congratulationsPopup", false);
});
undoButton.addEventListener("click", undoLastMove);
document.getElementById("restartButton").addEventListener("click", restartLevel);
nextLevelButton.addEventListener("click", loadNextLevel);
