import { describe, it, expect } from "vitest";
import { createBinaryHeap } from "./createBinaryHeap";

describe("createBinaryHeap", () => {
  describe("push and pop", () => {
    it("should create min heap when using default comparer", () => {
      const minHeap = createBinaryHeap((a: number, b: number) => a - b);

      minHeap.push(5);
      minHeap.push(3);
      minHeap.push(8);
      minHeap.push(1);
      minHeap.push(10);

      expect(minHeap.length).toBe(5);
      expect(minHeap.pop()).toBe(1);
      expect(minHeap.pop()).toBe(3);
      expect(minHeap.pop()).toBe(5);
      expect(minHeap.pop()).toBe(8);
      expect(minHeap.pop()).toBe(10);
      expect(minHeap.pop()).toBeNull();
    });

    it("should create max heap when using inverted comparer", () => {
      const maxHeap = createBinaryHeap((a: number, b: number) => b - a);

      maxHeap.push(5);
      maxHeap.push(3);
      maxHeap.push(8);
      maxHeap.push(1);
      maxHeap.push(10);

      expect(maxHeap.length).toBe(5);
      expect(maxHeap.pop()).toBe(10);
      expect(maxHeap.pop()).toBe(8);
      expect(maxHeap.pop()).toBe(5);
      expect(maxHeap.pop()).toBe(3);
      expect(maxHeap.pop()).toBe(1);
      expect(maxHeap.pop()).toBeNull();
    });
  });

  describe("pushRange", () => {
    it("should add multiple items at once", () => {
      const minHeap = createBinaryHeap((a: number, b: number) => a - b);

      minHeap.pushRange([5, 3, 8, 1, 10]);

      expect(minHeap.length).toBe(5);
      expect(minHeap.pop()).toBe(1);
      expect(minHeap.pop()).toBe(3);
      expect(minHeap.pop()).toBe(5);
      expect(minHeap.pop()).toBe(8);
      expect(minHeap.pop()).toBe(10);
    });

    it("should handle empty iterable", () => {
      const minHeap = createBinaryHeap((a: number, b: number) => a - b);

      minHeap.pushRange([]);

      expect(minHeap.length).toBe(0);
      expect(minHeap.pop()).toBeNull();
    });
  });

  describe("with complex objects", () => {
    interface Person {
      name: string;
      age: number;
    }

    it("should order by custom property", () => {
      const ageHeap = createBinaryHeap((a: Person, b: Person) => a.age - b.age);

      ageHeap.push({ name: "Alice", age: 30 });
      ageHeap.push({ name: "Bob", age: 25 });
      ageHeap.push({ name: "Charlie", age: 40 });

      const youngest = ageHeap.pop();
      expect(youngest?.name).toBe("Bob");
      expect(youngest?.age).toBe(25);

      const middle = ageHeap.pop();
      expect(middle?.name).toBe("Alice");
      expect(middle?.age).toBe(30);

      const oldest = ageHeap.pop();
      expect(oldest?.name).toBe("Charlie");
      expect(oldest?.age).toBe(40);
    });
  });

  describe("edge cases", () => {
    it("should handle popping from an empty heap", () => {
      const heap = createBinaryHeap((a: number, b: number) => a - b);

      expect(heap.length).toBe(0);
      expect(heap.pop()).toBeNull();
    });

    it("should handle push after pop operations", () => {
      const heap = createBinaryHeap((a: number, b: number) => a - b);

      heap.push(5);
      heap.push(3);
      expect(heap.pop()).toBe(3);

      heap.push(1);
      heap.push(10);

      expect(heap.pop()).toBe(1);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(10);
    });

    it("should maintain length property correctly", () => {
      const heap = createBinaryHeap((a: number, b: number) => a - b);

      expect(heap.length).toBe(0);

      heap.push(5);
      expect(heap.length).toBe(1);

      heap.pushRange([1, 2, 3]);
      expect(heap.length).toBe(4);

      heap.pop();
      expect(heap.length).toBe(3);

      heap.pop();
      heap.pop();
      heap.pop();
      expect(heap.length).toBe(0);

      heap.pop(); // Trying to pop from empty heap
      expect(heap.length).toBe(0);
    });
  });

  describe("peek", () => {
    it("should return null for an empty heap", () => {
      const heap = createBinaryHeap((a: number, b: number) => a - b);
      expect(heap.peek()).toBeNull();
    });

    it("should return the min value without removing it for a min heap", () => {
      const minHeap = createBinaryHeap((a: number, b: number) => a - b);
      
      minHeap.push(5);
      minHeap.push(3);
      minHeap.push(8);
      
      expect(minHeap.peek()).toBe(3);
      expect(minHeap.length).toBe(3); // Length shouldn't change
      expect(minHeap.peek()).toBe(3); // Peek again should return same value
      
      expect(minHeap.pop()).toBe(3); // Confirm the value with pop
      expect(minHeap.peek()).toBe(5); // Next value should be 5
    });
    
    it("should return the max value without removing it for a max heap", () => {
      const maxHeap = createBinaryHeap((a: number, b: number) => b - a);
      
      maxHeap.push(5);
      maxHeap.push(3);
      maxHeap.push(8);
      
      expect(maxHeap.peek()).toBe(8);
      expect(maxHeap.length).toBe(3); // Length shouldn't change
      expect(maxHeap.peek()).toBe(8); // Peek again should return same value
      
      expect(maxHeap.pop()).toBe(8); // Confirm the value with pop
      expect(maxHeap.peek()).toBe(5); // Next value should be 5
    });
    
    it("should work with complex objects", () => {
      interface Person {
        name: string;
        age: number;
      }
      
      const ageHeap = createBinaryHeap((a: Person, b: Person) => a.age - b.age);
      
      ageHeap.push({ name: "Alice", age: 30 });
      ageHeap.push({ name: "Bob", age: 25 });
      ageHeap.push({ name: "Charlie", age: 40 });
      
      const youngest = ageHeap.peek();
      expect(youngest?.name).toBe("Bob");
      expect(youngest?.age).toBe(25);
      
      // Peek shouldn't change the heap
      expect(ageHeap.length).toBe(3);
      
      // Confirm with pop
      expect(ageHeap.pop()?.name).toBe("Bob");
    });
  });
});
