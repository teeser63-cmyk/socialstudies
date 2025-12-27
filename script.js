[file name]: script.js
[file content begin]
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
    if (mode === 'story') updateStoryProgress();
    if (mode === 'olympiad') renderOlympiadTasks();
    if (mode === 'progress') renderProgress();
    if (mode === 'schemes') initSchemes();
}

function startNewGame() {
    if (confirm("Начать новую игру? Текущий прогресс будет сброшен.")) {
        gameData.state = {
            xp: 0,
            currentScene: 1, // Начинаем с первой сцены
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
        loadScene(gameData.state.currentScene);
    }
}

function loadNextScene() {
    if (gameData.state.currentScene < gameData.scenes.length) {
        gameData.state.currentScene++;
    } else {
        // Если прошли все сцены, начинаем сначала
        gameData.state.currentScene = 1;
    }
    
    loadScene(gameData.state.currentScene);
}

function loadScene(sceneId) {
    const scene = gameData.scenes.find(s => s.id === sceneId);
    if (!scene) {
        // Если сцена не найдена, показываем первую
        gameData.state.currentScene = 1;
        loadScene(1);
        return;
    }
    
    const container = document.getElementById('game-scene');
    
    // Обновить статистику темы
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
                        <div class="text-xs ${getThemeColor(scene.theme)}-500 mt-2">Этот вопрос проверяет знания для олимпиады</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Показать кнопки выбора
    const choiceContainer = document.getElementById('choice-buttons');
    choiceContainer.classList.remove('hidden');
    choiceContainer.innerHTML = scene.choices.map((choice, index) => `
        <button onclick="makeChoice(${index})" class="option-btn bg-white p-4 border rounded-2xl text-left font-medium flex items-center gap-3 hover:border-${getThemeColor(scene.theme)}-400 hover:shadow-sm transition-all">
            <span class="w-8 h-8 rounded-lg ${getThemeColor(scene.theme)}-100 flex items-center justify-center text-sm font-bold ${getThemeColor(scene.theme)}-600">${index+1}</span>
            <div>
                <div>${choice.text}</div>
                <div class="text-xs text-slate-400 mt-1">+${choice.xp} XP</div>
            </div>
        </button>
    `).join('');
    
    // Обновить информацию о сцене
    updateSceneInfo(scene);
    
    // Обновить прогресс
    updateStoryProgress();
    saveGameState();
}

function makeChoice(choiceIndex) {
    const scene = gameData.scenes.find(s => s.id === gameData.state.currentScene);
    const choice = scene.choices[choiceIndex];
    const isCorrect = choiceIndex === scene.correctIndex;
    
    // Начислить опыт
    gameData.state.xp += choice.xp;
    gameData.state.themeProgress[scene.theme].score += choice.xp;
    
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
            <p class="text-slate-500 mb-6">Вы получили <span class="font-bold ${getThemeColor(scene.theme)}-600">+${choice.xp} XP</span></p>
            
            <div class="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div class="font-bold text-sm mb-2">Обратная связь:</div>
                <div class="text-sm text-slate-600">
                    <p class="mb-2">${isCorrect ? '✅' : '❌'} <span class="font-medium">${scene.programReq}</span> - ${isCorrect ? 'это требование программы выполнено' : 'нужно изучить эту тему лучше'}</p>
                    <p>🎯 Проверяемые знания: ${scene.programReq}</p>
                    ${isCorrect ? '' : '<p class="mt-2 text-red-600">Рекомендуем повторить эту тему</p>'}
                </div>
            </div>
            
            <button onclick="closeModal(); loadNextScene();" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                СЛЕДУЮЩАЯ СЦЕНА
            </button>
        </div>
    `);
}

function updateStoryProgress() {
    const totalScenes = gameData.scenes.length;
    const completedScenes = gameData.state.completedScenes.length;
    const progressPercent = Math.round((completedScenes / totalScenes) * 100);
    
    document.getElementById('story-progress').textContent = `${progressPercent}%`;
    document.getElementById('story-progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('scene-count').textContent = completedScenes;
    document.getElementById('xp-count').textContent = gameData.state.xp;
    
    // Обновить прогресс по темам
    const themeProgressContainer = document.getElementById('theme-progress');
    if (themeProgressContainer) {
        themeProgressContainer.innerHTML = Object.entries(gameData.state.themeProgress).map(([theme, progress]) => {
            const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            return `
                <div class="flex items-center justify-between">
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

function updateSceneInfo(scene) {
    const container = document.getElementById('scene-info');
    if (container) {
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <div class="font-bold text-sm mb-1">Тема:</div>
                    <div class="text-sm ${getThemeColor(scene.theme)}-600 font-medium">${scene.theme}</div>
                </div>
                <div>
                    <div class="font-bold text-sm mb-1">Прогресс по теме:</div>
                    <div class="text-sm text-slate-600">
                        ${gameData.state.themeProgress[scene.theme].completed}/${gameData.state.themeProgress[scene.theme].total} сцен
                    </div>
                </div>
                <div>
                    <div class="font-bold text-sm mb-1">Опыт по теме:</div>
                    <div class="text-sm text-slate-600">${gameData.state.themeProgress[scene.theme].score} XP</div>
                </div>
            </div>
        `;
    }
    
    const hintsContainer = document.getElementById('hints');
    if (hintsContainer) {
        hintsContainer.innerHTML = `
            <div class="space-y-3">
                <div class="text-sm text-slate-600">
                    <span class="font-bold">Подсказка:</span> Внимательно читайте вопрос и все варианты ответов
                </div>
                <div class="text-sm text-slate-600">
                    <span class="font-bold">Совет:</span> Выбирайте наиболее полные и точные ответы
                </div>
                <div class="text-sm text-slate-600">
                    <span class="font-bold">Важно:</span> После ответа вы получите подробную обратную связь
                </div>
            </div>
        `;
    }
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

function renderOlympiadTasks() {
    const container = document.getElementById('olympiad-container');
    
    // Рассчитать статистику
    const completedTasks = Object.keys(gameData.state.olympiadResults).length;
    const totalTasks = gameData.olympiadTasks.length;
    const correctCount = Object.values(gameData.state.olympiadResults).filter(r => r.correct).length;
    const incorrectCount = completedTasks - correctCount;
    
    // Обновить статистику
    document.getElementById('olympiad-done').textContent = `${completedTasks}/${totalTasks}`;
    document.getElementById('olympiad-progress-bar').style.width = `${(completedTasks / totalTasks) * 100}%`;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('incorrect-count').textContent = incorrectCount;
    
    // Отобразить задания
    container.innerHTML = gameData.olympiadTasks.map(task => {
        const userResult = gameData.state.olympiadResults[task.id];
        const isCompleted = !!userResult;
        
        let taskContent = '';
        
        if (task.type === 'text') {
            taskContent = `
                <div class="mb-4">
                    <textarea id="answer-${task.id}" placeholder="Введите ваш ответ здесь..." class="w-full p-3 border rounded-xl h-32 resize-none" ${isCompleted ? 'disabled' : ''}>${isCompleted ? userResult.answer : ''}</textarea>
                </div>
            `;
        } else if (task.type === 'matching') {
            taskContent = `
                <div class="mb-4">
                    <div class="text-sm text-slate-600 mb-3">Установите соответствие:</div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            ${task.matching.items.map(item => `<div class="p-2 bg-slate-50 rounded">${item}</div>`).join('')}
                        </div>
                        <div class="space-y-2">
                            ${task.matching.options.map((opt, idx) => `
                                <div class="p-2 border rounded">
                                    <label class="flex items-center">
                                        <input type="radio" name="match-${task.id}" value="${opt.charAt(0)}" class="mr-2" ${isCompleted ? 'disabled' : ''}>
                                        ${opt}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else if (task.type === 'sequence') {
            taskContent = `
                <div class="mb-4">
                    <div class="text-sm text-slate-600 mb-3">Расставьте в правильной последовательности:</div>
                    <div id="sequence-${task.id}" class="space-y-2">
                        ${task.sequence.map((item, idx) => `
                            <div class="p-3 border rounded-lg cursor-move bg-white">
                                <div class="flex items-center justify-between">
                                    <span>${item}</span>
                                    <span class="text-slate-400 text-sm">Перетащите</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            taskContent = `
                <div class="space-y-2 mb-4">
                    ${task.options.map((opt, idx) => `
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${isCompleted ? 'opacity-75' : ''}">
                            <input type="${task.type === 'multiple' ? 'checkbox' : 'radio'}" name="task-${task.id}" value="${idx}" class="mr-3" ${isCompleted ? 'disabled' : ''}>
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="bg-white rounded-2xl p-6 border shadow-sm">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-xs font-bold px-3 py-1 rounded-full ${getTaskLevelColor(task.level)}-100 ${getTaskLevelColor(task.level)}-600">${task.level === 'base' ? 'Базовый' : task.level === 'advanced' ? 'Повышенный' : 'Олимпиадный'}</span>
                            <span class="text-xs font-bold px-3 py-1 rounded-full ${getThemeColor(task.theme)}-100 ${getThemeColor(task.theme)}-600">${task.theme}</span>
                            <span class="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">${getTaskTypeName(task.type)}</span>
                            ${isCompleted ? `
                                <span class="text-xs font-bold px-3 py-1 rounded-full ${userResult.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                    ${userResult.correct ? '✓ Верно' : '✗ Ошибка'}
                                </span>
                            ` : ''}
                        </div>
                        <h4 class="font-bold text-lg">${task.question}</h4>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-slate-500">${task.olympiadYear} • ${task.taskNumber}</div>
                    </div>
                </div>
                
                ${taskContent}
                
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="text-sm text-slate-500">
                        <div class="mb-1">🎯 Проверяет: ${task.programReq}</div>
                    </div>
                    
                    <button onclick="checkOlympiadTask(${task.id})" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        ${isCompleted ? 'Посмотреть решение' : 'Проверить ответ'}
                    </button>
                </div>
                
                ${isCompleted ? `
                    <div class="mt-4 p-4 ${userResult.correct ? 'bg-green-50' : 'bg-red-50'} rounded-lg">
                        <div class="font-bold text-sm mb-2 ${userResult.correct ? 'text-green-700' : 'text-red-700'}">
                            ${userResult.correct ? '✓ Правильный ответ' : '✗ Неправильный ответ'}
                        </div>
                        <div class="text-sm ${userResult.correct ? 'text-green-600' : 'text-red-600'}">${task.explanation}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Инициализировать перетаскивание для заданий на последовательность
    gameData.olympiadTasks.filter(t => t.type === 'sequence').forEach(task => {
        initSequenceTask(task.id);
    });
    
    // Настроить фильтры
    initOlympiadFilters();
}

function getTaskTypeName(type) {
    const types = {
        'single': 'Один ответ',
        'multiple': 'Несколько ответов',
        'matching': 'Соответствие',
        'text': 'Текстовый ответ',
        'sequence': 'Последовательность'
    };
    return types[type] || type;
}

function initSequenceTask(taskId) {
    const container = document.getElementById(`sequence-${taskId}`);
    if (!container) return;
    
    // Сделать элементы перетаскиваемыми
    const items = container.children;
    Array.from(items).forEach(item => {
        item.draggable = true;
        
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.textContent);
            item.classList.add('opacity-50');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('opacity-50');
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.classList.add('bg-blue-50');
        });
        
        item.addEventListener('dragleave', () => {
            item.classList.remove('bg-blue-50');
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('bg-blue-50');
            
            const draggedContent = e.dataTransfer.getData('text/plain');
            const draggedItem = Array.from(items).find(i => i.textContent.includes(draggedContent));
            
            if (draggedItem && draggedItem !== item) {
                const temp = document.createElement('div');
                container.insertBefore(temp, item);
                container.insertBefore(item, draggedItem);
                container.insertBefore(draggedItem, temp);
                container.removeChild(temp);
            }
        });
    });
}

function checkOlympiadTask(taskId) {
    const task = gameData.olympiadTasks.find(t => t.id === taskId);
    if (!task) return;
    
    let isCorrect = false;
    let userAnswer = '';
    
    if (task.type === 'text') {
        const textarea = document.getElementById(`answer-${taskId}`);
        userAnswer = textarea.value.trim().toLowerCase();
        isCorrect = userAnswer === task.answer.toLowerCase();
    } 
    else if (task.type === 'single') {
        const selected = document.querySelector(`input[name="task-${taskId}"]:checked`);
        if (selected) {
            userAnswer = parseInt(selected.value);
            isCorrect = userAnswer === task.correct;
        }
    }
    else if (task.type === 'multiple') {
        const selected = Array.from(document.querySelectorAll(`input[name="task-${taskId}"]:checked`))
            .map(el => parseInt(el.value));
        userAnswer = selected;
        isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(task.correct.sort());
    }
    else if (task.type === 'matching') {
        // Для простоты проверяем только первые соответствия
        const selected = document.querySelector(`input[name="match-${taskId}"]:checked`);
        if (selected) {
            userAnswer = selected.value;
            // В реальном приложении нужно проверять все соответствия
            isCorrect = true; // Упрощенная проверка
        }
    }
    else if (task.type === 'sequence') {
        const container = document.getElementById(`sequence-${taskId}`);
        const currentSequence = Array.from(container.children).map(el => 
            el.textContent.replace('Перетащите', '').trim()
        );
        
        // Сравниваем с правильной последовательностью
        isCorrect = JSON.stringify(currentSequence) === JSON.stringify(task.sequence);
        userAnswer = currentSequence;
    }
    
    // Сохранить результат
    gameData.state.olympiadResults[taskId] = {
        correct: isCorrect,
        answer: userAnswer,
        timestamp: new Date().toISOString()
    };
    
    // Обновить статистику
    if (isCorrect) {
        gameData.state.correctAnswers++;
        gameData.state.xp += task.level === 'base' ? 50 : task.level === 'advanced' ? 75 : 100;
    } else {
        gameData.state.incorrectAnswers++;
    }
    
    // Показать результат
    showModal(`
        <div class="text-center">
            <div class="text-5xl mb-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}">
                ${isCorrect ? '✅' : '❌'}
            </div>
            <h4 class="text-2xl font-bold mb-2">${isCorrect ? 'Правильно!' : 'Неправильно'}</h4>
            <p class="text-slate-500 mb-6">${task.explanation}</p>
            
            <div class="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div class="font-bold text-sm mb-2">Информация о задании:</div>
                <div class="text-sm text-slate-600">
                    <p class="mb-1">🎯 Проверяет: ${task.programReq}</p>
                    <p>🏆 Уровень: ${task.level === 'base' ? 'Базовый' : task.level === 'advanced' ? 'Повышенный' : 'Олимпиадный'}</p>
                    <p class="mt-2">📅 Олимпиада: ${task.olympiadYear}, ${task.taskNumber}</p>
                </div>
            </div>
            
            <button onclick="closeModal(); renderOlympiadTasks();" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                ПРОДОЛЖИТЬ
            </button>
        </div>
    `);
    
    saveGameState();
}

function initOlympiadFilters() {
    // Фильтры по теме
    const themeFilters = document.getElementById('theme-filters');
    if (themeFilters) {
        const themes = [...new Set(gameData.olympiadTasks.map(t => t.theme))];
        themeFilters.innerHTML = themes.map(theme => `
            <label class="flex items-center">
                <input type="checkbox" class="filter-theme" value="${theme}" checked>
                <span class="ml-2">${theme}</span>
            </label>
        `).join('');
    }
    
    // Применить фильтры
    document.querySelectorAll('.filter-level, .filter-theme, .filter-type').forEach(filter => {
        filter.onchange = filterOlympiadTasks;
    });
    
    // Поиск
    document.getElementById('olympiad-search').oninput = filterOlympiadTasks;
}

function filterOlympiadTasks() {
    const searchQuery = document.getElementById('olympiad-search').value.toLowerCase();
    const selectedLevels = Array.from(document.querySelectorAll('.filter-level:checked')).map(c => c.value);
    const selectedThemes = Array.from(document.querySelectorAll('.filter-theme:checked')).map(c => c.value);
    const selectedTypes = Array.from(document.querySelectorAll('.filter-type:checked')).map(c => c.value);
    
    const filtered = gameData.olympiadTasks.filter(task => {
        const matchesSearch = task.question.toLowerCase().includes(searchQuery) ||
                            task.explanation.toLowerCase().includes(searchQuery);
        const matchesLevel = selectedLevels.includes(task.level);
        const matchesTheme = selectedThemes.includes(task.theme);
        const matchesType = selectedTypes.includes(task.type);
        
        return matchesSearch && matchesLevel && matchesTheme && matchesType;
    });
    
    const container = document.getElementById('olympiad-container');
    if (container) {
        container.innerHTML = filtered.map(task => {
            const userResult = gameData.state.olympiadResults[task.id];
            const isCompleted = !!userResult;
            
            return `
                <div class="bg-white rounded-2xl p-6 border shadow-sm">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <span class="text-xs font-bold px-3 py-1 rounded-full ${getTaskLevelColor(task.level)}-100 ${getTaskLevelColor(task.level)}-600">${task.level === 'base' ? 'Базовый' : task.level === 'advanced' ? 'Повышенный' : 'Олимпиадный'}</span>
                                <span class="text-xs font-bold px-3 py-1 rounded-full ${getThemeColor(task.theme)}-100 ${getThemeColor(task.theme)}-600">${task.theme}</span>
                                <span class="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">${getTaskTypeName(task.type)}</span>
                            </div>
                            <h4 class="font-bold text-lg">${task.question.substring(0, 100)}${task.question.length > 100 ? '...' : ''}</h4>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-slate-500">${task.olympiadYear} • ${task.taskNumber}</div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-slate-500">
                            🎯 ${task.programReq}
                        </div>
                        
                        <button onclick="checkOlympiadTask(${task.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                            ${isCompleted ? 'Посмотреть' : 'Решить'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderProgress() {
    // Общая статистика
    document.getElementById('total-xp').textContent = gameData.state.xp;
    document.getElementById('total-scenes').textContent = gameData.state.completedScenes.length;
    document.getElementById('correct-answers').textContent = gameData.state.correctAnswers;
    document.getElementById('incorrect-answers').textContent = gameData.state.incorrectAnswers;
    
    // Дерево прогресса
    const progressTree = document.getElementById('progress-tree');
    progressTree.innerHTML = gameData.themes.map(theme => {
        const progress = gameData.state.themeProgress[theme.title];
        const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
        const scorePercent = progress.total > 0 ? Math.round((progress.score / (progress.total * 25)) * 100) : 0;
        
        let recommendations = '';
        if (percent < 30) {
            recommendations = `Начать изучение темы "${theme.title}"`;
        } else if (percent < 60) {
            recommendations = `Продолжить изучение темы "${theme.title}"`;
        } else if (scorePercent < 70) {
            recommendations = `Повторить ключевые понятия темы "${theme.title}"`;
        } else if (scorePercent < 90) {
            recommendations = `Закрепить знания по теме "${theme.title}" через олимпиадные задания`;
        } else {
            recommendations = `Тема "${theme.title}" усвоена отлично`;
        }
        
        return `
            <div class="border-l-4 border-${theme.color}-border pl-4">
                <div class="flex justify-between items-center mb-2">
                    <div class="font-bold ${theme.color}-600">${theme.title} ${percent >= 80 ? '✓' : ''}</div>
                    <div class="text-sm font-bold ${theme.color}-600">${percent}%</div>
                </div>
                <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div class="h-full ${theme.color}-500 rounded-full" style="width: ${percent}%"></div>
                </div>
                <div class="text-sm text-slate-600 pl-4">
                    <div class="mb-1">└── ${recommendations}</div>
                    <div class="text-xs text-slate-500">Прогресс: ${progress.completed}/${progress.total} сцен • ${progress.score} XP</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Достижения
    const achievementsContainer = document.getElementById('achievements-container');
    achievementsContainer.innerHTML = gameData.achievements.map(ach => {
        const earned = ach.earned || 
            (ach.id === 1 && gameData.state.completedScenes.length > 0) ||
            (ach.id === 2 && gameData.glossary.filter((t, idx) => idx < 50 && gameData.state.completedScenes.length > 10).length >= 50) ||
            (ach.id === 3 && Object.keys(gameData.state.olympiadResults).length >= 10) ||
            (ach.id === 4 && gameData.state.themeProgress['Человек'].completed >= 6) ||
            (ach.id === 5 && gameData.state.themeProgress['Государство'].completed >= 6) ||
            (ach.id === 6 && gameData.state.themeProgress['Культура'].completed >= 6) ||
            (ach.id === 7 && gameData.state.themeProgress['Общение'].completed >= 6) ||
            (ach.id === 8 && gameData.state.completedScenes.length >= 30);
        
        return `
            <div class="text-center p-4 rounded-xl ${earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}">
                <div class="text-2xl mb-2 ${earned ? 'text-yellow-500' : 'text-slate-300'}">
                    <i class="${ach.icon}"></i>
                </div>
                <div class="font-bold text-sm mb-1 ${earned ? 'text-slate-800' : 'text-slate-400'}">${ach.name}</div>
                <div class="text-xs ${earned ? 'text-slate-600' : 'text-slate-400'}">${ach.description}</div>
            </div>
        `;
    }).join('');
    
    // Рекомендации
    const recommendationsContainer = document.getElementById('recommendations');
    let recommendationsHTML = '';
    
    // Найти тему с наименьшим прогрессом
    let minProgressTheme = null;
    let minProgress = 100;
    
    gameData.themes.forEach(theme => {
        const progress = gameData.state.themeProgress[theme.title];
        const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
        
        if (percent < minProgress) {
            minProgress = percent;
            minProgressTheme = theme;
        }
    });
    
    if (minProgressTheme && minProgress < 80) {
        recommendationsHTML += `
            <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <i class="fas fa-lightbulb text-blue-500 mt-1"></i>
                <div>
                    <div class="font-bold text-sm mb-1">Рекомендуем изучить:</div>
                    <div class="text-sm text-slate-600">Тему "${minProgressTheme.title}" (прогресс: ${minProgress}%)</div>
                </div>
            </div>
        `;
    }
    
    // Рекомендация по олимпиадным заданиям
    const olympiadProgress = Object.keys(gameData.state.olympiadResults).length;
    if (olympiadProgress < 10) {
        recommendationsHTML += `
            <div class="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <i class="fas fa-trophy text-green-500 mt-1"></i>
                <div>
                    <div class="font-bold text-sm mb-1">Для подготовки к олимпиаде:</div>
                    <div class="text-sm text-slate-600">Пройдите олимпиадный тренажер (выполнено ${olympiadProgress}/20)</div>
                </div>
            </div>
        `;
    }
    
    // Рекомендация по повторению
    if (gameData.state.incorrectAnswers > gameData.state.correctAnswers * 0.3) {
        recommendationsHTML += `
            <div class="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <i class="fas fa-redo text-red-500 mt-1"></i>
                <div>
                    <div class="font-bold text-sm mb-1">Рекомендуем повторить:</div>
                    <div class="text-sm text-slate-600">Темы, в которых было много ошибок (ошибок: ${gameData.state.incorrectAnswers})</div>
                </div>
            </div>
        `;
    }
    
    recommendationsContainer.innerHTML = recommendationsHTML || '<p class="text-slate-500 text-sm">Все темы изучены хорошо! Попробуйте олимпиадные задания повышенной сложности.</p>';
}

function initSchemes() {
    // Инициализация схем (уже реализовано в HTML)
}

function showActivityExample(step) {
    const examples = {
        need: "Потребность: Желание общаться с друзьями возникает из социальной потребности человека в принадлежности и признании. В игре это показано в сценах о межличностных отношениях.",
        motive: "Мотив: Потребность в социальной поддержке и эмоциональной связи мотивирует человека к общению. Этот элемент проверяется в заданиях на анализ деятельности.",
        goal: "Цель: Организовать встречу с друзьями в субботу вечером для совместного времяпрепровождения. Постановка целей изучается в теме 'Деятельность'.",
        action: "Действие: Отправить приглашения в мессенджере, согласовать время и место, подготовиться к встрече. Конкретные действия анализируются в сценах о структуре деятельности."
    };
    
    showModal(`
        <div class="text-left">
            <h4 class="text-xl font-bold mb-4">Пример из игры</h4>
            <p class="text-slate-600 mb-6">${examples[step]}</p>
            <p class="text-sm text-slate-500 mb-6">Этот элемент структуры деятельности проверяется в нескольких сценах игры</p>
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                ПОНЯТНО
            </button>
        </div>
    `);
}

function showBranchInfo(branch) {
    const info = {
        legislative: {
            title: "Законодательная власть",
            description: "Занимается созданием, изменением и отменой законов. В демократических государствах представлена парламентом.",
            functions: ["Принятие законов", "Утверждение бюджета", "Контроль за деятельностью правительства", "Представительство интересов граждан"],
            sceneRef: "Сцены 17-24 по теме 'Государство'"
        },
        executive: {
            title: "Исполнительная власть",
            description: "Осуществляет исполнение законов и управление государственными делами. Представлена правительством и министерствами.",
            functions: ["Исполнение законов", "Управление государственными делами", "Разработка и исполнение бюджета", "Обеспечение безопасности и порядка"],
            sceneRef: "Сцены 17-24 по теме 'Государство'"
        },
        judicial: {
            title: "Судебная власть",
            description: "Осуществляет правосудие, контролирует соблюдение законов, защищает права и свободы граждан.",
            functions: ["Рассмотрение судебных дел", "Контроль за законностью", "Защита прав и свобод", "Толкование законов"],
            sceneRef: "Сцены 17-24 по теме 'Государство'"
        }
    };
    
    const data = info[branch];
    
    showModal(`
        <div class="text-left">
            <h4 class="text-xl font-bold mb-4">${data.title}</h4>
            <p class="text-slate-600 mb-4">${data.description}</p>
            
            <div class="mb-4">
                <div class="font-bold text-sm mb-2">Основные функции:</div>
                <ul class="text-sm text-slate-600 space-y-1">
                    ${data.functions.map(f => `<li>• ${f}</li>`).join('')}
                </ul>
            </div>
            
            <div class="bg-slate-50 rounded-lg p-4 mb-6">
                <div class="text-sm">
                    <p>🎮 В игре: ${data.sceneRef}</p>
                </div>
            </div>
            
            <button onclick="closeModal()" class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                ПОНЯТНО
            </button>
        </div>
    `);
}

function showGovernmentTask() {
    showModal(`
        <div class="text-left">
            <h4 class="text-xl font-bold mb-4">Ситуационное задание по системе власти</h4>
            <p class="text-slate-600 mb-6">Гражданин Н. обратился в местный исполнительный комитет с жалобой на незаконную стройку во дворе его дома. Какой орган власти должен рассмотреть эту жалобу и почему?</p>
            
            <div class="space-y-3 mb-6">
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="gov-task" value="1" class="mr-3">
                    <span>Местный Совет депутатов, так как это представительный орган</span>
                </label>
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="gov-task" value="2" class="mr-3">
                    <span>Местный исполнительный комитет, так как он осуществляет контроль за соблюдением законодательства в сфере строительства</span>
                </label>
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="gov-task" value="3" class="mr-3">
                    <span>Суд, так как это спор о правах</span>
                </label>
            </div>
            
            <button onclick="checkGovernmentTask()" class="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors mb-3">
                ПРОВЕРИТЬ
            </button>
            
            <div id="gov-task-feedback" class="hidden">
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="font-bold text-green-700 mb-2">Правильно!</div>
                    <div class="text-sm text-green-600">
                        Местный исполнительный комитет осуществляет контроль за соблюдением законодательства, включая строительные нормы. 
                        Это задание проверяет понимание системы государственной власти и полномочий органов местного управления.
                    </div>
                </div>
            </div>
        </div>
    `);
}

function checkGovernmentTask() {
    const selected = document.querySelector('input[name="gov-task"]:checked');
    const feedback = document.getElementById('gov-task-feedback');
    
    if (selected && selected.value === '2') {
        feedback.classList.remove('hidden');
        feedback.querySelector('.text-green-600').textContent = 
            "Местный исполнительный комитет осуществляет контроль за соблюдением законодательства, включая строительные нормы. Это задание проверяет понимание системы государственной власти и полномочий органов местного управления. Подобные задания встречаются в олимпиадных тестах.";
    } else {
        feedback.classList.remove('hidden');
        feedback.querySelector('.bg-green-50').classList.replace('bg-green-50', 'bg-red-50');
        feedback.querySelector('.text-green-700').classList.replace('text-green-700', 'text-red-700');
        feedback.querySelector('.text-green-600').classList.replace('text-green-600', 'text-red-600');
        feedback.querySelector('.font-bold').textContent = "Неправильно!";
        feedback.querySelector('.text-sm').textContent = 
            "Правильный ответ: Местный исполнительный комитет, так как он осуществляет контроль за соблюдением законодательства в сфере строительства. Изучите полномочия органов местного управления.";
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

function showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    // Центрирование модального окна
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализировать глоссарий
    renderGlossary();
    
    // Инициализировать фильтры для олимпиадных заданий
    setTimeout(() => {
        if (document.getElementById('theme-filters')) {
            initOlympiadFilters();
        }
    }, 100);
    
    // Обновить прогресс
    updateStoryProgress();
    renderProgress();
    
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
});

// Глобальные функции для HTML
window.switchMode = switchMode;
window.startNewGame = startNewGame;
window.loadNextScene = loadNextScene;
window.makeChoice = makeChoice;
window.filterTermsByTheme = filterTermsByTheme;
window.checkOlympiadTask = checkOlympiadTask;
window.showActivityExample = showActivityExample;
window.showBranchInfo = showBranchInfo;
window.showGovernmentTask = showGovernmentTask;
window.checkGovernmentTask = checkGovernmentTask;
window.closeModal = closeModal;
[file content end]
