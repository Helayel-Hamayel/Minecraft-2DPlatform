//--------------------------------------------
// Global values
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let isPaused = false;
let waterTickCounter = 0;

ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

// Game configuration
//Extract/recieve the values, fallback to defaults if they are missing or corrupt
const urlParams = new URLSearchParams(window.location.search);

const BLOCK_SIZE = 32; 
const GRID_HEIGHT = parseInt(urlParams.get('height')) || 32;
const WORLD_WIDTH = parseInt(urlParams.get('width')) || 86;
const SELECTED_BIOME = urlParams.get('biome') || 'Meadow';
console.log(`Loading ${SELECTED_BIOME} with size: ${WORLD_WIDTH}x${GRID_HEIGHT}`);

// Engine settings
const settings = {
    lowLagMode: false 
};

// Block Types Mapping
const BLOCKS = { 
    AIR:        0, 
    GRASS:      1, 
    DIRT:       2, 
    STONE:      3, 
    COAL:       4, 
    IRON:       5, 
    WOOD:       6, 
    LEAVES:     7, 
    BEDROCK:    8, 
    WORLDEDGE:  9, 
    DIAMOND:    10, 
    WATER:      11,
};

const COLORS = {
    [BLOCKS.AIR]: "transparent",
    [BLOCKS.GRASS]: "#5cc447",
    [BLOCKS.DIRT]: "#85542a",
    [BLOCKS.STONE]: "#737373",
    [BLOCKS.COAL]: "#2b2b2b",
    [BLOCKS.IRON]: "#d49b6a",
    [BLOCKS.WOOD]: "#a66a38",
    [BLOCKS.LEAVES]: "#318521",
    [BLOCKS.BEDROCK]: "#404040",
    [BLOCKS.WORLDEDGE]: "#00bcff",
    [BLOCKS.DIAMOND]: "#33e3c2",
    [BLOCKS.WATER]: "rgb(40, 100, 230)",
};

const IMAGES = {
    [BLOCKS.GRASS]: new Image(),
    [BLOCKS.DIRT]: new Image(),
    [BLOCKS.STONE]: new Image(),
    [BLOCKS.COAL]: new Image(),
    [BLOCKS.IRON]: new Image(),
    [BLOCKS.WOOD]: new Image(),
    [BLOCKS.LEAVES]: new Image(),
    [BLOCKS.BEDROCK]: new Image(),
    [BLOCKS.WORLDEDGE]: new Image(),
    [BLOCKS.DIAMOND]: new Image(),
    [BLOCKS.WATER]: new Image(),
};

// Set paths for every single block type
IMAGES[BLOCKS.GRASS].src = "assets/images/texture/block/grass_block_side.png";
IMAGES[BLOCKS.DIRT].src  = "assets/images/texture/block/dirt.png";
IMAGES[BLOCKS.STONE].src = "assets/images/texture/block/stone.png";
IMAGES[BLOCKS.COAL].src  = "assets/images/texture/block/coal_ore.png";
IMAGES[BLOCKS.IRON].src  = "assets/images/texture/block/iron_ore.png";
IMAGES[BLOCKS.WOOD].src  = "assets/images/texture/block/oak_log.png";
IMAGES[BLOCKS.LEAVES].src = "assets/images/texture/block/oak_leaves.png";
IMAGES[BLOCKS.BEDROCK].src = "assets/images/texture/block/bedrock.png";
IMAGES[BLOCKS.WORLDEDGE].src = "assets/images/texture/block/forceField.png";
IMAGES[BLOCKS.DIAMOND].src = "assets/images/texture/block/diamond_ore.png";
IMAGES[BLOCKS.WATER].src = "assets/images/texture/block/water.png";

const LOADED_IMAGES = {};
Object.keys(IMAGES).forEach(key => {
    LOADED_IMAGES[key] = false;
    IMAGES[key].onload = () => {
        LOADED_IMAGES[key] = true;
    };
});

// --- PLAYER SETUP ---
const player = {
    x: 100,
    y: 100,
    width: 32,      
    height: 96, // 3 blocks tall
    vx: 0,
    vy: 0,
    speed: 3,
    gravity: 0.3,
    jumpForce: -9,
    grounded: false,
    lastJumpTime: 0 
};

