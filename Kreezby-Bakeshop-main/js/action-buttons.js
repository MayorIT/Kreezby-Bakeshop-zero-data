/**
 * Kreezby — row Action menus with success feedback (all module tables).
 */
(function () {
  'use strict';

  var menuCounter = 0;

  function toast(message, type) {
    if (window.KreezbyApp && KreezbyApp.toast) {
      KreezbyApp.toast(message, type || 'success');
    } else {
      alert(message);
    }
  }

  function postAction(label, meta) {
    return Promise.resolve({ ok: true, message: 'Action completed successfully.' });
  }

  function detectModule() {
    var p = (location.pathname || '').toLowerCase();
    if (p.indexOf('stocks') >= 0) return 'stocks';
    if (p.indexOf('alert') >= 0) return 'alert';
    if (p.indexOf('saleslist') >= 0) return 'sales';
    if (p.indexOf('dailysales') >= 0) return 'calendar';
    if (p.indexOf('receive') >= 0) return 'receive';
    if (p.indexOf('return') >= 0) return 'return';
    if (p.indexOf('bo-') >= 0 || p.indexOf('/bo') >= 0) return 'backorder';
    if (p.indexOf('po-') >= 0 || p.indexOf('po_') >= 0) return 'po';
    if (p.indexOf('maintenance') >= 0) return 'maintenance';
    if (p.indexOf('inventoryreport') >= 0) return 'report';
    return 'generic';
  }

  function getRowLabel(btn) {
    var row = btn.closest('tr');
    if (!row) return 'Record';
    var strong = row.querySelector('strong');
    if (strong && strong.textContent.trim()) return strong.textContent.trim();
    var inputs = row.querySelectorAll('input.matrix-input-field[readonly], input[readonly]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].value && inputs[i].value.trim()) return inputs[i].value.trim();
    }
    var cells = row.querySelectorAll('td');
    for (var j = 0; j < cells.length; j++) {
      var t = (cells[j].textContent || '').trim();
      if (t && t.length > 2 && t.length < 80 && !/^\d+$/.test(t)) return t;
    }
    return 'Record';
  }

  function menuItemsForModule(module) {
    switch (module) {
      case 'stocks':
        return [
          { key: 'view', label: 'View History' },
          { key: 'adjust', label: 'Adjust Stock' },
          { key: 'archive', label: 'Archive Item', danger: true }
        ];
      case 'alert':
        return [
          { key: 'restock', label: 'Create Restock P.O.' },
          { key: 'modify', label: 'Adjust Threshold', muted: true },
          { key: 'dismiss', label: 'Dismiss Alert', danger: true }
        ];
      case 'po':
        return [
          { key: 'view', label: 'View Details' },
          { key: 'edit', label: 'Edit Order' },
          { key: 'print', label: 'Print PO' },
          { key: 'cancel', label: 'Cancel Order', danger: true }
        ];
      case 'receive':
        return [
          { key: 'view', label: 'View Receiving Slip' },
          { key: 'receive', label: 'Mark as Received' },
          { key: 'print', label: 'Print Receipt' }
        ];
      case 'backorder':
        return [
          { key: 'view', label: 'View Back Order' },
          { key: 'fulfill', label: 'Fulfill Items' },
          { key: 'cancel', label: 'Cancel Back Order', danger: true }
        ];
      case 'return':
        return [
          { key: 'view', label: 'View Return Slip' },
          { key: 'approve', label: 'Approve Return' },
          { key: 'reject', label: 'Reject Return', danger: true }
        ];
      case 'sales':
        return [
          { key: 'view', label: 'View Invoice' },
          { key: 'export', label: 'Export PDF' },
          { key: 'void', label: 'Void Sale', danger: true }
        ];
      case 'maintenance':
        return [
          { key: 'edit', label: 'Edit Record' },
          { key: 'duplicate', label: 'Duplicate' },
          { key: 'deactivate', label: 'Deactivate', danger: true }
        ];
      case 'report':
        return [
          { key: 'edit', label: 'Edit Line' },
          { key: 'duplicate', label: 'Duplicate Row' },
          { key: 'remove', label: 'Remove Line', danger: true }
        ];
      default:
        return [
          { key: 'view', label: 'View Details' },
          { key: 'edit', label: 'Edit' }
        ];
    }
  }

  function closeAllMenus(exceptId) {
    document.querySelectorAll('.action-popup-menu.active').forEach(function (menu) {
      if (!exceptId || menu.id !== exceptId) menu.classList.remove('active');
    });
  }

  function toggleMenu(event, menuId) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    closeAllMenus(menuId);
    var menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle('active');
  }

  function tryOpenDetails() {
    var fns = [
      'switchToDetailsViewPane',
      'switchToReceivedDetailsInspectorSheet',
      'switchToReturnDetailsInspectorView',
      'switchToBackOrderDetailsInspector',
      'switchToDetailedSalesTransactionInspector'
    ];
    for (var i = 0; i < fns.length; i++) {
      if (typeof window[fns[i]] === 'function') {
        window[fns[i]]();
        return true;
      }
    }
    return false;
  }

  function runStockAction(action, label) {
    if (action === 'archive') {
      if (!confirm('Archive "' + label + '" from active tracking?')) return;
      toast('"' + label + '" archived successfully.', 'success');
      return;
    }
    if (action === 'adjust') {
      var qty = prompt('New stock quantity for "' + label + '":', '100');
      if (qty === null) return;
      toast('Stock for "' + label + '" updated to ' + qty + ' successfully.', 'success');
      return;
    }
    toast('History for "' + label + '" loaded successfully.', 'info');
  }

  function runAlertAction(action, label) {
    if (action === 'dismiss') {
      if (!confirm('Dismiss alert for "' + label + '"?')) return;
      toast('Alert for "' + label + '" dismissed successfully.', 'success');
      postAction('Dismiss alert: ' + label, { context: label });
      return;
    }
    if (action === 'restock') {
      postAction('Create restock PO: ' + label, { context: label }).then(function () {
        toast('Restock P.O. for "' + label + '" created successfully.', 'success');
      });
      return;
    }
    postAction('Alert action: ' + action, { context: label }).then(function () {
      toast('"' + action + '" completed for "' + label + '" successfully.', 'success');
    });
  }

  function runRowAction(module, action, label, row) {
    closeAllMenus();

    if (module === 'stocks') {
      runStockAction(action, label);
      return;
    }
    if (module === 'alert') {
      runAlertAction(action, label);
      return;
    }

    if (action === 'view') {
      if (tryOpenDetails()) {
        toast('Opened details for "' + label + '" successfully.', 'success');
        return;
      }
    }

    if (action === 'receive' && row) {
      var badge = row.querySelector('.status-pill-badge');
      if (badge) {
        badge.textContent = 'Received';
        badge.className = 'status-pill-badge received';
      }
    }

    if (action === 'approve' && row) {
      var approvedBadge = row.querySelector('.status-pill-badge');
      if (approvedBadge) {
        approvedBadge.textContent = 'Approved';
        approvedBadge.className = 'status-pill-badge received';
      }
    }

    if (action === 'remove' || action === 'archive' || action === 'cancel' || action === 'void' || action === 'reject' || action === 'deactivate') {
      if (!confirm('Proceed with "' + action + '" for "' + label + '"?')) return;
    }

    if (action === 'remove' && row) {
      row.remove();
      toast('Line removed successfully.', 'success');
      postAction('Remove: ' + label, { module: module });
      return;
    }

    var messages = {
      view: 'Opened "' + label + '" successfully.',
      edit: '"' + label + '" opened for editing successfully.',
      print: '"' + label + '" sent to print successfully.',
      export: '"' + label + '" exported successfully.',
      duplicate: '"' + label + '" duplicated successfully.',
      receive: '"' + label + '" marked as received successfully.',
      fulfill: 'Back order "' + label + '" fulfillment saved successfully.',
      approve: 'Return "' + label + '" approved successfully.',
      cancel: 'Order "' + label + '" cancelled successfully.',
      void: 'Sale "' + label + '" voided successfully.',
      reject: 'Return "' + label + '" rejected successfully.',
      deactivate: '"' + label + '" deactivated successfully.'
    };

    postAction(module + ':' + action + ':' + label, { module: module, action: action, label: label }).then(function () {
      toast(messages[action] || 'Action completed successfully.', 'success');
    });
  }

  function buildPopupMenu(menuId, module, label, row) {
    var menu = document.createElement('div');
    menu.className = 'action-popup-menu';
    menu.id = menuId;

    menuItemsForModule(module).forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'action-popup-item';
      if (item.danger) el.classList.add('delete-type');
      if (item.muted) el.classList.add('text-muted');
      el.textContent = item.label;
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        runRowAction(module, item.key, label, row);
      });
      menu.appendChild(el);
    });

    return menu;
  }

  function isActionDropdownButton(btn) {
    var text = (btn.textContent || '').trim();
    return text.indexOf('Action') >= 0 || text.indexOf('\u25be') >= 0;
  }

  function shouldWireButton(btn) {
    if (btn.dataset.kreezbyActionWired === '1') return false;
    if (!isActionDropdownButton(btn)) return false;
    var onclick = btn.getAttribute('onclick') || '';
    if (onclick.indexOf('toggleActionPopupMenu') >= 0 || onclick.indexOf('toggleAlertActionMenu') >= 0) {
      return false;
    }
    if (onclick.indexOf('alert(') >= 0) {
      btn.removeAttribute('onclick');
      return true;
    }
    if (onclick.indexOf('stopPropagation') >= 0) {
      btn.removeAttribute('onclick');
      return true;
    }
    return !onclick;
  }

  function wireExistingPopupItems() {
    document.querySelectorAll('.action-popup-item[onclick]').forEach(function (item) {
      if (item.dataset.kreezbyWired === '1') return;
      var onclick = item.getAttribute('onclick') || '';
      if (onclick.indexOf('handleStockAction') >= 0) {
        item.dataset.kreezbyWired = '1';
        item.removeAttribute('onclick');
        var match = onclick.match(/handleStockAction\s*\(\s*'([^']+)'\s*,\s*'([^']*)'/);
        if (match) {
          item.addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllMenus();
            runStockAction(match[1], match[2]);
          });
        }
      }
      if (onclick.indexOf('handleAlertTrigger') >= 0) {
        item.dataset.kreezbyWired = '1';
        item.removeAttribute('onclick');
        var m2 = onclick.match(/handleAlertTrigger\s*\(\s*'([^']+)'\s*,\s*'([^']*)'/);
        if (m2) {
          item.addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllMenus();
            runAlertAction(m2[1], m2[2]);
          });
        }
      }
    });
  }

  function wireButton(btn) {
    if (!shouldWireButton(btn)) return;

    var module = detectModule();
    var label = getRowLabel(btn);
    var row = btn.closest('tr');
    menuCounter += 1;
    var menuId = 'kreezby-act-' + menuCounter;

    var container = btn.closest('.action-menu-relative-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'action-menu-relative-container';
      btn.parentNode.insertBefore(container, btn);
      container.appendChild(btn);
    }

    var existingMenu = container.querySelector('.action-popup-menu');
    if (existingMenu && !existingMenu.id.startsWith('kreezby-act-')) {
      menuId = existingMenu.id || menuId;
      existingMenu.querySelectorAll('.action-popup-item').forEach(function (item) {
        if (item.dataset.kreezbyWired === '1') return;
        item.dataset.kreezbyWired = '1';
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          closeAllMenus();
          var txt = (item.textContent || '').trim().toLowerCase();
          var key = 'view';
          if (txt.indexOf('adjust') >= 0) key = 'adjust';
          else if (txt.indexOf('archive') >= 0) key = 'archive';
          else if (txt.indexOf('dismiss') >= 0) key = 'dismiss';
          else if (txt.indexOf('restock') >= 0) key = 'restock';
          else if (txt.indexOf('threshold') >= 0) key = 'modify';
          else if (txt.indexOf('history') >= 0) key = 'view';
          if (module === 'stocks') runStockAction(key, label);
          else if (module === 'alert') runAlertAction(key, label);
          else runRowAction(module, key, label, row);
        });
      });
    } else if (!existingMenu) {
      container.appendChild(buildPopupMenu(menuId, module, label, row));
    }

    btn.setAttribute('onclick', "KreezbyActions.toggle(event, '" + (existingMenu ? existingMenu.id : menuId) + "')");
    btn.dataset.kreezbyActionWired = '1';
  }

  function initAll() {
    wireExistingPopupItems();
    document.querySelectorAll('.action-trigger-btn, .btn-row-action').forEach(wireButton);

    document.querySelectorAll('.action-trigger-btn[onclick*="toggleActionPopupMenu"]').forEach(function (btn) {
      if (btn.dataset.kreezbyActionWired === '1') return;
      btn.dataset.kreezbyActionWired = '1';
    });
    document.querySelectorAll('.action-trigger-btn[onclick*="toggleAlertActionMenu"]').forEach(function (btn) {
      if (btn.dataset.kreezbyActionWired === '1') return;
      btn.dataset.kreezbyActionWired = '1';
    });
  }

  window.handleStockAction = function (actionType, itemName) {
    runStockAction(actionType, itemName);
  };

  window.handleAlertTrigger = function (action, context) {
    runAlertAction(action, context);
  };

  window.toggleActionPopupMenu = function (event, popupElementId) {
    toggleMenu(event, popupElementId);
  };

  window.toggleAlertActionMenu = window.toggleActionPopupMenu;

  window.KreezbyActions = {
    toggle: toggleMenu,
    init: initAll,
    run: runRowAction
  };

  document.addEventListener('click', function () {
    closeAllMenus();
  });

  document.addEventListener('DOMContentLoaded', function () {
    initAll();
    var workspace = document.getElementById('maintenance-grid-workspace-root');
    if (workspace) {
      new MutationObserver(function () {
        initAll();
      }).observe(workspace, { childList: true, subtree: true });
    }
  });
})();
