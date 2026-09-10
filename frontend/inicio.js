const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

// =========================================================
// IDENTIFICAR SE É NOVO OU RECORRENTE
// =========================================================

function verificarPrimeiroAcesso() {
    const jaAcedeu = localStorage.getItem('pplbase_ja_acedeu');
    
    if (!jaAcedeu) {
        // Primeiro acesso
        localStorage.setItem('pplbase_ja_acedeu', 'true');
        localStorage.setItem('pplbase_primeiro_acesso', new Date().toISOString());
        return true;
    }
    
    return false;
}

// =========================================================
// LOGOUT
// =========================================================

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    // NÃO removemos o pplbase_ja_acedeu para manter o histórico
    window.location.href = '/';
});

// =========================================================
// CARREGAR DADOS DO UTILIZADOR
// =========================================================

async function carregarDados() {
    try {
        // Perfil
        const respPerfil = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await respPerfil.json();
        
        const ehNovo = verificarPrimeiroAcesso();
        
        // Atualizar banner
        const bannerTitulo = document.getElementById('bannerTitulo');
        const bannerMensagem = document.getElementById('bannerMensagem');
        const bannerCta = document.getElementById('bannerCta');
        const bannerIcon = document.getElementById('bannerIcon');
        
        if (ehNovo) {
            // Utilizador novo
            bannerTitulo.innerHTML = `Bem-vindo ao PplBase, <span id="userName">${user.nome || 'Usuário'}</span>!`;
            bannerMensagem.textContent = 'Que bom ter-te aqui! Começa por completar o teu perfil para que outros possam encontrar-te.';
            bannerCta.style.display = 'flex';
            bannerIcon.innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
            `;
        } else {
            // Utilizador recorrente
            bannerTitulo.innerHTML = `Bem-vindo de volta, <span id="userName">${user.nome || 'Usuário'}</span>!`;
            bannerMensagem.textContent = 'Explore as últimas novidades e conecte-se com a comunidade.';
            bannerCta.style.display = 'none';
        }
        
        // Atualizar estatísticas
        document.getElementById('statHabilidades').textContent = user.habilidades?.length || 0;
        document.getElementById('statExperiencias').textContent = user.experiencias?.length || 0;

        // Seguidores/Seguindo
        const respSeguidores = await fetch(`${API_URL}/conexoes/seguidores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const seguidores = await respSeguidores.json();

        const respSeguindo = await fetch(`${API_URL}/conexoes/seguindo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const seguindo = await respSeguindo.json();

        document.getElementById('statSeguidores').textContent = seguidores.length || 0;
        document.getElementById('statSeguindo').textContent = seguindo.length || 0;

        // Sugestões
        const respBusca = await fetch(`${API_URL}/pesquisa/pessoas?limit=6`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pessoas = await respBusca.json();
        const seguindoUsernames = seguindo.map(u => u.username);
        const sugestoes = pessoas.filter(p => 
            p.username !== user.username && 
            !seguindoUsernames.includes(p.username)
        );

        const sugestoesContainer = document.getElementById('sugestoesContainer');
        if (sugestoes.length === 0) {
            sugestoesContainer.innerHTML = '<div class="empty">Nenhuma sugestão no momento.</div>';
        } else {
            sugestoesContainer.innerHTML = sugestoes.map(p => `
                <div class="sugestao-item">
                    <div class="info">
                        <div class="avatar">${p.nome?.charAt(0) || '?'}</div>
                        <div>
                            <div class="nome">${p.nome || 'Usuário'}</div>
                            <div class="username">@${p.username}</div>
                        </div>
                    </div>
                    <button class="btn-seguir" onclick="seguirUsuario('${p.username}')">Seguir</button>
                </div>
            `).join('');
        }

        // Atividades
        const atividadesContainer = document.getElementById('atividadesContainer');
        if (pessoas.length === 0) {
            atividadesContainer.innerHTML = '<div class="empty">Nenhuma atividade recente.</div>';
        } else {
            atividadesContainer.innerHTML = pessoas.slice(0, 5).map(p => `
                <div class="atividade-item">
                    <div class="info">
                        <div class="avatar">${p.nome?.charAt(0) || '?'}</div>
                        <div>
                            <div class="nome">${p.nome || 'Usuário'}</div>
                            <div class="username">${p.bio || 'Novo membro do PplBase!'}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

// =========================================================
// SEGUIR USUÁRIO
// =========================================================

async function seguirUsuario(username) {
    try {
        const response = await fetch(`${API_URL}/conexoes/seguir/${username}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            alert(`Agora segues @${username}`);
            carregarDados();
        } else {
            const data = await response.json();
            alert(data.detail || 'Erro ao seguir');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

carregarDados();
