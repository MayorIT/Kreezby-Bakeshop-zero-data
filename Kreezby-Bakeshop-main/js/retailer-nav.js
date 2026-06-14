/**
 * Keeps retailer module pages linked to the active retailer dashboard
 * (retailer-{area}_{store}.html) via localStorage.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'kreezby_retailer_home';
  var DIRECTORY = 'retailer/retailer-directory.html';
  var DEFAULT_HOME = 'retailer-batangas_sidcmain.html';
  var PORTAL_PATTERN = /^retailer-[a-z0-9]+_[a-z0-9]+\.html$/i;
  var HIDE_MODULES_PATTERN = /(^(receive|return)-|receiving-retailer\.html$|return-retailer\.html$|pullout|pull-out|delivery)/i;

  function currentFile() {
    var path = location.pathname || '';
    return path.split('/').pop() || '';
  }

  function isRetailerPortalPage(file) {
    return PORTAL_PATTERN.test(file);
  }

  function rememberHome(url) {
    if (!url || !isRetailerPortalPage(url)) return;
    try {
      localStorage.setItem(STORAGE_KEY, url);
    } catch (err) { /* ignore */ }
  }

  function getStoredHome() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isRetailerPortalPage(stored)) return stored;
    } catch (err) { /* ignore */ }
    return null;
  }

  function resolveHomeUrl() {
    var file = currentFile();
    if (isRetailerPortalPage(file)) {
      rememberHome(file);
      return file;
    }
    return getStoredHome() || DEFAULT_HOME;
  }

  function wireRetailerHomeLinks() {
    var home = resolveHomeUrl();
    document.querySelectorAll('a[href="retailer.html"]').forEach(function (link) {
      link.setAttribute('href', home);
    });
  }

  function removeRetailerDeliveryAndPulloutModules() {
    // Remove nav/sidebar links and inline action shortcuts for receiving/return (delivery/pullout records).
    // This keeps the HTML files intact but hides the modules across retailer pages.
    function normalizeHref(href) {
      return (href || '').split('?')[0].split('#')[0].trim();
    }

    // If user lands on a removed module page, bounce them back to the retailer home dashboard.
    var here = currentFile();
    if (HIDE_MODULES_PATTERN.test(here)) {
      // Use resolveHomeUrl to preserve correct branch/store home.
      location.replace(resolveHomeUrl());
      return;
    }

    // Sidebar / navigation links
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = normalizeHref(a.getAttribute('href'));
      var file = href.split('/').pop();
      if (!file) return;

      if (HIDE_MODULES_PATTERN.test(file)) {
        var li = a.closest('li');
        if (li) li.remove();
        else a.remove();
      }
    });

    // Any "quick action" menu items that navigate to receiving/return modules
    document.querySelectorAll('[onclick]').forEach(function (node) {
      var onclick = node.getAttribute('onclick') || '';
      if (/location\.href\s*=\s*['"][^'"]*(receive|return|receiving-retailer|return-retailer)[^'"]*['"]/i.test(onclick)) {
        node.remove();
      }
    });
  }

  window.KreezbyRetailerNav = {
    getHomeUrl: resolveHomeUrl,
    rememberHome: rememberHome,
    directoryUrl: DIRECTORY
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireRetailerHomeLinks();
      removeRetailerDeliveryAndPulloutModules();
    });
  } else {
    wireRetailerHomeLinks();
    removeRetailerDeliveryAndPulloutModules();
  }
})();
