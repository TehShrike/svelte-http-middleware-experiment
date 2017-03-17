const http = require('http')
const st = require('st')
const concat = require('concat-stream')

const serveStatic = st({
	path: 'public/',
	url: 'static/',
	cache: false,
	index: 'index.html'
})

const state = {}

http.createServer((req, res) => {
	if (!serveStatic(req, res)) {
		console.log(req.method, req.url)
		function notFound() {
			res.statusCode = 404
			res.end('nope')
		}
		if (req.method === 'POST') {
			req.pipe(concat(data => {
				console.log(`saved'${data}' to`, req.url)
				state[req.url] = JSON.parse(data)
				res.end()
			}))
		} else if (req.method === 'GET') {
			if (state[req.url]) {
				setTimeout(() => res.end(JSON.stringify(state[req.url])), 500)
			} else {
				notFound()
			}
		} else {
			notFound()
		}
	}
}).listen(1313)
