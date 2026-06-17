/**
 * PaymentMethodSelector — vanilla port of PaymentMethodSelector (framer-motion / shadcn).
 */
(function () {
    'use strict';

    if (window.KreezbyPaymentMethodSelectorLoaded) return;
    window.KreezbyPaymentMethodSelectorLoaded = true;

    function selectItem(root, item, opts) {
        opts = opts || {};
        var id = item.getAttribute('data-payment-id');
        root.querySelectorAll('[data-payment-id]').forEach(function (el) {
            var active = el === item;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-checked', active ? 'true' : 'false');
            el.setAttribute('tabindex', active ? '0' : '-1');
        });
        root.dataset.selectedId = id;
        if (!opts.silent) {
            root.dispatchEvent(new CustomEvent('paymentchange', {
                bubbles: true,
                detail: { id: id }
            }));
        }
    }

    function initRoot(root) {
        if (root.dataset.pmsBound === '1') return;
        root.dataset.pmsBound = '1';

        var items = root.querySelectorAll('[data-payment-id]');
        if (!items.length) return;

        var defaultId = root.getAttribute('data-default-id');
        var initial = defaultId;
        if (!initial || !root.querySelector('[data-payment-id="' + defaultId + '"]')) {
            initial = items[0].getAttribute('data-payment-id');
        }

        items.forEach(function (item) {
            item.setAttribute('role', 'radio');

            item.addEventListener('click', function () {
                selectItem(root, item);
            });

            item.addEventListener('keydown', function (e) {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    selectItem(root, item);
                }
            });
        });

        var addBtn = root.querySelector('[data-payment-add]');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                if (typeof window.toast === 'function') {
                    window.toast('Adding payment methods is not available in this demo.', 'info');
                } else {
                    alert('Adding payment methods is not available in this demo.');
                }
            });
        }

        var initialItem = root.querySelector('[data-payment-id="' + initial + '"]');
        if (initialItem) selectItem(root, initialItem, { silent: true });
    }

    function init() {
        document.querySelectorAll('[data-payment-selector]').forEach(initRoot);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.KreezbyPaymentMethodSelector = { init: init, initRoot: initRoot };
})();
