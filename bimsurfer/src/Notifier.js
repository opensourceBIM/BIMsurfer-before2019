export default class Notifier {
	setSelector(selector) {
		console.log('setSelector', arguments);
	}

	clear() {
		console.log('clear', arguments);
	}

	resetStatus() {
		console.log('status', arguments);
	}

	resetStatusQuick() {
		console.log('status', arguments);
	}

	setSuccess(status, timeToShow) {
		console.log('success', arguments);
	}

	setInfo(status, timeToShow) {
		console.log('info', arguments);
	}

	setError(error) {
		console.log('error', arguments);
	}
}
