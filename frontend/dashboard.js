const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

function getHeaders() {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// =========================================================
// CARREGAR PERFIL
// =========================================================

async function carregarPerfil() {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro');
        const user = await response.json();

        // Foto
        if (user.foto_url) {
            document.getElementById('avatarPlaceholder').style.display = 'none';
            const img = document.getElementById('avatarImage');
            img.src = user.foto_url;
            img.style.display = 'block';
        }

        // Info
        document.getElementById('profileInfo').innerHTML = `
            <p><strong>Nome:</strong> ${user.nome || '-'}</p>
            <p><strong>Username:</strong> @${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Localização:</strong> ${user.localizacao || 'Não definida'}</p>
            <p><strong>Bio:</strong> ${user.bio || 'Sem bio'}</p>
        `;

        // Habilidades
        const habList = document.getElementById('habilidadesList');
        if (user.habilidades?.length) {
            habList.innerHTML = user.habilidades.map(h => `<span class="tag">${h.nome}</span>`).join('');
        } else {
            habList.innerHTML = '<div class="empty">Nenhuma habilidade</div>';
        }

        // Experiências
        const expList = document.getElementById('experienciasList');
        if (user.experiencias?.length) {
            expList.innerHTML = user.experiencias.map(exp => `
                <div class="exp-item">
                    <div class="info">
                        <h4>${exp.titulo}</h4>
                        ${exp.empresa ? `<p>${exp.empresa}${exp.localizacao ? ` · ${exp.localizacao}` : ''}</p>` : ''}
                        ${exp.descricao ? `<p>${exp.descricao}</p>` : ''}
                    </div>
                    <div class="exp-actions">
                        <button onclick="editarExperiencia(${exp.id})" title="Editar">✏️</button>
                        <button onclick="removerExperiencia(${exp.id})" title="Remover">🗑️</button>
                    </div>
                </div>
            `).join('');
        } else {
            expList.innerHTML = '<div class="empty">Nenhuma experiência</div>';
        }

        window.usuarioAtual = user;

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('profileInfo').innerHTML = '<div class="empty">Erro ao carregar perfil</div>';
    }
}

// =========================================================
// UPLOAD DE FOTO DE PERFIL
// =========================================================

document.getElementById('avatarUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem não pode ter mais de 5MB');
        return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch(`${API_URL}/usuarios/upload-foto`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert('Foto atualizada com sucesso!');
            await carregarPerfil();
        } else {
            const data = await response.json();
            alert(data.detail || 'Erro ao enviar foto');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
});

// =========================================================
// ADICIONAR EXPERIÊNCIA
// =========================================================

document.getElementById('btnAddExperiencia').addEventListener('click', () => {
    document.getElementById('modalExpTitle').textContent = 'Adicionar Experiência';
    document.getElementById('expId').value = '';
    document.getElementById('expTitulo').value = '';
    document.getElementById('expEmpresa').value = '';
    document.getElementById('expDescricao').value = '';
    document.getElementById('expLocalizacao').value = '';
    document.getElementById('modalExperiencia').classList.add('active');
});

document.getElementById('fecharModalExp').addEventListener('click', () => {
    document.getElementById('modalExperiencia').classList.remove('active');
});

document.getElementById('formExperiencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('expId').value;
    const titulo = document.getElementById('expTitulo').value;
    const empresa = document.getElementById('expEmpresa').value;
    const descricao = document.getElementById('expDescricao').value;
    const localizacao = document.getElementById('expLocalizacao').value;
    const message = document.getElementById('expMessage');

    const url = id ? `${API_URL}/usuarios/experiencias/${id}` : `${API_URL}/usuarios/experiencias`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify({ titulo, empresa, descricao, localizacao })
        });
        if (response.ok) {
            document.getElementById('modalExperiencia').classList.remove('active');
            await carregarPerfil();
        } else {
            const data = await response.json();
            message.textContent = data.detail || 'Erro';
        }
    } catch (error) {
        message.textContent = 'Erro de conexão';
    }
});

// =========================================================
// EDITAR EXPERIÊNCIA
// =========================================================

window.editarExperiencia = async (id) => {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
        const user = await response.json();
        const exp = user.experiencias.find(e => e.id === id);
        if (!exp) return;

        document.getElementById('modalExpTitle').textContent = 'Editar Experiência';
        document.getElementById('expId').value = id;
        document.getElementById('expTitulo').value = exp.titulo || '';
        document.getElementById('expEmpresa').value = exp.empresa || '';
        document.getElementById('expDescricao').value = exp.descricao || '';
        document.getElementById('expLocalizacao').value = exp.localizacao || '';
        document.getElementById('modalExperiencia').classList.add('active');
    } catch (error) {
        console.error('Erro:', error);
    }
};

window.removerExperiencia = async (id) => {
    if (!confirm('Remover esta experiência?')) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/experiencias/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.ok) await carregarPerfil();
    } catch (error) {
        console.error('Erro:', error);
    }
};

// =========================================================
// HABILIDADES
// =========================================================

