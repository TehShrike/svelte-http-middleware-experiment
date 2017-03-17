(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var template = (function () {
const httpMiddleware = require('./http-middleware')
const GenericForm = httpMiddleware(require('./generic-form.html'))

return {
	data() {
		return {
			id: 13
		}
	},
	components: {
		GenericForm
	}
}
}());

function renderMainFragment ( root, component ) {
	var h1 = createElement( 'h1' );
	
	appendNode( createText( "I'm a webapp!" ), h1 );
	var text1 = createText( "\n" );
	
	var p = createElement( 'p' );
	
	var input = createElement( 'input' );
	input.type = "number";
	
	var input_updating = false;
	
	function inputChangeHandler () {
		input_updating = true;
		component._set({ id: input.value });
		input_updating = false;
	}
	
	addEventListener( input, 'input', inputChangeHandler );
	
	appendNode( input, p );
	
	input.value = root.id;
	
	var text2 = createText( "\n" );
	
	var div = createElement( 'div' );
	
	var ifBlock_anchor = createComment();
	appendNode( ifBlock_anchor, div );
	
	function getBlock ( root ) {
		if ( root.id ) return renderIfBlock_0;
		return null;
	}
	
	var currentBlock = getBlock( root );
	var ifBlock = currentBlock && currentBlock( root, component );
	
	if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );

	return {
		mount: function ( target, anchor ) {
			insertNode( h1, target, anchor );
			insertNode( text1, target, anchor );
			insertNode( p, target, anchor );
			insertNode( text2, target, anchor );
			insertNode( div, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( !input_updating ) {
				input.value = root.id;
			}
			
			var _currentBlock = currentBlock;
			currentBlock = getBlock( root );
			if ( _currentBlock === currentBlock && ifBlock) {
				ifBlock.update( changed, root );
			} else {
				if ( ifBlock ) ifBlock.teardown( true );
				ifBlock = currentBlock && currentBlock( root, component );
				if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
			}
		},
		
		teardown: function ( detach ) {
			removeEventListener( input, 'input', inputChangeHandler );
			if ( ifBlock ) ifBlock.teardown( false );
			
			if ( detach ) {
				detachNode( h1 );
				detachNode( text1 );
				detachNode( p );
				detachNode( text2 );
				detachNode( div );
			}
		}
	};
}

function renderIfBlock_0 ( root, component ) {
	var genericForm_initialData = {
		endpoint: "/super/cool/thing/" + ( root.id )
	};
	var genericForm = new template.components.GenericForm({
		target: null,
		_root: component._root || component,
		data: genericForm_initialData
	});

	return {
		mount: function ( target, anchor ) {
			genericForm._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			var genericForm_changes = {};
			
			if ( 'id' in changed ) genericForm_changes.endpoint = "/super/cool/thing/" + ( root.id );
			
			if ( Object.keys( genericForm_changes ).length ) genericForm.set( genericForm_changes );
		},
		
		teardown: function ( detach ) {
			genericForm.destroy( detach );
		}
	};
}

function example ( options ) {
	options = options || {};
	this._state = Object.assign( template.data(), options.data );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	this._renderHooks = [];
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	this._flush();
}

example.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

example.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

example.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

example.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

example.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

example.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

example.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
	
	this._flush();
};

example.prototype.teardown = example.prototype.destroy = function destroy ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createText( data ) {
	return document.createTextNode( data );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function addEventListener( node, event, handler ) {
	node.addEventListener ( event, handler, false );
}

function removeEventListener( node, event, handler ) {
	node.removeEventListener ( event, handler, false );
}

function createComment() {
	return document.createComment( '' );
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

module.exports = example;

},{"./generic-form.html":2,"./http-middleware":3}],2:[function(require,module,exports){
'use strict';

var template = (function () {
return {
	data() {
		return {
			formData: {
				coolThing: ''
			}
		}
	},
	oncreate() {
		this.observe('endpoint', () => {
			this.set({
				formData: {
					coolThing: 'Loading...'
				}
			})
			this.fire('load')
		})
	},
	methods: {
		handleData(formData) {
			this.set({
				formData
			})
		},
		handleError(error) {
			this.set({
				formData: {
					coolThing: ''
				}
			})
		}
	}
}
}());

function renderMainFragment ( root, component ) {
	var h2 = createElement( 'h2' );
	
	appendNode( createText( "I'm a generic web form!" ), h2 );
	var text1 = createText( "\n" );
	
	var input = createElement( 'input' );
	input.type = "text";
	
	function changeHandler ( event ) {
		var root = this.__svelte.root;
		
		component.fire('save', root.formData);
	}
	
	addEventListener( input, 'change', changeHandler );
	
	var input_updating = false;
	
	function inputChangeHandler () {
		input_updating = true;
		var formData = component.get( 'formData' );
		formData.coolThing = input.value;
		component._set({ formData: formData });
		input_updating = false;
	}
	
	addEventListener( input, 'input', inputChangeHandler );
	
	input.__svelte = {
		root: root
	};
	
	input.value = root.formData.coolThing;

	return {
		mount: function ( target, anchor ) {
			insertNode( h2, target, anchor );
			insertNode( text1, target, anchor );
			insertNode( input, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( !input_updating ) {
				input.value = root.formData.coolThing;
			}
			
			input.__svelte.root = root;
		},
		
		teardown: function ( detach ) {
			removeEventListener( input, 'change', changeHandler );
			removeEventListener( input, 'input', inputChangeHandler );
			
			if ( detach ) {
				detachNode( h2 );
				detachNode( text1 );
				detachNode( input );
			}
		}
	};
}

function genericform ( options ) {
	options = options || {};
	this._state = Object.assign( template.data(), options.data );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.oncreate, context: this });
	} else {
		template.oncreate.call( this );
	}
}

