/**
 * Priority #19: Object Pooling & SDF Font Crispness
 * Pools floating damage numbers, particle bursts, and tile UI objects to eliminate
 * garbage-collection hitches during late-game relic chains and multi-hit cascades.
 */

export class ObjectPool<T> {
  private freeList: T[] = [];
  private activeSet: Set<T> = new Set();
  private readonly factory: () => T;
  private readonly resetter: (item: T) => void;
  private totalCreated = 0;
  private totalReused = 0;

  constructor(factory: () => T, resetter: (item: T) => void, initialCapacity = 16) {
    this.factory = factory;
    this.resetter = resetter;
    for (let i = 0; i < initialCapacity; i++) {
      const obj = this.factory();
      this.resetter(obj);
      this.freeList.push(obj);
      this.totalCreated++;
    }
  }

  public acquire(): T {
    let item: T;
    if (this.freeList.length > 0) {
      item = this.freeList.pop()!;
      this.totalReused++;
    } else {
      item = this.factory();
      this.totalCreated++;
    }
    this.resetter(item);
    this.activeSet.add(item);
    return item;
  }

  public release(item: T): void {
    if (!this.activeSet.has(item)) return;
    this.activeSet.delete(item);
    this.resetter(item);
    this.freeList.push(item);
  }

  public releaseAll(): void {
    for (const item of this.activeSet) {
      this.resetter(item);
      this.freeList.push(item);
    }
    this.activeSet.clear();
  }

  public getActiveItems(): T[] {
    return Array.from(this.activeSet);
  }

  public stats(): {
    activeCount: number;
    freeCount: number;
    totalCreated: number;
    totalReused: number;
    reuseRatio: number;
  } {
    const totalAcquires = this.totalCreated + this.totalReused;
    return {
      activeCount: this.activeSet.size,
      freeCount: this.freeList.length,
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      reuseRatio:
        totalAcquires > 0 ? Number((this.totalReused / totalAcquires).toFixed(3)) : 0,
    };
  }
}

export interface PooledFloatingNumber {
  id: number;
  target: 'player' | 'enemy';
  text: string;
  color: string;
  createdAt: number;
}

export interface PooledParticleBurst {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  scale: number;
  active: boolean;
}

// Singleton shared pools for combat floating numbers and particle bursts (#19)
let floatingSeq = 0;

export const floatingNumberPool = new ObjectPool<PooledFloatingNumber>(
  () => ({
    id: 0,
    target: 'enemy',
    text: '',
    color: 'text-red-600 border-[#1a162b] bg-[#fff8e7]',
    createdAt: 0,
  }),
  (item) => {
    item.id = ++floatingSeq;
    item.target = 'enemy';
    item.text = '';
    item.color = 'text-red-600 border-[#1a162b] bg-[#fff8e7]';
    item.createdAt = Date.now();
  },
  24
);

export const particleBurstPool = new ObjectPool<PooledParticleBurst>(
  () => ({
    id: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    color: '#fde047',
    scale: 1,
    active: false,
  }),
  (item) => {
    item.id = ++floatingSeq;
    item.x = 640;
    item.y = 320;
    item.vx = 0;
    item.vy = 0;
    item.color = '#fde047';
    item.scale = 1;
    item.active = true;
  },
  32
);

/**
 * Verifies SDF / Geometric Precision typography scaling profile from Steam Deck (1280x800) to 4K (3840x2160) (#19).
 */
export function getSdfTypographyProfile(viewportWidth = 1280, viewportHeight = 800): {
  presetName: 'Steam Deck Handheld (1280x800)' | '1080p Full HD' | '1440p QHD' | '4K Ultra HD';
  sdfStrokePx: number;
  baseRemScale: number;
  subpixelAntialiased: boolean;
} {
  if (viewportWidth >= 3200 || viewportHeight >= 1800) {
    return {
      presetName: '4K Ultra HD',
      sdfStrokePx: 2.5,
      baseRemScale: 1.15,
      subpixelAntialiased: true,
    };
  }
  if (viewportWidth >= 2200) {
    return {
      presetName: '1440p QHD',
      sdfStrokePx: 2.0,
      baseRemScale: 1.08,
      subpixelAntialiased: true,
    };
  }
  if (viewportWidth >= 1600) {
    return {
      presetName: '1080p Full HD',
      sdfStrokePx: 1.5,
      baseRemScale: 1.0,
      subpixelAntialiased: true,
    };
  }
  return {
    presetName: 'Steam Deck Handheld (1280x800)',
    sdfStrokePx: 1.25,
    baseRemScale: 1.0,
    subpixelAntialiased: true,
  };
}