document.getElementById('btnAddHabilidade').addEventListener('click', async () => {
    const input = document.getElementById('novaHabilidade');
    const nome = input.value.trim();
    if (!nome) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/habilidades`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ nome })
        });
        if (response.ok) {
            input.value = '';
            await carregarPerfil();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
});

// =========================================================
// EDITAR PERFIL
// =========================================================

document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    const user = window.usuarioAtual;
    if (!user) return;
    document.getElementById('editNome').value = user.nome || '';
    document.getElementById('editBio').value = user.bio || '';
    document.getElementById('editLocalizacao').value = user.localizacao || '';
    document.getElementById('modalEditarPerfil').classList.add('active');
});

document.getElementById('fecharModalEditar').addEventListener('click', () => {
    document.getElementById('modalEditarPerfil').classList.remove('active');
});

document.getElementById('formEditarPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('editNome').value;
    const bio = document.getElementById('editBio').value;
    const localizacao = document.getElementById('editLocalizacao').value;

    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ nome, bio, localizacao })
        });
        if (response.ok) {
            document.getElementById('modalEditarPerfil').classList.remove('active');
            await carregarPerfil();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
});

// =========================================================
// LOGOUT
// =========================================================

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

// =========================================================
// INICIALIZAR
// =========================================================

carregarPerfil();
const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');
if (!token) window.location.href = '/';

// Funções existentes (carregarPerfil, etc.) mantidas do teu ficheiro actual.

// =========================================================
// RENDERIZAR PERFIL ESTILO LINKEDIN
// =========================================================

function renderPerfilLinkedIn(user) {
    const avatar = user.foto_url
        ? `<img src="${user.foto_url}" alt="${user.nome}">`
        : (user.nome ? user.nome.charAt(0).toUpperCase() : '?');

    const habilidades = user.habilidades || [];
    const experiencias = user.experiencias || [];

    document.getElementById('profileInfo').innerHTML = `
        <!-- CAPA -->
        <div style="position:relative; margin-bottom:80px;">
            <div style="height:140px; background:linear-gradient(135deg, var(--cor-primaria), var(--cor-secundaria)); border-radius:16px 16px 0 0;"></div>
            <div style="position:absolute; bottom:-70px; left:32px; width:140px; height:140px; border-radius:50%; background:var(--cor-primaria); border:4px solid var(--cor-cartao); display:flex; align-items:center; justify-content:center; font-size:52px; font-weight:700; color:white; overflow:hidden;">
                ${avatar}
            </div>
        </div>

        <!-- INFO PRINCIPAL -->
        <div style="padding:0 32px 32px;">
            <h1 style="font-size:26px; margin-bottom:4px;">${user.nome || 'Utilizador'}</h1>
            <p style="color:var(--cor-primaria); font-size:15px; margin-bottom:8px;">@${user.username}</p>
            ${user.localizacao ? `<p style="color:var(--cor-texto-secundario); font-size:14px; margin-bottom:12px;">📍 ${user.localizacao}</p>` : ''}
            ${user.bio ? `<p style="color:var(--cor-texto-secundario); line-height:1.6; margin-bottom:16px;">${user.bio}</p>` : ''}
            <button class="btn-primary btn-small" id="btnEditarPerfil" style="margin-top:8px;">✏️ Editar Perfil</button>
        </div>

        <!-- ESTATÍSTICAS -->
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; padding:0 32px 32px;">
            <div style="text-align:center; padding:16px; background:var(--cor-fundo); border-radius:12px; border:1px solid var(--cor-borda);">
                <div style="font-size:22px; font-weight:700; color:var(--cor-primaria);">${habilidades.length}</div>
                <div style="font-size:12px; color:var(--cor-texto-secundario);">Habilidades</div>
            </div>
            <div style="text-align:center; padding:16px; background:var(--cor-fundo); border-radius:12px; border:1px solid var(--cor-borda);">
                <div style="font-size:22px; font-weight:700; color:var(--cor-primaria);">${experiencias.length}</div>
                <div style="font-size:12px; color:var(--cor-texto-secundario);">Experiências</div>
            </div>
            <div style="text-align:center; padding:16px; background:var(--cor-fundo); border-radius:12px; border:1px solid var(--cor-borda);">
                <div style="font-size:22px; font-weight:700; color:var(--cor-primaria);">0</div>
                <div style="font-size:12px; color:var(--cor-texto-secundario);">Seguidores</div>
            </div>
            <div style="text-align:center; padding:16px; background:var(--cor-fundo); border-radius:12px; border:1px solid var(--cor-borda);">
                <div style="font-size:22px; font-weight:700; color:var(--cor-primaria);">0</div>
                <div style="font-size:12px; color:var(--cor-texto-secundario);">A seguir</div>
            </div>
        </div>

        <!-- HABILIDADES -->
        <div style="padding:0 32px 24px;">
            <h2 style="font-size:18px; margin-bottom:16px;">🧠 Habilidades</h2>
            <div id="habilidadesList" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            <div style="display:flex; gap:8px; margin-top:12px;">
                <input type="text" id="novaHabilidade" placeholder="Ex: Python" style="flex:1; padding:10px 14px; background:var(--cor-fundo); border:1px solid var(--cor-borda); border-radius:8px; color:var(--cor-texto);">
                <button class="btn-primary btn-small" id="btnAddHabilidade">+</button>
            </div>
        </div>

        <!-- EXPERIÊNCIAS -->
        <div style="padding:0 32px 32px;">
            <h2 style="font-size:18px; margin-bottom:16px;">💼 Experiências</h2>
            <div id="experienciasList"></div>
            <button class="btn-primary btn-small" id="btnAddExperiencia" style="margin-top:12px; width:100%;">+ Adicionar Experiência</button>
        </div>
    `;

    // Reattach dos eventos
    carregarPerfil();
}
