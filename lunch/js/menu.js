(function () {
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
      const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
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
            iconPath = 'icons/soup.png';
            label = 'Суп';
            break;
          case 'main':
            iconPath = 'icons/main.png';
            label = 'Главное блюдо';
            break;
          case 'salad':
            iconPath = 'icons/salad.png';
            label = 'Салат';
            break;
          case 'drink':
            iconPath = 'icons/drink.png';
            label = 'Напиток';
            break;
          case 'desert':
            iconPath = 'icons/desert.png';
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

  const selected = {
    soup: null,
    main_course: null,
    beverages: null,
    starters: null,
    desserts: null,
  };

  function updateSummaryVisibility() {
    const hasAny = Object.values(selected).some(Boolean);
    const nothing = document.getElementById('nothing-selected');
    const totalBlock = document.getElementById('order-total');

    nothing.style.display = hasAny ? 'none' : 'block';

    Object.keys(selected).forEach((cat) => {
      const holder = document.querySelector(`#selectedSummary [data-cat="${cat}"]`);
      if (holder) {
        holder.style.display = hasAny ? 'block' : 'none';
      }
    });

    const total = Object.values(selected).reduce((sum, d) => sum + (d ? d.price : 0), 0);
    if (hasAny) {
      totalBlock.style.display = 'block';
      document.getElementById('orderTotalValue').textContent = String(total);
    } else {
      totalBlock.style.display = 'none';
    }
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
      const keyword = card.getAttribute('data-dish');
      const dish = DISHES.find((d) => d.keyword === keyword);
      if (!dish) return;

      selected[dish.category] = dish;
      writeSummary(dish.category, dish);
      updateSummaryVisibility();
    });
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  async function init() {
    await loadDishes();
    if (!window.DISHES || window.DISHES.length === 0) return;

    renderFilters();
    renderAllMenus();
    renderCombos();
    handleGlobalClicks();
    updateSummaryVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();