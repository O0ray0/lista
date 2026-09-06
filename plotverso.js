/* ==========================================================================
   PLOTVERSO - CÓDIGO JS COMPLETO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. PALETA DE CORES CANDY / MACARON (Confetes)
  // --------------------------------------------------------------------------
  const candyColors = [
    '#FF3197', // Raspberry Macaron
    '#FF99DF', // Candy Floss
    '#FFAC8F', // Creamsicle Mousse
    '#FEFDB2', // Vanilla Pudding
    '#6CEBEF', // Blue Hawaii
    '#9BB7E8'  // Sky Crepe
  ];

  // --------------------------------------------------------------------------
  // 2. FUNÇÃO DE CONFETES / CELEBRAÇÃO (MUITO MAIS CONFETE E COLORIDO)
  // --------------------------------------------------------------------------
  function triggerCelebration(type) {
    if (typeof confetti !== 'undefined') {
      
      // 1. Grande explosão central (250 confetes nas cores da sua paleta!)
      confetti({
        particleCount: 2500,
        spread: 120,
        startVelocity: 60,
        origin: { y: 0.6 },
        colors: candyColors,
        ticks: 350 // Fica caindo por bastante tempo
      });

      // 2. Canhão lateral da Esquerda
      confetti({
        particleCount: 1200,
        angle: 60,
        spread: 90,
        startVelocity: 50,
        origin: { x: 0, y: 0.75 },
        colors: candyColors,
        ticks: 300
      });

      // 3. Canhão lateral da Direita
      confetti({
        particleCount: 1200,
        angle: 120,
        spread: 90,
        startVelocity: 50,
        origin: { x: 1, y: 0.75 },
        colors: candyColors,
        ticks: 300
      });

      // Define emoji temático
      let scalarEmoji = '🎬';
      if (type === 'book') scalarEmoji = '📚';
      if (type === 'show') scalarEmoji = '📺';

      // 4. Chuva extra de emojis voadores
      confetti({
        particleCount: 35,
        spread: 140,
        startVelocity: 45,
        origin: { y: 0.6 },
        shapes: [confetti.shapeFromText({ text: scalarEmoji, scalar: 2.5 })],
        scalar: 2.5,
        ticks: 250
      });
    }
  }

  // Torna acessível globalmente para botões HTML (ex: onclick="window.triggerCelebration('movie')")
  window.triggerCelebration = triggerCelebration;

  // --------------------------------------------------------------------------
  // 3. ESTADO DA APLICAÇÃO (LOCALSTORAGE)
  // --------------------------------------------------------------------------
  let items = JSON.parse(localStorage.getItem('plotverso_items')) || [];

  function saveItems() {
    localStorage.setItem('plotverso_items', JSON.stringify(items));
    renderMediaList();
  }

  // --------------------------------------------------------------------------
  // 4. ELEMENTOS DO DOM
  // --------------------------------------------------------------------------
  const mediaForm = document.getElementById('mediaForm');
  const mediaList = document.getElementById('mediaList');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');

  // Modal
  const detailsModal = document.getElementById('detailsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalContent = document.getElementById('modalContent');

  // --------------------------------------------------------------------------
  // 5. RENDERIZAÇÃO DA LISTA DE MÍDIAS
  // --------------------------------------------------------------------------
  function renderMediaList() {
    if (!mediaList) return;
    
    mediaList.innerHTML = '';

    const currentType = typeFilter ? typeFilter.value : 'all';
    const currentStatus = statusFilter ? statusFilter.value : 'all';
    const currentQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filteredItems = items.filter(item => {
      const matchType = (currentType === 'all' || item.type === currentType);
      const matchStatus = (currentStatus === 'all' || item.status === currentStatus);
      const matchQuery = item.title.toLowerCase().includes(currentQuery) ||
                         (item.notes && item.notes.toLowerCase().includes(currentQuery));
      return matchType && matchStatus && matchQuery;
    });

    if (filteredItems.length === 0) {
      mediaList.innerHTML = `<p class="empty-msg">Nenhum item encontrado.</p>`;
      return;
    }

    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = `media-card status-${item.status}`;
      
      const typeIcons = { movie: '🎬', show: '📺', book: '📚' };
      const icon = typeIcons[item.type] || '🍿';

      let progressHTML = '';
      if (item.type === 'book' && item.totalPages) {
        const percent = Math.round(((item.currentPage || 0) / item.totalPages) * 100);
        progressHTML = `
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percent}%;"></div>
          </div>
          <small>${item.currentPage || 0} / ${item.totalPages} págs (${percent}%)</small>
        `;
      }

      card.innerHTML = `
        <div class="card-cover" style="background-image: url('${item.coverUrl || 'https://via.placeholder.com/150x225?text=Sem+Capa'}')">
          <span class="type-badge">${icon}</span>
        </div>
        <div class="card-info">
          <h3>${item.title}</h3>
          <p class="status-tag">${formatStatus(item.status)}</p>
          ${progressHTML}
          <div class="card-actions">
            <button class="btn-celebrate" data-id="${item.id}" data-type="${item.type}" title="Comemorar!">✨</button>
            <button class="btn-details" data-id="${item.id}">Ver Detalhes</button>
            <button class="btn-delete" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;

      mediaList.appendChild(card);
    });

    attachCardEvents();
  }

  function formatStatus(status) {
    const map = {
      'want_to_watch': 'Quero Ver/Ler',
      'in_progress': 'Lendo/Assistindo',
      'completed': 'Concluído',
      'abandoned': 'Abandonado'
    };
    return map[status] || status;
  }

  // --------------------------------------------------------------------------
  // 6. EVENTOS NOS CARDS (COMEMORAR, DETALHES, EXCLUIR)
  // --------------------------------------------------------------------------
  function attachCardEvents() {
    // Botão de Comemoração / Confetes
    document.querySelectorAll('.btn-celebrate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        triggerCelebration(type);
      });
    });

    // Botão de Detalhes
    document.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openModal(id);
      });
    });

    // Botão de Deletar
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja realmente remover este item?')) {
          items = items.filter(i => i.id !== id);
          saveItems();
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 7. FORMULÁRIO DE ADIÇÃO DE MÍDIA
  // --------------------------------------------------------------------------
  if (mediaForm) {
    mediaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newItem = {
        id: Date.now().toString(),
        title: document.getElementById('titleInput').value.trim(),
        type: document.getElementById('typeInput').value,
        status: document.getElementById('statusInput').value,
        coverUrl: document.getElementById('coverInput').value.trim(),
        currentPage: parseInt(document.getElementById('currentPageInput')?.value) || 0,
        totalPages: parseInt(document.getElementById('totalPagesInput')?.value) || 0,
        reflection: document.getElementById('reflectionInput')?.value.trim() || '',
        createdAt: new Date().toISOString()
      };

      items.unshift(newItem);
      saveItems();
      mediaForm.reset();

      // Dispara os confetes ao adicionar novo item
      triggerCelebration(newItem.type);
    });
  }

  // --------------------------------------------------------------------------
  // 8. MODAL DE DETALHES E DIÁRIO DE REFLEXÃO
  // --------------------------------------------------------------------------
  function openModal(id) {
    const item = items.find(i => i.id === id);
    if (!item || !detailsModal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>${item.title}</h2>
        <span class="status-badge">${formatStatus(item.status)}</span>
      </div>
      <div class="modal-body">
        <div class="modal-cover">
          <img src="${item.coverUrl || 'https://via.placeholder.com/200x300'}" alt="${item.title}">
        </div>
        <div class="modal-details">
          <h4>Diário de Reflexão & Anotações</h4>
          <textarea id="modalReflection" placeholder="Escreva suas impressões, teorias e sentimentos...">${item.reflection || ''}</textarea>
          
          ${item.type === 'book' ? `
            <div class="modal-progress-edit">
              <label>Página Atual:</label>
              <input type="number" id="modalCurrentPage" value="${item.currentPage || 0}">
              <label>Total de Páginas:</label>
              <input type="number" id="modalTotalPages" value="${item.totalPages || 0}">
            </div>
          ` : ''}

          <div class="modal-actions">
            <button id="saveModalBtn" class="btn-primary">Salvar Alterações</button>
            <button id="celebrateModalBtn" class="btn-celebrate-modal">Comemorar Conclusão ✨</button>
          </div>
        </div>
      </div>
    `;

    detailsModal.style.display = 'block';

    // Salvar alterações no Modal
    document.getElementById('saveModalBtn').addEventListener('click', () => {
      item.reflection = document.getElementById('modalReflection').value;
      if (item.type === 'book') {
        item.currentPage = parseInt(document.getElementById('modalCurrentPage').value) || 0;
        item.totalPages = parseInt(document.getElementById('modalTotalPages').value) || 0;
        if (item.currentPage >= item.totalPages && item.totalPages > 0) {
          item.status = 'completed';
        }
      }
      saveItems();
      detailsModal.style.display = 'none';
    });

    // Botão de Comemoração dentro do Modal
    document.getElementById('celebrateModalBtn').addEventListener('click', () => {
      triggerCelebration(item.type);
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      detailsModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === detailsModal) {
      detailsModal.style.display = 'none';
    }
  });

  // --------------------------------------------------------------------------
  // 9. FILTROS E BUSCA
  // --------------------------------------------------------------------------
  if (typeFilter) typeFilter.addEventListener('change', renderMediaList);
  if (statusFilter) statusFilter.addEventListener('change', renderMediaList);
  if (searchInput) searchInput.addEventListener('input', renderMediaList);

  // Inicialização
  renderMediaList();
});