genericform.prototype = template.methods;

genericform.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

genericform.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

genericform.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

genericform.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

genericform.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

genericform.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

genericform.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

genericform.prototype.teardown = genericform.prototype.destroy = function destroy ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createText( data ) {
	return document.createTextNode( data );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function addEventListener( node, event, handler ) {
	node.addEventListener ( event, handler, false );
}

function removeEventListener( node, event, handler ) {
	node.removeEventListener ( event, handler, false );
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

module.exports = genericform;

},{}],3:[function(require,module,exports){
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
		console.log('trying to send', data)
		request.send(JSON.stringify(data))
	})
}

function logErrors(fn) {
	return (...args) => fn(...args).catch(err => console.log('ERRRROOOOOR', err))
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
				console.log('got data', data)
				component.handleData(data)
			} catch (error) {
				component.handleError && component.handleError(error)
			}
		})

		return component
	}
}

},{}],4:[function(require,module,exports){
const Example = require('./example.html')

new Example({
	target: document.querySelector('body')
})

},{"./example.html":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvU3ZlbHRlQ29tcG9uZW50Lmh0bWwiLCJjbGllbnQvaHR0cC1taWRkbGV3YXJlLmpzIiwiY2xpZW50L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7NkJDZVE7QUFDUixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7QUFDbkQsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUVsRSxPQUFlO0NBQ2QsSUFBSSxHQUFHO0VBQ04sT0FBTztHQUNOLEVBQUUsRUFBRSxFQUFFO0dBQ047RUFDRDtDQUNELFVBQVUsRUFBRTtFQUNYLFdBQVc7RUFDWDtDQUNEO0FBQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBbkJPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkJBREQ7QUFDUixPQUFlO0NBQ2QsSUFBSSxHQUFHO0VBQ04sT0FBTztHQUNOLFFBQVEsRUFBRTtJQUNULFNBQVMsRUFBRSxFQUFFO0lBQ2I7R0FDRDtFQUNEO0NBQ0QsUUFBUSxHQUFHO0VBQ1YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsTUFBTTtHQUM5QixJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ1IsUUFBUSxFQUFFO0tBQ1QsU0FBUyxFQUFFLFlBQVk7S0FDdkI7SUFDRCxDQUFDO0dBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7R0FDakIsQ0FBQztFQUNGO0NBQ0QsT0FBTyxFQUFFO0VBQ1IsVUFBVSxDQUFDLFFBQVEsRUFBRTtHQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ1IsUUFBUTtJQUNSLENBQUM7R0FDRjtFQUNELFdBQVcsQ0FBQyxLQUFLLEVBQUU7R0FDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNSLFFBQVEsRUFBRTtLQUNULFNBQVMsRUFBRSxFQUFFO0tBQ2I7SUFDRCxDQUFDO0dBQ0Y7RUFDRDtDQUNEO0FBQ0Q7Ozs7Ozs7Ozs7Ozs7O1lBdENZLElBQUksQ0FBQyxNQUFNLE9BQUUsUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0xsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjxoMj5cblx0SSdtIGEgZ2VuZXJpYyB3ZWIgZm9ybSFcbjwvaDI+XG48aW5wdXRcblx0dHlwZT1cInRleHRcIlxuXHRvbjpjaGFuZ2U9XCJmaXJlKCdzYXZlJywgZm9ybURhdGEpXCJcblx0YmluZDp2YWx1ZT1cImZvcm1EYXRhLmNvb2xUaGluZ1wiXG4vPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuXHRkYXRhKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRmb3JtRGF0YToge1xuXHRcdFx0XHRjb29sVGhpbmc6ICcnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRvbmNyZWF0ZSgpIHtcblx0XHR0aGlzLm9ic2VydmUoJ2VuZHBvaW50JywgKCkgPT4ge1xuXHRcdFx0dGhpcy5zZXQoe1xuXHRcdFx0XHRmb3JtRGF0YToge1xuXHRcdFx0XHRcdGNvb2xUaGluZzogJ0xvYWRpbmcuLi4nXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHR0aGlzLmZpcmUoJ2xvYWQnKVxuXHRcdH0pXG5cdH0sXG5cdG1ldGhvZHM6IHtcblx0XHRoYW5kbGVEYXRhKGZvcm1EYXRhKSB7XG5cdFx0XHR0aGlzLnNldCh7XG5cdFx0XHRcdGZvcm1EYXRhXG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0aGFuZGxlRXJyb3IoZXJyb3IpIHtcblx0XHRcdHRoaXMuc2V0KHtcblx0XHRcdFx0Zm9ybURhdGE6IHtcblx0XHRcdFx0XHRjb29sVGhpbmc6ICcnXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXHR9XG59XG48L3NjcmlwdD5cbiIsImZ1bmN0aW9uIGh0dHAobWV0aG9kLCB1cmwsIGRhdGEpIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG5cdFx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRyZXNvbHZlKHJlcXVlc3QucmVzcG9uc2VUZXh0ICYmIEpTT04ucGFyc2UocmVxdWVzdC5yZXNwb25zZVRleHQpKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVqZWN0KHJlcXVlc3Quc3RhdHVzKVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0cmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlamVjdClcblx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgcmVqZWN0KVxuXHRcdHJlcXVlc3Qub3BlbihtZXRob2QsIHVybClcblx0XHRjb25zb2xlLmxvZygndHJ5aW5nIHRvIHNlbmQnLCBkYXRhKVxuXHRcdHJlcXVlc3Quc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcblx0fSlcbn1cblxuZnVuY3Rpb24gbG9nRXJyb3JzKGZuKSB7XG5cdHJldHVybiAoLi4uYXJncykgPT4gZm4oLi4uYXJncykuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKCdFUlJSUk9PT09PUicsIGVycikpXG59XG5cbmNvbnN0IGdldCA9ICgoLi4uYXJncykgPT4gaHR0cCgnR0VUJywgLi4uYXJncykpXG5jb25zdCBwb3N0ID0gKCguLi5hcmdzKSA9PiBodHRwKCdQT1NUJywgLi4uYXJncykpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaHR0cE1pZGRsZXdhcmUoQ29tcG9uZW50KSB7XG5cdHJldHVybiBmdW5jdGlvbiBwcm94eShvcHRpb25zKSB7XG5cdFx0Y29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudChvcHRpb25zKVxuXG5cdFx0Y29tcG9uZW50Lm9uKCdzYXZlJywgZGF0YSA9PiB7XG5cdFx0XHRjb25zdCBlbmRwb2ludCA9IGNvbXBvbmVudC5nZXQoJ2VuZHBvaW50Jylcblx0XHRcdHBvc3QoZW5kcG9pbnQsIGRhdGEpXG5cdFx0fSlcblxuXHRcdGNvbXBvbmVudC5vbignbG9hZCcsIGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGVuZHBvaW50ID0gY29tcG9uZW50LmdldCgnZW5kcG9pbnQnKVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZGF0YSA9IGF3YWl0IGdldChlbmRwb2ludClcblx0XHRcdFx0Y29uc29sZS5sb2coJ2dvdCBkYXRhJywgZGF0YSlcblx0XHRcdFx0Y29tcG9uZW50LmhhbmRsZURhdGEoZGF0YSlcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbXBvbmVudC5oYW5kbGVFcnJvciAmJiBjb21wb25lbnQuaGFuZGxlRXJyb3IoZXJyb3IpXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHJldHVybiBjb21wb25lbnRcblx0fVxufVxuIiwiY29uc3QgRXhhbXBsZSA9IHJlcXVpcmUoJy4vZXhhbXBsZS5odG1sJylcblxubmV3IEV4YW1wbGUoe1xuXHR0YXJnZXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKVxufSlcbiJdfQ==
