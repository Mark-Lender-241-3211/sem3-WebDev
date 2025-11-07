(function () {
  const CONFIG = window.FC_CONFIG || {};
  const STUDENT_ID = typeof CONFIG.studentId === 'string' ? CONFIG.studentId.trim() : '';

  const LS_SELECTION = 'fc_order_selection'; // ключ с выбранными блюдами (keyword'ы)
  const LS_FORM      = 'fc_order_form';      // ключ с данными формы

  // соответствие категорий типам комбо (как в твоём menu.js)
  const CAT2TYPE = { soup: 'soup', main_course: 'main', starters: 'salad', beverages: 'drink', desserts: 'desert' };

  // ===== Загрузка блюд с API — как на set-lunch =====
  async function ensureDishes() {
    if (Array.isArray(window.DISHES) && window.DISHES.length) return;
    try {
      const res = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      const categoryMap = {
        'soup': 'soup',
        'main-course': 'main_course',
        'salad': 'starters',
        'drink': 'beverages',
        'dessert': 'desserts',
      };

      window.DISHES = raw.map(d => ({
        ...d,
        category: categoryMap[d.category] || d.category,
        image: d.image.trim(), // как в menu.js (в API картинка приходит уже с путём)
      }));
    } catch (e) {
      console.error(e);
      window.DISHES = [];
      alert('Не удалось загрузить меню. Проверьте подключение к интернету.');
    }
  }

  // ===== LocalStorage helpers =====
  const readSel  = () => { try { return JSON.parse(localStorage.getItem(LS_SELECTION) || '{}'); } catch { return {}; } };
  const writeSel = (v)  => { try { localStorage.setItem(LS_SELECTION, JSON.stringify(v)); } catch {} };

  const readForm = () => { try { return JSON.parse(localStorage.getItem(LS_FORM) || '{}'); } catch { return {}; } };
  const writeForm = (v) => { try { localStorage.setItem(LS_FORM, JSON.stringify(v)); } catch {} };
  const clearForm = () => { try { localStorage.removeItem(LS_FORM); } catch {} };

  // ===== Dishes helpers =====
  const getDishByKeyword = (kw) => (window.DISHES || []).find(d => d.keyword === kw) || null;

  // ===== Состав заказа (карточки) =====
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
    grid.innerHTML = '';

    const sel = readSel();
    const dishes = Object.values(sel).filter(Boolean).map(getDishByKeyword).filter(Boolean);
    dishes.forEach(d => grid.appendChild(createCard(d)));
  }

  function updateCardsSummary() {
    const grid = document.getElementById('orderGrid');
    const items = grid.querySelectorAll('.menu-item');
    const total = Array.from(items).reduce((sum, card) => {
      const p = card.querySelector('.price');
      const val = p ? parseInt(p.textContent) : 0;
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);

    const hasAny = items.length > 0;
    document.getElementById('empty-order').hidden = hasAny;
    document.getElementById('order-total').hidden = !hasAny;
    document.getElementById('orderTotalValue').textContent = String(total);

    updateLeftFormSummary(); // всегда обновляем сводку формы
  }

  function bindDelete() {
    document.getElementById('orderGrid').addEventListener('click', (e) => {
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

  // ===== Левая сводка в форме =====
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

  // ===== Модалка (точно как в set-lunch) =====
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

  // ===== Проверка комбо — «как было» =====
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
    const hasSoup  = !!sel.soup;
    const hasMain  = !!sel.main_course;
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

  // ===== Сохранение данных формы в localStorage =====
  function hydrateFormFromLS() {
    const data = readForm();
    const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    set('name',    data.name || '');
    set('phone',   data.phone || '');
    set('address', data.address || '');
    set('time',    data.time || '');
    set('comment', data.comment || '');
    const agree = document.getElementById('agree');
    if (agree) agree.checked = !!data.agree;

    // обновить счётчик символов
    const comment = document.getElementById('comment');
    const counter = document.getElementById('commentCounter');
    if (comment && counter) counter.textContent = `${Math.min(comment.value.length,200)}/200`;
  }

  function bindFormPersistence() {
    const form = document.getElementById('orderForm');
    const toObj = () => ({
      name:    document.getElementById('name')?.value || '',
      phone:   document.getElementById('phone')?.value || '',
      address: document.getElementById('address')?.value || '',
      time:    document.getElementById('time')?.value || '',
      comment: document.getElementById('comment')?.value || '',
      agree:   !!document.getElementById('agree')?.checked,
    });

    form.addEventListener('input', () => writeForm(toObj()));
    form.addEventListener('change', () => writeForm(toObj()));
    form.addEventListener('reset', () => { clearForm(); setTimeout(hydrateFormFromLS, 0); });

    // счётчик комментария
    const comment = document.getElementById('comment');
    const counter = document.getElementById('commentCounter');
    if (comment && counter) {
      const update = () => { counter.textContent = `${Math.min(comment.value.length,200)}/200`; };
      comment.addEventListener('input', update);
      update();
    }
  }

  // ===== Отправка формы =====
  function bindFormSubmit() {
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const { valid, message } = isValidComboAndMessage();
      if (!valid) { showModal(message); return; }

      const fd = new FormData(form);
      const payload = {
        name: fd.get('name'),
        phone: fd.get('phone'),
        address: fd.get('address'),
        time: fd.get('time') || '',
        comment: fd.get('comment') || '',
        dishes: Object.values(readSel()).filter(Boolean) // массив keyword'ов
      };

      try {
        const url = new URL('https://edu.std-900.ist.mospolytech.ru/labs/api/orders');
        if (STUDENT_ID) {
          url.searchParams.set('student_id', STUDENT_ID);
        } else {
          console.warn('studentId не задан в FC_CONFIG. Заказ будет создан в общей области API.');
        }

        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // успех — очищаем оба ключа
        localStorage.removeItem(LS_SELECTION);
        clearForm();
        showModal('Заказ успешно оформлен! Спасибо 🧡');
        setTimeout(() => location.href = 'index.html', 1200);
      } catch (err) {
        console.error(err);
        showModal('Не удалось оформить заказ. Попробуйте ещё раз позже.');
      }
    });
  }

  // ===== Инициализация =====
  async function init() {
    await ensureDishes();
    renderGrid();
    updateCardsSummary();
    bindDelete();

    hydrateFormFromLS();
    bindFormPersistence();
    bindFormSubmit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
