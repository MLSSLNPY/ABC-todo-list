const todoColumns = [...document.querySelectorAll('.todo-column')];
const clearAllButton = document.querySelector('#clear-all-button');
const emptyInputMessage = document.querySelector('#empty-input-message');
const todoCount = document.querySelector('#todo-count');
const personalNoteInput = document.querySelector('#personal-note-input');
const personalNoteButton = document.querySelector('#personal-note-button');
const backgroundChangeButton = document.querySelector('#background-change-button');
const soundChangeButton = document.querySelector('#sound-change-button');
const storageKey = 'todoItems';
const personalNoteStorageKey = 'personalNote';
const backgroundStorageKey = 'backgroundImageIndex';
const soundStorageKey = 'soundModeIndex';
const backgroundImages = [
	'beautiful-landscape-with-lot-fir-trees-mountains.jpg',
	'beautiful-shot-forest-with-yellow-green-leafed-trees-with-sun-shining-through-branches.jpg',
	'misty-rain-falling-coniferous-forest.jpg',
	'morning-fog-forest.jpg'
];
const pomodoroDuration = 25 * 60;
let activeTimer = null;
let audioContext = null;
let soundCleanup = null;
const soundModes = [
	{ name: 'Kuş sesi', key: 'bird' },
	{ name: 'Yağmur sesi', key: 'rain' },
	{ name: 'Orman sesi', key: 'forest' }
];

function createNoiseSource(context) {
	const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
	const data = buffer.getChannelData(0);

	for (let index = 0; index < data.length; index += 1) {
		data[index] = Math.random() * 2 - 1;
	}

	const source = context.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	return source;
}

function stopSound() {
	if (soundCleanup) {
		soundCleanup();
		soundCleanup = null;
	}

	if (audioContext) {
		audioContext.close();
		audioContext = null;
	}
}

function startSound(mode) {
	audioContext = new AudioContext();
	const context = audioContext;
	const gain = context.createGain();
	const sources = [];
	const intervals = [];
	gain.connect(context.destination);

	if (mode.key === 'bird') {
		const playChirp = () => {
			const oscillator = context.createOscillator();
			const chirpGain = context.createGain();
			const startTime = context.currentTime;
			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(1500 + Math.random() * 500, startTime);
			oscillator.frequency.exponentialRampToValueAtTime(2600 + Math.random() * 700, startTime + 0.12);
			chirpGain.gain.setValueAtTime(0.001, startTime);
			chirpGain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
			chirpGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
			oscillator.connect(chirpGain).connect(gain);
			oscillator.start(startTime);
			oscillator.stop(startTime + 0.24);
		};

		playChirp();
		intervals.push(setInterval(playChirp, 2400));
	} else {
		const noise = createNoiseSource(context);
		const filter = context.createBiquadFilter();
		filter.type = mode.key === 'rain' ? 'lowpass' : 'lowpass';
		filter.frequency.value = mode.key === 'rain' ? 3200 : 500;
		gain.gain.value = mode.key === 'rain' ? 0.06 : 0.045;
		noise.connect(filter).connect(gain);
		noise.start();
		sources.push(noise);
	}

	soundCleanup = () => {
		intervals.forEach((interval) => clearInterval(interval));
		sources.forEach((source) => source.stop());
	};
}

function updateSoundButton() {
	const mode = soundModeIndex === -1 ? null : soundModes[soundModeIndex];
	soundChangeButton.textContent = `Ses: ${mode ? mode.name : 'Kapalı'}`;
	soundChangeButton.setAttribute('aria-pressed', String(Boolean(mode)));
}

