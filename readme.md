# draggify


Make a HTMLElement draggable

1. Draggify supports touch on mobile devices.
2. Draggify is very fast.

### usage

```bash
npm i -S draggify
```

```js
import draggify from 'draggify';

draggify(document.querySelector('#element'), {
    // Whether horizontal movement is allowed.
    x: true,
    // Whether vertical movement is allowed.
    y: true,
    // A callback performed in idle time after the dragging has finished.
    idle: () =>  { 
        console.log('xxxx')
    },
    // Garbage collection.
    gc: true
});
```

### Have a try
https://yegao.github.io/draggify
