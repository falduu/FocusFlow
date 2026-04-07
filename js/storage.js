/**
 * Storage Manager
 * Gestisce il salvataggio e recupero dei dati da localStorage
 */

const Storage = {
    // Chiavi per localStorage
    KEYS: {
        TASKS: 'focusflow_tasks',
        STATS: 'focusflow_stats',
        THEME: 'focusflow_theme'
    },

    /**
     * Recupera i task salvati
     * @returns {Array} Lista di task
     */
    getTasks() {
        const data = localStorage.getItem(this.KEYS.TASKS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Salva i task
     * @param {Array} tasks - Lista di task da salvare
     */
    saveTasks(tasks) {
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
    },

    /**
     * Aggiunge un nuovo task
     * @param {string} text - Testo del task
     * @returns {Object} Il task creato
     */
    addTask(text) {
        const tasks = this.getTasks();
        const newTask = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        this.saveTasks(tasks);
        return newTask;
    },

    /**
     * Toggle completamento task
     * @param {number} id - ID del task
     * @returns {boolean} Nuovo stato di completamento
     */
    toggleTask(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedAt = new Date().toISOString();
            } else {
                delete task.completedAt;
            }
            this.saveTasks(tasks);
            return task.completed;
        }
        return false;
    },

    /**
     * Elimina un task
     * @param {number} id - ID del task da eliminare
     */
    deleteTask(id) {
        const tasks = this.getTasks().filter(t => t.id !== id);
        this.saveTasks(tasks);
    },

    /**
     * Recupera le statistiche
     * @returns {Object} Oggetto statistiche
     */
    getStats() {
        const data = localStorage.getItem(this.KEYS.STATS);
        return data ? JSON.parse(data) : {
            sessionsToday: 0,
            tasksCompleted: 0,
            totalFocusTime: 0, // in minuti
            lastSessionDate: null
        };
    },

    /**
     * Salva le statistiche
     * @param {Object} stats - Oggetto statistiche
     */
    saveStats(stats) {
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
    },

    /**
     * Incrementa le sessioni completate oggi
     * @param {number} minutes - Minuti della sessione
     */
    addSession(minutes) {
        const stats = this.getStats();
        const today = new Date().toDateString();

        // Resetta se è un nuovo giorno
        if (stats.lastSessionDate !== today) {
            stats.sessionsToday = 0;
            stats.lastSessionDate = today;
        }

        stats.sessionsToday++;
        stats.totalFocusTime += minutes;
        this.saveStats(stats);
    },

    /**
     * Incrementa i task completati
     */
    incrementCompletedTasks() {
        const stats = this.getStats();
        stats.tasksCompleted++;
        this.saveStats(stats);
    },

    /**
     * Decrementa i task completati (se si toglie il completamento)
     */
    decrementCompletedTasks() {
        const stats = this.getStats();
        if (stats.tasksCompleted > 0) {
            stats.tasksCompleted--;
            this.saveStats(stats);
        }
    },

    /**
     * Gestisce il tema (chiaro/scuro)
     */
    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },

    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    /**
     * Resetta tutti i dati (utile per testing)
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.TASKS);
        localStorage.removeItem(this.KEYS.STATS);
        localStorage.removeItem(this.KEYS.THEME);
    }
};

// Rendi Storage disponibile globalmente
window.Storage = Storage;