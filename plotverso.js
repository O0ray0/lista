/* ==========================================================================
   PLOTVERSO - LÓGICA COMPLETA E ATUALIZADA
   ========================================================================== */

let mediaItems = JSON.parse(localStorage.getItem('plotverso_items')) || [];
let activeTab = 'active'; // 'active' ou 'completed'
let currentFilter = 'all';
let currentEditId = null;
let currentRating = 0;
let currentJournalRating = 0;

// Mapeamento de tipos e emojis do canto superior esquerdo
const typeInfo = {
  'movie': { label: 'Filme', emoji: '🎬' },
  'book': { label: 'Livro', emoji: '📚' },
  'show': { label: 'Série', emoji: '📺' },
  'mc-show': { label: 'Minecraft Série', emoji: '⛏📺' },
  'mc-movie': { label: 'Minecraft Filme', emoji: '⛏🎬' }
};

// Elementos do DOM
const mediaForm = document.getElementById('media-form');
const titleInput = document.getElementById('title-input');
const typeSelect = document.getElementById('type-select');
const mediaList = document.getElementById('media-list');
const counter = document.getElementById('counter');

const tabActive = document.getElementById('tab-active');
const tabCompleted = document.getElementById('tab-completed');
const filterSelect = document.getElementById('filter-select');

// Modais
const ratingModal = document.getElementById('rating-modal');
const modalItemTitle = document.getElementById('modal-item-title');
const starRatingContainer = document.getElementById('star-rating');
const btnSaveRating = document.getElementById('btn-save-rating');
const btnOpenJournalFromModal = document.getElementById('btn-open-journal-from-modal');
const sparkleEmoji = document.getElementById('clickable-sparkle-emoji');

const journalModal = document.getElementById('journal-modal');
const btnCloseJournal = document.getElementById('btn-close-journal');
const btnSaveJournal = document.getElementById('btn-save-journal');

// Elementos do Diário
const coverFrame = document.getElementById('cover-frame');
const coverImg = document.getElementById('journal-cover-img');
const coverPlaceholder = document.getElementById('cover-placeholder');
const coverFileInput = document.getElementById('cover-file-input');
const journalTitleDisplay = document.getElementById('journal-title-display');

const jAuthor = document.getElementById('j-author');
const jFormatText = document.getElementById('j-format-text');
const jGenre = document.getElementById('j-genre');
const jTime = document.getElementById('j-time');
const jStart = document.getElementById('j-start');
const jFinish = document.getElementById('j-finish');
const journalStarsContainer = document.getElementById('journal-stars');

const jSynopsis = document.getElementById('j-synopsis');
const jThoughts = document.getElementById('j-thoughts');
const jQuotes = document.getElementById('j-quotes');

