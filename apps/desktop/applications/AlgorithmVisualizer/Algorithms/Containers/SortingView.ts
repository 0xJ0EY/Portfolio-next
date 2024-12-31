import { sleep } from "../../Util";

export type SortViewEntryColor = 'white' | 'red' | 'green';

export type SortViewEntry = {
  value: number,
  color: SortViewEntryColor,
}

export async function verifySort(view: SortView, abortSignal: AbortSignal): Promise<boolean> {
  for (let i = 1; i < view.size(); i++) {
    if (abortSignal.aborted) { return false; }

    if (view.entry(i).value < view.entry(i - 1).value) {
      return false;
    }

    view.mark(i - 1, 'green');
    view.mark(i, 'red');

    view.maskSound(i);

    await sleep(4);
  }

  const index = view.size() - 1;

  view.mark(index, 'green');
  view.maskSound(index);

  return true;
}


export class SortView {
  private dirty: boolean = false;
  private highestValue: number = 0;
  private delayMs: number = 5;

  private accessCount: number = 0;

  public accessIndicesList: number[] = [];

  constructor(private data: SortViewEntry[]) {
    this.highestValue = this.findHighestValue();
  }

  private findHighestValue(): number {
    let max = 0;

    for (let i = 0; i < this.data.length; i++) {
      max = Math.max(this.data[i].value, max);
    }

    return max;
  }

  private async onAccess() {
    await sleep(this.delayMs);

    this.accessCount += 1;
  }

  public cleanColors(): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i].color = 'white';
    }

    this.dirty = true;
  }

  public rerender(): boolean {
    let dirty = this.dirty;

    this.dirty = false;

    return dirty;
  }

  public async swap(idx: number, idy: number): Promise<void> {
    await this.onAccess();

    this.dirty = true;

    this.mark(idx, 'red');
    this.mark(idy, 'red');

    this.maskSound(idx);
    this.maskSound(idy);

    let temp = this.data[idx];
    this.data[idx] = this.data[idy];
    this.data[idy] = temp;

    await this.onAccess();
  }

  public async set(id: number, item: SortViewEntry, color?: SortViewEntryColor): Promise<void> {
    this.dirty = true;

    this.data[id] = item;

    this.mark(id, color ?? 'red');
    this.maskSound(id);

    await this.onAccess();
  }

  public mark(id: number, color: SortViewEntryColor): void {
    this.data[id].color = color;
    this.dirty = true;
  }

  public maskSound(id: number): void {
    this.accessIndicesList.push(id);
  }

  public entry(index: number): SortViewEntry {
    return this.data[index];
  }

  public entryValue(index: number): number {
    return this.entry(index).value;
  }

  public size(): number {
    return this.data.length;
  }

  public getHighestValue(): number {
    return this.highestValue;
  }

  public setData(data: SortViewEntry[]): void {
    this.data = data;

    this.highestValue = this.findHighestValue();
  }

  public setDelay(ms: number): void {
    this.delayMs = ms;
  }

  public getDelay(): number {
    return this.delayMs;
  }
}
