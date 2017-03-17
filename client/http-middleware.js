function http(method, url, data) {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()
		request.addEventListener('load', () => {
			if (request.status === 200) {
				resolve(request.responseText && JSON.parse(request.responseText))
			} else {
				reject(request.status)
			}
		})
		request.addEventListener('error', reject)
		request.addEventListener('abort', reject)
		request.open(method, url)
		request.send(JSON.stringify(data))
	})
}

const get = ((...args) => http('GET', ...args))
const post = ((...args) => http('POST', ...args))

module.exports = function httpMiddleware(Component) {
	return function proxy(options) {
		const component = new Component(options)

		component.on('save', data => {
			const endpoint = component.get('endpoint')
			post(endpoint, data)
		})

		component.on('load', async () => {
			const endpoint = component.get('endpoint')
			try {
				const data = await get(endpoint)
				component.handleData(data)
			} catch (error) {
				component.handleError && component.handleError(error)
			}
		})

		return component
	}
}
