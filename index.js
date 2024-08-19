let locking = null;
let lockingClientY = 0;
let lockingClientX = 0;

export default function draggify(element, option = {x: true, y: true, callback: void 0}) {
	element.setAttribute('draggify', true);
	let offsetTop = element.offsetTop;
	let offsetLeft = element.offsetLeft;

	document.addEventListener('mousedown', (e) => {
		if (locking) {
			return;
		}
		e.preventDefault();
		if (element.contains(e.target)) {
			locking = element;
			element.setAttribute('dragging', true);
			const computedPosition = getComputedStyle(element).getPropertyValue('position');
			if (computedPosition === 'static') {
				element.style.setProperty('position', 'absolute');
				element.style.setProperty('top', offsetTop + 'px');
				element.style.setProperty('left', offsetLeft + 'px');
			}
			offsetTop = element.offsetTop;
			offsetLeft = element.offsetLeft;
			lockingClientX = e.clientX;
			lockingClientY = e.clientY;
		}
	});

	document.addEventListener('mousemove', (e) => {
		if (locking === element) {
			e.preventDefault();
			if (option.x) {
				locking.style.setProperty('left', (offsetLeft + e.clientX - lockingClientX) + 'px');
			}
			if (option.y) {
				locking.style.setProperty('top', (offsetTop + e.clientY - lockingClientY) + 'px');
			}
		}
	});

	document.addEventListener('mouseup', (e) => {
		if (locking === element) {
			e.preventDefault();
			const element = locking;
			locking = null;
			lockingClientY = 0;
			lockingClientX = 0;
			element.removeAttribute('dragging');
			if (typeof callback === 'function') {
				requestIdleCallback(callback);
			}
		}
	});
}