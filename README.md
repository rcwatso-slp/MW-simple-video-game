# Untitled - Sir Zack

This is a small first version of a browser-based side-scrolling combat game.
It uses only HTML, CSS, JavaScript, and local image assets.

## How To Play

- ArrowRight: move forward
- ArrowLeft: move backward
- ArrowUp: jump
- ArrowDown: crouch placeholder
- Spacebar: basic sword swing
- Shift: dash
- 1: Swinging Sword special attack, costs 30 SP
- 2: Slashing Ground special attack, costs 45 SP
- 3: Silent Nightshade Slice special attack, costs 85 SP

Goal: defeat 8 shadow enemies, then defeat the Dark Lake Monster mini boss.

Lose condition: Sir Zack has 100 HP and 3 lives. When all lives are gone, restart the game.

Special attacks use the SP bar. Each regular enemy defeated restores 25 SP.

## Local Run Instructions

1. Keep all files in the same folder.
2. Open `index.html` in a web browser.
3. Play the game.

No install step is needed.

## GitHub Pages Deployment

1. Create a new GitHub repository.
2. Upload these files and folders to the repository root:
   - `index.html`
   - `style.css`
   - `main.js`
   - `README.md`
   - `ASSET_CREDITS.md`
   - `assets`
3. In GitHub, open the repository settings.
4. Go to Pages.
5. Choose `Deploy from a branch`.
6. Choose the `main` branch and the `/root` folder.
7. Save.
8. GitHub will give you a live website URL after the page builds.

## How The Code Works

`index.html` creates the page, the game canvas, the health bar, lives display,
score display, controls, ability placeholders, and restart button.

`style.css` makes the game easy to read. It sizes the canvas, styles the HUD,
and keeps the controls visible under the game.

`main.js` contains the game:

- The player object stores Sir Zack's position, health, speed, lives, and attack state.
- The enemies array stores every enemy currently in the level.
- The game loop runs every frame. It moves the player, moves enemies, checks collisions,
  updates the HUD, and redraws the scene.
- Collision detection uses simple rectangles. If two rectangles overlap, they are touching.
- Enemy spawning creates basic shadow enemies first. After 8 are defeated, the boss appears.
- The sword attack creates a short attack box in front of Sir Zack.
- Special attacks use larger damage boxes and do more damage than the normal sword swing.
- The `assets/art` folder contains the active player, enemy, boss, realistic terrain, foliage, fire, and scenery images.
- `ASSET_CREDITS.md` lists the downloaded art sources and licenses.

## Beginner Expansion Ideas

- Add full walking, jumping, attacking, hurt, and defeat animations.
- Add per-ability cooldown timers or upgrades.
- Add more enemy types with different speeds or attacks.
- Add the placeholder abilities:
  - Swinging Sword
  - Slashing Ground
  - Silent Nightshade Slice
- Add sound effects for jumping, sword hits, enemy defeat, and boss victory.
- Add a second level with a different background.
- Add power-ups that heal Sir Zack or increase sword damage.
