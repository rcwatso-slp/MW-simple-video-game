const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const healthFill = document.getElementById('healthFill');
const healthText = document.getElementById('healthText');
const specialFill = document.getElementById('specialFill');
const specialText = document.getElementById('specialText');
const livesText = document.getElementById('livesText');
const scoreText = document.getElementById('scoreText');
const messageBox = document.getElementById('messageBox');
const restartButton = document.getElementById('restartButton');

const keys = {};

const specialAttacks = {
  swingingSword: {
    name: 'Swinging Sword',
    cost: 30,
    damage: 50,
    duration: 34
  },
  groundSlash: {
    name: 'Slashing Ground',
    cost: 45,
    damage: 82,
    duration: 34
  },
  ultimate: {
    name: 'Silent Nightshade Slice',
    cost: 85,
    damage: 150,
    duration: 52
  }
};

const sprites = {
  playerSheet: loadSprite('assets/art/sir-zack-spritesheet.png'),
  hound: [
    loadSprite('assets/art/enemies/shadow-monster-run-0.png'),
    loadSprite('assets/art/enemies/shadow-monster-run-1.png'),
    loadSprite('assets/art/enemies/shadow-monster-run-2.png'),
    loadSprite('assets/art/enemies/shadow-monster-run-3.png'),
    loadSprite('assets/art/enemies/shadow-monster-run-4.png')
  ],
  claw: [
    loadSprite('assets/art/dark-claw-1.png'),
    loadSprite('assets/art/dark-claw-2.png')
  ],
  boss: [
    loadSprite('assets/art/dark-lake-monster-1.png'),
    loadSprite('assets/art/dark-lake-monster-2.png')
  ],
  effects: {
    swordSlash: loadSprite('assets/art/sword-slash-spritesheet.png'),
    groundSlash: loadSprite('assets/art/ground-slash.svg'),
    ultimateSlash: loadSprite('assets/art/ultimate-blue-slash.png'),
    nightshadeBurst: loadSprite('assets/art/nightshade-burst.svg')
  },
  foliage: {
    pineTall: loadSprite('assets/art/foliage/pine-tall.png'),
    pineSnow: loadSprite('assets/art/foliage/pine-snow.png'),
    treeRound: loadSprite('assets/art/foliage/tree-round.png'),
    orangeTree: loadSprite('assets/art/foliage/orange-tree.png'),
    redTree: loadSprite('assets/art/foliage/red-tree.png'),
    deadTree: loadSprite('assets/art/foliage/dead-tree.png'),
    bushWide: loadSprite('assets/art/foliage/bush-wide.png'),
    bushSmall: loadSprite('assets/art/foliage/bush-small.png'),
    grassTuft: loadSprite('assets/art/foliage/grass-tuft.png')
  },
  realistic: {
    forestA: loadSprite('assets/art/realistic/forest-background-1.png'),
    forestB: loadSprite('assets/art/realistic/forest-background-2.png'),
    grassGround: loadSprite('assets/art/realistic/grass-ground.jpg'),
    stoneGround: loadSprite('assets/art/realistic/stone-ground.jpg'),
    fireSheet: loadSprite('assets/art/realistic/fire-sheet.png')
  },
  tiles: {
    grass: loadSprite('assets/art/tiles/tile_0000.png'),
    grassAlt: loadSprite('assets/art/tiles/tile_0001.png'),
    dirt: loadSprite('assets/art/tiles/tile_0010.png'),
    stoneA: loadSprite('assets/art/tiles/tile_0064.png'),
    stoneB: loadSprite('assets/art/tiles/tile_0065.png'),
    stoneC: loadSprite('assets/art/tiles/tile_0066.png'),
    treeA: loadSprite('assets/art/tiles/tile_0096.png'),
    treeB: loadSprite('assets/art/tiles/tile_0097.png'),
    bush: loadSprite('assets/art/tiles/tile_0124.png'),
    cloudA: loadSprite('assets/art/tiles/tile_0008.png'),
    cloudB: loadSprite('assets/art/tiles/tile_0012.png')
  }
};

