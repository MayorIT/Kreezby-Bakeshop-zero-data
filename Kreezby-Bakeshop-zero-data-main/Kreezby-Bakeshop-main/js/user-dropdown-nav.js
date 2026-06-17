/**
 * Wires the header user pill (#user-dropdown-trigger / #user-dropdown-menu)
 * used across admin, staff, and retailer module pages.
 */
(function () {
    'use strict';

    function authLoginHref() {
        var path = (window.location && window.location.pathname) ? window.location.pathname : '';
        if (/\/(admin|staff|retailer|customer)\//i.test(path)) return '../auth/log_in.html';
        if (/\/auth\//i.test(path)) return 'log_in.html';
        return 'auth/log_in.html';
    }

    function ensureNavbarSlideLoaded() {
        if (window.KreezbyNavbarSlideLoaded) return;
        if (document.getElementById('kreezby-navbar-slide-script')) return;

        var path = (window.location && window.location.pathname) ? window.location.pathname : '';
        var inSubdir = /\/(admin|staff|retailer|customer)\//i.test(path);
        var src = inSubdir ? '../js/navbar-slide.js' : 'js/navbar-slide.js';

        var s = document.createElement('script');
        s.id = 'kreezby-navbar-slide-script';
        s.src = src;
        s.defer = true;
        document.head.appendChild(s);
    }

    function wireLogoutLinks() {
        document.querySelectorAll('a.dropdown-item, a').forEach(function (link) {
            var text = (link.textContent || '').toLowerCase();
            if (text.indexOf('log out') >= 0 && link.getAttribute('href') && link.getAttribute('href').indexOf('log_in') >= 0) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    try { localStorage.removeItem('kreezby_session'); } catch (err) { /* ignore */ }
                    location.href = authLoginHref();
                });
            }
        });
    }

    function wireUserDropdown() {
        ensureNavbarSlideLoaded();
        var trigger = document.getElementById('user-dropdown-trigger');
        var menu = document.getElementById('user-dropdown-menu');
        if (!trigger || !menu) return;

        trigger.addEventListener('click', function (event) {
            event.stopPropagation();
            menu.classList.toggle('active');
        });

        document.addEventListener('click', function (event) {
            if (!menu.contains(event.target) && event.target !== trigger) {
                menu.classList.remove('active');
            }
        });

        wireLogoutLinks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireUserDropdown);
    } else {
        wireUserDropdown();
    }
})();
