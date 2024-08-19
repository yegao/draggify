let locking = null;
let lockingClientY = 0;
let lockingClientX = 0;

export default function draggify(element, option = {x: true, y: true, callback: void 0}) {
	element.setAttribute('draddy')
	let zIndex = element.style.zIndex;
	let offsetTop = element.offsetTop;
	let offsetLeft = element.offsetLeft;

	document.addEventListener('mousedown', (e) => {
		if (locking) {
			return;
		}
		e.preventDefault();
		if (element.contains(e.target)) {
			locking = element;
			const computedPosition = getComputedStyle(element).getPropertyValue('position');
			if (computedPosition === 'static') {
				element.style.setProperty('position', 'absolute');
				element.style.setProperty('top', offsetTop + 'px');
				element.style.setProperty('left', offsetLeft + 'px');
				element.style.setProperty('zIndex', '999999');
			}
			offsetTop = element.offsetTop;
			offsetLeft = element.offsetLeft;
			zIndex = element.style.zIndex;
			lockingClientX = e.clientX;
			lockingClientY = e.clientY;
		}
	});

	document.addEventListener('mousemove', (e) => {
		if (locking) {
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
		if (locking) {
			e.preventDefault();
			locking = null;
			lockingClientY = 0;
			lockingClientX = 0;
            requestIdleCallback(() => {
                if (zIndex !== void 0) {
					element.style.setProperty('zIndex', zIndex);
				} else {
					element.style.removeProperty('zIndex');
				}
            });
		}
	});
}