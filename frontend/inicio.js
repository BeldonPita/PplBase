const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

async function carregarFeed() {
    try {
        const response = await fetch(`${API_URL}/pesquisa/pessoas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro');
        const pessoas = await response.json();

        const container = document.getElementById('feedContent');

        if (!pessoas.length) {
            container.innerHTML = '<div class="empty">Nenhuma atividade recente.</div>';
            return;
        }

        container.innerHTML = pessoas.slice(0, 10).map(p => `
            <div class="feed-item">
                <div class="user">
                    <div class="avatar">${p.nome?.charAt(0) || '?'}</div>
                    <div><strong>${p.nome || 'Usuário'}</strong> <span style="color:var(--text-muted);">@${p.username}</span></div>
                </div>
                <div class="content"><p>${p.bio || 'Novo membro do PplBase!'}</p></div>
                <div class="time">${p.localizacao ? `📍 ${p.localizacao}` : ''}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('feedContent').innerHTML = '<div class="empty">Erro ao carregar feed.</div>';
    }
}

carregarFeed();
