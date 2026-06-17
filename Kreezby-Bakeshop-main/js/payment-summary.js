/**
 * PaymentSummary — vanilla port of PaymentSummary (framer-motion / shadcn).
 */
(function () {
    'use strict';

    if (window.KreezbyPaymentSummaryLoaded) return;
    window.KreezbyPaymentSummaryLoaded = true;

    var PAYMENT_META = {
        gcash: {
            name: 'GCash',
            icon: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" fill="#007dfe"/><path d="M9 18h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>'
        },
        maya: {
            name: 'Maya',
            icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#00d632"/><path d="M7 12h10" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>'
        },
        shopeepay: {
            name: 'ShopeePay',
            icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#ee4d2d"/><path d="M8 9h8M8 12h5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>'
        },
        grabpay: {
            name: 'GrabPay',
            icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#00b14f"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>'
        },
        bpi: {
            name: 'BPI',
            icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#b11116"/><path d="M7 15V9l5-3 5 3v6" stroke="#fff" stroke-width="1.5" fill="none"/></svg>'
        },
        bdo: {
            name: 'BDO',
            icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#003d79"/><path d="M8 15V9h8v6" stroke="#fff" stroke-width="1.5" fill="none"/></svg>'
        }
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderRow(label, value, valueClassName) {
        var valueClass = 'payment-summary__value' + (valueClassName ? ' ' + valueClassName : '');
        return (
            '<div class="payment-summary__row">' +
                '<span class="payment-summary__label">' + escapeHtml(label) + '</span>' +
                '<span class="' + valueClass + '">' + value + '</span>' +
            '</div>'
        );
    }

    function updatePaymentMethod(root, methodId) {
        var iconEl = root.querySelector('[data-ps-payment-icon]');
        var nameEl = root.querySelector('[data-ps-payment-name]');
        var meta = PAYMENT_META[methodId] || { name: 'Not selected', icon: '' };

        if (iconEl) iconEl.innerHTML = meta.icon;
        if (nameEl) nameEl.textContent = meta.name;
        root.dataset.paymentMethod = methodId || '';
    }

    function render(root, options) {
        if (!root) return;

        options = options || {};
        var titleEl = root.querySelector('[data-ps-title]');
        if (titleEl && options.title) titleEl.textContent = options.title;

        if (options.paymentMethod) {
            updatePaymentMethod(root, options.paymentMethod);
        }

        var itemsHost = root.querySelector('[data-ps-items]');
        if (itemsHost && Array.isArray(options.items)) {
            if (!options.items.length) {
                itemsHost.innerHTML = '<p class="payment-summary__empty">Your cart is empty. <a href="customer.html">Go back to shop</a></p>';
            } else {
                itemsHost.innerHTML = '<div class="payment-summary__items">' + options.items.map(function (item) {
                    return renderRow(item.label, item.value, item.valueClassName);
                }).join('') + '</div>';
            }
        }

        var totalLabel = root.querySelector('[data-ps-total-label]');
        var totalValue = root.querySelector('[data-ps-total-value]');
        if (options.total) {
            if (totalLabel) totalLabel.textContent = options.total.label || 'Total';
            if (totalValue) totalValue.textContent = options.total.value || '₱0.00';
        }
    }

    window.KreezbyPaymentSummary = {
        render: render,
        updatePaymentMethod: updatePaymentMethod,
        PAYMENT_META: PAYMENT_META
    };
})();
