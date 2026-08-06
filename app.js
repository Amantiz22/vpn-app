// Initialize Telegram Web App safely
let tg = null;
try {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.expand(); 
        
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');

        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            userName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            if (user.photo_url) userAvatar.src = user.photo_url;
        }
        
        if (tg.setHeaderColor) tg.setHeaderColor('#0B0B0F');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0B0B0F');
    }
} catch (e) {
    console.log("Not in Telegram environment", e);
}

if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    document.getElementById('user-name').textContent = 'Гость';
    // Hide Telegram App and Show Guest App
    document.getElementById('app').style.display = 'none';
    document.getElementById('guest-app').style.display = 'block';
}

const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.section');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    });
});

// ==========================================
// API Logic
// ==========================================
const API_URL = "https://amantiz.duckdns.org:8443/api";
let initData = tg ? tg.initData : "";
const MAX_KEYS = 5;
let myKeys = [];

async function fetchKeys() {
    try {
        const response = await fetch(`${API_URL}/keys`, {
            headers: { 'Authorization': initData }
        });
        if (response.ok) {
            myKeys = await response.json();
            renderKeys();
        } else {
            console.error("Failed to load keys");
        }
    } catch (e) {
        console.error("API connection error", e);
    }
}

// ==========================================
// Render Keys
// ==========================================
function renderKeys() {
    const container = document.getElementById('keys-container');
    const countBadge = document.getElementById('keys-count');
    
    container.innerHTML = '';
    countBadge.textContent = `${myKeys.length} / ${MAX_KEYS}`;

    if (myKeys.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
                У вас пока нет ключей.<br>Перейдите во вкладку "Новый VPN", чтобы создать.
            </div>
        `;
        return;
    }

    myKeys.forEach(key => {
        const protoIcon = key.protocol === 'vless' ? '🍏 VLESS' : '🚀 HYSTERIA';
        const progressPercent = Math.min((key.trafficUsed / 50) * 100, 100); 

        const card = document.createElement('div');
        card.className = 'key-card';
        card.innerHTML = `
            <div class="key-header">
                <div class="key-title">
                    <span class="key-name">${key.name}</span>
                    <span class="key-proto">${protoIcon}</span>
                </div>
                <div class="key-actions">
                    <button class="icon-btn qr-trigger" data-link="${key.link}" data-name="${key.name}">📱</button>
                    <button class="icon-btn danger delete-trigger" data-id="${key.id}" data-email="${key.name}">🗑</button>
                </div>
            </div>
            <div class="traffic-info">
                <span>Использовано: ${key.trafficUsed} GB</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;

        container.appendChild(card);

        setTimeout(() => {
            card.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        }, 100);
    });

    attachKeyListeners();
}

// ==========================================
// Modal & QR Logic
// ==========================================
const modal = document.getElementById('qr-modal');
const closeBtn = document.getElementById('close-modal');
const qrBox = document.getElementById('qr-code-box');
const copyBtn = document.getElementById('btn-copy-link');
const modalKeyName = document.getElementById('modal-key-name');
let currentLink = '';

function openModal(link, name) {
    currentLink = link;
    modalKeyName.textContent = name;
    qrBox.innerHTML = ''; 
    
    new QRCode(qrBox, {
        text: link,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
    });

    modal.classList.add('active');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
}

function closeModal() {
    modal.classList.remove('active');
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentLink).then(() => {
        copyBtn.textContent = '✅ Скопировано!';
        copyBtn.style.background = 'var(--success)';
        copyBtn.style.color = '#000';
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => {
            copyBtn.textContent = 'Скопировать ссылку';
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    });
});

function attachKeyListeners() {
    document.querySelectorAll('.qr-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openModal(e.currentTarget.getAttribute('data-link'), e.currentTarget.getAttribute('data-name'));
        });
    });

    document.querySelectorAll('.delete-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const uuid = e.currentTarget.getAttribute('data-id');
            const email = e.currentTarget.getAttribute('data-email');
            
            const performDelete = async () => {
                try {
                    const res = await fetch(`${API_URL}/keys`, {
                        method: 'DELETE',
                        headers: { 'Authorization': initData, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: uuid, email: email })
                    });
                    if (res.ok) {
                        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                        fetchKeys(); // Refresh list
                    }
                } catch(err) {
                    console.error("Delete failed", err);
                }
            };

            if (tg && tg.showConfirm) {
                tg.showConfirm('Удалить этот ключ навсегда?', (confirmed) => {
                    if (confirmed) performDelete();
                });
            } else {
                if (confirm('Удалить этот ключ навсегда?')) performDelete();
            }
        });
    });
}

