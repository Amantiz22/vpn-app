// Initialize Telegram Web App safely
let tg = null;
try {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.expand(); // Expand to full height
        
        // Setup User Profile from Telegram
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');

        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            userName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            if (user.photo_url) {
                userAvatar.src = user.photo_url;
            }
        }
        
        // Set Theme color for Telegram Header
        if (tg.setHeaderColor) tg.setHeaderColor('#0B0B0F');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0B0B0F');
    }
} catch (e) {
    console.log("Not in Telegram environment", e);
}

// Fallback for browser testing
if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    document.getElementById('user-name').textContent = 'Amantiz (Test)';
}

// ==========================================
// Tab Navigation Logic
// ==========================================
const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.section');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and sections
        tabBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding section
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        
        // Haptic feedback
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    });
});

// ==========================================
// Mock Data (For demonstration purposes)
// In production, this would be fetched from the bot
// ==========================================
const MAX_KEYS = 5;
const myKeys = [
    {
        id: 'uuid-1',
        name: 'iPhone-Amantiz',
        protocol: 'vless',
        trafficUsed: 4.2, // GB
        link: 'vless://mock-uuid@amantiz.duckdns.org:443?encryption=none&security=reality&type=tcp#AmantizVPN-iPhone'
    },
    {
        id: 'uuid-2',
        name: 'PC-Home',
        protocol: 'hysteria',
        trafficUsed: 12.8, // GB
        link: 'hysteria2://mock-pass@amantiz.duckdns.org:39381?alpn=h3&fp=chrome&obfs=salamander&obfs-password=0gc5a5delxov7xuf#AmantizHysteria-PC'
    }
];

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
        // Max limit purely for visual progress bar (e.g., 50GB)
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
                    <button class="icon-btn danger delete-trigger" data-id="${key.id}">🗑</button>
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

        // Animate progress bar after short delay
        setTimeout(() => {
            card.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        }, 100);
    });

    // Attach event listeners for dynamic buttons
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
    qrBox.innerHTML = ''; // Clear previous
    
    // Generate QR
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
            const link = e.currentTarget.getAttribute('data-link');
            const name = e.currentTarget.getAttribute('data-name');
            openModal(link, name);
        });
    });

    document.querySelectorAll('.delete-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Confirm dialog via Telegram
            if (tg && tg.showConfirm) {
                tg.showConfirm('Вы уверены, что хотите удалить этот ключ? Это действие нельзя отменить.', (confirmed) => {
                    if (confirmed) {
                        const id = e.currentTarget.getAttribute('data-id');
                        const index = myKeys.findIndex(k => k.id === id);
                        if (index > -1) myKeys.splice(index, 1);
                        renderKeys();
                        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                    }
                });
            } else {
                if (confirm('Вы уверены, что хотите удалить этот ключ?')) {
                    const id = e.currentTarget.getAttribute('data-id');
                    const index = myKeys.findIndex(k => k.id === id);
                    if (index > -1) myKeys.splice(index, 1);
                    renderKeys();
                }
            }
        });
    });
}

// ==========================================
// Create New VPN Logic
// ==========================================
document.getElementById('btn-create').addEventListener('click', () => {
    const input = document.getElementById('device-name');
    let name = input.value.trim();
    
    if (!name) {
        if (tg && tg.showAlert) tg.showAlert('Пожалуйста, введите имя устройства (например, iPhone)');
        else alert('Пожалуйста, введите имя устройства (например, iPhone)');
        return;
    }

    if (myKeys.length >= MAX_KEYS) {
        if (tg && tg.showAlert) tg.showAlert(`Достигнут лимит ключей (${MAX_KEYS}). Удалите старые ключи.`);
        else alert(`Достигнут лимит ключей (${MAX_KEYS}). Удалите старые ключи.`);
        return;
    }

    const proto = document.querySelector('input[name="protocol"]:checked').value;
    
    // Disable button to prevent spam
    const btn = document.getElementById('btn-create');
    const originalText = btn.textContent;
    btn.textContent = 'Генерация... ⏳';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    // Simulate API delay, then switch to WebApp communication
    setTimeout(() => {
        const payload = {
            action: 'create',
            name: name,
            protocol: proto
        };
        
        if (tg && tg.initData) {
            tg.sendData(JSON.stringify(payload));
            tg.close();
        } else {
            // Demo fallback
            myKeys.push({
                id: 'uuid-demo',
                name: name,
                protocol: proto,
                trafficUsed: 0,
                link: 'demo://mock-link-for-testing'
            });
            input.value = '';
            
            // Switch back to keys tab
            document.querySelector('[data-target="keys-section"]').click();
            renderKeys();
            
            btn.textContent = originalText;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    }, 1000);
});

// ==========================================
// TG Proxy Logic
// ==========================================
document.getElementById('btn-proxy').addEventListener('click', () => {
    const proxyLink = "https://t.me/proxy?server=amantiz.spacecloud.ru&port=1443&secret=ddff5b08213f2d82c606ae9040e1ba5134";
    
    if (tg && tg.initData) {
        tg.openTelegramLink(proxyLink);
    } else {
        window.open(proxyLink, '_blank');
    }
});

// Initial render
renderKeys();
