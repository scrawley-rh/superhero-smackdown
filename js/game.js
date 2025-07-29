document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const screens = {
        login: document.getElementById('login-screen'),
        home: document.getElementById('home-screen'),
        levelSelect: document.getElementById('level-select-screen'),
        preGame: document.getElementById('pre-game-screen'),
        game: document.getElementById('game-screen'),
        heroCollection: document.getElementById('hero-collection-screen'),
    };
    const buttons = {
        login: document.getElementById('login-btn'),
        logout: document.getElementById('logout-btn'),
        start: document.getElementById('start-game-btn'),
        heroCollection: document.getElementById('hero-collection-btn'),
        backToHomeFromLevels: document.getElementById('back-to-home-from-levels'),
        backToHomeFromCollection: document.getElementById('back-to-home-from-collection'),
        backToLevelsFromPreGame: document.getElementById('back-to-levels-from-pre-game'),
        startRound: document.getElementById('start-round-btn'),
        quitGame: document.getElementById('quit-game-btn'),
    };
    const UIElements = {
        usernameInput: document.getElementById('username-input'),
        welcomeMessage: document.getElementById('welcome-message'),
        timer: document.getElementById('timer'),
        score: document.getElementById('score'),
        progressContainer: document.getElementById('progress-container'),
        progressBar: document.getElementById('progress-bar'),
        goalText: document.getElementById('goal-text'),
        bossHealthContainer: document.getElementById('boss-health-container'),
        bossHealthBar: document.getElementById('boss-health-bar'),
        question: document.getElementById('question'),
        answerInput: document.getElementById('answer-input'),
        levelContainer: document.getElementById('level-container'),
        preGameTitle: document.getElementById('pre-game-title'),
        preGameLevelInfo: document.getElementById('pre-game-level-info'),
        preGameBossImage: document.getElementById('pre-game-boss-image'),
        countdownDisplay: document.getElementById('countdown-display'),
        collectionGrid: document.getElementById('collection-grid'),
        modal: document.getElementById('modal'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalButton: document.getElementById('modal-button'),
    };

    // --- Game Configuration ---
    const ROUND_TIME = 60; // seconds
    const NORMAL_PASS_SCORE = 15;
    const BOSS_PASS_SCORE = 20;
    const ROUNDS_PER_LEVEL = 5;

    // --- Game State ---
    let state = {
        currentScreen: 'login',
        currentUser: null,
        currentLevel: null,
        score: 0,
        timeLeft: ROUND_TIME,
        timerInterval: null,
        correctAnswer: null,
        requiredScore: NORMAL_PASS_SCORE,
        isBossFight: false,
        playerData: null,
    };
    
    function getInitialPlayerData() {
        return {
            unlockedLevels: [1],
            unlockedHeroes: [],
            levelProgress: {}
        };
    }

    // --- Data Persistence ---
    function savePlayerData() {
        if (!state.currentUser) return;
        localStorage.setItem(`superheroMathGameData_${state.currentUser}`, JSON.stringify(state.playerData));
    }

    function loadPlayerData(username) {
        const data = localStorage.getItem(`superheroMathGameData_${username}`);
        if (data) {
            state.playerData = JSON.parse(data);
        } else {
            state.playerData = getInitialPlayerData();
        }
        state.currentUser = username;
    }
    
    function login() {
        const username = UIElements.usernameInput.value.trim();
        if (username) {
            loadPlayerData(username);
            UIElements.welcomeMessage.textContent = `Welcome, ${username}!`;
            showScreen('home');
        } else {
            // Using a modal for the alert
            showModal('Input Required', 'Please enter a name!', 'OK');
        }
    }
    
    function logout() {
        savePlayerData(); // Save progress before logging out
        state.currentUser = null;
        state.playerData = null;
        UIElements.usernameInput.value = '';
        showScreen('login');
    }


    // --- Screen Navigation ---
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
        state.currentScreen = screenName;
    }

    // --- UI Updates ---
    function updateLevelSelectUI() {
        UIElements.levelContainer.innerHTML = '';
        LEVELS.forEach(level => {
            const isUnlocked = state.playerData.unlockedLevels.includes(level.id);
            const roundsPassed = state.playerData.levelProgress[level.id] || 0;
            const isComplete = roundsPassed >= ROUNDS_PER_LEVEL;

            const card = document.createElement('div');
            card.className = `level-card p-4 rounded-lg text-center bg-gray-700 ${isUnlocked ? 'unlocked' : 'locked'}`;
            if (isUnlocked) {
                card.onclick = () => prepareGame(level);
            }
            
            let progressText = '';
            if (isComplete) {
                progressText = `<p class="text-green-400 font-bold">Level Complete!</p>`;
            } else if (roundsPassed > 0) {
                const nextRound = roundsPassed + 1;
                if (nextRound === ROUNDS_PER_LEVEL) {
                    progressText = `<p class="text-red-400 font-bold">Boss Fight Next!</p>`;
                } else {
                    progressText = `<p class="text-yellow-400">${roundsPassed} / ${ROUNDS_PER_LEVEL} rounds passed</p>`;
                }
            }

            card.innerHTML = `
                <h3 class="text-2xl font-bold mb-2">${level.name}</h3>
                <p class="text-gray-400 mb-2">${level.description}</p>
                ${progressText}
                ${!isUnlocked ? '<span class="text-red-400 font-bold">Locked</span>' : ''}
            `;
            UIElements.levelContainer.appendChild(card);
        });
    }

    function updateHeroCollectionUI() {
        UIElements.collectionGrid.innerHTML = '';
        HEROES.forEach(hero => {
            const isUnlocked = state.playerData.unlockedHeroes.includes(hero.id);
            const card = document.createElement('div');
            card.className = `hero-card rounded-lg bg-gray-800 p-2 text-center ${isUnlocked ? 'unlocked' : ''}`;
            card.innerHTML = `
                <img src="${hero.imageUrl}" alt="${hero.name}" class="w-full h-auto rounded-md ${!isUnlocked ? 'filter grayscale' : ''}" onerror="this.onerror=null;this.src='https://placehold.co/200x300/cccccc/ffffff?text=Image%0ANot%0AFound';">
                <h4 class="mt-2 font-bold text-lg">${isUnlocked ? hero.name : '???'}</h4>
            `;
            UIElements.collectionGrid.appendChild(card);
        });
    }

    function showModal(title, message, buttonText, callback) {
        UIElements.modalTitle.textContent = title;
        UIElements.modalMessage.innerHTML = message;
        UIElements.modalButton.textContent = buttonText;
        UIElements.modal.style.display = 'flex';
        UIElements.modalButton.onclick = () => {
            UIElements.modal.style.display = 'none';
            if (callback) callback();
        };
    }

    // --- Game Logic ---
    function generateQuestion() {
        let num1, num2, questionText;
        const type = state.currentLevel.type;

        switch (type) {
            case 'addition':
                num1 = Math.floor(Math.random() * 21);
                num2 = Math.floor(Math.random() * (21 - num1));
                state.correctAnswer = num1 + num2;
                questionText = `${num1} + ${num2}`;
                break;
            case 'subtraction':
                num1 = Math.floor(Math.random() * 21);
                num2 = Math.floor(Math.random() * (num1 + 1));
                state.correctAnswer = num1 - num2;
                questionText = `${num1} - ${num2}`;
                break;
            case 'multiplication':
                num1 = Math.floor(Math.random() * 13);
                num2 = Math.floor(Math.random() * 13);
                state.correctAnswer = num1 * num2;
                questionText = `${num1} × ${num2}`;
                break;
            case 'division':
                num2 = Math.floor(Math.random() * 12) + 1;
                state.correctAnswer = Math.floor(Math.random() * 13);
                num1 = num2 * state.correctAnswer;
                questionText = `${num1} ÷ ${num2}`;
                break;
            case 'mixed':
                if (Math.random() > 0.5) {
                    num1 = Math.floor(Math.random() * 13);
                    num2 = Math.floor(Math.random() * 13);
                    state.correctAnswer = num1 * num2;
                    questionText = `${num1} × ${num2}`;
                } else {
                    num2 = Math.floor(Math.random() * 12) + 1;
                    state.correctAnswer = Math.floor(Math.random() * 13);
                    num1 = num2 * state.correctAnswer;
                    questionText = `${num1} ÷ ${num2}`;
                }
                break;
        }
        UIElements.question.textContent = questionText;
    }

    function checkAnswer() {
        const userAnswer = parseInt(UIElements.answerInput.value, 10);
        if (userAnswer === state.correctAnswer) {
            state.score++;
            UIElements.score.textContent = `Score: ${state.score}`;
            
            if(state.isBossFight) {
                const healthPercent = Math.max(0, ((state.requiredScore - state.score) / state.requiredScore) * 100);
                UIElements.bossHealthBar.style.width = `${healthPercent}%`;
            } else {
                const progress = Math.min(100, (state.score / state.requiredScore) * 100);
                UIElements.progressBar.style.width = `${progress}%`;
            }

            UIElements.answerInput.classList.add('correct');
            setTimeout(() => UIElements.answerInput.classList.remove('correct'), 200);
            generateQuestion();
        } else {
            UIElements.answerInput.classList.add('incorrect');
            setTimeout(() => UIElements.answerInput.classList.remove('incorrect'), 200);
        }
        UIElements.answerInput.value = '';
    }

    function prepareGame(level) {
        state.currentLevel = level;
        const roundsPassed = state.playerData.levelProgress[level.id] || 0;
        const currentRoundNumber = roundsPassed + 1;

        state.isBossFight = currentRoundNumber === ROUNDS_PER_LEVEL;

        if (state.isBossFight) {
            state.requiredScore = BOSS_PASS_SCORE;
            const boss = HEROES.find(h => h.id === level.heroId);
            UIElements.preGameTitle.textContent = "BOSS FIGHT!";
            UIElements.preGameBossImage.src = boss.imageUrl;
            UIElements.preGameBossImage.style.display = 'block';
            UIElements.preGameLevelInfo.textContent = `Defeat ${boss.name}!`;
        } else {
            state.requiredScore = NORMAL_PASS_SCORE;
            UIElements.preGameTitle.textContent = "Get Ready!";
            UIElements.preGameBossImage.style.display = 'none';
            UIElements.preGameLevelInfo.textContent = `${level.name} - Round ${currentRoundNumber}`;
        }
        
        buttons.startRound.style.display = 'block';
        buttons.backToLevelsFromPreGame.style.display = 'block';
        UIElements.countdownDisplay.style.display = 'none';
        showScreen('preGame');
    }

    function startCountdown() {
        buttons.startRound.style.display = 'none';
        buttons.backToLevelsFromPreGame.style.display = 'none';
        UIElements.countdownDisplay.style.display = 'block';

        let count = 3;
        UIElements.countdownDisplay.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                UIElements.countdownDisplay.textContent = count;
            } else {
                clearInterval(countdownInterval);
                UIElements.countdownDisplay.textContent = 'GO!';
                setTimeout(() => {
                   startRound();
                }, 500);
            }
        }, 1000);
    }

    function startRound() {
        state.score = 0;
        state.timeLeft = ROUND_TIME;

        UIElements.score.textContent = 'Score: 0';
        UIElements.timer.textContent = `Time: ${state.timeLeft}`;
        UIElements.answerInput.value = '';

        if (state.isBossFight) {
            UIElements.progressContainer.style.display = 'none';
            UIElements.bossHealthContainer.style.display = 'block';
            UIElements.bossHealthBar.style.width = '100%';
        } else {
            UIElements.progressContainer.style.display = 'block';
            UIElements.bossHealthContainer.style.display = 'none';
            UIElements.progressBar.style.width = '0%';
            UIElements.goalText.textContent = `Goal: ${state.requiredScore} Correct Answers`;
        }

        showScreen('game');
        UIElements.answerInput.focus();
        generateQuestion();

        state.timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        state.timeLeft--;
        UIElements.timer.textContent = `Time: ${state.timeLeft}`;
        if (state.timeLeft <= 0) {
            endRound();
        }
    }

    function endRound() {
        clearInterval(state.timerInterval);
        UIElements.answerInput.blur();
        
        if (state.score >= state.requiredScore) {
            const currentProgress = state.playerData.levelProgress[state.currentLevel.id] || 0;
            const newProgress = currentProgress + 1;
            state.playerData.levelProgress[state.currentLevel.id] = newProgress;

            let message;
            let title;

            if (state.isBossFight) {
                title = "VICTORY!";
                const hero = HEROES.find(h => h.id === state.currentLevel.heroId);
                message = `You defeated ${hero.name}!<br><br><span class="text-green-500 font-bold">LEVEL COMPLETE!</span><br>You unlocked ${hero.name}!`;
                 if (!state.playerData.unlockedHeroes.includes(state.currentLevel.heroId)) {
                    state.playerData.unlockedHeroes.push(state.currentLevel.heroId);
                }
                const nextLevelId = state.currentLevel.id + 1;
                if (!state.playerData.unlockedLevels.includes(nextLevelId) && nextLevelId <= LEVELS.length) {
                    state.playerData.unlockedLevels.push(nextLevelId);
                }
            } else {
                title = "Round Passed!";
                message = `You passed the round with a score of <b>${state.score}</b>!`;
                message += `<br><br>You need to pass <b>${ROUNDS_PER_LEVEL - newProgress}</b> more round(s) to complete this level.`;
            }
            
            savePlayerData();
            showModal(title, message, 'Continue', () => {
                updateLevelSelectUI();
                showScreen('levelSelect');
            });

        } else {
            const message = `You needed ${state.requiredScore} correct answers, but got ${state.score}.<br><br>Keep practicing, hero!`;
            showModal('Try Again!', message, 'Back to Levels', () => {
                showScreen('levelSelect');
            });
        }
    }

    function quitGame() {
         clearInterval(state.timerInterval);
         showModal('Game Over', 'You have quit the current round.', 'Back to Levels', () => {
            updateLevelSelectUI();
            showScreen('levelSelect');
        });
    }

    // --- Event Listeners ---
    buttons.login.addEventListener('click', login);
    UIElements.usernameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') login();
    });
    buttons.logout.addEventListener('click', logout);
    buttons.start.addEventListener('click', () => {
        updateLevelSelectUI();
        showScreen('levelSelect');
    });
    buttons.heroCollection.addEventListener('click', () => {
        updateHeroCollectionUI();
        showScreen('heroCollection');
    });
    buttons.backToHomeFromLevels.addEventListener('click', () => showScreen('home'));
    buttons.backToHomeFromCollection.addEventListener('click', () => showScreen('home'));
    buttons.backToLevelsFromPreGame.addEventListener('click', () => showScreen('levelSelect'));
    buttons.startRound.addEventListener('click', startCountdown);
    buttons.quitGame.addEventListener('click', quitGame);

    UIElements.answerInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // --- Initialization ---
    function init() {
        showScreen('login');
    }

    init();
});