// ==========================================
// Create New VPN Logic
// ==========================================
document.getElementById('btn-create').addEventListener('click', async () => {
    const input = document.getElementById('device-name');
    let name = input.value.trim();
    
    if (!name) {
        if (tg && tg.showAlert) tg.showAlert('Введите имя устройства (например, iPhone)');
        else alert('Введите имя устройства');
        return;
    }

    if (myKeys.length >= MAX_KEYS) {
        if (tg && tg.showAlert) tg.showAlert(`Лимит ключей (${MAX_KEYS}). Удалите старые.`);
        else alert(`Лимит ключей (${MAX_KEYS}).`);
        return;
    }

    const proto = document.querySelector('input[name="protocol"]:checked').value;
    
    const btn = document.getElementById('btn-create');
    const originalText = btn.textContent;
    btn.textContent = 'Создаем ключ... ⏳';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    try {
        const res = await fetch(`${API_URL}/keys`, {
            method: 'POST',
            headers: { 'Authorization': initData, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, protocol: proto })
        });
        
        if (res.ok) {
            input.value = '';
            document.querySelector('[data-target="keys-section"]').click();
            await fetchKeys(); // Refresh keys list
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            const data = await res.json();
            if (tg && tg.showAlert) tg.showAlert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch(err) {
        console.error("Create failed", err);
        if (tg && tg.showAlert) tg.showAlert('Ошибка соединения с сервером');
    } finally {
        btn.textContent = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
});

// ==========================================
// TG Proxy Logic
// ==========================================
document.getElementById('btn-proxy').addEventListener('click', () => {
    const proxyLink = "https://t.me/proxy?server=amantiz.spacecloud.ru&port=1443&secret=ddff5b08213f2d82c606ae9040e1ba5134";
    if (tg && tg.initData) tg.openTelegramLink(proxyLink);
    else window.open(proxyLink, '_blank');
});

// Initial load
if (initData) {
    fetchKeys();
}

// ==========================================
// Guest Mode Logic
// ==========================================
const guestCreateBtn = document.getElementById('btn-guest-create');
const guestCopyBtn = document.getElementById('btn-guest-copy');
let guestLink = '';

if (guestCreateBtn) {
    guestCreateBtn.addEventListener('click', async () => {
        const name = document.getElementById('guest-name').value.trim();
        const password = document.getElementById('guest-password').value.trim();
        const protocol = document.querySelector('input[name="guest-protocol"]:checked').value;
        
        if (!name || !password) {
            alert('Пожалуйста, введите имя и секретный код!');
            return;
        }
        
        const originalText = guestCreateBtn.textContent;
        guestCreateBtn.textContent = 'Генерация... ⏳';
        guestCreateBtn.style.opacity = '0.7';
        guestCreateBtn.style.pointerEvents = 'none';
        
        try {
            const res = await fetch(`${API_URL}/guest_key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, protocol })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                guestLink = data.link;
                document.getElementById('guest-result').style.display = 'block';
                
                const qrBox = document.getElementById('guest-qr-box');
                qrBox.innerHTML = '';
                new QRCode(qrBox, {
                    text: guestLink,
                    width: 200, height: 200,
                    colorDark : "#000000", colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.M
                });
                guestCreateBtn.style.display = 'none';
                document.getElementById('guest-name').disabled = true;
                document.getElementById('guest-password').disabled = true;
            } else {
                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch(err) {
            console.error(err);
            alert('Ошибка соединения с сервером');
        } finally {
            guestCreateBtn.textContent = originalText;
            guestCreateBtn.style.opacity = '1';
            guestCreateBtn.style.pointerEvents = 'auto';
        }
    });
}

if (guestCopyBtn) {
    guestCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(guestLink).then(() => {
            guestCopyBtn.textContent = '✅ Скопировано!';
            guestCopyBtn.style.background = 'var(--success)';
            guestCopyBtn.style.color = '#000';
            setTimeout(() => {
                guestCopyBtn.textContent = 'Скопировать ссылку';
                guestCopyBtn.style.background = '';
                guestCopyBtn.style.color = '';
            }, 2000);
        });
    });
}
