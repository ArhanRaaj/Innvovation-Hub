// ============================================================================
// THE INNOVATION HUB - AUTHENTICATION MODAL & NAVBAR PROFILE COMPONENT
// Renders glassmorphic sign-in, registration, profile dropdown, and account
// management with 1-click demo login and instant session switching.
// ============================================================================

import { authService } from '../services/auth-service.ts';
import { AuthUser } from '../types.ts';

declare global {
  interface Window {
    innovationHubAuth: {
      openAuthModal: (tab?: 'signin' | 'register' | 'profile') => void;
      closeAuthModal: () => void;
      switchTab: (tab: 'signin' | 'register' | 'profile') => void;
      handleLogin: (e: Event) => void;
      handleRegister: (e: Event) => void;
      logout: () => void;
      toggleProfileDropdown: (e?: Event) => void;
      closeProfileDropdown: () => void;
      goToMyProjects: () => void;
      goToAIStudio: () => void;
    };
  }
}

let activeModalTab: 'signin' | 'register' | 'profile' = 'signin';
let isDropdownOpen = false;

export function initAuthUI(): void {
  ensureModalExists();
  mountAuthNavbarPill();

  // Listen to auth state transitions
  authService.onAuthStateChanged(() => {
    mountAuthNavbarPill();
    updateModalContent();
    updateAIStudioHeaderAvatar();
  });

  // Global click to close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest('#nav-auth-mount') && !target.closest('#studio-user-mount')) {
      closeProfileDropdown();
    }
  });

  // Expose global controller
  window.innovationHubAuth = {
    openAuthModal,
    closeAuthModal,
    switchTab,
    handleLogin,
    handleRegister,
    logout: () => {
      authService.logout();
      closeProfileDropdown();
      closeAuthModal();
      showToast('Signed out of The Innovation Hub.');
    },
    toggleProfileDropdown,
    closeProfileDropdown,
    goToMyProjects: () => {
      closeProfileDropdown();
      const isProjectsPage = window.location.pathname.includes('projects.html');
      if (isProjectsPage) {
        if ((window as any).omniLabScope) {
          (window as any).omniLabScope.setScope('my-projects');
        }
      } else {
        window.location.href = 'projects.html?scope=my-projects';
      }
    },
    goToAIStudio: () => {
      closeProfileDropdown();
      if (window.location.pathname.includes('studio.html')) {
        // already here
      } else if (window.omniLab?.openAIArchitectModal) {
        window.omniLab.openAIArchitectModal();
      } else {
        window.location.href = 'studio.html';
      }
    }
  };
}

