(function () {
    'use strict';

    var alertsData = [
        { id: 1, source: 'CRK-MNG-J', timestamp: '2026-05-16 14:20', message: 'Mango Crinkles stock levels dropped below the safety threshold value. Current: 45 Jars.', severity: 'Critical' },
        { id: 2, source: 'CRK-LEM-P', timestamp: '2026-05-16 11:05', message: 'Lemon Crinkles stock levels reaching warning limit limits. Current: 85 Pouches.', severity: 'Warning' },
        { id: 3, source: 'PO-0005', timestamp: '2026-05-15 09:12', message: 'Back Order processing generated automatically by AI system metrics loops for missing batch lines.', severity: 'Info' },
        { id: 4, source: 'RET-0001', timestamp: '2026-05-14 16:45', message: 'Return Order request submitted to active log queues from Retailer 102. Action required.', severity: 'Warning' }
    ];

    function showAlertNote(message) {
        var note = document.getElementById('alert-action-note');
        if (!note) return;
        note.hidden = false;
        note.textContent = message;
    }

    function applyAlertFilters() {
        var search = document.getElementById('alert-search');
        var entries = document.getElementById('entries-selector');
        var empty = document.getElementById('alert-empty');
        var q = (search && search.value ? search.value : '').trim().toLowerCase();
        var limit = entries ? parseInt(entries.value, 10) : 10;
        if (!limit || limit < 1) limit = 10;
        var shown = 0;
        document.querySelectorAll('#alert-log-body tr').forEach(function (row) {
            var match = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
            if (match && shown < limit) {
                row.hidden = false;
                shown += 1;
            } else {
                row.hidden = true;
            }
        });
        if (empty) empty.hidden = shown !== 0;
    }

    function openAlertModal(alertId) {
        var heading = document.querySelector('#alert-modal-overlay h2');
        if (heading) heading.textContent = 'Alert Details';
        var threshold = document.getElementById('alert-threshold');
        if (threshold) threshold.hidden = true;
        var alert = null;
        for (var i = 0; i < alertsData.length; i++) {
            if (alertsData[i].id === alertId) { alert = alertsData[i]; break; }
        }
        if (!alert) return;
        document.getElementById('modal-alert-id').textContent = alert.source;
        document.getElementById('modal-alert-timestamp').textContent = alert.timestamp;
        document.getElementById('modal-alert-message').textContent = alert.message;
        var severityElement = document.getElementById('modal-alert-severity');
        severityElement.textContent = alert.severity.toUpperCase();
        severityElement.className = 'alert-detail-badge severity-badge ' + alert.severity.toLowerCase();
        document.getElementById('alert-modal-overlay').classList.add('active');
    }

    function closeAlertModal() {
        var overlay = document.getElementById('alert-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    function toggleAlertActionMenu(event, popupElementId) {
        if (event) event.stopPropagation();
        document.querySelectorAll('.alert-log-card .action-popup-menu').forEach(function (menu) {
            if (menu.id !== popupElementId) menu.classList.remove('active');
        });
        var targetMenu = document.getElementById(popupElementId);
        if (!targetMenu) return;
        var opening = !targetMenu.classList.contains('active');
        targetMenu.classList.toggle('active');
        if (opening) targetMenu.style.removeProperty('display');
    }

    function handleAlertTrigger(action, context, event) {
        if (event && event.stopPropagation) event.stopPropagation();
        document.querySelectorAll('.action-popup-menu.active').forEach(function (menu) {
            menu.classList.remove('active');
        });
        var row = document.querySelector('#alert-log-body tr[data-context="' + context + '"]');
        var alertId = row ? parseInt(row.getAttribute('data-alert-id'), 10) : 0;
        if (action === 'dismiss') {
            if (row) {
                row.classList.add('is-dismissed-row');
                var badge = row.querySelector('.severity-badge');
                if (badge) {
                    badge.className = 'severity-badge dismissed';
                    badge.textContent = 'Dismissed';
                }
            }
            if (context === 'Mango Crinkles') {
                var banner = document.querySelector('#admin-alert-banners .kreezby-alert--destructive');
                if (banner) banner.classList.add('is-dismissed');
            }
            showAlertNote(context + ' was dismissed. Action stays available if you need it again.');
            return;
        }
        if (action === 'restock') {
            var params = new URLSearchParams({
                restock: '1',
                item: context,
                code: row ? (row.getAttribute('data-code') || '') : '',
                unit: row ? (row.getAttribute('data-unit') || 'PCS') : 'PCS',
                qty: row ? (row.getAttribute('data-qty') || '100') : '100'
            });
            window.location.href = 'po-admin.html?' + params.toString();
            return;
        }
        if (action === 'view') {
            var target = row ? (row.getAttribute('data-target') || context) : context;
            var page = String(target).indexOf('RET') === 0 ? 'return-admin.html' : 'bo-admin.html';
            window.location.href = page + '?open=' + encodeURIComponent(target);
            return;
        }
        if (action === 'modify') {
            openAlertModal(alertId);
            var heading = document.querySelector('#alert-modal-overlay h2');
            if (heading) heading.textContent = 'Adjust safety threshold';
            var box = document.getElementById('alert-threshold');
            var input = document.getElementById('alert-threshold-input');
            if (box) {
                box.hidden = false;
                box.setAttribute('data-context', context);
            }
            if (input) input.value = row && row.getAttribute('data-threshold') ? row.getAttribute('data-threshold') : '100';
        }
    }

    function saveAlertThreshold() {
        var box = document.getElementById('alert-threshold');
        var input = document.getElementById('alert-threshold-input');
        if (!box || !input) return;
        var context = box.getAttribute('data-context') || 'this item';
        var value = String(input.value || '').trim();
        if (!value) return;
        var row = document.querySelector('#alert-log-body tr[data-context="' + context + '"]');
        if (row) row.setAttribute('data-threshold', value);
        if (row && row.cells[3]) {
            var item = row.cells[2] ? row.cells[2].textContent.trim() : context;
            row.cells[3].textContent = item + ' safety threshold updated to ' + value + '.';
        }
        showAlertNote('Threshold for ' + context + ' set to ' + value + '.');
        closeAlertModal();
    }

    function bindOnce(el, key, type, handler) {
        if (!el || el.getAttribute(key) === '1') return;
        el.setAttribute(key, '1');
        el.addEventListener(type, handler);
    }

    function boot() {
        if (!document.getElementById('alert-log-body')) return;
        window.toggleAlertActionMenu = toggleAlertActionMenu;
        window.handleAlertTrigger = handleAlertTrigger;
        window.openAlertModal = openAlertModal;
        window.closeAlertModal = closeAlertModal;
        window.__KreezbyAlertAdminBooted = true;

        bindOnce(document.getElementById('alert-search'), 'data-alert-bound', 'input', applyAlertFilters);
        bindOnce(document.getElementById('entries-selector'), 'data-alert-bound', 'change', applyAlertFilters);
        bindOnce(document.getElementById('alert-threshold-save'), 'data-alert-bound', 'click', saveAlertThreshold);
        bindOnce(document.getElementById('alert-modal-overlay'), 'data-alert-bound', 'click', function (event) {
            if (event.target === this) closeAlertModal();
        });
        document.querySelectorAll('#alert-log-body tr').forEach(function (row) {
            bindOnce(row, 'data-alert-bound', 'click', function (event) {
                if (event.target.closest('.action-menu-relative-container')) return;
                openAlertModal(parseInt(row.cells[0].textContent, 10));
            });
        });

        if (!window.__kreezbyAlertDelegated) {
            window.__kreezbyAlertDelegated = true;
            document.addEventListener('click', function (event) {
                if (!document.getElementById('alert-log-body')) return;
                if (event.target.closest('.alert-log-card .action-menu-relative-container')) return;
                document.querySelectorAll('.alert-log-card .action-popup-menu.active').forEach(function (menu) {
                    menu.classList.remove('active');
                });
            });
        }
    }

    window.KreezbyAlertAdmin = { boot: boot };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
