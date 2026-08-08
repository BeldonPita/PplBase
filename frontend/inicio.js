const API_URL = 'http://localhost:8000';
const token = localStorage.getItem('pplbase_token');

if (!token) {
    window.location.href = '/';
}

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

async function carregarDados() {
    try {
        // Carregar perfil
        const respPerfil = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await respPerfil.json();
        document.getElementById('welcomeNome').textContent = user.nome;

        // Carregar seguidores e seguindo
        const respSeguidores = await fetch(`${API_URL}/conexoes/seguidores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const seguidores = await respSeguidores.json();

        const respSeguindo = await fetch(`${API_URL}/conexoes/seguindo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const seguindo = await respSeguindo.json();

        document.getElementById('statSeguidores').textContent = seguidores.length;
        document.getElementById('statSeguindo').textContent = seguindo.length;
        document.getElementById('statHabilidades').textContent = user.habilidades?.length || 0;
        document.getElementById('statExperiencias').textContent = user.experiencias?.length || 0;

        // Carregar sugestões (pessoas que você não segue)
        const respBusca = await fetch(`${API_URL}/pesquisa/pessoas?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pessoas = await respBusca.json();

        const seguindoUsernames = seguindo.map(u => u.username);
        const sugestoes = pessoas.filter(p => 
            p.username !== user.username && 
            !seguindoUsernames.includes(p.username)
        );

        const container = document.getElementById('sugestoesContainer');
        if (sugestoes.length === 0) {
            container.innerHTML = '<div class="empty-state-small">Nenhuma sugestão no momento.</div>';
        } else {
            container.innerHTML = sugestoes.slice(0, 5).map(p => `
                <div class="sugestao-item">
                    <div class="info">
                        <div class="name">${p.nome}</div>
                        <div class="username">@${p.username}</div>
                    </div>
                    <button class="btn-seguir" onclick="seguirUsuario('${p.username}')">Seguir</button>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

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
            alert(`✅ Você agora segue @${username}`);
            carregarDados();
        } else {
            const data = await response.json();
            alert(`❌ ${data.detail}`);
        }
    } catch (error) {
        console.error('Erro ao seguir:', error);
        alert('❌ Erro ao seguir usuário');
    }
}

document.addEventListener('DOMContentLoaded', carregarDados);
console.log('🏠 PplBase Início carregado!');
