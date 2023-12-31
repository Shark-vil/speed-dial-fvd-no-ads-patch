import { _array, FVDEventEmitter, Utils } from '../../utils.js';
import Widgets from '../widgets.js';
import Templates from '../../templates.js';

console.log("load builder");
const WidgetsBuilder = new function () {
	const self = this;
	let pckry = null;
	const WIDGET_PANEL_MIN_PADDING_TOP = 15;
	const WIDGET_PANEL_OPEN_BUTTON_HEIGHT = 19;
	const WIDGET_MARGIN = 10;
	const WIDGET_PADDING_LEFT = 10;
	const widgetsPanelSize = {
		width: window.innerWidth,
		height: 0,
	};
	const cellSize = {
		width: 250,
		height: 200,
	};
	// number of rows and height
	const widgetsPanelHeights = {
		1: 200,
		2: 400,
	};

	this.onReorderComplete = new FVDEventEmitter();

	function effCellWidth(x) {
		let marginsIncludedWidth = 0;

		// max width is 4 cells
		if (x > 4) {
			x = 4;
		}

		if (x > 1) {
			marginsIncludedWidth = WIDGET_MARGIN * (x-1);
		}

		return cellSize.width * x + marginsIncludedWidth;
	}
	function effCellHeight(y) {
		// max widget height is 2 cells
		if (y > 2) {
			y = 2;
		}

		let marginsIncludedHeight = 0;

		if (y > 1) {
			marginsIncludedHeight = WIDGET_MARGIN * (y-1);
		}

		return cellSize.height * y + marginsIncludedHeight;
	}

	function adjustWidgetPanelSize(widgets) {
		let rowsCount = 1;
		let widgetsSummaryWidth = WIDGET_PADDING_LEFT;

		widgets.forEach(function (widget) {
			widgetsSummaryWidth += effCellWidth(widget.widthCells) + WIDGET_MARGIN;

			if (widget.heightCells >= 2) {
				rowsCount = 2;
			}
		});
		widgetsPanelSize.height = widgetsPanelHeights[rowsCount] + WIDGET_MARGIN;
		widgetsPanelSize.width = window.innerWidth;
		widgetsPanelSize.width = Math.max(widgetsPanelSize.width, widgetsSummaryWidth);
		document.querySelector("#widgetsPanel .widgetsContainer").style.height = widgetsPanelSize.height + "px";
		document.querySelector("#widgetsPanel .widgetsContainer").style.width = widgetsPanelSize.width + "px";
		document.getElementById("widgetsPanel").style.bottom = "-" + (widgetsPanelSize.height - WIDGET_PANEL_OPEN_BUTTON_HEIGHT + WIDGET_PANEL_MIN_PADDING_TOP) + "px";
	}

	function getWidgetMargins(params) {
		const data = params.data;

		if (!data.height) {
			return {};
		}

		const result = {};

		result.top = (widgetsPanelSize.height - data.height)/2;

		return result;
	}

	function refreshPositions(params) {
		pckry.items.sort(function (p1, p2) {
			const a = p1.element;
			const b = p2.element;

			return parseInt(a.getAttribute("position"), 10) - parseInt(b.getAttribute("position"), 10);
		});
		pckry.layout();
	}

	function storeCurrentPositions() {
		const widgets = pckry.getItemElements();
		const positions = {};

		widgets.forEach(function (elem, index) {
			positions[ elem.getAttribute("id").replace("widget_", "") ] = index + 1;
		});
		Widgets.setAllWidgetPositions(positions);
	}

	this.getWidgetsPanelHeight = function () {
		return widgetsPanelSize.height;
	};

	this.getWidgetsTotalWidth = function () {
		const widgets = _array(document.querySelectorAll("#widgetsPanel .widgetsContainer .widget"));
		let w = 0;

		widgets.forEach(function (widget) {
			w += parseInt(widget.getAttribute("_width"), 10) + WIDGET_MARGIN;
		});

		w -= WIDGET_MARGIN;
		w += WIDGET_PADDING_LEFT;

		return w;
	};

	this.syncPositionsWithDb = function () {
		const widgets = _array(document.querySelectorAll("#widgetsPanel .widgetsContainer .widget"));

		Utils.Async.arrayProcess(widgets, function (el, next) {
			Widgets.getPosition(el.getAttribute("id").replace("widget_", ""), function (pos) {
				el.setAttribute("position", pos);
				next();
			});
		}, function () {
			refreshPositions();
		});
	};

	this.removeWidget = function (id) {
		const el = document.getElementById("widget_" + id);

		if (el) {
			Widgets.getAll(function (widgets) {
				adjustWidgetPanelSize(widgets);
				pckry.remove(el);
			});
		}
	};

	this.buildWidgetElem = function (params) {
		const data = params.data;

		const elem = Templates.clone("prototype_widget");

		elem.removeAttribute("id");
		elem.setAttribute("id", "widget_" + data.id);
		elem.setAttribute("dd_class", "widget");

		elem.setAttribute("position", params.position);
		elem.setAttribute("_width", data.widthCells);
		elem.setAttribute("_height", data.heightCells);
		elem.querySelector("iframe").setAttribute("src", "chrome-extension://" + data.id + data.path);

		if (data.widthCells) {
			elem.style.width = effCellWidth(data.widthCells) + "px";
		}

		if (data.heightCells) {
			elem.style.height = effCellHeight(data.heightCells) + "px";
		}

		elem.querySelector(".buttons .close").addEventListener("click", function () {
			Widgets.remove(data.id);
		}, false);

		return elem;
	};

	this.rebuildAll = function () {
		const container = document.querySelector("#widgetsPanel .widgetsContainer");
		const panel = document.getElementById("widgetsPanel");

		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		Widgets.getAll(function (widgets) {
			if (!widgets.length) {
				panel.setAttribute("nowidgets", 1);
			} else {
				panel.setAttribute("nowidgets", 0);
			}

			const els = [];

			widgets.forEach(function (widget) {
				const position = widget.position;
				const elem = self.buildWidgetElem({
					data: widget,
					position: position,
				});

				container.appendChild(elem);
				els.push(elem);
			});

			if (pckry) {
				pckry.destroy();
			}

			adjustWidgetPanelSize(widgets);
			pckry = new Packery(container, {
				itemSelector: '.widget',
				gutter: WIDGET_MARGIN,
				isHorizontal: true,
				columnWidth: cellSize.width,
				rowHeight: cellSize.height,
				containerStyle: null,
				isInitLayout: false,
			});
			els.forEach(function (el) {
				const draggie = new Draggabilly(el, {
					containment: container,
				});

				draggie.on('dragStart', function (event, pointer) {
					//el.setAttribute("dragging", 1);
				});
				draggie.on('dragMove', function (event, pointer) {
					el.setAttribute("dragging", 1);
				});
				draggie.on('dragEnd', function (event, pointer) {
				});
				pckry.bindDraggabillyEvents(draggie);
			});
			pckry.on("dragItemPositioned", function (pckryInstance, draggedItem) {
				draggedItem.element.removeAttribute("dragging");
				self.onReorderComplete.callListeners();
				storeCurrentPositions();
			});
			pckry.on("layoutComplete", function () {
				self.onReorderComplete.callListeners();
			});
			pckry.on('removeComplete', function () {
				storeCurrentPositions();
			});
			refreshPositions();
		});
	};
};

export default WidgetsBuilder;