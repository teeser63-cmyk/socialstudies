// Основные функции игры
function switchMode(mode) {
    console.log('Переключение на режим:', mode);
    
    // Скрыть все секции
    document.querySelectorAll('.view-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показать выбранную секцию
    const targetElement = document.getElementById(`view-${mode}`);
    if (targetElement) {
        targetElement.style.display = 'block';
    }
    
    // Обновить навигацию
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('nav-active');
    });
    
    const activeNavElement = document.getElementById(`nav-${mode}`);
    if (activeNavElement) {
        activeNavElement.classList.add('nav-active');
    }
    
    // Инициализировать контент
    switch(mode) {
        case 'glossary':
            renderGlossary();
            break;
        case 'story':
            updateStoryProgress();
            break;
        case 'olympiad':
            renderOlympiadTasks();
            break;
        case 'progress':
            renderProgress();
            break;
        case 'home':
            // Главная страница уже видна
            break;
    }
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
        setTimeout(() => {
            if (gameData && gameData.scenes) {
                loadScene(gameData.state.currentScene);
            }
        }, 100);
    }
}

function loadNextScene() {
    if (!gameData || !gameData.scenes) return;
    
    let nextSceneId = gameData.state.currentScene + 1;
    if (nextSceneId > gameData.scenes.length) {
        nextSceneId = 1;
    }
    
    gameData.state.currentScene = nextSceneId;
    loadScene(nextSceneId);
}

function loadScene(sceneId) {
    console.log('Загрузка сцены:', sceneId);
    
    if (!gameData || !gameData.scenes) {
        console.error('gameData не загружен');
        return;
    }
    
    const scene = gameData.scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.error('Сцена не найдена:', sceneId);
        return;
    }
    
    const container = document.getElementById('game-scene');
    if (!container) return;
    
    const themeColor = getThemeColor(scene.theme);
    
    // Обновить прогресс темы при загрузке сцены
    if (!gameData.state.completedScenes.includes(scene.id)) {
        if (gameData.state.themeProgress[scene.theme]) {
            // Увеличиваем completed только если сцена этой темы
            gameData.state.themeProgress[scene.theme].completed++;
        }
        gameData.state.completedScenes.push(scene.id);
    }
    
    // Отображаем сцену
    container.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold px-3 py-1 rounded-full ${themeColor}-100 ${themeColor}-600">Сцена ${scene.id}/30</span>
                <span class="text-xs font-bold text-slate-500">${scene.theme}</span>
            </div>
            <h3 class="text-2xl font-bold mb-4">${scene.title}</h3>
            <p class="text-slate-600 mb-8 leading-relaxed">${scene.description}</p>
            
            <div class="bg-slate-50 rounded-xl p-5 mb-6">
                <div class="flex items-start gap-3">
                    <i class="fas fa-graduation-cap ${themeColor}-500 mt-1"></i>
                    <div>
                        <div class="font-bold text-sm mb-1">Проверяемые знания:</div>
                        <div class="text-sm text-slate-600">${scene.programReq}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-${themeColor}-50 rounded-xl p-5">
                <div class="flex items-start gap-3">
                    <i class="fas fa-trophy ${themeColor}-500 mt-1"></i>
                    <div>
                        <div class="font-bold text-sm mb-1">Связь с олимпиадой:</div>
                        <div class="text-sm text-slate-600">${scene.olympiadRef}</div>
                        <div class="text-xs ${themeColor}-500 mt-2">Этот вопрос проверяет знания для олимпиады</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Показать кнопки выбора
    const choiceContainer = document.getElementById('choice-buttons');
    if (choiceContainer) {
        choiceContainer.style.display = 'grid';
        choiceContainer.innerHTML = scene.choices.map((choice, index) => `
            <button onclick="makeChoice(${index})" class="option-btn bg-white p-4 border rounded-2xl text-left font-medium flex items-center gap-3 hover:border-${themeColor}-400 hover:shadow-sm transition-all">
                <span class="w-8 h-8 rounded-lg ${themeColor}-100 flex items-center justify-center text-sm font-bold ${themeColor}-600">${index+1}</span>
                <div>
                    <div>${choice.text}</div>
                    <div class="text-xs text-slate-400 mt-1">+${choice.xp} XP</div>
                </div>
            </button>
        `).join('');
    }
    
    // Обновить информацию о сцене
    updateSceneInfo(scene);
    
    // Обновить прогресс
    updateStoryProgress();
    saveGameState();
}