/* ==========================================================================
   INICIALIZAÇÃO E EVENTOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderList();
  setupPlaceholders();

  // Adicionar item
  mediaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const type = typeSelect.value;

    if (!title) return;

    const newItem = {
      id: Date.now().toString(),
      title: title,
      type: type,
      completed: false,
      rating: 0,
      journal: {
        cover: '',
        author: '',
        genre: '',
        time: '',
        start: '',
        finish: '',
        synopsis: '',
        thoughts: '',
        quotes: ''
      }
    };

    mediaItems.unshift(newItem);
    saveToLocalStorage();
    titleInput.value = '';
    renderList();
  });

  // Troca de Abas
  tabActive.addEventListener('click', () => {
    activeTab = 'active';
    tabActive.classList.add('active');
    tabCompleted.classList.remove('active');
    renderList();
  });

  tabCompleted.addEventListener('click', () => {
    activeTab = 'completed';
    tabCompleted.classList.add('active');
    tabActive.classList.remove('active');
    renderList();
  });

  // Filtro
  filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderList();
  });

  // Estrelas
  setupStars(starRatingContainer, (rating) => { currentRating = rating; });
  setupStars(journalStarsContainer, (rating) => { currentJournalRating = rating; });

  // Confetti no emoji interativo
  if (sparkleEmoji) {
    sparkleEmoji.addEventListener('click', () => triggerConfetti());
  }

  // Salvar Avaliação Rápida
  btnSaveRating.addEventListener('click', () => {
    if (!currentEditId) return;
    const item = mediaItems.find(i => i.id === currentEditId);
    if (item) {
      item.rating = currentRating;
      saveToLocalStorage();
      renderList();
      closeRatingModal();
    }
  });

  btnOpenJournalFromModal.addEventListener('click', () => {
    closeRatingModal();
    openJournalModal(currentEditId);
  });

  btnCloseJournal.addEventListener('click', closeJournalModal);

  // Upload da Imagem da Capa
  coverFrame.addEventListener('click', () => coverFileInput.click());
  coverFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        coverImg.src = event.target.result;
        coverImg.classList.remove('hidden');
        coverPlaceholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Máscaras e Cálculos de Data
  [jStart, jFinish].forEach(input => {
    input.addEventListener('input', (e) => {
      formatDateInput(e.target);
      calculateStats();
    });
  });

  jTime.addEventListener('input', calculateStats);

  // Salvar Diário
  btnSaveJournal.addEventListener('click', () => {
    if (!currentEditId) return;
    const item = mediaItems.find(i => i.id === currentEditId);

    if (item) {
      item.rating = currentJournalRating;
      item.journal = {
        cover: coverImg.classList.contains('hidden') ? '' : coverImg.src,
        author: jAuthor.value,
        genre: jGenre.value,
        time: jTime.value,
        start: jStart.value,
        finish: jFinish.value,
        synopsis: jSynopsis.value,
        thoughts: jThoughts.value,
        quotes: jQuotes.value
      };

      saveToLocalStorage();
      renderList();
      closeJournalModal();
      triggerConfetti();
    }
  });
});

/* ==========================================================================
   MÁSCARAS, PLACEHOLDERS E CÁLCULOS
   ========================================================================== */

// Placeholders dinâmicos que limpam no foco e voltam no blur
function setupPlaceholders() {
  const inputs = document.querySelectorAll('#journal-modal input, #journal-modal textarea');
  inputs.forEach(input => {
    const originalPlaceholder = input.placeholder;
    input.addEventListener('focus', () => {
      input.dataset.ph = originalPlaceholder;
      input.placeholder = '';
    });
    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        input.placeholder = input.dataset.ph || originalPlaceholder;
      }
    });
  });
}

// Máscara de data fixa DD/MM/AAAA
function formatDateInput(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 8) v = v.substring(0, 8);
  if (v.length > 4) {
    input.value = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
  } else if (v.length > 2) {
    input.value = `${v.substring(0, 2)}/${v.substring(2)}`;
  } else {
    input.value = v;
  }
}

// Cálculo de dias e estatísticas (Páginas/dia ou Episódios)
function calculateStats() {
  const statsBox = document.getElementById('journal-stats-info');
  if (!statsBox) return;

  const item = mediaItems.find(i => i.id === currentEditId);
  if (!item) return;

  const startVal = parseDate(jStart.value);
  const finishVal = parseDate(jFinish.value);

  if (!startVal || !finishVal || finishVal < startVal) {
    statsBox.innerHTML = '';
    return;
  }

  const diffTime = Math.abs(finishVal - startVal);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  let extraInfo = `⏱️ Você levou <strong>${diffDays} dia(s)</strong> para concluir.`;

  const amount = parseInt(jTime.value.replace(/\D/g, '')) || 0;

  if (item.type === 'book' && amount > 0) {
    const pagesPerDay = (amount / diffDays).toFixed(1);
    extraInfo += `<br>📖 Média de <strong>${pagesPerDay} páginas/dia</strong> (${amount} págs no total).`;
  } else if ((item.type === 'show' || item.type === 'mc-show') && amount > 0) {
    const epsPerDay = (amount / diffDays).toFixed(1);
    extraInfo += `<br>📺 Média de <strong>${epsPerDay} episódios/dia</strong> (${amount} eps no total).`;
  }

  statsBox.innerHTML = extraInfo;
}

function parseDate(str) {
  const parts = str.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return null;
}

/* ==========================================================================
   RENDERIZAÇÃO DA LISTA E MODAIS
   ========================================================================== */

