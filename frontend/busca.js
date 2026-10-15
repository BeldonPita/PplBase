const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');
if (!token) window.location.href = '/';

const searchAgente = document.getElementById('searchAgente');
const searchHabilidade = document.getElementById('searchHabilidade');
const searchLocalizacao = document.getElementById('searchLocalizacao');
const searchOrdenar = document.getElementById('searchOrdenar');
const resultsContainer = document.getElementById('resultsContainer');
const resultCount = document.getElementById('resultCount');

// =========================================================
// CARREGAR LOCALIZAÇÕES
// =========================================================

async function carregarLocalizacoes() {
    try {
        const resp = await fetch(`${API_URL}/pesquisa/localizacoes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
            const locs = await resp.json();
            locs.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.split(' ')[0];
                opt.textContent = l;
                searchLocalizacao.appendChild(opt);
            });
        }
    } catch (error) { console.error(error); }
}

// =========================================================
// AUTOCOMPLETE DINÂMICO DE HABILIDADES
// =========================================================

let timeoutBusca;

searchHabilidade.addEventListener('input', (e) => {
    clearTimeout(timeoutBusca);
    const termo = e.target.value.trim();
    
    // Remove lista anterior
    document.querySelector('.sugestoes-lista')?.remove();
    
    // Se vazio, não busca
    if (termo.length === 0) return;
    
    // Debounce de 150ms para não sobrecarregar
    timeoutBusca = setTimeout(() => {
        buscarSugestoes(termo);
    }, 150);
});

async function buscarSugestoes(termo) {
    try {
        const resp = await fetch(`${API_URL}/pesquisa/sugerir-habilidade?termo=${encodeURIComponent(termo)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
            const data = await resp.json();
            mostrarSugestoes(data.sugestoes, termo);
        }
    } catch (error) { console.error(error); }
}

function mostrarSugestoes(sugestoes, termo) {
    if (!sugestoes || sugestoes.length === 0) return;
    
    const lista = document.createElement('div');
    lista.className = 'sugestoes-lista';
    
    sugestoes.forEach(s => {
        const item = document.createElement('div');
        item.className = 'item';
        
        // Destacar o termo digitado
        const idx = s.toLowerCase().indexOf(termo.toLowerCase());
        if (idx >= 0) {
            const antes = s.substring(0, idx);
            const match = s.substring(idx, idx + termo.length);
            const depois = s.substring(idx + termo.length);
            item.innerHTML = `${antes}<span class="match">${match}</span>${depois}`;
        } else {
            item.textContent = s;
        }
        
        item.addEventListener('click', () => {
            searchHabilidade.value = s;
            lista.remove();
            buscar();
        });
        
        lista.appendChild(item);
    });
    
    searchHabilidade.parentElement.appendChild(lista);
}

// Fechar sugestões ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('#searchHabilidade')) {
        document.querySelector('.sugestoes-lista')?.remove();
    }
});

// =========================================================
// BUSCAR
// =========================================================

async function buscar() {
    const agente = searchAgente.value.trim();
    const habilidade = searchHabilidade.value.trim();
    const localizacao = searchLocalizacao.value.trim();
    const ordenar = searchOrdenar.value;

    if (!agente && !habilidade && !localizacao) {
        resultsContainer.innerHTML = `
            <div class="empty">
                <div style="font-size:48px; margin-bottom:16px;">🔍</div>
                <p>Comece a digitar para buscar agentes</p>
                <p style="font-size:13px; margin-top:8px; opacity:0.7;">Por nome, habilidade ou localização</p>
            </div>`;
        resultCount.textContent = '';
        return;
    }

    resultsContainer.innerHTML = '<div class="empty">A buscar...</div>';

    let url = `${API_URL}/pesquisa/pessoas?ordenar=${ordenar}&limit=30`;
    if (agente) url += `&q=${encodeURIComponent(agente)}`;
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
    resultCount.textContent = `${usuarios.length} resultado(s)`;
    resultsContainer.innerHTML = `
        <div class="resultados-grid">
            ${usuarios.map(u => {
                const avatar = u.foto_url
                    ? `<img src="${u.foto_url}" alt="${u.nome}">`
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
        </div>`;
}

// Eventos
searchAgente.addEventListener('input', () => {
    clearTimeout(window._timeoutAgente);
    window._timeoutAgente = setTimeout(buscar, 300);
});
searchLocalizacao.addEventListener('change', buscar);
searchOrdenar.addEventListener('change', buscar);

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', async () => {
    await carregarLocalizacoes();
});
