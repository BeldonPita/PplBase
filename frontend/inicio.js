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
            container.innerHTML = '<div style="color:#64748B;">Nenhuma atividade recente.</div>';
            return;
        }

        container.innerHTML = pessoas.slice(0, 10).map(p => `
            <div style="background:#1E293B; border:1px solid #334155; border-radius:12px; padding:16px; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#2563EB; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700;">${p.nome?.charAt(0) || '?'}</div>
                    <div>
                        <div style="font-weight:600;">${p.nome || 'Usuário'}</div>
                        <div style="color:#94A3B8; font-size:14px;">@${p.username}</div>
                    </div>
                </div>
                <div style="margin-top:8px; color:#F1F5F9;">${p.bio || 'Novo membro do PplBase!'}</div>
                <div style="margin-top:4px; color:#64748B; font-size:12px;">${p.localizacao ? `📍 ${p.localizacao}` : ''}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('feedContent').innerHTML = '<div style="color:#EF4444;">Erro ao carregar feed.</div>';
    }
}

carregarFeed();
