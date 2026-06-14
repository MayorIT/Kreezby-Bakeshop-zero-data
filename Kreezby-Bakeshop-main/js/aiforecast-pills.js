(function(){
    // Fetch and inject remote panel content into current page's .panel-data-card
    async function fetchPanel(href){
        try{
            const res = await fetch(href, {credentials: 'same-origin'});
            if(!res.ok) throw new Error('fetch failed');
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const remotePanel = doc.querySelector('.panel-data-card');
            return remotePanel ? remotePanel.innerHTML : null;
        } catch (e) {
            return null;
        }
    }

    function setActive(pills, activeEl){
        pills.forEach(p => p.classList.toggle('active', p === activeEl));
    }

    function filenameOf(url){
        try{ return (new URL(url, location.href)).pathname.split('/').pop(); }catch(e){ return url; }
    }

    document.addEventListener('DOMContentLoaded', function(){
        const pillContainers = document.querySelectorAll('#ai-filter-pills');
        if(!pillContainers.length) return;

        pillContainers.forEach(container => {
            const pills = Array.from(container.querySelectorAll('.pill'));

            // initial active state based on current filename
            const currentFile = location.pathname.split('/').pop();
            let found = false;
            pills.forEach(p => {
                const href = p.getAttribute('href');
                if(href && filenameOf(href) === currentFile){ p.classList.add('active'); found = true; }
            });
            if(!found){ const all = container.querySelector('.pill[data-key="all"]'); if(all) all.classList.add('active'); }

            // click handler: load via fetch and inject, else navigate
            container.addEventListener('click', async function(ev){
                const target = ev.target.closest('.pill');
                if(!target) return;
                ev.preventDefault();
                const href = target.getAttribute('href');
                if(!href) return;

                // optimistic active state
                setActive(pills, target);

                const panelHTML = await fetchPanel(href);
                if(panelHTML !== null){
                    const existing = document.querySelector('.panel-data-card');
                    if(existing){
                        existing.innerHTML = panelHTML;
                        // update history without reloading
                        try{ history.pushState({}, '', href); }catch(e){}
                        // re-run sidebar-toggle init if needed
                        const evt = new Event('content:replaced');
                        document.dispatchEvent(evt);
                    } else {
                        // fallback navigate
                        location.href = href;
                    }
                } else {
                    // fetch failed -> full navigation
                    location.href = href;
                }
            });
        });

    });
})();
