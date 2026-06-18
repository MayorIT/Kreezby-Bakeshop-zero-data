/**
 * Customer order tracking — admin/staff update status + J&T Express Philippines tracking ID.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'kreezbyOrders';
    var PO_STORAGE_KEY = 'kreezby-po-orders-v1';
    var CARRIER = 'J&T Express Philippines';
    var JNT_TRACK_BASE = 'https://www.jtexpress.ph/track-and-trace?billCodes=';
    var STATUSES = ['Processing', 'Shipped', 'Completed'];

    function loadOrders() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveOrders(orders) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        updateDashboardCounts();
        document.dispatchEvent(new CustomEvent('kreezby-orders-updated'));
    }

    function findOrderIndex(orderNumber) {
        return loadOrders().findIndex(function (o) { return o.orderNumber === orderNumber; });
    }

    function formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function customerName(order) {
        if (order.shippingInfo && order.shippingInfo.fullName) {
            return order.shippingInfo.fullName;
        }
        if (order.poEntity) return order.poEntity;
        return '—';
    }

    function loadPurchaseOrders() {
        try {
            var raw = localStorage.getItem(PO_STORAGE_KEY);
            var map = raw ? JSON.parse(raw) : {};
            return Object.keys(map).map(function (key) { return map[key]; }).filter(Boolean).sort(function (a, b) {
                return String(b.dateCreated || '').localeCompare(String(a.dateCreated || ''));
            });
        } catch (e) {
            return [];
        }
    }

    function findPurchaseOrder(poCode) {
        if (!poCode) return null;
        try {
            var raw = localStorage.getItem(PO_STORAGE_KEY);
            var map = raw ? JSON.parse(raw) : {};
            return map[poCode] || null;
        } catch (e) {
            return null;
        }
    }

    function poOptionLabel(po) {
        var type = po.entityType === 'customer' ? 'Customer' : 'Retailer';
        return po.code + ' — ' + (po.entity || 'Unknown') + ' (' + type + ')';
    }

    function generateOrderNumber() {
        var year = new Date().getFullYear();
        var max = 0;
        loadOrders().forEach(function (order) {
            var match = String(order.orderNumber || '').match(/^ORD-\d{4}-(\d+)$/);
            if (match) max = Math.max(max, parseInt(match[1], 10) || 0);
        });
        return 'ORD-' + year + '-' + String(max + 1).padStart(4, '0');
    }

    function poItemsToOrderItems(poItems) {
        var items = {};
        (poItems || []).forEach(function (item, index) {
            items['po-item-' + index] = {
                name: item.name || 'Item',
                cost: Number(item.cost) || 0,
                qty: Number(item.qty) || 1
            };
        });
        return items;
    }

    function poOrderTotal(po) {
        if (!po || !po.items || !po.items.length) return '₱0.00';
        var sum = po.items.reduce(function (total, item) {
            return total + ((Number(item.cost) || 0) * (Number(item.qty) || 0));
        }, 0);
        return '₱' + sum.toFixed(2);
    }

    function showToast(root, message) {
        var toast = root.querySelector('#order-tracking-toast');
        if (!toast) return;
        var desc = toast.querySelector('.kreezby-alert__description');
        if (desc) desc.textContent = message;
        else toast.textContent = message;
        toast.hidden = false;
        setTimeout(function () { toast.hidden = true; }, 2500);
    }

    function statusClass(status) {
        if (status === 'Shipped') return 'is-shipped';
        if (status === 'Completed') return 'is-completed';
        return 'is-processing';
    }

    function jntTrackUrl(trackingId) {
        if (!trackingId) return '';
        return JNT_TRACK_BASE + encodeURIComponent(trackingId.trim());
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function processingCount() {
        return loadOrders().filter(function (o) { return o.status === 'Processing'; }).length;
    }

    function updateDashboardCounts() {
        var count = processingCount();
        var total = loadOrders().length;
        document.querySelectorAll('[data-order-tracking-count]').forEach(function (el) {
            el.textContent = String(count || total);
        });
    }

    function filteredOrders(statusFilter, query) {
        var orders = loadOrders().slice().reverse();
        var q = (query || '').trim().toLowerCase();

        if (statusFilter && statusFilter !== 'all') {
            orders = orders.filter(function (o) {
                return (o.status || '').toLowerCase() === statusFilter.toLowerCase();
            });
        }

        if (q) {
            orders = orders.filter(function (o) {
                var ship = o.shippingInfo || {};
                return (
                    (o.orderNumber || '').toLowerCase().indexOf(q) !== -1 ||
                    (o.poCode || '').toLowerCase().indexOf(q) !== -1 ||
                    (ship.fullName || '').toLowerCase().indexOf(q) !== -1 ||
                    (o.trackingNumber || '').toLowerCase().indexOf(q) !== -1
                );
            });
        }

        return orders;
    }

    function renderTable(root, selectedId) {
        var tableBody = root.querySelector('#order-tracking-tbody');
        var layout = root.querySelector('.order-tracking-layout');
        if (!tableBody) return;

        var statusFilter = (root.querySelector('#ot-status-filter') || {}).value || 'all';
        var query = (root.querySelector('#ot-search') || {}).value || '';
        var orders = filteredOrders(statusFilter, query);

        if (!orders.length) {
            tableBody.innerHTML =
                '<tr><td colspan="7" class="order-tracking-empty">No customer orders found.</td></tr>';
            if (layout) layout.classList.remove('has-detail');
            return;
        }

        tableBody.innerHTML = orders.map(function (order) {
            var selected = order.orderNumber === selectedId ? ' is-selected' : '';
            var tracking = order.trackingNumber
                ? escapeHtml(order.trackingNumber)
                : '<span style="color:#9ca3af">Not set</span>';
            return (
                '<tr data-order-id="' + escapeHtml(order.orderNumber) + '" class="' + selected.trim() + '">' +
                '<td>' + escapeHtml(order.orderNumber) + '</td>' +
                '<td>' + escapeHtml(order.poCode || '—') + '</td>' +
                '<td>' + escapeHtml(customerName(order)) + '</td>' +
                '<td>' + formatDate(order.date) + '</td>' +
                '<td><span class="order-tracking-status-pill ' + statusClass(order.status) + '">' +
                    escapeHtml(order.status || 'Processing') + '</span></td>' +
                '<td>' + tracking + '</td>' +
                '<td>' + escapeHtml(order.carrier || CARRIER) + '</td>' +
                '</tr>'
            );
        }).join('');
    }

    function renderDetail(root, orderNumber) {
        var panel = root.querySelector('#order-tracking-detail');
        var layout = root.querySelector('.order-tracking-layout');
        if (!panel) return;

        var order = loadOrders().find(function (o) { return o.orderNumber === orderNumber; });
        if (!order) {
            panel.hidden = true;
            if (layout) layout.classList.remove('has-detail');
            return;
        }

        var ship = order.shippingInfo || {};
        var trackUrl = jntTrackUrl(order.trackingNumber);

        panel.hidden = false;
        if (layout) layout.classList.add('has-detail');

        panel.innerHTML =
            '<h3 class="order-tracking-detail-title">' + escapeHtml(order.orderNumber) + '</h3>' +
            '<p class="order-tracking-detail-sub">' + escapeHtml(customerName(order)) + ' · ' + formatDate(order.date) + '</p>' +
            (order.poCode
                ? '<div class="order-tracking-form-group"><label>Linked PO Code</label><input type="text" readonly class="order-tracking-readonly-field" value="' + escapeHtml(order.poCode) + '"></div>'
                : '') +
            '<div class="order-tracking-form-group">' +
                '<label>Delivery address</label>' +
                '<textarea readonly rows="2">' + escapeHtml(ship.address || '—') + '</textarea>' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label>Phone</label>' +
                '<input type="text" readonly value="' + escapeHtml(ship.phone || '—') + '">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-status">Order status</label>' +
                '<select id="ot-status">' +
                    STATUSES.map(function (s) {
                        var sel = order.status === s ? ' selected' : '';
                        return '<option value="' + s + '"' + sel + '>' + s + '</option>';
                    }).join('') +
                '</select>' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-carrier">Courier</label>' +
                '<input type="text" id="ot-carrier" readonly value="' + escapeHtml(order.carrier || CARRIER) + '">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-tracking">J&amp;T Express tracking ID</label>' +
                '<input type="text" id="ot-tracking" placeholder="e.g. JT1234567890123" value="' + escapeHtml(order.trackingNumber || '') + '">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-notes">Internal notes (optional)</label>' +
                '<textarea id="ot-notes" rows="2" placeholder="Packaging or dispatch notes">' + escapeHtml(order.staffNotes || '') + '</textarea>' +
            '</div>' +
            '<div class="order-tracking-form-actions">' +
                '<button type="button" class="order-tracking-btn order-tracking-btn-primary" id="ot-save-btn">Save tracking</button>' +
                (trackUrl
                    ? '<a class="order-tracking-btn order-tracking-btn-link" href="' + trackUrl + '" target="_blank" rel="noopener noreferrer">Track on J&amp;T</a>'
                    : '') +
                '<button type="button" class="order-tracking-btn" id="ot-close-btn">Close</button>' +
            '</div>';

        panel.querySelector('#ot-save-btn').addEventListener('click', function () {
            saveOrderUpdates(root, orderNumber);
        });
        panel.querySelector('#ot-close-btn').addEventListener('click', function () {
            panel.hidden = true;
            if (layout) layout.classList.remove('has-detail');
            renderTable(root, null);
        });
    }

    function saveOrderUpdates(root, orderNumber) {
        var idx = findOrderIndex(orderNumber);
        if (idx < 0) return;

        var orders = loadOrders();
        var order = orders[idx];
        var statusEl = root.querySelector('#ot-status');
        var trackingEl = root.querySelector('#ot-tracking');
        var notesEl = root.querySelector('#ot-notes');

        var nextStatus = statusEl ? statusEl.value : order.status;
        var tracking = trackingEl ? trackingEl.value.trim() : '';
        var notes = notesEl ? notesEl.value.trim() : '';

        order.status = nextStatus;
        order.trackingNumber = tracking;
        order.carrier = CARRIER;
        order.staffNotes = notes;
        order.statusUpdatedAt = new Date().toISOString();

        if (nextStatus === 'Shipped' && tracking && !order.shippedAt) {
            order.shippedAt = order.statusUpdatedAt;
        }
        if (nextStatus === 'Completed') {
            order.completedAt = order.statusUpdatedAt;
        }

        orders[idx] = order;
        saveOrders(orders);
        renderTable(root, orderNumber);
        renderDetail(root, orderNumber);
        showToast(root, 'Saved tracking for ' + orderNumber + '.');
    }

    function renderCreatePanel(root) {
        var panel = root.querySelector('#order-tracking-detail');
        var layout = root.querySelector('.order-tracking-layout');
        if (!panel) return;

        var purchaseOrders = loadPurchaseOrders();
        var orderNumber = generateOrderNumber();
        var poOptions = purchaseOrders.length
            ? purchaseOrders.map(function (po) {
                return '<option value="' + escapeHtml(po.code) + '">' + escapeHtml(poOptionLabel(po)) + '</option>';
            }).join('')
            : '<option value="">No purchase orders found</option>';

        panel.hidden = false;
        if (layout) layout.classList.add('has-detail');

        panel.innerHTML =
            '<h3 class="order-tracking-detail-title">Create New Order Tracking</h3>' +
            '<p class="order-tracking-create-hint">Select a purchase order code to auto-fill the customer name, then add the J&amp;T tracking ID.</p>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-po">Purchase order code</label>' +
                '<select id="ot-create-po">' +
                    '<option value="">Select PO code…</option>' +
                    poOptions +
                '</select>' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-customer">Customer / entity name</label>' +
                '<input type="text" id="ot-create-customer" class="order-tracking-readonly-field" readonly placeholder="Auto-filled from PO">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-order-id">Order ID</label>' +
                '<input type="text" id="ot-create-order-id" class="order-tracking-readonly-field" readonly value="' + escapeHtml(orderNumber) + '">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-status">Order status</label>' +
                '<select id="ot-create-status">' +
                    STATUSES.map(function (s) {
                        var sel = s === 'Processing' ? ' selected' : '';
                        return '<option value="' + s + '"' + sel + '>' + s + '</option>';
                    }).join('') +
                '</select>' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-carrier">Courier</label>' +
                '<input type="text" id="ot-create-carrier" readonly class="order-tracking-readonly-field" value="' + escapeHtml(CARRIER) + '">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-tracking">J&amp;T Express tracking ID</label>' +
                '<input type="text" id="ot-create-tracking" placeholder="e.g. JT1234567890123">' +
            '</div>' +
            '<div class="order-tracking-form-group">' +
                '<label for="ot-create-notes">Internal notes (optional)</label>' +
                '<textarea id="ot-create-notes" rows="2" placeholder="Dispatch or packaging notes"></textarea>' +
            '</div>' +
            '<div class="order-tracking-form-actions">' +
                '<button type="button" class="order-tracking-btn order-tracking-btn-primary" id="ot-create-save-btn">Create order tracking</button>' +
                '<button type="button" class="order-tracking-btn" id="ot-create-cancel-btn">Cancel</button>' +
            '</div>';

        var poSelect = panel.querySelector('#ot-create-po');
        var customerInput = panel.querySelector('#ot-create-customer');

        function applyPoSelection() {
            var po = findPurchaseOrder(poSelect.value);
            if (!po) {
                customerInput.value = '';
                return;
            }
            customerInput.value = po.entity || '';
        }

        if (poSelect) {
            poSelect.addEventListener('change', applyPoSelection);
            if (purchaseOrders.length === 1) {
                poSelect.value = purchaseOrders[0].code;
                applyPoSelection();
            }
        }

        panel.querySelector('#ot-create-save-btn').addEventListener('click', function () {
            createOrderFromForm(root);
        });
        panel.querySelector('#ot-create-cancel-btn').addEventListener('click', function () {
            panel.hidden = true;
            if (layout) layout.classList.remove('has-detail');
        });
    }

    function createOrderFromForm(root) {
        var panel = root.querySelector('#order-tracking-detail');
        if (!panel) return;

        var poCode = (panel.querySelector('#ot-create-po') || {}).value || '';
        var customer = (panel.querySelector('#ot-create-customer') || {}).value || '';
        var orderNumber = (panel.querySelector('#ot-create-order-id') || {}).value || generateOrderNumber();
        var status = (panel.querySelector('#ot-create-status') || {}).value || 'Processing';
        var tracking = (panel.querySelector('#ot-create-tracking') || {}).value || '';
        var notes = (panel.querySelector('#ot-create-notes') || {}).value || '';

        if (!poCode) {
            showToast(root, 'Please select a purchase order code.');
            return;
        }
        if (!customer) {
            showToast(root, 'Customer name could not be detected from the selected PO.');
            return;
        }
        if (findOrderIndex(orderNumber) >= 0) {
            orderNumber = generateOrderNumber();
        }

        var po = findPurchaseOrder(poCode);
        var now = new Date().toISOString();
        var order = {
            orderNumber: orderNumber,
            poCode: poCode,
            poEntity: po ? po.entity : customer,
            items: po ? poItemsToOrderItems(po.items) : {},
            subtotal: po && po.items ? po.items.reduce(function (n, item) {
                return n + ((Number(item.cost) || 0) * (Number(item.qty) || 0));
            }, 0) : 0,
            deliveryFee: 0,
            total: po ? poOrderTotal(po) : '₱0.00',
            paymentMethod: 'po',
            shippingInfo: {
                fullName: customer,
                phone: '',
                address: po && po.area ? po.area : '',
                notes: po && po.remarks ? po.remarks : ''
            },
            status: status,
            trackingNumber: tracking.trim(),
            carrier: CARRIER,
            staffNotes: notes.trim(),
            date: now,
            statusUpdatedAt: now,
            paymentVerified: true,
            source: 'staff-tracking'
        };

        if (status === 'Shipped' && order.trackingNumber) {
            order.shippedAt = now;
        }
        if (status === 'Completed') {
            order.completedAt = now;
        }

        var orders = loadOrders();
        orders.push(order);
        saveOrders(orders);
        renderTable(root, orderNumber);
        renderDetail(root, orderNumber);
        showToast(root, 'Created tracking record ' + orderNumber + '.');
    }

    function bindPage(root) {
        if (!root || root.dataset.orderTrackingBound === '1') return;
        root.dataset.orderTrackingBound = '1';

        var selectedId = null;

        function refresh() {
            renderTable(root, selectedId);
            if (selectedId) renderDetail(root, selectedId);
        }

        root.addEventListener('click', function (e) {
            var row = e.target.closest('#order-tracking-tbody tr[data-order-id]');
            if (!row) return;
            selectedId = row.getAttribute('data-order-id');
            refresh();
        });

        var createBtn = root.querySelector('#ot-create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', function () {
                selectedId = null;
                renderCreatePanel(root);
            });
        }

        var filter = root.querySelector('#ot-status-filter');
        var search = root.querySelector('#ot-search');
        if (filter) filter.addEventListener('change', refresh);
        if (search) search.addEventListener('input', refresh);

        refresh();
    }

    function init() {
        updateDashboardCounts();
        document.querySelectorAll('[data-order-tracking-page]').forEach(bindPage);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('kreezby:page-load', init);
    document.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY || e.key === PO_STORAGE_KEY) init();
    });

    window.KreezbyOrderTracking = {
        loadOrders: loadOrders,
        loadPurchaseOrders: loadPurchaseOrders,
        saveOrders: saveOrders,
        generateOrderNumber: generateOrderNumber,
        jntTrackUrl: jntTrackUrl,
        CARRIER: CARRIER,
        updateDashboardCounts: updateDashboardCounts,
        processingCount: processingCount
    };
})();
