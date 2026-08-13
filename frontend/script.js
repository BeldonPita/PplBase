const API_URL = 'https://pplbase.onrender.com';

const modal = document.getElementById('modalLogin');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnHeroCadastro = document.getElementById('btnHeroCadastro');
const btnFecharModal = document.getElementById('fecharModal');
const tabs = document.querySelectorAll('.tab');
const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');

function abrirModal(tab = 'login') {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    formLogin.classList.remove('active');
    formCadastro.classList.remove('active');
    if (tab === 'login') {
        formLogin.classList.add('active');
    } else {
        formCadastro.classList.add('active');
    }
}

function fecharModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

btnAbrirModal.addEventListener('click', () => abrirModal('login'));
btnHeroCadastro.addEventListener('click', () => abrirModal('cadastro'));
btnFecharModal.addEventListener('click', fecharModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        formLogin.classList.remove('active');
        formCadastro.classList.remove('active');
        if (target === 'login') {
            formLogin.classList.add('active');
        } else {
            formCadastro.classList.add('active');
        }
    });
});

function mostrarMensagem(elemento, mensagem, tipo = 'error') {
    elemento.textContent = mensagem;
    elemento.className = `form-message ${tipo}`;
    if (mensagem) {
        elemento.style.display = 'block';
    } else {
        elemento.style.display = 'none';
    }
}

function salvarToken(token) {
    localStorage.setItem('pplbase_token', token);
}

function getToken() {
    return localStorage.getItem('pplbase_token');
}

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const senha = document.getElementById('loginSenha').value;
    const message = document.getElementById('loginMessage');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });
        const data = await response.json();
        if (response.ok) {
            salvarToken(data.access_token);
            mostrarMensagem(message, '✅ Login realizado com sucesso!', 'success');
            setTimeout(() => {
                fecharModal();
                window.location.href = '/inicio.html';
            }, 1000);
        } else {
            mostrarMensagem(message, data.detail || '❌ Erro ao fazer login');
        }
    } catch (error) {
        mostrarMensagem(message, '❌ Erro de conexão com o servidor');
        console.error('Erro:', error);
    }
});

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('cadNome').value;
    const username = document.getElementById('cadUsername').value;
    const email = document.getElementById('cadEmail').value;
    const senha = document.getElementById('cadSenha').value;
    const localizacao = document.getElementById('cadLocalizacao').value;
    const message = document.getElementById('cadastroMessage');

    if (senha.length < 6) {
        mostrarMensagem(message, '❌ A senha deve ter no mínimo 6 caracteres');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, username, email, senha, localizacao })
        });
        const data = await response.json();
        if (response.ok) {
            salvarToken(data.access_token);
            mostrarMensagem(message, '✅ Conta criada com sucesso!', 'success');
            setTimeout(() => {
                fecharModal();
                window.location.href = '/inicio.html';
            }, 1500);
        } else {
            mostrarMensagem(message, data.detail || '❌ Erro ao criar conta');
        }
    } catch (error) {
        mostrarMensagem(message, '❌ Erro de conexão com o servidor');
        console.error('Erro:', error);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (token) {
        btnAbrirModal.textContent = '👤 Perfil';
        btnAbrirModal.style.background = '#2a2d3e';
    }
});

console.log('🚀 PplBase Frontend carregado!');
console.log('📌 API:', API_URL);
