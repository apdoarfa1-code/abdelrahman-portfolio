/* =========================================================
   PROJECTS & FILE STACK VIEWER WITH ARROWS
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('filesGrid');
  if (!grid || typeof CLIENTS === 'undefined') return;

  // Render file stack cards
  grid.innerHTML = CLIENTS.map((c, idx) => {
    const cover = c.images[0] || (c.videos[0] ? c.videos[0] : '');
    const count = c.images.length + c.videos.length;
    return `
      <article class="file-card reveal visible" data-index="${idx}">
        <div class="file-stack-preview">
          <span class="file-tab">${c.client}</span>
          ${cover.endsWith('.mp4') || cover.endsWith('.webm') ? 
            `<video src="../${cover}" muted loop playsinline preload="none"></video>` :
            `<img loading="lazy" src="../${cover}" alt="${c.titleEn}">`
          }
          <span class="file-badge-count">${count} FILES</span>
        </div>
        <div class="file-meta">
          <h4>${c.titleEn}</h4>
          <p>${c.slug.replace(/-/g, ' ')}</p>
        </div>
      </article>
    `;
  }).join('');

  // Viewer elements
  const viewer = document.getElementById('viewer');
  const viewerCount = document.getElementById('viewerCount');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerClient = document.getElementById('viewerClient');
  const viewerFigure = document.getElementById('viewerFigure');
  const viewerThumbs = document.getElementById('viewerThumbs');
  const viewerPrev = document.getElementById('viewerPrev');
  const viewerNext = document.getElementById('viewerNext');
  const viewerClose = document.getElementById('viewerClose');

  let currentClientIdx = 0;
  let currentSlideIdx = 0;

  function getAllItems(c) {
    return [
      ...c.images.map(img => ({ type: 'image', src: '../' + img })),
      ...c.videos.map(vid => ({ type: 'video', src: '../' + vid }))
    ];
  }

  function openViewer(clientIdx, slideIdx = 0) {
    currentClientIdx = clientIdx;
    currentSlideIdx = slideIdx;
    const c = CLIENTS[currentClientIdx];
    const items = getAllItems(c);

    viewerTitle.textContent = c.titleEn;
    viewerClient.textContent = c.client;
    
    renderSlide(items);
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderSlide(items) {
    const item = items[currentSlideIdx];
    viewerCount.textContent = `${String(currentSlideIdx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;

    if (item.type === 'video') {
      viewerFigure.innerHTML = `<video src="${item.src}" controls autoplay loop playsinline></video>`;
    } else {
      viewerFigure.innerHTML = `<img src="${item.src}" alt="Slide">`;
    }

    // Render thumbs
    viewerThumbs.innerHTML = items.map((it, i) => `
      <div class="viewer-thumb ${i === currentSlideIdx ? 'active' : ''}" data-idx="${i}">
        ${it.type === 'video' ? 
          `<video src="${it.src}" muted preload="metadata"></video>` : 
          `<img src="${it.src}" alt="Thumb">`
        }
      </div>
    `).join('');

    // Thumb clicks
    viewerThumbs.querySelectorAll('.viewer-thumb').forEach(th => {
      th.addEventListener('click', () => {
        currentSlideIdx = parseInt(th.dataset.idx);
        renderSlide(items);
      });
    });
  }

  function nextSlide() {
    const c = CLIENTS[currentClientIdx];
    const items = getAllItems(c);
    currentSlideIdx = (currentSlideIdx + 1) % items.length;
    renderSlide(items);
  }

  function prevSlide() {
    const c = CLIENTS[currentClientIdx];
    const items = getAllItems(c);
    currentSlideIdx = (currentSlideIdx - 1 + items.length) % items.length;
    renderSlide(items);
  }

  // Card click handler -> open viewer
  grid.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      openViewer(idx, 0);
    });
  });

  viewerNext.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });
  viewerPrev.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });
  
  viewerClose.addEventListener('click', closeViewer);
  viewer.querySelector('.viewer-bg').addEventListener('click', closeViewer);

  function closeViewer() {
    viewer.classList.remove('open');
    document.body.style.overflow = '';
    viewerFigure.innerHTML = '';
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!viewer.classList.contains('open')) return;
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape') closeViewer();
  });

});
