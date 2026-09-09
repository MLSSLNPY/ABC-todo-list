const todoForm = document.querySelector('#todo-form');
const todoInput = document.querySelector('#todo-input');
const todoList = document.querySelector('#todo-list');
const clearAllButton = document.querySelector('#clear-all-button');
const emptyInputMessage = document.querySelector('#empty-input-message');
const storageKey = 'todoItems';

function saveTodos() {
	const todos = [...todoList.querySelectorAll('.todo-item')].map((todoItem) => ({
		text: todoItem.querySelector('.todo-text').textContent,
		completed: todoItem.querySelector('.todo-checkbox').checked
	}));

	localStorage.setItem(storageKey, JSON.stringify(todos));
}

function createTodoItem(todoText, completed = false) {
	const todoItem = document.createElement('li');
	todoItem.className = 'todo-item';

	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.className = 'todo-checkbox';
	checkbox.checked = completed;
	checkbox.setAttribute('aria-label', `${todoText} tamamlandı`);
	todoItem.classList.toggle('completed', completed);

	const text = document.createElement('span');
	text.className = 'todo-text';
	text.textContent = todoText;

	const editButton = document.createElement('button');
	editButton.type = 'button';
	editButton.className = 'edit-button';
	editButton.textContent = '✎';
	editButton.setAttribute('aria-label', 'Düzenle');

	const deleteButton = document.createElement('button');
	deleteButton.type = 'button';
	deleteButton.className = 'delete-button';
	deleteButton.textContent = '🧽';
	deleteButton.setAttribute('aria-label', 'Görevi sil');
	todoItem.append(checkbox, text, editButton, deleteButton);

	checkbox.addEventListener('change', () => {
		todoItem.classList.toggle('completed', checkbox.checked);
		saveTodos();
	});

	editButton.addEventListener('click', () => {
		if (todoItem.classList.contains('editing')) {
			const editInput = todoItem.querySelector('.edit-input');
			if (!editInput) {
				return;
			}
			const updatedText = editInput.value.trim();

			if (updatedText) {
				text.textContent = updatedText;
				editInput.replaceWith(text);
				todoItem.classList.remove('editing');
				editButton.textContent = '✎';
				editButton.setAttribute('aria-label', 'Düzenle');
				saveTodos();
			}
			return;
		}

		const editInput = document.createElement('input');
		editInput.type = 'text';
		editInput.className = 'edit-input';
		editInput.value = text.textContent;
		editInput.setAttribute('aria-label', 'Görevi düzenle');
		text.replaceWith(editInput);
		todoItem.classList.add('editing');
		editButton.textContent = '✓';
		editButton.setAttribute('aria-label', 'Kaydet');
		editInput.focus();
	});

	deleteButton.addEventListener('click', () => {
		todoItem.remove();
		saveTodos();
	});

	return todoItem;
}

todoForm.addEventListener('submit', (event) => {
	event.preventDefault();

	const todoText = todoInput.value.trim();
	if (!todoText) {
		emptyInputMessage.hidden = false;
		todoInput.focus();
		return;
	}

	emptyInputMessage.hidden = true;
	todoList.appendChild(createTodoItem(todoText));
	saveTodos();

	todoInput.value = '';
	todoInput.focus();
});

clearAllButton.addEventListener('click', () => {
	todoList.replaceChildren();
	saveTodos();
});

const savedTodos = JSON.parse(localStorage.getItem(storageKey) || '[]');
savedTodos.forEach((todo) => {
	todoList.appendChild(createTodoItem(todo.text, todo.completed));
});
