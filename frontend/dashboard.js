const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) {
    window.location.href = '/';
}

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

async function carregarPerfil() {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('pplbase_token');
                window.location.href = '/';
            }
            throw new Error('Erro ao carregar perfil');
        }

        const user = await response.json();

        document.getElementById('profileInfo').innerHTML = `
            <div class="row"><span class="label">👤 Nome</span><span class="value">${user.nome || '-'}</span></div>
            <div class="row"><span class="label">📛 Username</span><span class="value">@${user.username}</span></div>
            <div class="row"><span class="label">📧 Email</span><span class="value">${user.email}</span></div>
            <div class="row"><span class="label">📍 Localização</span><span class="value">${user.localizacao || 'Não definida'}</span></div>
            <div class="row"><span class="label">📝 Bio</span><span class="value">${user.bio || 'Sem bio'}</span></div>
            <div class="row"><span class="label">🏷️ Habilidades</span><span class="value">${user.habilidades?.length > 0 ? user.habilidades.map(h => `<span class="tag">${h.nome}</span>`).join('') : 'Nenhuma'}</span></div>
            <div class="row"><span class="label">💼 Experiências</span><span class="value">${user.experiencias?.length || 0} registradas</span></div>
        `;

        window.usuarioAtual = user;

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('profileInfo').innerHTML = `
            <div style="text-align:center; padding:20px; color:#f87171;">❌ Erro ao carregar perfil</div>
        `;
    }
}

carregarPerfil();
