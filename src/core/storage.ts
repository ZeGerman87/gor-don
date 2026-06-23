const HS = 'bakman.highscore';
const MUTE = 'bakman.mute';

export function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HS) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function setHighScore(s: number): void {
  try {
    localStorage.setItem(HS, String(s));
  } catch {
    /* ignore */
  }
}

export function getMuted(): boolean {
  try {
    return localStorage.getItem(MUTE) === '1';
  } catch {
    return false;
  }
}

export function setMuted(m: boolean): void {
  try {
    localStorage.setItem(MUTE, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}
