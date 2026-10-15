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

async function carregarFiltros() {
    try {
        const respHab = await fetch(`${API_URL}/pesquisa/habilidades`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (respHab.ok) {
            const habs = await respHab.json();
            habs.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h; opt.textContent = h;
                searchHabilidade.appendChild(opt);
            });
        }
        const respLoc = await fetch(`${API_URL}/pesquisa/localizacoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (respLoc.ok) {
            const locs = await respLoc.json();
            locs.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l; opt.textContent = l;
                searchLocalizacao.appendChild(opt);
            });
        }
    } catch (error) { console.error('Erro ao carregar filtros:', error); }
}

async function buscar() {
    const q = searchInput.value.trim();
    const habilidade = searchHabilidade.value;
    const localizacao = searchLocalizacao.value;
    const ordenar = searchOrdenar.value;

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
                const avatar = u.nome ? u.nome.charAt(0).toUpperCase() : '?';
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
searchHabilidade.addEventListener('change', buscar);
searchLocalizacao.addEventListener('change', buscar);
searchOrdenar.addEventListener('change', buscar);
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});
document.addEventListener('DOMContentLoaded', async () => {
    await carregarFiltros();
    buscar();
});
