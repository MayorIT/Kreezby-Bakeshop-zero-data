/**
 * Customer order list + Shopee/Lazada-style order detail view.
 */
(function () {
    'use strict';

    var STATUS_STEPS = ['Processing', 'Shipped', 'Completed'];
    var STATUS_COLORS = {
        Processing: '#fbc02d',
        Shipped: '#1e88e5',
        Completed: '#4caf50'
    };

    var currentFilter = 'all';

    function loadOrders() {
        try {
            return JSON.parse(localStorage.getItem('kreezbyOrders') || '[]');
        } catch (e) {
            return [];
        }
    }

    function findOrder(orderNumber) {
        return loadOrders().find(function (o) { return o.orderNumber === orderNumber; });
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatMoney(n) {
        return '₱' + Number(n).toFixed(2);
    }

    function orderTotals(order) {
        var items = Object.values(order.items || {});
        var subtotal = order.subtotal;
        if (subtotal == null) {
            subtotal = items.reduce(function (sum, item) {
                return sum + (item.cost * item.qty);
            }, 0);
        }
        var deliveryFee = order.deliveryFee != null ? order.deliveryFee : (subtotal > 0 ? 50 : 0);
        var total = order.total;
        if (!total) {
            total = formatMoney(subtotal + deliveryFee);
        }
        return { subtotal: subtotal, deliveryFee: deliveryFee, total: total };
    }

    function itemCount(order) {
        return Object.values(order.items || {}).reduce(function (n, item) {
            return n + item.qty;
        }, 0);
    }

    function firstItemName(order) {
        var items = Object.values(order.items || {});
        if (!items.length) return 'No items';
        var name = items[0].name;
        if (items.length > 1) return name + ' +' + (items.length - 1) + ' more';
        return name;
    }

    function statusBadge(status) {
        var color = STATUS_COLORS[status] || '#666';
        return '<span class="order-status-pill" style="background:' + color + '">' + status + '</span>';
    }

    function renderTimeline(status) {
        var activeIdx = STATUS_STEPS.indexOf(status);
        if (activeIdx < 0) activeIdx = 0;

        return (
            '<div class="order-status-timeline">' +
            STATUS_STEPS.map(function (step, i) {
                var done = i <= activeIdx;
                var active = i === activeIdx;
                var cls = 'timeline-step' + (done ? ' done' : '') + (active ? ' active' : '');
                return (
                    '<div class="' + cls + '">' +
                    '<div class="timeline-dot">' + (done ? '✓' : (i + 1)) + '</div>' +
                    '<div class="timeline-label">' + step + '</div>' +
                    (i < STATUS_STEPS.length - 1 ? '<div class="timeline-line"></div>' : '') +
                    '</div>'
                );
            }).join('') +
            '</div>'
        );
    }

    function renderOrderCard(order) {
        var totals = orderTotals(order);
        var count = itemCount(order);
        var dateStr = formatDate(order.date);

        return (
            '<button type="button" class="order-list-card" data-order-id="' + order.orderNumber + '">' +
            '<div class="order-list-card-top">' +
            '<div class="order-list-card-meta">' +
            '<span class="order-list-number">' + order.orderNumber + '</span>' +
            '<span class="order-list-date">' + dateStr + '</span>' +
            '</div>' +
            statusBadge(order.status) +
            '</div>' +
            '<div class="order-list-card-body">' +
            '<div class="order-list-thumb">' + count + ' item' + (count !== 1 ? 's' : '') + '</div>' +
            '<div class="order-list-preview">' +
            '<div class="order-list-items">' + firstItemName(order) + '</div>' +
            '<div class="order-list-total">' + totals.total + '</div>' +
            '</div>' +
            '<span class="order-list-chevron" aria-hidden="true">›</span>' +
            '</div>' +
            '</button>'
        );
    }

    function renderOrders(filter) {
        currentFilter = filter || currentFilter;
        var container = document.getElementById('orders-container');
        if (!container) return;

        var orders = loadOrders();
        var filtered = currentFilter === 'all'
            ? orders
            : orders.filter(function (o) {
                return o.status.toLowerCase() === currentFilter.toLowerCase();
            });

        if (!filtered.length) {
            container.innerHTML = '<div class="orders-empty-state"><p>No orders found.</p></div>';
            return;
        }

        container.innerHTML = filtered.slice().reverse().map(renderOrderCard).join('');
    }

    function showListView() {
        var listView = document.getElementById('orders-list-view');
        var detailView = document.getElementById('orders-detail-view');
        var title = document.getElementById('orders-modal-title');
        var backBtn = document.getElementById('orders-back-btn');

        if (listView) listView.style.display = '';
        if (detailView) detailView.style.display = 'none';
        if (title) title.textContent = 'My Orders';
        if (backBtn) backBtn.style.display = 'none';
    }

    function showOrderDetail(orderNumber) {
        var order = findOrder(orderNumber);
        if (!order) return;

        var listView = document.getElementById('orders-list-view');
        var detailView = document.getElementById('orders-detail-view');
        var title = document.getElementById('orders-modal-title');
        var backBtn = document.getElementById('orders-back-btn');

        if (listView) listView.style.display = 'none';
        if (detailView) detailView.style.display = 'block';
        if (title) title.textContent = 'Order Details';
        if (backBtn) backBtn.style.display = 'inline-flex';

        var totals = orderTotals(order);
        var shipping = order.shippingInfo || {};
        var paymentLabel = (order.paymentMethod || '—').toUpperCase();

        var itemsHtml = Object.values(order.items || {}).map(function (item) {
            var lineTotal = item.cost * item.qty;
            return (
                '<div class="order-detail-item">' +
                '<div class="order-detail-item-info">' +
                '<div class="order-detail-item-name">' + item.name + '</div>' +
                '<div class="order-detail-item-qty">₱' + item.cost.toFixed(2) + ' × ' + item.qty + '</div>' +
                '</div>' +
                '<div class="order-detail-item-price">' + formatMoney(lineTotal) + '</div>' +
                '</div>'
            );
        }).join('');

        detailView.innerHTML =
            '<div class="order-detail-status-banner">' +
            statusBadge(order.status) +
            '<p class="order-detail-status-msg">' + statusMessage(order.status) + '</p>' +
            renderTimeline(order.status) +
            '</div>' +

            '<section class="order-detail-section">' +
            '<h3 class="order-detail-section-title">📍 Delivery Address</h3>' +
            '<div class="order-detail-address">' +
            '<div class="order-detail-address-name">' + (shipping.fullName || '—') + '</div>' +
            '<div class="order-detail-address-phone">' + (shipping.phone || '—') + '</div>' +
            '<div class="order-detail-address-text">' + (shipping.address || '—') + '</div>' +
            (shipping.notes ? '<div class="order-detail-address-notes">Note: ' + shipping.notes + '</div>' : '') +
            '</div>' +
            '</section>' +

            '<section class="order-detail-section">' +
            '<h3 class="order-detail-section-title">🛍️ Order Items</h3>' +
            '<div class="order-detail-items">' + itemsHtml + '</div>' +
            '</section>' +

            '<section class="order-detail-section">' +
            '<h3 class="order-detail-section-title">💳 Payment Summary</h3>' +
            '<div class="order-detail-summary">' +
            '<div class="order-detail-summary-row"><span>Subtotal</span><span>' + formatMoney(totals.subtotal) + '</span></div>' +
            '<div class="order-detail-summary-row"><span>Delivery Fee</span><span>' + formatMoney(totals.deliveryFee) + '</span></div>' +
            '<div class="order-detail-summary-row order-detail-summary-total"><span>Order Total</span><span>' + totals.total + '</span></div>' +
            '<div class="order-detail-summary-row"><span>Payment Method</span><span>' + paymentLabel + '</span></div>' +
            '<div class="order-detail-summary-row"><span>Payment Status</span><span>' +
            (order.paymentVerified ? '<span class="payment-verified">✓ Verified</span>' : '<span class="payment-pending">⏳ Pending</span>') +
            '</span></div>' +
            '</div>' +
            '</section>' +

            '<section class="order-detail-section order-detail-info">' +
            '<div class="order-detail-info-row"><span>Order Number</span><span>' + order.orderNumber + '</span></div>' +
            '<div class="order-detail-info-row"><span>Order Date</span><span>' + formatDate(order.date) + '</span></div>' +
            '</section>';
    }

    function statusMessage(status) {
        if (status === 'Processing') return 'Your order is being prepared at Kreezby.';
        if (status === 'Shipped') return 'Your order is on the way!';
        if (status === 'Completed') return 'Order delivered. Enjoy your crinkles!';
        return 'Order status: ' + status;
    }

    function filterOrders(filter, element) {
        if (element && element.parentElement) {
            element.parentElement.querySelectorAll('.tab-link').forEach(function (tab) {
                tab.classList.remove('active');
            });
            element.classList.add('active');
        }
        renderOrders(filter);
    }

    function bindOrdersUi() {
        var container = document.getElementById('orders-container');
        if (container && !container.dataset.bound) {
            container.dataset.bound = '1';
            container.addEventListener('click', function (e) {
                var card = e.target.closest('.order-list-card');
                if (card && card.dataset.orderId) {
                    showOrderDetail(card.dataset.orderId);
                }
            });
        }

        var backBtn = document.getElementById('orders-back-btn');
        if (backBtn && !backBtn.dataset.bound) {
            backBtn.dataset.bound = '1';
            backBtn.addEventListener('click', showListView);
        }
    }

    function onOrdersModalOpen() {
        bindOrdersUi();
        showListView();
        renderOrders('all');
        var tabs = document.querySelectorAll('#orders-list-view .tab-link');
        tabs.forEach(function (tab, i) {
            tab.classList.toggle('active', i === 0);
        });
        currentFilter = 'all';
    }

    window.KreezbyCustomerOrders = {
        loadOrders: loadOrders,
        renderOrders: renderOrders,
        filterOrders: filterOrders,
        showOrderDetail: showOrderDetail,
        showListView: showListView,
        onOrdersModalOpen: onOrdersModalOpen
    };

    window.filterOrders = filterOrders;

    document.addEventListener('DOMContentLoaded', bindOrdersUi);
})();
