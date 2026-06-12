/**
 * Staff inbox — enforce retailer chat permission from admin settings.
 */
(function () {
    'use strict';

    var canRetailer = false;
    var activeChannel = 'staff';

    function permissionsApi() {
        return window.KreezbyStaffPermissions;
    }

    function getThreadChannel(card) {
        return card.getAttribute('data-channel') || 'internal';
    }

    function isRetailerChannel(channel) {
        return channel === 'retailer';
    }

    function selectThread(card) {
        document.querySelectorAll('.thread-item-card').forEach(function (item) {
            item.classList.remove('selected-active');
        });
        card.classList.add('selected-active');

        activeChannel = getThreadChannel(card);
        var name = card.querySelector('.thread-client-name');
        var title = document.querySelector('.header-active-client-title');
        var status = document.querySelector('.header-active-client-status');

        if (title && name) {
            title.textContent = name.textContent;
        }
        if (status) {
            if (isRetailerChannel(activeChannel)) {
                status.textContent = canRetailer ? '● Retailer channel' : '● Retailer channel (read-only)';
            } else {
                status.textContent = '● Active Now';
            }
        }

        applyComposerState();
    }

    function firstVisibleThread() {
        var cards = document.querySelectorAll('.thread-item-card');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].style.display !== 'none') {
                return cards[i];
            }
        }
        return null;
    }

    function applyThreadVisibility() {
        var cards = document.querySelectorAll('.thread-item-card');
        var visibleCount = 0;

        cards.forEach(function (card) {
            var channel = getThreadChannel(card);
            var hide = isRetailerChannel(channel) && !canRetailer;
            card.style.display = hide ? 'none' : '';
            if (!hide) visibleCount += 1;
        });

        var selected = document.querySelector('.thread-item-card.selected-active');
        if (!selected || selected.style.display === 'none') {
            var fallback = firstVisibleThread();
            if (fallback) {
                selectThread(fallback);
            }
        }

        var empty = document.getElementById('inbox-threads-empty');
        if (empty) {
            empty.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    function applyComposerState() {
        var footer = document.querySelector('.chat-composition-footer-bar');
        var input = document.getElementById('chat-type-input');
        var sendBtn = document.querySelector('.btn-send-message-action');
        var attachBtn = document.querySelector('.btn-attachment-trigger');
        var banner = document.getElementById('inbox-retailer-access-banner');
        var readOnly = isRetailerChannel(activeChannel) && !canRetailer;

        if (banner) {
            banner.style.display = readOnly ? 'block' : 'none';
        }
        if (input) {
            input.disabled = readOnly;
            input.placeholder = readOnly
                ? 'Retailer replies are disabled for your account. Contact your administrator.'
                : 'Type your response message here...';
        }
        if (sendBtn) sendBtn.disabled = readOnly;
        if (attachBtn) attachBtn.disabled = readOnly;
        if (footer) footer.classList.toggle('composer-readonly', readOnly);
    }

    function bindThreadClicks() {
        document.querySelectorAll('.thread-item-card').forEach(function (card) {
            card.addEventListener('click', function () {
                selectThread(card);
            });
        });
    }

    function init() {
        var api = permissionsApi();
        if (!api) return;

        canRetailer = api.staffCanAccessRetailerInbox();
        bindThreadClicks();
        applyThreadVisibility();

        var selected = document.querySelector('.thread-item-card.selected-active') || firstVisibleThread();
        if (selected) {
            selectThread(selected);
        } else {
            applyComposerState();
        }
    }

    window.KreezbyStaffInbox = {
        init: init,
        canAccessRetailerInbox: function () { return canRetailer; }
    };

    document.addEventListener('DOMContentLoaded', init);
})();