function setBackground(index) {
	document.body.style.backgroundImage = `url("resimler/${backgroundImages[index]}")`;
	localStorage.setItem(backgroundStorageKey, index.toString());
}

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
	editButton.innerHTML = '<span class="pencil-icon" aria-hidden="true"></span>';
	editButton.setAttribute('aria-label', 'Düzenle');

	const deleteButton = document.createElement('button');
	deleteButton.type = 'button';
	deleteButton.className = 'delete-button';
	deleteButton.setAttribute('aria-label', 'Görevi sil');
	deleteButton.title = 'Görevi sil';
	deleteButton.appendChild(document.createElement('span'));
	deleteButton.firstElementChild.className = 'trash-icon';
	deleteButton.firstElementChild.setAttribute('aria-hidden', 'true');

	const timer = document.createElement('div');
	timer.className = 'pomodoro-timer';

	const timerDisplay = document.createElement('span');
	timerDisplay.className = 'timer-display';
	timerDisplay.textContent = '25:00';
	timerDisplay.setAttribute('aria-label', 'Pomodoro süresi');

	const timerButton = document.createElement('button');
	timerButton.type = 'button';
	timerButton.className = 'timer-button';
	timerButton.textContent = 'Başlat';
	timerButton.setAttribute('aria-label', `${todoText} için Pomodoro sayacını başlat`);
	timer.append(timerDisplay, timerButton);
	todoItem.append(checkbox, text, editButton, deleteButton, timer);

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
				editButton.innerHTML = '<span class="pencil-icon" aria-hidden="true"></span>';
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
		if (activeTimer?.item === todoItem) {
			clearInterval(activeTimer.interval);
			activeTimer = null;
		}
		todoItem.remove();
		saveTodos();
	});

	timerButton.addEventListener('click', () => {
		if (activeTimer?.item === todoItem) {
			clearInterval(activeTimer.interval);
			activeTimer = null;
			timerButton.textContent = 'Devam et';
			timerButton.setAttribute('aria-label', `${todoText} için Pomodoro sayacını devam ettir`);
			return;
		}

		if (activeTimer) {
			clearInterval(activeTimer.interval);
			activeTimer.button.textContent = 'Devam et';
		}

		let remainingSeconds = Number(todoItem.dataset.remainingSeconds || pomodoroDuration);
		timerButton.textContent = 'Durdur';
		timerButton.setAttribute('aria-label', `${todoText} için Pomodoro sayacını durdur`);
		activeTimer = { item: todoItem, button: timerButton, interval: null };
		activeTimer.interval = setInterval(() => {
			remainingSeconds -= 1;
			todoItem.dataset.remainingSeconds = remainingSeconds;
			const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
			const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
			timerDisplay.textContent = `${minutes}:${seconds}`;

			if (remainingSeconds <= 0) {
				clearInterval(activeTimer.interval);
				activeTimer = null;
				timerButton.textContent = 'Süre doldu';
				timerButton.disabled = true;
				timerButton.setAttribute('aria-label', `${todoText} için Pomodoro süresi doldu`);
			}
		}, 1000);
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
	if (activeTimer) {
		clearInterval(activeTimer.interval);
		activeTimer = null;
	}
	todoColumns.forEach((column) => column.querySelector('.todo-list').replaceChildren());
	saveTodos();
});

personalNoteButton.addEventListener('click', () => {
	const buttonLabel = personalNoteButton.querySelector('.button-label');

	if (personalNoteInput.readOnly) {
		personalNoteInput.readOnly = false;
		buttonLabel.textContent = 'Kaydet';
		personalNoteInput.focus();
		return;
	}

	personalNoteInput.value = personalNoteInput.value.trim();
	localStorage.setItem(personalNoteStorageKey, personalNoteInput.value);
	personalNoteInput.readOnly = true;
	buttonLabel.textContent = 'Düzenle';
});

const savedBackgroundIndex = Number.parseInt(localStorage.getItem(backgroundStorageKey) || '0', 10);
let backgroundIndex = Number.isInteger(savedBackgroundIndex) && savedBackgroundIndex >= 0 && savedBackgroundIndex < backgroundImages.length
	? savedBackgroundIndex
	: 0;
setBackground(backgroundIndex);

backgroundChangeButton.addEventListener('click', () => {
	backgroundIndex = (backgroundIndex + 1) % backgroundImages.length;
	setBackground(backgroundIndex);
});

const savedSoundIndex = Number.parseInt(localStorage.getItem(soundStorageKey) || '-1', 10);
let soundModeIndex = Number.isInteger(savedSoundIndex) && savedSoundIndex >= -1 && savedSoundIndex < soundModes.length
	? savedSoundIndex
	: -1;
updateSoundButton();

soundChangeButton.addEventListener('click', () => {
	stopSound();
	soundModeIndex = (soundModeIndex + 1) % (soundModes.length + 1);
	if (soundModeIndex === soundModes.length) {
		soundModeIndex = -1;
	} else {
		startSound(soundModes[soundModeIndex]);
	}
	localStorage.setItem(soundStorageKey, soundModeIndex.toString());
	updateSoundButton();
});

const savedTodos = JSON.parse(localStorage.getItem(storageKey) || '[]');
savedTodos.forEach((todo) => {
	const column = todoColumns.find((item) => item.dataset.column === todo.column) || todoColumns[0];
	column.querySelector('.todo-list').appendChild(createTodoItem(todo.text, todo.completed));
});
saveTodos();

personalNoteInput.value = localStorage.getItem(personalNoteStorageKey) || '';