const game = {
  width: canvas.width,
  height: canvas.height,
  gravity: 0.75,
  groundY: 430,
  levelWidth: 3200,
  cameraX: 0,
  score: 0,
  lives: 3,
  enemiesDefeated: 0,
  spawnTimer: 0,
  bossSpawned: false,
  won: false,
  over: false
};

const player = {
  name: 'Sir Zack',
  x: 90,
  y: game.groundY - 86,
  width: 42,
  height: 86,
  velocityX: 0,
  velocityY: 0,
  speed: 4.2,
  jumpPower: 15,
  health: 100,
  maxHealth: 100,
  special: 100,
  maxSpecial: 100,
  onGround: true,
  facing: 1,
  attacking: false,
  attackTimer: 0,
  attackCooldown: 0,
  invincibleTimer: 0,
  crouching: false
};

let enemies = [];
let visualEffects = [];
let specialCooldown = 0;
let nextEnemyId = 1;
let specialMessage = '';
let specialMessageTimer = 0;

function loadSprite(path) {
  const image = new Image();
  image.src = path;
  return image;
}

function resetGame() {
  game.cameraX = 0;
  game.score = 0;
  game.lives = 3;
  game.enemiesDefeated = 0;
  game.spawnTimer = 50;
  game.bossSpawned = false;
  game.won = false;
  game.over = false;

  player.x = 90;
  player.y = game.groundY - player.height;
  player.velocityX = 0;
  player.velocityY = 0;
  player.health = player.maxHealth;
  player.special = player.maxSpecial;
  player.invincibleTimer = 0;
  player.attacking = false;
  player.attackTimer = 0;
  player.attackCooldown = 0;

  enemies = [];
  visualEffects = [];
  specialCooldown = 0;
  nextEnemyId = 1;
  specialMessage = '';
  specialMessageTimer = 0;
  hideMessage();
  updateUI();
}

function showMessage(title, text, buttonText = 'Restart Game') {
  messageBox.querySelector('h2').textContent = title;
  messageBox.querySelector('p').textContent = text;
  restartButton.textContent = buttonText;
  messageBox.classList.remove('hidden');
}

function hideMessage() {
  messageBox.classList.add('hidden');
}

// Enemy spawning keeps the first version simple: basic enemies appear until
// enough have been defeated, then the mini boss enters from the right.
function spawnEnemy(type = 'hound') {
  const isClaw = type === 'claw';
  const health = isClaw ? 45 : 30;
  const speed = isClaw ? 1.25 : 1.8;
  const startingHealth = health + Math.floor(Math.random() * 16);

  enemies.push({
    id: nextEnemyId,
    type,
    x: game.cameraX + game.width + 80,
    y: game.groundY - (isClaw ? 64 : 42),
    width: isClaw ? 44 : 58,
    height: isClaw ? 64 : 42,
    speed: speed + Math.random() * 0.55,
    health: startingHealth,
    maxHealth: startingHealth,
    damage: isClaw ? 14 : 10,
    boss: false,
    hitCooldown: 0
  });
  nextEnemyId++;
}

function spawnBoss() {
  enemies.push({
    id: nextEnemyId,
    type: 'Dark Lake Monster',
    x: game.cameraX + game.width + 160,
    y: game.groundY - 132,
    width: 130,
    height: 132,
    speed: 1.05,
    health: 240,
    maxHealth: 240,
    damage: 22,
    boss: true,
    hitCooldown: 0
  });
  nextEnemyId++;
  game.bossSpawned = true;
}

