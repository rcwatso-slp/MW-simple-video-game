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

const LEVELS = {
  1: {
    name: 'Grass Ruins',
    enemyTarget: 21,
    regularScore: 100,
    bossScore: 500,
    bossName: 'Dark Lake Monster'
  },
  2: {
    name: 'Cloudvale Village',
    enemyTarget: 18,
    regularScore: 150,
    bossScore: 900,
    bossName: 'Dark Skyhawk'
  }
};

const sprites = {
  player: {
    idle: [
      loadSprite('assets/art/player/knight-idle-1.png'),
      loadSprite('assets/art/player/knight-idle-2.png')
    ],
    walk: [
      loadSprite('assets/art/player/knight-walk-1.png'),
      loadSprite('assets/art/player/knight-walk-2.png'),
      loadSprite('assets/art/player/knight-walk-3.png'),
      loadSprite('assets/art/player/knight-walk-4.png')
    ],
    attack: [
      loadSprite('assets/art/player/knight-attack-1.png'),
      loadSprite('assets/art/player/knight-attack-2.png'),
      loadSprite('assets/art/player/knight-attack-3.png'),
      loadSprite('assets/art/player/knight-attack-4.png')
    ],
    jump: [
      loadSprite('assets/art/player/knight-jump-1.png')
    ]
  },
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
  level2: {
    troll: [
      loadSprite('assets/art/level2/troll-1.png'),
      loadSprite('assets/art/level2/troll-2.png')
    ],
    phoenix: loadSprite('assets/art/level2/phoenix-sheet.png'),
    bird: loadSprite('assets/art/level2/bird-sheet.png')
  },
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
  currentLevel: 1,
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
  game.currentLevel = 1;
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

function getLevel() {
  return LEVELS[game.currentLevel];
}

function startLevel(levelNumber) {
  game.currentLevel = levelNumber;
  game.cameraX = 0;
  game.enemiesDefeated = 0;
  game.spawnTimer = 75;
  game.bossSpawned = false;
  game.over = false;

  player.x = 90;
  player.y = game.groundY - player.height;
  player.velocityX = 0;
  player.velocityY = 0;
  player.health = Math.min(player.maxHealth, player.health + 45);
  player.special = Math.min(player.maxSpecial, player.special + 55);
  player.invincibleTimer = 90;

  enemies = [];
  visualEffects = [];
  specialMessage = `${getLevel().name}`;
  specialMessageTimer = 120;
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
  const stats = getEnemyStats(type);
  const startingHealth = stats.health + Math.floor(Math.random() * stats.healthVariance);

  enemies.push({
    id: nextEnemyId,
    type,
    x: game.cameraX + game.width + 80,
    y: stats.y || game.groundY - stats.height,
    width: stats.width,
    height: stats.height,
    speed: stats.speed + Math.random() * stats.speedVariance,
    health: startingHealth,
    maxHealth: startingHealth,
    damage: stats.damage,
    boss: false,
    hitCooldown: 0
  });
  nextEnemyId++;
}

function getEnemyStats(type) {
  const enemyStats = {
    hound: { width: 58, height: 42, speed: 1.8, speedVariance: 0.55, health: 30, healthVariance: 16, damage: 10 },
    claw: { width: 44, height: 64, speed: 1.25, speedVariance: 0.55, health: 45, healthVariance: 16, damage: 14 },
    troll: { width: 64, height: 88, speed: 1.05, speedVariance: 0.32, health: 118, healthVariance: 22, damage: 22 },
    skyWraith: { width: 62, height: 64, y: 318, speed: 2.05, speedVariance: 0.45, health: 82, healthVariance: 18, damage: 18 },
    duskRaven: { width: 76, height: 62, y: 302, speed: 2.35, speedVariance: 0.55, health: 70, healthVariance: 18, damage: 17 }
  };

  return enemyStats[type] || enemyStats.hound;
}

function spawnBoss() {
  const level = getLevel();
  const isSkyhawk = game.currentLevel === 2;
  const boss = isSkyhawk
    ? {
        type: level.bossName,
        y: 286,
        width: 150,
        height: 105,
        speed: 1.48,
        health: 460,
        damage: 28
      }
    : {
        type: level.bossName,
        y: game.groundY - 132,
        width: 130,
        height: 132,
        speed: 1.05,
        health: 240,
        damage: 22
      };

  enemies.push({
    id: nextEnemyId,
    type: boss.type,
    x: game.cameraX + game.width + 160,
    y: boss.y,
    width: boss.width,
    height: boss.height,
    speed: boss.speed,
    health: boss.health,
    maxHealth: boss.health,
    damage: boss.damage,
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
  const level = getLevel();
  game.spawnTimer--;

  if (game.enemiesDefeated < level.enemyTarget && game.spawnTimer <= 0 && enemies.length < (game.currentLevel === 2 ? 5 : 4)) {
    spawnEnemy(pickEnemyType());
    game.spawnTimer = (game.currentLevel === 2 ? 70 : 95) + Math.random() * 75;
  }

  if (game.enemiesDefeated >= level.enemyTarget && !game.bossSpawned) {
    spawnBoss();
  }

  for (const enemy of enemies) {
    const direction = player.x < enemy.x ? -1 : 1;
    enemy.x += direction * enemy.speed;
    if (game.currentLevel === 2 && (enemy.type === 'skyWraith' || enemy.type === 'duskRaven' || enemy.type === 'Dark Skyhawk')) {
      enemy.y += Math.sin(performance.now() / 420 + enemy.id) * 0.35;
      if (enemy.type === 'duskRaven') {
        updateDuskRavenAttackLane(enemy);
      }
      if (enemy.type === 'Dark Skyhawk') {
        updateDarkSkyhawkAttackLane(enemy);
      }
    }
    if (enemy.hitCooldown > 0) enemy.hitCooldown--;
  }
}

function updateDarkSkyhawkAttackLane(enemy) {
  const distanceToPlayer = Math.abs((enemy.x + enemy.width / 2) - (player.x + player.width / 2));
  const highLane = 238 + Math.sin(performance.now() / 460 + enemy.id) * 18;
  const attackLane = game.groundY - enemy.height - 28 + Math.sin(performance.now() / 220 + enemy.id) * 10;
  const targetY = distanceToPlayer < 330 ? attackLane : highLane;
  enemy.y += (targetY - enemy.y) * 0.045;
}

function updateDuskRavenAttackLane(enemy) {
  const distanceToPlayer = Math.abs((enemy.x + enemy.width / 2) - (player.x + player.width / 2));
  const highLane = 284 + Math.sin(performance.now() / 330 + enemy.id) * 18;
  const attackLane = game.groundY - enemy.height - 18 + Math.sin(performance.now() / 180 + enemy.id) * 8;
  const targetY = distanceToPlayer < 260 ? attackLane : highLane;
  enemy.y += (targetY - enemy.y) * 0.065;
}

function pickEnemyType() {
  if (game.currentLevel === 1) {
    return Math.random() > 0.55 ? 'claw' : 'hound';
  }

  const roll = Math.random();
  if (roll < 0.38) return 'troll';
  if (roll < 0.7) return 'skyWraith';
  return 'duskRaven';
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
  let nextLevel = null;

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

    const level = getLevel();
    game.score += enemy.boss ? level.bossScore : level.regularScore;
    if (!enemy.boss) {
      game.enemiesDefeated++;
    }
    refillSpecial(enemy.boss ? 100 : 25);

    if (enemy.boss) {
      if (game.currentLevel === 1) {
        nextLevel = 2;
      } else {
        game.won = true;
        game.over = true;
        showMessage('Victory!', 'Sir Zack defeated the Dark Skyhawk. Cloudvale Village is safe.', 'Play Again');
      }
    }

    return false;
  });

  if (nextLevel) {
    startLevel(nextLevel);
  }
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
  if (game.currentLevel === 2) {
    drawVillageBackground();
    return;
  }

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

function drawVillageBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, game.groundY);
  sky.addColorStop(0, '#66b8ff');
  sky.addColorStop(0.58, '#a8ddff');
  sky.addColorStop(1, '#d9f2ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, game.width, game.height);

  drawClouds();
  drawVillageHouses();

  fillWithTexture(
    sprites.realistic.stoneGround,
    0,
    game.groundY - 12,
    game.width,
    game.height - game.groundY + 12,
    game.cameraX * 0.65,
    'rgba(128, 120, 107, 0.94)'
  );

  fillWithTexture(
    sprites.realistic.grassGround,
    0,
    game.groundY - 72,
    game.width,
    74,
    game.cameraX,
    'rgba(94, 132, 66, 0.78)'
  );

  drawGrassDetails();
  drawVillageTrees();
  drawNPCs();
}

function drawClouds() {
  const clouds = [
    { x: 120, y: 70, s: 1.0 },
    { x: 510, y: 112, s: 0.75 },
    { x: 880, y: 68, s: 1.15 },
    { x: 1320, y: 130, s: 0.85 },
    { x: 1800, y: 84, s: 1.0 },
    { x: 2440, y: 116, s: 0.8 },
    { x: 2940, y: 72, s: 1.2 }
  ];

  for (const cloud of clouds) {
    const x = cloud.x - game.cameraX * 0.18;
    if (x < -220 || x > game.width + 220) continue;
    drawCloud(x, cloud.y, cloud.s);
  }
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.globalAlpha = 0.86;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x + 63 * scale, y + 32 * scale, 72 * scale, 25 * scale, 0, 0, Math.PI * 2);
  ctx.arc(x, y + 18 * scale, 30 * scale, 0, Math.PI * 2);
  ctx.arc(x + 38 * scale, y, 42 * scale, 0, Math.PI * 2);
  ctx.arc(x + 88 * scale, y + 14 * scale, 34 * scale, 0, Math.PI * 2);
  ctx.arc(x + 126 * scale, y + 26 * scale, 24 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVillageHouses() {
  const houses = [
    { x: 300, w: 150, h: 112, color: '#b97853', roof: '#7b2f35' },
    { x: 690, w: 185, h: 128, color: '#c69a67', roof: '#354d6b' },
    { x: 1140, w: 160, h: 118, color: '#a86e55', roof: '#6d2f4b' },
    { x: 1600, w: 210, h: 140, color: '#c4a06c', roof: '#804032' },
    { x: 2190, w: 170, h: 124, color: '#b9845a', roof: '#354f4f' },
    { x: 2740, w: 190, h: 132, color: '#c19364', roof: '#733845' }
  ];

  for (const house of houses) {
    const x = house.x - game.cameraX * 0.55;
    if (x < -260 || x > game.width + 260) continue;
    drawHouse(x, game.groundY - house.h - 40, house);
  }
}

function drawHouse(x, y, house) {
  ctx.fillStyle = 'rgba(47, 38, 32, 0.22)';
  ctx.fillRect(x + 10, y + house.h + 4, house.w, 16);
  ctx.fillStyle = house.color;
  ctx.fillRect(x, y + 42, house.w, house.h - 42);
  ctx.fillStyle = house.roof;
  ctx.beginPath();
  ctx.moveTo(x - 18, y + 46);
  ctx.lineTo(x + house.w / 2, y);
  ctx.lineTo(x + house.w + 18, y + 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3b2c24';
  ctx.fillRect(x + house.w * 0.42, y + house.h - 44, 32, 44);
  ctx.fillStyle = '#e8f6ff';
  ctx.fillRect(x + 24, y + 66, 28, 26);
  ctx.fillRect(x + house.w - 52, y + 66, 28, 26);
}

function drawVillageTrees() {
  const trees = [
    { x: 110, scale: 0.78, tone: '#407540' },
    { x: 980, scale: 0.86, tone: '#4d8645' },
    { x: 1450, scale: 0.74, tone: '#477b3c' },
    { x: 2050, scale: 0.9, tone: '#3e733e' },
    { x: 3050, scale: 0.82, tone: '#4a8348' }
  ];

  for (const tree of trees) {
    const x = tree.x - game.cameraX * 0.72;
    if (x < -160 || x > game.width + 160) continue;
    drawRealisticTree(x, game.groundY + 6, tree.scale, tree.tone);
  }
}

function drawNPCs() {
  const npcs = [
    { x: 520, shirt: '#3f6f9f' },
    { x: 1350, shirt: '#8f4f78' },
    { x: 1980, shirt: '#5d8f54' },
    { x: 2620, shirt: '#a76c3f' }
  ];

  for (const npc of npcs) {
    const x = npc.x - game.cameraX;
    if (x < -70 || x > game.width + 70) continue;
    drawNPC(x, game.groundY - 80, npc.shirt);
  }
}

function drawNPC(x, y, shirtColor) {
  const wave = Math.sin(performance.now() / 260 + x) * 8;
  ctx.fillStyle = '#f1c99a';
  ctx.beginPath();
  ctx.arc(x + 18, y + 14, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x + 7, y + 28, 22, 30);
  ctx.strokeStyle = '#2f241e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 34);
  ctx.lineTo(x - 4, y + 45 + wave);
  ctx.moveTo(x + 28, y + 34);
  ctx.lineTo(x + 42, y + 44 - wave);
  ctx.moveTo(x + 13, y + 58);
  ctx.lineTo(x + 8, y + 76);
  ctx.moveTo(x + 23, y + 58);
  ctx.lineTo(x + 30, y + 76);
  ctx.stroke();
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

  const moving = Math.abs(player.velocityX) > 0.1;
  const frames = getPlayerFrames(moving);
  const frameDuration = player.attacking ? 75 : moving ? 130 : 280;
  const image = frames[Math.floor(performance.now() / frameDuration) % frames.length];
  const drawWidth = 118;
  const drawHeight = 142;
  const drawX = x - 42;
  const drawY = player.y + player.height - drawHeight + 8;

  if (image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (player.facing === -1) {
      ctx.translate(drawX + drawWidth, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, drawY, drawWidth, drawHeight);
    } else {
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
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
  }
}

function getPlayerFrames(moving) {
  if (player.attacking) return sprites.player.attack;
  if (!player.onGround) return sprites.player.jump;
  if (moving) return sprites.player.walk;
  return sprites.player.idle;
}

function drawSwordSwing() {
  const swingProgress = 1 - player.attackTimer / 14;
  const eased = Math.sin(swingProgress * Math.PI * 0.9);

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
  const facing = player.x < enemy.x ? -1 : 1;

  if (enemy.type === 'Dark Skyhawk') {
    drawDarkSkyhawk(enemy, x, facing);
    drawEnemyHealth(enemy, x);
    return;
  }

  if (enemy.type === 'troll') {
    drawDarkTroll(enemy, x, facing);
    drawEnemyHealth(enemy, x);
    return;
  }

  if (enemy.type === 'skyWraith') {
    drawSkyWraith(enemy, x);
    drawEnemyHealth(enemy, x);
    return;
  }

  if (enemy.type === 'duskRaven') {
    drawDuskRaven(enemy, x, facing);
    drawEnemyHealth(enemy, x);
    return;
  }

  const frames = enemy.boss ? sprites.boss : enemy.type === 'claw' ? sprites.claw : sprites.hound;
  const image = frames[Math.floor(performance.now() / (enemy.type === 'hound' ? 90 : 260)) % frames.length];
  const drawX = enemy.boss ? x - 18 : enemy.type === 'hound' ? x - 28 : x - 10;
  const drawY = enemy.boss ? enemy.y - 24 : enemy.type === 'hound' ? enemy.y - 24 : enemy.y - 20;
  const drawWidth = enemy.boss ? enemy.width + 42 : enemy.type === 'hound' ? enemy.width + 48 : enemy.width + 24;
  const drawHeight = enemy.boss ? enemy.height + 36 : enemy.type === 'hound' ? enemy.height + 38 : enemy.height + 32;

  if (enemy.boss) {
    drawBossTentacles(enemy, x);
  }

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

  drawEnemyHealth(enemy, x);
}

function drawEnemyHealth(enemy, x) {
  const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
  ctx.fillStyle = '#331719';
  ctx.fillRect(x, enemy.y - 12, enemy.width, 6);
  ctx.fillStyle = enemy.boss ? '#91d6d0' : '#db3d4b';
  ctx.fillRect(x, enemy.y - 12, enemy.width * healthPercent, 6);

  if (enemy.boss) {
    ctx.fillStyle = '#f6f2df';
    ctx.font = '16px Arial';
    ctx.fillText(enemy.type, x - 8, enemy.y - 20);
  }
}

function drawDarkTroll(enemy, x, facing) {
  const frames = sprites.level2.troll;
  const image = frames[Math.floor(performance.now() / 280) % frames.length];
  const drawX = x - 22;
  const drawY = enemy.y - 12;
  const drawWidth = enemy.width + 40;
  const drawHeight = enemy.height + 24;

  ctx.save();
  if (facing === 1) {
    ctx.translate(drawX + drawWidth, drawY);
    ctx.scale(-1, 1);
    drawSprite(image, 0, 0, drawWidth, drawHeight, () => {}, false);
  } else {
    drawSprite(image, drawX, drawY, drawWidth, drawHeight, () => {}, false);
  }
  ctx.restore();
  drawSpikedClub(x, enemy.y, facing);
}

function drawSpikedClub(x, y, facing) {
  const handX = x + (facing === -1 ? 12 : 54);
  const handY = y + 36;

  ctx.save();
  ctx.translate(handX, handY);
  ctx.scale(facing, 1);
  ctx.rotate(-0.55);
  ctx.fillStyle = '#5b3924';
  ctx.fillRect(-4, -4, 66, 8);
  ctx.fillStyle = '#2e241f';
  ctx.fillRect(42, -14, 32, 28);
  ctx.fillStyle = '#d8d0bf';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(48 + i * 7, -14);
    ctx.lineTo(52 + i * 7, -25);
    ctx.lineTo(56 + i * 7, -14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSkyWraith(enemy, x) {
  const bob = Math.sin(performance.now() / 260 + enemy.id) * 6;
  const y = enemy.y + bob;
  const gradient = ctx.createRadialGradient(x + 30, y + 28, 5, x + 30, y + 28, 48);
  gradient.addColorStop(0, '#5b6cff');
  gradient.addColorStop(0.45, '#23264e');
  gradient.addColorStop(1, 'rgba(10, 11, 25, 0.15)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x + 32, y + 28, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dbe8ff';
  ctx.fillRect(x + 21, y + 18, 7, 7);
  ctx.fillRect(x + 39, y + 18, 7, 7);
  ctx.fillStyle = '#14151f';
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 50);
  ctx.lineTo(x + 24, y + 76);
  ctx.lineTo(x + 38, y + 52);
  ctx.lineTo(x + 52, y + 76);
  ctx.lineTo(x + 62, y + 50);
  ctx.closePath();
  ctx.fill();
}

function drawDuskRaven(enemy, x, facing) {
  const flap = Math.sin(performance.now() / 90 + enemy.id) * 16;
  const bodyX = x + enemy.width / 2;
  const bodyY = enemy.y + enemy.height / 2;

  ctx.save();
  ctx.translate(bodyX, bodyY);
  ctx.scale(facing === 1 ? -1 : 1, 1);

  const wingGradient = ctx.createLinearGradient(-52, -24, 52, 24);
  wingGradient.addColorStop(0, '#070911');
  wingGradient.addColorStop(0.55, '#1b2034');
  wingGradient.addColorStop(1, '#070911');
  ctx.fillStyle = wingGradient;

  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(-48, -28 - flap, -74, 6);
  ctx.quadraticCurveTo(-42, 2 + flap, -10, 18);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.quadraticCurveTo(48, -28 - flap, 74, 6);
  ctx.quadraticCurveTo(42, 2 + flap, 10, 18);
  ctx.closePath();
  ctx.fill();

  const bodyGradient = ctx.createRadialGradient(0, -4, 4, 0, 0, 28);
  bodyGradient.addColorStop(0, '#363b57');
  bodyGradient.addColorStop(0.62, '#151827');
  bodyGradient.addColorStop(1, '#05060b');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 4, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#06070d';
  ctx.beginPath();
  ctx.moveTo(18, -5);
  ctx.lineTo(39, 3);
  ctx.lineTo(18, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d34c61';
  ctx.fillRect(9, -8, 5, 5);
  ctx.restore();
}

function drawDarkSkyhawk(enemy, x, facing) {
  const sheet = sprites.level2.phoenix;
  if (!sheet.complete || sheet.naturalWidth === 0) {
    drawSkyWraith(enemy, x);
    return;
  }

  const frame = Math.floor(performance.now() / 120) % 10;
  const sourceX = frame * 32;
  const sourceY = 0;
  const bob = Math.sin(performance.now() / 300) * 10;
  const drawWidth = enemy.width + 36;
  const drawHeight = enemy.height + 36;
  const drawX = x - 18;
  const drawY = enemy.y - 18 + bob;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (facing === 1) {
    ctx.translate(drawX + drawWidth, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, sourceX, sourceY, 32, 32, 0, 0, drawWidth, drawHeight);
  } else {
    ctx.drawImage(sheet, sourceX, sourceY, 32, 32, drawX, drawY, drawWidth, drawHeight);
  }
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(18, 26, 43, 0.22)';
  ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function drawBossTentacles(enemy, screenX) {
  const time = performance.now() / 420;
  const baseY = enemy.y + enemy.height - 24;
  const tentacles = [
    { start: 14, length: 108, lift: -54, phase: 0.1, side: -1 },
    { start: 38, length: 138, lift: -72, phase: 1.4, side: -1 },
    { start: 74, length: 124, lift: -84, phase: 2.2, side: 1 },
    { start: 106, length: 112, lift: -58, phase: 3.1, side: 1 },
    { start: 92, length: 92, lift: 10, phase: 4.2, side: 1 },
    { start: 28, length: 86, lift: 4, phase: 5.0, side: -1 }
  ];

  for (const tentacle of tentacles) {
    const sway = Math.sin(time + tentacle.phase) * 18;
    const startX = screenX + tentacle.start;
    const endX = startX + tentacle.side * tentacle.length;
    const endY = baseY + tentacle.lift + Math.cos(time + tentacle.phase) * 12;
    const controlX = startX + tentacle.side * tentacle.length * 0.48 + sway;
    const controlY = baseY + tentacle.lift * 0.42 + Math.sin(time + tentacle.phase * 1.7) * 22;

    const gradient = ctx.createLinearGradient(startX, baseY, endX, endY);
    gradient.addColorStop(0, '#25434d');
    gradient.addColorStop(0.55, '#172b34');
    gradient.addColorStop(1, '#0a151d');

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = gradient;
    ctx.lineWidth = tentacle.length > 120 ? 20 : 16;
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(145, 214, 208, 0.28)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX + tentacle.side * 3, baseY - 4);
    ctx.quadraticCurveTo(controlX, controlY - 7, endX, endY - 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(145, 214, 208, 0.38)';
    for (let spot = 1; spot <= 3; spot++) {
      const t = spot / 4;
      const dotX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
      const dotY = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * controlY + t * t * endY;
      ctx.beginPath();
      ctx.arc(dotX, dotY + 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
  const level = getLevel();
  ctx.fillStyle = '#f6f2df';
  ctx.font = '18px Arial';
  const remaining = Math.max(0, level.enemyTarget - game.enemiesDefeated);
  const text = game.bossSpawned
    ? `Mini boss: defeat the ${level.bossName}!`
    : `Level ${game.currentLevel}: ${level.name} - defeat ${remaining} more enemies.`;
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
