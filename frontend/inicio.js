const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

// =========================================================
// IDENTIFICAR SE É NOVO OU RECORRENTE
// =========================================================

function verificarPrimeiroAcesso() {
    const jaAcedeu = localStorage.getItem('pplbase_ja_acedeu');
    
    if (!jaAcedeu) {
        localStorage.setItem('pplbase_ja_acedeu', 'true');
        localStorage.setItem('pplbase_primeiro_acesso', new Date().toISOString());
        return true;
    }
    
    return false;
}

// =========================================================
// MOSTRAR POPUP DE BOAS-VINDAS
// =========================================================

function mostrarPopup(ehNovo, nome) {
    const popup = document.getElementById('popupBoasVindas');
    const popupTitulo = document.getElementById('popupTitulo');
    const popupMensagem = document.getElementById('popupMensagem');
    const popupIcon = document.getElementById('popupIcon');
    const popupProgresso = document.getElementById('popupProgresso');

    if (ehNovo) {
        popupTitulo.textContent = `Bem-vindo ao PplBase, ${nome}!`;
        popupMensagem.textContent = 'Que bom ter-te aqui! Completa o teu perfil para que outros possam encontrar-te.';
        popupIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
        `;
    } else {
        popupTitulo.textContent = `Bem-vindo de volta, ${nome}!`;
        popupMensagem.textContent = 'Explore as últimas novidades e conecte-se com a comunidade.';
        popupIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        `;
    }

    // Mostrar o popup
    setTimeout(() => {
        popup.classList.add('ativo');
    }, 300);

    // Reiniciar a animação da barra de progresso
    popupProgresso.style.animation = 'none';
    void popupProgresso.offsetWidth;
    popupProgresso.style.animation = 'progresso 7s linear forwards';

    // Fechar automaticamente após 7 segundos
    setTimeout(() => {
        fecharPopup();
    }, 7000);
}

function fecharPopup() {
    const popup = document.getElementById('popupBoasVindas');
    popup.classList.remove('ativo');
}

// =========================================================
// LOGOUT
// =========================================================

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    // NÃO removemos o pplbase_ja_acedeu
    window.location.href = '/';
});

// =========================================================
// CARREGAR DADOS
// =========================================================

async function carregarDados() {
    try {
        const respPerfil = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await respPerfil.json();
        
        const ehNovo = verificarPrimeiroAcesso();

        // Atualizar banner
        const bannerTitulo = document.getElementById('bannerTitulo');
        const bannerMensagem = document.getElementById('bannerMensagem');
        
        if (ehNovo) {
            bannerTitulo.innerHTML = `Bem-vindo ao PplBase, <span id="userName">${user.nome || 'Usuário'}</span>!`;
            bannerMensagem.textContent = 'Que bom ter-te aqui! Começa por completar o teu perfil.';
        } else {
            bannerTitulo.innerHTML = `Bem-vindo de volta, <span id="userName">${user.nome || 'Usuário'}</span>!`;
            bannerMensagem.textContent = 'Explore as últimas novidades e conecte-se com a comunidade.';
        }

        // Mostrar popup
        mostrarPopup(ehNovo, user.nome || 'Usuário');

        // Estatísticas
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
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

// =========================================================
// FECHAR POPUP MANUALMENTE
// =========================================================

document.getElementById('popupFechar').addEventListener('click', fecharPopup);

// =========================================================
// INICIALIZAR
// =========================================================

carregarDados();
