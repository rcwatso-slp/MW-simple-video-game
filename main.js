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
    loadSprite('assets/art/shadow-hound-1.png'),
    loadSprite('assets/art/shadow-hound-2.png')
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

function drawBackground() {
  ctx.fillStyle = '#10160f';
  ctx.fillRect(0, 0, game.width, game.height);

  ctx.fillStyle = '#1c2d2b';
  ctx.fillRect(0, 250, game.width, 180);

  ctx.fillStyle = 'rgba(98, 156, 155, 0.22)';
  for (let i = 0; i < 6; i++) {
    const cloudX = (i * 260 - game.cameraX * 0.18) % (game.width + 260);
    const x = cloudX < -120 ? cloudX + game.width + 260 : cloudX;
    const image = i % 2 === 0 ? sprites.tiles.cloudA : sprites.tiles.cloudB;
    drawTile(image, x, 72 + (i % 3) * 38, 96);
  }

  ctx.fillStyle = '#222817';
  ctx.fillRect(0, game.groundY, game.width, game.height - game.groundY);

  const tileSize = 54;
  const firstTile = Math.floor(game.cameraX / tileSize) - 1;
  const lastTile = firstTile + Math.ceil(game.width / tileSize) + 3;

  for (let tile = firstTile; tile <= lastTile; tile++) {
    const x = tile * tileSize - game.cameraX;
    const topTile = tile % 2 === 0 ? sprites.tiles.grass : sprites.tiles.grassAlt;
    drawTile(topTile, x, game.groundY - tileSize, tileSize);
    drawTile(sprites.tiles.dirt, x, game.groundY, tileSize);
    drawTile(sprites.tiles.dirt, x, game.groundY + tileSize, tileSize);
  }

  drawScenery();
}

function drawScenery() {
  const ruins = [
    { x: 340, y: 300, cols: 1, rows: 3 },
    { x: 720, y: 336, cols: 3, rows: 2 },
    { x: 1280, y: 282, cols: 1, rows: 3 },
    { x: 1880, y: 336, cols: 4, rows: 2 },
    { x: 2520, y: 300, cols: 2, rows: 3 }
  ];

  const backgroundTrees = [
    { x: 90, image: sprites.foliage.pineTall, w: 88, h: 211, y: 226 },
    { x: 420, image: sprites.foliage.treeRound, w: 109, h: 191, y: 240 },
    { x: 780, image: sprites.foliage.deadTree, w: 42, h: 138, y: 292 },
    { x: 1160, image: sprites.foliage.orangeTree, w: 122, h: 172, y: 258 },
    { x: 1520, image: sprites.foliage.pineSnow, w: 102, h: 190, y: 240 },
    { x: 1940, image: sprites.foliage.redTree, w: 122, h: 172, y: 258 },
    { x: 2360, image: sprites.foliage.pineTall, w: 96, h: 230, y: 210 },
    { x: 2760, image: sprites.foliage.treeRound, w: 118, h: 205, y: 226 },
    { x: 3100, image: sprites.foliage.pineSnow, w: 110, h: 206, y: 224 }
  ];

  const foregroundPlants = [
    { x: 250, image: sprites.foliage.bushWide, w: 98, h: 55 },
    { x: 470, image: sprites.foliage.grassTuft, w: 42, h: 60 },
    { x: 650, image: sprites.foliage.bushSmall, w: 79, h: 39 },
    { x: 1010, image: sprites.foliage.grassTuft, w: 38, h: 54 },
    { x: 1370, image: sprites.foliage.bushWide, w: 104, h: 58 },
    { x: 1740, image: sprites.foliage.bushSmall, w: 84, h: 42 },
    { x: 2160, image: sprites.foliage.grassTuft, w: 44, h: 62 },
    { x: 2420, image: sprites.foliage.bushWide, w: 110, h: 62 },
    { x: 2920, image: sprites.foliage.bushSmall, w: 86, h: 42 }
  ];

  const trees = [170, 560, 1080, 1620, 2210, 2850];
  const fires = [900, 2080, 3000];

  for (const tree of backgroundTrees) {
    const screenX = tree.x - game.cameraX * 0.45;
    if (screenX < -160 || screenX > game.width + 160) continue;
    ctx.save();
    ctx.globalAlpha = 0.78;
    drawSprite(tree.image, screenX, tree.y, tree.w, tree.h, () => {}, true);
    ctx.restore();
  }

  for (const treeX of trees) {
    const screenX = treeX - game.cameraX * 0.75;
    if (screenX < -90 || screenX > game.width + 90) continue;
    ctx.fillStyle = '#15100c';
    ctx.fillRect(screenX + 14, 276, 20, 154);
    drawTile(sprites.tiles.treeA, screenX - 40, 208, 82);
    drawTile(sprites.tiles.treeB, screenX + 8, 196, 82);
    drawTile(sprites.tiles.bush, screenX - 28, game.groundY - 48, 54);
    drawTile(sprites.tiles.bush, screenX + 28, game.groundY - 48, 54);
  }

  for (const plant of foregroundPlants) {
    const screenX = plant.x - game.cameraX;
    if (screenX < -120 || screenX > game.width + 120) continue;
    drawSprite(plant.image, screenX, game.groundY - plant.h + 4, plant.w, plant.h, () => {}, true);
  }

  for (const ruin of ruins) {
    const screenX = ruin.x - game.cameraX;
    if (screenX < -220 || screenX > game.width + 220) continue;

    for (let row = 0; row < ruin.rows; row++) {
      for (let col = 0; col < ruin.cols; col++) {
        const tileChoice = [sprites.tiles.stoneA, sprites.tiles.stoneB, sprites.tiles.stoneC][(row + col) % 3];
        drawTile(tileChoice, screenX + col * 48, ruin.y + row * 48, 48);
      }
    }
  }

  for (const fireX of fires) {
    const screenX = fireX - game.cameraX;
    if (screenX < -60 || screenX > game.width + 60) continue;
    ctx.fillStyle = '#4b3521';
    ctx.fillRect(screenX - 18, game.groundY - 12, 36, 12);
    ctx.fillStyle = '#df4f35';
    ctx.fillRect(screenX - 10, game.groundY - 38, 20, 26);
    ctx.fillStyle = '#ffd36d';
    ctx.fillRect(screenX - 5, game.groundY - 50, 10, 22);
  }
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
  const image = frames[Math.floor(performance.now() / 260) % frames.length];
  const drawX = enemy.boss ? x - 18 : x - 10;
  const drawY = enemy.boss ? enemy.y - 24 : enemy.y - 20;
  const drawWidth = enemy.boss ? enemy.width + 42 : enemy.width + 24;
  const drawHeight = enemy.boss ? enemy.height + 36 : enemy.height + 32;

  drawSprite(image, drawX, drawY, drawWidth, drawHeight, () => {
    ctx.fillStyle = enemy.boss ? '#263e48' : enemy.type === 'claw' ? '#38283f' : '#232126';
    ctx.fillRect(x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = enemy.boss ? '#91d6d0' : '#db3d4b';
    ctx.fillRect(x + enemy.width * 0.22, enemy.y + 14, 8, 8);
    ctx.fillRect(x + enemy.width * 0.62, enemy.y + 14, 8, 8);
  });

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
