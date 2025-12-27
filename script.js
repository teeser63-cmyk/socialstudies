// Основные функции игры
function switchMode(mode) {
    // Скрыть все секции
    document.getElementById('view-home').classList.add('hidden');
    ['story', 'olympiad', 'glossary', 'progress', 'schemes'].forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
    });
    
    // Показать выбранную секцию
    document.getElementById(`view-${mode}`).classList.remove('hidden');
    
    // Обновить навигацию
    ['story', 'olympiad', 'glossary', 'progress', 'schemes'].forEach(v => {
        document.getElementById(`nav-${v}`).classList.remove('nav-active');
    });
    document.getElementById(`nav-${mode}`).classList.add('nav-active');
    
    // Инициализировать контент
    if (mode === 'glossary') renderGlossary();
    if (mode === 'story') {
        updateStoryProgress();
        updateSceneNavigation();
    }
    if (mode === 'olympiad') renderOlympiadTasks();
    if (mode === 'progress') renderProgress();
    if (mode === 'schemes') initSchemes();
}

function startNewGame() {
    if (confirm("Начать новую игру? Текущий прогресс будет сброшен.")) {
        gameData.state = {
            xp: 0,
            currentScene: 1,
            completedScenes: [],
            correctAnswers: 0,
            incorrectAnswers: 0,
            olympiadResults: {},
            themeProgress: {
                'Человек': { completed: 0, total: 8, score: 0 },
                'Общение': { completed: 0, total: 7, score: 0 },
                'Государство': { completed: 0, total: 8, score: 0 },
                'Культура': { completed: 0, total: 7, score: 0 }
            }
        };
        saveGameState();
        switchMode('story');
        loadScene(1);
    }
}

function loadScene(sceneId) {
    // Проверить, существует ли сцена
    if (sceneId < 1 || sceneId > gameData.scenes.length) {
        sceneId = 1;
    }
    
    gameData.state.currentScene = sceneId;
    const scene = gameData.scenes.find(s => s.id === sceneId);
    
    if (!scene) {
        console.error('Сцена не найдена:', sceneId);
        return;
    }
    
    const container = document.getElementById('game-scene');
    
    // Обновить статистику темы при первом посещении
    if (!gameData.state.completedScenes.includes(scene.id)) {
        gameData.state.themeProgress[scene.theme].completed++;
        gameData.state.completedScenes.push(scene.id);
    }
    
    container.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold px-3 py-1 rounded-full ${getThemeColor(scene.theme)}-100 ${getThemeColor(scene.theme)}-600">Сцена ${scene.id}/30</span>
                <span class="text-xs font-bold text-slate-500">${scene.theme}</span>
            </div>
            <h3 class="text-2xl font-bold mb-4">${scene.title}</h3>
            <p class="text-slate-600 mb-8 leading-relaxed">${scene.description}</p>
            
            <div class="bg-slate-50 rounded-xl p-5 mb-6">
                <div class="flex items-start gap-3">
                    <i class="fas fa-graduation-cap ${getThemeColor(scene.theme)}-500 mt-1"></i>
                    <div>
                        <div class="font-bold text-sm mb-1">Проверяемые знания:</div>
                        <div class="text-sm text-slate-600">${scene.programReq}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-${getThemeColor(scene.theme)}-50 rounded-xl p-5">
                <div class="flex items-start gap-3">
                    <i class="fas fa-trophy ${getThemeColor(scene.theme)}-500 mt-1"></i>
                    <div>
                        <div class="font-bold text-sm mb-1">Связь с олимпиадой:</div>
                        <div class="text-sm text-slate-600">${scene.olympiadRef}</div>
                        <div class="text-xs ${getThemeColor(scene.theme)}-500 mt-2">"Этот вопрос проверяет: ${scene.programReq}"</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Показать кнопки выбора
    const choiceContainer = document.getElementById('choice-buttons');
    choiceContainer.classList.remove('hidden');
    choiceContainer.innerHTML = scene.choices.map((choice, index) => `
        <button onclick="makeChoice(${scene.id}, ${index})" class="option-btn bg-white p-4 border rounded-2xl text-left font-medium flex items-center gap-3 hover:border-${getThemeColor(scene.theme)}-400 hover:shadow-sm transition-all">
            <span class="w-8 h-8 rounded-lg ${getThemeColor(scene.theme)}-100 flex items-center justify-center text-sm font-bold ${getThemeColor(scene.theme)}-600">${index+1}</span>
            <div>
                <div>${choice.text}</div>
                <div class="text-xs text-slate-400 mt-1">+${choice.xp} XP</div>
            </div>
        </button>
    `).join('');
    
    // Обновить информацию о сцене
    updateSceneInfo(scene);
    
    // Обновить прогресс и навигацию
    updateStoryProgress();
    updateSceneNavigation();
    saveGameState();
}

