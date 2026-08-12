const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

// =========================================================
// CARREGAR FEED
// =========================================================

async function carregarFeed() {
    try {
        const response = await fetch(`${API_URL}/pesquisa/pessoas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro');
        const pessoas = await response.json();

        const container = document.getElementById('feedContent');

        if (!pessoas.length) {
            container.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 40px 0;">Nenhuma atividade recente.</div>';
            return;
        }

        container.innerHTML = pessoas.slice(0, 10).map(p => `
            <div class="feed-item">
                <div class="user">
                    <div class="user-avatar">${p.nome?.charAt(0) || '?'}</div>
                    <div>
                        <div class="user-name">${p.nome || 'Usuário'}</div>
                        <div class="user-username">@${p.username}</div>
                    </div>
                </div>
                <div class="content">
                    ${p.bio || 'Novo membro do PplBase!'}
                </div>
                <div class="timestamp">${p.localizacao ? `📍 ${p.localizacao}` : ''}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('feedContent').innerHTML = '<div style="text-align:center; color: var(--danger); padding: 40px 0;">Erro ao carregar feed.</div>';
    }
}

carregarFeed();

// =========================================================
// TEMA
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
