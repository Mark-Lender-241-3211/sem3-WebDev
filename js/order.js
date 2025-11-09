(function () {
  const CONFIG = window.FC_CONFIG || {};
  const STUDENT_ID = typeof CONFIG.studentId === 'string' ? CONFIG.studentId.trim() : '';
  const API_KEY = typeof CONFIG.apiKey === 'string' ? CONFIG.apiKey.trim() : '';

  const LS_SELECTION = 'fc_order_selection';
  const LS_FORM = 'fc_order_form';

  const CAT2TYPE = {
    soup: 'soup',
    main_course: 'main',
    starters: 'salad',
    beverages: 'drink',
    desserts: 'desert'
  };

  // Загрузка блюд с сервера
  async function loadDishesForOrder() {
    if (Array.isArray(window.DISHES) && window.DISHES.length > 0) return;

    try {
      const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes', {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();

      const categoryMap = {
        'soup': 'soup',
        'main-course': 'main_course',
        'salad': 'starters',
        'drink': 'beverages',
        'dessert': 'desserts',
      };

      window.DISHES = rawData.map(dish => ({
        ...dish,
        category: categoryMap[dish.category] || dish.category,
        image: dish.image.trim(),
      }));
    } catch (e) {
      console.error('Не удалось загрузить меню на странице заказа:', e);
      window.DISHES = [];
    }
  }

  // LocalStorage helpers
  const readSel = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_SELECTION) || '{}');
    } catch {
      return {};
    }
  };
  const writeSel = (v) => {
    try {
      localStorage.setItem(LS_SELECTION, JSON.stringify(v));
    } catch {}
  };

  const readForm = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_FORM) || '{}');
    } catch {
      return {};
    }
  };
  const writeForm = (v) => {
    try {
      localStorage.setItem(LS_FORM, JSON.stringify(v));
    } catch {}
  };
  const clearForm = () => {
    try {
      localStorage.removeItem(LS_FORM);
    } catch {}
  };

  // Поиск блюда по keyword
  const getDishByKeyword = (kw) => (window.DISHES || []).find(d => d.keyword === kw) || null;

  // Карточки заказа
  function createCard(dish) {
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.dataset.cat = dish.category;
    el.dataset.dish = dish.keyword;
    el.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}">
      <div class="menu-info">
        <p class="price">${dish.price}₽</p>
        <p class="name">${dish.name}</p>
        <p class="weight">${dish.count}</p>
        <button type="button" class="remove-btn">Удалить</button>
      </div>
    `;
    return el;
  }

  function renderGrid() {
    const grid = document.getElementById('orderGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const sel = readSel();
    const dishes = Object.values(sel).filter(Boolean).map(getDishByKeyword).filter(Boolean);
    dishes.forEach(d => grid.appendChild(createCard(d)));
  }

  function updateCardsSummary() {
    const grid = document.getElementById('orderGrid');
    if (!grid) return;

    const items = grid.querySelectorAll('.menu-item');
    const total = Array.from(items).reduce((sum, card) => {
      const p = card.querySelector('.price');
      const val = p ? parseInt(p.textContent) : 0;
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);

    const hasAny = items.length > 0;
    const emptyNote = document.getElementById('empty-order');
    const totalBlock = document.getElementById('order-total');
    const totalValue = document.getElementById('orderTotalValue');

    if (emptyNote) emptyNote.hidden = hasAny;
    if (totalBlock) totalBlock.hidden = !hasAny;
    if (totalValue) totalValue.textContent = String(total);

    updateLeftFormSummary();
  }

  function bindDelete() {
    const grid = document.getElementById('orderGrid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-btn');
      if (!btn) return;
      const card = btn.closest('.menu-item');
      const kw = card?.dataset?.dish;
      if (!kw) return;

      const sel = readSel();
      const cat = Object.keys(sel).find(c => sel[c] === kw);
      if (cat) sel[cat] = null;
      writeSel(sel);

      card.remove();
      updateCardsSummary();
    });
  }

  // Левая сводка формы
  function updateLeftFormSummary() {
    const sel = readSel();
    let total = 0;

    function fill(cat, empty) {
      const kw = sel[cat];
      const nameEl = document.getElementById(`sum-${cat}`);
      const priceEl = document.getElementById(`price-${cat}`);
      if (!kw) {
        if (nameEl) nameEl.textContent = empty;
        if (priceEl) priceEl.textContent = '';
        return;
      }
      const dish = getDishByKeyword(kw);
      if (!dish) return;
      if (nameEl) nameEl.textContent = dish.name;
      if (priceEl) priceEl.textContent = `${dish.price}₽`;
      total += dish.price || 0;
    }

    fill('soup', 'Не выбран');
    fill('main_course', 'Не выбрано');
    fill('starters', 'Не выбран');
    fill('beverages', 'Не выбран');
    fill('desserts', 'Не выбран');

    const totalEl = document.getElementById('summary-total');
    if (totalEl) totalEl.textContent = String(total);
  }

  // Модалка
  function showModal(message) {
    const prev = document.querySelector('.modal-overlay');
    if (prev) prev.remove();

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
    content.querySelector('.modal-btn').addEventListener('click', () => overlay.remove());
  }

  // Проверка комбо
  function selectedTypes() {
    const sel = readSel();
    return Object.entries(sel)
      .filter(([, kw]) => !!kw)
      .map(([cat]) => CAT2TYPE[cat]);
  }

  function isValidComboAndMessage() {
    const types = selectedTypes();
    const isValid = (window.COMBOS || []).some(combo =>
      combo.items.every(item => types.includes(item))
    );
    if (isValid) return { valid: true, message: '' };

    const sel = readSel();
    const hasSoup = !!sel.soup;
    const hasMain = !!sel.main_course;
    const hasSalad = !!sel.starters;
    const hasDrink = !!sel.beverages;

    let message = '';
    if ((hasSoup || hasMain || hasSalad) && !hasDrink) {
      message = 'Выберите напиток';
    } else if (hasSoup && !(hasMain || hasSalad)) {
      message = 'Выберите главное блюдо или салат';
    } else if (hasSalad && !(hasSoup || hasMain)) {
      message = 'Выберите суп или главное блюдо';
    } else if (hasMain && !(hasSoup || hasSalad)) {
      message = 'Выберите салат или суп';
    } else {
      message = 'Выберите блюда, соответствующие одному из комбо';
    }
    return { valid: false, message };
  }

  // Работа с формой
  function hydrateFormFromLS() {
    const data = readForm();
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };
    set('name', data.name || '');
    set('phone', data.phone || '');
    set('address', data.address || '');
    set('time', data.time || '');
    set('comment', data.comment || '');
    const agree = document.getElementById('agree');
    if (agree) agree.checked = !!data.agree;

    const comment = document.getElementById('comment');
    const counter = document.getElementById('commentCounter');
    if (comment && counter) counter.textContent = `${Math.min(comment.value.length, 200)}/200`;
  }

  function bindFormPersistence() {
    const form = document.getElementById('orderForm');
    if (!form) return;

    const toObj = () => ({
      name: document.getElementById('name')?.value || '',
      phone: document.getElementById('phone')?.value || '',
      address: document.getElementById('address')?.value || '',
      time: document.getElementById('time')?.value || '',
      comment: document.getElementById('comment')?.value || '',
      agree: !!document.getElementById('agree')?.checked,
    });

    form.addEventListener('input', () => writeForm(toObj()));
    form.addEventListener('change', () => writeForm(toObj()));
    form.addEventListener('reset', () => {
      clearForm();
      setTimeout(hydrateFormFromLS, 0);
    });

    const comment = document.getElementById('comment');
    const counter = document.getElementById('commentCounter');
    if (comment && counter) {
      const update = () => {
        counter.textContent = `${Math.min(comment.value.length, 200)}/200`;
      };
      comment.addEventListener('input', update);
      update();
    }
  }

  // Отправка заказа — ГЛАВНОЕ ИСПРАВЛЕНИЕ
  function bindFormSubmit() {
    const form = document.getElementById('orderForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const { valid, message } = isValidComboAndMessage();
      if (!valid) {
        showModal(message);
        return;
      }

      const fd = new FormData(form);
      const sel = readSel();

      // Создаём маппинг keyword → id
      const keywordToId = {};
      (window.DISHES || []).forEach(d => {
        if (d.keyword) keywordToId[d.keyword] = d.id;
      });

      const payload = {
        full_name: fd.get('name')?.toString().trim(),
        phone: fd.get('phone')?.toString().trim(),
        delivery_address: fd.get('address')?.toString().trim(),
        delivery_type: fd.get('time') ? 'by_time' : 'asap',
        delivery_time: fd.get('time') || null,
        comment: fd.get('comment')?.toString().trim() || null,

        soup_id: sel.soup ? keywordToId[sel.soup] || null : null,
        main_course_id: sel.main_course ? keywordToId[sel.main_course] || null : null,
        salad_id: sel.starters ? keywordToId[sel.starters] || null : null,
        drink_id: sel.beverages ? keywordToId[sel.beverages] || null : null,
        dessert_id: sel.desserts ? keywordToId[sel.desserts] || null : null
      };

      // Обязательные поля
      const required = ['full_name', 'phone', 'delivery_address'];
      for (const field of required) {
        if (!payload[field]) {
          showModal('Заполните все обязательные поля.');
          return;
        }
      }

      // Напиток обязателен
      if (!payload.drink_id) {
        showModal('К заказу обязательно нужно выбрать напиток.');
        return;
      }

      try {
        // ПРАВИЛЬНЫЙ ЭНДПОИНТ
        const ORDERS_ENDPOINT = 'https://edu.std-900.ist.mospolytech.ru/labs/api/orders';
        const url = new URL(ORDERS_ENDPOINT);
        if (API_KEY) url.searchParams.set('api_key', API_KEY);
        if (STUDENT_ID) url.searchParams.set('student_id', STUDENT_ID);

        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        // Успешно — очищаем
        localStorage.removeItem(LS_SELECTION);
        clearForm();
        showModal('Заказ успешно оформлен! Спасибо 🧡');
        setTimeout(() => location.href = 'index.html', 1200);
      } catch (err) {
        console.error(err);
        showModal('Не удалось оформить заказ. Попробуйте позже.');
      }
    });
  }

  // Инициализация
  async function init() {
    await loadDishesForOrder();
    renderGrid();
    updateCardsSummary();
    bindDelete();
    hydrateFormFromLS();
    bindFormPersistence();
    bindFormSubmit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();