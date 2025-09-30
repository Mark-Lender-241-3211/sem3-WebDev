// Render dishes into the three grids; handle selection and total cost
(function () {
  const CATEGORY_TO_GRID = {
    soup: 'soupsGrid',
    main_course: 'mainsGrid',
    beverages: 'beveragesGrid',
  };

  const categoryLabels = {
    soup: 'Суп',
    main_course: 'Главное блюдо',
    beverages: 'Напиток',
  };

  function sortDishesAlphabetically(dishes) {
    return [...dishes].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function buildCard(dish) {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.setAttribute('data-dish', dish.keyword);
    item.innerHTML = `
      <img src="menu/${dish.image}.jpg" alt="${dish.name}">
      <div class="menu-info">
        <p class="price">${dish.price}₽</p>
        <p class="name">${dish.name}</p>
        <p class="weight">${dish.count}</p>
        <button class="add-btn" type="button">Добавить</button>
      </div>
    `;
    return item;
  }

  function renderMenu() {
    const byCategory = DISHES.reduce((acc, d) => {
      if (!acc[d.category]) {
        acc[d.category] = [];
      }
      acc[d.category].push(d);
      return acc;
    }, {});

    Object.keys(CATEGORY_TO_GRID).forEach((cat) => {
      const grid = document.getElementById(CATEGORY_TO_GRID[cat]);
      if (!grid) return;

      grid.innerHTML = '';

      sortDishesAlphabetically(byCategory[cat] || []).forEach((dish) => {
        const card = buildCard(dish);
        grid.appendChild(card);
      });
    });
  }

  const selected = {
    soup: null,
    main_course: null,
    beverages: null,
  };

  function updateSummaryVisibility() {
    const hasAny = Object.values(selected).some(Boolean);
    const nothing = document.getElementById('nothing-selected');
    const totalBlock = document.getElementById('order-total');

    nothing.style.display = hasAny ? 'none' : '';

    ['soup', 'main_course', 'beverages'].forEach((cat) => {
      const holder = document.querySelector(`#selectedSummary [data-cat="${cat}"]`);
      if (!holder) return;
      holder.style.display = hasAny ? '' : 'none';
    });

    const total = Object.values(selected).reduce((sum, d) => sum + (d ? d.price : 0), 0);
    if (hasAny) {
      totalBlock.style.display = '';
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
      line.textContent = cat === 'beverages' ? 'Напиток не выбран' : 'Блюдо не выбрано';
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

  function init() {
    if (!window.DISHES) return;
    renderMenu();
    handleGlobalClicks();
    updateSummaryVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