function ensureModalExists(): HTMLElement {
  let modal = document.getElementById('innovation-auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'innovation-auth-modal';
    modal.className = 'auth-modal-overlay';
    modal.innerHTML = `
      <div class="auth-modal-card" id="auth-modal-card">
        <button class="auth-modal-close" onclick="window.innovationHubAuth.closeAuthModal()" title="Close">&times;</button>
        <div id="auth-modal-content"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAuthModal();
      }
    });
  }
  return modal;
}

export function openAuthModal(tab: 'signin' | 'register' | 'profile' = 'signin'): void {
  const user = authService.getCurrentUser();
  if (user && tab !== 'signin' && tab !== 'register') {
    activeModalTab = 'profile';
  } else {
    activeModalTab = tab;
  }
  const modal = ensureModalExists();
  updateModalContent();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeAuthModal(): void {
  const modal = document.getElementById('innovation-auth-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

export function switchTab(tab: 'signin' | 'register' | 'profile'): void {
  activeModalTab = tab;
  updateModalContent();
}

function updateModalContent(): void {
  const mount = document.getElementById('auth-modal-content');
  if (!mount) return;

  const user = authService.getCurrentUser();
  if (user && activeModalTab === 'profile') {
    renderProfileView(mount, user);
  } else if (activeModalTab === 'register') {
    renderRegisterView(mount);
  } else {
    renderSignInView(mount);
  }
}

function renderSignInView(mount: HTMLElement): void {
  mount.innerHTML = `
    <div class="auth-brand-kicker">
      <span class="auth-kicker-dot"></span>
      <span>THE INNOVATION HUB &bull; HARDWARE ACCESS</span>
    </div>
    <h2 class="auth-modal-title">Sign In to Your Laboratory</h2>
    <p class="auth-modal-desc">Access your private hardware projects, custom schematics, and AI Studio sessions.</p>

    <form onsubmit="window.innovationHubAuth.handleLogin(event)" class="auth-form" id="auth-signin-form">
      <div id="auth-error-msg" class="auth-error-banner" style="display:none;"></div>

      <div class="auth-input-group">
        <label for="signin-email">Email Address</label>
        <div class="auth-input-wrap">
          <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <input type="email" id="signin-email" placeholder="name@domain.com" required autocomplete="email" />
        </div>
      </div>

      <div class="auth-input-group">
        <label for="signin-password">Password</label>
        <div class="auth-input-wrap">
          <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" id="signin-password" placeholder="••••••••" required autocomplete="current-password" />
        </div>
      </div>

      <button type="submit" class="auth-submit-btn" id="signin-submit-btn">
        <span>Sign In to Account</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </form>

    <div class="auth-switch-row">
      <span>Don't have an account yet?</span>
      <button type="button" class="auth-switch-link" onclick="window.innovationHubAuth.switchTab('register')">Create an account</button>
    </div>
  `;
}

function renderRegisterView(mount: HTMLElement): void {
  mount.innerHTML = `
    <div class="auth-brand-kicker">
      <span class="auth-kicker-dot"></span>
      <span>THE INNOVATION HUB &bull; NEW BUILDER</span>
    </div>
    <h2 class="auth-modal-title">Create Engineer Account</h2>
    <p class="auth-modal-desc">Save your personal AI hardware builds, custom wiring netlists, and private chat histories.</p>

    <form onsubmit="window.innovationHubAuth.handleRegister(event)" class="auth-form" id="auth-register-form">
      <div id="auth-error-msg" class="auth-error-banner" style="display:none;"></div>

      <div class="auth-input-group">
        <label for="reg-name">Full Name</label>
        <div class="auth-input-wrap">
          <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input type="text" id="reg-name" placeholder="e.g. Alex Vance" required autocomplete="name" />
        </div>
      </div>

      <div class="auth-input-group">
        <label for="reg-email">Email Address</label>
        <div class="auth-input-wrap">
          <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <input type="email" id="reg-email" placeholder="alex@engineering.org" required autocomplete="email" />
        </div>
      </div>

      <div class="auth-input-group">
        <label for="reg-password">Password (minimum 6 characters)</label>
        <div class="auth-input-wrap">
          <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" id="reg-password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
        </div>
      </div>

      <button type="submit" class="auth-submit-btn" id="reg-submit-btn">
        <span>Create Account &amp; Start Building</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </form>

    <div class="auth-switch-row">
      <span>Already have an account?</span>
      <button type="button" class="auth-switch-link" onclick="window.innovationHubAuth.switchTab('signin')">Sign in instead</button>
    </div>
  `;
}

function renderProfileView(mount: HTMLElement, user: AuthUser): void {
  const userProjects = authService.getUserProjects(user.id);
  const userSessions = authService.getUserSessions(user.id);

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  mount.innerHTML = `
    <div class="auth-brand-kicker">
      <span class="auth-kicker-dot"></span>
      <span>ACTIVE ACCOUNT &bull; THE INNOVATION HUB</span>
    </div>
    
    <div class="profile-header-card">
      <div class="profile-avatar-large">
        ${user.avatar 
          ? `<img src="${user.avatar}" alt="${user.name}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff';" />` 
          : `<div class="avatar-fallback">${initial}</div>`
        }
      </div>
      <div class="profile-user-details">
        <h3 class="profile-name">${user.name}</h3>
        <span class="profile-email">${user.email}</span>
        <span class="profile-role-pill">${user.role || 'Hardware Engineer'}</span>
      </div>
    </div>

    <!-- Isolated Account Metric Badges -->
    <div class="profile-stats-grid">
      <div class="profile-stat-box" onclick="window.innovationHubAuth.goToMyProjects()">
        <span class="profile-stat-num">${userProjects.length}</span>
        <span class="profile-stat-label">My Created Projects</span>
        <span class="profile-stat-sub">Strictly isolated to your account &rarr;</span>
      </div>
      <div class="profile-stat-box" onclick="window.innovationHubAuth.goToAIStudio()">
        <span class="profile-stat-num">${userSessions.length}</span>
        <span class="profile-stat-label">AI Studio Sessions</span>
        <span class="profile-stat-sub">Private chat histories &rarr;</span>
      </div>
    </div>

    <div class="profile-actions-column">
      <button class="profile-action-btn primary" onclick="window.innovationHubAuth.goToMyProjects()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>View My Account Projects (${userProjects.length})</span>
      </button>

      <button class="profile-action-btn secondary" onclick="window.innovationHubAuth.goToAIStudio()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <span>Launch AI Studio Architect</span>
      </button>

      <div class="profile-footer-row">
        <button class="profile-switch-btn" onclick="window.innovationHubAuth.switchTab('signin')">
          Switch Account
        </button>
        <button class="profile-signout-btn" onclick="window.innovationHubAuth.logout()">
          Sign Out
        </button>
      </div>
    </div>
  `;
}

async function handleLogin(e: Event): Promise<void> {
  e.preventDefault();
  const emailInput = document.getElementById('signin-email') as HTMLInputElement | null;
  const passInput = document.getElementById('signin-password') as HTMLInputElement | null;
  const submitBtn = document.getElementById('signin-submit-btn') as HTMLButtonElement | null;
  const errEl = document.getElementById('auth-error-msg');

  if (!emailInput || !passInput) return;

  if (errEl) errEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Signing in...</span>`;
  }

  try {
    const res = await authService.login(emailInput.value, passInput.value);
    if (!res.success) {
      if (errEl) {
        errEl.textContent = res.error || 'Failed to sign in. Please verify your email and password.';
        errEl.style.display = 'block';
      }
    } else {
      closeAuthModal();
      showToast(`Welcome back, ${res.user?.name}!`);
    }
  } catch (err: any) {
    if (errEl) {
      errEl.textContent = err.message || 'Network error during sign in.';
      errEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Sign In to Account</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      `;
    }
  }
}

async function handleRegister(e: Event): Promise<void> {
  e.preventDefault();
  const nameInput = document.getElementById('reg-name') as HTMLInputElement | null;
  const emailInput = document.getElementById('reg-email') as HTMLInputElement | null;
  const passInput = document.getElementById('reg-password') as HTMLInputElement | null;
  const submitBtn = document.getElementById('reg-submit-btn') as HTMLButtonElement | null;
  const errEl = document.getElementById('auth-error-msg');

  if (!nameInput || !emailInput || !passInput) return;

  if (errEl) errEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Creating account...</span>`;
  }

  try {
    const res = await authService.register(nameInput.value, emailInput.value, passInput.value);
    if (!res.success) {
      if (errEl) {
        errEl.textContent = res.error || 'Failed to create account.';
        errEl.style.display = 'block';
      }
    } else {
      closeAuthModal();
      showToast(`Account created! Welcome, ${res.user?.name || nameInput.value}!`);
    }
  } catch (err: any) {
    if (errEl) {
      errEl.textContent = err.message || 'Network error during registration.';
      errEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Create Account &amp; Start Building</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      `;
    }
  }
}

// ============================================================================
// NAVBAR PILL & DROPDOWN INJECTION
// ============================================================================
export function mountAuthNavbarPill(): void {
  const navWrap = document.querySelector('.site-header .nav-wrap');
  if (!navWrap) return;

  let mount = document.getElementById('nav-auth-mount');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'nav-auth-mount';
    mount.className = 'nav-auth-container';
    navWrap.appendChild(mount);
  }

  const user = authService.getCurrentUser();
  if (!user) {
    mount.innerHTML = `
      <button class="nav-signin-btn" onclick="window.innovationHubAuth.openAuthModal('signin')" title="Sign in to your account">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Sign In</span>
      </button>
    `;
    return;
  }

  const userProjects = authService.getUserProjects(user.id);
  const userSessions = authService.getUserSessions(user.id);
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  mount.innerHTML = `
    <div class="nav-user-pill-wrap">
      <button class="nav-user-pill" id="nav-user-pill-btn" onclick="window.innovationHubAuth.toggleProfileDropdown(event)" title="Account: ${user.name}">
        <div class="nav-user-avatar">
          ${user.avatar 
            ? `<img src="${user.avatar}" alt="${user.name}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff';" />` 
            : `<div class="nav-avatar-initial">${initial}</div>`
          }
        </div>
        <span class="nav-user-firstname">${user.name.split(' ')[0]}</span>
        <svg class="nav-user-caret ${isDropdownOpen ? 'open' : ''}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      <!-- Glassmorphic Dropdown Menu -->
      <div class="nav-profile-dropdown ${isDropdownOpen ? 'active' : ''}" id="nav-profile-dropdown">
        <div class="dropdown-header">
          <div class="dropdown-avatar">
            ${user.avatar 
              ? `<img src="${user.avatar}" alt="${user.name}" />` 
              : `<div class="nav-avatar-initial">${initial}</div>`
            }
          </div>
          <div class="dropdown-user-info">
            <span class="dropdown-user-name">${user.name}</span>
            <span class="dropdown-user-email">${user.email}</span>
            <span class="dropdown-user-role">${user.role || 'Hardware Engineer'}</span>
          </div>
        </div>

        <div class="dropdown-divider"></div>

        <div class="dropdown-stats-strip">
          <div class="dropdown-stat-chip" onclick="window.innovationHubAuth.goToMyProjects()">
            <span class="dropdown-stat-val">${userProjects.length}</span>
            <span class="dropdown-stat-lbl">My Projects</span>
          </div>
          <div class="dropdown-stat-chip" onclick="window.innovationHubAuth.goToAIStudio()">
            <span class="dropdown-stat-val">${userSessions.length}</span>
            <span class="dropdown-stat-lbl">AI Chats</span>
          </div>
        </div>

        <div class="dropdown-divider"></div>

        <div class="dropdown-links">
          <button class="dropdown-link-item" onclick="window.innovationHubAuth.goToMyProjects()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>My Projects (${userProjects.length})</span>
          </button>
          <button class="dropdown-link-item" onclick="window.innovationHubAuth.goToAIStudio()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            <span>AI Studio Sessions</span>
          </button>
          <button class="dropdown-link-item" onclick="window.innovationHubAuth.openAuthModal('profile')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Account Profile</span>
          </button>
        </div>

        <div class="dropdown-divider"></div>

        <div class="dropdown-footer">
          <button class="dropdown-signout-btn" onclick="window.innovationHubAuth.logout()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function toggleProfileDropdown(e?: Event): void {
  if (e) e.stopPropagation();
  isDropdownOpen = !isDropdownOpen;
  const menu = document.getElementById('nav-profile-dropdown');
  const caret = document.querySelector('.nav-user-caret');
  if (menu) menu.classList.toggle('active', isDropdownOpen);
  if (caret) caret.classList.toggle('open', isDropdownOpen);
}

export function closeProfileDropdown(): void {
  isDropdownOpen = false;
  const menu = document.getElementById('nav-profile-dropdown');
  const caret = document.querySelector('.nav-user-caret');
  if (menu) menu.classList.remove('active');
  if (caret) caret.classList.remove('open');
}

function updateAIStudioHeaderAvatar(): void {
  const user = authService.getCurrentUser();
  const studioAvatarBtn = document.getElementById('studio-header-avatar-btn');
  if (studioAvatarBtn) {
    if (user) {
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      studioAvatarBtn.innerHTML = initial;
      studioAvatarBtn.title = `${user.name} (${user.email}) - Click to manage account`;
    } else {
      studioAvatarBtn.innerHTML = '?';
      studioAvatarBtn.title = 'Sign In to Account';
    }
  }
}

function showToast(msg: string): void {
  let toast = document.getElementById('auth-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast?.classList.remove('visible'), 3200);
}