function renderList() {
  mediaList.innerHTML = '';

  const filtered = mediaItems.filter(item => {
    const matchesTab = activeTab === 'completed' ? item.completed : !item.completed;
    const matchesType = currentFilter === 'all' ? true : item.type === currentFilter;
    return matchesTab && matchesType;
  });

  counter.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`;

  filtered.forEach(item => {
    const li = document.createElement('li');
    li.className = `media-item ${item.completed ? 'completed' : ''}`;
    const starsDisplay = item.rating > 0 ? '★'.repeat(item.rating) : '☆☆☆☆☆';

    li.innerHTML = `
      <div class="item-left">
        <input type="checkbox" class="custom-check" ${item.completed ? 'checked' : ''} data-id="${item.id}">
        <span class="item-title">${escapeHtml(item.title)}</span>
      </div>
      <div class="item-right">
        <span class="rating-badge">${starsDisplay}</span>
        <button class="btn-open-journal" data-id="${item.id}">Journal Page</button>
        <button class="btn-delete" data-id="${item.id}">&times;</button>
      </div>
    `;

    li.querySelector('.custom-check').addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const targetItem = mediaItems.find(i => i.id === id);
      if (targetItem) {
        targetItem.completed = e.target.checked;
        saveToLocalStorage();
        if (targetItem.completed) openRatingModal(id);
        else renderList();
      }
    });

    li.querySelector('.btn-open-journal').addEventListener('click', (e) => {
      openJournalModal(e.target.getAttribute('data-id'));
    });

    li.querySelector('.btn-delete').addEventListener('click', (e) => {
      mediaItems = mediaItems.filter(i => i.id !== e.target.getAttribute('data-id'));
      saveToLocalStorage();
      renderList();
    });

    mediaList.appendChild(li);
  });
}

function openJournalModal(id) {
  currentEditId = id;
  const item = mediaItems.find(i => i.id === id);
  if (!item) return;

  const info = typeInfo[item.type] || { label: item.type, emoji: '✨' };

  // Atualizar Emoji do canto superior esquerdo
  const cornerEmoji = document.getElementById('journal-corner-emoji');
  if (cornerEmoji) cornerEmoji.textContent = info.emoji;

  journalTitleDisplay.textContent = item.title;
  jFormatText.textContent = info.label;

  const j = item.journal || {};
  jAuthor.value = j.author || '';
  jGenre.value = j.genre || '';
  jTime.value = j.time || '';
  jStart.value = j.start || '';
  jFinish.value = j.finish || '';
  jSynopsis.value = j.synopsis || '';
  jThoughts.value = j.thoughts || '';
  jQuotes.value = j.quotes || '';

  if (j.cover) {
    coverImg.src = j.cover;
    coverImg.classList.remove('hidden');
    coverPlaceholder.classList.add('hidden');
  } else {
    coverImg.src = '';
    coverImg.classList.add('hidden');
    coverPlaceholder.classList.remove('hidden');
  }

  currentJournalRating = item.rating || 0;
  highlightStars(journalStarsContainer.querySelectorAll('span'), currentJournalRating);

  calculateStats();
  journalModal.classList.remove('hidden');
}

function openRatingModal(id) {
  currentEditId = id;
  const item = mediaItems.find(i => i.id === id);
  if (!item) return;

  modalItemTitle.textContent = `Avaliar: ${item.title}`;
  currentRating = item.rating || 0;
  highlightStars(starRatingContainer.querySelectorAll('span'), currentRating);
  ratingModal.classList.remove('hidden');
}

function closeRatingModal() { ratingModal.classList.add('hidden'); }
function closeJournalModal() { journalModal.classList.add('hidden'); }

function setupStars(container, callback) {
  const stars = container.querySelectorAll('span');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      highlightStars(stars, val);
      callback(val);
    });
  });
}

function highlightStars(stars, count) {
  stars.forEach(star => {
    const val = parseInt(star.getAttribute('data-value'));
    if (val <= count) star.classList.add('active');
    else star.classList.remove('active');
  });
}

function triggerConfetti() {
  if (window.confetti) {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  }
}

function saveToLocalStorage() {
  localStorage.setItem('plotverso_items', JSON.stringify(mediaItems));
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}