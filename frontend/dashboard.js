const API_URL = 'https://pplbase.onrender.com';
const token = localStorage.getItem('pplbase_token');

if (!token) window.location.href = '/';

// =========================================================
// ELEMENTOS
// =========================================================

const profileName = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const habilidadesList = document.getElementById('habilidadesList');
const experienciasList = document.getElementById('experienciasList');
const avatarPlaceholder = document.getElementById('avatarPlaceholder');
const avatarImage = document.getElementById('avatarImage');
const avatarUpload = document.getElementById('avatarUpload');

// =========================================================
// HEADERS
// =========================================================

function getHeaders() {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// =========================================================
// CARREGAR PERFIL
// =========================================================

async function carregarPerfil() {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Erro');
        const user = await response.json();

        profileName.textContent = user.nome || 'Usuário';
        profileUsername.textContent = `@${user.username}`;
        profileBio.textContent = user.bio || 'Sem bio';

        // Foto
        if (user.foto_url) {
            avatarPlaceholder.style.display = 'none';
            avatarImage.src = user.foto_url;
            avatarImage.style.display = 'block';
        } else {
            avatarPlaceholder.style.display = 'flex';
            avatarImage.style.display = 'none';
        }

        // Habilidades
        if (user.habilidades?.length) {
            habilidadesList.innerHTML = user.habilidades.map(h =>
                `<span class="tag">${h.nome}</span>`
            ).join('');
        } else {
            habilidadesList.innerHTML = '<div class="empty-state">Nenhuma habilidade</div>';
        }

        // Experiências
        if (user.experiencias?.length) {
            experienciasList.innerHTML = user.experiencias.map(exp =>
                `<div class="exp-item">
                    <div class="exp-info">
                        <h4>${exp.titulo}</h4>
                        ${exp.empresa ? `<p>${exp.empresa}</p>` : ''}
                        ${exp.descricao ? `<p>${exp.descricao}</p>` : ''}
                        ${exp.localizacao ? `<p>📍 ${exp.localizacao}</p>` : ''}
                    </div>
                    <div class="exp-actions">
                        <button onclick="editarExperiencia(${exp.id})" title="Editar">✏️</button>
                        <button onclick="removerExperiencia(${exp.id})" class="delete-btn" title="Remover">🗑️</button>
                    </div>
                </div>`
            ).join('');
        } else {
            experienciasList.innerHTML = '<div class="empty-state">Nenhuma experiência</div>';
        }

        window.usuarioAtual = user;

    } catch (error) {
        console.error('Erro:', error);
    }
}

// =========================================================
// EXPERIÊNCIAS
// =========================================================

document.getElementById('btnAdicionarExperiencia').addEventListener('click', () => {
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
        if (response.ok) {
            await carregarPerfil();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};

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
// HABILIDADES
// =========================================================

document.getElementById('btnAdicionarHabilidade').addEventListener('click', async () => {
    const input = document.getElementById('novaHabilidadeInput');
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
// FOTO DE PERFIL (UPLOAD)
// =========================================================

avatarUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch(`${API_URL}/usuarios/upload-foto`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.ok) {
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
    const message = document.getElementById('editMessage');

    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ nome, bio, localizacao })
        });
        if (response.ok) {
            document.getElementById('modalEditarPerfil').classList.remove('active');
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
// LOGOUT
// =========================================================

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('pplbase_token');
    window.location.href = '/';
});

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

// =========================================================
// INICIALIZAR
// =========================================================

carregarPerfil();
