/**
 * Canonical admin sidebar — keeps Dashboard → Stock Level nav identical on every admin page.
 */
(function () {
    'use strict';

    var NAV = [
        { key: 'dashboard', label: 'Dashboard', href: 'admin.html' },
        { key: 'po', label: 'Purchase Order', href: 'po-admin.html' },
        { key: 'receive', label: 'Receiving', href: 'receive-admin.html' },
        { key: 'bo', label: 'Back Order', href: 'bo-admin.html' },
        { key: 'return', label: 'Return/P.O List', href: 'return-admin.html' },
        { key: 'stocks', label: 'Stocks', href: 'stocks-admin.html' },
        { key: 'saleslist', label: 'Sales List', href: 'saleslist-admin.html' },
        { key: 'aiforecast', label: 'AI Forecast', href: 'aiforecast-admin.html' },
        { key: 'alert', label: 'Alert', href: 'alert-admin.html' },
        { key: 'stocklevel', label: 'Stock Level', href: 'stocklevel-admin.html' }
    ];

    function currentFilename() {
        return (location.pathname.split('/').pop() || '').toLowerCase();
    }

    function activeKeyFor(filename) {
        if (!filename || filename === 'admin.html') return 'dashboard';
        if (filename.indexOf('stocklevel') === 0) return 'stocklevel';
        if (filename.indexOf('aiforecast') === 0) return 'aiforecast';
        if (filename === 'po-admin.html') return 'po';
        if (filename === 'receive-admin.html') return 'receive';
        if (filename === 'bo-admin.html') return 'bo';
        if (filename === 'return-admin.html') return 'return';
        if (filename === 'stocks-admin.html') return 'stocks';
        if (filename === 'saleslist-admin.html') return 'saleslist';
        if (filename === 'alert-admin.html') return 'alert';
        if (filename === 'maintenance-admin.html') return 'dashboard';
        if (filename === 'inbox-admin.html') return 'dashboard';
        return '';
    }

    function renderAdminSidebar() {
        if (location.pathname.indexOf('/admin/') === -1) return;

        var filename = currentFilename();
        var activeKey = activeKeyFor(filename);

        document.querySelectorAll('.sidebar-menu-list').forEach(function (ul) {
            ul.innerHTML = NAV.map(function (item) {
                var active = item.key === activeKey ? ' active' : '';
                return '<li class="menu-node-item' + active + '"><a href="' + item.href + '">' + item.label + '</a></li>';
            }).join('');
        });
    }

    document.addEventListener('DOMContentLoaded', renderAdminSidebar);

    window.KreezbyAdminSidebar = { render: renderAdminSidebar, NAV: NAV };
})();
