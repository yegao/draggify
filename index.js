
const nothing = 0b000;

const downing = 0b001
const moving = 0b010;

let state = nothing;

let hit = null;

let clientY = 0; // 鼠标按下时候event的clientY
let clientX = 0; // 鼠标按下时候event的clientX
let offsetTop = 0; // 鼠标按下时候element的offsetTop
let offsetLeft = 0; // 鼠标按下时候element的offsetLeft

let lastMovingEvent = null;

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
		offsetTop = element.offsetTop;
		offsetLeft = element.offsetLeft;
		element.setAttribute('dragging', true);
		const computedPosition = getComputedStyle(element).getPropertyValue('position');
		if (computedPosition !== 'absolute') {
			if (!hit.option.auto) {
				let next = element;
				const list = [];
				while (next = next.nextElementSibling) {
					const nextComputedPosition = getComputedStyle(next).getPropertyValue('position');
					if (nextComputedPosition !== 'absolute') {
						list.push(next, next.offsetTop, next.offsetLeft);
					}
				}
				for (let i = 0, len = list.length; i < len;) {
					list[i].style.setProperty('position', 'absolute');
					list[i].style.setProperty('top', list[i + 1] + 'px');
					list[i].style.setProperty('left', list[i + 2] + 'px');
					list[i].style.setProperty('margin', '0px');
					i += 3
				}
			}
			element.style.setProperty('position', 'absolute');
			element.style.setProperty('top', offsetTop + 'px');
			element.style.setProperty('left', offsetLeft + 'px');
			element.style.setProperty('margin', '0px');
		}
	}
});

document.addEventListener('mousemove', (e) => {
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
});

document.addEventListener('mouseup', (e) => {
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
});

// 处理当前帧片段中最后一次mousemove事件
function move() {
	// 保证move只会在mouseup重置hit等之前被执行
	if (state & moving) {
		state &= ~moving;
		const element = hit.element;
		const option = hit.option;
		if (option.x) {
			element.style.setProperty('left', (offsetLeft + lastMovingEvent.clientX - clientX) + 'px');
		}
		if (option.y) {
			element.style.setProperty('top', (offsetTop + lastMovingEvent.clientY - clientY) + 'px');
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
