(function () {
  const API_KEY = '4a4017d0-af17-40d9-af18-96b0550c49a9';
  const LS_SELECTION = 'fc_order_selection';
  const LS_FORM = 'fc_order_form';

  const API_ROOT = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
  const CATEGORIES = ['soup', 'main', 'salad', 'drink', 'dessert'];

  let ALL_DISHES = [];
  let SELECTED_IDS = { soup: null, main: null, salad: null, drink: null, dessert: null };

  const sumMap = {
    soup: 'sum-soup',
    main: 'sum-main_course',
    salad: 'sum-starters',
    drink: 'sum-beverages',
    dessert: 'sum-desserts'
  };

  const priceMap = {
    soup: 'price-soup',
    main: 'price-main_course',
    salad: 'price-starters',
    drink: 'price-beverages',
    dessert: 'price-desserts'
  };

  async function loadDishes() {
    try {
      const res = await fetch(`${API_ROOT}/dishes`, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      ALL_DISHES = data.map(d => ({
        ...d,
        category: d.category === 'main-course' ? 'main' : d.category
      }));
    } catch (err) {
      console.error('Ошибка загрузки блюд:', err);
      ALL_DISHES = [];
    }
  }

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

  function getDishById(id) {
    return ALL_DISHES.find(d => d.id === id) || null;
  }

  function renderOrderGrid() {
    const grid = document.getElementById('orderGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const hasAny = CATEGORIES.some(cat => SELECTED_IDS[cat] !== null);

    document.getElementById('empty-order').hidden = hasAny;
    document.getElementById('order-total').hidden = !hasAny;

    if (!hasAny) return;

    CATEGORIES.forEach(cat => {
      const id = SELECTED_IDS[cat];
      if (id === null) return;
      const dish = getDishById(id);
      if (!dish) return;

      const card = document.createElement('div');
      card.className = 'menu-item';
      card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <div class="menu-info">
          <p class="price">${dish.price}₽</p>
          <p class="name">${dish.name}</p>
          <p class="weight">${dish.count}</p>
          <button type="button" class="remove-btn">Удалить</button>
        </div>
      `;

      card.querySelector('.remove-btn').addEventListener('click', () => {
        SELECTED_IDS[cat] = null;
        try {
          localStorage.setItem(LS_SELECTION, JSON.stringify(SELECTED_IDS));
        } catch {}
        renderOrderGrid();
        updateSummary();
      });

      grid.appendChild(card);
    });
  }

  function updateSummary() {
    let total = 0;
    CATEGORIES.forEach(cat => {
      const id = SELECTED_IDS[cat];
      const dish = id ? getDishById(id) : null;
      const nameEl = document.getElementById(sumMap[cat]);
      const priceEl = document.getElementById(priceMap[cat]);

      const defaults = {
        soup: 'Не выбран',
        main: 'Не выбрано',
        salad: 'Не выбран',
        drink: 'Не выбран',
        dessert: 'Не выбран'
      };

      if (dish) {
        if (nameEl) nameEl.textContent = dish.name;
        if (priceEl) priceEl.textContent = `${dish.price}₽`;
        total += dish.price;
      } else {
        if (nameEl) nameEl.textContent = defaults[cat];
        if (priceEl) priceEl.textContent = '';
      }
    });

    const totalEl = document.getElementById('summary-total');
    const orderTotal = document.getElementById('orderTotalValue');
    if (totalEl) totalEl.textContent = String(total);
    if (orderTotal) orderTotal.textContent = String(total);
  }

  // === ФОРМА ===
  function hydrateFormFromLS() {
    try {
      const raw = localStorage.getItem(LS_FORM);
      const data = JSON.parse(raw || '{}');
      const fields = ['full_name', 'email', 'phone', 'delivery_address', 'delivery_type', 'delivery_time', 'comment'];
      fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && data[id] !== undefined) el.value = data[id];
      });
      const agree = document.getElementById('agree');
      if (agree) agree.checked = !!data.agree;
    } catch (e) {
      console.error('Ошибка загрузки формы:', e);
    }
  }

  function saveFormToLS() {
    const data = {
      full_name: document.getElementById('full_name')?.value || '',
      email: document.getElementById('email')?.value || '',
      phone: document.getElementById('phone')?.value || '',
      delivery_address: document.getElementById('delivery_address')?.value || '',
      delivery_type: document.getElementById('delivery_type')?.value || '',
      delivery_time: document.getElementById('delivery_time')?.value || '',
      comment: document.getElementById('comment')?.value || '',
      agree: !!document.getElementById('agree')?.checked
    };
    try {
      localStorage.setItem(LS_FORM, JSON.stringify(data));
    } catch (e) {
      console.error('Ошибка сохранения формы:', e);
    }
  }

  function isComboValid() {
    const has = k => Boolean(SELECTED_IDS[k]);
    const any = CATEGORIES.some(cat => has(cat));
    if (!any) return { ok: false, reason: 'empty' };
    if (!has('drink')) return { ok: false, reason: 'needDrink' };
    if (has('soup') && !has('main') && !has('salad')) return { ok: false, reason: 'soupNoMainSalad' };
    if (has('salad') && !has('soup') && !has('main')) return { ok: false, reason: 'saladNoSoupMain' };
    if (!has('soup') && !has('main') && (has('drink') || has('dessert'))) return { ok: false, reason: 'needMain' };
    return { ok: true };
  }

  function comboErrorText(reason) {
    const messages = {
      empty: 'Выберите блюда для заказа',
      needDrink: 'К заказу обязательно нужно выбрать напиток',
      soupNoMainSalad: 'Выберите главное блюдо или салат',
      saladNoSoupMain: 'Выберите суп или главное блюдо',
      needMain: 'Выберите главное блюдо'
    };
    return messages[reason] || 'Проверьте состав заказа';
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

  async function submitOrder(e) {
    e.preventDefault();

    const combo = isComboValid();
    if (!combo.ok) {
      showModal(comboErrorText(combo.reason));
      return;
    }

    const fd = new FormData(e.target);
    const required = ['full_name', 'email', 'phone', 'delivery_address', 'delivery_type'];
    const empty = required.find(name => !fd.get(name)?.trim());
    if (empty || !fd.get('agree')) {
      showModal('Заполните все обязательные поля и согласитесь на обработку данных.');
      return;
    }

    // ✅ ИСПРАВЛЕНИЕ: время доставки обязательно ТОЛЬКО для "by_time"
    if (fd.get('delivery_type') === 'by_time' && !fd.get('delivery_time')) {
      showModal('Укажите время доставки.');
      return;
    }

    const payload = {
      full_name: fd.get('full_name').trim(),
      email: fd.get('email').trim(),
      phone: fd.get('phone').trim(),
      delivery_address: fd.get('delivery_address').trim(),
      delivery_type: fd.get('delivery_type'),
      delivery_time: fd.get('delivery_time') || null,
      comment: fd.get('comment')?.trim() || '',
      subscribe: 0,

      soup_id: SELECTED_IDS.soup,
      main_course_id: SELECTED_IDS.main,
      salad_id: SELECTED_IDS.salad,
      drink_id: SELECTED_IDS.drink,
      dessert_id: SELECTED_IDS.dessert
    };

    try {
      const url = `${API_ROOT}/orders?api_key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Ошибка сервера');
      }

      localStorage.removeItem(LS_SELECTION);
      localStorage.removeItem(LS_FORM);
      showModal('Заказ успешно оформлен! Спасибо 🧡');
      setTimeout(() => location.href = 'index.html', 1200);

    } catch (err) {
      console.error('Ошибка:', err);
      showModal(`Ошибка: ${err.message}`);
    }
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  async function init() {
    await loadDishes();
    loadSelectionFromLS();
    renderOrderGrid();
    updateSummary();
    hydrateFormFromLS();

    const form = document.getElementById('orderForm');
    if (form) {
      form.addEventListener('submit', submitOrder);
      form.addEventListener('input', saveFormToLS);
      form.addEventListener('change', saveFormToLS);
    }

    // Обработчик времени доставки
    const deliveryType = document.getElementById('delivery_type');
    const timeGroup = document.getElementById('delivery_time_group');
    if (deliveryType && timeGroup) {
      deliveryType.addEventListener('change', () => {
        if (deliveryType.value === 'by_time') {
          timeGroup.style.display = 'block';
        } else {
          timeGroup.style.display = 'none';
          document.getElementById('delivery_time').value = '';
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();