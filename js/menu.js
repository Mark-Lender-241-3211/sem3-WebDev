(function () {
  const CONFIG = window.FC_CONFIG || {};
  const API_KEY = ''; // всегда пустой — чтобы не отправлять X-API-Key

  const categoryLabels = {
    soup: 'Суп',
    main_course: 'Главное блюдо',
    beverages: 'Напиток',
    starters: 'Салат или стартер',
    desserts: 'Десерт',
  };

  const activeFilters = {
    soup: null,
    main_course: null,
    beverages: null,
    starters: null,
    desserts: null,
  };

  // === ЗАГРУЗКА БЛЮД С API ===
  async function loadDishes() {
    try {
      const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes', {
        headers: API_KEY ? { 'X-API-Key': API_KEY } : {}
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();

      // Маппинг категорий из API в ожидаемые фронтендом
      const categoryMap = {
        'soup': 'soup',
        'main-course': 'main_course',
        'salad': 'starters',
        'drink': 'beverages',
        'dessert': 'desserts',
      };

      const dishes = rawData.map(dish => {
        const cleanImage = dish.image.trim(); // убираем пробелы в конце
        const frontendCategory = categoryMap[dish.category] || dish.category;

        return {
          ...dish,
          category: frontendCategory,
          image: cleanImage,
        };
      });

      window.DISHES = dishes;
      return dishes;
    } catch (error) {
      console.error('Ошибка при загрузке блюд:', error);
      alert('Не удалось загрузить меню. Проверьте подключение к интернету.');
      window.DISHES = [];
      return [];
    }
  }

  function sortDishesAlphabetically(dishes) {
    return [...dishes].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function buildCard(dish) {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.setAttribute('data-dish', dish.keyword);
    item.setAttribute('data-kind', dish.kind);
    item.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}">
      <div class="menu-info">
        <p class="price">${dish.price}₽</p>
        <p class="name">${dish.name}</p>
        <p class="weight">${dish.count}</p>
        <button class="add-btn" type="button">Добавить</button>
      </div>
    `;
    return item;
  }

  function renderFilters() {
    Object.entries(FILTERS_DATA).forEach(([cat, filter]) => {
      const filterContainer = document.getElementById(filter.filterId);
      if (!filterContainer) return;

      filterContainer.innerHTML = '';
      filter.filters.forEach((f) => {
        const btn = document.createElement('button');
        btn.textContent = f.label;
        btn.dataset.kind = f.kind;
        btn.dataset.category = cat;
        btn.addEventListener('click', handleFilterClick);
        filterContainer.appendChild(btn);
      });
    });
  }

  function handleFilterClick(e) {
    const btn = e.target;
    const category = btn.dataset.category;
    const kind = btn.dataset.kind;
    const isActive = btn.classList.contains('active');

    document.querySelectorAll(`[data-category="${category}"]`).forEach((b) => {
      b.classList.remove('active');
    });

    if (isActive) {
      activeFilters[category] = null;
    } else {
      activeFilters[category] = kind;
      btn.classList.add('active');
    }

    renderCategory(category);
  }

  function renderCategory(category) {
    const filter = FILTERS_DATA[category];
    if (!filter) return;

    const grid = document.getElementById(filter.gridId);
    if (!grid) return;

    const allDishes = DISHES.filter((d) => d.category === category);
    let dishesToShow = allDishes;

    if (activeFilters[category]) {
      dishesToShow = allDishes.filter((d) => d.kind === activeFilters[category]);
    }

    grid.innerHTML = '';
    sortDishesAlphabetically(dishesToShow).forEach((dish) => {
      const card = buildCard(dish);
      // Выделяем блюдо, если оно уже выбрано
      if (selected[category] && selected[category].keyword === dish.keyword) {
        highlightSelectedDish(card, true);
      }
      grid.appendChild(card);
    });
  }

  function renderAllMenus() {
    Object.keys(FILTERS_DATA).forEach(renderCategory);
  }

  function renderCombos() {
    if (!window.COMBOS) return;
    const container = document.getElementById('combos-grid');
    if (!container) return;

    container.innerHTML = '';

    window.COMBOS.forEach((combo) => {
      const item = document.createElement('div');
      item.className = 'combo-item';
      item.setAttribute('data-combo-id', combo.id || '');

      const dishesContainer = document.createElement('div');
      dishesContainer.className = 'combo-dishes';

      combo.items.forEach((itemType) => {
        let iconPath = '';
        let label = '';

        switch (itemType) {
          case 'soup':
            iconPath = 'images/icons/soup.png';
            label = 'Суп';
            break;
          case 'main':
            iconPath = 'images/icons/main.png';
            label = 'Главное блюдо';
            break;
          case 'salad':
            iconPath = 'images/icons/salad.png';
            label = 'Салат';
            break;
          case 'drink':
            iconPath = 'images/icons/drink.png';
            label = 'Напиток';
            break;
          case 'desert':
            iconPath = 'images/icons/desert.png';
            label = 'Десерт';
            break;
          default:
            return;
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

  const LS_SELECTION = 'fc_order_selection'; // ключ для сохранения выбранных блюд

  const selected = {
    soup: null,
    main_course: null,
    beverages: null,
    starters: null,
    desserts: null,
  };

  // === РАБОТА С LOCALSTORAGE ===
  function saveSelectionToLS() {
    // Сохраняем только keyword'ы выбранных блюд
    const selection = {};
    Object.keys(selected).forEach(cat => {
      if (selected[cat]) {
        selection[cat] = selected[cat].keyword;
      }
    });
    try {
      localStorage.setItem(LS_SELECTION, JSON.stringify(selection));
    } catch (e) {
      console.error('Ошибка при сохранении в localStorage:', e);
    }
  }

  function loadSelectionFromLS() {
    try {
      const saved = localStorage.getItem(LS_SELECTION);
      if (!saved) return;
      const selection = JSON.parse(saved);
      
      // Загружаем keyword'ы и находим соответствующие блюда
      Object.keys(selection).forEach(cat => {
        if (selection[cat] && window.DISHES) {
          const dish = window.DISHES.find(d => d.keyword === selection[cat] && d.category === cat);
          if (dish) {
            selected[cat] = dish;
          }
        }
      });
    } catch (e) {
      console.error('Ошибка при загрузке из localStorage:', e);
    }
  }

  function updateSummaryVisibility() {
    const hasAny = Object.values(selected).some(Boolean);
    const nothing = document.getElementById('nothing-selected');
    const totalBlock = document.getElementById('order-total');

    if (nothing) {
      nothing.style.display = hasAny ? 'none' : 'block';
    }

    Object.keys(selected).forEach((cat) => {
      const holder = document.querySelector(`#selectedSummary [data-cat="${cat}"]`);
      if (holder) {
        holder.style.display = hasAny ? 'block' : 'none';
      }
    });

    const total = Object.values(selected).reduce((sum, d) => sum + (d ? d.price : 0), 0);
    if (totalBlock) {
      if (hasAny) {
        totalBlock.style.display = 'block';
        const totalValueEl = document.getElementById('orderTotalValue');
        if (totalValueEl) {
          totalValueEl.textContent = String(total);
        }
      } else {
        totalBlock.style.display = 'none';
      }
    }
    
    // Обновляем панель перехода к оформлению
    updateOrderPanel();
  }

  function writeSummary(cat, dish) {
    const line = document.getElementById(`summary-${cat}`);
    if (!line) return;
    if (dish) {
      line.textContent = `${dish.name} — ${dish.price}₽`;
    } else {
      const defaults = {
        soup: 'Суп не выбран',
        main_course: 'Главное блюдо не выбрано',
        beverages: 'Напиток не выбран',
        starters: 'Стартер не выбран',
        desserts: 'Десерт не выбран',
      };
      line.textContent = defaults[cat] || 'Не выбрано';
    }
  }

  function handleGlobalClicks() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.menu-item');
      if (!card) return;
      const btn = e.target.closest('.add-btn');
      if (!btn) return;
      
      const keyword = card.getAttribute('data-dish');
      const dish = DISHES.find((d) => d.keyword === keyword);
      if (!dish) return;

      // Снимаем выделение с других блюд в той же категории
      const category = dish.category;
      document.querySelectorAll(`.menu-item[data-dish]`).forEach(c => {
        const cat = DISHES.find(d => d.keyword === c.getAttribute('data-dish'))?.category;
        if (cat === category) {
          highlightSelectedDish(c, false);
        }
      });

      selected[category] = dish;
      saveSelectionToLS(); // Сохраняем в localStorage
      writeSummary(category, dish);
      updateSummaryVisibility(); // Это также обновит панель
      highlightSelectedDish(card, true); // Выделяем выбранное блюдо
    });
  }

  // Выделение выбранного блюда визуально
  function highlightSelectedDish(cardElement, isSelected) {
    if (isSelected) {
      cardElement.classList.add('selected');
    } else {
      cardElement.classList.remove('selected');
    }
  }

  // Обновление визуального выделения всех блюд при рендеринге
  function updateDishSelection() {
    if (!window.DISHES) return;
    
    Object.keys(selected).forEach(cat => {
      if (selected[cat]) {
        const card = document.querySelector(`[data-dish="${selected[cat].keyword}"]`);
        if (card) {
          highlightSelectedDish(card, true);
        }
      }
    });
  }

  // === МОДАЛЬНОЕ УВЕДОМЛЕНИЕ ===
  function showModal(message) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';

    content.innerHTML = `
      <h3 class="modal-title">${message}</h3>
      <button class="modal-btn">Окей 👌</button>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const btn = content.querySelector('.modal-btn');
    btn.addEventListener('click', () => {
      overlay.remove();
    });
  }

  // === ПРОВЕРКА ВАЛИДНОСТИ КОМБО ===
  function isValidCombo() {
    const selectedTypes = [];
    for (const cat in selected) {
      if (selected[cat]) {
        let type = '';
        switch (cat) {
          case 'soup': type = 'soup'; break;
          case 'main_course': type = 'main'; break;
          case 'starters': type = 'salad'; break;
          case 'beverages': type = 'drink'; break;
          case 'desserts': type = 'desert'; break;
        }
        selectedTypes.push(type);
      }
    }

    if (selectedTypes.length === 0) return false;

    // Проверяем соответствие хотя бы одному комбо
    return window.COMBOS.some(combo => {
      return combo.items.every(item => selectedTypes.includes(item));
    });
  }

  // === ПАНЕЛЬ ПЕРЕХОДА К ОФОРМЛЕНИЮ ===
  function updateOrderPanel() {
    const panel = document.getElementById('order-panel');
    if (!panel) return;

    const hasAny = Object.values(selected).some(Boolean);
    const total = Object.values(selected).reduce((sum, d) => sum + (d ? d.price : 0), 0);
    const isValid = isValidCombo();
    const link = panel.querySelector('#go-to-order-link');
    const totalEl = panel.querySelector('#order-panel-total');

    // Скрываем панель, если ничего не выбрано
    panel.style.display = hasAny ? 'block' : 'none';

    if (totalEl) {
      totalEl.textContent = `${total}₽`;
    }

    // Делаем ссылку активной только если комбо валидно
    if (link) {
      if (isValid) {
        link.classList.remove('disabled');
        link.href = 'order.html';
        link.onclick = null; // Убираем обработчик при валидном комбо
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

  // === ИНИЦИАЛИЗАЦИЯ ===
  async function init() {
    await loadDishes();
    if (!window.DISHES || window.DISHES.length === 0) return;

    // Загружаем сохраненные выборы из localStorage
    loadSelectionFromLS();

    renderFilters();
    renderAllMenus();
    renderCombos();
    handleGlobalClicks();
    updateSummaryVisibility(); // Это также обновит панель
    updateDishSelection(); // Выделяем сохраненные блюда
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();