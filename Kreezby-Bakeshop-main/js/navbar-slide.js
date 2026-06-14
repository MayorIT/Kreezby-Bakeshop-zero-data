/**
 * Sliding underline transition for `.top-navbar-node` links.
 * Works across admin/staff/retailer/customer pages that use:
 * - `.top-navbar-node`
 * - `.top-nav-links-right`
 * - `.top-nav-item` (anchors)
 */
(function () {
    'use strict';

    if (window.KreezbyNavbarSlideLoaded) return;
    window.KreezbyNavbarSlideLoaded = true;

    function ensureCss() {
        if (document.getElementById('kreezby-navbar-slide-style')) return;
        var style = document.createElement('style');
        style.id = 'kreezby-navbar-slide-style';
        style.textContent = `
            .top-nav-links-right { position: relative; }
            /* Active link highlight (yellow background) */
            a.top-nav-item.kreezby-nav-active {
                background: #ffeb3b !important;
                color: #3e2723 !important;
                border-radius: 999px;
                padding-left: 12px;
                padding-right: 12px;
                transition: background 200ms ease, color 200ms ease;
            }
            .kreezby-nav-underline {
                position: absolute;
                height: 3px;
                border-radius: 3px;
                background: currentColor;
                opacity: .95;
                bottom: -6px;
                left: 0;
                width: 0;
                transform: translateX(0);
                transition: transform 240ms cubic-bezier(.2,.8,.2,1), width 240ms cubic-bezier(.2,.8,.2,1), opacity 140ms ease;
                pointer-events: none;
            }
            .top-nav-links-right:hover .kreezby-nav-underline { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    function getLinks(container) {
        return Array.prototype.slice.call(container.querySelectorAll('a.top-nav-item'));
    }

    function isVisible(el) {
        return !!(el && el.offsetParent !== null);
    }

    function pickActiveLink(links) {
        var path = (location.pathname || '').split('/').pop() || '';
        var best = null;
        links.forEach(function (a) {
            var href = (a.getAttribute('href') || '').split('/').pop().split('?')[0];
            if (!href) return;
            if (href === path) best = a;
        });
        return best || links[0] || null;
    }

    function setActiveLink(links, active) {
        links.forEach(function (a) {
            a.classList.remove('kreezby-nav-active');
            // Some pages hardcode `home-badge` on Home; move it too so the highlight doesn't "stick".
            if (a.classList.contains('home-badge')) a.classList.remove('home-badge');
        });
        if (active) {
            active.classList.add('kreezby-nav-active');
            // Keep compatibility with existing CSS that styles `.home-badge` as the active pill.
            active.classList.add('home-badge');
        }
    }

    function positionUnderline(underline, container, link) {
        if (!link || !isVisible(link)) {
            underline.style.width = '0px';
            return;
        }
        var cRect = container.getBoundingClientRect();
        var lRect = link.getBoundingClientRect();
        var x = Math.max(0, lRect.left - cRect.left);
        underline.style.transform = 'translateX(' + x + 'px)';
        underline.style.width = Math.max(8, lRect.width) + 'px';
    }

    function wireContainer(container) {
        if (!container || container.querySelector('.kreezby-nav-underline')) return;
        var links = getLinks(container).filter(isVisible);
        if (!links.length) return;

        var underline = document.createElement('div');
        underline.className = 'kreezby-nav-underline';
        container.appendChild(underline);

        var active = pickActiveLink(links);
        setActiveLink(links, active);
        positionUnderline(underline, container, active);

        links.forEach(function (a) {
            a.addEventListener('mouseenter', function () {
                positionUnderline(underline, container, a);
            });
            a.addEventListener('focus', function () {
                positionUnderline(underline, container, a);
            });
            a.addEventListener('click', function () {
                // Move the yellow background highlight immediately on click.
                active = a;
                setActiveLink(links, active);
                positionUnderline(underline, container, active);
            });
        });

        container.addEventListener('mouseleave', function () {
            positionUnderline(underline, container, active);
        });

        window.addEventListener('resize', function () {
            positionUnderline(underline, container, active);
        });
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
})();

