/* ==========================================================================
   PLOTVERSO - COM POP-UP POST-IT DE DUPLICADOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. PALETA DE CORES (Confetes)
  const candyColors = [
    '#FF3197', '#FF99DF', '#FFAC8F', '#FEFDB2', '#6CEBEF', '#9BB7E8'
  ];

  // 2. CELEBRAÇÃO / CONFETES
  function triggerCelebration(type) {
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 100,
        startVelocity: 50,
        origin: { y: 0.6 },
        colors: candyColors,
        ticks: 250
      });

      let scalarEmoji = '🎬';
      if (type === 'book') scalarEmoji = '📚';
      if (type === 'show') scalarEmoji = '📺';
      if (type === 'mc-show') scalarEmoji = '⛏️';
      if (type === 'mc-movie') scalarEmoji = '🧱';

      confetti({
        particleCount: 25,
        spread: 120,
        startVelocity: 40,
        origin: { y: 0.6 },
        shapes: [confetti.shapeFromText({ text: scalarEmoji, scalar: 2.5 })],
        scalar: 2.5,
        ticks: 200
      });
    }
  }

  window.triggerCelebration = triggerCelebration;

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // 3. DETECÇÃO INTELIGENTE DE DUPLICADOS
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  function getLevenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }

  function findSimilarItem(newTitle) {
    const normNew = normalizeText(newTitle);
    if (!normNew) return null;

    for (const item of items) {
      const normExist = normalizeText(item.title);

      if (normNew === normExist) {
        return item;
      }

      const maxLen = Math.max(normNew.length, normExist.length);
      const dist = getLevenshteinDistance(normNew, normExist);
      const allowedErrors = maxLen <= 5 ? 1 : Math.floor(maxLen * 0.25);

      if (dist <= allowedErrors) {
        return item;
      }
    }
    return null;
  }

  // 4. ESTADO DA APLICAÇÃO
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem('plotverso_items')) || [];
  } catch (e) {
    console.error('Erro ao carregar do localStorage:', e);
    items = [];
  }

  let currentItemId = null;
  let tempRating = 0;
  let tempJournalRating = 0;
  let pendingTitleToAdd = null;
  let pendingTypeToAdd = null;

  let activeTab = 'all'; 
  let activeFilter = 'all';

  function saveItems() {
    try {
      localStorage.setItem('plotverso_items', JSON.stringify(items));
    } catch (e) {
      alert('Aviso: Não foi possível salvar no navegador.');
    }
    renderMediaList();
  }

  // 5. ELEMENTOS DO DOM
  const mediaForm = document.getElementById('media-form');
  const titleInput = document.getElementById('title-input');
  const typeSelect = document.getElementById('type-select');
  const mediaList = document.getElementById('media-list');
  const counterBadge = document.getElementById('counter');
  const filterSelect = document.getElementById('filter-select');
  const listTitle = document.getElementById('list-title');
  const tabAll = document.getElementById('tab-all');
  const tabCompleted = document.getElementById('tab-completed');

  // Modais
  const ratingModal = document.getElementById('rating-modal');
  const modalItemTitle = document.getElementById('modal-item-title');
  const starRatingContainer = document.getElementById('star-rating');
  const sparkleCheck = document.getElementById('sparkle-check');
  const btnSaveRating = document.getElementById('btn-save-rating');
  const btnOpenJournalFromModal = document.getElementById('btn-open-journal-from-modal');

  const journalModal = document.getElementById('journal-modal');
  const btnCloseJournal = document.getElementById('btn-close-journal');
  const btnSaveJournal = document.getElementById('btn-save-journal');

  // Pop-up Post-it Duplicado
  const duplicateModal = document.getElementById('duplicate-modal');
  const duplicateItemInfo = document.getElementById('duplicate-item-info');
  const btnAddAnyway = document.getElementById('btn-add-anyway');
  const btnDismissDuplicate = document.getElementById('btn-dismiss-duplicate');

  // Campos Journal
  const journalTitleDisplay = document.getElementById('journal-title-display');
  const journalCornerBadge = document.getElementById('journal-corner-badge');
  const jAuthor = document.getElementById('j-author');
  const jFormatText = document.getElementById('j-format-text');
  const jGenre = document.getElementById('j-genre');
  const jPages = document.getElementById('j-pages');
  const jEpisodes = document.getElementById('j-episodes');
  const jDuration = document.getElementById('j-duration');
  const jStart = document.getElementById('j-start');
  const jFinish = document.getElementById('j-finish');
  const jSynopsis = document.getElementById('j-synopsis');
  const jThoughts = document.getElementById('j-thoughts');
  const jQuotes = document.getElementById('j-quotes');
  const journalStarsContainer = document.getElementById('journal-stars');
  const journalSparkleBadge = document.getElementById('journal-sparkle-badge');
  const statsBanner = document.getElementById('stats-banner');
  const statsText = document.getElementById('stats-text');

  // Upload Capa
  const coverFrame = document.getElementById('cover-frame');
  const coverFileInput = document.getElementById('cover-file-input');
  const journalCoverImg = document.getElementById('journal-cover-img');
  const coverPlaceholder = document.getElementById('cover-placeholder');

  // Linhas condicionais
  const rowPages = document.getElementById('row-pages');
  const rowEpisodes = document.getElementById('row-episodes');
  const rowDuration = document.getElementById('row-duration');

  const typeIcons = { 
    movie: '🎬', 
    show: '📺', 
    book: '📚', 
    'mc-show': '⛏📺 ࿔*:･', 
    'mc-movie': '⛏🎬 ࿔*:･' 
  };

  const typeLabels = {
    movie: 'Filme',
    show: 'Série',
    book: 'Livro',
    'mc-show': 'Minecraft Série',
    'mc-movie': 'Minecraft Filme'
  };

  // 6. RENDERIZAÇÃO DA LISTA
  function renderMediaList() {
    if (!mediaList) return;
    mediaList.innerHTML = '';

    let filtered = items.filter(item => {
      if (activeTab === 'completed') return item.completed === true;
      return true;
    });

    filtered = filtered.filter(item => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'minecraft') return item.type === 'mc-show' || item.type === 'mc-movie';
      return item.type === activeFilter;
    });

    if (counterBadge) {
      counterBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`;
    }

    if (filtered.length === 0) {
      mediaList.innerHTML = `<li style="padding:15px; text-align:center; color:#8C0902;">Nenhum item encontrado nesta exibição! ✨</li>`;
      return;
    }

    filtered.forEach(item => {
      const li = document.createElement('li');
      li.className = `media-item ${item.completed ? 'completed' : ''}`;

      const icon = typeIcons[item.type] || '🍿';
      const starsDisplay = item.rating ? '★'.repeat(item.rating) : 'Sem nota';
      const sparkleDisplay = item.sparkle ? '✨' : '';

      li.innerHTML = `
        <div class="item-left">
          <input type="checkbox" class="custom-check" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
          <span class="item-title">${icon} ${escapeHTML(item.title)}</span>
        </div>
        <div class="item-right">
          <span class="rating-badge">${starsDisplay} ${sparkleDisplay}</span>
          <button class="btn-open-journal" data-id="${item.id}">📖 Journal</button>
          <button class="btn-delete" data-id="${item.id}">🗑️</button>
        </div>
      `;

      mediaList.appendChild(li);
    });

    attachListEvents();
  }

  // EVENTOS DAS ABAS
  if (tabAll && tabCompleted) {
    tabAll.addEventListener('click', () => {
      activeTab = 'all';
      tabAll.classList.add('active');
      tabCompleted.classList.remove('active');
      if (listTitle) listTitle.textContent = 'Minha Coleção';
      renderMediaList();
    });

    tabCompleted.addEventListener('click', () => {
      activeTab = 'completed';
      tabCompleted.classList.add('active');
      tabAll.classList.remove('active');
      if (listTitle) listTitle.textContent = 'Itens Concluídos';
      renderMediaList();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      activeFilter = e.target.value;
      renderMediaList();
    });
  }

  function attachListEvents() {
    document.querySelectorAll('.custom-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = items.find(i => i.id === id);
        if (item) {
          item.completed = e.target.checked;
          if (item.completed) triggerCelebration(item.type);
          saveItems();
        }
      });
    });

    document.querySelectorAll('.btn-open-journal').forEach(btn => {
      btn.addEventListener('click', () => {
        openJournalModal(btn.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja realmente excluir este título?')) {
          items = items.filter(i => i.id !== id);
          saveItems();
        }
      });
    });
  }

  // FUNÇÃO DE ADICIONAR ITEM NA LISTA
  function createNewItem(title, type) {
    const newItem = {
      id: Date.now().toString(),
      title: title,
      type: type,
      completed: false,
      rating: 0,
      sparkle: false,
      author: '',
      genre: '',
      pages: '',
      episodes: '',
      duration: '',
      startDate: '',
      finishDate: '',
      synopsis: '',
      thoughts: '',
      quotes: '',
      coverUrl: ''
    };

    items.unshift(newItem);
    saveItems();
    titleInput.value = '';

    triggerCelebration(type);
    openRatingModal(newItem.id);
  }

  // 7. FORMULÁRIO COM POP-UP POST-IT DE DUPLICADO
  if (mediaForm) {
    mediaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const type = typeSelect.value;

      if (!title) return;

      const similarItem = findSimilarItem(title);
      if (similarItem) {
        pendingTitleToAdd = title;
        pendingTypeToAdd = type;

        if (duplicateItemInfo) {
          duplicateItemInfo.textContent = `Parece com "${similarItem.title}" que já está salvo!`;
        }
        duplicateModal.classList.remove('hidden');
        return;
      }

      createNewItem(title, type);
    });
  }

  // EVENTOS DO POP-UP POST-IT
  if (btnAddAnyway) {
    btnAddAnyway.addEventListener('click', () => {
      if (pendingTitleToAdd && pendingTypeToAdd) {
        createNewItem(pendingTitleToAdd, pendingTypeToAdd);
      }
      duplicateModal.classList.add('hidden');
      pendingTitleToAdd = null;
      pendingTypeToAdd = null;
    });
  }

  if (btnDismissDuplicate) {
    btnDismissDuplicate.addEventListener('click', () => {
      duplicateModal.classList.add('hidden');
      pendingTitleToAdd = null;
      pendingTypeToAdd = null;
    });
  }

  // 8. MODAL DE AVALIAÇÃO RÁPIDA
  function openRatingModal(id) {
    currentItemId = id;
    const item = items.find(i => i.id === id);
    if (!item) return;

    modalItemTitle.textContent = item.title;
    tempRating = item.rating || 0;
    sparkleCheck.checked = !!item.sparkle;
    updateStars(starRatingContainer, tempRating);

    ratingModal.classList.remove('hidden');
  }

  function updateStars(container, rating) {
    if (!container) return;
    const stars = container.querySelectorAll('span');
    stars.forEach(star => {
      const val = parseInt(star.getAttribute('data-value'), 10);
      star.classList.toggle('active', val <= rating);
    });
  }

  if (starRatingContainer) {
    starRatingContainer.querySelectorAll('span').forEach(star => {
      star.addEventListener('click', () => {
        tempRating = parseInt(star.getAttribute('data-value'), 10);
        updateStars(starRatingContainer, tempRating);
      });
    });
  }

  if (btnSaveRating) {
    btnSaveRating.addEventListener('click', () => {
      const item = items.find(i => i.id === currentItemId);
      if (item) {
        item.rating = tempRating;
        item.sparkle = sparkleCheck.checked;
        saveItems();
      }
      ratingModal.classList.add('hidden');
    });
  }

  if (btnOpenJournalFromModal) {
    btnOpenJournalFromModal.addEventListener('click', () => {
      const id = currentItemId;
      ratingModal.classList.add('hidden');
      openJournalModal(id);
    });
  }

  // 9. MODAL JOURNAL REVIEW PAGE
  function openJournalModal(id) {
    currentItemId = id;
    const item = items.find(i => i.id === id);
    if (!item) return;

    const icon = typeIcons[item.type] || '🍿';
    journalTitleDisplay.innerHTML = `<span>${icon}</span> ${escapeHTML(item.title)}`;
    journalCornerBadge.textContent = `${icon} ${(item.type || '').toUpperCase()} ✨`;

    jAuthor.value = item.author || '';
    jFormatText.textContent = typeLabels[item.type] || 'Outro';
    jGenre.value = item.genre || '';
    jPages.value = item.pages || '';
    jEpisodes.value = item.episodes || '';
    jDuration.value = item.duration || '';
    jStart.value = item.startDate || '';
    jFinish.value = item.finishDate || '';
    jSynopsis.value = item.synopsis || '';
    jThoughts.value = item.thoughts || '';
    jQuotes.value = item.quotes || '';

    tempJournalRating = item.rating || 0;
    updateStars(journalStarsContainer, tempJournalRating);

    journalSparkleBadge.classList.toggle('hidden', !item.sparkle);

    if (rowPages) rowPages.style.display = item.type === 'book' ? 'flex' : 'none';
    if (rowEpisodes) rowEpisodes.style.display = (item.type === 'show' || item.type === 'mc-show') ? 'flex' : 'none';
    if (rowDuration) rowDuration.style.display = (item.type === 'movie' || item.type === 'mc-movie') ? 'flex' : 'none';

    if (item.coverUrl) {
      journalCoverImg.src = item.coverUrl;
      journalCoverImg.classList.remove('hidden');
      coverPlaceholder.classList.add('hidden');
    } else {
      journalCoverImg.classList.add('hidden');
      coverPlaceholder.classList.remove('hidden');
    }

    calculateStats();
    journalModal.classList.remove('hidden');
  }

  if (journalStarsContainer) {
    journalStarsContainer.querySelectorAll('span').forEach(star => {
      star.addEventListener('click', () => {
        tempJournalRating = parseInt(star.getAttribute('data-value'), 10);
        updateStars(journalStarsContainer, tempJournalRating);
      });
    });
  }

  // Upload Capa
  if (coverFrame && coverFileInput) {
    coverFrame.addEventListener('click', () => coverFileInput.click());

    coverFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          const coverUrl = evt.target.result;
          journalCoverImg.src = coverUrl;
          journalCoverImg.classList.remove('hidden');
          coverPlaceholder.classList.add('hidden');

          const item = items.find(i => i.id === currentItemId);
          if (item) item.coverUrl = coverUrl;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Estatísticas
  function calculateStats() {
    if (jStart.value && jFinish.value) {
      const start = new Date(jStart.value);
      const finish = new Date(jFinish.value);
      const diffDays = Math.ceil((finish - start) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        statsBanner.classList.remove('hidden');
        statsText.textContent = `📊 Concluído em ${diffDays === 0 ? '1 dia (no mesmo dia!)' : diffDays + ' dias'}! 🎉`;
      } else {
        statsBanner.classList.add('hidden');
      }
    } else {
      statsBanner.classList.add('hidden');
    }
  }

  [jStart, jFinish].forEach(input => {
    if (input) input.addEventListener('change', calculateStats);
  });

  // Salvar Journal
  if (btnSaveJournal) {
    btnSaveJournal.addEventListener('click', () => {
      const item = items.find(i => i.id === currentItemId);
      if (item) {
        item.author = jAuthor.value;
        item.genre = jGenre.value;
        item.pages = jPages.value;
        item.episodes = jEpisodes.value;
        item.duration = jDuration.value;
        item.startDate = jStart.value;
        item.finishDate = jFinish.value;
        item.synopsis = jSynopsis.value;
        item.thoughts = jThoughts.value;
        item.quotes = jQuotes.value;
        item.rating = tempJournalRating;

        saveItems();
        triggerCelebration(item.type);
      }
      journalModal.classList.add('hidden');
    });
  }

  if (btnCloseJournal) {
    btnCloseJournal.addEventListener('click', () => journalModal.classList.add('hidden'));
  }

  document.querySelectorAll('.clickable-sparkle').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerCelebration('mc-movie');
    });
  });

  // Fechar modais clicando no fundo
  [ratingModal, journalModal, duplicateModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  renderMediaList();
});