

async function fetchGames() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromURL = urlParams.get('category');
    const search = document.getElementById('searchBox').value;
    const sort = document.getElementById('sortOrder').value;
    const genreSelector = document.getElementById('genreFilter');
    let genre = genreSelector.value;

    // Проверяем, было ли значение жанра изменено с момента загрузки страницы
    if (!genreSelector.getAttribute('data-user-changed')) {
        // Если значение не изменялось, проверяем параметр URL
        if (categoryFromURL) {
            genre = categoryFromURL;
            genreSelector.value = categoryFromURL;
        }
    }

    const response = await fetch(`/api/games?search=${search}&sort=${sort}&genre=${genre}`);
    const games = await response.json();

    const container = document.getElementById('gamesContainer');
    container.innerHTML = '';
    
    games.forEach(game => {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-card';
    // Создаем ссылку на страницу деталей игры
    const gameLink = document.createElement('a');
    gameLink.href = `game-details.html?gameId=${game.GameID}`; // Предполагается, что у вас есть страница game-details.html
    gameLink.innerHTML = `
        <h3>${game.Title}</h3>
        <img src="${game.ImageURL}" alt="${game.Title}" style="width:100%;">
    `;
    // Подключаем клик по всему блоку к деталям игры
    gameDiv.appendChild(gameLink);
    gameDiv.innerHTML += `
        <p>Цена: ${game.Price} руб.</p>
        <button class="add-to-cart" onclick="addToCart('${game.Title}', ${game.Price}, '${game.ImageURL}', '${game.GameID}')">Добавить в корзину</button>
    `;
    container.appendChild(gameDiv);
});
}

// Функция для обработки изменения жанра пользователем


function addToCart(title, price, ImageURL, GameID) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let found = cart.find(item => item.title === title);

    if (found) {
        found.quantity++; // Увеличиваем количество, если товар уже в корзине
    } else {
        cart.push({ title, price, ImageURL, quantity: 1, GameID}); // Добавляем новый товар, если его еще нет в корзине
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // Обновляем корзину в localStorage
    showCartPopup(title); // Показываем всплывающее окно при добавлении товара
    updateCartUI();
}

function showCartPopup(title) {
    const cartIcon = document.getElementById('cart-container');
    const popup = document.createElement('div');
    popup.className = 'cart-popup';
    popup.textContent = `Добавлено в корзину: ${title}`;
    document.body.appendChild(popup);

    // Позиционирование около иконки корзины
    const cartRect = cartIcon.getBoundingClientRect();
    popup.style.top = `${cartRect.bottom + window.scrollY}px`;
    popup.style.left = `${cartRect.left + window.scrollX}px`;

    // Анимация исчезновения
    setTimeout(() => {
        popup.classList.add('fade-out'); // CSS анимация для плавного исчезновения
        setTimeout(() => document.body.removeChild(popup), 1000); // Удаление после анимации
    }, 2000); // Показываем всплывающее окно в течение 2 секунд
}



document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    fetchGameDetails(gameId);

});





function createGameCard(game, isDiscounted = false) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-card';
    gameDiv.innerHTML = `
        <img src="${game.ImageURL}" alt="${game.Title}">
        <div class="game-info">
            <h3>${game.Title}</h3>
            <p>${isDiscounted ? `<s>${game.OldPrice} ₽</s> ${game.Price} ₽` : `${game.Price} ₽`}</p>
            <button onclick="addToCart('${game.Title}', ${game.Price}, '${game.ImageURL}', '${game.GameID}')">Добавить в корзину</button>
        </div>
    `;
    return gameDiv;
}