// Movement reads the current keyboard state each frame. This feels smoother
// than reacting only once when a key is pressed.
function updatePlayer() {
  player.velocityX = 0;
  player.crouching = keys.ArrowDown && player.onGround;

  const dashBoost = (keys.ShiftLeft || keys.ShiftRight) ? 1.7 : 1;
  const currentSpeed = player.crouching ? player.speed * 0.35 : player.speed * dashBoost;

  if (keys.ArrowRight) {
    player.velocityX = currentSpeed;
    player.facing = 1;
  }

  if (keys.ArrowLeft) {
    player.velocityX = -currentSpeed;
    player.facing = -1;
  }

  if (keys.ArrowUp && player.onGround && !player.crouching) {
    player.velocityY = -player.jumpPower;
    player.onGround = false;
  }

  if (keys.Space && player.attackCooldown <= 0) {
    player.attacking = true;
    player.attackTimer = 14;
    player.attackCooldown = 26;
  }

  player.x += player.velocityX;
  player.x = Math.max(0, Math.min(player.x, game.levelWidth - player.width));

  player.velocityY += game.gravity;
  player.y += player.velocityY;

  const standingHeight = 86;
  const crouchHeight = 58;
  const wantedHeight = player.crouching ? crouchHeight : standingHeight;
  const feetY = player.y + player.height;
  player.height = wantedHeight;
  player.y = feetY - player.height;

  if (player.y + player.height >= game.groundY) {
    player.y = game.groundY - player.height;
    player.velocityY = 0;
    player.onGround = true;
  }

  if (player.attackTimer > 0) {
    player.attackTimer--;
  } else {
    player.attacking = false;
  }

  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.invincibleTimer > 0) player.invincibleTimer--;
}

function updateCamera() {
  const targetX = player.x - game.width * 0.35;
  game.cameraX = Math.max(0, Math.min(targetX, game.levelWidth - game.width));
}

function updateEnemies() {
  game.spawnTimer--;

  if (game.enemiesDefeated < 8 && game.spawnTimer <= 0 && enemies.length < 4) {
    spawnEnemy(Math.random() > 0.55 ? 'claw' : 'hound');
    game.spawnTimer = 95 + Math.random() * 85;
  }

  if (game.enemiesDefeated >= 8 && !game.bossSpawned) {
    spawnBoss();
  }

  for (const enemy of enemies) {
    const direction = player.x < enemy.x ? -1 : 1;
    enemy.x += direction * enemy.speed;
    if (enemy.hitCooldown > 0) enemy.hitCooldown--;
  }
}

function triggerSpecialEffect(type) {
  const attack = specialAttacks[type];
  if (game.over || specialCooldown > 0) return;
  if (!attack) return;

  if (player.special < attack.cost) {
    specialMessage = `Need ${attack.cost} SP for ${attack.name}`;
    specialMessageTimer = 60;
    return;
  }

  player.special -= attack.cost;

  const effect = {
    type,
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    facing: player.facing,
    age: 0,
    duration: attack.duration
  };

  visualEffects.push(effect);
  applySpecialDamage(effect, attack.damage);

  specialCooldown = 34;
  specialMessage = `${attack.name}!`;
  specialMessageTimer = 42;
}

function updateVisualEffects() {
  if (specialCooldown > 0) specialCooldown--;
  if (specialMessageTimer > 0) specialMessageTimer--;

  for (const effect of visualEffects) {
    effect.age++;
  }

  visualEffects = visualEffects.filter(effect => effect.age < effect.duration);
}

function applySpecialDamage(effect, damage) {
  const damageBox = getSpecialDamageBox(effect);

  for (const enemy of enemies) {
    if (rectanglesOverlap(damageBox, enemy)) {
      enemy.health -= damage;
      enemy.hitCooldown = 20;

      if (effect.type === 'groundSlash') {
        enemy.x += effect.facing * 28;
      }

      if (effect.type === 'ultimate') {
        enemy.x += effect.facing * 44;
      }
    }
  }
}

function getSpecialDamageBox(effect) {
  if (effect.type === 'swingingSword') {
    return {
      x: effect.x - 95,
      y: effect.y - 80,
      width: 190,
      height: 150
    };
  }

  if (effect.type === 'groundSlash') {
    return {
      x: effect.facing === 1 ? effect.x + 20 : effect.x - 300,
      y: game.groundY - 115,
      width: 300,
      height: 95
    };
  }

  return {
    x: effect.x - 195,
    y: effect.y - 125,
    width: 390,
    height: 240
  };
}

// Collision detection compares rectangles. If their edges overlap, the two
// objects are touching.
function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getAttackBox() {
  return {
    x: player.facing === 1 ? player.x + player.width : player.x - 58,
    y: player.y + 20,
    width: 58,
    height: 42
  };
}