function makeChoice(choiceIndex) {
    console.log('Выбор варианта:', choiceIndex);
    
    if (!gameData || !gameData.scenes) return;
    
    const scene = gameData.scenes.find(s => s.id === gameData.state.currentScene);
    if (!scene) return;
    
    const choice = scene.choices[choiceIndex];
    const isCorrect = choiceIndex === scene.correctIndex;
    const themeColor = getThemeColor(scene.theme);
    
    // Начислить опыт
    gameData.state.xp += choice.xp;
    if (gameData.state.themeProgress[scene.theme]) {
        gameData.state.themeProgress[scene.theme].score += choice.xp;
    }
    
    // Обновить статистику ответов
    if (isCorrect) {
        gameData.state.correctAnswers++;
    } else {
        gameData.state.incorrectAnswers++;
    }
    
    // Показать результат выбора
    showModal(`
        <div class="text-center">
            <div class="text-5xl mb-4 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}">
                ${isCorrect ? '✅' : '❌'}
            </div>
            <h4 class="text-2xl font-bold mb-2">${isCorrect ? 'Правильно!' : 'Неправильно'}</h4>
            <p class="text-slate-500 mb-6">Вы получили <span class="font-bold ${themeColor}-600">+${choice.xp} XP</span></p>
            
            <div class="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div class="font-bold text-sm mb-2">Обратная связь:</div>
                <div class="text-sm text-slate-600">
                    <p class="mb-2">${isCorrect ? '✅' : '❌'} <span class="font-medium">${scene.programReq}</span> - ${isCorrect ? 'это требование программы выполнено' : 'нужно изучить эту тему лучше'}</p>
                    <p>🎯 Проверяемые знания: ${scene.programReq}</p>
                    ${isCorrect ? '' : '<p class="mt-2 text-red-600">Рекомендуем повторить эту тему</p>'}
                </div>
            </div>
            
            <button onclick="closeModal(); setTimeout(() => loadNextScene(), 100);" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                СЛЕДУЮЩАЯ СЦЕНА
            </button>
        </div>
    `);
}

function updateStoryProgress() {
    if (!gameData || !gameData.scenes) return;
    
    const totalScenes = gameData.scenes.length;
    const completedScenes = gameData.state.completedScenes.length;
    const progressPercent = Math.round((completedScenes / totalScenes) * 100);
    
    // Обновить элементы на странице
    const progressElement = document.getElementById('story-progress');
    const progressBar = document.getElementById('story-progress-bar');
    const sceneCount = document.getElementById('scene-count');
    const xpCount = document.getElementById('xp-count');
    
    if (progressElement) progressElement.textContent = `${progressPercent}%`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (sceneCount) sceneCount.textContent = completedScenes;
    if (xpCount) xpCount.textContent = gameData.state.xp;
    
    // Обновить прогресс по темам
    updateThemeProgress();
}

