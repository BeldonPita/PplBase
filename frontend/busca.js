// =========================================================
// CONFIGURAÇÃO
// =========================================================

const API_URL = 'http://localhost:8000';
const token = localStorage.getItem('pplbase_token');

// =========================================================
// ELEMENTOS
// =========================================================

const searchInput = document.getElementById('searchInput');
const searchHabilidade = document.getElementById('searchHabilidade');
const searchLocalizacao = document.getElementById('searchLocalizacao');
const searchOrdenar = document.getElementById('searchOrdenar');
const btnBuscar = document.getElementById('btnBuscar');
const resultsContainer = document.getElementById('resultsContainer');
const resultCount = document.getElementById('resultCount');
const filterTags = document.querySelectorAll('.filter-tag');
const pagination = document.getElementById('pagination');

let currentPage = 0;
const limit = 12;

// =========================================================
// VERIFICAR LOGIN
// =========================================================

if (!token) {
    window.location.href = '/';
}

// =========================================================
// LOGOUT
// =========================================================

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

// =========================================================
// CARREGAR FILTROS (HABILIDADES E LOCALIZAÇÕES)
// =========================================================

async function carregarFiltros() {
    try {
        // Carregar habilidades
        const respHabilidades = await fetch(`${API_URL}/pesquisa/habilidades`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (respHabilidades.ok) {
            const habilidades = await respHabilidades.json();
            habilidades.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                searchHabilidade.appendChild(opt);
            });
        }

        // Carregar localizações
        const respLocalizacoes = await fetch(`${API_URL}/pesquisa/localizacoes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (respLocalizacoes.ok) {
            const localizacoes = await respLocalizacoes.json();
            localizacoes.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l;
                opt.textContent = l;
                searchLocalizacao.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

// =========================================================
// FUNÇÃO DE BUSCA
// =========================================================

async function buscarPessoas(page = 0) {
    const query = searchInput.value.trim();
    const habilidade = searchHabilidade.value;
    const localizacao = searchLocalizacao.value;
    const ordenar = searchOrdenar.value;
    const offset = page * limit;

    resultsContainer.innerHTML = `
        <div class="loading">
            <span style="font-size: 48px;">🔍</span>
            <p>Buscando...</p>
        </div>
    `;

    try {
        let url = `${API_URL}/pesquisa/pessoas?limit=${limit}&offset=${offset}`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (habilidade) url += `&habilidade=${encodeURIComponent(habilidade)}`;
        if (localizacao) url += `&localizacao=${encodeURIComponent(localizacao)}`;
        if (ordenar) url += `&ordenar=${encodeURIComponent(ordenar)}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('pplbase_token');
                window.location.href = '/';
            }
            throw new Error('Erro na busca');
        }

        const data = await response.json();
        renderResultados(data, page);

    } catch (error) {
        console.error('Erro:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">❌</div>
                <h3>Erro ao buscar</h3>
                <p>Não foi possível realizar a busca. Tente novamente.</p>
            </div>
        `;
    }
}

// =========================================================
// RENDERIZAR RESULTADOS
// =========================================================

function renderResultados(usuarios, page) {
    currentPage = page;

    if (!usuarios || usuarios.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente buscar por outra habilidade, nome ou localização.</p>
            </div>
        `;
        resultCount.textContent = '';
        pagination.innerHTML = '';
        return;
    }

    resultCount.textContent = `📊 ${usuarios.length} resultados encontrados`;

    let html = `<div class="results-grid">`;
    
    usuarios.forEach(user => {
        const avatar = user.nome ? user.nome.charAt(0).toUpperCase() : '?';
        const habilidades = user.habilidades || [];
        const tags = habilidades.map(h => `<span class="tag">${h.nome}</span>`).join('');
        
        html += `
            <div class="user-card">
                <div class="avatar-circle">${avatar}</div>
                <h3>${user.nome || 'Usuário'}</h3>
                <div class="username">@${user.username}</div>
                ${user.localizacao ? `<div class="location">📍 ${user.localizacao}</div>` : ''}
                ${user.bio ? `<div class="bio">${user.bio}</div>` : ''}
                ${tags ? `<div class="tags">${tags}</div>` : ''}
                <a href="perfil.html?username=${user.username}" class="btn-view">👤 Ver Perfil</a>
            </div>
        `;
    });
    
    html += `</div>`;
    resultsContainer.innerHTML = html;
}

// =========================================================
// FILTROS RÁPIDOS
// =========================================================

filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
        filterTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        
        const filter = tag.dataset.filter;
        
        if (filter === 'all') {
            searchInput.value = '';
            searchHabilidade.value = '';
            buscarPessoas(0);
        } else {
            searchInput.value = '';
            searchHabilidade.value = filter;
            buscarPessoas(0);
        }
    });
});

// =========================================================
// EVENTOS
// =========================================================

btnBuscar.addEventListener('click', () => buscarPessoas(0));

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarPessoas(0);
});

searchHabilidade.addEventListener('change', () => buscarPessoas(0));
searchLocalizacao.addEventListener('change', () => buscarPessoas(0));
searchOrdenar.addEventListener('change', () => buscarPessoas(0));

// =========================================================
// INICIALIZAR
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
    await carregarFiltros();
    buscarPessoas(0);
});

console.log('🔍 PplBase Busca carregado!');
console.log('📌 API:', API_URL);