function handleCombat() {
  const attackBox = getAttackBox();

  for (const enemy of enemies) {
    if (player.attacking && enemy.hitCooldown <= 0 && rectanglesOverlap(attackBox, enemy)) {
      enemy.health -= 28;
      enemy.hitCooldown = 18;
    }

    if (rectanglesOverlap(player, enemy) && player.invincibleTimer <= 0) {
      damagePlayer(enemy.damage);
    }
  }

  enemies = enemies.filter(enemy => {
    if (enemy.health > 0) return true;

    game.score += enemy.boss ? 500 : 100;
    game.enemiesDefeated++;
    refillSpecial(enemy.boss ? 100 : 25);

    if (enemy.boss) {
      game.won = true;
      game.over = true;
      showMessage('Victory!', 'Sir Zack defeated the Dark Lake Monster. The grass ruins are safe for now.', 'Play Again');
    }

    return false;
  });
}

function refillSpecial(amount) {
  player.special = Math.min(player.maxSpecial, player.special + amount);
  specialMessage = `+${amount} SP`;
  specialMessageTimer = 45;
}

function damagePlayer(amount) {
  player.health -= amount;
  player.invincibleTimer = 55;

  if (player.health <= 0) {
    game.lives--;

    if (game.lives <= 0) {
      game.over = true;
      player.health = 0;
      showMessage('Game Over', 'Sir Zack has fallen. Restart and try again.', 'Restart Game');
      return;
    }

    player.health = player.maxHealth;
    player.x = Math.max(40, player.x - 160);
    player.y = game.groundY - player.height;
    player.velocityY = 0;
    player.invincibleTimer = 110;
  }
}

function updateUI() {
  const healthPercent = Math.max(0, player.health / player.maxHealth) * 100;
  const specialPercent = Math.max(0, player.special / player.maxSpecial) * 100;
  healthFill.style.width = `${healthPercent}%`;
  specialFill.style.width = `${specialPercent}%`;
  healthText.textContent = Math.max(0, Math.ceil(player.health));
  specialText.textContent = Math.max(0, Math.ceil(player.special));
  livesText.textContent = game.lives;
  scoreText.textContent = game.score;
}

function drawTile(image, x, y, size = 54) {
  if (image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }
}

function fillWithTexture(image, x, y, width, height, offsetX = 0, tint = null) {
  if (!image.complete || image.naturalWidth === 0) {
    ctx.fillStyle = tint || '#33402b';
    ctx.fillRect(x, y, width, height);
    return;
  }

  ctx.save();
  ctx.translate(x - offsetX, y);
  const pattern = ctx.createPattern(image, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(offsetX, 0, width, height);
  if (tint) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tint;
    ctx.fillRect(offsetX, 0, width, height);
  }
  ctx.restore();
}

function drawLoopingBackground(image, scrollSpeed, y, height, alpha = 1) {
  if (!image.complete || image.naturalWidth === 0) return;

  const scale = height / image.naturalHeight;
  const width = image.naturalWidth * scale;
  const offset = (game.cameraX * scrollSpeed) % width;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  for (let x = -offset - width; x < game.width + width; x += width) {
    ctx.drawImage(image, x, y, width, height);
  }
  ctx.restore();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, game.groundY);
  sky.addColorStop(0, '#172025');
  sky.addColorStop(0.52, '#334447');
  sky.addColorStop(1, '#1d2823');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, game.width, game.height);

  drawLoopingBackground(sprites.realistic.forestB, 0.12, 18, 360, 0.42);
  drawLoopingBackground(sprites.realistic.forestA, 0.25, 34, 390, 0.78);

  const fog = ctx.createLinearGradient(0, 125, 0, game.groundY);
  fog.addColorStop(0, 'rgba(195, 219, 209, 0.04)');
  fog.addColorStop(0.7, 'rgba(182, 205, 192, 0.17)');
  fog.addColorStop(1, 'rgba(42, 54, 42, 0.2)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 125, game.width, game.groundY - 125);

  fillWithTexture(
    sprites.realistic.stoneGround,
    0,
    game.groundY - 12,
    game.width,
    game.height - game.groundY + 12,
    game.cameraX * 0.65,
    'rgba(95, 91, 84, 0.92)'
  );

  fillWithTexture(
    sprites.realistic.grassGround,
    0,
    game.groundY - 72,
    game.width,
    74,
    game.cameraX,
    'rgba(72, 95, 58, 0.82)'
  );

  ctx.fillStyle = 'rgba(13, 20, 14, 0.28)';
  ctx.fillRect(0, game.groundY + 44, game.width, game.height - game.groundY - 44);

  drawScenery();
}

