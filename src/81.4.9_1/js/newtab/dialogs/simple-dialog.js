/* Utility functions */
import { Utils } from '../../utils.js';

function bindEventHandler(element, eventName, handler) {
	if (element.addEventListener) {
		// The standard way
		element.addEventListener(eventName, handler, false);
	} else if (element.attachEvent) {
		// The Microsoft way
		element.attachEvent('on' + eventName, handler);
	}
}

/**
 * The modal dialog class
 * @constructor
 */
function Dialog(options) {
	this.options = {
		width: 400,
		top: 120,
		openOnCreate: true,
		destroyOnClose: true,
		escHandler: this.close,
		enterOnButton: null,
		buttons: { OK: this.close },
		leftButtons: {},
		className: '',
	};
	// Overwrite the default options
	for (const option in options) {
		this.options[option] = options[option];
	}
	// Create dialog dom
	this._makeNodes();

	if (this.options.openOnCreate) {
		this.open();
	}
}

Dialog.prototype = {
	/* handles to the dom nodes */
	container: null,
	header: null,
	body: null,
	content: null,
	actions: null,
	_overlay: null,
	_wrapper: null,
	_zIndex: 0,
	_escHandler: null,

	/**
	 * Shows the dialog
	 */
	open: function () {
		this._makeTop();
		const ws = this._wrapper.style;

		ws.left = (document.body.clientWidth - this.options.width) / 2 + 'px';
		ws.top
			= (document.body.scrollTop || document.documentElement.scrollTop) + this.options.top + 'px';
		this._overlay.style.display = 'block';
		ws.display = 'block';
		this._wrapper.focus();

		this._wrapper.className += ' ' + this.options.className;

		if (this.options.focus) {
			const input = document.getElementById(this.options.focus);

			if (input) {
				input.focus();
			}
		}

		if (this.options.onShow) {
			this.options.onShow(this);
		}
	},

	/**
	 * Closes the dialog
	 */
	close: function () {
		if (this.options.closeCallback) {
			this.options.closeCallback();
		}

		if (this.options.destroyOnClose) {
			this._destroy();
		} else {
			this._overlay.style.display = 'none';
			this._wrapper.style.display = 'none';
		}
	},

	/**
	 * Add buttons to the dialog actions panel after creation
	 * @param {object} buttons Object with property name as button text and value as click handler
	 * @param {boolean} prepend If true, buttons will be prepended to the panel instead of being appended
	 * @param specialClasses
	 */
	addButtons: function (buttons, prepend, specialClasses) {
		const actions = this.actions;
		const buttonArray = this._makeButtons(buttons, specialClasses);
		let first = null;

		if (prepend && (first = actions.firstChild) !== null) {
			for (const i in buttonArray) {
				actions.insertBefore(buttonArray[i], first);
			}
		} else {
			for (const i in buttonArray) {
				actions.appendChild(buttonArray[i]);
			}
		}
	},

	showActionMessage: function (message) {
		const actionBox = this.actions.getElementsByClassName('dlg-actionbox')[0];

		actionBox.textContent = message;
		Utils.UI.showAndHide(actionBox);
	},

	/**
	 * Change (or set) title after creation
	 * @param {string} title The dialog title
	 */
	setTitle: function (title) {
		if (!this.header) {
			const header = document.createElement('div');

			header.className = 'dialog-header';
			this.container.insertBefore(header, this.body);
			this.header = header;
		}

		this.header.innerHTML = title;
	},

	getMainButton: function () {
		return this.container.querySelector('button.main');
	},

	/**
	 * Makes the dom tree for the dialog
	 */
	_makeNodes: function () {
		if (this._overlay || this._wrapper) {
			return; // Avoid duplicate invocation
		}

		// Make overlay
		this._overlay = document.createElement('div');
		this._overlay.className = 'dialog-overlay';
		document.body.appendChild(this._overlay);

		const that = this;

		setTimeout(function () {
			that._overlay.style.opacity = '0.5';
		}, 0);

		const header = document.createElement('div');

		if (typeof this.options.title === 'string' && this.options.title !== '') {
			header.className = 'dialog-header';
			header.innerHTML = this.options.title;
			this.header = header;
		}

		// {begin dialog body
		const content = document.createElement('div');

		content.className = 'dialog-content';
		content.innerHTML = this.options.content;
		this.content = content;

		//   {begin actions panel
		const actions = document.createElement('div');

		actions.className = 'dialog-actions';
		let buttons = this._makeButtons(this.options.buttons);
		const leftButtons = this._makeButtons(this.options.leftButtons, 'leftButton');

		buttons = buttons.concat(leftButtons);

		let first = null;

		if (buttons.length > 0) {
			first = buttons[0];
			for (const i in buttons) {
				actions.appendChild(buttons[i]);
			}
		}

		const actionBox = document.createElement('div');

		actionBox.className = 'dlg-actionbox';
		actions.insertBefore(actionBox, first);

		this.actions = actions;
		//   }end actions panel

		const body = document.createElement('div');

		body.className = 'dialog-body';
		body.appendChild(content);
		body.appendChild(actions);
		this.body = body;
		// }end dialog body

		const container = document.createElement('div');

		container.className = 'dialog';

		if (this.header) {
			container.appendChild(header);
		}

		container.appendChild(body);
		this.container = container;

		const wrapper = document.createElement('div');

		wrapper.className = 'dialog-wrapper';
		const ws = wrapper.style;

		ws.position = 'absolute';
		ws.width = this.options.width + 'px';
		ws.display = 'none';
		ws.outline = 'none';
		wrapper.appendChild(container);

		// register keydown event
		if (this.options.escHandler || this.options.enterOnButton) {
			wrapper.tabIndex = -1;
			this._onKeydown = this._makeHandler(function (e) {
				if (!e) {
					e = window.event;
				}

				if (e.keyCode && e.keyCode === 27) {
					if (this.options.escHandler) {
						this.options.escHandler.apply(this);
					}
				} else if (e.keyCode && e.keyCode === 13) {
					if (this.options.enterOnButton) {
						this.options.buttons[this.options.enterOnButton]();
					}
				}
			}, this);
			bindEventHandler(wrapper, 'keydown', this._onKeydown);
		}

		this._wrapper = document.body.appendChild(wrapper);

		if (Dialog.needIEFix) {
			this._fixIE();
		}

		if (this.options.clickCallback) {
			const that = this;

			this._wrapper.addEventListener(
				'click',
				function () {
					that.options.clickCallback();
				},
				true
			);
		}

		setTimeout(function () {
			wrapper.style.webkitTransform = 'scale(1)';
			wrapper.style.opacity = '1';
		}, 0);
	},

	/**
	 * Removes the nodes from document
	 * @param {object} buttons Object with property name as button text and value as click handler
	 * @param specialClasses
	 * @return {Array} Array of buttons as dom nodes
	 */
	_makeButtons: function (buttons, specialClasses) {
		specialClasses = specialClasses || '';

		const buttonArray = [];
		const countButtons = Object.keys(buttons).length;

		for (const [text, handler] of Object.entries(buttons)) {
			const button = document.createElement('button');

			button.className = 'fvdButton dialog-button';

			bindEventHandler(button, 'click', this._makeHandler(handler, this));

			if (buttonArray.length === 0 && countButtons === 2) {
				button.className += ' main withLoading';
				button.innerHTML = `<span class="text">${text}</span><div class="image"></div>`;
			} else {
				button.innerText = text;
			}

			button.className += ' ' + specialClasses;
			buttonArray.push(button);
		}
		return buttonArray;
	},

	/** A helper function used by makeButtons */
	_makeHandler: function (method, obj) {
		return function (e) {
			method.call(obj, e);
		};
	},

	/** A helper function used by open */
	_makeTop: function () {
		if (this._zIndex < Dialog.Manager.currentZIndex) {
			this._overlay.style.zIndex = Dialog.Manager.newZIndex();
			this._zIndex = this._wrapper.style.zIndex = Dialog.Manager.newZIndex();
		}
	},

	_fixIE: function () {
		const width = document.documentElement['scrollWidth'] + 'px';
		const height = document.documentElement['scrollHeight'] + 'px';
		const os = this._overlay.style;

		os.position = 'absolute';
		os.width = width;
		os.height = height;

		const iframe = document.createElement('iframe');

		iframe.className = 'iefix';
		iframe.style.width = width;
		iframe.style.height = height;
		this._wrapper.appendChild(iframe);
	},

	/**
	 * Removes the nodes from document
	 */
	_destroy: function () {
		this._wrapper.style.opacity = 0;
		this._wrapper.style.webkitTransform = 'scale(0.9)';
		this._overlay.style.opacity = 0;

		const that = this;

		this._wrapper.addEventListener(
			'webkitTransitionEnd',
			function (event) {
				try {
					that._wrapper && document.body.removeChild(that._wrapper);
					that._overlay && document.body.removeChild(that._overlay);

					that.container = null;
					that.header = null;
					that.body = null;
					that.content = null;
					that.actions = null;
					that._overlay = null;
					that._wrapper = null;
				} catch (ex) {
					console.warn(ex);
				}
			},
			true
		);
	},
};

Dialog.needIEFix = (function () {
	const userAgent = navigator.userAgent.toLowerCase();

	return /msie/.test(userAgent) && !/opera/.test(userAgent) && !window.XMLHttpRequest;
})();

/** This simple object manages the z indices */
Dialog.Manager = {
	currentZIndex: 3000,
	newZIndex: function () {
		return this.currentZIndex;
	},
};

export default Dialog;
