// ---- NAV TOGGLE ----
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
        navLinks.classList.remove('open');
    });
});

// ---- EYE 5 / MIXCLOUD ----
async function loadEye5() {
    const loadingEl = document.getElementById('eye5-loading');
    const iframeEl = document.getElementById('mixcloud-embed');
    const titleEl = document.getElementById('eye5-episode-title');

    try {
        const res = await fetch('https://api.mixcloud.com/KRCU/cloudcasts/?limit=30');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        const episode = data.data.find(c => /eye\s*5/i.test(c.name));
        if (!episode) throw new Error('No Eye 5 episode found');

        const feedParam = encodeURIComponent(episode.key);
        iframeEl.src = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=0&feed=${feedParam}`;
        iframeEl.style.display = 'block';
        loadingEl.style.display = 'none';

        if (titleEl && episode.name) {
            titleEl.textContent = episode.name;
        }
    } catch (err) {
        if (loadingEl) {
            loadingEl.innerHTML = 'Could not load the latest episode. <a href="https://www.mixcloud.com/KRCU/" target="_blank" rel="noopener">Listen on Mixcloud &rarr;</a>';
        }
        console.error('Eye 5 load error:', err);
    }
}

// ---- KLCC CONUNDRUM / RSS ----
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildEpisodeCard(title, pubDate, audioUrl, duration) {
    const card = document.createElement('article');
    card.className = 'episode-card';

    const header = document.createElement('div');
    header.className = 'episode-header';

    const info = document.createElement('div');
    info.className = 'episode-info';

    const formattedDate = formatDate(pubDate);
    if (formattedDate) {
        const dateEl = document.createElement('span');
        dateEl.className = 'episode-date';
        dateEl.textContent = formattedDate;
        info.appendChild(dateEl);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'episode-title';
    titleEl.textContent = title;
    info.appendChild(titleEl);

    header.appendChild(info);

    if (duration) {
        const durEl = document.createElement('span');
        durEl.className = 'episode-duration';
        durEl.textContent = duration;
        header.appendChild(durEl);
    }

    card.appendChild(header);

    if (audioUrl) {
        try {
            const url = new URL(audioUrl);
            if (url.protocol === 'https:' || url.protocol === 'http:') {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'episode-player';
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.preload = 'none';
                const source = document.createElement('source');
                source.src = audioUrl;
                source.type = 'audio/mpeg';
                audio.appendChild(source);
                playerDiv.appendChild(audio);
                card.appendChild(playerDiv);
            }
        } catch (e) {
            // Invalid URL — skip audio element
        }
    }

    return card;
}

async function loadConundrum() {
    const container = document.getElementById('conundrum-episodes');

    try {
        const res = await fetch('https://www.klcc.org/podcast/the-klcc-conundrum/rss.xml');
        if (!res.ok) throw new Error('RSS fetch failed');
        const text = await res.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = Array.from(xml.querySelectorAll('item')).slice(0, 3);

        if (!items.length) throw new Error('No episodes found');

        container.innerHTML = '';
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent?.trim() || 'Episode';
            const pubDate = item.querySelector('pubDate')?.textContent;
            const enclosure = item.querySelector('enclosure');
            const audioUrl = enclosure?.getAttribute('url') || '';
            const duration = item.querySelector('duration')?.textContent?.trim() || '';

            container.appendChild(buildEpisodeCard(title, pubDate, audioUrl, duration));
        });
    } catch (err) {
        container.innerHTML = '';
        const errEl = document.createElement('p');
        errEl.className = 'episodes-error';
        errEl.innerHTML = 'Could not load episodes. <a href="https://www.klcc.org/the-klcc-conundrum" target="_blank" rel="noopener">Listen on KLCC &rarr;</a>';
        container.appendChild(errEl);
        console.error('Conundrum load error:', err);
    }
}

loadEye5();
loadConundrum();