function drawScenery() {
  const ruins = [
    { x: 330, y: 300, w: 58, h: 130, broken: 24 },
    { x: 720, y: 344, w: 160, h: 86, broken: 16 },
    { x: 1260, y: 280, w: 72, h: 150, broken: 30 },
    { x: 1870, y: 334, w: 190, h: 96, broken: 22 },
    { x: 2510, y: 296, w: 110, h: 134, broken: 28 }
  ];

  const trees = [
    { x: 170, scale: 0.9, tone: '#274a2f' },
    { x: 520, scale: 1.08, tone: '#315c34' },
    { x: 1020, scale: 0.86, tone: '#294b32' },
    { x: 1540, scale: 1.18, tone: '#2f5634' },
    { x: 2140, scale: 0.95, tone: '#385f37' },
    { x: 2820, scale: 1.08, tone: '#2b4d31' }
  ];
  const fires = [900, 2080, 3000];

  drawGrassDetails();

  for (const tree of trees) {
    const screenX = tree.x - game.cameraX * 0.72;
    if (screenX < -170 || screenX > game.width + 170) continue;
    drawRealisticTree(screenX, game.groundY + 6, tree.scale, tree.tone);
  }

  for (const ruin of ruins) {
    const screenX = ruin.x - game.cameraX;
    if (screenX < -220 || screenX > game.width + 220) continue;
    drawTexturedRuin(screenX, ruin.y, ruin.w, ruin.h, ruin.broken);
  }

  for (const fireX of fires) {
    const screenX = fireX - game.cameraX;
    if (screenX < -60 || screenX > game.width + 60) continue;
    drawRealisticFire(screenX, game.groundY - 76);
  }
}

function drawRealisticTree(x, groundY, scale, leafColor) {
  const trunkHeight = 145 * scale;
  const trunkWidth = 18 * scale;
  const trunkX = x + 46 * scale;
  const trunkTop = groundY - trunkHeight;

  const trunkGradient = ctx.createLinearGradient(trunkX, trunkTop, trunkX + trunkWidth, groundY);
  trunkGradient.addColorStop(0, '#4b3525');
  trunkGradient.addColorStop(0.45, '#78523a');
  trunkGradient.addColorStop(1, '#2d2018');
  ctx.fillStyle = trunkGradient;
  ctx.fillRect(trunkX, trunkTop, trunkWidth, trunkHeight);

  ctx.strokeStyle = 'rgba(36, 24, 17, 0.7)';
  ctx.lineWidth = 4 * scale;
  for (let branch = 0; branch < 4; branch++) {
    const branchY = trunkTop + (34 + branch * 24) * scale;
    const direction = branch % 2 === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(trunkX + trunkWidth / 2, branchY);
    ctx.lineTo(trunkX + trunkWidth / 2 + direction * (38 + branch * 8) * scale, branchY - (22 + branch * 5) * scale);
    ctx.stroke();
  }

  const clumps = [
    { x: 34, y: -150, r: 48 },
    { x: 78, y: -142, r: 52 },
    { x: 52, y: -190, r: 48 },
    { x: 106, y: -184, r: 44 },
    { x: 14, y: -184, r: 42 },
    { x: 70, y: -225, r: 44 }
  ];

  for (const clump of clumps) {
    const gradient = ctx.createRadialGradient(
      x + clump.x * scale,
      groundY + clump.y * scale,
      4,
      x + clump.x * scale,
      groundY + clump.y * scale,
      clump.r * scale
    );
    gradient.addColorStop(0, '#5d8348');
    gradient.addColorStop(0.55, leafColor);
    gradient.addColorStop(1, '#162b1e');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + clump.x * scale, groundY + clump.y * scale, clump.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrassDetails() {
  for (let worldX = Math.floor(game.cameraX / 42) * 42 - 90; worldX < game.cameraX + game.width + 120; worldX += 42) {
    const screenX = worldX - game.cameraX;
    const height = 14 + ((worldX * 13) % 19);
    ctx.strokeStyle = worldX % 3 === 0 ? '#9ec078' : '#5f844e';
    ctx.lineWidth = 2;

    for (let blade = 0; blade < 5; blade++) {
      const x = screenX + blade * 7;
      const sway = ((worldX + blade * 17) % 15) - 7;
      ctx.beginPath();
      ctx.moveTo(x, game.groundY - 7);
      ctx.quadraticCurveTo(x + sway * 0.4, game.groundY - height * 0.7, x + sway, game.groundY - height);
      ctx.stroke();
    }
  }
}

function drawTexturedRuin(x, y, width, height, broken) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + broken);
  ctx.lineTo(x + width * 0.35, y);
  ctx.lineTo(x + width * 0.66, y + broken * 0.55);
  ctx.lineTo(x + width, y + broken * 0.25);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.clip();
  fillWithTexture(sprites.realistic.stoneGround, x, y, width, height, game.cameraX * 0.15, 'rgba(116, 111, 103, 0.98)');
  ctx.restore();

  ctx.strokeStyle = 'rgba(28, 27, 24, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, y + broken + 2, width - 4, height - broken - 4);

  ctx.fillStyle = 'rgba(18, 20, 18, 0.58)';
  ctx.fillRect(x + width * 0.22, y + height * 0.28, width * 0.22, height * 0.26);
}

