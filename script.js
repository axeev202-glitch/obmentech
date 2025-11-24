// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Данные приложения (хранилище в памяти)
let appData = {
    user: null,
    listings: [], // Только пользовательские объявления
    myListings: [],
    exchanges: []
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    // Убрали loadSampleData() - больше не загружаем тестовые данные
});

function initializeApp() {
    // Получаем данные пользователя из Telegram
    const user = tg.initDataUnsafe?.user;
    if (user) {
        appData.user = {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username
        };
        updateUserProfile();
    }
    
    // Загружаем пользовательские объявления из localStorage (временное решение)
    loadUserListings();
}

function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Форма создания объявления
    document.getElementById('create-listing-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createNewListing();
    });

    // Модальные окна
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeAllModals();
        });
    });

    // Закрытие модальных окон по клику вне области
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

function switchTab(tabName) {
    // Обновляем активные кнопки навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Показываем активный контент
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Загружаем данные для вкладки
    if (tabName === 'feed') {
        renderListings();
    } else if (tabName === 'profile') {
        updateUserProfile();
    }
}

function updateUserProfile() {
    if (appData.user) {
        document.getElementById('user-name').textContent = 
            `${appData.user.firstName} ${appData.user.lastName || ''}`.trim();
        
        if (appData.user.username) {
            document.getElementById('user-username').textContent = `@${appData.user.username}`;
        }

        // Обновляем статистику на основе реальных данных
        document.getElementById('active-listings').textContent = appData.myListings.length;
        document.getElementById('completed-exchanges').textContent = appData.exchanges.length;
    }
}

// Загрузка объявлений из localStorage (временное решение вместо БД)
function loadUserListings() {
    const savedListings = localStorage.getItem('userListings');
    const savedExchanges = localStorage.getItem('userExchanges');
    
    if (savedListings) {
        appData.listings = JSON.parse(savedListings);
    }
    
    if (savedExchanges) {
        appData.exchanges = JSON.parse(savedExchanges);
    }
    
    // Фильтруем только активные объявления
    appData.listings = appData.listings.filter(listing => listing.status !== 'inactive');
    
    // Загружаем объявления текущего пользователя
    if (appData.user) {
        appData.myListings = appData.listings.filter(listing => listing.userId === appData.user.id);
    }
    
    renderListings();
}

// Сохранение объявлений в localStorage
function saveListings() {
    localStorage.setItem('userListings', JSON.stringify(appData.listings));
    localStorage.setItem('userExchanges', JSON.stringify(appData.exchanges));
}

