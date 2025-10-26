// ============================================
// AUDIO SESSIONS - FEATURES MODULE
// Sistema de Favoritos y Compartir
// ============================================

// ============================================
// 1. SISTEMA DE FAVORITOS
// ============================================
class FavoritesManager {
    constructor() {
        this.STORAGE_KEY = 'audioSessions_favorites';
        this.favorites = this.loadFavorites();
        this.initUI();
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    toggle(sessionId) {
        const index = this.favorites.indexOf(sessionId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(sessionId);
        }
        this.saveFavorites();
        this.updateUI(sessionId);
        this.updateCounter();

        // Event personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('favoritesChanged', {
            detail: { sessionId, isFavorite: this.isFavorite(sessionId) }
        }));
    }

    isFavorite(sessionId) {
        return this.favorites.includes(sessionId);
    }

    updateUI(sessionId) {
        const buttons = document.querySelectorAll(`[data-fav-session="${sessionId}"]`);
        buttons.forEach(btn => {
            const isFav = this.isFavorite(sessionId);
            btn.classList.toggle('active', isFav);
            btn.setAttribute('aria-pressed', isFav);
            btn.setAttribute('title', isFav ? 'Quitar de favoritos' : 'Añadir a favoritos');

            // Cambiar icono
            const icon = btn.querySelector('.fav-icon');
            if (icon) {
                icon.textContent = isFav ? '♥' : '♡';
            }
        });
    }

    updateCounter() {
        const counters = document.querySelectorAll('.favorites-count');
        counters.forEach(counter => {
            counter.textContent = this.favorites.length;
            counter.style.display = this.favorites.length > 0 ? 'inline' : 'none';
        });
    }

    getFavorites() {
        return [...this.favorites];
    }

    clearAll() {
        if (confirm('¿Estás seguro de que quieres eliminar todos tus favoritos?')) {
            this.favorites = [];
            this.saveFavorites();

            // Actualizar todas las sesiones
            document.querySelectorAll('[data-fav-session]').forEach(btn => {
                const sessionId = btn.getAttribute('data-fav-session');
                this.updateUI(sessionId);
            });

            this.updateCounter();
        }
    }

    initUI() {
        // Actualizar UI de todas las sesiones al cargar
        document.querySelectorAll('[data-fav-session]').forEach(btn => {
            const sessionId = btn.getAttribute('data-fav-session');
            this.updateUI(sessionId);
        });

        this.updateCounter();
    }
}

// ============================================
// 2. SISTEMA DE COMPARTIR
// ============================================
class ShareManager {
    constructor() {
        this.baseUrl = window.location.origin;
        this.supportsWebShare = 'share' in navigator;
    }

    async share(sessionData) {
        const shareData = {
            title: `🎧 ${sessionData.title}`,
            text: sessionData.description || 'Escucha esta sesión en Audio Sessions',
            url: `${this.baseUrl}/player.html?session=${sessionData.id}`
        };

        // Si el navegador soporta Web Share API, usarla
        if (this.supportsWebShare) {
            try {
                await navigator.share(shareData);
                this.trackShare(sessionData.id, 'web_share');
                return true;
            } catch (error) {
                // Usuario canceló o error
                if (error.name !== 'AbortError') {
                    console.log('Web Share no disponible, mostrando modal');
                    this.showShareModal(shareData, sessionData);
                }
                return false;
            }
        } else {
            // Fallback: mostrar modal con opciones
            this.showShareModal(shareData, sessionData);
            return true;
        }
    }

    showShareModal(shareData, sessionData) {
        // Crear o obtener modal
        let modal = document.getElementById('shareModal');
        if (!modal) {
            modal = this.createShareModal();
            document.body.appendChild(modal);
        }

        // Actualizar contenido
        const url = shareData.url;
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(shareData.title);
        const encodedText = encodeURIComponent(shareData.text);

        const shareOptions = `
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Compartir Sesión</h3>
                    <button class="share-modal-close" onclick="shareManager.closeShareModal()">×</button>
                </div>

                <div class="share-modal-body">
                    <div class="share-session-info">
                        <h4>${sessionData.title}</h4>
                        <p>${sessionData.description || ''}</p>
                    </div>

                    <div class="share-options">
                        <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}"
                           target="_blank"
                           class="share-option whatsapp"
                           onclick="shareManager.trackShare('${sessionData.id}', 'whatsapp')">
                            <span class="share-icon">📱</span>
                            <span>WhatsApp</span>
                        </a>

                        <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}"
                           target="_blank"
                           class="share-option telegram"
                           onclick="shareManager.trackShare('${sessionData.id}', 'telegram')">
                            <span class="share-icon">✈️</span>
                            <span>Telegram</span>
                        </a>

                        <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}"
                           target="_blank"
                           class="share-option twitter"
                           onclick="shareManager.trackShare('${sessionData.id}', 'twitter')">
                            <span class="share-icon">🐦</span>
                            <span>Twitter</span>
                        </a>

                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"
                           target="_blank"
                           class="share-option facebook"
                           onclick="shareManager.trackShare('${sessionData.id}', 'facebook')">
                            <span class="share-icon">📘</span>
                            <span>Facebook</span>
                        </a>

                        <a href="mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}"
                           class="share-option email"
                           onclick="shareManager.trackShare('${sessionData.id}', 'email')">
                            <span class="share-icon">📧</span>
                            <span>Email</span>
                        </a>

                        <button class="share-option copy" onclick="shareManager.copyLink('${url}', '${sessionData.id}')">
                            <span class="share-icon">🔗</span>
                            <span>Copiar enlace</span>
                        </button>
                    </div>

                    <div class="share-url">
                        <input type="text" value="${url}" readonly id="shareUrlInput">
                    </div>
                </div>
            </div>
        `;

        modal.innerHTML = shareOptions;
        modal.style.display = 'flex';
    }

    createShareModal() {
        const modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.className = 'share-modal-overlay';

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeShareModal();
            }
        });

        return modal;
    }

    closeShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async copyLink(url, sessionId) {
        try {
            await navigator.clipboard.writeText(url);

            // Feedback visual
            const btn = event.target.closest('.share-option');
            const originalText = btn.querySelector('span:last-child').textContent;
            btn.querySelector('span:last-child').textContent = '✓ Copiado!';
            btn.classList.add('copied');

            setTimeout(() => {
                btn.querySelector('span:last-child').textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);

            this.trackShare(sessionId, 'copy_link');
        } catch (error) {
            // Fallback para navegadores antiguos
            const input = document.getElementById('shareUrlInput');
            input.select();
            document.execCommand('copy');
            alert('Enlace copiado al portapapeles');
        }
    }

    trackShare(sessionId, method) {
        try {
            const shares = JSON.parse(localStorage.getItem('sessionShares') || '{}');
            if (!shares[sessionId]) {
                shares[sessionId] = {};
            }
            if (!shares[sessionId][method]) {
                shares[sessionId][method] = 0;
            }
            shares[sessionId][method]++;
            localStorage.setItem('sessionShares', JSON.stringify(shares));

            console.log(`📤 Shared ${sessionId} via ${method}`);
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    }
}

// ============================================
// 3. INICIALIZACIÓN GLOBAL
// ============================================
let favoritesManager;
let shareManager;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar managers
    favoritesManager = new FavoritesManager();
    shareManager = new ShareManager();

    console.log('✅ Features module loaded: Favorites & Sharing');
});

// Exponer globalmente para uso en HTML
window.favoritesManager = null;
window.shareManager = null;
window.addEventListener('DOMContentLoaded', () => {
    window.favoritesManager = favoritesManager;
    window.shareManager = shareManager;
});
