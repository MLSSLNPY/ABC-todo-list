const todoForm = document.querySelector('#todo-form');
const todoInput = document.querySelector('#todo-input');
const todoList = document.querySelector('#todo-list');

todoForm.addEventListener('submit', (event) => {
	event.preventDefault();

	const todoText = todoInput.value.trim();
	if (!todoText) {
		return;
	}

	const todoItem = document.createElement('li');
	todoItem.className = 'todo-item';
	todoItem.textContent = todoText;
	todoList.appendChild(todoItem);

	todoInput.value = '';
	todoInput.focus();
});
