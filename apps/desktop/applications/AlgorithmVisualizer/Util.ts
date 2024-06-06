import { BarGraphEntry } from "@/components/GraphViewer/GraphViewer";

export function generateRandomBarData(entries: number): BarGraphEntry[] {
  let data: BarGraphEntry[] = [];

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