function updateThemeProgress() {
    // Пересчитать прогресс по темам на основе пройденных сцен
    if (!gameData || !gameData.scenes || !gameData.state) return;
    
    // Сбросить счетчики тем
    Object.keys(gameData.state.themeProgress).forEach(theme => {
        gameData.state.themeProgress[theme].completed = 0;
    });
    
    // Пересчитать на основе пройденных сцен
    gameData.state.completedScenes.forEach(sceneId => {
        const scene = gameData.scenes.find(s => s.id === sceneId);
        if (scene && gameData.state.themeProgress[scene.theme]) {
            gameData.state.themeProgress[scene.theme].completed++;
        }
    });
    
    // Обновить отображение прогресса тем
    const themeProgressContainer = document.getElementById('theme-progress');
    if (themeProgressContainer) {
        themeProgressContainer.innerHTML = Object.entries(gameData.state.themeProgress).map(([theme, progress]) => {
            const themeColor = getThemeColor(theme);
            const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            return `
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-medium ${themeColor}-600">${theme}</span>
                        <span class="text-sm font-bold">${percent}% (${progress.completed}/${progress.total})</span>
                    </div>
                    <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full ${themeColor}-500 rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function updateSceneInfo(scene) {
    const container = document.getElementById('scene-info');
    if (container) {
        const themeColor = getThemeColor(scene.theme);
        const themeProgress = gameData.state.themeProgress[scene.theme] || { completed: 0, total: 0, score: 0 };
        const percent = themeProgress.total > 0 ? Math.round((themeProgress.completed / themeProgress.total) * 100) : 0;
        
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <div class="font-bold text-sm mb-1">Тема:</div>
                    <div class="text-sm ${themeColor}-600 font-medium">${scene.theme}</div>
                </div>
                <div>
                    <div class="font-bold text-sm mb-1">Прогресс по теме:</div>
                    <div class="text-sm text-slate-600">
                        ${themeProgress.completed}/${themeProgress.total} сцен (${percent}%)
                    </div>
                    <div class="h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div class="h-full ${themeColor}-500 rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>
                <div>
                    <div class="font-bold text-sm mb-1">Опыт по теме:</div>
                    <div class="text-sm text-slate-600">${themeProgress.score} XP</div>
                </div>
            </div>
        `;
    }
}

function renderGlossary() {
    const container = document.getElementById('glossary-container');
    if (!container) return;
    
    if (!gameData || !gameData.glossary) {
        container.innerHTML = '<p class="text-slate-500">Глоссарий не загружен</p>';
        return;
    }
    
    container.innerHTML = gameData.glossary.map(item => {
        const themeColor = getThemeColor(item.c);
        return `
            <div class="term-card bg-white p-5 rounded-2xl border-l-4 border-${themeColor}-500">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-lg font-bold ${themeColor}-600">${item.t}</span>
                    <div class="flex flex-col items-end">
                        <span class="text-[10px] px-2 py-0.5 ${themeColor}-100 rounded-full font-bold ${themeColor}-600 uppercase mb-1">${item.c}</span>
                    </div>
                </div>
                <p class="text-sm text-slate-600 leading-relaxed mb-3">${item.d}</p>
                <div class="text-xs text-slate-400 flex items-center">
                    <i class="fas fa-tag mr-1"></i> ${item.c}
                </div>
            </div>
        `;
    }).join('');
}

function filterTermsByTheme(theme) {
    if (!gameData || !gameData.glossary) return;
    
    const container = document.getElementById('glossary-container');
    if (!container) return;
    
    if (theme === 'all') {
        renderGlossary();
    } else {
        const filtered = gameData.glossary.filter(i => i.c === theme);
        container.innerHTML = filtered.map(item => {
            const themeColor = getThemeColor(item.c);
            return `
                <div class="term-card bg-white p-5 rounded-2xl border-l-4 border-${themeColor}-500">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-lg font-bold ${themeColor}-600">${item.t}</span>
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] px-2 py-0.5 ${themeColor}-100 rounded-full font-bold ${themeColor}-600 uppercase mb-1">${item.c}</span>
                        </div>
                    </div>
                    <p class="text-sm text-slate-600 leading-relaxed mb-3">${item.d}</p>
                    <div class="text-xs text-slate-400 flex items-center">
                        <i class="fas fa-tag mr-1"></i> ${item.c}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Переменная для хранения отфильтрованных заданий
let filteredOlympiadTasks = [];

function renderOlympiadTasks(tasks = null) {
    const container = document.getElementById('olympiad-container');
    if (!container) {
        console.error('Контейнер для олимпиадных заданий не найден');
        return;
    }
    
    if (!gameData || !gameData.olympiadTasks) {
        container.innerHTML = '<p class="text-slate-500">Олимпиадные задания не загружены</p>';
        return;
    }
    
    // Используем переданные задачи или все задачи
    const tasksToRender = tasks || gameData.olympiadTasks;
    filteredOlympiadTasks = tasksToRender;
    
    // Инициализация фильтров тем при первом рендере
    initThemeFilters();
    
    // Рассчитать статистику
    const completedTasks = Object.keys(gameData.state.olympiadResults || {}).length;
    const totalTasks = gameData.olympiadTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Обновить статистику
    updateOlympiadStats(completedTasks, totalTasks, progressPercent);
    
    // Отобразить задания
    container.innerHTML = tasksToRender.map(task => {
        const userResult = (gameData.state.olympiadResults || {})[task.id];
        const isCompleted = !!userResult;
        const themeColor = getThemeColor(task.theme);
        const levelColor = getTaskLevelColor(task.level);
        const levelText = {
            'base': 'Базовый',
            'advanced': 'Повышенный',
            'olympiad': 'Олимпиадный'
        }[task.level] || task.level;
        
        // Определяем тип вопроса и отображаем соответствующую форму
        let questionForm = '';
        
        switch(task.type) {
            case 'multiple':
                questionForm = `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-slate-700 mb-2">Выберите несколько правильных ответов:</p>
                        ${task.options.map((opt, idx) => `
                            <div class="flex items-center p-3 border rounded-lg mb-2 hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" 
                                       name="task-${task.id}" 
                                       value="${idx}" 
                                       class="mr-3 h-4 w-4"
                                       id="task-${task.id}-${idx}">
                                <label for="task-${task.id}-${idx}" class="flex-1 cursor-pointer">${opt}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
                
            case 'matching':
                questionForm = `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-slate-700 mb-2">Установите соответствие:</p>
                        ${task.options.map((opt, idx) => `
                            <div class="flex items-center p-3 border rounded-lg mb-2">
                                <span class="w-8 h-8 rounded-lg ${themeColor}-100 flex items-center justify-center text-sm font-bold ${themeColor}-600 mr-3">${idx+1}</span>
                                <span class="flex-1">${opt}</span>
                                <select class="ml-3 p-1 border rounded" id="match-${task.id}-${idx}">
                                    <option value="">Выберите</option>
                                    <option value="A">А</option>
                                    <option value="B">Б</option>
                                    <option value="C">В</option>
                                    <option value="D">Г</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
                
            case 'sequence':
                questionForm = `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-slate-700 mb-2">Установите правильную последовательность:</p>
                        <div class="space-y-2" id="sortable-${task.id}">
                            ${task.options.map((opt, idx) => `
                                <div class="flex items-center p-3 border rounded-lg bg-white cursor-move draggable-item" data-value="${idx}">
                                    <i class="fas fa-bars text-slate-400 mr-3"></i>
                                    <span>${opt}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'text':
                questionForm = `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-slate-700 mb-2">Введите ответ:</p>
                        <textarea id="text-answer-${task.id}" 
                                  class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-${themeColor}-500 outline-none" 
                                  rows="3" 
                                  placeholder="Введите ваш ответ...">${userResult?.userAnswer || ''}</textarea>
                    </div>
                `;
                break;
                
            default: // single (по умолчанию)
                questionForm = `
                    <div class="mb-4">
                        ${task.options.map((opt, idx) => `
                            <div class="flex items-center p-3 border rounded-lg mb-2 hover:bg-slate-50 cursor-pointer">
                                <input type="radio" 
                                       name="task-${task.id}" 
                                       value="${idx}" 
                                       class="mr-3 h-4 w-4"
                                       id="task-${task.id}-${idx}"
                                       ${userResult && userResult.userAnswer && userResult.userAnswer.includes(idx) ? 'checked' : ''}>
                                <label for="task-${task.id}-${idx}" class="flex-1 cursor-pointer">${opt}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
        }
        
        return `
            <div class="bg-white rounded-2xl p-6 border shadow-sm mb-4" id="task-${task.id}">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div class="w-full">
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                            <span class="text-xs font-bold px-3 py-1 rounded-full ${levelColor}-100 ${levelColor}-600">${levelText}</span>
                            <span class="text-xs font-bold px-3 py-1 rounded-full ${themeColor}-100 ${themeColor}-600">${task.theme}</span>
                            <span class="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">${getTaskTypeText(task.type)}</span>
                            ${isCompleted ? '<span class="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-600">✓ Выполнено</span>' : ''}
                        </div>
                        <h4 class="font-bold text-lg mb-2">Задание ${task.id}: ${task.question}</h4>
                        ${task.programReq ? `<p class="text-sm text-slate-600 mb-3">🎯 ${task.programReq}</p>` : ''}
                    </div>
                </div>
                
                ${questionForm}
                
                <div class="flex justify-between items-center pt-4 border-t">
                    <div>
                        ${isCompleted ? `
                            <div class="text-sm ${userResult.isCorrect ? 'text-green-600' : 'text-red-600'}">
                                ${userResult.isCorrect ? '✅ Правильно' : '❌ Неправильно'} 
                                ${userResult.score ? `(+${userResult.score} XP)` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex gap-2">
                        ${isCompleted ? `
                            <button onclick="resetOlympiadTask(${task.id})" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors">
                                Сбросить
                            </button>
                        ` : ''}
                        
                        <button onclick="submitOlympiadTask(${task.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                            ${isCompleted ? 'Посмотреть решение' : 'Проверить ответ'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initThemeFilters() {
    const themeFiltersContainer = document.getElementById('theme-filters');
    if (!themeFiltersContainer || themeFiltersContainer.children.length > 0) return;
    
    // Получаем уникальные темы из заданий
    const themes = [...new Set(gameData.olympiadTasks.map(task => task.theme))];
    
    themeFiltersContainer.innerHTML = themes.map(theme => {
        const themeColor = getThemeColor(theme);
        return `
            <label class="flex items-center">
                <input type="checkbox" class="filter-theme" value="${theme}" checked>
                <span class="ml-2 text-sm ${themeColor}-600">${theme}</span>
            </label>
        `;
    }).join('');
}

function applyOlympiadFilters() {
    if (!gameData || !gameData.olympiadTasks) return;
    
    // Получаем активные фильтры
    const activeLevels = Array.from(document.querySelectorAll('.filter-level:checked')).map(el => el.value);
    const activeTypes = Array.from(document.querySelectorAll('.filter-type:checked')).map(el => el.value);
    const activeThemes = Array.from(document.querySelectorAll('.filter-theme:checked')).map(el => el.value);
    
    // Получаем поисковый запрос
    const searchInput = document.getElementById('olympiad-search');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Фильтрация заданий
    let filteredTasks = gameData.olympiadTasks.filter(task => {
        // Фильтр по уровню
        if (activeLevels.length > 0 && !activeLevels.includes(task.level)) {
            return false;
        }
        
        // Фильтр по типу
        if (activeTypes.length > 0 && !activeTypes.includes(task.type)) {
            return false;
        }
        
        // Фильтр по теме
        if (activeThemes.length > 0 && !activeThemes.includes(task.theme)) {
            return false;
        }
        
        // Поиск по тексту
        if (searchQuery) {
            const taskText = (task.question + ' ' + task.programReq + ' ' + task.options?.join(' ')).toLowerCase();
            if (!taskText.includes(searchQuery)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Рендерим отфильтрованные задания
    renderOlympiadTasks(filteredTasks);
}

function updateOlympiadStats(completedTasks, totalTasks, progressPercent) {
    const doneElement = document.getElementById('olympiad-done');
    const progressBar = document.getElementById('olympiad-progress-bar');
    const correctCount = document.getElementById('correct-count');
    const incorrectCount = document.getElementById('incorrect-count');
    
    if (doneElement) doneElement.textContent = `${completedTasks}/${totalTasks}`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    
    // Рассчитываем правильные и неправильные ответы из результатов
    let correct = 0;
    let incorrect = 0;
    
    if (gameData.state.olympiadResults) {
        Object.values(gameData.state.olympiadResults).forEach(result => {
            if (result.isCorrect) {
                correct++;
            } else {
                incorrect++;
            }
        });
    }
    
    if (correctCount) correctCount.textContent = correct;
    if (incorrectCount) incorrectCount.textContent = incorrect;
}

function getTaskTypeText(type) {
    const typeMap = {
        'single': 'Один ответ',
        'multiple': 'Несколько ответов',
        'matching': 'Соответствие',
        'text': 'Текстовый ответ',
        'sequence': 'Последовательность'
    };
    return typeMap[type] || type;
}

function checkOlympiadTask(taskId) {
    const task = gameData.olympiadTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Для демонстрации просто показываем модальное окно
    const correctAnswerText = task.correctAnswer ? 
        task.options.filter((opt, idx) => task.correctAnswer.includes(idx)).join(', ') : 
        'Ответ зависит от задания';
    
    showModal(`
        <div class="text-center">
            <h4 class="text-2xl font-bold mb-4">Задание ${taskId}</h4>
            <p class="text-slate-600 mb-4">${task.question}</p>
            <div class="bg-slate-50 rounded-xl p-4 mb-4 text-left">
                <div class="font-bold text-sm mb-2">Тип задания:</div>
                <div class="text-sm text-slate-600">${getTaskTypeText(task.type)}</div>
            </div>
            <div class="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
                <div class="font-bold text-sm mb-2 text-emerald-700">Правильный ответ:</div>
                <div class="text-sm text-slate-700">
                    ${correctAnswerText}
                </div>
            </div>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                ЗАКРЫТЬ
            </button>
        </div>
    `);
}

function submitOlympiadTask(taskId) {
    const task = gameData.olympiadTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // В реальном приложении здесь будет логика проверки ответов
    // Для демонстрации просто добавляем результат
    const isCorrect = Math.random() > 0.5; // Случайный результат для демонстрации
    const score = isCorrect ? 25 : 0;
    
    if (!gameData.state.olympiadResults) {
        gameData.state.olympiadResults = {};
    }
    
    gameData.state.olympiadResults[taskId] = {
        isCorrect: isCorrect,
        score: score,
        userAnswer: [0], // Для демонстрации
        timestamp: new Date().toISOString()
    };
    
    if (isCorrect) {
        gameData.state.xp += score;
    }
    
    saveGameState();
    renderOlympiadTasks(filteredOlympiadTasks);
    
    // Показываем результат
    showModal(`
        <div class="text-center">
            <div class="text-5xl mb-4 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}">
                ${isCorrect ? '✅' : '❌'}
            </div>
            <h4 class="text-2xl font-bold mb-2">${isCorrect ? 'Правильно!' : 'Неправильно'}</h4>
            <p class="text-slate-500 mb-6">${isCorrect ? `Вы получили +${score} XP` : 'Попробуйте еще раз'}</p>
            
            <div class="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div class="font-bold text-sm mb-2">Объяснение:</div>
                <div class="text-sm text-slate-600">
                    ${task.programReq ? `Это задание проверяет: ${task.programReq}` : 'Задание проверяет знание материала.'}
                </div>
            </div>
            
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                ПРОДОЛЖИТЬ
            </button>
        </div>
    `);
}

function resetOlympiadTask(taskId) {
    if (gameData.state.olympiadResults && gameData.state.olympiadResults[taskId]) {
        // Вычитаем XP, если задание было правильно выполнено
        if (gameData.state.olympiadResults[taskId].isCorrect && gameData.state.olympiadResults[taskId].score) {
            gameData.state.xp -= gameData.state.olympiadResults[taskId].score;
        }
        
        delete gameData.state.olympiadResults[taskId];
        saveGameState();
        renderOlympiadTasks(filteredOlympiadTasks);
    }
}

function renderProgress() {
    if (!gameData) return;
    
    // Обновить статистику прогресса тем
    updateThemeProgress();
    
    // Общая статистика
    updateProgressStats();
    
    // Дерево прогресса
    renderProgressTree();
    
    // Достижения
    renderAchievements();
    
    // Рекомендации
    renderRecommendations();
}

function updateProgressStats() {
    const totalXp = document.getElementById('total-xp');
    const totalScenes = document.getElementById('total-scenes');
    const correctAnswers = document.getElementById('correct-answers');
    const incorrectAnswers = document.getElementById('incorrect-answers');
    
    if (totalXp) totalXp.textContent = gameData.state.xp || 0;
    if (totalScenes) totalScenes.textContent = (gameData.state.completedScenes || []).length;
    if (correctAnswers) correctAnswers.textContent = gameData.state.correctAnswers || 0;
    if (incorrectAnswers) incorrectAnswers.textContent = gameData.state.incorrectAnswers || 0;
}

function renderProgressTree() {
    const progressTree = document.getElementById('progress-tree');
    if (!progressTree) return;
    
    if (!gameData || !gameData.themes) {
        progressTree.innerHTML = '<p class="text-slate-500">Данные о темах не загружены</p>';
        return;
    }
    
    progressTree.innerHTML = gameData.themes.map(theme => {
        const progress = gameData.state.themeProgress[theme.title] || { completed: 0, total: 0, score: 0 };
        const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
        
        return `
            <div class="border-l-4 border-${theme.color}-500 pl-4 mb-6">
                <div class="flex justify-between items-center mb-2">
                    <div class="font-bold ${theme.color}-600">${theme.title}</div>
                    <div class="text-sm font-bold ${theme.color}-600">${percent}%</div>
                </div>
                <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div class="h-full ${theme.color}-500 rounded-full" style="width: ${percent}%"></div>
                </div>
                <div class="text-sm text-slate-600 mb-2">
                    ${progress.completed}/${progress.total} сцен завершено
                </div>
                <div class="text-sm text-slate-600 mb-2">
                    ${progress.score} XP заработано
                </div>
                <div class="text-xs text-slate-500">
                    Требования программы:
                </div>
                <ul class="text-xs text-slate-600 mt-1 space-y-1">
                    ${theme.requirements.slice(0, 3).map(req => `
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                            <span>${req}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    
    if (!gameData || !gameData.achievements) {
        container.innerHTML = '<p class="text-slate-500">Достижения не загружены</p>';
        return;
    }
    
    // Обновить статус достижений
    gameData.achievements.forEach(achievement => {
        achievement.earned = checkAchievementStatus(achievement);
    });
    
    container.innerHTML = gameData.achievements.map(achievement => `
        <div class="text-center p-4 rounded-xl border ${achievement.earned ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}">
            <div class="w-12 h-12 rounded-full ${achievement.earned ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center mx-auto mb-3">
                <i class="${achievement.icon}"></i>
            </div>
            <div class="font-bold text-sm mb-1">${achievement.name}</div>
            <div class="text-xs text-slate-500">${achievement.description}</div>
            ${achievement.earned ? '<div class="text-xs text-green-600 font-bold mt-2">✓ Получено</div>' : ''}
        </div>
    `).join('');
}

function checkAchievementStatus(achievement) {
    if (!gameData) return false;
    
    switch(achievement.id) {
        case 1: // Новичок
            return gameData.state.completedScenes.length >= 1;
        case 2: // Знаток терминов
            return false; // Пока не реализовано
        case 3: // Олимпиадник
            return Object.keys(gameData.state.olympiadResults || {}).length >= 3; // Изменено на 3 для тестирования
        case 4: // Социолог
            const humanProgress = gameData.state.themeProgress['Человек'];
            return humanProgress && humanProgress.completed >= humanProgress.total;
        case 5: // Политолог
            const stateProgress = gameData.state.themeProgress['Государство'];
            return stateProgress && stateProgress.completed >= stateProgress.total;
        case 6: // Культуролог
            const cultureProgress = gameData.state.themeProgress['Культура'];
            return cultureProgress && cultureProgress.completed >= cultureProgress.total;
        case 7: // Коммуникатор
            const communicationProgress = gameData.state.themeProgress['Общение'];
            return communicationProgress && communicationProgress.completed >= communicationProgress.total;
        case 8: // Мастер игры
            return gameData.state.completedScenes.length >= gameData.scenes.length;
        default:
            return false;
    }
}

function renderRecommendations() {
    const container = document.getElementById('recommendations');
    if (!container) return;
    
    if (!gameData) {
        container.innerHTML = '<p class="text-slate-500">Начните изучение для получения рекомендаций</p>';
        return;
    }
    
    const recommendations = [];
    
    // Проверяем прогресс по темам
    const themes = Object.entries(gameData.state.themeProgress);
    themes.sort((a, b) => (a[1].completed / a[1].total) - (b[1].completed / b[1].total));
    
    if (themes.length > 0 && themes[0][1].completed < themes[0][1].total) {
        const [themeName, progress] = themes[0];
        const themeColor = getThemeColor(themeName);
        const percent = Math.round((progress.completed / progress.total) * 100);
        
        recommendations.push(`
            <div class="flex items-start gap-3 p-3 bg-${themeColor}-50 rounded-lg">
                <i class="fas fa-lightbulb ${themeColor}-500 mt-0.5"></i>
                <div>
                    <div class="font-bold text-sm ${themeColor}-600 mb-1">Рекомендация</div>
                    <div class="text-xs text-slate-600">Продолжите тему "${themeName}" (${percent}% завершено)</div>
                </div>
            </div>
        `);
    }
    
    // Если нет сцен
    if (gameData.state.completedScenes.length === 0) {
        recommendations.push(`
            <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <i class="fas fa-play-circle text-blue-500 mt-0.5"></i>
                <div>
                    <div class="font-bold text-sm text-blue-600 mb-1">Начало работы</div>
                    <div class="text-xs text-slate-600">Начните сюжетную игру для получения опыта</div>
                </div>
            </div>
        `);
    }
    
    // Если есть ошибки
    if (gameData.state.incorrectAnswers > 0) {
        recommendations.push(`
            <div class="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
                <div>
                    <div class="font-bold text-sm text-yellow-600 mb-1">Повторите материал</div>
                    <div class="text-xs text-slate-600">У вас ${gameData.state.incorrectAnswers} ошибок. Рекомендуем повторить сложные темы.</div>
                </div>
            </div>
        `);
    }
    
    // Если мало олимпиадных заданий
    const olympiadCount = Object.keys(gameData.state.olympiadResults || {}).length;
    if (olympiadCount < 5) {
        recommendations.push(`
            <div class="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <i class="fas fa-trophy text-purple-500 mt-0.5"></i>
                <div>
                    <div class="font-bold text-sm text-purple-600 mb-1">Попробуйте олимпиадные задания</div>
                    <div class="text-xs text-slate-600">Вы выполнили ${olympiadCount} заданий. Попробуйте решить больше!</div>
                </div>
            </div>
        `);
    }
    
    if (recommendations.length === 0) {
        recommendations.push('<p class="text-slate-500 text-sm">Отличная работа! Продолжайте в том же духе.</p>');
    }
    
    container.innerHTML = recommendations.join('');
}

// Модальное окно
function showModal(html) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content-inner');
    
    if (modal && modalContent) {
        modalContent.innerHTML = html;
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

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

// Функции для схем
function showActivityExample(step) {
    const stepNames = {
        'need': 'Потребность',
        'motive': 'Мотив',
        'goal': 'Цель',
        'action': 'Действие'
    };
    
    showModal(`
        <div class="text-center">
            <h4 class="text-xl font-bold mb-4">${stepNames[step] || step}</h4>
            <p class="text-slate-600 mb-6">Это элемент структуры деятельности в обществоведении</p>
            <button onclick="closeModal()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Закрыть
            </button>
        </div>
    `);
}

function showBranchInfo(branch) {
    const branchNames = {
        'legislative': 'Законодательная власть',
        'executive': 'Исполнительная власть',
        'judicial': 'Судебная власть'
    };
    
    const descriptions = {
        'legislative': 'Создает законы, представляет интересы народа (Парламент, Дума)',
        'executive': 'Исполняет законы, управляет государством (Правительство, министерства)',
        'judicial': 'Контролирует соблюдение законов, осуществляет правосудие (Суды)'
    };
    
    showModal(`
        <div class="text-center">
            <h4 class="text-xl font-bold mb-4">${branchNames[branch] || branch}</h4>
            <p class="text-slate-600 mb-6">${descriptions[branch] || 'Ветвь государственной власти'}</p>
            <button onclick="closeModal()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Закрыть
            </button>
        </div>
    `);
}

function showGovernmentTask() {
    showModal(`
        <div class="text-center">
            <h4 class="text-xl font-bold mb-4">Ситуационное задание</h4>
            <p class="text-slate-600 mb-4">Правительство предлагает новый закон о образовании. В какой ветви власти этот закон будет рассматриваться в первую очередь?</p>
            <div class="space-y-3 mb-6">
                <button onclick="checkGovernmentAnswer('legislative')" class="w-full p-3 border rounded-lg hover:bg-slate-50 text-left">
                    А) Законодательная власть
                </button>
                <button onclick="checkGovernmentAnswer('executive')" class="w-full p-3 border rounded-lg hover:bg-slate-50 text-left">
                    Б) Исполнительная власть
                </button>
                <button onclick="checkGovernmentAnswer('judicial')" class="w-full p-3 border rounded-lg hover:bg-slate-50 text-left">
                    В) Судебная власть
                </button>
            </div>
        </div>
    `);
}

function checkGovernmentAnswer(answer) {
    const isCorrect = answer === 'legislative';
    showModal(`
        <div class="text-center">
            <div class="text-5xl mb-4 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}">
                ${isCorrect ? '✅' : '❌'}
            </div>
            <h4 class="text-2xl font-bold mb-2">${isCorrect ? 'Правильно!' : 'Неправильно'}</h4>
            <p class="text-slate-600 mb-6">${isCorrect ? 'Законы создаются и рассматриваются законодательной властью (Парламентом).' : 'Правильный ответ: Законодательная власть. Именно она создает и рассматривает законы.'}</p>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                ПОНЯТНО
            </button>
        </div>
    `);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    
    // Проверить загрузку gameData
    if (typeof gameData === 'undefined') {
        console.error('gameData не загружен. Проверьте порядок подключения скриптов.');
        return;
    }
    
    // Закрытие модального окна при клике на фон
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Инициализация поиска в глоссарии
    const termSearch = document.getElementById('term-search');
    if (termSearch) {
        termSearch.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            if (!gameData || !gameData.glossary) return;
            
            const filtered = gameData.glossary.filter(i => 
                i.t.toLowerCase().includes(query) || 
                i.d.toLowerCase().includes(query) ||
                i.c.toLowerCase().includes(query)
            );
            
            const container = document.getElementById('glossary-container');
            if (container) {
                container.innerHTML = filtered.map(item => {
                    const themeColor = getThemeColor(item.c);
                    return `
                        <div class="term-card bg-white p-5 rounded-2xl border-l-4 border-${themeColor}-500">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-lg font-bold ${themeColor}-600">${item.t}</span>
                                <div class="flex flex-col items-end">
                                    <span class="text-[10px] px-2 py-0.5 ${themeColor}-100 rounded-full font-bold ${themeColor}-600 uppercase mb-1">${item.c}</span>
                                </div>
                            </div>
                            <p class="text-sm text-slate-600 leading-relaxed mb-3">${item.d}</p>
                            <div class="text-xs text-slate-400 flex items-center">
                                <i class="fas fa-tag mr-1"></i> ${item.c}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        });
    }
    
    // Инициализация фильтров олимпиады
    const filterLevels = document.querySelectorAll('.filter-level');
    const filterTypes = document.querySelectorAll('.filter-type');
    
    if (filterLevels) {
        filterLevels.forEach(filter => {
            filter.addEventListener('change', applyOlympiadFilters);
        });
    }
    
    if (filterTypes) {
        filterTypes.forEach(filter => {
            filter.addEventListener('change', applyOlympiadFilters);
        });
    }
    
    // Инициализация поиска олимпиадных заданий
    const olympiadSearch = document.getElementById('olympiad-search');
    if (olympiadSearch) {
        olympiadSearch.addEventListener('input', function(e) {
            applyOlympiadFilters();
        });
    }
    
    // Инициализация прогресса при загрузке
    setTimeout(() => {
        updateThemeProgress();
    }, 100);
});

// Сохранение и загрузка состояния
function saveGameState() {
    if (window.gameData && window.gameData.state) {
        try {
            localStorage.setItem('obshchestvovedenieGame', JSON.stringify(gameData.state));
        } catch (e) {
            console.error('Ошибка сохранения состояния:', e);
        }
    }
}

// Явная привязка функций к глобальному объекту window
window.switchMode = switchMode;
window.startNewGame = startNewGame;
window.loadNextScene = loadNextScene;
window.makeChoice = makeChoice;
window.filterTermsByTheme = filterTermsByTheme;
window.checkOlympiadTask = checkOlympiadTask;
window.submitOlympiadTask = submitOlympiadTask;
window.resetOlympiadTask = resetOlympiadTask;
window.showActivityExample = showActivityExample;
window.showBranchInfo = showBranchInfo;
window.showGovernmentTask = showGovernmentTask;
window.closeModal = closeModal;
window.checkGovernmentAnswer = checkGovernmentAnswer;
window.applyOlympiadFilters = applyOlympiadFilters;
