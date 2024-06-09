import { SortViewEntry } from "./Algorithms/SortingView";

export function generateRandomData(entries: number): SortViewEntry[] {
  let data: SortViewEntry[] = [];

  for (let i = 0; i < entries; i++) {
    data.push({ value: i, color: 'white' });
  }

  // Fisher–Yates shuffle
  for (let i = entries - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i));
    [data[i], data[j]] = [data[j], data[i]];
  }

  return data;
}

export function generateSortedDataLeftToRight(entries: number): SortViewEntry[] {
  let data: SortViewEntry[] = [];

  for (let i = 0; i < entries; i++) {
    data.push({ value: i, color: 'white' });
  }

  return data;
}

export function generateSortedDataRightToLeft(entries: number): SortViewEntry[] {
  let data: SortViewEntry[] = [];

  for (let i = entries; i > 0; i--) {
    data.push({ value: i, color: 'white' });
  }

  return data;
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
