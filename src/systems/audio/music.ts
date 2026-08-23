export type SfxName =
  | 'shoot'
  | 'enemyHit'
  | 'explodeSmall'
  | 'explodeBig'
  | 'playerHit'
  | 'bomb'
  | 'pickupPower'
  | 'pickupMedal'
  | 'pickupUtility'
  | 'graze'
  | 'uiMove'
  | 'uiConfirm'
  | 'uiBack'
  | 'bossWarn'
  | 'extend'
  | 'shieldBreak';

export type MusicTrack = 'title' | 'dawn' | 'ember' | 'boss' | 'result';

export interface MusicSpec {
  bpm: number;
  rootHz: number;
  scale: number[];
  bassPattern: number[];
  leadPattern: number[];
  wave: OscillatorType;
}

export const MUSIC_SPECS: Record<MusicTrack, MusicSpec> = {
  title: {
    bpm: 84,
    rootHz: 220,
    scale: [0, 3, 5, 7, 10],
    bassPattern: [0, 0, 3, 3, 4, 4, 3, 2],
    leadPattern: [7, 10, 12, -1, 10, 12, 14, -1, 15, 14, 12, -1, 10, 7, -1, -1],
    wave: 'triangle',
  },
  dawn: {
    bpm: 128,
    rootHz: 233,
    scale: [0, 2, 4, 7, 9],
    bassPattern: [0, 0, 4, 4, 2, 2, 3, 3],
    leadPattern: [12, -1, 11, 9, -1, 7, -1, 9, 11, -1, 12, -1, 16, 14, 12, -1],
    wave: 'square',
  },
  ember: {
    bpm: 138,
    rootHz: 196,
    scale: [0, 1, 4, 6, 7],
    bassPattern: [0, 0, 1, 1, 4, 4, 6, 4],
    leadPattern: [12, 13, -1, 12, 16, -1, 13, -1, 12, -1, 8, 9, 12, -1, 6, -1],
    wave: 'sawtooth',
  },
  boss: {
    bpm: 152,
    rootHz: 174,
    scale: [0, 2, 3, 5, 7, 8, 10],
    bassPattern: [0, 0, 0, 5, 3, 3, 2, 2],
    leadPattern: [19, -1, 17, 15, 14, -1, 12, 14, 15, -1, 12, 10, 12, -1, -1, -1],
    wave: 'sawtooth',
  },
  result: {
    bpm: 96,
    rootHz: 261,
    scale: [0, 2, 4, 5, 7, 9, 11],
    bassPattern: [0, 0, 4, 4, 5, 5, 4, 2],
    leadPattern: [16, -1, 14, -1, 12, 14, 16, -1, 19, -1, 16, -1, 12, -1, -1, -1],
    wave: 'triangle',
  },
};

const SEMITONE = Math.pow(2, 1 / 12);

export function hzFor(rootHz: number, scale: number[], degree: number): number {
  const octave = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  const semis = scale[idx] + octave * 12;
  return rootHz * Math.pow(SEMITONE, semis);
}
