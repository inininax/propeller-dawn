import type Phaser from 'phaser';

export const PAL = {
  deep: '#05070f',
  navy: '#0b1026',
  copper: '#f2a35c',
  orange: '#e8734a',
  red: '#c9553e',
  cream: '#e8e3d5',
  steel: '#7fb4d9',
  slate: '#3a4a6b',
  crimson: '#ff5a6e',
  violet: '#b06cff',
  amber: '#ffb02e',
  gold: '#ffd75e',
  olive: '#6d7d54',
} as const;

type Draw2D = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw2D): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(`2D context unavailable for ${key}`);
  draw(ctx, w, h);
  scene.textures.addCanvas(key, canvas);
}

function polyPath(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>): void {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  fill: string | CanvasGradient,
  stroke?: string,
): void {
  polyPath(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function ellipseFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string | CanvasGradient,
  stroke?: string,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function bodyGradient(ctx: CanvasRenderingContext2D, top: string, bottom: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, 52);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

export const TEXTURE_GEN_STEPS: Array<(scene: Phaser.Scene) => void> = [
  genPlayerShips,
  genEnemies,
  genBullets,
  genItems,
  genFx,
];

export function generateGameTextures(scene: Phaser.Scene): void {
  for (const step of TEXTURE_GEN_STEPS) step(scene);
}

function genPlayerShips(scene: Phaser.Scene): void {
  canvasTexture(scene, 'ship_lark', 48, 56, (ctx, w) => {
    const cx = w / 2;
    fillPoly(
      ctx,
      [
        [cx, 2],
        [cx - 9, 22],
        [cx - 22, 40],
        [cx - 22, 46],
        [cx - 7, 42],
        [cx - 5, 52],
        [cx + 5, 52],
        [cx + 7, 42],
        [cx + 22, 46],
        [cx + 22, 40],
        [cx + 9, 22],
      ],
      bodyGradient(ctx as CanvasRenderingContext2D, PAL.cream, '#b8b2a0'),
      PAL.slate,
    );
    fillPoly(
      ctx,
      [
        [cx - 22, 34],
        [cx - 30, 44],
        [cx - 22, 44],
      ],
      PAL.copper,
    );
    fillPoly(
      ctx,
      [
        [cx + 22, 34],
        [cx + 30, 44],
        [cx + 22, 44],
      ],
      PAL.copper,
    );
    ellipseFill(ctx, cx, 18, 4, 7, PAL.steel);
    fillPoly(
      ctx,
      [
        [cx, 0],
        [cx - 3, 8],
        [cx + 3, 8],
      ],
      PAL.red,
    );
  });

  canvasTexture(scene, 'ship_kite', 44, 58, (ctx, w) => {
    const cx = w / 2;
    fillPoly(
      ctx,
      [
        [cx, 2],
        [cx - 7, 26],
        [cx - 20, 48],
        [cx - 6, 44],
        [cx - 4, 55],
        [cx + 4, 55],
        [cx + 6, 44],
        [cx + 20, 48],
        [cx + 7, 26],
      ],
      bodyGradient(ctx as CanvasRenderingContext2D, '#cfe4f2', PAL.steel),
      '#2c3e57',
    );
    fillPoly(
      ctx,
      [
        [cx, 6],
        [cx - 3, 30],
        [cx + 3, 30],
      ],
      '#ffffff',
    );
    ellipseFill(ctx, cx, 20, 3, 8, PAL.navy);
    fillPoly(
      ctx,
      [
        [cx - 20, 42],
        [cx - 26, 50],
        [cx - 20, 49],
      ],
      PAL.crimson,
    );
    fillPoly(
      ctx,
      [
        [cx + 20, 42],
        [cx + 26, 50],
        [cx + 20, 49],
      ],
      PAL.crimson,
    );
  });

  canvasTexture(scene, 'ship_rook', 56, 54, (ctx, w) => {
    const cx = w / 2;
    fillPoly(
      ctx,
      [
        [cx, 3],
        [cx - 12, 20],
        [cx - 27, 36],
        [cx - 27, 45],
        [cx - 10, 43],
        [cx - 8, 51],
        [cx + 8, 51],
        [cx + 10, 43],
        [cx + 27, 45],
        [cx + 27, 36],
        [cx + 12, 20],
      ],
      bodyGradient(ctx as CanvasRenderingContext2D, PAL.olive, '#474f36'),
      '#23281a',
    );
    fillPoly(
      ctx,
      [
        [cx - 27, 30],
        [cx - 34, 42],
        [cx - 27, 41],
      ],
      PAL.amber,
    );
    fillPoly(
      ctx,
      [
        [cx + 27, 30],
        [cx + 34, 42],
        [cx + 27, 41],
      ],
      PAL.amber,
    );
    ellipseFill(ctx, cx, 17, 6, 8, '#2f3a26', PAL.gold);
    fillPoly(
      ctx,
      [
        [cx - 8, 44],
        [cx - 8, 51],
        [cx - 4, 51],
      ],
      '#23281a',
    );
    fillPoly(
      ctx,
      [
        [cx + 8, 44],
        [cx + 8, 51],
        [cx + 4, 51],
      ],
      '#23281a',
    );
  });
}

function enemyBody(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  top: string,
  bottom: string,
  stroke: string,
): void {
  const g = ctx.createLinearGradient(0, 0, 0, 60);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  fillPoly(ctx, pts, g, stroke);
}

function genEnemies(scene: Phaser.Scene): void {
  canvasTexture(scene, 'enemy_scoutFinch', 36, 36, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 33],
        [cx - 6, 14],
        [cx - 14, 4],
        [cx - 4, 8],
        [cx, 3],
        [cx + 4, 8],
        [cx + 14, 4],
        [cx + 6, 14],
      ],
      '#8a2f38',
      PAL.crimson,
      '#4d1420',
    );
    ellipseFill(ctx, cx, 13, 2.5, 5, PAL.amber);
  });

  canvasTexture(scene, 'enemy_hookInterceptor', 40, 40, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 36],
        [cx - 8, 18],
        [cx - 19, 10],
        [cx - 15, 20],
        [cx - 8, 26],
        [cx, 30],
        [cx + 8, 26],
        [cx + 15, 20],
        [cx + 19, 10],
        [cx + 8, 18],
      ],
      '#7a2333',
      PAL.violet,
      '#33103a',
    );
    ellipseFill(ctx, cx, 16, 3, 6, PAL.gold);
  });

  canvasTexture(scene, 'enemy_morrowBomber', 60, 46, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 42],
        [cx - 10, 30],
        [cx - 29, 32],
        [cx - 25, 18],
        [cx - 10, 12],
        [cx, 4],
        [cx + 10, 12],
        [cx + 25, 18],
        [cx + 29, 32],
        [cx + 10, 30],
      ],
      '#5a2a5e',
      '#8f4bd1',
      '#2a1230',
    );
    ellipseFill(ctx, cx, 24, 6, 8, PAL.crimson, '#3d0f16');
    ellipseFill(ctx, cx - 20, 24, 3.5, 6, PAL.slate);
    ellipseFill(ctx, cx + 20, 24, 3.5, 6, PAL.slate);
  });

  canvasTexture(scene, 'enemy_cradleCarrier', 74, 66, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 62],
        [cx - 16, 50],
        [cx - 36, 50],
        [cx - 36, 20],
        [cx - 14, 12],
        [cx, 4],
        [cx + 14, 12],
        [cx + 36, 20],
        [cx + 36, 50],
        [cx + 16, 50],
      ],
      '#37404f',
      '#5c6878',
      '#161b22',
    );
    ctx.fillStyle = '#12161d';
    ctx.fillRect(cx - 12, 34, 24, 20);
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(cx - 12, 34, 24, 4);
    ellipseFill(ctx, cx, 16, 5, 5, PAL.crimson);
  });

  canvasTexture(scene, 'enemy_aegisKite', 54, 54, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 50],
        [cx - 14, 30],
        [cx - 25, 14],
        [cx - 10, 10],
        [cx, 3],
        [cx + 10, 10],
        [cx + 25, 14],
        [cx + 14, 30],
      ],
      '#204a63',
      '#3fa0c8',
      '#0f2a3a',
    );
    ellipseFill(ctx, cx, 20, 7, 7, PAL.gold, '#7a5a10');
    ctx.strokeStyle = PAL.steel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 24, 21, 0, Math.PI * 2);
    ctx.stroke();
  });

  canvasTexture(scene, 'enemy_razorSwift', 34, 38, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 34],
        [cx - 5, 16],
        [cx - 16, 6],
        [cx - 3, 10],
        [cx, 4],
        [cx + 3, 10],
        [cx + 16, 6],
        [cx + 5, 16],
      ],
      '#5a6068',
      '#aab4be',
      '#22262c',
    );
    ellipseFill(ctx, cx, 15, 2, 6, PAL.crimson);
  });

  canvasTexture(scene, 'enemy_cinderRay', 46, 42, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 38],
        [cx - 8, 24],
        [cx - 22, 26],
        [cx - 14, 12],
        [cx, 3],
        [cx + 14, 12],
        [cx + 22, 26],
        [cx + 8, 24],
      ],
      '#7c3018',
      PAL.orange,
      '#3a1206',
    );
    ellipseFill(ctx, cx, 18, 4, 7, PAL.violet);
  });

  canvasTexture(scene, 'enemy_beaconWasp', 42, 44, (ctx, w) => {
    const cx = w / 2;
    const g = ctx.createRadialGradient(cx, 18, 4, cx, 22, 20);
    g.addColorStop(0, PAL.amber);
    g.addColorStop(1, '#7c4a10');
    ellipseFill(ctx, cx, 22, 17, 19, g, '#3a2408');
    ellipseFill(ctx, cx, 30, 5, 5, PAL.crimson, '#3d0f16');
    fillPoly(
      ctx,
      [
        [cx - 17, 14],
        [cx - 26, 4],
        [cx - 13, 8],
      ],
      '#3a2408',
    );
    fillPoly(
      ctx,
      [
        [cx + 17, 14],
        [cx + 26, 4],
        [cx + 13, 8],
      ],
      '#3a2408',
    );
  });

  canvasTexture(scene, 'enemy_vulcanRook', 58, 58, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 54],
        [cx - 12, 40],
        [cx - 28, 30],
        [cx - 18, 10],
        [cx, 3],
        [cx + 18, 10],
        [cx + 28, 30],
        [cx + 12, 40],
      ],
      '#5e1f24',
      '#b03a42',
      '#2c0c10',
    );
    fillPoly(
      ctx,
      [
        [cx - 28, 30],
        [cx - 34, 38],
        [cx - 26, 37],
      ],
      PAL.gold,
    );
    fillPoly(
      ctx,
      [
        [cx + 28, 30],
        [cx + 34, 38],
        [cx + 26, 37],
      ],
      PAL.gold,
    );
    ellipseFill(ctx, cx, 22, 8, 8, '#2c0c10', PAL.gold);
    ellipseFill(ctx, cx, 22, 4, 4, PAL.crimson);
  });

  canvasTexture(scene, 'enemy_bulwarkCruiser', 98, 90, (ctx, w) => {
    const cx = w / 2;
    enemyBody(
      ctx,
      [
        [cx, 86],
        [cx - 18, 72],
        [cx - 48, 70],
        [cx - 48, 34],
        [cx - 22, 24],
        [cx, 6],
        [cx + 22, 24],
        [cx + 48, 34],
        [cx + 48, 70],
        [cx + 18, 72],
      ],
      '#33393f',
      '#565e66',
      '#14171b',
    );
    ellipseFill(ctx, cx - 34, 48, 9, 12, '#20242a', PAL.crimson);
    ellipseFill(ctx, cx + 34, 48, 9, 12, '#20242a', PAL.crimson);
    ellipseFill(ctx, cx, 34, 12, 12, '#20242a', PAL.amber);
    ellipseFill(ctx, cx, 34, 6, 6, PAL.amber);
    ctx.fillStyle = '#20242a';
    ctx.fillRect(cx - 6, 56, 12, 18);
  });
}

