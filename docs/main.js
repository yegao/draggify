import draggify from './draggify.js';

const xs = document.querySelectorAll('.x');
for (let element of xs) {
    draggify(element, {x: true, y: false });
}

const ys = document.querySelectorAll('.y');
for (let element of ys) {
    draggify(element, {x: false, y: true});
}

const xys = document.querySelectorAll('.xy');
for (let element of xys) {
    draggify(element, {x: true, y: true});
}