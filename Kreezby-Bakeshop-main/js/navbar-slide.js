/**
 * Expandable icon tabs for `.top-navbar-node` navigation links.
 * Vanilla port of the ExpandableTabs pattern (icon-only → label on select).
 */
(function () {
    'use strict';

    if (window.KreezbyNavbarSlideLoaded) return;
    window.KreezbyNavbarSlideLoaded = true;

    var ICONS = {
        home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9 20v-6h6v6"/></svg>',
        maintenance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
        default: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    };

    function moduleRelativeRoot() {
        var path = (window.location && window.location.pathname) ? window.location.pathname.replace(/\\/g, '/') : '';
        var parts = path.split('/').filter(Boolean);
        if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) parts.pop();

        var roots = ['admin', 'staff', 'retailer', 'customer', 'wholesaler'];
        var rootIdx = -1;
        for (var i = parts.length - 1; i >= 0; i--) {
            if (roots.indexOf(parts[i].toLowerCase()) >= 0) {
                rootIdx = i;
                break;
            }
        }
        if (rootIdx < 0) return '';

        var depth = parts.length - rootIdx - 1;
        var prefix = '';
        for (var d = 0; d <= depth; d++) prefix += '../';
        return prefix;
    }

    function ensureCss() {
        if (document.getElementById('kreezby-expandable-nav-style')) return;

        var href = moduleRelativeRoot() + 'css/shared/expandable-nav-tabs.css';
        var link = document.createElement('link');
        link.id = 'kreezby-expandable-nav-style';
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function pageName() {
        return ((location.pathname || '').split('/').pop() || '').split('?')[0];
    }

    function linkPageName(link) {
        return ((link.getAttribute('href') || '').split('/').pop() || '').split('?')[0];
    }

    function pickIcon(link, label) {
        var href = (link.getAttribute('href') || '').toLowerCase();
        var text = (label || '').toLowerCase();
        var file = href.split('/').pop().split('?')[0];

        if (text.indexOf('maintenance') >= 0 || file.indexOf('maintenance') >= 0) {
            return ICONS.maintenance;
        }
        if (text.indexOf('inbox') >= 0 || file.indexOf('inbox') >= 0) {
            return ICONS.inbox;
        }
        if (text === 'home' || file === 'admin.html' || /^staff(-\d+)?\.html$/.test(file)) {
            return ICONS.home;
        }
        if (/^(retailer|wholesaler)-/.test(file)) {
            return ICONS.home;
        }
        return ICONS.default;
    }

    function enhanceLink(link) {
        if (link.classList.contains('expandable-nav-tab')) return;
        var label = (link.textContent || '').trim();
        var icon = pickIcon(link, label);

        link.textContent = '';
        link.classList.remove('top-nav-item', 'home-badge');
        link.classList.add('expandable-nav-tab');

        var iconSpan = document.createElement('span');
        iconSpan.className = 'expandable-nav-tab__icon';
        iconSpan.innerHTML = icon;

        var labelSpan = document.createElement('span');
        labelSpan.className = 'expandable-nav-tab__label';
        labelSpan.textContent = label;

        link.appendChild(iconSpan);
        link.appendChild(labelSpan);
        link.setAttribute('title', label);
    }

    function setExpanded(tabs, index) {
        tabs.forEach(function (tab, i) {
            tab.classList.toggle('is-expanded', index === i);
        });
    }

    function pickActiveIndex(tabs) {
        var current = pageName();
        var found = -1;

        tabs.forEach(function (tab, i) {
            if (linkPageName(tab) === current) found = i;
        });

        return found;
    }

    function bindWrapInteractions(wrap) {
        if (!wrap || wrap.dataset.navBound === '1') return;
        wrap.dataset.navBound = '1';

        wrap.addEventListener('click', function (event) {
            var tab = event.target.closest('.expandable-nav-tab');
            if (!tab || !wrap.contains(tab)) return;

            var tabs = Array.prototype.slice.call(wrap.querySelectorAll('.expandable-nav-tab'));
            var index = tabs.indexOf(tab);
            if (index < 0) return;

            if (tab.classList.contains('is-expanded') && linkPageName(tab) === pageName()) {
                event.preventDefault();
                return;
            }

            tabs.forEach(function (t, i) {
                t.classList.toggle('is-expanded', i === index);
            });
        });

        document.addEventListener('click', function (event) {
            if (wrap.contains(event.target)) return;
            refreshTabs(wrap);
        });
    }

    function wireContainer(container) {
        if (!container) return;

        var wrap = container.querySelector('.expandable-nav-tabs');
        var orphanLinks = Array.prototype.slice.call(
            container.querySelectorAll(':scope > a.top-nav-item')
        );

        if (wrap && orphanLinks.length) {
            orphanLinks.forEach(function (link) {
                enhanceLink(link);
                wrap.appendChild(link);
            });
            bindWrapInteractions(wrap);
            refreshTabs(wrap);
            return;
        }

        if (wrap) return;

        var links = Array.prototype.slice.call(container.querySelectorAll('a.top-nav-item'));
        if (!links.length) return;

        wrap = document.createElement('div');
        wrap.className = 'expandable-nav-tabs';
        container.insertBefore(wrap, links[0]);

        links.forEach(function (link) {
            enhanceLink(link);
            wrap.appendChild(link);
        });

        bindWrapInteractions(wrap);
        refreshTabs(wrap);
    }

    function refreshTabs(wrap) {
        var tabs = Array.prototype.slice.call(wrap.querySelectorAll('.expandable-nav-tab'));
        var activeIndex = pickActiveIndex(tabs);
        var selectedIndex = activeIndex >= 0 ? activeIndex : null;

        tabs.forEach(function (tab, i) {
            tab.classList.toggle('is-active', i === activeIndex);
            if (i === activeIndex) tab.setAttribute('aria-current', 'page');
            else tab.removeAttribute('aria-current');
        });

        setExpanded(tabs, selectedIndex);
    }

    function init() {
        ensureCss();
        document.querySelectorAll('.top-navbar-node .top-nav-links-right').forEach(wireContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('kreezby-staff-permissions-ready', init);
    document.addEventListener('kreezby:page-load', init);

    window.KreezbyNavbarSlide = { init: init };
})();