const PLAYER_PIXELS = [
    "#eeb692", 
    "#00afac", 
    "#463ba4"  
];

// --- CAMERA SETUP ---
const camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

// --- CLOUD SYSTEM ---
const clouds = [];

// --- MOUSE TRACKING ---
const mouse = { 
    x: 0, 
    y: 0, 
    worldX: 0, 
    worldY: 0, 
    isLeftClicked: false, 
    isRightClicked: false,
    targetCol: -1,
    targetRow: -1,
    breakProgress: 0 
};

//--------------------------------------------

// this disables menu poping up when you Right click
window.addEventListener("contextmenu", e => e.preventDefault());

// detect which mouse button is pressed
// 0 is for Left Mouse Button.
// 2 is for Right Mouse Button.
window.addEventListener("mousedown", e => {
    if (e.button === 0) mouse.isLeftClicked = true;
    if (e.button === 2) mouse.isRightClicked = true;
});

// detect which mouse button is released
window.addEventListener("mouseup", e => {
    if (e.button === 0) {
        //if you stop clicking a block halfway through breaking it, 
        //the cracks vanish and you have to start over.
        mouse.isLeftClicked = false; 
        mouse.breakProgress = 0; 
    }
    if (e.button === 2) mouse.isRightClicked = false;
});

// Tracks the mouse position inside the game box to enforce the player's build and mine reach limits.
window.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

//--------------------------------------------
// Clouds, spawn them and move them across the screen
function spawnClouds() {
    for (let i = 0; i < 30; i++) {
        clouds.push({
            x: Math.random() * (WORLD_WIDTH * BLOCK_SIZE),
            y: Math.random() * 120 + 20, 
            width: Math.random() * 80 + 60,
            height: Math.random() * 20 + 15,
            speed: Math.random() * 0.2 + 0.1 
        });
    }
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > WORLD_WIDTH * BLOCK_SIZE) {
            cloud.x = -cloud.width;
        }
    });
}

//--------------------------------------------
// Procedural generated world
const world = Array.from({ length: WORLD_WIDTH }, () => new Array(GRID_HEIGHT).fill(BLOCKS.AIR));

function generateWorld() {
    for (let col = 0; col < WORLD_WIDTH; col++) {
        if (col === 0 || col === WORLD_WIDTH - 1) {
            for (let row = 0; row < GRID_HEIGHT; row++) {
                world[col][row] = BLOCKS.WORLDEDGE;
            }
            continue;
        }

        const floorRow = Math.floor(12 + Math.sin(col * 0.1) * 3);
        
        for (let row = 0; row < GRID_HEIGHT; row++) {
            if (row === GRID_HEIGHT - 1) {
                world[col][row] = BLOCKS.BEDROCK;
            } 
            else if (col >= 15 && col <= 20) {
                if (row === floorRow) {
                    world[col][row] = BLOCKS.WATER; 
                } else if (row === floorRow + 1) {
                    if (col === 15 || col === 20) {
                        world[col][row] = BLOCKS.DIRT; 
                    } else {
                        world[col][row] = BLOCKS.WATER; 
                    }
                } else if (row === floorRow + 2) {
                    world[col][row] = BLOCKS.DIRT; 
                } else if (row > floorRow + 2 && row < floorRow + 5) {
                    world[col][row] = BLOCKS.DIRT; 
                } else if (row >= floorRow + 5) {
                    const rand = Math.random();
                    if (row > 22 && rand < 0.02) world[col][row] = BLOCKS.DIAMOND;
                    else if (rand < 0.05) world[col][row] = BLOCKS.COAL;
                    else if (rand < 0.08) world[col][row] = BLOCKS.IRON;
                    else world[col][row] = BLOCKS.STONE;
                }
            } 
            else {
                if (row === floorRow) {
                    world[col][row] = BLOCKS.GRASS;
                } else if (row > floorRow && row < floorRow + 4) {
                    world[col][row] = BLOCKS.DIRT;
                } else if (row >= floorRow + 4) {
                    const rand = Math.random();
                    if (row > 22 && rand < 0.02) world[col][row] = BLOCKS.DIAMOND;
                    else if (rand < 0.05) world[col][row] = BLOCKS.COAL;
                    else if (rand < 0.08) world[col][row] = BLOCKS.IRON;
                    else world[col][row] = BLOCKS.STONE;
                }
            }
        }

        if (col > 6 && col < WORLD_WIDTH - 6 && (col < 13 || col > 22)) {
            if (Math.random() < 0.15 && world[col-1][floorRow] === BLOCKS.GRASS && world[col][floorRow] === BLOCKS.GRASS) {
                world[col][floorRow - 1] = BLOCKS.WOOD;
                world[col][floorRow - 2] = BLOCKS.WOOD;
                world[col][floorRow - 3] = BLOCKS.WOOD;
                
                for (let lX = -1; lX <= 1; lX++) {
                    world[col + lX][floorRow - 4] = BLOCKS.LEAVES;
                    world[col + lX][floorRow - 5] = BLOCKS.LEAVES;
                }
                world[col][floorRow - 6] = BLOCKS.LEAVES;
            }
        }
    }
}

