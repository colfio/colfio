

type StackNode = {
	next: any;
	previous: any;
}

/**
 * Simple stack for chain-of-commands pattern
 */
export class Stack<T extends StackNode> {
	protected topNode: T | null = null;
	protected size = 0;

	constructor() {
		this.topNode = null;
		this.size = 0;
	}

	/**
	 * Pushes a new node onto the stack
	 */
	push(node: T) {
		this.topNode = node;
		this.size += 1;
	}

	/**
	 * Pops the current node from the stack
	 */
	pop(): T | null {
		const temp = this.topNode;
		this.topNode = this.topNode?.previous;
		this.size -= 1;
		return temp;
	}

	/**
	 * Returns the node on the top
	 */
	top(): T | null {
		return this.topNode;
	}
}
