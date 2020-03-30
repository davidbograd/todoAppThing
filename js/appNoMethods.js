/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	var app = {}

	// Util-object functions start
	function uuid() {
		var i, random;
		var uuid = '';

		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuid += '-';
			}
			uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
		}

		return uuid;
	}
	
	function store(namespace, data) {
		if (arguments.length > 1) {
			return localStorage.setItem(namespace, JSON.stringify(data));
		} else {
			var store = localStorage.getItem(namespace);
			return (store && JSON.parse(store)) || [];
		}
	}

	function pluralize(count, word) {
		let returnWord = count === 1 ? word : word + 's';
		return returnWord
	}
	// Util-object functions end

	// App-object functions start
	function render() {
		var todos = getFilteredTodos();
		$('#todo-list').html(app.todoTemplate(todos));
		$('#main').toggle(todos.length > 0);
		$('#toggle-all').prop('checked', getActiveTodos().length === 0);
		renderFooter();
		$('#new-todo').focus();
		store('todos-jquery', app.todos);
	}
	
	function renderFooter() {
		var todoCount = app.todos.length;
		var activeTodoCount = getActiveTodos().length;
		var template = app.footerTemplate({
			activeTodoCount: activeTodoCount,
			activeTodoWord: pluralize(activeTodoCount, 'item'),
			completedTodos: todoCount - activeTodoCount,
			filter: app.filter
		});

		$('#footer').toggle(todoCount > 0).html(template);
	}

	function toggleAll(e) {
		var isChecked = $(e.target).prop('checked');

		app.todos.forEach(function (todo) {
			todo.completed = isChecked;
		});

		render();
	}

	function getActiveTodos() {
		return app.todos.filter(function (todo) {
			return !todo.completed;
		});
	}

	function getCompletedTodos() {
		return app.todos.filter(function (todo) {
			return todo.completed;
		});
	}

	function getFilteredTodos() {
		if (app.filter === 'active') {
			return getActiveTodos();
		}

		if (app.filter === 'completed') {
			return getCompletedTodos();
		}

		return app.todos;
	}

	function destroyCompleted() {
		app.todos = getActiveTodos();
		app.filter = 'all';
		render();
	}

	// accepts an element from inside the `.item` div and
	// returns the corresponding index in the `todos` array
	function indexFromEl(el) {
		var id = $(el).closest('li').data('id');
		var todos = app.todos;
		var i = todos.length;

		while (i--) {
			if (todos[i].id === id) {
				return i;
			}
		}
	}

	function create(e) {
		var $input = $(e.target);
		var val = $input.val().trim();

		if (e.which !== ENTER_KEY || !val) {
			return;
		}

		app.todos.push({
			id: uuid(),
			title: val,
			completed: false
		});

		$input.val('');

		render();
	}

	function toggle(e) {
		var i = indexFromEl(e.target);
		app.todos[i].completed = !app.todos[i].completed;
		render();
	}

	function edit(e) {
		var $input = $(e.target).closest('li').addClass('editing').find('.edit');
		$input.val($input.val()).focus();
	}

	function editKeyup(e) {
		if (e.which === ENTER_KEY) {
			e.target.blur();
		}

		if (e.which === ESCAPE_KEY) {
			$(e.target).data('abort', true).blur();
		}
	}

	function update(e) {
		var el = e.target;
		var $el = $(el);
		var val = $el.val().trim();

		if (!val) {
			app.destroy(e);
			return;
		}

		if ($el.data('abort')) {
			$el.data('abort', false);
		} else {
			app.todos[indexFromEl(el)].title = val;
		}

		render();
	}

	function destroy(e) {
		app.todos.splice(indexFromEl(e.target), 1);
		render();
	}

	function bindEvents() {
		console.log(this)
		$('#new-todo').on('keyup', create.bind(app));
		$('#toggle-all').on('change', toggleAll.bind(app));
		$('#footer').on('click', '#clear-completed', destroyCompleted.bind(app));
		$('#todo-list')
			.on('change', '.toggle', toggle.bind(app))
			.on('dblclick', 'label', edit.bind(app))
			.on('keyup', '.edit', editKeyup.bind(app))
			.on('focusout', '.edit', update.bind(app))
			.on('click', '.destroy', destroy.bind(app));
	}

	function init() {
		app.todos = store('todos-jquery');
		app.todoTemplate = Handlebars.compile($('#todo-template').html());
		app.footerTemplate = Handlebars.compile($('#footer-template').html());
		bindEvents();

		new Router({
			'/:filter': function (filter) {
				app.filter = filter;
				render();
			}.bind(app)
		}).init('/all');      
	}

	init();
});