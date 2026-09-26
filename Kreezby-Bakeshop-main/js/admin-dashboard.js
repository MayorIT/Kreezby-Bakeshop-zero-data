/**
 * Admin home dashboard: live counts, module search, header controls.
 */
(function () {
    'use strict';

    function readJson(key, fallback) {
        try {
            var value = JSON.parse(localStorage.getItem(key) || 'null');
            return value == null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function countOrders() {
        var orders = readJson('kreezbyOrders', []);
        return Array.isArray(orders) ? orders.length : 0;
    }

    function fillDate(root) {
        var node = root.querySelector('#admin-dashboard-date');
        if (!node) return;
        try {
            node.textContent = new Date().toLocaleDateString('en-PH', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            node.textContent = new Date().toDateString();
        }
    }

    function fillCounts(root) {
        var orders = countOrders();
        root.querySelectorAll('[data-order-tracking-count]').forEach(function (el) {
            el.textContent = String(orders);
        });
        if (window.KreezbyOrderTracking && typeof window.KreezbyOrderTracking.updateDashboardCounts === 'function') {
            try { window.KreezbyOrderTracking.updateDashboardCounts(); } catch (e) {}
        }
    }

    function bindSearch(root) {
        var input = root.querySelector('#admin-module-search');
        var grid = root.querySelector('#admin-module-grid');
        var empty = root.querySelector('#admin-modules-empty');
        if (!input || !grid) return;
        if (input.dataset.bound === '1') return;
        input.dataset.bound = '1';

        function applyFilter() {
            var query = String(input.value || '').trim().toLowerCase();
            var visible = 0;
            grid.querySelectorAll('.admin-module-card').forEach(function (card) {
                var haystack = (card.getAttribute('data-module') || '') + ' ' + (card.textContent || '');
                var show = !query || haystack.toLowerCase().indexOf(query) !== -1;
                card.hidden = !show;
                if (show) visible += 1;
            });
            if (empty) empty.hidden = visible > 0;
        }

        input.addEventListener('input', applyFilter);
        input.addEventListener('search', applyFilter);
        applyFilter();
    }

    function revealNotificationBell() {
        var root = document.querySelector('.notification-popover-root');
        var btn = document.querySelector('.notification-popover-btn, .notification-pill');
        if (root) root.style.display = '';
        if (btn) btn.hidden = false;
    }

    function boot() {
        var root = document.getElementById('admin-dashboard-root');
        if (root) {
            fillDate(root);
            fillCounts(root);
            bindSearch(root);
        }
        revealNotificationBell();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.addEventListener('pageshow', boot);
    document.addEventListener('turbo:load', boot);
    document.addEventListener('turbo:frame-load', boot);
    document.addEventListener('kreezby:page-load', boot);
})();
