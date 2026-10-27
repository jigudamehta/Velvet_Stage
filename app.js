/**
 * Velvet Stage — Application Engine
 * Supports 4 Themes, Song Library, Ritu H. Instagram integration, Choreography tracking, and Responsive Navigation
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    theme: localStorage.getItem('vs_theme') || 'dark-studio',
    isAuthenticated: localStorage.getItem('vs_auth') === 'true',
    user: JSON.parse(localStorage.getItem('vs_user') || '{"name":"Admin","role":"Administrator","username":"admin"}'),
    currentPage: 'dashboard',
    songs: [],
    filteredSongs: [],
    songPage: 1,
    songsPerPage: 15,
    songFilters: {
      search: '',
      occasion: '',
      difficulty: '',
      status: '',
      choreo: ''
    },
    snapshotOccasion: 'all'
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    applyTheme(state.theme);
    checkAuth();
    setupEventListeners();
    
    // Explicitly guarantee modal is hidden on load
    const modal = document.getElementById('song-modal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }

    loadSongs();
    updateDashboardDates();
  }

  // --- THEME MANAGEMENT ---
  function applyTheme(themeKey) {
    state.theme = themeKey;
    document.documentElement.setAttribute('data-theme', themeKey);
    localStorage.setItem('vs_theme', themeKey);

    // Update Theme Panel Radio States
    document.querySelectorAll('.theme-tile').forEach(tile => {
      const isMatch = tile.getAttribute('data-theme') === themeKey;
      tile.classList.toggle('active', isMatch);
      tile.setAttribute('aria-checked', isMatch ? 'true' : 'false');
    });

    // Update Settings Page Theme Pickers
    document.querySelectorAll('.theme-option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === themeKey);
    });

    // Update theme meta color for mobile browser bars
    const themeColors = {
      'dark-studio': '#10131b',
      'light-studio': '#f4f6fb',
      'black-gold': '#090909',
      'wedding': '#fff8f5'
    };
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme && themeColors[themeKey]) {
      metaTheme.setAttribute('content', themeColors[themeKey]);
    }
  }

  function toggleThemePanel(show) {
    const panel = document.getElementById('theme-panel');
    if (!panel) return;
    if (show !== undefined) {
      panel.hidden = !show;
    } else {
      panel.hidden = !panel.hidden;
    }
  }

  // --- AUTHENTICATION ---
  function checkAuth() {
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');

    if (state.isAuthenticated) {
      loginScreen.classList.remove('active');
      loginScreen.hidden = true;
      appShell.hidden = false;
      updateUserProfile();
    } else {
      loginScreen.classList.add('active');
      loginScreen.hidden = false;
      appShell.hidden = true;
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const userIn = document.getElementById('login-username').value.trim();
    const passIn = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    // Demo Authentication (admin / demo123)
    if (userIn === 'admin' && passIn === 'demo123') {
      state.isAuthenticated = true;
      state.user = { name: 'Admin', role: 'Administrator', username: 'admin' };
      localStorage.setItem('vs_auth', 'true');
      localStorage.setItem('vs_user', JSON.stringify(state.user));
      errorEl.textContent = '';
      checkAuth();
      showToast('Welcome back, Admin!');
    } else {
      errorEl.textContent = 'Invalid credentials. Demo: admin / demo123';
    }
  }

  function handleLogout() {
    state.isAuthenticated = false;
    localStorage.removeItem('vs_auth');
    checkAuth();
    showToast('Signed out of Velvet Stage');
  }

  function updateUserProfile() {
    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    const lastLoginEl = document.getElementById('last-login-time');

    if (userNameEl) userNameEl.textContent = state.user.name;
    if (userRoleEl) userRoleEl.textContent = state.user.role;
    if (lastLoginEl) {
      const now = new Date();
      lastLoginEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  // --- NAVIGATION ---
  function navigateTo(pageId) {
    state.currentPage = pageId;

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.hidden = true;
      page.classList.remove('active');
    });

    // Show target page
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
      target.hidden = false;
      target.classList.add('active');
    }

    // Update active nav links
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });

    // Update mobile bottom nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Password reveal
    const togglePwBtn = document.getElementById('toggle-pw');
    if (togglePwBtn) {
      togglePwBtn.addEventListener('click', () => {
        const pwInput = document.getElementById('login-password');
        pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
      });
    }

    // Logout
    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        if (page) navigateTo(page);
      });
    });

    // Mobile bottom nav
    document.querySelectorAll('.mobile-nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        if (page) {
          navigateTo(page);
        } else if (link.id === 'mobile-menu-btn') {
          openMobileSidebar();
        }
      });
    });

    // Mobile toggle & overlay
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', openMobileSidebar);

    const sidebarClose = document.getElementById('sidebar-close');
    if (sidebarClose) sidebarClose.addEventListener('click', closeMobileSidebar);

    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // In-page navigation links (e.g. data-page="songs")
    document.addEventListener('click', (e) => {
      const pageLink = e.target.closest('[data-page]');
      if (pageLink && !pageLink.classList.contains('nav-item') && !pageLink.classList.contains('mobile-nav-item')) {
        e.preventDefault();
        const targetPage = pageLink.getAttribute('data-page');
        if (targetPage) navigateTo(targetPage);
      }
    });

    // Theme toggle button in header
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleThemePanel();
      });
    }

    const themePanelClose = document.getElementById('theme-panel-close');
    if (themePanelClose) {
      themePanelClose.addEventListener('click', () => toggleThemePanel(false));
    }

    // Click outside theme panel to close
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('theme-panel');
      if (panel && !panel.hidden && !panel.contains(e.target) && e.target !== themeBtn && !themeBtn.contains(e.target)) {
        panel.hidden = true;
      }
    });

    // Theme selector tiles in panel
    document.querySelectorAll('.theme-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const selected = tile.getAttribute('data-theme');
        if (selected) {
          applyTheme(selected);
          showToast(`Switched theme to ${tile.querySelector('.theme-name').textContent}`);
        }
      });
    });

    // Theme buttons in Settings
    document.querySelectorAll('.theme-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-theme');
        if (selected) {
          applyTheme(selected);
          showToast(`Theme updated`);
        }
      });
    });

    // Song Filters
    const songSearch = document.getElementById('song-search');
    if (songSearch) {
      songSearch.addEventListener('input', (e) => {
        state.songFilters.search = e.target.value.toLowerCase();
        state.songPage = 1;
        applySongFilters();
      });
    }

    const occasionFilter = document.getElementById('song-filter-occasion');
    if (occasionFilter) {
      occasionFilter.addEventListener('change', (e) => {
        state.songFilters.occasion = e.target.value;
        state.songPage = 1;
        applySongFilters();
      });
    }

    const difficultyFilter = document.getElementById('song-filter-difficulty');
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        state.songFilters.difficulty = e.target.value;
        state.songPage = 1;
        applySongFilters();
      });
    }

    const statusFilter = document.getElementById('song-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        state.songFilters.status = e.target.value;
        state.songPage = 1;
        applySongFilters();
      });
    }

    const choreoFilter = document.getElementById('song-filter-choreo');
    if (choreoFilter) {
      choreoFilter.addEventListener('change', (e) => {
        state.songFilters.choreo = e.target.value;
        state.songPage = 1;
        applySongFilters();
      });
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-songs');
    if (exportBtn) exportBtn.addEventListener('click', exportSongsCSV);

    // Global Search in Header
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = globalSearch.value.trim();
          if (val) {
            navigateTo('songs');
            if (songSearch) {
              songSearch.value = val;
              state.songFilters.search = val.toLowerCase();
              applySongFilters();
            }
          }
        }
      });
    }

    // Dashboard snapshot chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.snapshotOccasion = chip.getAttribute('data-occasion');
        renderDashboardSnapshot();
      });
    });

    // Song Modal Close
    const modalClose = document.getElementById('song-modal-close');
    const modalOverlay = document.getElementById('song-modal');
    if (modalClose && modalOverlay) {
      modalClose.addEventListener('click', () => {
        modalOverlay.hidden = true;
        modalOverlay.style.display = 'none';
      });
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.hidden = true;
          modalOverlay.style.display = 'none';
        }
      });
    }
  }

  // --- SONGS DATA MANAGEMENT & GOOGLE SHEETS SYNC ---
  async function loadSongs() {
    const syncLabel = document.getElementById('sync-label');
    const syncDot = document.getElementById('sync-dot');
    const apiUrl = window.getApiUrl ? window.getApiUrl() : null;

    try {
      const cachedChoreo = JSON.parse(localStorage.getItem('vs_choreo_overrides') || '{}');
      let songsData = null;

      // If Google Apps Script Web App URL is provided
      if (apiUrl) {
        if (syncLabel) syncLabel.textContent = 'Google Sheets Connected';
        if (syncDot) syncDot.classList.add('synced');

        // Update Settings UI badges
        const dataModeVal = document.querySelectorAll('.settings-info-val');
        if (dataModeVal && dataModeVal.length >= 4) {
          dataModeVal[3].textContent = 'Google Sheets Live Connected';
        }
        const sheetsStatusBadge = document.querySelector('.integration-item .integration-status');
        if (sheetsStatusBadge) {
          sheetsStatusBadge.textContent = 'Connected';
          sheetsStatusBadge.className = 'integration-status partial';
        }

        try {
          const res = await fetch(`${apiUrl}?action=getSongs`);
          const data = await res.json();
          if (data && data.status === 'success' && data.songs && data.songs.length > 0) {
            songsData = data.songs;
            if (syncLabel) syncLabel.textContent = 'Sheets Synced';
          }
        } catch (gasErr) {
          console.warn('Google Sheets API unavailable or CORS redirect, using local catalog with background sync:', gasErr);
        }
      }

      // Fallback to embedded catalog or local songs.json
      if (!songsData) {
        if (window.VELVET_STAGE_DEFAULT_SONGS && Array.isArray(window.VELVET_STAGE_DEFAULT_SONGS)) {
          songsData = window.VELVET_STAGE_DEFAULT_SONGS;
        } else {
          try {
            const res = await fetch('songs.json');
            if (res.ok) songsData = await res.json();
          } catch (e) {
            console.warn('Local fetch error, using defaults:', e);
          }
        }
        if (syncLabel && !apiUrl) syncLabel.textContent = 'Local Demo Mode';
      }

      state.songs = songsData.map(song => ({
        ...song,
        choreoStatus: cachedChoreo[song.id] || song.choreoStatus || 'Not Started'
      }));

      state.filteredSongs = [...state.songs];

      renderSongTable();
      renderDashboardSnapshot();
      updateChoreoMetrics();
    } catch (err) {
      console.warn('Using fallback or local data:', err);
    }
  }

  function applySongFilters() {
    state.filteredSongs = state.songs.filter(song => {
      const q = state.songFilters.search;
      const matchSearch = !q ||
        (song.title && song.title.toLowerCase().includes(q)) ||
        (song.source && song.source.toLowerCase().includes(q)) ||
        (song.singer && song.singer.toLowerCase().includes(q)) ||
        (song.id && song.id.toLowerCase().includes(q));

      const matchOccasion = !state.songFilters.occasion ||
        (song.primaryOccasion && song.primaryOccasion === state.songFilters.occasion) ||
        (song.otherOccasions && song.otherOccasions.includes(state.songFilters.occasion));

      const matchDiff = !state.songFilters.difficulty || song.difficulty === state.songFilters.difficulty;
      const matchStatus = !state.songFilters.status || song.approvalStatus === state.songFilters.status;
      const matchChoreo = !state.songFilters.choreo || song.choreoStatus === state.songFilters.choreo;

      return matchSearch && matchOccasion && matchDiff && matchStatus && matchChoreo;
    });

    renderSongTable();
  }

  function renderSongTable() {
    const tbody = document.getElementById('song-table-body');
    const countLabel = document.getElementById('song-count-label');
    const pagination = document.getElementById('song-pagination');
    if (!tbody) return;

    if (countLabel) {
      countLabel.textContent = `${state.filteredSongs.length} songs`;
    }

    const start = (state.songPage - 1) * state.songsPerPage;
    const end = start + state.songsPerPage;
    const pageItems = state.filteredSongs.slice(start, end);

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted)">No songs match the current filters.</td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageItems.map(song => {
      const choreoClass = (song.choreoStatus || 'Not Started').toLowerCase().replace(/\s+/g, '-');
      const ytLink = song.youtubeSearch
        ? `<a href="${song.youtubeSearch}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);font-weight:600">Search ↗</a>`
        : `<span style="color:var(--muted)">—</span>`;

      return `
        <tr data-song-id="${song.id}">
          <td style="font-family:monospace;font-size:11px;color:var(--muted)">${song.id}</td>
          <td><strong style="color:var(--text);cursor:pointer" class="song-title-btn">${song.title}</strong></td>
          <td style="color:var(--muted)">${song.source || '—'}</td>
          <td><span class="occasion-tag">${song.primaryOccasion || '—'}</span></td>
          <td><span style="font-size:11px;font-weight:600">${song.difficulty || 'Medium'}</span></td>
          <td><span style="font-size:11px;color:var(--warning);font-weight:700">${song.approvalStatus || 'Pending'}</span></td>
          <td>
            <button class="choreo-badge ${choreoClass}" data-song-id="${song.id}" title="Click to cycle choreography status">
              ${song.choreoStatus}
            </button>
          </td>
          <td>${ytLink}</td>
          <td>
            <button class="btn-secondary btn-sm song-view-btn" data-song-id="${song.id}">View</button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('.song-view-btn, .song-title-btn').forEach(el => {
      el.addEventListener('click', () => {
        const row = el.closest('tr');
        const songId = row.getAttribute('data-song-id');
        openSongModal(songId);
      });
    });

    tbody.querySelectorAll('.choreo-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = badge.getAttribute('data-song-id');
        cycleChoreoStatus(songId);
      });
    });

    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('song-pagination');
    if (!container) return;

    const totalPages = Math.ceil(state.filteredSongs.length / state.songsPerPage);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `<button ${state.songPage === 1 ? 'disabled' : ''} id="pg-prev">Previous</button>`;
    
    for (let i = 1; i <= Math.min(totalPages, 7); i++) {
      html += `<button class="${i === state.songPage ? 'active' : ''}" data-page-num="${i}">${i}</button>`;
    }

    if (totalPages > 7) {
      html += `<span style="color:var(--muted);padding:0 4px">…</span>`;
      html += `<button class="${totalPages === state.songPage ? 'active' : ''}" data-page-num="${totalPages}">${totalPages}</button>`;
    }

    html += `<button ${state.songPage === totalPages ? 'disabled' : ''} id="pg-next">Next</button>`;
    container.innerHTML = html;

    const prevBtn = document.getElementById('pg-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (state.songPage > 1) {
        state.songPage--;
        renderSongTable();
      }
    });

    const nextBtn = document.getElementById('pg-next');
    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (state.songPage < totalPages) {
        state.songPage++;
        renderSongTable();
      }
    });

    container.querySelectorAll('[data-page-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.songPage = parseInt(btn.getAttribute('data-page-num'), 10);
        renderSongTable();
      });
    });
  }

  function cycleChoreoStatus(songId) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;

    const sequence = ['Not Started', 'In Progress', 'Completed'];
    const currentIndex = sequence.indexOf(song.choreoStatus);
    const nextIndex = (currentIndex + 1) % sequence.length;
    song.choreoStatus = sequence[nextIndex];

    // Cache override
    const cached = JSON.parse(localStorage.getItem('vs_choreo_overrides') || '{}');
    cached[song.id] = song.choreoStatus;
    localStorage.setItem('vs_choreo_overrides', JSON.stringify(cached));

    renderSongTable();
    updateChoreoMetrics();
    renderDashboardSnapshot();

    // Sync to Google Sheets if configured
    const apiUrl = window.getApiUrl ? window.getApiUrl() : null;
    if (apiUrl) {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify({ action: 'updateChoreoStatus', songId: song.id, status: song.choreoStatus })
      }).catch(err => console.warn('Google Sheets sync notice:', err));
    }

    showToast(`${song.title}: Choreo marked "${song.choreoStatus}"`);
  }

  function openSongModal(songId) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;

    const modal = document.getElementById('song-modal');
    const titleEl = document.getElementById('song-modal-title');
    const bodyEl = document.getElementById('song-modal-body');
    if (!modal || !bodyEl) return;

    titleEl.textContent = song.title;

    bodyEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-light);padding-bottom:12px">
        <div>
          <span style="font-size:12px;color:var(--muted)">Film / Album:</span>
          <strong style="margin-left:6px">${song.source || '—'}</strong>
        </div>
        <span class="occasion-tag">${song.primaryOccasion || 'General'}</span>
      </div>
      <div>
        <label style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700">Artists / Singers</label>
        <p style="margin-top:2px">${song.singer || '—'}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700">Difficulty</label>
          <p style="margin-top:2px;font-weight:600">${song.difficulty || 'Medium'}</p>
        </div>
        <div>
          <label style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700">Suitable For</label>
          <p style="margin-top:2px;font-weight:600">${song.suitableFor || 'Both Families'}</p>
        </div>
      </div>
      <div>
        <label style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700">Choreography Status</label>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="btn-secondary btn-sm ${song.choreoStatus === 'Not Started' ? 'active' : ''}" id="modal-choreo-ns">Not Started</button>
          <button class="btn-secondary btn-sm ${song.choreoStatus === 'In Progress' ? 'active' : ''}" id="modal-choreo-ip">In Progress</button>
          <button class="btn-secondary btn-sm ${song.choreoStatus === 'Completed' ? 'active' : ''}" id="modal-choreo-cmp">Completed</button>
        </div>
      </div>
      <div>
        <label style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700">Catalog Notes</label>
        <p style="margin-top:4px;color:var(--text-secondary);font-style:italic">${song.notes || 'Candidate catalog song awaiting review.'}</p>
      </div>
      <div style="margin-top:8px;padding-top:12px;border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center">
        <a href="${song.youtubeSearch}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">
          Search on YouTube ↗
        </a>
        <span style="font-size:11px;color:var(--muted)">YouTube views blank by design</span>
      </div>
    `;

    // Modal choreo status buttons
    const setModalStatus = (newStatus) => {
      song.choreoStatus = newStatus;
      const cached = JSON.parse(localStorage.getItem('vs_choreo_overrides') || '{}');
      cached[song.id] = newStatus;
      localStorage.setItem('vs_choreo_overrides', JSON.stringify(cached));
      renderSongTable();
      updateChoreoMetrics();
      renderDashboardSnapshot();
      openSongModal(song.id);
      showToast(`Updated to ${newStatus}`);
    };

    document.getElementById('modal-choreo-ns').onclick = () => setModalStatus('Not Started');
    document.getElementById('modal-choreo-ip').onclick = () => setModalStatus('In Progress');
    document.getElementById('modal-choreo-cmp').onclick = () => setModalStatus('Completed');

    modal.hidden = false;
    modal.style.display = 'flex';
  }

  function updateChoreoMetrics() {
    const total = state.songs.length || 300;
    const ns = state.songs.filter(s => s.choreoStatus === 'Not Started').length;
    const ip = state.songs.filter(s => s.choreoStatus === 'In Progress').length;
    const done = state.songs.filter(s => s.choreoStatus === 'Completed').length;

    const nsPct = Math.round((ns / total) * 100);
    const ipPct = Math.round((ip / total) * 100);
    const donePct = Math.round((done / total) * 100);

    const elNsPct = document.getElementById('choreo-ns-pct');
    const elIpPct = document.getElementById('choreo-ip-pct');
    const elDonePct = document.getElementById('choreo-done-pct');

    const barNs = document.getElementById('choreo-bar-ns');
    const barIp = document.getElementById('choreo-bar-ip');
    const barDone = document.getElementById('choreo-bar-done');

    if (elNsPct) elNsPct.textContent = `${nsPct}% (${ns})`;
    if (elIpPct) elIpPct.textContent = `${ipPct}% (${ip})`;
    if (elDonePct) elDonePct.textContent = `${donePct}% (${done})`;

    if (barNs) barNs.style.width = `${nsPct}%`;
    if (barIp) barIp.style.width = `${ipPct}%`;
    if (barDone) barDone.style.width = `${donePct}%`;
  }

  function renderDashboardSnapshot() {
    const listEl = document.getElementById('song-snapshot-list');
    if (!listEl) return;

    let items = state.songs;
    if (state.snapshotOccasion !== 'all') {
      items = items.filter(s => (s.primaryOccasion || '').includes(state.snapshotOccasion));
    }

    // Pick top 4 songs
    const topItems = items.slice(0, 4);

    if (topItems.length === 0) {
      listEl.innerHTML = `<div style="padding:16px;color:var(--muted);font-size:12px;text-align:center">No songs under this category yet.</div>`;
      return;
    }

    listEl.innerHTML = topItems.map(song => {
      const choreoClass = (song.choreoStatus || 'Not Started').toLowerCase().replace(/\s+/g, '-');
      return `
        <div class="song-snapshot-row">
          <div class="song-title-col">${song.title}</div>
          <div class="song-source-col">${song.source || '—'}</div>
          <div><span class="occasion-tag">${song.primaryOccasion || 'General'}</span></div>
          <div><span class="choreo-badge ${choreoClass}">${song.choreoStatus}</span></div>
          <div><button class="btn-secondary btn-sm snapshot-view-btn" data-song-id="${song.id}">View</button></div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.snapshot-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openSongModal(btn.getAttribute('data-song-id'));
      });
    });
  }

  function exportSongsCSV() {
    if (!state.songs.length) {
      showToast('No song records to export');
      return;
    }

    const headers = ['ID', 'Title', 'Source', 'Singer', 'Primary Occasion', 'Difficulty', 'Choreography Status', 'Approval Status', 'Notes'];
    const rows = state.songs.map(s => [
      `"${s.id || ''}"`,
      `"${(s.title || '').replace(/"/g, '""')}"`,
      `"${(s.source || '').replace(/"/g, '""')}"`,
      `"${(s.singer || '').replace(/"/g, '""')}"`,
      `"${(s.primaryOccasion || '').replace(/"/g, '""')}"`,
      `"${s.difficulty || 'Medium'}"`,
      `"${s.choreoStatus || 'Not Started'}"`,
      `"${s.approvalStatus || 'Pending'}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Velvet_Stage_Songs_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Velvet Stage Songs CSV');
  }

  // --- DASHBOARD GREETING & SAMPLE EVENTS ---
  function updateDashboardDates() {
    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) {
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';
      greetingEl.textContent = `${greeting}, team ✨ Here is what's moving across upcoming performances.`;
    }

    // Populate sample upcoming events
    const eventListEl = document.getElementById('upcoming-events-list');
    if (eventListEl) {
      const sampleEvents = [
        { month: 'NOV', day: '02', title: 'Aarav & Riya — Sangeet Night', meta: 'Surat · 18 performances · 7:00 PM', status: 'ON TRACK', statusClass: 'on-track' },
        { month: 'NOV', day: '06', title: 'Mehta Family — Wedding Celebration', meta: 'Ahmedabad · 12 performances · 6:30 PM', status: 'NEEDS REVIEW', statusClass: 'review' },
        { month: 'NOV', day: '12', title: 'Baby Shower — Shah Family', meta: 'Surat · 6 performances · 11:00 AM', status: 'ON TRACK', statusClass: 'on-track' },
        { month: 'NOV', day: '18', title: 'Patel Anniversary Celebration', meta: 'Vadodara · 8 performances · 8:00 PM', status: 'IN PLANNING', statusClass: 'planning' }
      ];

      eventListEl.innerHTML = sampleEvents.map(ev => `
        <div class="event-row">
          <div class="date-box">
            <small>${ev.month}</small>
            <b>${ev.day}</b>
          </div>
          <div class="event-info">
            <span class="event-title">${ev.title}</span>
            <span class="event-meta">${ev.meta}</span>
          </div>
          <span class="status-badge ${ev.statusClass}">${ev.status}</span>
        </div>
      `).join('');

      // Update stat active events
      const statEvents = document.getElementById('stat-events');
      if (statEvents) statEvents.textContent = '08';

      const statPerformers = document.getElementById('stat-performers');
      if (statPerformers) statPerformers.textContent = '12';
    }
  }

  // --- TOAST NOTIFICATION ---
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

})();