function drawRealisticFire(x, y) {
  ctx.fillStyle = '#3a2417';
  ctx.fillRect(x - 25, game.groundY - 12, 50, 9);

  const sheet = sprites.realistic.fireSheet;
  if (!sheet.complete || sheet.naturalWidth === 0) return;

  const frame = Math.floor(performance.now() / 70) % 25;
  const col = frame % 5;
  const row = Math.floor(frame / 5);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sheet, col * 128, row * 128, 128, 128, x - 54, y, 108, 108);
  ctx.restore();
}

function drawSprite(image, x, y, width, height, fallback, smooth = true) {
  if (image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = smooth;
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
  } else {
    fallback();
  }
}

function drawPlayer() {
  const x = player.x - game.cameraX;
  const flicker = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 6) % 2 === 0;
  if (flicker) return;

  const sheet = sprites.playerSheet;
  const moving = Math.abs(player.velocityX) > 0.1;
  const frame = moving ? Math.floor(performance.now() / 120) % 4 : 0;
  const row = player.attacking ? 2 : moving ? 1 : 0;

  if (sheet.complete && sheet.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (player.facing === -1) {
      ctx.translate(x + player.width + 24, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * 64, row * 64, 64, 64, 0, player.y - 10, 74, 104);
    } else {
      ctx.drawImage(sheet, frame * 64, row * 64, 64, 64, x - 16, player.y - 10, 74, 104);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#d8d1bd';
    ctx.fillRect(x, player.y, player.width, player.height);
    ctx.fillStyle = '#3c5a70';
    ctx.fillRect(x + 6, player.y + 20, player.width - 12, player.height - 24);
    ctx.fillStyle = '#f2d49b';
    ctx.fillRect(x + 9, player.y - 14, 24, 20);
  }

  if (player.attacking) {
    drawSwordSwing();
  } else {
    ctx.fillStyle = '#c3ccd2';
    const swordX = player.facing === 1 ? x + player.width + 2 : x - 18;
    ctx.fillRect(swordX, player.y + 28, 18, 5);
  }
}

