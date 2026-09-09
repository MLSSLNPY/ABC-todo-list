const todoColumns = [...document.querySelectorAll('.todo-column')];
const clearAllButton = document.querySelector('#clear-all-button');
const emptyInputMessage = document.querySelector('#empty-input-message');
const todoCount = document.querySelector('#todo-count');
const personalNoteInput = document.querySelector('#personal-note-input');
const personalNoteButton = document.querySelector('#personal-note-button');
const storageKey = 'todoItems';
const personalNoteStorageKey = 'personalNote';

function saveTodos() {
	const todos = todoColumns.flatMap((column) => [...column.querySelectorAll('.todo-item')].map((todoItem) => ({
		column: column.dataset.column,
		text: todoItem.querySelector('.todo-text').textContent,
		completed: todoItem.querySelector('.todo-checkbox').checked
	})));

	localStorage.setItem(storageKey, JSON.stringify(todos));
	todoCount.textContent = `Toplam görev: ${todos.length}`;
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

todoColumns.forEach((column) => {
	const form = column.querySelector('.todo-form');
	const input = column.querySelector('.todo-input');
	const list = column.querySelector('.todo-list');

	form.addEventListener('submit', (event) => {
		event.preventDefault();

		const todoText = input.value.trim();
		if (!todoText) {
			emptyInputMessage.hidden = false;
			input.focus();
			return;
		}

		emptyInputMessage.hidden = true;
		list.appendChild(createTodoItem(todoText));
		saveTodos();

		input.value = '';
		input.focus();
	});
});

clearAllButton.addEventListener('click', () => {
	todoColumns.forEach((column) => column.querySelector('.todo-list').replaceChildren());
	saveTodos();
});

personalNoteButton.addEventListener('click', () => {
	if (personalNoteInput.readOnly) {
		personalNoteInput.readOnly = false;
		personalNoteButton.textContent = 'Kaydet';
		personalNoteInput.focus();
		return;
	}

	personalNoteInput.value = personalNoteInput.value.trim();
	localStorage.setItem(personalNoteStorageKey, personalNoteInput.value);
	personalNoteInput.readOnly = true;
	personalNoteButton.textContent = 'Düzenle';
});

const savedTodos = JSON.parse(localStorage.getItem(storageKey) || '[]');
savedTodos.forEach((todo) => {
	const column = todoColumns.find((item) => item.dataset.column === todo.column) || todoColumns[0];
	column.querySelector('.todo-list').appendChild(createTodoItem(todo.text, todo.completed));
});
saveTodos();

personalNoteInput.value = localStorage.getItem(personalNoteStorageKey) || '';
