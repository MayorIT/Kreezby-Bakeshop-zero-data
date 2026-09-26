/**
 * Settings panel UI inside Maintenance (login history, accounts, staff permissions).
 */
(function () {
    'use strict';

    var currentSettingsSub = 'login-history';
    var selectedStaffPermissionsId = 'staff-1';
    var accountQueries = {
        customers: '',
        retailers: '',
        wholesalers: '',
        archived: ''
    };

    var settingsShellHtml = ''
        + '<div class="settings-section-title">System Settings</div>'
        + '<p class="settings-section-desc">Manage user accounts, login activity, and staff task access.</p>'
        + '<div class="settings-sub-tabs-row" id="settings-sub-tabs">'
        + '<button type="button" class="settings-sub-tab active-sub" data-sub="login-history">Login History</button>'
        + '<button type="button" class="settings-sub-tab" data-sub="permissions">Staff Permissions</button>'
        + '<button type="button" class="settings-sub-tab" data-sub="customers">Customers</button>'
        + '<button type="button" class="settings-sub-tab" data-sub="retailers">Retailers</button>'
        + '<button type="button" class="settings-sub-tab" data-sub="wholesalers">Wholesalers</button>'
        + '<button type="button" class="settings-sub-tab" data-sub="archived">Archived</button>'
        + '</div>'
        + '<div id="settings-sub-content"></div>';

    function badgeClass(type) {
        var t = (type || '').toLowerCase();
        if (t === 'customer') return 'badge-customer';
        if (t === 'retailer') return 'badge-retailer';
        if (t === 'wholesaler') return 'badge-wholesaler';
        if (t === 'staff') return 'badge-staff';
        return 'badge-admin';
    }

    function renderLoginHistory() {
        var history = window.KreezbyMaintenanceSettings.getLoginHistory();
        var rows = history.map(function (log, i) {
            return '<tr><td>' + (i + 1) + '</td><td><strong>' + log.userName + '</strong></td>'
                + '<td><span class="badge-account-type ' + badgeClass(log.accountType) + '">' + log.accountType + '</span></td>'
                + '<td>' + log.identity + '</td><td>' + log.loggedAt + '</td></tr>';
        }).join('');
        return ''
            + '<h4 class="settings-section-title">Login History</h4>'
            + '<p class="settings-section-desc">Recent sign-ins for all users (customers, retailers, wholesalers, staff, and admin).</p>'
            + '<table class="data-display-table"><thead><tr style="background-color:#5d4037;color:#fff;">'
            + '<th style="width:40px;">#</th><th>Full Name</th><th>Account Type</th><th>Email / Username</th><th>Date &amp; Time</th>'
            + '</tr></thead><tbody>' + (rows || '<tr><td colspan="5">No login records yet.</td></tr>') + '</tbody></table>';
    }

    function renderPermissions() {
        return ''
            + '<p class="permissions-intro">Control which menu tasks each staff member can access. Use <strong>Inbox</strong> for the inbox page and <strong>Inbox — Retailer Chats</strong> to allow messaging retailer partners.</p>'
            + '<div class="settings-split-grid">'
            + '<div class="roles-navigator-card">'
            + '<div class="roles-navigator-title">Staff Accounts</div>'
            + '<button type="button" class="role-selection-pill active-role" data-staff-id="staff-1">Claire (Staff 1)<br><span class="staff-task-hint">Frontline</span></button>'
            + '<button type="button" class="role-selection-pill" data-staff-id="staff-2">Staff 2<br><span class="staff-task-hint">Receiving</span></button>'
            + '<button type="button" class="role-selection-pill" data-staff-id="staff-3">Staff 3<br><span class="staff-task-hint">Inventory</span></button>'
            + '<button type="button" class="role-selection-pill" data-staff-id="staff-4">Derek (Staff 4)<br><span class="staff-task-hint">Sales Floor</span></button>'
            + '<button type="button" class="role-selection-pill" data-staff-id="staff-5">Nina (Staff 5)<br><span class="staff-task-hint">Packaging</span></button>'
            + '<button type="button" class="role-selection-pill" data-staff-id="staff-6">Omar (Staff 6)<br><span class="staff-task-hint">Dispatch</span></button>'
            + '<button type="button" class="role-selection-pill" data-staff-id="staff-7">Grace (Staff 7)<br><span class="staff-task-hint">Customer Service</span></button>'
            + '</div>'
            + '<div class="panel-data-card" style="box-shadow:none;border:1px solid #e0e0e0;">'
            + '<div class="panel-card-title-bar"><h3 id="permissions-panel-title">Task Access</h3>'
            + '<button type="button" class="btn-save-permissions" id="btn-save-permissions">Save Permissions</button></div>'
            + '<div class="card-body-padded"><table class="matrix-table"><thead><tr><th>Task / Module</th>'
            + '<th class="center-align">Allow Access</th></tr></thead><tbody id="permissions-matrix-body"></tbody></table></div></div></div>';
    }

    var ARCHIVE_REASONS = {
        customers: [
            'Stopped ordering',
            'Requested account closure',
            'Duplicate account',
            'Unreachable contact'
        ],
        retailers: [
            'Resigned partnership',
            'Store closed',
            'Contract ended',
            'Switched to another supplier'
        ],
        wholesalers: [
            'Resigned partnership',
            'Contract ended',
            'Stopped distribution',
            'Business closed'
        ]
    };

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function accountQuery() {
        return (accountQueries[currentSettingsSub] || '').trim().toLowerCase();
    }

    function matchesAccountQuery(parts) {
        var query = accountQuery();
        if (!query) return true;
        return parts.join(' ').toLowerCase().indexOf(query) !== -1;
    }

    function searchBar(placeholder) {
        return ''
            + '<form class="settings-search-bar" id="settings-search-form" autocomplete="off">'
            + '<input type="text" id="settings-account-search" name="settings-account-filter" placeholder="' + escapeHtml(placeholder) + '" value="' + escapeHtml(accountQueries[currentSettingsSub] || '') + '" aria-label="Search" autocomplete="off" autocorrect="off" spellcheck="false">'
            + '<button type="submit">Search</button>'
            + '</form>';
    }

    function accountActionCell(kind, id) {
        return '<td><button type="button" class="account-action-btn" data-account-kind="' + escapeHtml(kind) + '" data-account-id="' + escapeHtml(id) + '">Action ▾</button></td>';
    }

    var ARCHIVE_ROLES = [
        { kind: 'customers', label: 'Customers', badge: 'badge-customer' },
        { kind: 'retailers', label: 'Retailers', badge: 'badge-retailer' },
        { kind: 'wholesalers', label: 'Wholesalers', badge: 'badge-wholesaler' }
    ];

    function archivedRoleTable(role) {
        var query = accountQuery();
        var rows = window.KreezbyMaintenanceSettings.getArchived(role.kind).filter(function (row) {
            return matchesAccountQuery([row.name, row.email, row.reason, row.archivedAt, role.label]);
        });
        if (query && !rows.length) return '';
        var body = rows.map(function (row, i) {
            return '<tr><td>' + (i + 1) + '</td><td><strong>' + escapeHtml(row.name) + '</strong></td><td>' + escapeHtml(row.email) + '</td><td><span class="archived-reason">' + escapeHtml(row.reason) + '</span></td><td>' + escapeHtml(row.archivedAt) + '</td></tr>';
        }).join('');
        return ''
            + '<section class="archive-role-block archive-role-' + role.kind + '">'
            + '<div class="archive-role-head"><h5>' + role.label + '</h5><span class="badge-account-type ' + role.badge + '">' + rows.length + '</span></div>'
            + '<table class="data-display-table"><thead><tr>'
            + '<th>#</th><th>Name</th><th>Email</th><th>Why archived</th><th>Date</th>'
            + '</tr></thead><tbody>' + (body || '<tr><td colspan="5" class="maintenance-empty">No archived ' + role.label.toLowerCase() + '.</td></tr>') + '</tbody></table></section>';
    }

    function renderArchived() {
        var groups = ARCHIVE_ROLES.map(archivedRoleTable).join('');
        var total = window.KreezbyMaintenanceSettings.getArchived().length;
        var empty = accountQuery() && !groups
            ? '<p class="maintenance-empty">No matching archived accounts.</p>'
            : '';
        return ''
            + '<h4 class="settings-section-title">Archived Accounts</h4>'
            + '<p class="settings-section-desc">Every archived account, grouped by role. ' + total + ' in total.</p>'
            + searchBar('Name, email, role, or reason')
            + '<div class="archive-screen">' + (groups || empty) + '</div>';
    }

    function renderCustomers() {
        var users = window.KreezbyMaintenanceSettings.getUsers();
        var rows = users.customers.filter(function (c) {
            return matchesAccountQuery([c.name, c.email, c.phone, c.joined]);
        }).map(function (c, i) {
            return '<tr><td>' + (i + 1) + '</td><td><strong>' + escapeHtml(c.name) + '</strong></td><td>' + escapeHtml(c.email) + '</td><td>' + escapeHtml(c.phone) + '</td>'
                + '<td>' + escapeHtml(c.joined) + '</td>' + accountActionCell('customers', c.id) + '</tr>';
        }).join('');
        return ''
            + '<h4 class="settings-section-title">Customer Accounts</h4>'
            + '<p class="settings-section-desc">Use Action to upgrade a customer, or archive them with a reason such as stopped ordering or a closure request.</p>'
            + searchBar('Name, email, or phone')
            + '<table class="data-display-table"><thead><tr>'
            + '<th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Action</th>'
            + '</tr></thead><tbody>' + (rows || '<tr><td colspan="6">No matching customer accounts.</td></tr>') + '</tbody></table>';
    }

    function renderRetailers() {
        var list = window.KreezbyMaintenanceSettings.getUsers().retailers.filter(function (r) {
            return matchesAccountQuery([r.name, r.contact, r.email, r.area]);
        });
        var rows = list.map(function (r, i) {
            return '<tr><td>' + (i + 1) + '</td><td><strong>' + escapeHtml(r.name) + '</strong></td><td>' + escapeHtml(r.contact) + '</td><td>' + escapeHtml(r.email) + '</td><td>' + escapeHtml(r.area) + '</td>' + accountActionCell('retailers', r.id) + '</tr>';
        }).join('');
        return ''
            + '<h4 class="settings-section-title">Retailer Accounts</h4>'
            + '<p class="settings-section-desc">Partner stores. Archive a retailer when they resign, close, or end the contract.</p>'
            + searchBar('Business, contact, email, or area')
            + '<table class="data-display-table"><thead><tr>'
            + '<th>#</th><th>Business Name</th><th>Contact</th><th>Email</th><th>Area</th><th>Action</th>'
            + '</tr></thead><tbody>' + (rows || '<tr><td colspan="6">No matching retailer accounts.</td></tr>') + '</tbody></table>';
    }

    function renderWholesalers() {
        var list = window.KreezbyMaintenanceSettings.getUsers().wholesalers.filter(function (w) {
            return matchesAccountQuery([w.name, w.contact, w.email, w.area]);
        });
        var rows = list.map(function (w, i) {
            return '<tr><td>' + (i + 1) + '</td><td><strong>' + escapeHtml(w.name) + '</strong></td><td>' + escapeHtml(w.contact) + '</td><td>' + escapeHtml(w.email) + '</td><td>' + escapeHtml(w.area) + '</td>' + accountActionCell('wholesalers', w.id) + '</tr>';
        }).join('');
        return ''
            + '<h4 class="settings-section-title">Wholesaler Accounts</h4>'
            + '<p class="settings-section-desc">Bulk distributors. Archive a wholesaler when they resign, stop distribution, or close the business.</p>'
            + searchBar('Business, contact, email, or area')
            + '<table class="data-display-table"><thead><tr>'
            + '<th>#</th><th>Business Name</th><th>Contact</th><th>Email</th><th>Area</th><th>Action</th>'
            + '</tr></thead><tbody>' + (rows || '<tr><td colspan="6">No matching wholesaler accounts.</td></tr>') + '</tbody></table>';
    }

    function closeAccountMenu() {
        var menu = document.getElementById('account-archive-menu');
        if (menu) menu.remove();
    }

    function openAccountMenu(button) {
        closeAccountMenu();
        var kind = button.getAttribute('data-account-kind');
        var id = button.getAttribute('data-account-id');
        var reasons = ARCHIVE_REASONS[kind] || [];
        var menu = document.createElement('div');
        menu.id = 'account-archive-menu';
        menu.className = 'account-archive-menu';
        var html = '';
        if (kind === 'customers') {
            html += '<button type="button" data-account-action="upgrade" data-role="retailer">Upgrade to Retailer</button>';
            html += '<button type="button" data-account-action="upgrade" data-role="wholesaler">Upgrade to Wholesaler</button>';
        }
        html += '<p class="account-archive-label">Archive because</p>';
        reasons.forEach(function (reason) {
            html += '<button type="button" data-account-action="archive" data-reason="' + escapeHtml(reason) + '">' + escapeHtml(reason) + '</button>';
        });
        menu.innerHTML = html;
        document.body.appendChild(menu);
        var rect = button.getBoundingClientRect();
        var top = rect.bottom + 6;
        if (top + menu.offsetHeight > window.innerHeight - 12) top = Math.max(12, rect.top - menu.offsetHeight - 6);
        menu.style.top = top + 'px';
        menu.style.left = Math.max(12, rect.right - menu.offsetWidth) + 'px';
        menu.onclick = function (event) {
            var choice = event.target.closest('button');
            if (!choice) return;
            var action = choice.getAttribute('data-account-action');
            closeAccountMenu();
            if (action === 'upgrade') {
                upgradeCustomer(id, choice.getAttribute('data-role'));
                return;
            }
            if (action !== 'archive') return;
            var reason = choice.getAttribute('data-reason');
            if (!confirm('Archive this account?\n\nReason: ' + reason)) return;
            var result = KreezbyMaintenanceSettings.archiveAccount(kind, id, reason);
            if (!result.ok) {
                alert(result.message);
                return;
            }
            refreshMetrics();
            renderSettingsSub(kind);
        };
    }

    function initStaffPermissionsPanel() {
        if (!window.KreezbyStaffPermissions) return;
        var root = document.getElementById('settings-sub-content');
        if (!root) return;
        KreezbyStaffPermissions.initPermissionsEditor(root);
    }

    function renderSettingsSub(subKey) {
        currentSettingsSub = subKey;
        var root = document.getElementById('settings-sub-content');
        if (!root) return;

        document.querySelectorAll('.settings-sub-tab').forEach(function (btn) {
            btn.classList.toggle('active-sub', btn.getAttribute('data-sub') === subKey);
        });

        if (subKey === 'login-history') root.innerHTML = renderLoginHistory();
        else if (subKey === 'permissions') { root.innerHTML = renderPermissions(); initStaffPermissionsPanel(); }
        else if (subKey === 'customers') root.innerHTML = renderCustomers();
        else if (subKey === 'retailers') root.innerHTML = renderRetailers();
        else if (subKey === 'wholesalers') root.innerHTML = renderWholesalers();
        else if (subKey === 'archived') root.innerHTML = renderArchived();
        bindAccountSearch();
    }

    function applyAccountQuery(rawValue, caret) {
        accountQueries[currentSettingsSub] = rawValue;
        renderSettingsSub(currentSettingsSub);
        var next = document.getElementById('settings-account-search');
        if (!next) return;
        next.focus();
        var pos = typeof caret === 'number' ? caret : next.value.length;
        if (pos > next.value.length) pos = next.value.length;
        if (next.setSelectionRange) next.setSelectionRange(pos, pos);
    }

    function bindAccountSearch() {
        var form = document.getElementById('settings-search-form');
        var input = document.getElementById('settings-account-search');
        if (!form || !input || form.getAttribute('data-search-bound') === '1') return;
        form.setAttribute('data-search-bound', '1');
        var composing = false;
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            applyAccountQuery(input.value, input.value.length);
        });
        input.addEventListener('compositionstart', function () {
            composing = true;
        });
        input.addEventListener('compositionend', function () {
            composing = false;
            applyAccountQuery(input.value, input.selectionStart);
        });
        input.addEventListener('input', function () {
            if (composing) return;
            applyAccountQuery(input.value, input.selectionStart);
        });
    }

    function initSettingsPanel(startSub) {
        var rootWorkspace = document.getElementById('maintenance-grid-workspace-root');
        if (!rootWorkspace) return;
        rootWorkspace.innerHTML = settingsShellHtml.replace(/<motion/g, '<div').replace(/<\/motion>/g, '</div>');

        document.querySelectorAll('.settings-sub-tab').forEach(function (btn) {
            btn.onclick = function () {
                var next = btn.getAttribute('data-sub');
                if (Object.prototype.hasOwnProperty.call(accountQueries, currentSettingsSub)) {
                    accountQueries[currentSettingsSub] = '';
                }
                renderSettingsSub(next);
            };
        });

        renderSettingsSub(startSub || 'login-history');
    }

    function refreshMetrics() {
        if (!window.KreezbyMaintenanceSettings) return;
        var c = KreezbyMaintenanceSettings.getAccountCounts();
        var el;
        el = document.getElementById('metric-customers-count'); if (el) el.textContent = c.customers;
        el = document.getElementById('metric-retailers-count'); if (el) el.textContent = c.retailers;
        el = document.getElementById('metric-wholesalers-count'); if (el) el.textContent = c.wholesalers;
    }

    function upgradeCustomer(customerId, role) {
        var label = role === 'retailer' ? 'Retailer' : 'Wholesaler';
        if (!confirm('Upgrade this customer to ' + label + '?\n\nTheir customer account will be removed. They will only have ' + label.toLowerCase() + ' portal access.')) return;
        var result = KreezbyMaintenanceSettings.upgradeCustomerToRole(customerId, role);
        alert(result.message);
        if (result.ok) {
            refreshMetrics();
            renderSettingsSub('customers');
        }
    }

    window.KreezbyMaintenanceUI = {
        initSettingsPanel: initSettingsPanel,
        refreshMetrics: refreshMetrics,
        upgradeCustomer: upgradeCustomer,
        openAccountMenu: openAccountMenu,
        closeAccountMenu: closeAccountMenu
    };

    if (!window.__kreezbyAccountMenuBound) {
        window.__kreezbyAccountMenuBound = true;
        document.addEventListener('click', function (event) {
            var btn = event.target.closest && event.target.closest('.account-action-btn');
            var ui = window.KreezbyMaintenanceUI;
            if (!ui) return;
            if (btn) {
                event.preventDefault();
                event.stopPropagation();
                ui.openAccountMenu(btn);
                return;
            }
            if (!event.target.closest || !event.target.closest('#account-archive-menu')) ui.closeAccountMenu();
        }, true);
    }

    document.addEventListener('DOMContentLoaded', refreshMetrics);
})();
