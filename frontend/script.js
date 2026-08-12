const API_URL = 'https://pplbase.onrender.com';

// =========================================================
// MODAL
// =========================================================

const modal = document.getElementById('modalLogin');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnHeroCadastro = document.getElementById('btnHeroCadastro');
const btnFecharModal = document.getElementById('fecharModal');
const tabs = document.querySelectorAll('.tab');
const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');

function abrirModal(tab = 'login') {
    if (!modal) return;
    modal.classList.add('active');
    tabs.forEach(t => t.classList.remove('active'));
    const tabAtiva = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (tabAtiva) tabAtiva.classList.add('active');
    if (formLogin) formLogin.classList.remove('active');
    if (formCadastro) formCadastro.classList.remove('active');
    if (tab === 'login' && formLogin) formLogin.classList.add('active');
    else if (tab === 'cadastro' && formCadastro) formCadastro.classList.add('active');
}

function fecharModal() {
    if (!modal) return;
    modal.classList.remove('active');
}

if (btnAbrirModal) btnAbrirModal.addEventListener('click', () => abrirModal('login'));
if (btnHeroCadastro) btnHeroCadastro.addEventListener('click', () => abrirModal('cadastro'));
if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (formLogin) formLogin.classList.remove('active');
        if (formCadastro) formCadastro.classList.remove('active');
        if (target === 'login' && formLogin) formLogin.classList.add('active');
        else if (target === 'cadastro' && formCadastro) formCadastro.classList.add('active');
    });
});

// =========================================================
// TOGGLE THEME
// =========================================================

document.querySelectorAll('.toggle-option').forEach(btn => {
    btn.addEventListener('click', function() {
        const theme = this.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.toggle-option').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        localStorage.setItem('theme', theme);
    });
});

const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
document.querySelectorAll('.toggle-option').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === savedTheme);
});

// =========================================================
// AUXILIARES
// =========================================================

function mostrarMensagem(el, msg, tipo = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.className = `form-message ${tipo}`;
    el.style.display = msg ? 'block' : 'none';
}

function salvarToken(token) { localStorage.setItem('pplbase_token', token); }
function getToken() { return localStorage.getItem('pplbase_token'); }

// =========================================================
// LOGIN
// =========================================================

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername');
        const senha = document.getElementById('loginSenha');
        const message = document.getElementById('loginMessage');
        if (!username || !senha) return;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.value, senha: senha.value })
            });
            const data = await response.json();
            if (response.ok) {
                salvarToken(data.access_token);
                mostrarMensagem(message, '✅ Login realizado!', 'success');
                setTimeout(() => { fecharModal(); window.location.href = '/dashboard.html'; }, 800);
            } else {
                mostrarMensagem(message, data.detail || '❌ Erro ao fazer login');
            }
        } catch (error) {
            mostrarMensagem(message, '❌ Erro de conexão com o servidor');
            console.error('Erro:', error);
        }
    });
}

// =========================================================
// CADASTRO
// =========================================================

if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('cadNome');
        const username = document.getElementById('cadUsername');
        const email = document.getElementById('cadEmail');
        const senha = document.getElementById('cadSenha');
        const message = document.getElementById('cadastroMessage');
        if (!nome || !username || !email || !senha) return;

        if (senha.value.length < 6) {
            mostrarMensagem(message, '❌ Senha deve ter mínimo 6 caracteres');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome.value,
                    username: username.value,
                    email: email.value,
                    senha: senha.value
                })
            });
            const data = await response.json();
            if (response.ok) {
                salvarToken(data.access_token);
                mostrarMensagem(message, '✅ Conta criada!', 'success');
                setTimeout(() => { fecharModal(); window.location.href = '/dashboard.html'; }, 1000);
            } else {
                mostrarMensagem(message, data.detail || '❌ Erro ao criar conta');
            }
        } catch (error) {
            mostrarMensagem(message, '❌ Erro de conexão com o servidor');
            console.error('Erro:', error);
        }
    });
}

// =========================================================
// VERIFICAR LOGIN
// =========================================================

if (window.location.pathname.includes('dashboard.html')) {
    const token = getToken();
    if (!token) window.location.href = '/';
}