function genBullets(scene: Phaser.Scene): void {
  canvasTexture(scene, 'b_dot', 14, 14, (ctx) => {
    const g = ctx.createRadialGradient(7, 7, 1, 7, 7, 7);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#ffffff');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(7, 7, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  canvasTexture(scene, 'b_needle', 12, 26, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 26);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(11, 8, 11, 16);
    ctx.lineTo(1, 16);
    ctx.quadraticCurveTo(1, 8, 6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillRect(3, 14, 6, 12);
  });

  canvasTexture(scene, 'b_orb', 24, 24, (ctx) => {
    const g = ctx.createRadialGradient(12, 12, 2, 12, 12, 12);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(12, 12, 8.5, 0, Math.PI * 2);
    ctx.stroke();
  });

  canvasTexture(scene, 'b_shard', 16, 18, (ctx) => {
    ctx.fillStyle = '#ffffff';
    fillPoly(
      ctx,
      [
        [8, 17],
        [1, 4],
        [8, 0],
        [15, 4],
      ],
      '#ffffff',
    );
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    fillPoly(
      ctx,
      [
        [8, 17],
        [4, 6],
        [8, 3],
      ],
      'rgba(255,255,255,0.55)',
    );
  });

  canvasTexture(scene, 'p_shot', 10, 20, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 20);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(242,163,92,0)');
    ctx.fillStyle = g;
    ctx.fillRect(3, 0, 4, 16);
    ctx.fillStyle = '#fff7e0';
    ctx.fillRect(2, 2, 6, 6);
  });

  canvasTexture(scene, 'laser_beam', 26, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,176,46,0)');
    g.addColorStop(0.35, PAL.amber);
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(0.65, PAL.amber);
    g.addColorStop(1, 'rgba(255,176,46,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function genItems(scene: Phaser.Scene): void {
  const itemSpecs: Array<[string, string, string, Draw2D]> = [
    [
      'item_power',
      PAL.red,
      'P',
      (ctx, w, h) => {
        const cx = w / 2;
        fillPoly(
          ctx,
          [
            [cx, h / 2 - 7],
            [cx - 7, h / 2 + 2],
            [cx - 2.5, h / 2 + 2],
            [cx - 2.5, h / 2 + 8],
            [cx + 2.5, h / 2 + 8],
            [cx + 2.5, h / 2 + 2],
            [cx + 7, h / 2 + 2],
          ],
          '#ffffff',
        );
      },
    ],
    [
      'item_bomb',
      '#3f6d8e',
      'B',
      (ctx, w, h) => {
        const cx = w / 2;
        ellipseFill(ctx, cx, h / 2 + 2, 6, 6, '#ffffff');
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 2, h / 2 - 4);
        ctx.quadraticCurveTo(cx + 8, h / 2 - 8, cx + 5, h / 2 - 12);
        ctx.stroke();
      },
    ],
    [
      'item_medal',
      '#8a6d1a',
      'M',
      (ctx, w, h) => {
        const cx = w / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const b = a + Math.PI / 5;
          const px = cx + Math.cos(a) * 8;
          const py = h / 2 + Math.sin(a) * 8;
          const qx = cx + Math.cos(b) * 3.5;
          const qy = h / 2 + Math.sin(b) * 3.5;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          ctx.lineTo(qx, qy);
        }
        ctx.closePath();
        ctx.fill();
      },
    ],
    [
      'item_shield',
      '#2e7d5b',
      'S',
      (ctx, w, h) => {
        const cx = w / 2;
        fillPoly(
          ctx,
          [
            [cx, h / 2 - 9],
            [cx + 8, h / 2 - 4],
            [cx + 8, h / 2 + 3],
            [cx, h / 2 + 9],
            [cx - 8, h / 2 + 3],
            [cx - 8, h / 2 - 4],
          ],
          '#ffffff',
        );
      },
    ],
  ];
  for (const [key, color, , glyph] of itemSpecs) {
    canvasTexture(scene, key, 30, 30, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 3, w / 2, h / 2, 14);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, color);
      g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ellipseFill(ctx, w / 2, h / 2, 13, 13, g, color);
      glyph(ctx, w, h);
    });
  }
}

