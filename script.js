// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Данные приложения
let appData = {
    user: null,
    listings: [],
    myListings: [],
    exchanges: []
};

// Города для локаций
const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону'];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
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
    
    loadUserListings();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    document.getElementById('create-listing-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createNewListing();
    });

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeAllModals();
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

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

        document.getElementById('active-listings').textContent = appData.myListings.length;
        document.getElementById('completed-exchanges').textContent = appData.exchanges.length;
    }
}

function loadUserListings() {
    const savedListings = localStorage.getItem('userListings');
    const savedExchanges = localStorage.getItem('userExchanges');
    
    if (savedListings) {
        appData.listings = JSON.parse(savedListings);
    }
    
    if (savedExchanges) {
        appData.exchanges = JSON.parse(savedExchanges);
    }
    
    appData.listings = appData.listings.filter(listing => listing.status !== 'inactive');
    
    if (appData.user) {
        appData.myListings = appData.listings.filter(listing => listing.userId === appData.user.id);
    }
    
    renderListings();
}

function saveListings() {
    localStorage.setItem('userListings', JSON.stringify(appData.listings));
    localStorage.setItem('userExchanges', JSON.stringify(appData.exchanges));
}

function renderListings() {
    const container = document.querySelector('.listings-container');
    const activeListings = appData.listings.filter(listing => listing.status === 'active');
    
    if (activeListings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📱 Пока нет объявлений</h3>
                <p>Будьте первым, кто создаст объявление!</p>
                <button class="btn btn-primary" onclick="switchTab('create')" style="margin-top: 15px; width: auto; display: inline-block; padding: 10px 20px;">
                    ➕ Создать первое объявление
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = activeListings.map(listing => `
        <div class="listing-card" onclick="openListingModal(${listing.id})">
            <div class="listing-content">
                <div class="listing-image ${getPhoneBrand(listing.phoneModel)}">
                    ${getPhoneEmoji(listing.phoneModel)}<br>
                    ${listing.phoneModel}
                </div>
                <div class="listing-details">
                    <div class="listing-price">Обмен на ${listing.desiredPhone}</div>
                    <div class="listing-title">${listing.phoneModel} • ${listing.conditionText}</div>
                    <div class="listing-description">${listing.description}</div>
                    <div class="listing-location">
                        📍 ${listing.location}
                    </div>
                    <div class="listing-meta">
                        <div class="user-info">
                            <span>${listing.userName}</span>
                            <span class="rating">⭐ ${listing.userRating}</span>
                        </div>
                        <div class="timestamp">${getTimeAgo(listing.timestamp)}</div>
                    </div>
                </div>
            </div>
            ${listing.userId === appData.user?.id ? '<div class="my-listing-badge">Ваше объявление</div>' : ''}
        </div>
    `).join('');
}

function getPhoneBrand(model) {
    const lowerModel = model.toLowerCase();
    if (lowerModel.includes('iphone')) return 'iphone';
    if (lowerModel.includes('samsung')) return 'samsung';
    if (lowerModel.includes('xiaomi') || lowerModel.includes('redmi') || lowerModel.includes('poco')) return 'xiaomi';
    if (lowerModel.includes('pixel')) return 'google';
    if (lowerModel.includes('huawei') || lowerModel.includes('honor')) return 'huawei';
    return 'iphone';
}

function getPhoneEmoji(model) {
    const lowerModel = model.toLowerCase();
    if (lowerModel.includes('iphone')) return '📱';
    if (lowerModel.includes('samsung')) return '📲';
    if (lowerModel.includes('xiaomi') || lowerModel.includes('redmi') || lowerModel.includes('poco')) return '⚡';
    if (lowerModel.includes('pixel')) return '🔷';
    if (lowerModel.includes('huawei') || lowerModel.includes('honor')) return '🇨🇳';
    return '📱';
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const listingTime = new Date(timestamp);
    const diffInHours = Math.floor((now - listingTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'только что';
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} д назад`;
    return listingTime.toLocaleDateString('ru-RU');
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
        description: document.getElementById('phone-description').value.trim() || 'Описание не указано',
        desiredPhone: desiredPhone,
        location: cities[Math.floor(Math.random() * cities.length)],
        status: 'active',
        timestamp: new Date().toISOString(),
        isUserCreated: true
    };

    appData.listings.unshift(newListing);
    appData.myListings.unshift(newListing);

    saveListings();
    form.reset();
    showNotification('✅ Объявление успешно опубликовано!');
    switchTab('feed');
}

function openListingModal(listingId) {
    const listing = appData.listings.find(l => l.id === listingId);
    if (!listing) return;

    const isMyListing = listing.userId === appData.user?.id;
    
    document.getElementById('modal-listing-content').innerHTML = `
        <div class="modal-header">
            <h3>${listing.phoneModel}</h3>
            <div style="color: #666; font-size: 0.9em;">${listing.conditionText}</div>
        </div>
        <div class="modal-body">
            <div style="text-align: center; margin-bottom: 20px;">
                <div class="listing-image ${getPhoneBrand(listing.phoneModel)}" style="margin: 0 auto;">
                    ${getPhoneEmoji(listing.phoneModel)}<br>
                    ${listing.phoneModel}
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Хочу обменять на:</strong>
                <div style="background: #fff3e0; padding: 10px; border-radius: 8px; margin-top: 5px;">
                    ${listing.desiredPhone}
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Описание:</strong>
                <p style="margin-top: 5px; color: #666;">${listing.description}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; color: #666; font-size: 0.9em;">
                <div>
                    <strong>📍 ${listing.location}</strong>
                </div>
                <div>
                    👤 ${listing.userName} ⭐ ${listing.userRating}
                </div>
            </div>
            
            ${isMyListing ? '<div class="my-listing-badge" style="margin-top: 15px;">Ваше объявление</div>' : ''}
        </div>
    `;

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

// Остальные функции (editListing, deleteListing, startExchange, contactSeller, confirmExchange) 
// остаются такими же как в предыдущей версии

function editListing(listingId) {
    const listing = appData.listings.find(l => l.id === listingId);
    if (listing) {
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
        const listingIndex = appData.listings.findIndex(l => l.id === listingId);
        if (listingIndex !== -1) {
            appData.listings[listingIndex].status = 'inactive';
        }
        
        appData.myListings = appData.myListings.filter(l => l.id !== listingId);
        
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
        showNotification(`💌 Напишите пользователю в Telegram для обсуждения обмена`);
    }
    
    closeAllModals();
}

function confirmExchange() {
    const listingId = document.getElementById('exchange-modal').dataset.listingId;
    
    const newExchange = {
        id: Date.now(),
        listingId: parseInt(listingId),
        status: 'pending',
        timestamp: new Date().toISOString(),
        guarantorFee: 100
    };

    appData.exchanges.push(newExchange);
    saveListings();
    
    showNotification('🔄 Обмен оформлен! С вами свяжется гарант в течение 24 часов.');
    closeAllModals();
    updateUserProfile();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showNotification(message) {
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
        font-size: 14px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Добавляем CSS анимацию
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