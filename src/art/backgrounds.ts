import type Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/constants';

export interface ParallaxLayerSpec {
  key: string;
  scrollSpeed: number;
  tilePosX: number;
  tilePosY: number;
  width: number;
  height: number;
  alpha?: number;
}

const THEMES = {
  dawn: {
    skyTop: '#0b1026',
    skyMid: '#33254d',
    skyLow: '#a34d2e',
    horizon: '#f2a35c',
    cloudFar: 'rgba(232,115,74,0.16)',
    cloudNear: 'rgba(127,180,217,0.13)',
    silhouette: '#141024',
    accent: '#c9553e',
  },
  ember: {
    skyTop: '#160a12',
    skyMid: '#43141a',
    skyLow: '#7c2418',
    horizon: '#e8734a',
    cloudFar: 'rgba(255,90,110,0.10)',
    cloudNear: 'rgba(255,176,46,0.08)',
    silhouette: '#0d060a',
    accent: '#ffb02e',
  },
} as const;

export type ThemeName = keyof typeof THEMES;

function drawSky(theme: ThemeName): (ctx: CanvasRenderingContext2D, w: number, h: number) => void {
  return (ctx, w, h) => {
    const t = THEMES[theme];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, t.skyTop);
    g.addColorStop(0.55, t.skyMid);
    g.addColorStop(0.85, t.skyLow);
    g.addColorStop(1, t.horizon);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (theme === 'dawn') {
      const sun = ctx.createRadialGradient(w * 0.72, h * 0.78, 20, w * 0.72, h * 0.78, 260);
      sun.addColorStop(0, 'rgba(255,215,140,0.9)');
      sun.addColorStop(0.25, 'rgba(242,163,92,0.35)');
      sun.addColorStop(1, 'rgba(242,163,92,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
    } else {
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.85, 30, w * 0.5, h * 0.85, 320);
      glow.addColorStop(0, 'rgba(255,120,60,0.5)');
      glow.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(5,7,15,0.35)';
    for (let i = 0; i < 70; i++) {
      const x = ((i * 137) % w) + ((i % 3) - 1);
      const y = (i * 89) % Math.floor(h * 0.45);
      ctx.globalAlpha = 0.25 + ((i * 7) % 10) / 18;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  };
}

function drawClouds(
  theme: ThemeName,
  color: string,
  count: number,
  minR: number,
  maxR: number,
): (ctx: CanvasRenderingContext2D, w: number, h: number) => void {
  return (ctx, w, h) => {
    void THEMES[theme];
    ctx.fillStyle = color;
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const cx = rand() * w;
      const cy = rand() * h;
      const r = minR + rand() * (maxR - minR);
      const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

function drawSilhouettes(
  theme: ThemeName,
): (ctx: CanvasRenderingContext2D, w: number, h: number) => void {
  return (ctx, w, h) => {
    const t = THEMES[theme];
    ctx.fillStyle = t.silhouette;
    if (theme === 'dawn') {
      const mesas: Array<[number, number, number]> = [
        [30, 90, 150],
        [150, 130, 100],
        [290, 80, 170],
        [420, 120, 120],
      ];
      for (const [x, bw, bh] of mesas) {
        ctx.fillRect(x, h - bh, bw, bh);
        ctx.beginPath();
        ctx.moveTo(x - 14, h - bh + 6);
        ctx.lineTo(x + bw * 0.35, h - bh - 26);
        ctx.lineTo(x + bw * 0.7, h - bh + 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = t.accent;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(296, h - 178, 4, 40);
      ctx.fillRect(310, h - 166, 4, 28);
      ctx.globalAlpha = 1;
    } else {
      for (let x = 10; x < w; x += 64) {
        const bh = 70 + ((x * 13) % 90);
        ctx.fillRect(x, h - bh, 26, bh);
        ctx.fillRect(x - 8, h - bh - 10, 42, 10);
        if (x % 128 === 10) {
          ctx.fillRect(x + 52, h - bh - 40, 8, bh + 40);
          ctx.fillStyle = t.accent;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x + 54, h - bh - 44, 4, 6);
          ctx.globalAlpha = 1;
          ctx.fillStyle = t.silhouette;
        }
      }
    }
    ctx.fillStyle = t.silhouette;
    ctx.fillRect(0, h - 26, w, 26);
  };
}

export function generateBackgroundTextures(scene: Phaser.Scene, theme: ThemeName): void {
  const defs: Array<
    [string, number, number, (ctx: CanvasRenderingContext2D, w: number, h: number) => void]
  > = [
    [`bg_${theme}_sky`, GAME_WIDTH, GAME_HEIGHT, drawSky(theme)],
    [`bg_${theme}_cloudsFar`, 512, 512, drawClouds(theme, THEMES[theme].cloudFar, 22, 40, 130)],
    [`bg_${theme}_cloudsNear`, 512, 512, drawClouds(theme, THEMES[theme].cloudNear, 14, 60, 190)],
    [`bg_${theme}_ground`, 540, 220, drawSilhouettes(theme)],
  ];
  for (const [key, w, h, draw] of defs) {
    if (scene.textures.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    draw(ctx, w, h);
    scene.textures.addCanvas(key, canvas);
  }
}

export class ParallaxBackground {
  private layers: Phaser.GameObjects.TileSprite[] = [];

  constructor(scene: Phaser.Scene, theme: ThemeName) {
    generateBackgroundTextures(scene, theme);
    this.layers.push(
      scene.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, `bg_${theme}_sky`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-100),
    );
    this.layers.push(
      scene.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, `bg_${theme}_cloudsFar`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-99)
        .setAlpha(0.9),
    );
    this.layers.push(
      scene.add
        .tileSprite(0, -40, GAME_WIDTH, GAME_HEIGHT + 80, `bg_${theme}_cloudsNear`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-98)
        .setAlpha(0.95),
    );
    this.layers.push(
      scene.add
        .tileSprite(0, GAME_HEIGHT - 220, GAME_WIDTH, 220, `bg_${theme}_ground`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-97),
    );
  }

  update(deltaMs: number, worldSpeed = 1): void {
    const dtSec = deltaMs / 1000;
    this.layers[1].tilePositionY -= 14 * dtSec * worldSpeed;
    this.layers[2].tilePositionY -= 34 * dtSec * worldSpeed;
    this.layers[3].tilePositionY -= 60 * dtSec * worldSpeed;
    this.layers[3].tilePositionX += 4 * dtSec * worldSpeed;
  }

  destroy(): void {
    for (const layer of this.layers) layer.destroy();
    this.layers = [];
  }
}
