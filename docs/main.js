import draggify, {snapshot, gc} from './index.js';

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
    draggify(element, {
        x: true,
        y: true,
        idle: () =>  {
            console.log('xxxx')
        },
        gc: true
    });
}

document.getElementById('test').addEventListener('click', e => {
    const grid = document.createElement('div');
    grid.setAttribute('id', 'grid');
    document.body.appendChild(grid);
    let index = 0;
    function add() {
        requestAnimationFrame(() => {
            index++;
            for (let i = 0; i < 100; i++) {
                const div = document.createElement('div');
                grid.appendChild(div);
                draggify(div, {x: true, y: true});
            }
            if (index < 100) {
                add();
            }
        });
    }
    add();
    const close = document.createElement('div');
    close.setAttribute('id', 'close');
    close.innerHTML = 'Close';
    document.body.appendChild(close);
    close.addEventListener('click', e => {
        document.body.removeChild(grid);
        document.body.removeChild(close);
        gc();
        snapshot();
    });
});
