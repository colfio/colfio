function binaryFind(searchElement, comparator) {
	'use strict';

	var minIndex = 0;
	var maxIndex = this.length - 1;
	var currentIndex;
	var currentElement;
	while (minIndex <= maxIndex) {
		currentIndex = (minIndex + maxIndex) / 2 | 0;
		currentElement = this[currentIndex];

		if (comparator(currentElement, searchElement) == -1) {
			minIndex = currentIndex + 1;
		} else if (comparator(currentElement, searchElement) == 1) {
			maxIndex = currentIndex - 1;
		} else {
			return { // Modification
				found: true,
				index: currentIndex
			};
		}
	}

	if (currentElement == undefined) {
		return {
			found: false,
			index: 0
		};
	}

	return { // Modification
		found: false,
		index: comparator(currentElement, searchElement) == -1 ? currentIndex + 1 : currentIndex
	};
}

Array.prototype.binaryFind = binaryFind;