function drawSwordSwing() {
  const swingProgress = 1 - player.attackTimer / 14;
  const eased = Math.sin(swingProgress * Math.PI * 0.9);
  const handX = player.x - game.cameraX + (player.facing === 1 ? player.width + 4 : -4);
  const handY = player.y + 36;
  const startAngle = player.facing === 1 ? -1.45 : -1.7;
  const endAngle = player.facing === 1 ? 0.65 : 0.85;
  const angle = startAngle + (endAngle - startAngle) * swingProgress;

  ctx.save();
  ctx.translate(handX, handY);
  ctx.scale(player.facing, 1);
  ctx.rotate(angle);

  ctx.fillStyle = '#5b4231';
  ctx.fillRect(-5, -6, 10, 14);
  ctx.fillStyle = '#d9b95b';
  ctx.fillRect(-15, -10, 30, 6);
  ctx.fillStyle = '#eef6f8';
  ctx.beginPath();
  ctx.moveTo(-5, -10);
  ctx.lineTo(5, -10);
  ctx.lineTo(2, -82);
  ctx.lineTo(0, -96);
  ctx.lineTo(-2, -82);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8fb8c0';
  ctx.fillRect(0, -78, 2, 64);
  ctx.restore();

  const slash = sprites.effects.swordSlash;
  if (slash.complete && slash.naturalWidth > 0) {
    const frame = Math.min(8, Math.floor(swingProgress * 9));
    const col = frame % 3;
    const row = Math.floor(frame / 3);
    const sourceWidth = 64;
    const sourceHeight = 47;
    const slashX = player.x - game.cameraX + (player.facing === 1 ? player.width - 2 : -112);
    const slashY = player.y + 8 - eased * 10;

    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.imageSmoothingEnabled = false;
    if (player.facing === -1) {
      ctx.translate(slashX + 116, slashY);
      ctx.scale(-1, 1);
      ctx.drawImage(slash, col * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight, 0, 0, 116, 86);
    } else {
      ctx.drawImage(slash, col * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight, slashX, slashY, 116, 86);
    }
    ctx.restore();
  }
}

function drawEnemy(enemy) {
  const x = enemy.x - game.cameraX;
  const frames = enemy.boss ? sprites.boss : enemy.type === 'claw' ? sprites.claw : sprites.hound;
  const image = frames[Math.floor(performance.now() / (enemy.type === 'hound' ? 90 : 260)) % frames.length];
  const drawX = enemy.boss ? x - 18 : enemy.type === 'hound' ? x - 28 : x - 10;
  const drawY = enemy.boss ? enemy.y - 24 : enemy.type === 'hound' ? enemy.y - 24 : enemy.y - 20;
  const drawWidth = enemy.boss ? enemy.width + 42 : enemy.type === 'hound' ? enemy.width + 48 : enemy.width + 24;
  const drawHeight = enemy.boss ? enemy.height + 36 : enemy.type === 'hound' ? enemy.height + 38 : enemy.height + 32;

  if (enemy.type === 'hound' && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.translate(drawX + drawWidth, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
    ctx.restore();
  } else {
    drawSprite(image, drawX, drawY, drawWidth, drawHeight, () => {
    ctx.fillStyle = enemy.boss ? '#263e48' : enemy.type === 'claw' ? '#38283f' : '#232126';
    ctx.fillRect(x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = enemy.boss ? '#91d6d0' : '#db3d4b';
    ctx.fillRect(x + enemy.width * 0.22, enemy.y + 14, 8, 8);
    ctx.fillRect(x + enemy.width * 0.62, enemy.y + 14, 8, 8);
    });
  }

  const barWidth = enemy.width;
  const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
  ctx.fillStyle = '#331719';
  ctx.fillRect(x, enemy.y - 12, barWidth, 6);
  ctx.fillStyle = enemy.boss ? '#91d6d0' : '#db3d4b';
  ctx.fillRect(x, enemy.y - 12, barWidth * healthPercent, 6);

  if (enemy.boss) {
    ctx.fillStyle = '#f6f2df';
    ctx.font = '16px Arial';
    ctx.fillText('Dark Lake Monster', x - 8, enemy.y - 20);
  }
}

function drawVisualEffects() {
  for (const effect of visualEffects) {
    if (effect.type === 'swingingSword') {
      drawSwingingSwordEffect(effect);
    }

    if (effect.type === 'groundSlash') {
      drawGroundSlashEffect(effect);
    }

    if (effect.type === 'ultimate') {
      drawUltimateEffect(effect);
    }
  }
}

function drawSwingingSwordEffect(effect) {
  const progress = effect.age / effect.duration;
  const alpha = 1 - progress;
  const x = effect.x - game.cameraX;
  const y = effect.y;

  ctx.save();
  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeStyle = '#e8f1d6';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, 68 + progress * 20, progress * Math.PI * 2, progress * Math.PI * 2 + Math.PI * 1.45);
  ctx.stroke();
  ctx.restore();
}

function drawGroundSlashEffect(effect) {
  const progress = effect.age / effect.duration;
  const width = 235 + progress * 90;
  const height = 78;
  const x = effect.x - game.cameraX + effect.facing * 58;
  const y = game.groundY - 78;

  ctx.save();
  ctx.globalAlpha = 1 - progress * 0.65;
  if (effect.facing === -1) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    drawSprite(sprites.effects.groundSlash, 0, 0, width, height, () => {}, true);
  } else {
    drawSprite(sprites.effects.groundSlash, x, y, width, height, () => {}, true);
  }
  ctx.restore();
}

