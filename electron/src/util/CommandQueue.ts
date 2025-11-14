// https://dev.to/glebirovich/typescript-data-structures-stack-and-queue-hld
interface ICommandQueue<T> {
    enqueue(item: T): void;
    dequeue(): T | undefined;
    setCapacity(c: number): void;
    size(): number;
    fastForward(): void;
    clear(): void;
}

export class CommandQueue<T> implements ICommandQueue<T> {
    private storage: T[] = [];
    public capacity: number;

    constructor(capacity: number = Infinity) {
        this.capacity = capacity;
    }

    enqueue(item: T): void {
        if (this.size() === this.capacity) {
            this.storage.shift();
        }
        this.storage.push(item);
    }
    
    dequeue(): T | undefined {
        return this.storage.shift();
    }

    setCapacity(c: number): void {
        // todo do I have to delete overflow elements?
        this.capacity = c;
    }

    size(): number {
        return this.storage.length;
    }

    fastForward(): void {
        this.storage = [this.storage[this.size()-1]];
    }

    clear(): void {
        this.storage = [];
    }
}