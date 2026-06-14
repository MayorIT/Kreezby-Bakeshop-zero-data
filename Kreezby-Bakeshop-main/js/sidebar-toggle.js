(function () {
    const body = document.body;
    const collapsedClass = 'sidebar-collapsed';
    const actionMenuScriptId = 'kreezby-action-menu-script';

    function isPoReceivePortalPage() {
        return !!(
            document.body.getAttribute('data-kreezby-portal') ||
            document.getElementById('po-retailer-directory-block') ||
            document.getElementById('po-master-lists-container-block') ||
            document.getElementById('receiving-retailer-directory-panel-view') ||
            document.getElementById('receiving-master-directory-panel-view') ||
            document.getElementById('bo-retailer-dashboard-view') ||
            document.getElementById('bo-master-dashboard-split-view')
        );
    }

    function ensureActionMenuScriptLoaded() {
        if (isPoReceivePortalPage()) return;
        // Avoid double-loading when pages already include it.
        if (document.getElementById(actionMenuScriptId)) return;
        if (window.KreezbyActionMenuLoaded) return;

        const path = (window.location && window.location.pathname) ? window.location.pathname : '';
        let src = 'js/action-menu.js';
        if (/\/retailer\/[^/]+\//i.test(path)) src = '../../js/action-menu.js';
        else if (/\/(admin|staff|customer)\//i.test(path)) src = '../js/action-menu.js';
        const ref = document.querySelector('script[src*="/js/po-admin.js"], script[src*="/js/receive-admin.js"], script[src*="/js/bo-admin.js"], script[src*="/js/sidebar-toggle.js"]');
        if (ref && ref.getAttribute('src')) {
            src = ref.getAttribute('src').replace(/[^/]+$/, 'action-menu.js');
        }

        const s = document.createElement('script');
        s.id = actionMenuScriptId;
        s.src = src;
        s.defer = true;
        s.onload = function () { window.KreezbyActionMenuLoaded = true; };
        document.head.appendChild(s);
    }

    function toggleSidebar() {
        const isCollapsed = body.classList.toggle(collapsedClass);
        try {
            localStorage.setItem('kreezbySidebarCollapsed', isCollapsed ? '1' : '0');
        } catch (e) {}
        // update any header toggle's aria-pressed
        const btn = document.querySelector('.hamburger-toggle');
        if (btn) btn.setAttribute('aria-pressed', !!isCollapsed);
    }

    function addToggleButton() {
        const topNav = document.querySelector('.top-navbar-node .top-nav-links-right');
        const sidebar = document.querySelector('aside.sidebar-panel, aside.dark-sidebar-panel');
        if (!topNav || !sidebar) return;

        if (topNav.querySelector('.hamburger-toggle')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hamburger-toggle';
        button.setAttribute('aria-label', 'Toggle sidebar');
        button.innerHTML = '☰';
        // set pressed state from localStorage if applicable
        try {
            const stored = localStorage.getItem('kreezbySidebarCollapsed');
            if (stored === '1') button.setAttribute('aria-pressed', 'true');
            else button.setAttribute('aria-pressed', 'false');
        } catch (e) {
            button.setAttribute('aria-pressed', 'false');
        }
        button.addEventListener('click', toggleSidebar);

        // place the toggle at the right end of the header controls
        topNav.appendChild(button);
    }

    function wireExistingRows() {
        const rows = document.querySelectorAll('.hamburger-row');
        rows.forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', toggleSidebar);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        ensureActionMenuScriptLoaded();

        // apply stored collapsed state if present
        try {
            const stored = localStorage.getItem('kreezbySidebarCollapsed');
            if (stored === '1') document.body.classList.add(collapsedClass);
        } catch (e) {}

        addToggleButton();
        wireExistingRows();
    });
})();
