(function () {
    async function fetchPanel(href) {
        try {
            var res = await fetch(href, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('fetch failed');
            var text = await res.text();
            var parser = new DOMParser();
            var doc = parser.parseFromString(text, 'text/html');
            var remotePanel = doc.querySelector('.panel-data-card');
            return remotePanel ? remotePanel.innerHTML : null;
        } catch (e) {
            return null;
        }
    }

    function filenameOf(url) {
        try {
            return new URL(url, location.href).pathname.split('/').pop();
        } catch (e) {
            return url;
        }
    }

    function syncActivePills(activeHref) {
        var targetFile = activeHref
            ? filenameOf(activeHref)
            : location.pathname.split('/').pop();
        var container = document.querySelector('#ai-filter-pills');
        if (!container) return;

        container.querySelectorAll('.pill').forEach(function (pill) {
            var href = pill.getAttribute('href');
            var isActive = href && filenameOf(href) === targetFile;
            pill.classList.toggle('active', isActive);
        });
    }

    async function loadPanel(href, updateHistory) {
        var panelHTML = await fetchPanel(href);
        if (panelHTML === null) {
            location.href = href;
            return;
        }

        var existing = document.querySelector('.panel-data-card');
        if (!existing) {
            location.href = href;
            return;
        }

        existing.innerHTML = panelHTML;
        syncActivePills(href);

        if (updateHistory !== false) {
            try {
                history.pushState({ forecastPanel: href }, '', href);
            } catch (e) {}
        }

        document.dispatchEvent(new Event('content:replaced'));
    }

    document.addEventListener('DOMContentLoaded', function () {
        syncActivePills();

        document.addEventListener('click', function (ev) {
            var target = ev.target.closest('#ai-filter-pills .pill');
            if (!target) return;

            ev.preventDefault();
            var href = target.getAttribute('href');
            if (!href) return;

            syncActivePills(href);
            loadPanel(href);
        });

        window.addEventListener('popstate', function () {
            syncActivePills();
            loadPanel(location.pathname + location.search, false);
        });
    });

    window.KreezbyAiForecastPills = { boot: syncActivePills, loadPanel: loadPanel };
    document.addEventListener('kreezby:page-load', function () {
        syncActivePills();
    });
})();
