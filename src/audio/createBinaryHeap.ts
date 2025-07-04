import { type Comparer } from "ts-comparer-builder";
export function createBinaryHeap<T>(comparer: Comparer<T>): BinaryHeap<T> {
  const heapArray: T[] = [];
  const swapItemSelector = (items: SwapItem<T>[]) =>
    maxBy(items, ({ item: a }, { item: b }) => comparer(b, a));
  const heap: BinaryHeap<T> = {
    push(item: T) {
      let currentIndex = heapArray.length;
      heapArray.push(item);
      while (currentIndex > 0) {
        const parentItemIndex = (currentIndex - 1) >> 1;
        if (comparer(item, heapArray[parentItemIndex]) < 0) {
          swapArrayIndexes(heapArray, currentIndex, parentItemIndex);
          currentIndex = parentItemIndex;
        } else {
          break;
        }
      }
    },
    pushRange(items: Iterable<T>) {
      for (const item of items) {
        heap.push(item);
      }
    },
    pop(): T | null {
      if (heapArray.length === 0) {
        return null;
      }
      const returnValue = heapArray[0];
      heapArray[0] = heapArray[heapArray.length - 1];
      heapArray.length = heapArray.length - 1;
      let currentIndex = 0;
      for (;;) {
        const currentItem = heapArray[currentIndex];
        const leftChildIndex = (currentIndex << 1) + 1;
        const items: SwapItem<T>[] = [];
        for (let i = 0; i < 2; ++i) {
          const childIdx = leftChildIndex + i;
          if (childIdx < heapArray.length) {
            items.push({
              item: heapArray[childIdx],
              index: childIdx,
            });
          }
        }
        if (items.length === 0) {
          break;
        }
        const swapItem = swapItemSelector(items);
        if (swapItem && comparer(swapItem.item, currentItem) < 0) {
          swapArrayIndexes(heapArray, currentIndex, swapItem.index);
          currentIndex = swapItem.index;
        } else {
          break;
        }
      }
      return returnValue;
    },
    peek(): T | null {
      return heapArray.length > 0 ? heapArray[0] : null;
    },
    get length() {
      return heapArray.length;
    },
  };
  return heap;
}

const swapArrayIndexes = <T>(src: T[], idx1: number, idx2: number): void => {
  const x = src[idx1];
  src[idx1] = src[idx2];
  src[idx2] = x;
};

type SwapItem<T> = {
  item: T;
  index: number;
};

type BinaryHeap<T> = {
  push(item: T): void;
  pushRange(items: Iterable<T>): void;
  pop(): T | null;
  peek(): T | null;
  readonly length: number;
};

const maxBy = <T>(src: T[], comparer: Comparer<T>): T | undefined => {
  if (src.length === 0) {
    return undefined;
  }
  let currentMax: T | undefined;
  let c = 0;
  for (const item of src) {
    currentMax =
      c++ > 0 ? (comparer(item, currentMax!) > 0 ? item : currentMax!) : item;
  }
  return currentMax;
};
