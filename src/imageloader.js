function loadImage(image) {
	if (!image) {
		return Promise.reject();
	} else if (typeof image === 'string') {
		/* Create a <img> from a string */
		const src = image;
		image = new Image();
		image.src = src;
	} else if (image.length !== undefined) {
		/* Treat as multiple images */

		// Momentarily ignore errors
		const reflected = [].map.call(image, img => load(img).catch(err => err));

		return Promise.all(reflected).then(results => {
			const loaded = results.filter(x => x.naturalWidth);
			if (loaded.length === results.length) {
				return loaded;
			}
			return Promise.reject({
				loaded,
				errored: results.filter(x => !x.naturalWidth)
			});
		});
	} else if (image.tagName !== 'IMG') {
		return Promise.reject();
	}

	const promise = new Promise((resolve, reject) => {
		if (image.naturalWidth) {
			// If the browser can determine the naturalWidth the
			// image is already loaded successfully
			resolve(image);
		} else if (image.complete) {
			// If the image is complete but the naturalWidth is 0px
			// it is probably broken
			reject(image);
		} else {
			image.addEventListener('load', fullfill);
			image.addEventListener('error', fullfill);
		}
		function fullfill() {
			if (image.naturalWidth) {
				resolve(image);
			} else {
				reject(image);
			}
			image.removeEventListener('load', fullfill);
			image.removeEventListener('error', fullfill);
		}
	});
	promise.image = image;
	return promise;
}