//--------------------------------------------
// Inputs
// L : Toggle to swap between textures and flat colors
// ESC: Pause the game
const keys = {};
window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "KeyL") settings.lowLagMode = !settings.lowLagMode;

    if (e.code === "Escape") {
        playSfx(1);
        isPaused = !isPaused;
        const menu = document.getElementById("gameMenu");
        if (isPaused) menu.classList.add("active");
        else menu.classList.remove("active");
    }
});

//When Esc is pressed, and user picks Return to game.
document.getElementById("btgButton").addEventListener("click", (e) => {
    e.preventDefault(); 
    isPaused = false;
    document.getElementById("gameMenu").classList.remove("active");
});

//--------------------------------------------
// Collison detection
function checkCollision(x, y, isFalling = false, isCrouching = false) {
    const startCol = Math.floor(x / BLOCK_SIZE);
    const endCol = Math.floor((x + player.width) / BLOCK_SIZE);
    const startRow = Math.floor(y / BLOCK_SIZE);
    const endRow = Math.floor((y + player.height) / BLOCK_SIZE);

    for (let col = startCol; col <= endCol; col++) {
        for (let row = startRow; row <= endRow; row++) {
            if (world[col] && world[col][row] !== BLOCKS.AIR) {
                const block = world[col][row];

                if (block === BLOCKS.WOOD || block === BLOCKS.LEAVES || block === BLOCKS.WATER) {
                    if (block === BLOCKS.WATER) continue;
                    if (!isFalling || isCrouching) continue; 
                    
                    const blockTopY = row * BLOCK_SIZE;
                    if (player.y + player.height - player.vy > blockTopY + 4) continue; 
                }
                return true; 
            }
        }
    }
    return false;
}

//--------------------------------------------
// Water
function updateWater() {
    for (let row = GRID_HEIGHT - 2; row >= 0; row--) {
        for (let col = 1; col < WORLD_WIDTH - 1; col++) {
            if (world[col][row] === BLOCKS.WATER) {
                if (world[col][row + 1] === BLOCKS.AIR) {
                    world[col][row + 1] = BLOCKS.WATER;
                    world[col][row] = BLOCKS.AIR; 
                } 
                else if (world[col][row + 1] !== BLOCKS.WATER) {
                    const spreadLeft = world[col - 1][row] === BLOCKS.AIR;
                    const spreadRight = world[col + 1][row] === BLOCKS.AIR;

                    if (spreadLeft && spreadRight) {
                        if (Math.random() < 0.5) world[col - 1][row] = BLOCKS.WATER;
                        else world[col + 1][row] = BLOCKS.WATER;
                    } else if (spreadLeft) {
                        world[col - 1][row] = BLOCKS.WATER;
                    } else if (spreadRight) {
                        world[col + 1][row] = BLOCKS.WATER;
                    }
                }
            }
        }
    }
}