function drawUltimateEffect(effect) {
  const progress = effect.age / effect.duration;
  const x = effect.x - game.cameraX;
  const y = effect.y;
  const pulse = Math.sin(progress * Math.PI);

  ctx.save();
  ctx.globalAlpha = 0.85 - progress * 0.45;
  drawSprite(sprites.effects.nightshadeBurst, x - 120 - pulse * 16, y - 100 - pulse * 8, 240 + pulse * 32, 176 + pulse * 24, () => {}, true);
  ctx.restore();

  const slash = sprites.effects.ultimateSlash;
  if (slash.complete && slash.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.85 - progress * 0.5;
    ctx.imageSmoothingEnabled = true;
    ctx.translate(x, y);
    ctx.rotate(-0.18 + progress * 0.36);
    ctx.drawImage(slash, -170, -68, 340, 146);
    ctx.restore();
  }
}

function drawLevelEnd() {
  const x = game.levelWidth - 110 - game.cameraX;
  ctx.fillStyle = '#9fd3c7';
  ctx.fillRect(x, game.groundY - 120, 12, 120);
  ctx.fillStyle = '#e6b84f';
  ctx.fillRect(x + 12, game.groundY - 120, 64, 34);
}

function drawProgressText() {
  ctx.fillStyle = '#f6f2df';
  ctx.font = '18px Arial';
  const remaining = Math.max(0, 8 - game.enemiesDefeated);
  const text = game.bossSpawned
    ? 'Mini boss: defeat the Dark Lake Monster!'
    : `Defeat ${remaining} more shadow enemies to summon the mini boss.`;
  ctx.fillText(text, 22, 34);

  ctx.font = '16px Arial';
  ctx.fillStyle = '#c8f1ff';
  ctx.fillText('Special costs: 1=30 SP  2=45 SP  3=85 SP', 22, 58);

  if (specialMessageTimer > 0) {
    ctx.fillStyle = '#f6f2df';
    ctx.font = '20px Arial';
    ctx.fillText(specialMessage, 22, 86);
  }
}

function render() {
  drawBackground();
  drawLevelEnd();

  for (const enemy of enemies) {
    drawEnemy(enemy);
  }

  drawPlayer();
  drawVisualEffects();
  drawProgressText();
}

// The game loop is the heartbeat of the game. It updates the world, checks
// combat, refreshes the interface, draws the next frame, then asks the browser
// to run it again.
function gameLoop() {
  if (!game.over) {
    updatePlayer();
    updateCamera();
    updateEnemies();
    updateVisualEffects();
    handleCombat();
    updateUI();
  }

  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', event => {
  if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Space', 'ShiftLeft', 'ShiftRight', 'Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
    event.preventDefault();
  }

  keys[event.code] = true;

  if (event.code === 'Digit1') triggerSpecialEffect('swingingSword');
  if (event.code === 'Digit2') triggerSpecialEffect('groundSlash');
  if (event.code === 'Digit3') triggerSpecialEffect('ultimate');
});

window.addEventListener('keyup', event => {
  keys[event.code] = false;
});

restartButton.addEventListener('click', resetGame);

resetGame();
game.over = true;
showMessage('Sir Zack stands ready', 'Press Space to swing. Defeat the shadows and the Dark Lake Monster.', 'Start Game');
gameLoop();
