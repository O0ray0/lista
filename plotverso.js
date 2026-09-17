/* ==========================================================================
   PLOTVERSO - SCRIPT COMPLETO COM SISTEMA DE AUTENTICAÇÃO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. PALETA DE CORES (Confetes)
  const candyColors = [
    '#FF3197', '#FF99DF', '#FFAC8F', '#FEFDB2', '#6CEBEF', '#9BB7E8'
  ];

  // 2. SISTEMA DE AUTENTICAÇÃO (LOGIN / CADASTRO)
  const authContainer = document.getElementById('auth-container');
  const appContent = document.getElementById('app-content');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const authUsernameInput = document.getElementById('auth-username');
  const authPasswordInput = document.getElementById('auth-password');
  const authError = document.getElementById('auth-error');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const btnToggleAuth = document.getElementById('btn-toggle-auth');
  const authToggleMsg = document.getElementById('auth-toggle-msg');
  const userGreeting = document.getElementById('user-greeting');
  const btnLogout = document.getElementById('btn-logout');

  let isRegisterMode = false;

  function getUsers() {
    return JSON.parse(localStorage.getItem('plotverso_users')) || {};
  }

  function getLoggedInUser() {
    return localStorage.getItem('plotverso_logged_user');
  }

  function checkAuth() {
    const activeUser = getLoggedInUser();
    if (activeUser) {
      if (authContainer) authContainer.classList.add('hidden');
      if (appContent) appContent.classList.remove('hidden');
      if (userGreeting) userGreeting.textContent = `Olá, ${activeUser}! ✨`;
      loadUserItems(activeUser);
    } else {
      if (authContainer) authContainer.classList.remove('hidden');
      if (appContent) appContent.classList.add('hidden');
    }
  }

  if (btnToggleAuth) {
    btnToggleAuth.addEventListener('click', () => {
      isRegisterMode = !isRegisterMode;
      authError.style.display = 'none';
      authForm.reset();

      if (isRegisterMode) {
        authTitle.textContent = '⊹ ࣪ ˖ Criar Conta 𓏲ּ𝄢';
        authSubtitle.textContent = 'Escolha um usuário e senha para salvar suas mídias! ✨';
        btnAuthSubmit.textContent = 'Cadastrar ✨';
        authToggleMsg.textContent = 'Já tem uma conta?';
        btnToggleAuth.textContent = 'Fazer Login';
      } else {
        authTitle.textContent = '⊹ ࣪ ˖ Entrar no PlotVerso 𓏲ּ𝄢';
        authSubtitle.textContent = 'Digite seu usuário e senha para continuar ✨';
        btnAuthSubmit.textContent = 'Entrar ✨';
        authToggleMsg.textContent = 'Ainda não tem uma conta?';
        btnToggleAuth.textContent = 'Criar conta';
      }
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = authUsernameInput.value.trim().toLowerCase();
      const password = authPasswordInput.value.trim();

      if (!username || !password) return;

      const users = getUsers();

      if (isRegisterMode) {
        if (users[username]) {
          authError.textContent = 'Este usuário já existe! Escolha outro.';
          authError.style.display = 'block';
          return;
        }
        users[username] = { password: password };
        localStorage.setItem('plotverso_users', JSON.stringify(users));
        localStorage.setItem('plotverso_logged_user', username);
        checkAuth();
      } else {
        if (!users[username] || users[username].password !== password) {
          authError.textContent = 'Usuário ou senha incorretos!';
          authError.style.display = 'block';
          return;
        }
        localStorage.setItem('plotverso_logged_user', username);
        checkAuth();
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('plotverso_logged_user');
      checkAuth();
    });
  }

  // 3. CELEBRAÇÃO / CONFETES
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

  // 4. DETECÇÃO INTELIGENTE DE DUPLICADOS
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

  // 5. ESTADO DA APLICAÇÃO
  let items = [];

  function loadUserItems(user) {
    try {
      items = JSON.parse(localStorage.getItem(`plotverso_items_${user}`)) || [];
    } catch (e) {
      console.error('Erro ao carregar do localStorage:', e);
      items = [];
    }
    renderMediaList();
  }

  function saveItems() {
    const activeUser = getLoggedInUser();
    if (!activeUser) return;
    try {
      localStorage.setItem(`plotverso_items_${activeUser}`, JSON.stringify(items));
    } catch (e) {
      alert('Aviso: Não foi possível salvar no navegador.');
    }
    renderMediaList();
  }

  let currentItemId = null;
  let tempRating = 0;
  let tempJournalRating = 0;
  let pendingTitleToAdd = null;
  let pendingTypeToAdd = null;

  let activeTab = 'pending'; 
  let activeFilter = 'all';

  // 6. ELEMENTOS DO DOM
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
    'mc-show': '⛏📺', 
    'mc-movie': '⛏🎬' 
  };

  const typeLabels = {
    movie: 'Filme',
    show: 'Série',
    book: 'Livro',
    'mc-show': 'Minecraft Série',
    'mc-movie': 'Minecraft Filme'
  };

  // 7. RENDERIZAÇÃO DA LISTA COM SEPARAÇÃO DE ABAS
  function renderMediaList() {
    if (!mediaList) return;
    mediaList.innerHTML = '';

    let filtered = items.filter(item => {
      if (activeTab === 'pending') return !item.completed;
      if (activeTab === 'completed') return item.completed;
      return true;
    });

    filtered = filtered.filter(item => {
      if (activeFilter === 'all') return true;
      return item.type === activeFilter;
    });

    if (counterBadge) {
      counterBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`;
    }

    if (filtered.length === 0) {
      const emptyMsg = activeTab === 'completed' 
        ? 'Nenhum item concluído ainda! ✨' 
        : 'Sua lista para assistir/ler está vazia! ✨';
      mediaList.innerHTML = `<li style="padding:15px; text-align:center; color:#8C0902;">${emptyMsg}</li>`;
      return;
    }

    filtered.forEach(item => {
      const li = document.createElement('li');
      li.className = `media-item ${item.completed ? 'completed' : ''}`;
      
      const icon = typeIcons[item.type] || '📁';
      const ratingStars = item.rating > 0 ? '★'.repeat(item.rating) : 'Sem nota';
      const sparkle = item.sparkle ? '✨' : '';

      li.innerHTML = `
        <div class="item-left">
          <input type="checkbox" class="custom-check" ${item.completed ? 'checked' : ''} data-id="${item.id}">
          <span class="item-title">${icon} ${escapeHTML(item.title)}</span>
        </div>
        <div class="item-right">
          ${item.completed ? `<span class="rating-badge">${ratingStars} ${sparkle}</span>` : ''}
          <button class="btn-open-journal" data-id="${item.id}">📖 Review</button>
          <button class="btn-delete" data-id="${item.id}" title="Excluir">✖</button>
        </div>
      `;

      mediaList.appendChild(li);
    });

    mediaList.querySelectorAll('.custom-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = items.find(i => i.id === id);
        if (item) {
          item.completed = e.target.checked;
          if (item.completed) {
            triggerCelebration(item.type);
            openRatingModal(item.id);
          }
          saveItems();
        }
      });
    });

    mediaList.querySelectorAll('.btn-open-journal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        openJournalModal(id);
      });
    });

    mediaList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        items = items.filter(i => i.id !== id);
        saveItems();
      });
    });
  }

  // 8. GERENCIAMENTO DE ITENS
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
      start: '',
      finish: '',
      synopsis: '',
      thoughts: '',
      quotes: '',
      cover: ''
    };
    items.unshift(newItem);
    saveItems();
  }

  if (mediaForm) {
    mediaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const type = typeSelect.value;

      if (!title) return;

      const similar = findSimilarItem(title);
      if (similar) {
        pendingTitleToAdd = title;
        pendingTypeToAdd = type;
        if (duplicateItemInfo) {
          duplicateItemInfo.textContent = `Você já possui "${similar.title}" como ${typeLabels[similar.type] || 'item'}.`;
        }
        duplicateModal.classList.remove('hidden');
      } else {
        createNewItem(title, type);
        titleInput.value = '';
      }
    });
  }

  if (btnAddAnyway) {
    btnAddAnyway.addEventListener('click', () => {
      if (pendingTitleToAdd && pendingTypeToAdd) {
        createNewItem(pendingTitleToAdd, pendingTypeToAdd);
        pendingTitleToAdd = null;
        pendingTypeToAdd = null;
        if (titleInput) titleInput.value = '';
      }
      duplicateModal.classList.add('hidden');
    });
  }

  if (btnDismissDuplicate) {
    btnDismissDuplicate.addEventListener('click', () => {
      duplicateModal.classList.add('hidden');
      pendingTitleToAdd = null;
      pendingTypeToAdd = null;
    });
  }

  // 9. MODAL DE AVALIAÇÃO RÁPIDA
  function openRatingModal(id) {
    currentItemId = id;
    const item = items.find(i => i.id === id);
    if (!item) return;

    modalItemTitle.textContent = item.title;
    tempRating = item.rating || 0;
    sparkleCheck.checked = !!item.sparkle;

    updateStarRatingUI(starRatingContainer, tempRating);
    ratingModal.classList.remove('hidden');
  }

  function updateStarRatingUI(container, rating) {
    if (!container) return;
    const stars = container.querySelectorAll('span');
    stars.forEach(s => {
      const val = parseInt(s.getAttribute('data-value'));
      if (val <= rating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }

  if (starRatingContainer) {
    starRatingContainer.querySelectorAll('span').forEach(star => {
      star.addEventListener('click', () => {
        tempRating = parseInt(star.getAttribute('data-value'));
        updateStarRatingUI(starRatingContainer, tempRating);
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

  // 10. MODAL JOURNAL (REVIEW PAGE)
  function openJournalModal(id) {
    currentItemId = id;
    const item = items.find(i => i.id === id);
    if (!item) return;

    const icon = typeIcons[item.type] || '🎬';
    journalTitleDisplay.innerHTML = `<span>${icon}</span> ${escapeHTML(item.title)}`;
    jFormatText.textContent = typeLabels[item.type] || 'Mídia';
    
    jAuthor.value = item.author || '';
    jGenre.value = item.genre || '';
    jPages.value = item.pages || '';
    jEpisodes.value = item.episodes || '';
    jDuration.value = item.duration || '';
    jStart.value = item.start || '';
    jFinish.value = item.finish || '';
    jSynopsis.value = item.synopsis || '';
    jThoughts.value = item.thoughts || '';
    jQuotes.value = item.quotes || '';

    tempJournalRating = item.rating || 0;
    updateStarRatingUI(journalStarsContainer, tempJournalRating);

    if (item.sparkle) {
      journalSparkleBadge.classList.remove('hidden');
    } else {
      journalSparkleBadge.classList.add('hidden');
    }

    rowPages.classList.add('hidden');
    rowEpisodes.classList.add('hidden');
    rowDuration.classList.add('hidden');

    if (item.type === 'book') {
      rowPages.classList.remove('hidden');
    } else if (item.type === 'show' || item.type === 'mc-show') {
      rowEpisodes.classList.remove('hidden');
    } else if (item.type === 'movie' || item.type === 'mc-movie') {
      rowDuration.classList.remove('hidden');
    }

    if (item.cover) {
      journalCoverImg.src = item.cover;
      journalCoverImg.classList.remove('hidden');
      coverPlaceholder.classList.add('hidden');
    } else {
      journalCoverImg.src = '';
      journalCoverImg.classList.add('hidden');
      coverPlaceholder.classList.remove('hidden');
    }

    calculateStats(item);
    journalModal.classList.remove('hidden');
  }

  function calculateStats(item) {
    if (!item.start || !item.finish) {
      statsBanner.classList.add('hidden');
      return;
    }

    const startDate = new Date(item.start);
    const finishDate = new Date(item.finish);
    const diffTime = finishDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (isNaN(diffDays) || diffDays < 1) {
      statsBanner.classList.add('hidden');
      return;
    }

    let msg = `Concluído em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}! `;

    if (item.type === 'book' && item.pages && diffDays > 0) {
      const pPerDay = Math.round(item.pages / diffDays);
      msg += `📖 Média de ~${pPerDay} páginas por dia.`;
    } else if ((item.type === 'show' || item.type === 'mc-show') && item.episodes && diffDays > 0) {
      const epPerDay = (item.episodes / diffDays).toFixed(1);
      msg += `📺 Média de ~${epPerDay} episódios por dia.`;
    }

    statsText.textContent = msg;
    statsBanner.classList.remove('hidden');
  }

  if (journalStarsContainer) {
    journalStarsContainer.querySelectorAll('span').forEach(star => {
      star.addEventListener('click', () => {
        tempJournalRating = parseInt(star.getAttribute('data-value'));
        updateStarRatingUI(journalStarsContainer, tempJournalRating);
      });
    });
  }

  if (coverFrame && coverFileInput) {
    coverFrame.addEventListener('click', () => coverFileInput.click());

    coverFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64Img = evt.target.result;
          journalCoverImg.src = base64Img;
          journalCoverImg.classList.remove('hidden');
          coverPlaceholder.classList.add('hidden');

          const item = items.find(i => i.id === currentItemId);
          if (item) {
            item.cover = base64Img;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.querySelectorAll('.clickable-sparkle').forEach(sparkle => {
    sparkle.addEventListener('click', () => {
      const item = items.find(i => i.id === currentItemId);
      triggerCelebration(item ? item.type : 'movie');
    });
  });

  if (btnSaveJournal) {
    btnSaveJournal.addEventListener('click', () => {
      const item = items.find(i => i.id === currentItemId);
      if (item) {
        item.author = jAuthor.value;
        item.genre = jGenre.value;
        item.pages = jPages.value;
        item.episodes = jEpisodes.value;
        item.duration = jDuration.value;
        item.start = jStart.value;
        item.finish = jFinish.value;
        item.synopsis = jSynopsis.value;
        item.thoughts = jThoughts.value;
        item.quotes = jQuotes.value;
        item.rating = tempJournalRating;

        saveItems();
      }
      journalModal.classList.add('hidden');
    });
  }

  if (btnCloseJournal) {
    btnCloseJournal.addEventListener('click', () => {
      journalModal.classList.add('hidden');
    });
  }

  [jStart, jFinish, jPages, jEpisodes].forEach(input => {
    if (input) {
      input.addEventListener('change', () => {
        const item = items.find(i => i.id === currentItemId);
        if (item) {
          const tempItem = {
            ...item,
            start: jStart.value,
            finish: jFinish.value,
            pages: jPages.value,
            episodes: jEpisodes.value
          };
          calculateStats(tempItem);
        }
      });
    }
  });

  // 11. ABA E FILTROS DE NAVEGAÇÃO
  if (tabAll) {
    tabAll.addEventListener('click', () => {
      activeTab = 'pending';
      tabAll.classList.add('active');
      tabCompleted.classList.remove('active');
      if (listTitle) listTitle.textContent = 'Para Assistir / Ler';
      renderMediaList();
    });
  }

  if (tabCompleted) {
    tabCompleted.addEventListener('click', () => {
      activeTab = 'completed';
      tabCompleted.classList.add('active');
      tabAll.classList.remove('active');
      if (listTitle) listTitle.textContent = 'Assistidos / Lidos';
      renderMediaList();
    });
  }
  
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      activeFilter = e.target.value;
      renderMediaList();
    });
  }

  // Checagem inicial de login para carregar a aplicação
  checkAuth();
});