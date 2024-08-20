let locking = null;
let lockingClientY = 0;
let lockingClientX = 0;
let lockingOffsetTop = 0;
let lockingOffsetLeft = 0;

let tree = null;

function wrap(fiber, node) {
	fiber.descendant = node;
	if (tree === node) {
		tree = fiber;
	} else {
		const ancestor = node.ancestor;
		if (ancestor && ancestor.descendant === node) {
			ancestor.descendant = fiber;
		}
	}
	node.ancestor = fiber;
	node = node.next;
	let isolate = fiber;
	while(node) {
		if (fiber.element.contains(node.element)) {
			node.ancestor = fiber;
		} else {
			isolate.next = node;
			isolate = node;
		}
		node = node.next;
	} 
}

function merge(fiber, node) {
	const fe = fiber.element;
	let next = node;
	do {
		node = next;
		const element = node.element;
		if (fe === element) {
			return;
		}
		if (fe.contains(element)) {
			return wrap(fiber, node);
		}
		if (element.contains(fe)) {
			if (node.descendant) {
				return merge(fiber, node.descendant);
			}
			node.descendant = fiber;
			fiber.ancestor = node;
			return;
		}
		next = node.next;
	} while(next);
	node.next = fiber
}

function Fiber(element, option) {
	this.ancestor = null;
	this.descendant = null;
	this.next = null;
	this.element = element;
	this.option = option;
}

document.addEventListener('mousedown', (e) => {
	if (locking) {
		return;
	}
	e.preventDefault();
	let fiber = tree;
	const target = e.target;
	let hit = null;
	while(fiber) {
		const element = fiber.element;
		if (element.contains(target)) {
			hit = fiber;
			fiber = fiber.descendant;
		} else {
			fiber = fiber.next;
		}
	}
	if (hit) {
		locking = hit;
		lockingClientX = e.clientX;
		lockingClientY = e.clientY;
		const element = locking.element;
		lockingOffsetTop = element.offsetTop;
		lockingOffsetLeft = element.offsetLeft;
		element.setAttribute('dragging', true);
		const computedPosition = getComputedStyle(element).getPropertyValue('position');
		if (computedPosition === 'static') {
			element.style.setProperty('position', 'absolute');
			element.style.setProperty('top', lockingOffsetTop + 'px');
			element.style.setProperty('left', lockingOffsetLeft + 'px');
		}
	}
});

document.addEventListener('mousemove', (e) => {
	if (locking) {
		const element = locking.element;
		const option = locking.option;
		e.preventDefault();
		if (option.x) {
			element.style.setProperty('left', (lockingOffsetLeft + e.clientX - lockingClientX) + 'px');
		}
		if (option.y) {
			element.style.setProperty('top', (lockingOffsetTop + e.clientY - lockingClientY) + 'px');
		}
	}
});

document.addEventListener('mouseup', (e) => {
	if (locking) {
		const option = locking.option;
		const element = locking.element;
		e.preventDefault();
		locking = null;
		lockingClientY = 0;
		lockingClientX = 0;
		element.removeAttribute('dragging');
		if (typeof option.callback === 'function') {
			requestIdleCallback(() => {
				option.callback(element);
			});
		}
	}
});

export default function draggify(element, option = {x: true, y: true, callback: void 0}) {
	element.setAttribute('draggify', true);
	const fiber = new Fiber(element, option);
	if (tree) {
		merge(fiber, tree);
	} else {
		tree = fiber;
	}
}
