import type { TabType } from '../types';

export interface HubDestination {
  id: TabType;
  label: string;
  shortLabel: string;
  islandName: string;
  emoji: string;
  x: number;
  y: number;
  tone: string;
}

export const HUB_DESTINATIONS: HubDestination[] = [
  { id: 'hub', label: 'Word World', shortLabel: 'Explore', islandName: 'Harmony Village', emoji: '🗺️', x: 40, y: 55, tone: 'from-emerald-500 to-teal-600' },
  { id: 'battle', label: 'Battle Arena', shortLabel: 'Battle', islandName: 'Celestia', emoji: '⚔️', x: 72, y: 28, tone: 'from-rose-500 to-orange-500' },
  { id: 'loadout', label: 'Pet Hatchery', shortLabel: 'Pets', islandName: 'Treetop Canopy', emoji: '🥚', x: 83, y: 60, tone: 'from-lime-500 to-emerald-600' },
  { id: 'forge', label: 'Word Forge', shortLabel: 'Forge', islandName: 'Fireforge', emoji: '🔥', x: 66, y: 68, tone: 'from-orange-500 to-red-600' },
  { id: 'shop', label: 'Lexi Shop', shortLabel: 'Shop', islandName: "Galleon's Rest", emoji: '🛍️', x: 47, y: 80, tone: 'from-amber-400 to-orange-500' },
];
