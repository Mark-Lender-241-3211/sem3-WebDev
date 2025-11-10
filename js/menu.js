(function () {
  const API_ROOT = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
  const LS_SELECTION = 'fc_order_selection'; // Единый ключ для обеих страниц

  const CATEGORIES = ['soup', 'main', 'salad', 'drink', 'dessert'];

  let ALL_DISHES = [];
  // Храним ID выбранных блюд (не keyword!)
  let SELECTED_IDS = { soup: null, main: null, salad: null, drink: null, dessert: null };

  const grids = {
    soup: document.getElementById('soupsGrid'),
    main: document.getElementById('mainsGrid'),
    salad: document.getElementById('startersGrid'),
    drink: document.getElementById('beveragesGrid'),
    dessert: document.getElementById('dessertsGrid')
  };

  // === ЗАГРУЗКА БЛЮД ===
  async function loadDishes() {
    try {
      const res = await fetch(`${API_ROOT}/dishes`);
      if (!res.ok) throw new Error('HTTP error ' + res.status);
      const data = await res.json();
      ALL_DISHES = data.map(d => ({
        ...d,
        category: d.category === 'main-course' ? 'main' :
                   d.category === 'salad' ? 'salad' :
                   d.category
      }));
    } catch (err) {
      console.error('Ошибка загрузки меню:', err);
      alert('Не удалось загрузить блюда. Проверьте соединение.');
      ALL_DISHES = [];
    }
  }

  // === РАБОТА С localStorage ===
  function loadSelectionFromLS() {
    try {
      const raw = localStorage.getItem(LS_SELECTION);
      const saved = JSON.parse(raw || '{}');
      CATEGORIES.forEach(cat => {
        SELECTED_IDS[cat] = saved[cat] || null;
      });
    } catch (e) {
      console.error('Ошибка загрузки выбора:', e);
    }
  }

  function saveSelectionToLS() {
    try {
      localStorage.setItem(LS_SELECTION, JSON.stringify(SELECTED_IDS));
    } catch (e) {
      console.error('Ошибка сохранения выбора:', e);
    }
  }

  // === ОТОБРАЖЕНИЕ ===
  function renderCategory(cat) {
    const grid = grids[cat];
    if (!grid) return;

    const dishes = ALL_DISHES.filter(d => d.category === cat);
    grid.innerHTML = '';

    dishes.forEach(dish => {
      const card = document.createElement('div');
      card.className = 'menu-item';
      card.dataset.dishId = dish.id;
      card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <div class="menu-info">
          <p class="price">${dish.price}₽</p>
          <p class="name">${dish.name}</p>
          <p class="weight">${dish.count}</p>
          <button class="add-btn" type="button">Добавить</button>
        </div>
      `;

      const isSelected = SELECTED_IDS[cat] === dish.id;
      if (isSelected) card.classList.add('selected');

      card.querySelector('.add-btn').addEventListener('click', () => {
        SELECTED_IDS[cat] = dish.id;
        saveSelectionToLS();
        updateAllCategories();
        updateOrderPanel();
      });

      grid.appendChild(card);
    });
  }

  function updateAllCategories() {
    CATEGORIES.forEach(renderCategory);
  }

  // === ВАЛИДАЦИЯ КОМБО ===
  function isComboValid() {
    const has = k => Boolean(SELECTED_IDS[k]);
    const any = CATEGORIES.some(cat => has(cat));
    if (!any) return false;
    if (!has('drink')) return false;
    if (has('soup') && !has('main') && !has('salad')) return false;
    if (has('salad') && !has('soup') && !has('main')) return false;
    if (!has('soup') && !has('main') && (has('drink') || has('dessert'))) return false;
    return true;
  }

  // === ПАНЕЛЬ ОФОРМЛЕНИЯ ===
  function updateOrderPanel() {
    const panel = document.getElementById('order-panel');
    if (!panel) return;

    const hasAny = CATEGORIES.some(cat => SELECTED_IDS[cat] !== null);
    const total = CATEGORIES.reduce((sum, cat) => {
      const id = SELECTED_IDS[cat];
      const dish = id ? ALL_DISHES.find(d => d.id === id) : null;
      return sum + (dish ? dish.price : 0);
    }, 0);

    const isValid = isComboValid();

    panel.style.display = hasAny ? 'block' : 'none';
    if (hasAny) {
      document.getElementById('order-panel-total').textContent = `${total}₽`;
    }

    const link = document.getElementById('go-to-order-link');
    if (link) {
      if (isValid) {
        link.classList.remove('disabled');
        link.href = 'order.html';
        link.onclick = null;
      } else {
        link.classList.add('disabled');
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          showModal('Выберите блюда, соответствующие одному из доступных комбо');
        };
      }
    }
  }

  function showModal(message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <h3>${message}</h3>
        <button class="modal-btn">Окей 👌</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-btn').addEventListener('click', () => overlay.remove());
  }

  // === РЕНДЕР СЕТКИ КОМБО ===
  function renderCombos() {
    const container = document.getElementById('combos-grid');
    if (!container || !window.COMBOS) return;

    container.innerHTML = '';
    window.COMBOS.forEach(combo => {
      const item = document.createElement('div');
      item.className = 'combo-item';
      item.setAttribute('data-combo-id', combo.id || '');

      const dishesContainer = document.createElement('div');
      dishesContainer.className = 'combo-dishes';

      combo.items.forEach(itemType => {
        let iconPath = '';
        let label = '';

        switch (itemType) {
          case 'soup': iconPath = 'images/icons/soup.png'; label = 'Суп'; break;
          case 'main': iconPath = 'images/icons/main.png'; label = 'Главное блюдо'; break;
          case 'salad': iconPath = 'images/icons/salad.png'; label = 'Салат'; break;
          case 'drink': iconPath = 'images/icons/drink.png'; label = 'Напиток'; break;
          case 'desert': iconPath = 'images/icons/desert.png'; label = 'Десерт'; break;
          default: return;
        }

        const dishItem = document.createElement('div');
        dishItem.className = 'dish-item';
        dishItem.innerHTML = `
          <img src="${iconPath}" alt="${label}" class="dish-icon">
          <span class="dish-label">${label}</span>
        `;
        dishesContainer.appendChild(dishItem);
      });

      item.appendChild(dishesContainer);
      container.appendChild(item);
    });
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  async function init() {
    await loadDishes();
    if (ALL_DISHES.length === 0) return;

    loadSelectionFromLS();
    CATEGORIES.forEach(renderCategory);
    updateOrderPanel();
    renderCombos(); // <-- Восстановлена сетка комбо
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();