(function () {
  const STUDENT_ID = '123456';
  const API_KEY = '4a4017d0-af17-40d9-af18-96b0550c49a9';

  const ORDERS_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/orders';
  const DISHES_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';

  const state = {
    orders: [],
    dishes: [],
    dishIndex: new Map(),
  };

  const dom = {
    tableBody: document.getElementById('ordersBody'),
    emptyState: document.getElementById('ordersEmpty'),
    toastContainer: document.getElementById('toastContainer'),
    modalHost: document.getElementById('modalHost'),
  };

  if (!dom.tableBody) return;

  init().catch((error) => {
    console.error(error);
    showToast('Не удалось загрузить данные. Попробуйте обновить страницу.', 'error');
  });

  async function init() {
    await ensureDishes();
    await loadOrders();
    dom.tableBody.addEventListener('click', handleActionClick);
  }

  async function ensureDishes() {
    if (Array.isArray(window.DISHES) && window.DISHES.length) {
      state.dishes = window.DISHES;
      buildDishIndex();
      return;
    }

    try {
      const res = await fetch(DISHES_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Ошибка загрузки блюд (${res.status})`);
      const data = await res.json();
      state.dishes = Array.isArray(data) ? data.map(normalizeDish) : [];
      window.DISHES = state.dishes;
      buildDishIndex();
    } catch (error) {
      console.error(error);
      showToast('Не удалось загрузить список блюд. Названия могут отображаться частично.', 'error');
      state.dishes = [];
      buildDishIndex();
    }
  }

  function normalizeDish(dish) {
    if (!dish) return dish;
    // Приводим категории к тем, что использует order.js
    const categoryMap = {
      'main-course': 'main',
      'salad': 'salad',
      'drink': 'drink',
      'dessert': 'dessert',
      'soup': 'soup',
    };
    return {
      ...dish,
      category: categoryMap[dish.category] || dish.category,
      image: typeof dish.image === 'string' ? dish.image.trim() : dish.image,
    };
  }

  function buildDishIndex() {
    state.dishIndex = new Map();
    state.dishes.forEach((dish) => {
      if (!dish) return;
      if (dish.keyword) state.dishIndex.set(dish.keyword, dish);
      if (dish.id != null) state.dishIndex.set(String(dish.id), dish);
    });
  }

  async function loadOrders() {
    const url = buildOrdersUrl();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Ошибка загрузки заказов (${res.status})`);
      const payload = await res.json();
      state.orders = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      renderOrders();
    } catch (error) {
      console.error(error);
      state.orders = [];
      renderOrders();
      showToast('Не удалось загрузить список заказов. Попробуйте позже.', 'error');
    }
  }

  function buildOrdersUrl(orderId) {
    const url = new URL(orderId ? `${ORDERS_URL}/${orderId}` : ORDERS_URL);
    if (STUDENT_ID) url.searchParams.set('student_id', STUDENT_ID);
    if (API_KEY) url.searchParams.set('api_key', API_KEY);
    return url.toString();
  }

  function renderOrders() {
    dom.tableBody.innerHTML = '';

    const sorted = [...state.orders].sort((a, b) => {
      const da = parseDate(a?.created_at || a?.createdAt || a?.created);
      const db = parseDate(b?.created_at || b?.createdAt || b?.created);
      return db - da;
    });

    if (!sorted.length) {
      dom.emptyState.hidden = false;
      return;
    }

    dom.emptyState.hidden = true;

    sorted.forEach((order, index) => {
      const tr = document.createElement('tr');
      tr.dataset.orderId = order.id;

      const cells = [
        { label: '№', text: String(index + 1) },
        { label: 'Дата оформления', text: formatDateTime(order?.created_at || order?.createdAt || order?.created) },
        { label: 'Состав заказа', text: formatOrderComposition(order) },
        { label: 'Стоимость', text: formatPrice(extractTotal(order)) },
        { label: 'Время доставки', text: formatDelivery(order) },
      ];

      cells.forEach(({ label, text }) => {
        const td = document.createElement('td');
        td.dataset.label = label;
        td.textContent = text;
        tr.appendChild(td);
      });

      const actionsCell = document.createElement('td');
      actionsCell.dataset.label = 'Действия';
      actionsCell.className = 'orders-actions-column';
      actionsCell.appendChild(buildActions(order));
      tr.appendChild(actionsCell);

      dom.tableBody.appendChild(tr);
    });
  }

  function buildActions(order) {
    const wrapper = document.createElement('div');
    wrapper.className = 'orders-actions';

    wrapper.appendChild(createActionButton('Подробнее', 'view', order.id));
    wrapper.appendChild(createActionButton('Редактировать', 'edit', order.id));
    wrapper.appendChild(createActionButton('Удалить', 'delete', order.id));

    return wrapper;
  }

  function createActionButton(label, action, orderId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'orders-action';
    button.dataset.action = action;
    button.dataset.orderId = orderId;
    button.textContent = label;
    button.setAttribute('aria-label', label);
    return button;
  }

  function handleActionClick(event) {
    const button = event.target.closest('.orders-action');
    if (!button) return;

    const order = state.orders.find((item) => String(item.id) === String(button.dataset.orderId));
    if (!order) {
      showToast('Не удалось найти данные заказа.', 'error');
      return;
    }

    switch (button.dataset.action) {
      case 'view':
        openViewModal(order);
        break;
      case 'edit':
        openEditModal(order);
        break;
      case 'delete':
        openDeleteModal(order);
        break;
      default:
        break;
    }
  }

  function openViewModal(order) {
    const dishes = formatDishDetails(order, true);

    openModal({
      title: 'Просмотр заказа',
      renderBody(container) {
        const dl = document.createElement('dl');
        dl.innerHTML = [
          ['Дата оформления', formatDateTime(order?.created_at || order?.createdAt || order?.created)],
          ['Имя получателя', order.full_name || order.name || '—'],
          ['Адрес доставки', order.delivery_address || order.address || '—'],
          ['Тип доставки', formatDeliveryType(order)],
          ['Время доставки', formatDelivery(order)],
          ['Телефон', order.phone || '—'],
          ['Email', order.email || '—'],
          ['Комментарий', order.comment || '—'],
          ['Стоимость', formatPrice(extractTotal(order))],
        ].map(([term, value]) => `<dt>${term}</dt><dd>${value || '—'}</dd>`).join('');
        container.appendChild(dl);

        const dishSection = document.createElement('section');
        const title = document.createElement('h4');
        title.textContent = 'Состав заказа';
        dishSection.appendChild(title);

        if (!dishes.length) {
          const empty = document.createElement('p');
          empty.textContent = 'Данные о блюдах недоступны.';
          dishSection.appendChild(empty);
        } else {
          const list = document.createElement('ul');
          list.className = 'orders-dishes-list';
          dishes.forEach((line) => {
            const li = document.createElement('li');
            li.textContent = line;
            list.appendChild(li);
          });
          dishSection.appendChild(list);
        }

        container.appendChild(dishSection);
      },
      actions: [
        { label: 'Ок', variant: 'primary', handler: ({ close }) => close() },
      ],
    });
  }

  function openEditModal(order) {
    const defaults = {
      full_name: order.full_name || order.name || '',
      email: order.email || '',
      phone: order.phone || '',
      delivery_address: order.delivery_address || order.address || '',
      delivery_type: deriveDeliveryType(order),
      delivery_time: formatTimeValue(order.delivery_time || order.deliveryTime || order.time),
      comment: order.comment || '',
    };

    let locked = false;

    openModal({
      title: 'Редактирование заказа',
      renderBody(container) {
        const form = document.createElement('form');
        form.id = 'editOrderForm';
        form.innerHTML = `
          <div class="form-grid">
            <div>
              <label for="edit_full_name">Имя получателя</label>
              <input id="edit_full_name" name="full_name" type="text" required value="${escapeHtml(defaults.full_name)}">
            </div>
            <div>
              <label for="edit_email">Email</label>
              <input id="edit_email" name="email" type="email" value="${escapeHtml(defaults.email)}">
            </div>
            <div>
              <label for="edit_phone">Телефон</label>
              <input id="edit_phone" name="phone" type="tel" required value="${escapeHtml(defaults.phone)}">
            </div>
            <div>
              <label for="edit_delivery_type">Тип доставки</label>
              <select id="edit_delivery_type" name="delivery_type">
                <option value="asap" ${defaults.delivery_type === 'asap' ? 'selected' : ''}>Как можно скорее</option>
                <option value="scheduled" ${defaults.delivery_type === 'scheduled' ? 'selected' : ''}>К назначенному времени</option>
              </select>
            </div>
            <div class="full-width">
              <label for="edit_delivery_address">Адрес доставки</label>
              <input id="edit_delivery_address" name="delivery_address" type="text" required value="${escapeHtml(defaults.delivery_address)}">
            </div>
            <div>
              <label for="edit_delivery_time">Время доставки</label>
              <input id="edit_delivery_time" name="delivery_time" type="time" value="${escapeHtml(defaults.delivery_time)}">
            </div>
            <div class="full-width">
              <label for="edit_comment">Комментарий</label>
              <textarea id="edit_comment" name="comment" rows="4">${escapeHtml(defaults.comment)}</textarea>
            </div>
          </div>
        `;

        const typeSelect = form.querySelector('#edit_delivery_type');
        const timeInput = form.querySelector('#edit_delivery_time');
        const syncTime = () => {
          if (typeSelect.value === 'scheduled') {
            timeInput.removeAttribute('disabled');
          } else {
            timeInput.setAttribute('disabled', 'disabled');
          }
        };
        syncTime();
        typeSelect.addEventListener('change', syncTime);

        container.appendChild(form);
      },
      actions: [
        { label: 'Отмена', variant: 'secondary', handler: ({ close }) => close() },
        {
          label: 'Сохранить',
          variant: 'primary',
          handler: async ({ modal, close }) => {
            if (locked) return;
            const form = modal.querySelector('#editOrderForm');
            if (!form || !form.reportValidity()) return;
            locked = true;
            try {
              const payload = collectFormPayload(form);
              await updateOrder(order.id, payload);
              close();
              showToast('Заказ успешно изменён.', 'success');
              await loadOrders();
            } catch (error) {
              console.error(error);
              showToast('Не удалось сохранить изменения. Попробуйте позже.', 'error');
            } finally {
              locked = false;
            }
          },
        },
      ],
    });
  }

  function openDeleteModal(order) {
    let locked = false;

    openModal({
      title: 'Удаление заказа',
      renderBody(container) {
        const text = document.createElement('p');
        text.textContent = 'Вы уверены, что хотите удалить заказ?';
        container.appendChild(text);
      },
      actions: [
        { label: 'Отмена', variant: 'secondary', handler: ({ close }) => close() },
        {
          label: 'Да',
          variant: 'danger',
          handler: async ({ close }) => {
            if (locked) return;
            locked = true;
            try {
              await deleteOrder(order.id);
              close();
              showToast('Заказ удалён.', 'success');
              await loadOrders();
            } catch (error) {
              console.error(error);
              showToast('Не удалось удалить заказ. Попробуйте позже.', 'error');
            } finally {
              locked = false;
            }
          },
        },
      ],
    });
  }

  async function updateOrder(orderId, payload) {
    const url = buildOrdersUrl(orderId);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Ошибка обновления заказа (${res.status})`);
    const data = await res.json();
    const idx = state.orders.findIndex((order) => String(order.id) === String(orderId));
    if (idx !== -1) state.orders[idx] = { ...state.orders[idx], ...data };
  }

  async function deleteOrder(orderId) {
    const url = buildOrdersUrl(orderId);
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Ошибка удаления заказа (${res.status})`);
    state.orders = state.orders.filter((order) => String(order.id) !== String(orderId));
  }

  function collectFormPayload(form) {
    const formData = new FormData(form);
    const payload = {
      full_name: (formData.get('full_name') || '').trim(),
      email: (formData.get('email') || '').trim(),
      phone: (formData.get('phone') || '').trim(),
      delivery_address: (formData.get('delivery_address') || '').trim(),
      delivery_type: formData.get('delivery_type') || 'asap',
      comment: (formData.get('comment') || '').trim(),
    };

    if (payload.delivery_type === 'scheduled') {
      payload.delivery_time = formData.get('delivery_time') || '';
    } else {
      payload.delivery_time = null;
    }

    return payload;
  }

  // === КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ — ИСПРАВЛЕНА ===
  function extractOrderItems(order) {
    if (!order) return [];

    // Сначала попробуем найти массив блюд (если API его даёт)
    if (Array.isArray(order.dishes)) return order.dishes;
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order.order_items)) return order.order_items;
    if (Array.isArray(order.orderItems)) return order.orderItems;

    // Если массива нет — строим вручную из полей, как в order.js
    const mappings = [
      { field: 'soup_id', category: 'soup' },
      { field: 'main_course_id', category: 'main' },
      { field: 'salad_id', category: 'salad' },
      { field: 'drink_id', category: 'drink' },
      { field: 'dessert_id', category: 'dessert' }
    ];

    const items = [];
    for (const { field, category } of mappings) {
      const id = order[field];
      if (id != null) {
        items.push({ id: id, category });
      }
    }
    return items;
  }

  function resolveDish(item) {
    if (!item) return null;

    // Если item — это строка (keyword)
    if (typeof item === 'string' && state.dishIndex.has(item)) {
      return state.dishIndex.get(item);
    }

    // Если item — объект с id
    if (typeof item === 'object') {
      if (item.id != null && state.dishIndex.has(String(item.id))) {
        return state.dishIndex.get(String(item.id));
      }
      if (item.keyword && state.dishIndex.has(item.keyword)) {
        return state.dishIndex.get(item.keyword);
      }
      // Если у item есть вложенный dish
      if (item.dish) {
        return resolveDish(item.dish);
      }
    }

    return null;
  }

  function extractItemPrice(item, dish) {
    if (!item) return null;
    if (typeof item === 'object') {
      if (item.price != null) return item.price;
      if (item.cost != null) return item.cost;
      if (item.amount != null) return item.amount;
      if (item.dish && item.dish.price != null) return item.dish.price;
    }
    if (dish && dish.price != null) return dish.price;
    return null;
  }

  function extractTotal(order) {
    if (!order) return null;
    if (order.total_price != null) return order.total_price;
    if (order.totalPrice != null) return order.totalPrice;
    if (order.total != null) return order.total;
    if (order.price != null) return order.price;

    const items = extractOrderItems(order);
    if (!items.length) return null;
    return items.reduce((sum, item) => sum + (Number(extractItemPrice(item, resolveDish(item))) || 0), 0);
  }

  function formatOrderComposition(order) {
    const items = extractOrderItems(order);
    const names = items.map((item) => {
      const dish = resolveDish(item);
      return dish?.name || item?.name || item?.title || item?.keyword || 'Неизвестное блюдо';
    });
    return names.length ? names.join(', ') : '—';
  }

  function formatDishDetails(order, withPrice) {
    const items = extractOrderItems(order);
    return items.map((item) => {
      const dish = resolveDish(item);
      const name = dish?.name || item?.name || item?.title || item?.keyword || 'Неизвестное блюдо';
      if (!withPrice) return name;
      const price = extractItemPrice(item, dish);
      return price != null ? `${name} (${price}₽)` : name;
    });
  }

  function formatPrice(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value)}₽`;
  }

  function formatDelivery(order) {
    const type = deriveDeliveryType(order);
    if (type === 'asap') return 'Как можно скорее (с 07:00 до 23:00)';
    const rawTime = order?.delivery_time || order?.deliveryTime || order?.time;
    if (!rawTime) return 'Во временное окно доставки';
    return formatTimeDisplay(rawTime);
  }

  function formatDeliveryType(order) {
    const type = deriveDeliveryType(order);
    if (type === 'asap') return 'Как можно скорее';
    if (type === 'scheduled') return 'К назначенному времени';
    return 'Не указано';
  }

  function deriveDeliveryType(order) {
    if (!order) return 'asap';
    if (order.delivery_type) return order.delivery_type;
    if (order.deliveryType) return order.deliveryType;
    if (order.delivery_time || order.deliveryTime || order.time) return 'scheduled';
    return 'asap';
  }

  function parseDate(value) {
    if (!value) return new Date(0);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date(0);
    return date;
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const date = parseDate(value);
    if (Number.isNaN(date.getTime())) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatTimeValue(value) {
    if (typeof value === 'string' && value.includes(':')) return value.slice(0, 5);
    return '';
  }

  function formatTimeDisplay(value) {
    if (typeof value === 'string' && value.includes(':')) {
      const [h, m] = value.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }
    return value || '—';
  }

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openModal({ title, renderBody, actions = [] }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    overlay.appendChild(modal);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const bodyContainer = document.createElement('div');
    if (typeof renderBody === 'function') {
      renderBody(bodyContainer);
    }

    const actionsBox = document.createElement('div');
    actionsBox.className = 'modal-actions';

    const close = () => {
      document.removeEventListener('keydown', onKeyDown);
      overlay.removeEventListener('click', onOverlayClick);
      overlay.remove();
    };

    const onOverlayClick = (event) => {
      if (event.target === overlay) close();
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKeyDown);

    actions.forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'modal-button';
      if (action.variant) button.classList.add(action.variant);
      button.textContent = action.label;
      button.addEventListener('click', () => action.handler?.({ modal, overlay, close }));
      actionsBox.appendChild(button);
    });

    modal.append(closeBtn, titleEl, bodyContainer, actionsBox);
    dom.modalHost.appendChild(overlay);
  }

  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => toast.remove());

    toast.appendChild(closeBtn);
    dom.toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }
})();