function renderListings() {
    const container = document.querySelector('.listings-container');
    
    // Фильтруем только активные объявления
    const activeListings = appData.listings.filter(listing => listing.status === 'active');
    
    if (activeListings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📱 Пока нет объявлений</h3>
                <p>Будьте первым, кто создаст объявление!</p>
                <button class="btn btn-primary" onclick="switchTab('create')" style="margin-top: 15px;">
                    ➕ Создать первое объявление
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = activeListings.map(listing => `
        <div class="listing-card" onclick="openListingModal(${listing.id})">
            <div class="listing-header">
                <div class="phone-model">${listing.phoneModel}</div>
                <span class="phone-condition ${listing.condition}">${listing.conditionText}</span>
            </div>
            <div class="listing-description">${listing.description}</div>
            <div class="listing-desired">
                <strong>Хочу обменять на:</strong> ${listing.desiredPhone}
            </div>
            <div class="listing-footer">
                <div class="user-info">
                    <span>👤 ${listing.userName}</span>
                    <span class="rating">⭐ ${listing.userRating}</span>
                </div>
                <div class="timestamp">${getTimeAgo(listing.timestamp)}</div>
            </div>
            ${listing.userId === appData.user?.id ? '<div class="my-listing-badge">Ваше объявление</div>' : ''}
        </div>
    `).join('');
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const listingTime = new Date(timestamp);
    const diffInHours = Math.floor((now - listingTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Только что';
    if (diffInHours < 24) return `${diffInHours} ч. назад`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} д. назад`;
    return listingTime.toLocaleDateString();
}

function createNewListing() {
    if (!appData.user) {
        showNotification('❌ Ошибка: пользователь не определен');
        return;
    }

    const form = document.getElementById('create-listing-form');
    const phoneModel = document.getElementById('phone-model').value.trim();
    const condition = document.getElementById('phone-condition').value;
    const desiredPhone = document.getElementById('desired-phone').value.trim();
    
    // Валидация
    if (!phoneModel || !condition || !desiredPhone) {
        showNotification('❌ Заполните все обязательные поля');
        return;
    }
    
    const conditionTextMap = {
        'new': 'Новый',
        'excellent': 'Отличное',
        'good': 'Хорошее',
        'satisfactory': 'Удовлетворительное'
    };

    const newListing = {
        id: Date.now(),
        userId: appData.user.id,
        userName: appData.user.firstName + (appData.user.lastName ? ' ' + appData.user.lastName : ''),
        userRating: 5.0,
        phoneModel: phoneModel,
        condition: condition,
        conditionText: conditionTextMap[condition],
        description: document.getElementById('phone-description').value.trim() || 'Без описания',
        desiredPhone: desiredPhone,
        status: 'active',
        timestamp: new Date().toISOString(),
        isUserCreated: true // Флаг, что объявление создано пользователем
    };

    // Добавляем в общий список и список пользователя
    appData.listings.unshift(newListing);
    appData.myListings.unshift(newListing);

    // Сохраняем в localStorage
    saveListings();
    
    // Очищаем форму
    form.reset();
    
    // Показываем уведомление
    showNotification('✅ Объявление успешно опубликовано!');
    
    // Переключаемся на ленту
    switchTab('feed');
}

function openListingModal(listingId) {
    const listing = appData.listings.find(l => l.id === listingId);
    if (!listing) return;

    const modalContent = document.getElementById('modal-listing-content');
    const isMyListing = listing.userId === appData.user?.id;
    
    modalContent.innerHTML = `
        <h3>${listing.phoneModel}</h3>
        <div class="phone-condition ${listing.condition}">${listing.conditionText}</div>
        <p class="listing-description">${listing.description}</p>
        <div class="listing-desired">
            <strong>Хочу обменять на:</strong> ${listing.desiredPhone}
        </div>
        <div class="listing-footer">
            <div class="user-info">
                <span>👤 ${listing.userName}</span>
                <span class="rating">⭐ ${listing.userRating}</span>
            </div>
            <div class="timestamp">${getTimeAgo(listing.timestamp)}</div>
        </div>
        ${isMyListing ? '<div class="my-listing-badge">Ваше объявление</div>' : ''}
    `;

    // Показываем/скрываем кнопки в зависимости от того, наше ли это объявление
    const modalActions = document.querySelector('.modal-actions');
    if (isMyListing) {
        modalActions.innerHTML = `
            <button class="btn btn-secondary" onclick="editListing(${listingId})">✏️ Редактировать</button>
            <button class="btn btn-danger" onclick="deleteListing(${listingId})">🗑️ Удалить</button>
        `;
    } else {
        modalActions.innerHTML = `
            <button class="btn btn-primary" onclick="startExchange()">🔄 Начать обмен</button>
            <button class="btn btn-secondary" onclick="contactSeller()">💌 Написать продавцу</button>
        `;
    }

    document.getElementById('listing-modal').style.display = 'block';
    document.getElementById('listing-modal').dataset.listingId = listingId;
}

function editListing(listingId) {
    const listing = appData.listings.find(l => l.id === listingId);
    if (listing) {
        // Заполняем форму данными объявления
        document.getElementById('phone-model').value = listing.phoneModel;
        document.getElementById('phone-condition').value = listing.condition;
        document.getElementById('phone-description').value = listing.description;
        document.getElementById('desired-phone').value = listing.desiredPhone;
        
        closeAllModals();
        switchTab('create');
        showNotification('✏️ Редактируйте ваше объявление');
    }
}

function deleteListing(listingId) {
    if (confirm('Вы уверены, что хотите удалить это объявление?')) {
        // Помечаем объявление как неактивное
        const listingIndex = appData.listings.findIndex(l => l.id === listingId);
        if (listingIndex !== -1) {
            appData.listings[listingIndex].status = 'inactive';
        }
        
        // Удаляем из списка пользователя
        appData.myListings = appData.myListings.filter(l => l.id !== listingId);
        
        // Сохраняем изменения
        saveListings();
        
        closeAllModals();
        renderListings();
        updateUserProfile();
        showNotification('🗑️ Объявление удалено');
    }
}

function startExchange() {
    const listingId = document.getElementById('listing-modal').dataset.listingId;
    document.getElementById('listing-modal').style.display = 'none';
    document.getElementById('exchange-modal').style.display = 'block';
    document.getElementById('exchange-modal').dataset.listingId = listingId;
}

function contactSeller() {
    const listingId = document.getElementById('listing-modal').dataset.listingId;
    const listing = appData.listings.find(l => l.id === parseInt(listingId));
    
    if (listing && appData.user) {
        // В реальном приложении здесь будет ссылка на Telegram пользователя
        showNotification(`💌 Напишите пользователю @${listing.userName} в Telegram для обсуждения обмена`);
    }
    
    closeAllModals();
}

function confirmExchange() {
    const listingId = document.getElementById('exchange-modal').dataset.listingId;
    
    // Добавляем обмен в историю
    const newExchange = {
        id: Date.now(),
        listingId: parseInt(listingId),
        status: 'pending',
        timestamp: new Date().toISOString(),
        guarantorFee: 100
    };

    appData.exchanges.push(newExchange);

    // Сохраняем в localStorage
    saveListings();
    
    showNotification('🔄 Обмен оформлен! С вами свяжется гарант в течение 24 часов.');
    closeAllModals();
    
    // Обновляем статистику в профиле
    updateUserProfile();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showNotification(message) {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #0088cc;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function editProfile() {
    showNotification('Функция редактирования профиля будет доступна в следующем обновлении');
}

function showMyListings() {
    // Показываем только объявления текущего пользователя
    const container = document.querySelector('.listings-container');
    const myActiveListings = appData.myListings.filter(listing => listing.status === 'active');
    
    if (myActiveListings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📱 У вас нет объявлений</h3>
                <p>Создайте первое объявление!</p>
                <button class="btn btn-primary" onclick="switchTab('create')" style="margin-top: 15px;">
                    ➕ Создать объявление
                </button>
            </div>
        `;
    } else {
        container.innerHTML = myActiveListings.map(listing => `
            <div class="listing-card" onclick="openListingModal(${listing.id})">
                <div class="listing-header">
                    <div class="phone-model">${listing.phoneModel}</div>
                    <span class="phone-condition ${listing.condition}">${listing.conditionText}</span>
                </div>
                <div class="listing-description">${listing.description}</div>
                <div class="listing-desired">
                    <strong>Хочу обменять на:</strong> ${listing.desiredPhone}
                </div>
                <div class="listing-footer">
                    <div class="user-info">
                        <span>👤 ${listing.userName}</span>
                        <span class="rating">⭐ ${listing.userRating}</span>
                    </div>
                    <div class="timestamp">${getTimeAgo(listing.timestamp)}</div>
                </div>
                <div class="my-listing-badge">Ваше объявление</div>
            </div>
        `).join('');
    }
    
    switchTab('feed');
}

// Поиск по реальным пользовательским объявлениям
document.querySelector('.search-input')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm) {
        const filtered = appData.listings.filter(listing => 
            listing.status === 'active' && (
                listing.phoneModel.toLowerCase().includes(searchTerm) ||
                listing.desiredPhone.toLowerCase().includes(searchTerm) ||
                listing.description.toLowerCase().includes(searchTerm)
            )
        );
        
        const container = document.querySelector('.listings-container');
        
        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">По вашему запросу ничего не найдено</p>';
        } else {
            container.innerHTML = filtered.map(listing => `
                <div class="listing-card" onclick="openListingModal(${listing.id})">
                    <div class="listing-header">
                        <div class="phone-model">${listing.phoneModel}</div>
                        <span class="phone-condition ${listing.condition}">${listing.conditionText}</span>
                    </div>
                    <div class="listing-desired">
                        <strong>Хочу обменять на:</strong> ${listing.desiredPhone}
                    </div>
                    <div class="listing-footer">
                        <div class="user-info">
                            <span>👤 ${listing.userName}</span>
                            <span class="rating">⭐ ${listing.userRating}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } else {
        renderListings();
    }
});

// Добавляем CSS анимацию для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
`;
document.head.appendChild(style);