function loadNextScene() {
    const nextScene = gameData.state.currentScene + 1;
    if (nextScene > gameData.scenes.length) {
        // Все сцены пройдены
        showModal(`
            <div class="text-center">
                <div class="text-5xl mb-4 text-green-500">🎉</div>
                <h4 class="text-2xl font-bold mb-2">Поздравляем!</h4>
                <p class="text-slate-500 mb-6">Вы прошли все 30 сцен игры!</p>
                <p class="text-slate-600 mb-6">Ваш результат: ${gameData.state.xp} XP</p>
                <button onclick="closeModal(); loadScene(1);" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors">
                    НАЧАТЬ ЗАНОВО
                </button>
            </div>
        `);
        return;
    }
    loadScene(nextScene);
}

function loadSpecificScene() {
    showModal(`
        <div class="text-center">
            <h4 class="text-xl font-bold mb-4">Выберите сцену</h4>
            <div class="grid grid-cols-3 gap-2 mb-6 max-h-60 overflow-y-auto">
                ${gameData.scenes.map(scene => `
                    <button onclick="closeModal(); loadScene(${scene.id});" class="p-3 rounded-lg border hover:bg-slate-50 transition-colors ${scene.id === gameData.state.currentScene ? 'bg-blue-50 border-blue-300' : ''}">
                        <div class="font-medium">${scene.id}</div>
                        <div class="text-xs text-slate-500 truncate">${scene.title.substring(0, 15)}${scene.title.length > 15 ? '...' : ''}</div>
                    </button>
                `).join('')}
            </div>
            <button onclick="closeModal()" class="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                ОТМЕНА
            </button>
        </div>
    `);
}

function makeChoice(sceneId, choiceIndex) {
    const scene = gameData.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const choice = scene.choices[choiceIndex];
    
    // Начислить опыт
    gameData.state.xp += choice.xp;
    gameData.state.themeProgress[scene.theme].score += choice.xp;
    
    // Обновить статистику ответов
    if (choice.correct) {
        gameData.state.correctAnswers++;
    } else {
        gameData.state.incorrectAnswers++;
    }
    
    // Показать результат выбора (центрированное модальное окно)
    showModal(`
        <div class="text-center">
            <div class="text-5xl mb-4 ${choice.correct ? 'text-green-500' : 'text-red-500'}">
                ${choice.correct ? '✅' : '❌'}
            </div>
            <h4 class="text-2xl font-bold mb-2">${choice.correct ? 'Правильно!' : 'Неправильно'}</h4>
            <p class="text-slate-500 mb-6">Вы получили <span class="font-bold ${getThemeColor(scene.theme)}-600">+${choice.xp} XP</span></p>
            
            <div class="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div class="font-bold text-sm mb-2">Объяснение:</div>
                <div class="text-sm text-slate-600">
                    <p class="mb-2">${choice.correct ? 'Вы выбрали правильный ответ.' : 'Вы выбрали неправильный вариант.'}</p>
                    <p>🎯 <span class="font-medium">${scene.programReq}</span></p>
                    ${!choice.correct ? '<p class="mt-2 text-red-600">Рекомендуем изучить эту тему лучше</p>' : ''}
                </div>
            </div>
            
            <div class="flex gap-3">
                <button onclick="closeModal(); loadNextScene();" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                    СЛЕДУЮЩАЯ СЦЕНА
                </button>
                <button onclick="closeModal(); loadScene(${sceneId});" class="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                    ПОВТОРИТЬ
                </button>
            </div>
        </div>
    `);
    
    saveGameState();
}

