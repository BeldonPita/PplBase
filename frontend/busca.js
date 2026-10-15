const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

const searchInput = document.getElementById('searchInput');
const searchHabilidade = document.getElementById('searchHabilidade');
const searchLocalizacao = document.getElementById('searchLocalizacao');
const searchOrdenar = document.getElementById('searchOrdenar');
const btnBuscar = document.getElementById('btnBuscar');
const resultsContainer = document.getElementById('resultsContainer');
const resultCount = document.getElementById('resultCount');

// =========================================================
// AUTOCOMPLETE DE HABILIDADES
// =========================================================

let sugestoesHabilidades = [];
let indiceSugestao = -1;

async function carregarFiltros() {
    try {
        // Localizações (províncias + capitais)
        const respLoc = await fetch(`${API_URL}/pesquisa/localizacoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (respLoc.ok) {
            const locs = await respLoc.json();
            locs.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.split(' ')[0]; // Só a província
                opt.textContent = l;
                searchLocalizacao.appendChild(opt);
            });
        }
    } catch (error) { console.error('Erro ao carregar filtros:', error); }
}

// Autocomplete de habilidades
searchHabilidade.addEventListener('input', async (e) => {
    const termo = e.target.value.trim();
    if (termo.length < 2) {
        document.getElementById('sugestoesHabilidades')?.remove();
        return;
    }
    
    try {
        const resp = await fetch(`${API_URL}/pesquisa/sugerir-habilidade?termo=${encodeURIComponent(termo)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
            const data = await resp.json();
            mostrarSugestoes(data.sugestoes, termo);
        }
    } catch (error) { console.error('Erro:', error); }
});

function mostrarSugestoes(sugestoes, termo) {
    // Remover lista antiga
    document.getElementById('sugestoesHabilidades')?.remove();
    
    if (!sugestoes || sugestoes.length === 0) return;
    
    const lista = document.createElement('div');
    lista.id = 'sugestoesHabilidades';
    lista.style.cssText = `
        position: absolute;
        background: var(--cor-cartao);
        border: 1px solid var(--cor-borda);
        border-radius: 8px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        width: 100%;
        margin-top: 4px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    sugestoes.forEach(s => {
        const item = document.createElement('div');
        item.textContent = s;
        item.style.cssText = `
            padding: 10px 14px;
            cursor: pointer;
            color: var(--cor-texto);
            font-size: 14px;
            border-bottom: 1px solid var(--cor-borda);
        `;
        item.addEventListener('mouseover', () => item.style.background = 'var(--cor-hover)');
        item.addEventListener('mouseout', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
            searchHabilidade.value = s;
            lista.remove();
            buscar();
        });
        lista.appendChild(item);
    });
    
    // Posicionar relativo ao input
    searchHabilidade.parentElement.style.position = 'relative';
    searchHabilidade.parentElement.appendChild(lista);
}

// Fechar sugestões ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('#searchHabilidade')) {
        document.getElementById('sugestoesHabilidades')?.remove();
    }
});

// =========================================================
// BUSCAR
// =========================================================

async function buscar() {
    const q = searchInput.value.trim();
    const habilidade = searchHabilidade.value.trim();
    const localizacao = searchLocalizacao.value.trim();
    const ordenar = searchOrdenar.value;

    // Não buscar se não houver nenhum critério
    if (!q && !habilidade && !localizacao) {
        resultsContainer.innerHTML = `
            <div class="empty">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <p>Comece a digitar para buscar pessoas</p>
                <p style="font-size: 13px; margin-top: 8px; opacity: 0.7;">Por nome, habilidade ou localização</p>
            </div>
        `;
        resultCount.textContent = '';
        return;
    }

    resultsContainer.innerHTML = '<div class="empty">A buscar...</div>';

    let url = `${API_URL}/pesquisa/pessoas?ordenar=${ordenar}&limit=30`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (habilidade) url += `&habilidade=${encodeURIComponent(habilidade)}`;
    if (localizacao) url += `&localizacao=${encodeURIComponent(localizacao)}`;

    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Erro');
        const data = await response.json();
        renderResultados(data);
    } catch (error) {
        resultsContainer.innerHTML = '<div class="empty">❌ Erro ao buscar</div>';
        resultCount.textContent = '';
    }
}

function renderResultados(usuarios) {
    if (!usuarios || usuarios.length === 0) {
        resultsContainer.innerHTML = '<div class="empty">🔍 Nenhum resultado encontrado</div>';
        resultCount.textContent = '0 resultados';
        return;
    }
    resultCount.textContent = `${usuarios.length} resultado(s) encontrado(s)`;
    resultsContainer.innerHTML = `
        <div class="resultados-grid">
            ${usuarios.map(u => {
                const avatar = u.foto_url
                    ? `<img src="${u.foto_url}" alt="${u.nome}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                    : (u.nome ? u.nome.charAt(0).toUpperCase() : '?');
                const tags = (u.habilidades || []).slice(0, 4).map(h => `<span class="tag">${h.nome}</span>`).join('');
                return `
                    <div class="user-card">
                        <div class="avatar">${avatar}</div>
                        <h3>${u.nome || 'Utilizador'}</h3>
                        <div class="username">@${u.username}</div>
                        ${u.localizacao ? `<div class="local">📍 ${u.localizacao}</div>` : ''}
                        ${u.bio ? `<div class="bio">${u.bio}</div>` : ''}
                        ${tags ? `<div class="tags">${tags}</div>` : ''}
                        <a href="perfil.html?username=${u.username}" class="btn-ver">Ver Perfil</a>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

btnBuscar.addEventListener('click', buscar);
searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') buscar(); });
searchLocalizacao.addEventListener('change', buscar);
searchOrdenar.addEventListener('change', buscar);

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', async () => {
    await carregarFiltros();
    // Mostrar mensagem inicial
    buscar();
});
