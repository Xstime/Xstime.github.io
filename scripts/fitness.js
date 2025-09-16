// Fitness App JavaScript
class FitnessApp {
    constructor() {
        this.currentWorkout = null;
        this.workoutTimer = null;
        this.restTimer = null;
        this.workoutStartTime = null;
        this.exercises = [];
        this.workoutHistory = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateStats();
        this.renderWorkoutHistory();
        
        // Check if there's an active workout
        if (this.currentWorkout) {
            this.resumeWorkout();
        }
    }

    bindEvents() {
        // Header buttons
        document.getElementById('newWorkoutBtn').addEventListener('click', () => this.startNewWorkout());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        
        // Workout actions
        document.getElementById('addExerciseBtn').addEventListener('click', () => this.showExerciseModal());
        document.getElementById('finishWorkoutBtn').addEventListener('click', () => this.finishWorkout());
        document.getElementById('cancelWorkoutBtn').addEventListener('click', () => this.cancelWorkout());
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.hideExerciseModal());
        document.getElementById('exerciseModal').addEventListener('click', (e) => {
            if (e.target.id === 'exerciseModal') this.hideExerciseModal();
        });
        
        // Exercise selection
        this.bindExerciseSelectionEvents();
        
        // Rest timer controls
        document.getElementById('closeRestModal').addEventListener('click', () => this.hideRestModal());
        document.getElementById('addTimeBtn').addEventListener('click', () => this.addRestTime());
        document.getElementById('skipRestBtn').addEventListener('click', () => this.skipRest());
    }

    bindExerciseSelectionEvents() {
        // Re-bind exercise selection events (needed for dynamic content)
        document.querySelectorAll('.exercise-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.addExercise(e.target.dataset.exercise));
        });
    }

    // Workout Management
    startNewWorkout() {
        this.currentWorkout = {
            id: Date.now(),
            startTime: new Date(),
            exercises: [],
            notes: ''
        };
        this.workoutStartTime = Date.now();
        this.exercises = [];
        
        this.showWorkoutSection();
        this.startWorkoutTimer();
        this.saveData();
    }

    resumeWorkout() {
        this.showWorkoutSection();
        this.exercises = this.currentWorkout.exercises || [];
        this.renderExercises();
        this.startWorkoutTimer();
    }

    finishWorkout() {
        if (!this.currentWorkout || this.exercises.length === 0) {
            alert('请先添加一些动作！');
            return;
        }

        const endTime = new Date();
        const duration = Math.floor((endTime - new Date(this.currentWorkout.startTime)) / 1000);
        
        const completedWorkout = {
            ...this.currentWorkout,
            endTime,
            duration,
            exercises: this.exercises,
            totalVolume: this.calculateTotalVolume()
        };

        this.workoutHistory.unshift(completedWorkout);
        this.currentWorkout = null;
        this.exercises = [];
        
        this.hideWorkoutSection();
        this.stopWorkoutTimer();
        this.updateStats();
        this.renderWorkoutHistory();
        this.saveData();
        
        alert(`训练完成！总时长: ${this.formatDuration(duration)}`);
    }

    cancelWorkout() {
        if (confirm('确定要取消当前训练吗？')) {
            this.currentWorkout = null;
            this.exercises = [];
            this.hideWorkoutSection();
            this.stopWorkoutTimer();
            this.saveData();
        }
    }

    // Exercise Management
    addExercise(exerciseName) {
        const exercise = {
            id: Date.now(),
            name: exerciseName,
            sets: [
                { weight: '', reps: '', completed: false }
            ]
        };
        
        this.exercises.push(exercise);
        this.currentWorkout.exercises = this.exercises;
        this.renderExercises();
        this.hideExerciseModal();
        this.saveData();
    }

    removeExercise(exerciseId) {
        this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
        this.currentWorkout.exercises = this.exercises;
        this.renderExercises();
        this.saveData();
    }

    addSet(exerciseId) {
        const exercise = this.exercises.find(ex => ex.id === exerciseId);
        if (exercise) {
            exercise.sets.push({ weight: '', reps: '', completed: false });
            this.renderExercises();
            this.saveData();
        }
    }

    removeSet(exerciseId, setIndex) {
        const exercise = this.exercises.find(ex => ex.id === exerciseId);
        if (exercise && exercise.sets.length > 1) {
            exercise.sets.splice(setIndex, 1);
            this.renderExercises();
            this.saveData();
        }
    }

    updateSet(exerciseId, setIndex, field, value) {
        const exercise = this.exercises.find(ex => ex.id === exerciseId);
        if (exercise && exercise.sets[setIndex]) {
            exercise.sets[setIndex][field] = value;
            this.saveData();
        }
    }

    completeSet(exerciseId, setIndex) {
        const exercise = this.exercises.find(ex => ex.id === exerciseId);
        if (exercise && exercise.sets[setIndex]) {
            const set = exercise.sets[setIndex];
            if (set.weight && set.reps) {
                set.completed = true;
                this.renderExercises();
                this.startRestTimer();
                this.saveData();
            } else {
                alert('请填写重量和次数！');
            }
        }
    }

    // Timer Management
    startWorkoutTimer() {
        this.workoutTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.workoutStartTime) / 1000);
            document.getElementById('workoutTimer').textContent = this.formatDuration(elapsed);
        }, 1000);
    }

    stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
    }

    startRestTimer(duration = 90) {
        this.showRestModal();
        let remaining = duration;
        
        const updateTimer = () => {
            document.getElementById('restTimer').textContent = this.formatTime(remaining);
            if (remaining <= 0) {
                this.hideRestModal();
                clearInterval(this.restTimer);
                return;
            }
            remaining--;
        };
        
        updateTimer();
        this.restTimer = setInterval(updateTimer, 1000);
    }

    addRestTime() {
        // Add 30 seconds to rest timer
        const currentText = document.getElementById('restTimer').textContent;
        const [minutes, seconds] = currentText.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds + 30;
        
        clearInterval(this.restTimer);
        this.startRestTimer(totalSeconds);
    }

    skipRest() {
        clearInterval(this.restTimer);
        this.hideRestModal();
    }

    // UI Management
    showWorkoutSection() {
        document.getElementById('workoutSection').style.display = 'block';
    }

    hideWorkoutSection() {
        document.getElementById('workoutSection').style.display = 'none';
    }

    showExerciseModal() {
        document.getElementById('exerciseModal').classList.add('active');
    }

    hideExerciseModal() {
        document.getElementById('exerciseModal').classList.remove('active');
    }

    showRestModal() {
        document.getElementById('restModal').classList.add('active');
    }

    hideRestModal() {
        document.getElementById('restModal').classList.remove('active');
    }

    showHistory() {
        // This could open a detailed history view
        alert('历史记录功能即将推出！');
    }

    // Rendering
    renderExercises() {
        const container = document.getElementById('exerciseList');
        container.innerHTML = '';

        this.exercises.forEach(exercise => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.className = 'exercise-item';
            exerciseDiv.innerHTML = `
                <div class="exercise-header">
                    <span class="exercise-name">${exercise.name}</span>
                    <button class="remove-exercise" onclick="app.removeExercise(${exercise.id})">×</button>
                </div>
                <div class="sets-container">
                    ${exercise.sets.map((set, index) => `
                        <div class="set-row">
                            <span class="set-number">${index + 1}</span>
                            <input type="number" class="set-input" placeholder="重量(kg)" 
                                   value="${set.weight}" 
                                   onchange="app.updateSet(${exercise.id}, ${index}, 'weight', this.value)">
                            <input type="number" class="set-input" placeholder="次数" 
                                   value="${set.reps}"
                                   onchange="app.updateSet(${exercise.id}, ${index}, 'reps', this.value)">
                            <div class="set-actions">
                                ${!set.completed ? 
                                    `<button class="set-action add-set" onclick="app.completeSet(${exercise.id}, ${index})">✓</button>` :
                                    `<span style="color: var(--secondary-color);">✓</span>`
                                }
                                <button class="set-action remove-set" onclick="app.removeSet(${exercise.id}, ${index})">×</button>
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-outline" onclick="app.addSet(${exercise.id})" style="margin-top: 0.5rem;">
                        ➕ 添加组数
                    </button>
                </div>
            `;
            container.appendChild(exerciseDiv);
        });
    }

    renderWorkoutHistory() {
        const container = document.getElementById('workoutHistory');
        
        if (this.workoutHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏋️‍♂️</div>
                    <h3>开始你的第一次训练！</h3>
                    <p>点击"开始训练"按钮来记录你的健身计划</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.workoutHistory.slice(0, 5).map(workout => `
            <div class="workout-card">
                <div class="workout-date">
                    ${new Date(workout.startTime).toLocaleDateString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                    })}
                </div>
                <div class="workout-summary">
                    ${workout.exercises.length} 个动作 • ${this.formatDuration(workout.duration)} • ${workout.totalVolume}kg 总重量
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const totalWorkouts = this.workoutHistory.length;
        const totalVolume = this.workoutHistory.reduce((sum, workout) => sum + (workout.totalVolume || 0), 0);
        const currentStreak = this.calculateStreak();

        document.getElementById('totalWorkouts').textContent = totalWorkouts;
        document.getElementById('totalVolume').textContent = totalVolume.toLocaleString();
        document.getElementById('currentStreak').textContent = currentStreak;
    }

    // Utility Functions
    calculateTotalVolume() {
        return this.exercises.reduce((total, exercise) => {
            return total + exercise.sets.reduce((exerciseTotal, set) => {
                if (set.completed && set.weight && set.reps) {
                    return exerciseTotal + (parseFloat(set.weight) * parseInt(set.reps));
                }
                return exerciseTotal;
            }, 0);
        }, 0);
    }

    calculateStreak() {
        if (this.workoutHistory.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < this.workoutHistory.length; i++) {
            const workoutDate = new Date(this.workoutHistory[i].startTime);
            workoutDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff === streak + 1) {
                // Skip day, but continue if it's the first gap
                if (streak === 0) streak = 1;
                else break;
            } else {
                break;
            }
        }
        
        return streak;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Data Management
    saveData() {
        const data = {
            currentWorkout: this.currentWorkout,
            workoutHistory: this.workoutHistory,
            exercises: this.exercises,
            workoutStartTime: this.workoutStartTime
        };
        localStorage.setItem('fitnessAppData', JSON.stringify(data));
    }

    loadData() {
        const saved = localStorage.getItem('fitnessAppData');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentWorkout = data.currentWorkout;
            this.workoutHistory = data.workoutHistory || [];
            this.exercises = data.exercises || [];
            this.workoutStartTime = data.workoutStartTime;
        }
    }

    exportData() {
        const data = {
            workoutHistory: this.workoutHistory,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.workoutHistory) {
                    this.workoutHistory = data.workoutHistory;
                    this.updateStats();
                    this.renderWorkoutHistory();
                    this.saveData();
                    alert('数据导入成功！');
                }
            } catch (error) {
                alert('数据导入失败，请检查文件格式。');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitnessApp();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered: ', registration))
            .catch(registrationError => console.log('SW registration failed: ', registrationError));
    });
}