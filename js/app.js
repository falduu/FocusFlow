/**
 * FocusFlow - Main Application Logic
 * Gestisce timer, task, statistiche e interfaccia utente
 */
(() => {
    'use strict';

    // 🎯 Configurazione Modalità Timer
    const MODES = {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    };

    // 📦 Stato Applicazione
    let timerInterval = null;
    let timeLeft = MODES.pomodoro;
    let currentMode = 'pomodoro';
    let isRunning = false;

    // 🔌 Riferimenti DOM
    const UI = {
        timerDisplay: document.getElementById('timerDisplay'),
        modeBtns: document.querySelectorAll('.mode-btn'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resetBtn: document.getElementById('resetBtn'),
        sessionsToday: document.getElementById('sessionsToday'),
        tasksCompleted: document.getElementById('tasksCompleted'),
        totalFocusTime: document.getElementById('totalFocusTime'),
        taskInput: document.getElementById('taskInput'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        taskList: document.getElementById('taskList'),
        emptyState: document.getElementById('emptyState'),
        themeToggle: document.getElementById('themeToggle'),
        alarmSound: document.getElementById('alarmSound')
    };

    // 🚀 Inizializzazione
    function init() {
        loadTheme();
        loadStats();
        renderTasks();
        setupEventListeners();
        updateTimerDisplay();
        updateControls();
    }

    // ⏱️ Gestione Timer
    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        updateControls();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimerComplete();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        clearInterval(timerInterval);
        isRunning = false;
        updateControls();
    }

    function resetTimer() {
        pauseTimer();
        timeLeft = MODES[currentMode];
        updateTimerDisplay();
    }

    function handleTimerComplete() {
        // Riproduzione suono (fallback per policy autoplay)
        UI.alarmSound.currentTime = 0;
        UI.alarmSound.play().catch(() => console.warn('Audio bloccato dal browser'));

        // Aggiorna statistiche solo per sessioni Pomodoro
        if (currentMode === 'pomodoro') {
            Storage.addSession(MODES.pomodoro / 60);
            loadStats();
        }

        // Reset visivo + feedback pagina
        timeLeft = MODES[currentMode];
        updateTimerDisplay();
        document.title = `🔔 ${document.title}`;
        setTimeout(() => updateTimerDisplay(), 2000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        UI.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.title = `${UI.timerDisplay.textContent} - FocusFlow`;
    }

    function updateControls() {
        UI.startBtn.disabled = isRunning;
        UI.pauseBtn.disabled = !isRunning;
    }

    function switchMode(mode) {
        if (currentMode === mode) return;
        pauseTimer();
        currentMode = mode;
        timeLeft = MODES[mode];
        updateTimerDisplay();
        updateControls();

        UI.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    // 📋 Gestione Task
    function renderTasks() {
        const tasks = Storage.getTasks();
        UI.taskList.innerHTML = '';

        if (tasks.length === 0) {
            UI.emptyState.style.display = 'block';
            return;
        }

        UI.emptyState.style.display = 'none';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
        <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
        <button class="delete-btn" data-id="${task.id}" aria-label="Elimina task">🗑️</button>
      `;
            UI.taskList.appendChild(li);
        });
    }

    function addTask() {
        const text = UI.taskInput.value.trim();
        if (!text) return;

        Storage.addTask(text);
        UI.taskInput.value = '';
        renderTasks();
    }

    function handleTaskAction(e) {
        const checkbox = e.target.closest('.task-checkbox');
        const deleteBtn = e.target.closest('.delete-btn');

        if (checkbox) {
            const id = Number(checkbox.dataset.id);
            // Leggi stato PRIMA del toggle
            const tasksBefore = Storage.getTasks();
            const wasCompleted = tasksBefore.find(t => t.id === id)?.completed || false;

            const isNowCompleted = Storage.toggleTask(id);

            // Aggiorna statistiche solo se cambia lo stato reale
            if (isNowCompleted && !wasCompleted) Storage.incrementCompletedTasks();
            else if (!isNowCompleted && wasCompleted) Storage.decrementCompletedTasks();

            loadStats();
            renderTasks();
        }

        if (deleteBtn) {
            const id = Number(deleteBtn.dataset.id);
            Storage.deleteTask(id);
            renderTasks();
        }
    }

    // 📊 Statistiche
    function loadStats() {
        const stats = Storage.getStats();
        UI.sessionsToday.textContent = stats.sessionsToday;
        UI.tasksCompleted.textContent = stats.tasksCompleted;
        UI.totalFocusTime.textContent = `${stats.totalFocusTime}m`;
    }

    // 🌙 Tema
    function loadTheme() {
        const theme = Storage.getTheme();
        applyTheme(theme);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        Storage.saveTheme(next);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        UI.themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // 🛠️ Utility
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 🔌 Event Listeners
    function setupEventListeners() {
        UI.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => switchMode(btn.dataset.mode));
        });

        UI.startBtn.addEventListener('click', startTimer);
        UI.pauseBtn.addEventListener('click', pauseTimer);
        UI.resetBtn.addEventListener('click', resetTimer);

        UI.addTaskBtn.addEventListener('click', addTask);
        UI.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Event delegation per elementi dinamici
        UI.taskList.addEventListener('click', handleTaskAction);
        UI.themeToggle.addEventListener('click', toggleTheme);
    }

    // Avvia l'app quando il DOM è pronto
    document.addEventListener('DOMContentLoaded', init);
})();