//--------------------------------------------
// Engine setup and update
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = Math.min(GRID_HEIGHT * BLOCK_SIZE, window.innerHeight);
    camera.width = canvas.width;
    camera.height = canvas.height; 
}

function update() {
    player.vx = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) player.vx = -player.speed;
    if (keys["KeyD"] || keys["ArrowRight"]) player.vx = player.speed;

    player.x += player.vx;

    if (checkCollision(player.x, player.y, false, false)) {
        if (player.vx > 0) {
            const rightCol = Math.floor((player.x + player.width) / BLOCK_SIZE);
            player.x = (rightCol * BLOCK_SIZE) - player.width - 0.01;
        } else if (player.vx < 0) {
            const leftCol = Math.floor(player.x / BLOCK_SIZE);
            player.x = (leftCol + 1) * BLOCK_SIZE + 0.01;
        }
        player.vx = 0; 
    }

    player.vy += player.gravity;
    player.y += player.vy;
    player.grounded = false;

    const crouching = keys["KeyS"] || keys["ArrowDown"];
    if (checkCollision(player.x, player.y, true, crouching)) {
        player.y -= player.vy;
        if (player.vy > 0) player.grounded = true; 
        player.vy = 0;
    }

    if ((keys["Space"] || keys["KeyW"] || keys["ArrowUp"]) && player.grounded) {
        const currentTime = Date.now();
        if (currentTime - player.lastJumpTime >= 450) {
            player.vy = player.jumpForce;
            player.grounded = false;
            player.lastJumpTime = currentTime; 
        }
    }

    waterTickCounter++;
    if (waterTickCounter >= 5) {
        updateWater();
        waterTickCounter = 0;
    }

    updateClouds();

    camera.x = player.x - camera.width / 2 + player.width / 2;
    camera.y = player.y - camera.height / 2 + player.height / 2;

    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH * BLOCK_SIZE - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, GRID_HEIGHT * BLOCK_SIZE - camera.height));

    mouse.worldX = mouse.x + camera.x;
    mouse.worldY = mouse.y + camera.y; 

    const mouseCol = Math.floor(mouse.worldX / BLOCK_SIZE);
    const mouseRow = Math.floor(mouse.worldY / BLOCK_SIZE);

    if (mouseCol >= 0 && mouseCol < WORLD_WIDTH && mouseRow >= 0 && mouseRow < GRID_HEIGHT) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const blockCenterX = (mouseCol * BLOCK_SIZE) + BLOCK_SIZE / 2;
        const blockCenterY = (mouseRow * BLOCK_SIZE) + BLOCK_SIZE / 2;

        const distance = Math.hypot(blockCenterX - playerCenterX, blockCenterY - playerCenterY);
        const reachLimit = BLOCK_SIZE * 3.5;

        if (distance <= reachLimit) {
            const targetBlock = world[mouseCol][mouseRow];
            const activeItem = hotbarState[activeSlotIndex];

            // --- LEFT CLICK: MINING & SIMPLE COLLECTION ---
            if (mouse.isLeftClicked && targetBlock !== BLOCKS.AIR && targetBlock !== BLOCKS.BEDROCK && targetBlock !== BLOCKS.WORLDEDGE && targetBlock !== BLOCKS.WATER) {
                const activeId = activeItem ? activeItem.id : null;

                let dropId = null;
                let dropName = null;
                let requiredTool = null;
                let isDestroyedCompletely = false;

                // Determine what drop and tool are needed
                if (targetBlock === BLOCKS.STONE) {
                    dropId = "stone"; 
                    dropName = "Cobblestone";
                    requiredTool = "pickaxe";
                } else if (targetBlock === BLOCKS.COAL || targetBlock === BLOCKS.IRON || targetBlock === BLOCKS.DIAMOND) {
                    let oreName = Object.keys(BLOCKS).find(key => BLOCKS[key] === targetBlock);
                    dropId = oreName.toLowerCase();
                    dropName = oreName.charAt(0) + oreName.slice(1).toLowerCase() + " Ore";
                    requiredTool = "pickaxe";
                } else if (targetBlock === BLOCKS.GRASS || targetBlock === BLOCKS.DIRT) {
                    dropId = "dirt"; 
                    dropName = "Dirt";
                    requiredTool = "shovel";
                } else if (targetBlock === BLOCKS.WOOD) {
                    dropId = "wood";
                    dropName = "Oak Log";
                    requiredTool = "axe";
                } else if (targetBlock === BLOCKS.LEAVES) {
                    dropId = "leaves";
                    dropName = "Leaves";
                    // If using an axe on leaves, destroy it completely with zero drops
                    if (activeId === "axe") {
                        isDestroyedCompletely = true;
                    }
                }

                // If tool mismatch (and block requires a tool), freeze everything
                if (requiredTool && requiredTool !== activeId) {
                    mouse.breakProgress = 0; 
                } else {
                    if (mouse.targetCol !== mouseCol || mouse.targetRow !== mouseRow) {
                        mouse.targetCol = mouseCol;
                        mouse.targetRow = mouseRow;
                        mouse.breakProgress = 0;
                    }

                    mouse.breakProgress += 2.5; 

                    if (mouse.breakProgress >= 100) {
                        // Only generate and pick up inventory item if it wasn't destroyed completely
                        if (!isDestroyedCompletely) {
                            let correspondingBlockId = targetBlock;
                            if (targetBlock === BLOCKS.GRASS) correspondingBlockId = BLOCKS.DIRT; 

                            let existingItem = hotbarState.find(item => item && item.id === dropId);
                            
                            if (existingItem) {
                                existingItem.count++;
                            } else {
                                let emptyIndex = hotbarState.findIndex(item => item === null);
                                if (emptyIndex !== -1) {
                                    // let blockImgSrc = IMAGES[correspondingBlockId].src;
                                    let blockImgSrc = (targetBlock === BLOCKS.STONE) 
                                    ? "assets/images/texture/block/cobblestone.png" 
                                    : IMAGES[correspondingBlockId].src;
                                    hotbarState[emptyIndex] = new Item(dropId, dropName, blockImgSrc, correspondingBlockId, true);
                                }
                            }
                        }

                        world[mouseCol][mouseRow] = BLOCKS.AIR; 
                        mouse.breakProgress = 0;
                        renderHotbar(); 
                    }
                }
            }

            // --- RIGHT CLICK: SIMPLE ITEM PLACEMENT ---
            else if (mouse.isRightClicked && targetBlock === BLOCKS.AIR) {
                if (activeItem && activeItem.blockId !== null && activeItem.count > 0) {
                    const overlapsPlayerX = (mouseCol * BLOCK_SIZE < player.x + player.width) && ((mouseCol + 1) * BLOCK_SIZE > player.x);
                    const overlapsPlayerY = (mouseRow * BLOCK_SIZE < player.y + player.height) && ((mouseRow + 1) * BLOCK_SIZE > player.y);
                    
                    if (!(overlapsPlayerX && overlapsPlayerY)) {
                        world[mouseCol][mouseRow] = activeItem.blockId; 
                        activeItem.count--; 

                        if (activeItem.count <= 0) {
                            hotbarState[activeSlotIndex] = null;
                        }

                        renderHotbar();
                        mouse.isRightClicked = false; 
                    }
                }
            }
        } else {
            mouse.breakProgress = 0;
        }
    } else {
        mouse.breakProgress = 0;
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    ctx.strokeStyle = "rgba(0,0,0,0.1)";

    // --- DRAW BACKGROUND CLOUDS ---
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    clouds.forEach(cloud => {
        if (cloud.x + cloud.width > camera.x && cloud.x < camera.x + camera.width) {
            ctx.beginPath();
            ctx.roundRect(cloud.x, cloud.y, cloud.width, cloud.height, 6);
            ctx.fill();
        }
    });

    // --- EFFICIENT CULLING RENDER ---
    const startCol = Math.max(0, Math.floor(camera.x / BLOCK_SIZE));
    const endCol = Math.min(WORLD_WIDTH - 1, Math.floor((camera.x + camera.width) / BLOCK_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / BLOCK_SIZE));
    const endRow = Math.min(GRID_HEIGHT - 1, Math.floor((camera.y + camera.height) / BLOCK_SIZE) + 1);

    for (let col = startCol; col <= endCol; col++) {
        for (let row = startRow; row <= endRow; row++) {
            const blockType = world[col][row];
            if (blockType !== BLOCKS.AIR) {
                const blockImg = IMAGES[blockType];
                const drawX = Math.floor(col * BLOCK_SIZE);
                const drawY = Math.floor(row * BLOCK_SIZE);

                if (!settings.lowLagMode && LOADED_IMAGES[blockType]) {
                    ctx.drawImage(blockImg, drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                } else {
                    ctx.fillStyle = COLORS[blockType]; 
                    ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

                    if (blockType !== BLOCKS.LEAVES && blockType !== BLOCKS.WATER) {
                        ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    }
                }
            }
        }
    }

    // --- DRAW PLAYER ---
    const pixelSize = 32;
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = PLAYER_PIXELS[i];
        ctx.fillRect(player.x, player.y + (i * pixelSize), player.width, pixelSize);
    }

    // --- DRAW HOVER HIGHLIGHT BOX & CRACKS ---
    const mouseCol = Math.floor(mouse.worldX / BLOCK_SIZE);
    const mouseRow = Math.floor(mouse.worldY / BLOCK_SIZE);

    if (mouseCol >= 0 && mouseCol < WORLD_WIDTH && mouseRow >= 0 && mouseRow < GRID_HEIGHT) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const blockCenterX = (mouseCol * BLOCK_SIZE) + BLOCK_SIZE / 2;
        const blockCenterY = (mouseRow * BLOCK_SIZE) + BLOCK_SIZE / 2;

        const distance = Math.hypot(blockCenterX - playerCenterX, blockCenterY - playerCenterY);
        
        if (distance <= BLOCK_SIZE * 3.5 && world[mouseCol][mouseRow] !== BLOCKS.AIR) {
            const hX = mouseCol * BLOCK_SIZE;
            const hY = mouseRow * BLOCK_SIZE;
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.strokeRect(hX, hY, BLOCK_SIZE, BLOCK_SIZE);

            if (mouse.breakProgress > 0) {
                ctx.strokeStyle = "rgba(0, 0, 0, 0.75)"; 
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                
                if (mouse.breakProgress > 15) {
                    ctx.moveTo(hX + 10, hY + 16); ctx.lineTo(hX + 22, hY + 16);
                    ctx.moveTo(hX + 16, hY + 10); ctx.lineTo(hX + 16, hY + 22);
                }
                if (mouse.breakProgress > 45) {
                    ctx.moveTo(hX + 10, hY + 16); ctx.lineTo(hX + 4, hY + 8);
                    ctx.moveTo(hX + 22, hY + 16); ctx.lineTo(hX + 28, hY + 24);
                }
                if (mouse.breakProgress > 75) {
                    ctx.moveTo(hX + 16, hY + 10); ctx.lineTo(hX + 26, hY + 4);
                    ctx.moveTo(hX + 16, hY + 22); ctx.lineTo(hX + 6, hY + 28);
                }
                ctx.stroke();
            }
            ctx.lineWidth = 1;
        }
    }

    ctx.restore(); 
    
    // --- HUD INDICATOR OVERLAY ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(10, 10, 190, 26);
    ctx.fillStyle = "#FFF";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Mode: ${settings.lowLagMode ? "SOLID BOXES" : "TEXTURED"} (Press L)`, 18, 27);
}

function loop() {
    if (!isPaused) update();
    render(); 
    requestAnimationFrame(loop);
}

// Start Engine
window.addEventListener("resize", resize);
resize();
generateWorld();
spawnClouds();
player.x = (WORLD_WIDTH / 2) * BLOCK_SIZE;
player.y = 3 * BLOCK_SIZE;
loop();

//--------------------------------------------
// Inventory and hotbar hud controller
const SLOT_WIDTH = 20; 
const START_OFFSET = -1;

class Item {
    constructor(id, name, iconUrl, blockId = null, isStackable = true) {
        this.id = id;
        this.name = name;
        this.iconUrl = iconUrl;
        this.blockId = blockId; 
        this.count = isStackable ? 1 : 0; 
    }
}

const hotbarState = Array(9).fill(null);
let activeSlotIndex = 0;

function renderHotbar() {
    const container = document.getElementById('slots-container');
    if (!container) return; 
    
    container.innerHTML = ''; 

    hotbarState.forEach((item, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('slot');
        slotDiv.dataset.index = index;

        if (item) {
            const img = document.createElement('img');
            img.src = item.iconUrl;
            img.alt = item.name;
            img.classList.add('item-icon');
            slotDiv.appendChild(img);

            if (item.count > 0) {
                const countBadge = document.createElement('span');
                countBadge.classList.add('item-count');
                countBadge.innerText = item.count;
                slotDiv.appendChild(countBadge);
            }
        }
        container.appendChild(slotDiv);
    });
}

function updateSelector(index) {
    const selector = document.getElementById('selector');
    if (!selector) return; 
    
    const newLeft = START_OFFSET + (index * SLOT_WIDTH);
    selector.style.left = `${newLeft}px`;
}

//--------------------------------------------
// give starting tools or blocks onDom Content Load
document.addEventListener('DOMContentLoaded', () => {
    // Setup initial tools
    hotbarState[0] = new Item('pickaxe', 'Pickaxe', 'assets/images/texture/tools/diamond_pickaxe.png', null, false);
    hotbarState[1] = new Item('shovel', 'Shovel', 'assets/images/texture/tools/diamond_shovel.png', null, false);
    hotbarState[2] = new Item('axe', 'Axe', 'assets/images/texture/tools/diamond_axe.png', null, false);

    renderHotbar();
    updateSelector(activeSlotIndex);

    window.addEventListener('keydown', (event) => {
        if (event.key >= '1' && event.key <= '9') {
            activeSlotIndex = parseInt(event.key) - 1;
            updateSelector(activeSlotIndex);
        }
    });
});

//--------------------------------------------
// change songs 
let indexSong = 1; // tracking current song playing
const songs = ["[Muted]", "Sweden", "Alpha"]; 
const songsPaths = ["", "assets/audio/Minecraft Music - Sweden.mp3", "assets/audio/Minecraft Music - Alpha.mp3"];
const songPlayer = document.getElementById("game-music");
const songButton = document.getElementById("songButton");

songButton.addEventListener("click", (e) => {
    e.preventDefault(); 
    indexSong++;
    
    if (indexSong >= songs.length) {
        indexSong = 0;
    }

    if (indexSong === 0) {
        songPlayer.pause();
        songPlayer.currentTime = 0;
        songButton.innerHTML = `<span>Song Playing: ${songs[indexSong]}</span>`;
    } else {
        songPlayer.src = songsPaths[indexSong];
        songPlayer.load();

        songButton.innerHTML = `<span>Song Playing: ${songs[indexSong]}</span>`;
    }
});

//--------------------------------------------
// delay switching to page enough time for the sfx to end
const sfxBtn = document.getElementById("buttonSFX");
const sfxBtn_Out = document.getElementById("buttonSFX_Out");
sfxBtn.volume = 0.4;
sfxBtn_Out.volume = 0.4;

function delayAndPlay(sfxId, path) {
    event.preventDefault();
    playSfx(sfxId);

    setTimeout(() => {
        window.location.href = path;
    }, 180);
}

document.querySelectorAll('.mc-button').forEach(item => {
    item.addEventListener('click', () => {
        playSfx(0);
    });
});

document.querySelectorAll('.resetPage').forEach((item, index) => {
    item.addEventListener('click', () => {
        if (index === 0) {
            delayAndPlay(0, "game.html");
        } else if (index === 1) {
            delayAndPlay(0, "index.html");
        }
    });
});

//resetPage
function playSfx(special) {
  switch (special) {
    case 0:
      sfxBtn.currentTime = 0;  
      sfxBtn.play();
      break;
    case 1:
      sfxBtn_Out.currentTime = 0;  
      sfxBtn_Out.play();
      break;
    default:
      break;
  }
}
