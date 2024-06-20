document.addEventListener('DOMContentLoaded', function () {
    const genres = ['Экшен', 'РПГ', 'Стратегии', 'Спорт', 'Аркады', 'Гонки'];
    const genreSelect = document.getElementById('genre');
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });

    document.getElementById('addGameForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        formData.set('recommended', document.getElementById('recommended').checked ? 1 : 0);
        formData.set('discounted', document.getElementById('discounted').checked ? 1 : 0);
        formData.set('newRelease', document.getElementById('newRelease').checked ? 1 : 0);

        const response = await fetch('/api/games', {
            method: 'POST',
            body: formData
        });

        const message = await response.text();
        document.getElementById('responseMessage').textContent = message;
        loadGames();
    });

    document.getElementById('addKeyForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const gameId = document.getElementById('addKeyGameId').value;
        const gameKey = document.getElementById('gameKey').value;

        const response = await fetch(`/api/games/${gameId}/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gameKey })
        });

        const message = await response.text();
        document.getElementById('responseMessage').textContent = message;
        closeModal('addKeyModal');
        loadGames();
        loadKeyStats();
    });

    loadGames();
    loadKeyStats();
    loadSalesStats();
    setupModals();
});



async function loadGames() {
    const response = await fetch('/api/gamesadmin');
    const games = await response.json();
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = '';

    games.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-item';
        gameDiv.innerHTML = `
            <h3>${game.Title}</h3>
            <p>Цена: ${game.Price} руб.</p>
            <p>Жанр: ${game.Genre}</p>
            <button onclick="editGame(${game.GameID})">Редактировать</button>
            <button onclick="addKey(${game.GameID})">Добавить ключ</button>
            <button onclick="viewReviews(${game.GameID})">Отзывы</button>
        `;
        gamesList.appendChild(gameDiv);
    });
}

async function editGame(gameId) {
    const editgenreSelect = document.getElementById('editGenre');
    const genres = ['Экшен', 'РПГ', 'Стратегии', 'Спорт', 'Аркады', 'Гонки'];
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        editgenreSelect.appendChild(option);
    });
    const response = await fetch(`/api/game/${gameId}`);
    const game = await response.json();
    document.getElementById('editGenre').value = game.Genre;
    document.getElementById('editGameId').value = game.GameID;
    document.getElementById('editTitle').value = game.Title;
    document.getElementById('editDescription').value = game.Description;
    document.getElementById('editPrice').value = game.Price;
    document.getElementById('editRecommended').checked = game.Recommended;
    document.getElementById('editDiscounted').checked = game.Discounted;
    document.getElementById('editOldPrice').value = game.OldPrice;
    document.getElementById('editNewRelease').checked = game.NewRelease;
    document.getElementById('editGpu').value = game.GPU;
    document.getElementById('editCpu').value = game.CPU;
    document.getElementById('editStorage').value = game.Storage;
    document.getElementById('editRam').value = game.RAM;
    console.log(game);
    const currentImage = document.getElementById('currentImage');
    currentImage.src = game.ImageURL;
    currentImage.style.display = game.ImageURL ? 'block' : 'none';

    openModal('editGameModal');
}

function addKey(gameId) {
    document.getElementById('addKeyGameId').value = gameId;
    openModal('addKeyModal');
}

async function loadSalesStats() {
    const response = await fetch('/api/sales/stats');
    const stats = await response.json();
    const salesStats = document.getElementById('salesStats');
    salesStats.innerHTML = '';

    stats.forEach(stat => {
        const statDiv = document.createElement('div');
        statDiv.className = 'stat-item';
        statDiv.innerHTML = `
            <h3>${stat.Title}</h3>
            <p>Продано: ${stat.TotalQuantity} шт.</p>
            <p>Выручка: ${stat.TotalRevenue} руб.</p>
        `;
        salesStats.appendChild(statDiv);
    });
}

function setupModals() {
    const modals = document.getElementsByClassName('modal');
    const spans = document.getElementsByClassName('close');

    for (let i = 0; i < spans.length; i++) {
        spans[i].onclick = function() {
            closeModal(modals[i].id);
        };
    }

    window.onclick = function(event) {
        for (let i = 0; i < modals.length; i++) {
            if (event.target == modals[i]) {
                closeModal(modals[i].id);
            }
        }
    };
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}



async function loadKeyStats() {
    const response = await fetch('/api/keystats');
    const keyStats = await response.json();
    const keyStatsContainer = document.getElementById('keyStats');
    keyStatsContainer.innerHTML = '';

    keyStats.forEach(stat => {
        const statDiv = document.createElement('div');
        statDiv.className = 'stat-item';
        statDiv.innerHTML = `
            <h3>${stat.Title}</h3>
            <p>Количество ключей: ${stat.KeyCount}</p>
        `;
        keyStatsContainer.appendChild(statDiv);
    });
}







async function viewReviews(gameId) {
    const response = await fetch(`/api/reviews/${gameId}`);
    const reviews = await response.json();
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '';

    reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <p><strong>${review.Username}</strong> (${new Date(review.ReviewDate).toLocaleDateString()}):</p>
            <p>Рейтинг: ${review.Rating}/5</p>
            <p>${review.Comment}</p>
            <button onclick="deleteReview(${review.ReviewID}, ${gameId})">Удалить</button>
        `;
        reviewsList.appendChild(reviewDiv);
    });

    openModal('reviewsModal');
}

async function deleteReview(reviewId, gameId) {
    const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        viewReviews(gameId);
    } else {
        console.error('Error deleting review');
    }
}

document.getElementById('editGameForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.set('recommended', document.getElementById('editRecommended').checked ? 1 : 0);
    formData.set('discounted', document.getElementById('editDiscounted').checked ? 1 : 0);
    formData.set('newRelease', document.getElementById('editNewRelease').checked ? 1 : 0);

    const gameId = document.getElementById('editGameId').value;

    const response = await fetch(`/api/gamesupdate/${gameId}`, {
        method: 'PUT',
        body: formData
    });

    const message = await response.text();
    document.getElementById('responseMessage').textContent = message;
    closeModal('editGameModal');
    loadGames();
});