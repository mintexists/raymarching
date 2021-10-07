const _self = self;
_self.addEventListener('message', (evt) => {
    let img = new ImageData(evt.data.width, evt.data.height);
    for (let x = 0; x < img.data.length; x += evt.data.channels) {
        img.data[x] = Math.random() * 255;
        img.data[x + 1] = Math.random() * 255;
        img.data[x + 2] = Math.random() * 255;
        img.data[x + 3] = 1 * 255;
    }
    let bytes = new Uint8ClampedArray(img.data);
    self.postMessage({
        type: 'end',
        bytes: bytes
    }, [bytes.buffer]);
});
//# sourceMappingURL=worker.js.map