function updateStoryProgress() {
    const totalScenes = gameData.scenes.length;
    const completedScenes = gameData.state.completedScenes.length;
    const progressPercent = Math.round((completedScenes / totalScenes) * 100);
    
    document.getElementById('story-progress').textContent = `${progressPercent}%`;
    document.getElementById('story-progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('scene-count').textContent = `${completedScenes}/${totalScenes}`;
    document.getElementById('xp-count').textContent = gameData.state.xp;
    
    // Обновить прогресс по темам
    const themeProgressContainer = document.getElementById('theme-progress');
    if (themeProgressContainer) {
        themeProgressContainer.innerHTML = Object.entries(gameData.state.themeProgress).map(([theme, progress]) => {
            const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            return `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium ${getThemeColor(theme)}-600">${theme}</span>
                    <span class="text-sm font-bold">${percent}%</span>
                </div>
                <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div class="h-full ${getThemeColor(theme)}-500 rounded-full" style="width: ${percent}%"></div>
                </div>
            `;
        }).join('');
    }
}

function updateSceneNavigation() {
    // Обновить кнопки выбора сцены
    document.querySelectorAll('.scene-btn').forEach(btn => {
        const sceneId = parseInt(btn.dataset.scene);
        const isCompleted = gameData.state.completedScenes.includes(sceneId);
        const isCurrent = gameData.state.currentScene === sceneId;
        
        if (isCurrent) {
            btn.classList.add('bg-blue-100', 'border-blue-300', 'text-blue-700');
            btn.classList.remove('bg-white', 'hover:bg-slate-50');
        } else if (isCompleted) {
            btn.classList.add('bg-green-50', 'border-green-200', 'text-green-700');
            btn.classList.remove('bg-white', 'hover:bg-slate-50');
        } else {
            btn.classList.add('bg-white', 'hover:bg-slate-50');
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700', 'bg-green-50', 'border-green-200', 'text-green-700');
        }
    });
}

function updateSceneInfo(scene) {
    // Эта функция может быть использована для дополнительной информации
    // Пока оставим пустой, так как вся информация уже в основной сцене
}

function renderGlossary(data = gameData.glossary) {
    const container = document.getElementById('glossary-container');
    container.innerHTML = data.map(item => `
        <div class="term-card bg-white p-5 rounded-2xl border-l-4 border-${getThemeColor(item.c)}-border">
            <div class="flex justify-between items-start mb-2">
                <span class="text-lg font-bold ${getThemeColor(item.c)}-600">${item.t}</span>
                <div class="flex flex-col items-end">
                    <span class="text-[10px] px-2 py-0.5 ${getThemeColor(item.c)}-100 rounded-full font-bold ${getThemeColor(item.c)}-600 uppercase mb-1">${item.c}</span>
                </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-3">${item.d}</p>
            <div class="text-xs text-slate-400 flex items-center">
                <i class="fas fa-tag mr-1"></i> ${item.c}
            </div>
        </div>
    `).join('');
    
    // Настроить поиск
    document.getElementById('term-search').oninput = function(e) {
        const query = e.target.value.toLowerCase();
        const filtered = gameData.glossary.filter(i => 
            i.t.toLowerCase().includes(query) || 
            i.d.toLowerCase().includes(query) ||
            i.c.toLowerCase().includes(query)
        );
        renderGlossary(filtered);
    };
}

function filterTermsByTheme(theme) {
    if (theme === 'all') {
        renderGlossary();
    } else {
        const filtered = gameData.glossary.filter(i => i.c === theme);
        renderGlossary(filtered);
    }
}

// Остальные функции (renderOlympiadTasks, checkOlympiadTask и т.д.) остаются без изменений
// ... (все остальные функции из предыдущей версии)

// Вспомогательные функции
function getThemeColor(theme) {
    switch(theme) {
        case 'Человек': return 'blue';
        case 'Общение': return 'green';
        case 'Государство': return 'red';
        case 'Культура': return 'purple';
        default: return 'blue';
    }
}

function getTaskLevelColor(level) {
    switch(level) {
        case 'base': return 'blue';
        case 'advanced': return 'green';
        case 'olympiad': return 'red';
        default: return 'blue';
    }
}

function showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex'); // Добавляем flex для центрирования
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализировать глоссарий
    renderGlossary();
    
    // Обновить прогресс
    updateStoryProgress();
    
    // Установить обработчики поиска
    document.getElementById('term-search').oninput = function(e) {
        const query = e.target.value.toLowerCase();
        const filtered = gameData.glossary.filter(i => 
            i.t.toLowerCase().includes(query) || 
            i.d.toLowerCase().includes(query) ||
            i.c.toLowerCase().includes(query)
        );
        renderGlossary(filtered);
    };
    
    // Добавить обработчики для кнопок сцен
    updateSceneNavigation();
});

// Глобальные функции для HTML
window.switchMode = switchMode;
window.startNewGame = startNewGame;
window.loadScene = loadScene;
window.loadNextScene = loadNextScene;
window.loadSpecificScene = loadSpecificScene;
window.makeChoice = makeChoice;
window.filterTermsByTheme = filterTermsByTheme;
window.checkOlympiadTask = checkOlympiadTask;
window.showActivityExample = showActivityExample;
window.showBranchInfo = showBranchInfo;
window.showGovernmentTask = showGovernmentTask;
window.checkGovernmentTask = checkGovernmentTask;
window.closeModal = closeModal;
