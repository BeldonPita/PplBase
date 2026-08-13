const API_URL = 'http://localhost:8000';
const token = localStorage.getItem('pplbase_token');

if (!token) {
    window.location.href = '/';
}

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

function getUsernameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('username');
}

async function carregarPerfilPublico() {
    const username = getUsernameFromURL();
    const container = document.getElementById('perfilContainer');
    
    if (!username) {
        container.innerHTML = `
            <div class="erro-perfil">
                <div class="big-icon">❌</div>
                <h2>Usuário não especificado</h2>
                <p>Nenhum usuário foi selecionado.</p>
                <a href="busca.html" class="voltar-link">← Voltar para a busca</a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios/${username}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Usuário não encontrado');
            }
            if (response.status === 401) {
                localStorage.removeItem('pplbase_token');
                window.location.href = '/';
            }
            throw new Error('Erro ao carregar perfil');
        }

        const user = await response.json();
        renderPerfil(user, container);

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="erro-perfil">
                <div class="big-icon">❌</div>
                <h2>${error.message || 'Erro ao carregar perfil'}</h2>
                <p>Não foi possível encontrar o perfil solicitado.</p>
                <a href="busca.html" class="voltar-link">← Voltar para a busca</a>
            </div>
        `;
    }
}

function renderPerfil(user, container) {
    const avatar = user.nome ? user.nome.charAt(0).toUpperCase() : '?';
    
    const habilidadesHTML = user.habilidades && user.habilidades.length > 0
        ? user.habilidades.map(h => `<span class="tag">${h.nome}</span>`).join('')
        : '<p style="color: #5a5e72;">Nenhuma habilidade cadastrada</p>';
    
    let experienciasHTML = '';
    if (user.experiencias && user.experiencias.length > 0) {
        experienciasHTML = user.experiencias.map(exp => `
            <div class="perfil-exp-item">
                <div class="titulo">${exp.titulo}</div>
                ${exp.empresa ? `<div class="empresa">${exp.empresa} ${exp.localizacao ? `- ${exp.localizacao}` : ''}</div>` : ''}
                ${exp.descricao ? `<div class="desc">${exp.descricao}</div>` : ''}
            </div>
        `).join('');
    } else {
        experienciasHTML = '<p style="color: #5a5e72;">Nenhuma experiência cadastrada</p>';
    }

    container.innerHTML = `
        <div class="perfil-container">
            <div class="perfil-avatar">${avatar}</div>
            <div class="perfil-nome">${user.nome || 'Usuário'}</div>
            <div class="perfil-username">@${user.username}</div>
            ${user.localizacao ? `<div class="perfil-localizacao">📍 ${user.localizacao}</div>` : ''}
            ${user.bio ? `<div class="perfil-bio">${user.bio}</div>` : ''}
            
            <div class="perfil-section">
                <h3>🧠 Habilidades</h3>
                <div class="perfil-tags">${habilidadesHTML}</div>
            </div>
            
            <div class="perfil-section">
                <h3>💼 Experiências</h3>
                ${experienciasHTML}
            </div>
            
            <button class="btn-conectar" onclick="alert('🚧 Função de conexão em breve!')">
                🤝 Conectar
            </button>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfilPublico();
});

console.log('👤 PplBase Perfil Público carregado!');
console.log('📌 API:', API_URL);
