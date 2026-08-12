const API_URL = window.API_URL || 'https://pplbase.onrender.com';

const modal = document.getElementById('modalLogin');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnHeroCadastro = document.getElementById('btnHeroCadastro');
const btnHeroCadastro2 = document.getElementById('btnHeroCadastro2');
const btnFecharModal = document.getElementById('fecharModal');
const tabs = document.querySelectorAll('.tab');
const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');

function abrirModal(tab = 'login') {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
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
    document.body.style.overflow = 'auto';
}

if (btnAbrirModal) btnAbrirModal.addEventListener('click', () => abrirModal('login'));
if (btnHeroCadastro) btnHeroCadastro.addEventListener('click', () => abrirModal('cadastro'));
if (btnHeroCadastro2) btnHeroCadastro2.addEventListener('click', () => abrirModal('cadastro'));
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

function mostrarMensagem(el, msg, tipo = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.className = `form-message ${tipo}`;
    el.style.display = msg ? 'block' : 'none';
}

function salvarToken(token) { localStorage.setItem('pplbase_token', token); }
function getToken() { return localStorage.getItem('pplbase_token'); }

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
                setTimeout(() => { fecharModal(); window.location.href = '/dashboard.html'; }, 1000);
            } else {
                mostrarMensagem(message, data.detail || '❌ Erro ao fazer login');
            }
        } catch (error) {
            mostrarMensagem(message, '❌ Erro de conexão com o servidor');
            console.error('Erro:', error);
        }
    });
}

if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('cadNome');
        const username = document.getElementById('cadUsername');
        const email = document.getElementById('cadEmail');
        const senha = document.getElementById('cadSenha');
        const localizacao = document.getElementById('cadLocalizacao');
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
                    senha: senha.value,
                    localizacao: localizacao ? localizacao.value : ''
                })
            });
            const data = await response.json();
            if (response.ok) {
                salvarToken(data.access_token);
                mostrarMensagem(message, '✅ Conta criada!', 'success');
                setTimeout(() => { fecharModal(); window.location.href = '/dashboard.html'; }, 1500);
            } else {
                mostrarMensagem(message, data.detail || '❌ Erro ao criar conta');
            }
        } catch (error) {
            mostrarMensagem(message, '❌ Erro de conexão com o servidor');
            console.error('Erro:', error);
        }
    });
}

async function verificarLogin() {
    const token = getToken();
    if (!token) return false;
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            console.log('✅ Usuário logado:', user);
            if (btnAbrirModal) {
                btnAbrirModal.textContent = '👤 Perfil';
                btnAbrirModal.style.background = '#2a2d3e';
            }
            return true;
        } else {
            localStorage.removeItem('pplbase_token');
            return false;
        }
    } catch (error) { return false; }
}

document.addEventListener('DOMContentLoaded', () => { verificarLogin(); });
console.log('🚀 PplBase carregado! API:', API_URL);