function genFx(scene: Phaser.Scene): void {
  canvasTexture(scene, 'fx_ring', 96, 96, (ctx) => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(48, 48, 42, 0, Math.PI * 2);
    ctx.stroke();
  });

  canvasTexture(scene, 'p_spark', 10, 10, (ctx) => {
    const g = ctx.createRadialGradient(5, 5, 0.5, 5, 5, 5);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 10, 10);
  });

  canvasTexture(scene, 'p_smoke', 28, 28, (ctx) => {
    const g = ctx.createRadialGradient(14, 14, 2, 14, 14, 14);
    g.addColorStop(0, 'rgba(200,200,200,0.7)');
    g.addColorStop(1, 'rgba(200,200,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 28, 28);
  });

  canvasTexture(scene, 'hitbox_dot', 12, 12, (ctx) => {
    ctx.fillStyle = '#7CFC9A';
    ctx.beginPath();
    ctx.arc(6, 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(124,252,154,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6, 6, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  });

  canvasTexture(scene, 'shield_bubble', 76, 76, (ctx) => {
    const g = ctx.createRadialGradient(38, 38, 20, 38, 38, 37);
    g.addColorStop(0, 'rgba(126,220,180,0.05)');
    g.addColorStop(0.8, 'rgba(126,220,180,0.18)');
    g.addColorStop(1, 'rgba(126,220,180,0.4)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(38, 38, 37, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,240,200,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

export function generateBossTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'boss_solbreaker', 340, 150, (ctx, w, h) => {
    const cx = w / 2;
    const hullG = ctx.createLinearGradient(0, 0, 0, h);
    hullG.addColorStop(0, '#4a3040');
    hullG.addColorStop(0.5, '#7a3b46');
    hullG.addColorStop(1, '#33202c');
    fillPoly(
      ctx,
      [
        [cx, 10],
        [cx - 40, 30],
        [cx - 168, 44],
        [cx - 168, 108],
        [cx - 40, 122],
        [cx, 142],
        [cx + 40, 122],
        [cx + 168, 108],
        [cx + 168, 44],
        [cx + 40, 30],
      ],
      hullG,
      '#1c1016',
    );
    fillPoly(
      ctx,
      [
        [cx - 168, 52],
        [cx - 196, 64],
        [cx - 196, 88],
        [cx - 168, 100],
      ],
      '#241820',
      '#1c1016',
    );
    fillPoly(
      ctx,
      [
        [cx + 168, 52],
        [cx + 196, 64],
        [cx + 196, 88],
        [cx + 168, 100],
      ],
      '#241820',
      '#1c1016',
    );
    ellipseFill(ctx, cx, 76, 26, 26, '#1c1016', PAL.amber);
    ellipseFill(ctx, cx, 76, 16, 16, '#2c1520', PAL.orange);
    ellipseFill(ctx, cx - 110, 74, 20, 20, '#241820', PAL.crimson);
    ellipseFill(ctx, cx + 110, 74, 20, 20, '#241820', PAL.crimson);
    for (const sx of [-70, 0, 70]) {
      ellipseFill(ctx, cx + sx, 118, 10, 8, '#141018', '#3d2a33');
    }
    fillPoly(
      ctx,
      [
        [cx - 30, 22],
        [cx - 22, 6],
        [cx - 14, 22],
      ],
      PAL.amber,
    );
    fillPoly(
      ctx,
      [
        [cx + 30, 22],
        [cx + 22, 6],
        [cx + 14, 22],
      ],
      PAL.amber,
    );
  });

  canvasTexture(scene, 'boss_embercrown', 350, 180, (ctx, w, h) => {
    const cx = w / 2;
    const hullG = ctx.createLinearGradient(0, 0, 0, h);
    hullG.addColorStop(0, '#5e2417');
    hullG.addColorStop(0.55, '#8a3a20');
    hullG.addColorStop(1, '#3a150c');
    fillPoly(
      ctx,
      [
        [cx, 14],
        [cx - 34, 40],
        [cx - 60, 36],
        [cx - 78, 66],
        [cx - 60, 96],
        [cx - 30, 104],
        [cx - 44, 140],
        [cx, 166],
        [cx + 44, 140],
        [cx + 30, 104],
        [cx + 60, 96],
        [cx + 78, 66],
        [cx + 60, 36],
        [cx + 34, 40],
      ],
      hullG,
      '#210b06',
    );
    fillPoly(
      ctx,
      [
        [cx - 78, 52],
        [cx - 172, 44],
        [cx - 172, 84],
        [cx - 78, 92],
      ],
      '#4a1a0e',
      '#210b06',
    );
    fillPoly(
      ctx,
      [
        [cx + 78, 52],
        [cx + 172, 44],
        [cx + 172, 84],
        [cx + 78, 92],
      ],
      '#4a1a0e',
      '#210b06',
    );
    ellipseFill(ctx, cx - 125, 68, 22, 26, '#2c0e07', PAL.orange);
    ellipseFill(ctx, cx + 125, 68, 22, 26, '#2c0e07', PAL.orange);
    ellipseFill(ctx, cx, 62, 30, 30, '#2c0e07', PAL.gold);
    ellipseFill(ctx, cx, 62, 18, 18, PAL.orange, '#ffe9b0');
    ellipseFill(ctx, cx, 130, 24, 20, '#1c0805', PAL.crimson);
    ellipseFill(ctx, cx, 130, 12, 10, '#3d0f16', PAL.crimson);
  });
}
