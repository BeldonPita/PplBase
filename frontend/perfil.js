const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

function getUsername() {
    return new URLSearchParams(window.location.search).get('username');
}

async function carregarPerfil() {
    const username = getUsername();
    const container = document.getElementById('perfilContent');
    if (!username) {
        container.innerHTML = '<div class="empty">❌ Utilizador não especificado</div>';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/usuarios/${username}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
            container.innerHTML = '<div class="empty">❌ Utilizador não encontrado</div>';
            return;
        }
        const user = await response.json();
        renderPerfil(user);
    } catch (error) {
        container.innerHTML = '<div class="empty">❌ Erro ao carregar perfil</div>';
    }
}

function renderPerfil(user) {
    const container = document.getElementById('perfilContent');
    const avatar = user.foto_url ? `<img src="${user.foto_url}" alt="${user.nome}">` : (user.nome ? user.nome.charAt(0).toUpperCase() : '?');
    const habilidades = user.habilidades || [];
    const experiencias = user.experiencias || [];

    container.innerHTML = `
        <div class="perfil-header">
            <div class="perfil-avatar">${avatar}</div>
            <div class="perfil-nome">${user.nome || 'Utilizador'}</div>
            <div class="perfil-username">@${user.username}</div>
            ${user.localizacao ? `<div class="perfil-local">📍 ${user.localizacao}</div>` : ''}
            ${user.bio ? `<div class="perfil-bio">${user.bio}</div>` : ''}
            <button class="btn-seguir" id="btnSeguir" data-username="${user.username}">Seguir</button>
            <div class="perfil-stats">
                <div class="stat"><div class="num">${habilidades.length}</div><div class="lbl">Habilidades</div></div>
                <div class="stat"><div class="num">${experiencias.length}</div><div class="lbl">Experiências</div></div>
            </div>
        </div>
        <div class="perfil-section">
            <h2>🧠 Habilidades</h2>
            ${habilidades.length > 0 ? `<div class="perfil-tags">${habilidades.map(h => `<span class="tag">${h.nome}</span>`).join('')}</div>` : '<div class="empty">Nenhuma habilidade cadastrada</div>'}
        </div>
        <div class="perfil-section">
            <h2>💼 Experiências</h2>
            ${experiencias.length > 0 ? experiencias.map(e => `<div class="exp-item"><div class="titulo">${e.titulo}</div>${e.empresa ? `<div class="empresa">${e.empresa}${e.localizacao ? ` · ${e.localizacao}` : ''}</div>` : ''}${e.descricao ? `<div class="desc">${e.descricao}</div>` : ''}</div>`).join('') : '<div class="empty">Nenhuma experiência cadastrada</div>'}
        </div>
    `;
    document.getElementById('btnSeguir').addEventListener('click', seguir);
}

async function seguir() {
    const btn = document.getElementById('btnSeguir');
    const username = btn.dataset.username;
    try {
        const response = await fetch(`${API_URL}/conexoes/seguir/${username}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            btn.textContent = 'A seguir ✓';
            btn.classList.add('seguindo');
        } else {
            const data = await response.json();
            alert(data.detail || 'Erro ao seguir');
        }
    } catch (error) { alert('Erro de conexão'); }
}

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', carregarPerfil);
