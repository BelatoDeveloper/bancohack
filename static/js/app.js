/**
 * ZicaPay — App JavaScript
 * Dark mode, toasts, balance toggle, animations, input masks
 */

// ── Dark Mode ────────────────────────────────────────────────────────────────
const THEME_KEY = 'zicapay-theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeToggle(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeToggle(next);
}

function updateThemeToggle(theme) {
  document.querySelectorAll('.theme-toggle-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
  document.querySelectorAll('input[type="checkbox"].theme-checkbox').forEach(cb => {
    cb.checked = theme === 'dark';
  });
}

// ── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    sucesso: `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    erro:    `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    aviso:   `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`,
    info:    `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  };
  const colors = { sucesso: '#21C25E', erro: '#EF4444', aviso: '#F59E0B', info: '#3B82F6' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon" style="color:${colors[type] || colors.info}">${icons[type] || icons.info}</span>
    <span class="toast-text">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.35s forwards';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ── Balance Toggle ────────────────────────────────────────────────────────────
function initBalanceToggle() {
  const toggleBtn = document.getElementById('balance-toggle');
  const balanceEl = document.getElementById('balance-amount');
  if (!toggleBtn || !balanceEl) return;

  const HIDDEN_KEY = 'zicapay-balance-hidden';
  let hidden = localStorage.getItem(HIDDEN_KEY) === 'true';
  if (hidden) balanceEl.classList.add('hidden');

  toggleBtn.addEventListener('click', () => {
    hidden = !hidden;
    balanceEl.classList.toggle('hidden', hidden);
    localStorage.setItem(HIDDEN_KEY, hidden);
    toggleBtn.innerHTML = hidden ? eyeOffIcon() : eyeIcon();
  });

  if (hidden) toggleBtn.innerHTML = eyeOffIcon();
}

function eyeIcon() {
  return `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
}
function eyeOffIcon() {
  return `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      const parent = btn.closest('.tabs-container') || document;

      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const content = parent.querySelector(`.tab-content[data-tab="${target}"]`);
      if (content) content.classList.add('active');
    });
  });
}

// ── Card Flip ─────────────────────────────────────────────────────────────────
function initCardFlip() {
  const card = document.querySelector('.card-visual-container');
  if (!card) return;
  const inner = card.querySelector('.card-visual');
  if (!inner) return;
  card.addEventListener('click', () => inner.classList.toggle('flipped'));
}

// ── Input Masks ───────────────────────────────────────────────────────────────
function maskCPF(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
    input.value = v;
  });
}

function maskPhone(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/, '($1) $2');
    input.value = v;
  });
}

function initMasks() {
  document.querySelectorAll('[data-mask="cpf"]').forEach(maskCPF);
  document.querySelectorAll('[data-mask="phone"]').forEach(maskPhone);
}

// ── Currency Format ───────────────────────────────────────────────────────────
function formatCurrency(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '');
    if (!v) { input.value = ''; return; }
    const num = parseInt(v) / 100;
    input.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  });
}

function initCurrencyInputs() {
  document.querySelectorAll('[data-mask="currency"]').forEach(formatCurrency);
}

// ── Scroll Animations ─────────────────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.animate-fade-up').forEach(el => {
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ── Active Nav Item ───────────────────────────────────────────────────────────
function initActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href && path.startsWith(href) && href !== '/') {
      item.classList.add('active');
    } else if (href === '/dashboard' && path === '/dashboard') {
      item.classList.add('active');
    }
  });
}

// ── Copy to Clipboard ─────────────────────────────────────────────────────────
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copiado para a área de transferência!', 'sucesso', 2000);
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = '✓ Copiado';
      setTimeout(() => { btn.innerHTML = original; }, 2000);
    }
  });
}

// ── Confirm Action ─────────────────────────────────────────────────────────────
function confirmAction(message, form) {
  if (confirm(message)) form.submit();
}

// ── Initialize ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initBalanceToggle();
  initTabs();
  initCardFlip();
  initMasks();
  initCurrencyInputs();
  initScrollAnimations();
  initActiveNav();

  // Theme toggle buttons
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Auto-dismiss flash toasts after 5s
  document.querySelectorAll('.toast').forEach(toast => {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.35s forwards';
      setTimeout(() => toast.remove(), 350);
    }, 5000);
  });

  // Add ripple effect to buttons
  document.querySelectorAll('.btn, .quick-action, .nav-item').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      ripple.style.cssText = `
        position:absolute;width:4px;height:4px;border-radius:50%;
        background:rgba(255,255,255,0.4);
        left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px;
        transform:scale(0);animation:ripple 0.5s linear;pointer-events:none;
      `;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

  // Inject ripple keyframes
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = '@keyframes ripple{to{transform:scale(60);opacity:0}}';
    document.head.appendChild(style);
  }
});

// Expose to global
window.ZicaPay = { showToast, toggleTheme, copyToClipboard, confirmAction };
