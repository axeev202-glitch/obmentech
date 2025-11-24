// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Данные приложения (временное хранилище)
let appData = {
    user: null,
    listings: [],
    myListings: [],
    exchanges: []
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSampleData();
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

        // Обновляем статистику
        document.getElementById('active-listings').textContent = appData.myListings.length;
        document.getElementById('completed-exchanges').textContent = appData.exchanges.length;
    }
}

function loadSampleData() {
    // Загружаем примеры объявлений
    appData.listings = [
        {
            id: 1,
            userId: 123456,
            userName: "Анна",
            userRating: 4.8,
            phoneModel: "iPhone 13 Pro",
            condition: "excellent",
            conditionText: "Отличное",
            description: "Телефон в идеальном состоянии, все функции работают. В комплекте оригинальная коробка и кабель.",
            desiredPhone: "Samsung Galaxy S23",
            timestamp: "2 часа назад"
        },
        {
            id: 2,
            userId: 654321,
            userName: "Михаил",
            userRating: 5.0,
            phoneModel: "Samsung Galaxy S22",
            condition: "good",
            conditionText: "Хорошее",
            description: "Небольшие следы использования на корпусе. Экран без царапин.",
            desiredPhone: "iPhone 14 или Xiaomi 13",
            timestamp: "5 часов назад"
        },
        {
            id: 3,
            userId: 789012,
            userName: "Екатерина",
            userRating: 4.9,
            phoneModel: "Google Pixel 7",
            condition: "new",
            conditionText: "Новый",
            description: "Телефон новый в коробке, не распакован. Получен в подарок.",
            desiredPhone: "iPhone 15 Pro",
            timestamp: "1 день назад"
        }
    ];

    renderListings();
}

function renderListings() {
    const container = document.querySelector('.listings-container');
    
    if (appData.listings.length === 0) {
        container.innerHTML = '<p class="empty-state">Объявления не найдены</p>';
        return;
    }

    container.innerHTML = appData.listings.map(listing => `
        <div class="listing-card" onclick="openListingModal(${listing.id})">
            <div class="listing-header">
                <div class="phone-model">${listing.phoneModel}</div>
                <span class="phone-condition">${listing.conditionText}</span>
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
                <div class="timestamp">${listing.timestamp}</div>
            </div>
        </div>
    `).join('');
}

function createNewListing() {
    const form = document.getElementById('create-listing-form');
    const formData = new FormData(form);
    
    const newListing = {
        id: Date.now(),
        userId: appData.user?.id || 0,
        userName: appData.user?.firstName || 'Пользователь',
        userRating: 5.0,
        phoneModel: document.getElementById('phone-model').value,
        condition: document.getElementById('phone-condition').value,
        conditionText: document.getElementById('phone-condition').options[document.getElementById('phone-condition').selectedIndex].text,
        description: document.getElementById('phone-description').value || 'Без описания',
        desiredPhone: document.getElementById('desired-phone').value,
        timestamp: 'Только что'
    };

    appData.listings.unshift(newListing);
    appData.myListings.push(newListing);

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
    modalContent.innerHTML = `
        <h3>${listing.phoneModel}</h3>
        <div class="phone-condition">${listing.conditionText}</div>
        <p class="listing-description">${listing.description}</p>
        <div class="listing-desired">
            <strong>Хочу обменять на:</strong> ${listing.desiredPhone}
        </div>
        <div class="listing-footer">
            <div class="user-info">
                <span>👤 ${listing.userName}</span>
                <span class="rating">⭐ ${listing.userRating}</span>
            </div>
        </div>
    `;

    document.getElementById('listing-modal').style.display = 'block';
    document.getElementById('listing-modal').dataset.listingId = listingId;
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
    
    if (listing) {
        tg.openTelegramLink(`https://t.me/${listing.userName}`);
    }
    
    closeAllModals();
}

function confirmExchange() {
    const listingId = document.getElementById('exchange-modal').dataset.listingId;
    
    // Добавляем обмен в историю
    appData.exchanges.push({
        id: Date.now(),
        listingId: parseInt(listingId),
        status: 'pending',
        timestamp: new Date().toLocaleString()
    });

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
    // В реальном приложении здесь можно использовать Toast уведомления
    alert(message);
}

function editProfile() {
    showNotification('Функция редактирования профиля будет доступна в следующем обновлении');
}

function showMyListings() {
    showNotification('Раздел "Мои объявления" находится в разработке');
}

// Поиск (базовая реализация)
document.querySelector('.search-input')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm) {
        const filtered = appData.listings.filter(listing => 
            listing.phoneModel.toLowerCase().includes(searchTerm) ||
            listing.desiredPhone.toLowerCase().includes(searchTerm)
        );
        
        const container = document.querySelector('.listings-container');
        container.innerHTML = filtered.map(listing => `
            <div class="listing-card" onclick="openListingModal(${listing.id})">
                <div class="listing-header">
                    <div class="phone-model">${listing.phoneModel}</div>
                    <span class="phone-condition">${listing.conditionText}</span>
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
    } else {
        renderListings();
    }
});