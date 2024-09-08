const nothing = 0b000;

const downing = 0b001
const moving = 0b010;

let state = nothing;

let hit = null;

let matrix = [1, 0, 0, 1, 0, 0];

let clientY = 0; // 鼠标按下时候event的clientY
let clientX = 0; // 鼠标按下时候event的clientX

let lastMovingEvent = null;

let tree = null;

function translateX(element, x) {
	element.style.transform = 'matrix(' + matrix[0] + ',' + matrix[1] + ',' + matrix[2] + ',' + matrix[3] + ',' + (matrix[4] + matrix[0] * x) + ',' + (matrix[5] + matrix[1] * x) + ')';
}

function translateY(element, y) {
	element.style.transform = 'matrix(' + matrix[0] + ',' + matrix[1] + ',' + matrix[2] + ',' + matrix[3] + ',' + (matrix[4] + matrix[2] * y) + ',' + (matrix[5] + matrix[3] * y) + ')';
}

function translate(element, x, y) {
	element.style.transform = 'matrix(' + matrix[0] + ',' + matrix[1] + ',' + matrix[2] + ',' + matrix[3] + ',' + (matrix[0] * x + matrix[2] * y + matrix[4]) + ',' + (matrix[1] * x + matrix[3] * y + matrix[5]) + ')';
}

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

const touchStartHandler = (e) => {
	if (hit) {
		return;
	}
	e.preventDefault();
	let fiber = tree;
	const target = e.target;
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
		state |= downing;
		const element = hit.element;
		clientX = e.clientX;
		clientY = e.clientY;
		element.setAttribute('dragging', true);
        let transform = getComputedStyle(element).getPropertyValue('transform');
        matrix = (transform === 'none' ? [1, 0, 0, 1, 0, 0] : transform.slice(7, -1).split(',').map(v => parseFloat(v)));
	}
}

document.addEventListener('mousedown', touchStartHandler);

document.addEventListener('touchstart', touchStartHandler);

const touchMoveHandler = (e) => {
	e.preventDefault();
	if (!hit) {
		return;
	}
	lastMovingEvent = e;
	if (state & moving) {
		return;
	}
	state |= moving;
	requestAnimationFrame(move);
}

document.addEventListener('mousemove', touchMoveHandler);

document.addEventListener('touchmove', touchMoveHandler);

const touchEndHandler = (e) => {
	if (!hit) {
		return;
	}
	state &= ~downing;
	move();
	e.preventDefault();
	const element = hit.element;
	const option = hit.option;
	hit = null;
	clientY = 0;
	clientX = 0;
	element.removeAttribute('dragging');
	if (typeof option.callback === 'function') {
		requestIdleCallback(() => {
			option.callback(element);
		});
	}
}

document.addEventListener('mouseup', touchEndHandler);

document.addEventListener('touchend', touchEndHandler);

// 处理当前帧片段中最后一次mousemove事件
function move() {
	// 保证move只会在mouseup重置hit等之前被执行
	if (state & moving) {
		state &= ~moving;
		const option = hit.option;
		if (option.x && option.y) {
			translate(hit.element, lastMovingEvent.clientX - clientX, lastMovingEvent.clientY - clientY);
		} else if (option.x) {
			translateX(hit.element, lastMovingEvent.clientX - clientX);
		} else if (option.y) {
			translateY(hit.element, lastMovingEvent.clientY - clientY);
		}
	}
}

export default function draggify(element, option = {x: true, y: true, callback: void 0}) {
	element.setAttribute('draggify', true);
	const fiber = new Fiber(element, option);
	if (tree) {
		merge(fiber, tree);
	} else {
		tree = fiber;
	}
}
