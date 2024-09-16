export const nothing = 0b000;
export const downing = 0b001
export const moving = 0b010;

let state = nothing;

let taken = null;

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

function wrap(fiber, token) {
	fiber.descendant = token;
	if (tree === token) {
		tree = fiber;
	} else {
		const ancestor = token.ancestor;
		if (ancestor && ancestor.descendant === token) {
			ancestor.descendant = fiber;
		}
	}
	token.ancestor = fiber;
	token = token.next;
	let isolate = fiber;
	while(token) {
		if (fiber.element.contains(token.element)) {
			token.ancestor = fiber;
		} else {
			isolate.next = token;
			isolate = token;
		}
		token = token.next;
	} 
}

function merge(fiber, token) {
	const fe = fiber.element;
	let next = token;
	do {
		token = next;
		const element = token.element;
		if (fe === element) {
			return;
		}
		if (fe.contains(element)) {
			return wrap(fiber, token);
		}
		if (element.contains(fe)) {
			if (token.descendant) {
				return merge(fiber, token.descendant);
			}
			token.descendant = fiber;
			fiber.ancestor = token;
			return;
		}
		next = token.next;
	} while(next);
	token.next = fiber
}

function _gc(token) {
	if (token === null) {
		return;
	}
	let prev = null;
	do {
		const element = token.element;
		if (document.contains(element)) {
			prev = token;
			_gc(token.descendant);
		} else if (prev) {
			prev.next = token.next;
		} else if (token.ancestor) {
			token.ancestor.descendant = token.next;
		}
		token = token.next;
	} while(token);
}

export function gc() {
	_gc(tree);
}

function Token(element, option) {
	this.ancestor = null;
	this.descendant = null;
	this.next = null;
	this.element = element;
	this.option = option;
}

const mousedownHandler = (e) => {
	if (taken) {
		return;
	}
	e.preventDefault();
	let token = tree;
	const target = e.target;
	while(token) {
		const element = token.element;
		if (element.contains(target)) {
			taken = token;
			token = token.descendant;
		} else {
			token = token.next;
		}
	}
	if (taken) {
		state |= downing;
		const element = taken.element;
		clientX = e.clientX;
		clientY = e.clientY;
		element.setAttribute('dragging', true);
        let transform = getComputedStyle(element).getPropertyValue('transform');
        matrix = (transform === 'none' ? [1, 0, 0, 1, 0, 0] : transform.slice(7, -1).split(',').map(v => parseFloat(v)));
	}
}

document.addEventListener('mousedown', mousedownHandler);

const touchstartHandler = (e) => {
	if (taken) {
		return;
	}
	e.preventDefault();
	let token = tree;
	const target = e.target;
	while(token) {
		const element = token.element;
		if (element.contains(target)) {
			taken = token;
			token = token.descendant;
		} else {
			token = token.next;
		}
	}
	if (taken) {
		state |= downing;
		const element = taken.element;
		const touch = e.changedTouches[0];
		clientX = touch.clientX;
		clientY = touch.clientY;
		element.setAttribute('dragging', true);
        let transform = getComputedStyle(element).getPropertyValue('transform');
        matrix = (transform === 'none' ? [1, 0, 0, 1, 0, 0] : transform.slice(7, -1).split(',').map(v => parseFloat(v)));
	}
}

document.addEventListener('touchstart', touchstartHandler, { passive: false });

const mousemoveHandler = (e) => {
	e.preventDefault();
	if (!taken) {
		return;
	}
	lastMovingEvent = e;
	if (state & moving) {
		return;
	}
	state |= moving;
	requestAnimationFrame(mousemove);
}

document.addEventListener('mousemove', mousemoveHandler);

const touchMoveHandler = (e) => {
	e.preventDefault();
	if (!taken) {
		return;
	}
	lastMovingEvent = e;
	if (state & moving) {
		return;
	}
	state |= moving;
	requestAnimationFrame(touchmove);
}

document.addEventListener('touchmove', touchMoveHandler, { passive: false });

const mouseupHandler = (e) => {
	if (!taken) {
		return;
	}
	state &= ~downing;
	mousemove();
	e.preventDefault();
	const element = taken.element;
	const option = taken.option;
	taken = null;
	clientY = 0;
	clientX = 0;
	element.removeAttribute('dragging');
	if (typeof option.idle === 'function') {
		requestIdleCallback(() => {
			option.idle(element);
		});
	}
}

const touchendHandler = (e) => {
	if (!taken) {
		return;
	}
	state &= ~downing;
	touchmove();
	e.preventDefault();
	const element = taken.element;
	const option = taken.option;
	taken = null;
	clientY = 0;
	clientX = 0;
	element.removeAttribute('dragging');
	if (typeof option.idle === 'function') {
		requestIdleCallback(() => {
			option.idle(element);
		});
	}
}

document.addEventListener('mouseup', mouseupHandler);

document.addEventListener('touchend', touchendHandler, { passive: false });

// 处理当前帧片段中最后一次mousemove事件
function mousemove() {
	// 保证move只会在mouseup重置taken等之前被执行
	if (state & moving) {
		state &= ~moving;
		const option = taken.option;
		if (option.x && option.y) {
			translate(taken.element, lastMovingEvent.clientX - clientX, lastMovingEvent.clientY - clientY);
		} else if (option.x) {
			translateX(taken.element, lastMovingEvent.clientX - clientX);
		} else if (option.y) {
			translateY(taken.element, lastMovingEvent.clientY - clientY);
		}
	}
}

function touchmove() {
	// 保证move只会在mouseup重置taken等之前被执行
	if (state & moving) {
		state &= ~moving;
		const option = taken.option;
		const lastTouch = lastMovingEvent.changedTouches[0];
		if (option.x && option.y) {
			translate(taken.element, lastTouch.clientX - clientX, lastTouch.clientY - clientY);
		} else if (option.x) {
			translateX(taken.element, lastTouch.clientX - clientX);
		} else if (option.y) {
			translateY(taken.element, lastTouch.clientY - clientY);
		}
	}
}

export function snapshot() {
    return {
        state,
        taken,
        matrix,
        clientY,
        clientX,
        lastMovingEvent,
        tree,
    }
}

export default function draggify(element, option = {x: true, y: true, idle: void 0, gc: true}) {
	element.setAttribute('draggify', 'true');
	const token = new Token(element, option);
	if (tree) {
		if (option.gc) {
			gc();
		}
		merge(token, tree);
	} else {
		tree = token;
	}
}
