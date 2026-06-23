// ================================================
// PERFIL.JS — Zueiras da tela de perfil
// Heurísticas de Nielsen violadas:
// - H1: Visibilidade do status (SSL piscando, contador enganoso)
// - H4: Consistência (saldo diferente do dashboard)
// - H5: Prevenção de erros (confirmações excessivas no logout)
// - H8: Estética (aviso de dispositivo novo permanente)
// ================================================

document.addEventListener('DOMContentLoaded', function () {

  // ──────────────────────────────────────────
  // 1. SALDO COM NOTA "pode variar"
  // Adiciona nota abaixo do saldo no header
  // ──────────────────────────────────────────
  const saldoDiv = document.querySelector('.profile-header');
  if (saldoDiv) {
    const nota = document.createElement('div');
    nota.style.cssText = 'font-size:0.6rem;color:rgba(255,255,255,0.5);margin-top:4px;font-style:italic;text-align:center;padding:0 16px;';
    nota.textContent = '*saldo pode variar conforme atualização do sistema';
    saldoDiv.appendChild(nota);
  }

  // ──────────────────────────────────────────
  // 2. AVISO PERMANENTE DE NOVO DISPOSITIVO
  // Aparece logo abaixo do header do perfil
  // ──────────────────────────────────────────
  const avisoDispositivo = document.createElement('div');
  avisoDispositivo.style.cssText = `
    background:#fff3cd;
    border:1px solid #ffc107;
    border-radius:8px;
    padding:10px 14px;
    margin:12px 16px 0;
    font-size:0.75rem;
    color:#856404;
    display:block;
    line-height:1.5;
  `;
  avisoDispositivo.innerHTML = '⚠️ <strong>Sua conta foi acessada de um novo dispositivo.</strong> Se não foi você, ignore esta mensagem.';
  const primeiraSec = document.querySelector('.profile-section');
  if (primeiraSec) primeiraSec.parentElement.insertBefore(avisoDispositivo, primeiraSec);

  // ──────────────────────────────────────────
  // 3. ÚLTIMO ACESSO: AGORA MESMO — mas data de 1970
  // Adiciona dentro da seção de segurança
  // ──────────────────────────────────────────
  const secSeguranca = document.querySelectorAll('.profile-section')[1];
  if (secSeguranca) {
    const ultimoAcesso = document.createElement('div');
    ultimoAcesso.style.cssText = `
      padding:12px 20px;
      border-top:1px solid var(--border);
      font-size:0.75rem;
      color:var(--text-muted);
      display:flex;
      justify-content:space-between;
      align-items:center;
      flex-wrap:wrap;
      gap:4px;
    `;
    ultimoAcesso.innerHTML = `
      <span>Último acesso</span>
      <span style="color:var(--text-secondary);font-weight:600;">agora mesmo &nbsp;·&nbsp; <span style="color:#aaa;font-weight:400;">01/01/1970 às 00:00</span></span>
    `;
    secSeguranca.appendChild(ultimoAcesso);
  }

  // ──────────────────────────────────────────
  // 4. IDIOMA COM SÓ VARIAÇÕES DE PORTUGUÊS
  // Adiciona na seção de preferências
  // ──────────────────────────────────────────
  const secPreferencias = document.querySelectorAll('.profile-section')[2];
  if (secPreferencias) {
    const idiomaItem = document.createElement('div');
    idiomaItem.className = 'profile-item';
    idiomaItem.style.cursor = 'pointer';
    idiomaItem.innerHTML = `
      <div class="profile-item-icon">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
      </div>
      <div class="profile-item-text">
        <div class="profile-item-label">Idioma</div>
        <div class="profile-item-sub" id="idioma-atual">Português</div>
      </div>
      <svg class="profile-item-arrow" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    `;
    idiomaItem.addEventListener('click', trocarIdioma);
    secPreferencias.appendChild(idiomaItem);
  }

  // Lista de idiomas — todos português
  const idiomas = [
    'Português',
    'Português (Portugal)',
    'Português (Angola)',
    'Português (Moçambique)',
    'Português (Cabo Verde)',
    'Português (Guiné-Bissau)',
    'Português (São Tomé e Príncipe)',
    'Português (Timor-Leste)',
    'Português (Macau)',
    'Português (Brasil) — já selecionado',
  ];
  let idiomaIndex = 0;

  function trocarIdioma() {
    idiomaIndex = (idiomaIndex + 1) % idiomas.length;
    const el = document.getElementById('idioma-atual');
    if (el) el.textContent = idiomas[idiomaIndex];
  }

  // ──────────────────────────────────────────
  // 5. CONTADOR REGRESSIVO + SSL PISCANDO
  // Substitui o rodapé original
  // ──────────────────────────────────────────
  let segundos = Math.floor(Math.random() * 50) + 10;

  // Encontra o rodapé pelo texto
  const todosOsDivs = document.querySelectorAll('div');
  let rodape = null;
  todosOsDivs.forEach(div => {
    if (div.textContent.includes('ZicaPay v1.0') && div.textContent.includes('Banco digital seguro')) {
      rodape = div;
    }
  });

  if (rodape) {
    rodape.innerHTML = `
      ZicaPay v1.0 · Banco digital seguro<br>
      <span id="ssl-status" style="font-weight:600;color:var(--primary);">🔒 Conexão segura SSL</span><br>
      <span style="font-size:0.7rem;color:var(--text-muted);">
        🛡️ Seus dados estão protegidos por mais
        <strong id="contador-seg" style="color:var(--primary);">${segundos}s</strong>
      </span>
    `;

    // Contador regressivo — reseta com número aleatório ao chegar em 0
    setInterval(() => {
      segundos--;
      const el = document.getElementById('contador-seg');
      if (el) el.textContent = segundos + 's';
      if (segundos <= 0) {
        segundos = Math.floor(Math.random() * 50) + 10;
      }
    }, 1000);

    // SSL piscando entre seguro e inseguro a cada 5 segundos
    setInterval(() => {
      const ssl = document.getElementById('ssl-status');
      if (!ssl) return;
      ssl.innerHTML = '🔓 Conexão <span style="color:#ef4444;">insegura</span>';
      ssl.style.color = '#ef4444';
      setTimeout(() => {
        ssl.innerHTML = '🔒 Conexão segura SSL';
        ssl.style.color = 'var(--primary)';
      }, 1500);
    }, 5000);
  }

  // ──────────────────────────────────────────
  // 6. BOTÃO SAIR COM 3 CONFIRMAÇÕES
  // Substitui o onsubmit padrão
  // ──────────────────────────────────────────
  const logoutForm = document.querySelector('form[action*="logout"]');
  if (logoutForm) {
    logoutForm.removeAttribute('onsubmit');
    logoutForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const perguntas = [
        'Deseja realmente sair da conta?',
        'Tem certeza mesmo? Suas sessões serão encerradas.',
        'Última chance — realmente quer sair?',
      ];

      for (const pergunta of perguntas) {
        const confirmou = confirm(pergunta);
        if (!confirmou) return;
      }

      logoutForm.submit();
    });
  }
// ──────────────────────────────────────────
  // 7. MODAL APAGAR CONTA
  // Nunca apaga — sempre dá erro diferente
  // ──────────────────────────────────────────
  window.abrirModalApagar = function() {
    const modal = document.getElementById('modal-apagar');
    modal.style.display = 'flex';
  }

  window.fecharModalApagar = function() {
    const modal = document.getElementById('modal-apagar');
    modal.style.display = 'none';
    document.getElementById('resposta-apagar').value = '';
    document.getElementById('erro-apagar').style.display = 'none';
    tentativasApagar = 0;
  }

  let tentativasApagar = 0;
  const perguntasApagar = [
    'Qual o nome completo da mãe do inventor do telefone, em ordem alfabética invertida?',
    'Digite o CPF do seu bisavô paterno (apenas números):',
    'Qual a senha da sua conta de e-mail de 2008?',
    'Quantos grãos de arroz cabem numa xícara de 200ml? (valor exato)',
    'Digite o nome do seu professor favorito do ensino fundamental em inglês medieval:',
  ];

  const errosApagar = [
    'Resposta incorreta. Tente novamente.',
    'Ainda incorreto. Lembre-se: é em ordem invertida.',
    'Hmm, não confere com nossos registros.',
    'Por segurança, sua conta foi temporariamente bloqueada para exclusão. Tente em 24h.',
    'Erro interno do servidor. Nossa equipe foi notificada. (código: ERR_DELETE_503)',
  ];

  window.tentarApagar = function() {
    const resposta = document.getElementById('resposta-apagar').value.trim();
    const erroDiv = document.getElementById('erro-apagar');
    const perguntaEl = document.getElementById('pergunta-apagar');

    if (!resposta) {
      erroDiv.textContent = 'Por favor, responda a pergunta antes de continuar.';
      erroDiv.style.display = 'block';
      return;
    }

    tentativasApagar++;
    erroDiv.style.display = 'block';
    erroDiv.textContent = errosApagar[Math.min(tentativasApagar - 1, errosApagar.length - 1)];

    // Troca a pergunta a cada tentativa
    if (tentativasApagar < perguntasApagar.length) {
      perguntaEl.textContent = perguntasApagar[tentativasApagar];
      document.getElementById('resposta-apagar').value = '';
    }
  }

});