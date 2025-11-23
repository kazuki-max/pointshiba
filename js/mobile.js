// ========================================
// PointMax Mobile - Netflix風UIアプリケーション
// ========================================

// グローバル状態
const MobileApp = {
    currentUser: null,
    cases: [],
    pointHistory: [],
    exchangeHistory: [],
    achievements: [],
    isLoggedIn: false,
    currentScreen: 'homeScreen',
    selectedExchangeType: '',
    selectedExchangeRate: 1
};

// ランク設定
const RANK_CONFIG = {
    thresholds: {
        'ブロンズ': 0,
        'シルバー': 1000,
        'ゴールド': 5000,
        'プラチナ': 15000,
        'ダイヤモンド': 50000
    },
    multipliers: {
        'ブロンズ': 1.0,
        'シルバー': 1.1,
        'ゴールド': 1.2,
        'プラチナ': 1.3,
        'ダイヤモンド': 1.5
    }
};

// 実績定義
const ACHIEVEMENTS = [
    { name: '初めての一歩', type: 'ポイント獲得', threshold: 1, bonus: 100, icon: 'fa-star' },
    { name: 'コツコツ貯蓄家', type: 'ポイント獲得', threshold: 1000, bonus: 200, icon: 'fa-coins' },
    { name: 'ポイントマスター', type: 'ポイント獲得', threshold: 10000, bonus: 1000, icon: 'fa-trophy' },
    { name: '毎日ログイン', type: 'ログイン', threshold: 7, bonus: 300, icon: 'fa-calendar-check' },
    { name: '習慣化成功', type: 'ログイン', threshold: 30, bonus: 1500, icon: 'fa-fire' },
    { name: '初めての交換', type: '交換', threshold: 1, bonus: 150, icon: 'fa-exchange-alt' },
    { name: '友達の輪', type: '紹介', threshold: 5, bonus: 500, icon: 'fa-users' },
    { name: 'インフルエンサー', type: '紹介', threshold: 20, bonus: 3000, icon: 'fa-bullhorn' }
];

// ========================================
// ユーティリティ関数
// ========================================

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今日';
    if (days === 1) return '昨日';
    if (days < 7) return `${days}日前`;
    
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle text-2xl text-green-400';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle text-2xl text-red-400';
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ログイン誘導モーダルを表示
function showLoginPrompt() {
    const confirmed = confirm(
        '案件の詳細を見るにはログインが必要です。\n\n' +
        'まだアカウントをお持ちでない方は新規登録をお願いします。\n\n' +
        '「OK」でログイン画面へ、「キャンセル」で新規登録画面へ移動します。'
    );
    
    if (confirmed) {
        showScreen('loginScreen');
    } else {
        showScreen('registerScreen');
    }
}

function calculateRank(rankPoints) {
    if (rankPoints >= RANK_CONFIG.thresholds['ダイヤモンド']) return 'ダイヤモンド';
    if (rankPoints >= RANK_CONFIG.thresholds['プラチナ']) return 'プラチナ';
    if (rankPoints >= RANK_CONFIG.thresholds['ゴールド']) return 'ゴールド';
    if (rankPoints >= RANK_CONFIG.thresholds['シルバー']) return 'シルバー';
    return 'ブロンズ';
}

// ========================================
// 画像アップロード関数
// ========================================

// 画像アップロード処理
window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // ファイルサイズチェック（50MB = 50 * 1024 * 1024 bytes）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        showImageUploadError(`ファイルサイズが大きすぎます。最大50MBまでです。（現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`);
        event.target.value = ''; // 選択をクリア
        return;
    }
    
    // ファイル形式チェック
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showImageUploadError('対応していない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。');
        event.target.value = '';
        return;
    }
    
    // エラーメッセージをクリア
    hideImageUploadError();
    
    // FileReaderで画像を読み込み
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // 隠しフィールドに画像データを保存
        document.getElementById('adminCaseImage').value = imageData;
        
        // プレビュー表示
        document.getElementById('imagePreview').src = imageData;
        document.getElementById('imagePreviewContainer').classList.remove('hidden');
        
        // ファイル情報表示
        document.getElementById('imageFileName').textContent = `ファイル名: ${file.name}`;
        document.getElementById('imageFileSize').textContent = `サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
        
        // ボタンテキスト変更
        document.getElementById('uploadButtonText').textContent = '画像を変更';
        
        showToast('画像をアップロードしました', 'success');
    };
    
    reader.onerror = function() {
        showImageUploadError('画像の読み込みに失敗しました。');
        event.target.value = '';
    };
    
    // Base64形式で読み込み
    reader.readAsDataURL(file);
};

// 画像アップロードをクリア
window.clearImageUpload = function() {
    document.getElementById('adminCaseImageFile').value = '';
    document.getElementById('adminCaseImage').value = '';
    document.getElementById('imagePreviewContainer').classList.add('hidden');
    document.getElementById('uploadButtonText').textContent = '画像を選択';
    hideImageUploadError();
    showToast('画像をクリアしました', 'success');
};

// エラーメッセージ表示
function showImageUploadError(message) {
    const errorElement = document.getElementById('imageUploadError');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// エラーメッセージ非表示
function hideImageUploadError() {
    const errorElement = document.getElementById('imageUploadError');
    errorElement.classList.add('hidden');
}

// ========================================
// API関数
// ========================================

async function fetchCases() {
    try {
        const response = await fetch('tables/cases?limit=100');
        const data = await response.json();
        MobileApp.cases = data.data;
        return data.data;
    } catch (error) {
        console.error('案件の取得に失敗:', error);
        return [];
    }
}

async function getOrCreateUser() {
    try {
        // デモ用: ランダムユーザーを作成
        const username = `モバイルユーザー${Math.floor(Math.random() * 10000)}`;
        const email = `mobile${Math.floor(Math.random() * 10000)}@pointmax.jp`;
        
        const response = await fetch(`tables/users?search=${email}`);
        const data = await response.json();
        
        if (data.data.length > 0) {
            return data.data[0];
        }
        
        const newUser = {
            username: username,
            email: email,
            total_points: 0,
            available_points: 0,
            rank: 'ブロンズ',
            rank_points: 0,
            consecutive_login_days: 1,
            last_login_date: new Date().toISOString().split('T')[0],
            total_referrals: 0,
            profile_image: ''
        };
        
        const createResponse = await fetch('tables/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        
        return await createResponse.json();
    } catch (error) {
        console.error('ユーザー取得失敗:', error);
        return null;
    }
}

async function addPointHistory(userId, points, type, description, caseId = null) {
    try {
        const historyEntry = {
            user_id: userId,
            case_id: caseId,
            points: points,
            type: type,
            description: description,
            status: '承認済み'
        };
        
        const response = await fetch('tables/point_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyEntry)
        });
        
        return await response.json();
    } catch (error) {
        console.error('ポイント履歴追加失敗:', error);
        return null;
    }
}

async function fetchPointHistory(userId) {
    try {
        const response = await fetch(`tables/point_history?limit=100`);
        const data = await response.json();
        return data.data.filter(h => h.user_id === userId);
    } catch (error) {
        console.error('履歴取得失敗:', error);
        return [];
    }
}

async function updateUser(userId, updates) {
    try {
        const response = await fetch(`tables/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        return await response.json();
    } catch (error) {
        console.error('ユーザー更新失敗:', error);
        return null;
    }
}

async function createExchange(userId, exchangeType, pointsUsed, exchangeValue) {
    try {
        const exchangeEntry = {
            user_id: userId,
            exchange_type: exchangeType,
            points_used: pointsUsed,
            exchange_value: exchangeValue,
            status: '完了',
            exchange_code: generateExchangeCode()
        };
        
        const response = await fetch('tables/exchange_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exchangeEntry)
        });
        
        return await response.json();
    } catch (error) {
        console.error('交換失敗:', error);
        return null;
    }
}

function generateExchangeCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i < 11) code += '-';
    }
    return code;
}

async function checkAchievements(userId) {
    const unlocked = [];
    
    for (const achievement of ACHIEVEMENTS) {
        let currentValue = 0;
        
        switch (achievement.type) {
            case 'ポイント獲得':
                currentValue = MobileApp.currentUser.total_points;
                break;
            case 'ログイン':
                currentValue = MobileApp.currentUser.consecutive_login_days;
                break;
            case '交換':
                currentValue = MobileApp.exchangeHistory.length;
                break;
            case '紹介':
                currentValue = MobileApp.currentUser.total_referrals;
                break;
        }
        
        if (currentValue >= achievement.threshold) {
            const response = await fetch(`tables/achievements?limit=100`);
            const data = await response.json();
            const existing = data.data.find(a => 
                a.user_id === userId && a.achievement_name === achievement.name
            );
            
            if (!existing) {
                const achievementEntry = {
                    user_id: userId,
                    achievement_name: achievement.name,
                    achievement_type: achievement.type,
                    description: `${achievement.name}を達成しました`,
                    icon: achievement.icon,
                    bonus_points: achievement.bonus,
                    is_unlocked: true
                };
                
                await fetch('tables/achievements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(achievementEntry)
                });
                
                await addPointHistory(userId, achievement.bonus, 'ボーナス', `実績解除: ${achievement.name}`);
                await updateUser(userId, {
                    total_points: MobileApp.currentUser.total_points + achievement.bonus,
                    available_points: MobileApp.currentUser.available_points + achievement.bonus,
                    rank_points: MobileApp.currentUser.rank_points + achievement.bonus
                });
                
                unlocked.push(achievement);
            }
        }
    }
    
    return unlocked;
}

// ========================================
// UI更新関数
// ========================================

function updateUserDisplay() {
    if (!MobileApp.currentUser) return;
    
    document.getElementById('mobilePoints').textContent = formatNumber(MobileApp.currentUser.available_points);
    document.getElementById('mobilePointsYen').textContent = formatNumber(MobileApp.currentUser.available_points);
    
    const rank = calculateRank(MobileApp.currentUser.rank_points);
    const rankBadge = document.getElementById('mobileRank');
    rankBadge.className = `rank-badge-mobile rank-${rank.toLowerCase()}`;
    rankBadge.innerHTML = `<i class="fas fa-medal"></i> ${rank}`;
    
    // マイページの統計
    document.getElementById('statTotalPoints').textContent = formatNumber(MobileApp.currentUser.total_points);
    document.getElementById('statDays').textContent = MobileApp.currentUser.consecutive_login_days;
    
    document.getElementById('profileName').textContent = MobileApp.currentUser.username;
    document.getElementById('profileEmail').textContent = MobileApp.currentUser.email;
    
    // プロフィールアイコンを更新 ★UPDATED
    const profileIconContainer = document.querySelector('#myPageScreen .w-20.h-20');
    if (profileIconContainer) {
        const profileImage = MobileApp.currentUser.profile_image || 'fa-user';
        if (profileImage.startsWith('data:')) {
            // アップロードされた画像
            profileIconContainer.innerHTML = `<img src="${profileImage}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
        } else {
            // FontAwesomeアイコン
            profileIconContainer.innerHTML = `<i class="fas ${profileImage} text-3xl"></i>`;
        }
    }
}

function renderCaseCard(caseItem, isLarge = false) {
    const width = isLarge ? 280 : 160;
    const height = isLarge ? 160 : 220;
    
    const card = document.createElement('div');
    card.className = `content-card scroll-item cursor-pointer`;
    card.style.width = `${width}px`;
    card.style.minHeight = `${height}px`;
    card.onclick = () => openCaseModal(caseItem);
    
    const badges = [];
    if (caseItem.is_new) badges.push('<div class="badge new">NEW</div>');
    if (caseItem.is_featured) badges.push('<div class="badge">おすすめ</div>');
    
    // ボーナス率計算 ★UPDATED
    let bonusRate = 0;
    let basePoints = caseItem.points;
    let displayPoints = basePoints;
    let pointsHTML = '';
    
    if (MobileApp.isLoggedIn && MobileApp.currentUser) {
        // プロフィール + 紹介ボーナス ★UPDATED
        const profileBonus = MobileApp.currentUser.profile_bonus_rate || 0;
        const referralBonus = MobileApp.currentUser.referral_bonus_rate || 0;
        bonusRate = profileBonus + referralBonus;
        
        if (bonusRate > 0) {
            displayPoints = Math.floor(basePoints * (1 + bonusRate / 100));
            pointsHTML = `
                <div class="flex items-center gap-2">
                    <p class="text-gray-400 font-bold text-sm line-through">${formatNumber(basePoints)}pt</p>
                    <span class="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">+${bonusRate}%</span>
                </div>
                <p class="text-purple-400 font-black text-lg">${formatNumber(displayPoints)}pt</p>
            `;
        } else {
            pointsHTML = `<p class="text-purple-400 font-black text-lg">${formatNumber(basePoints)}pt</p>`;
        }
    } else {
        pointsHTML = `<p class="text-purple-400 font-black text-lg">${formatNumber(basePoints)}pt</p>`;
    }
    
    card.innerHTML = `
        ${badges.join('')}
        <div class="relative" style="height: ${isLarge ? 100 : 120}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <img src="${caseItem.image_url}" alt="${caseItem.title}" class="w-full h-full object-contain p-4">
        </div>
        <div class="p-3">
            <p class="font-bold text-sm mb-1 line-clamp-2">${caseItem.title}</p>
            ${pointsHTML}
            <p class="text-xs text-gray-400">${caseItem.estimated_time}</p>
        </div>
    `;
    
    return card;
}

function renderCases() {
    // 高額案件
    const highValueCases = MobileApp.cases
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);
    const highValueContainer = document.getElementById('highValueCases');
    highValueContainer.innerHTML = '';
    highValueCases.forEach(c => {
        highValueContainer.appendChild(renderCaseCard(c, true));
    });
    
    // 新着案件
    const newCases = MobileApp.cases.filter(c => c.is_new).slice(0, 10);
    const newContainer = document.getElementById('newCases');
    newContainer.innerHTML = '';
    newCases.forEach(c => {
        newContainer.appendChild(renderCaseCard(c));
    });
    
    // おすすめ
    const featuredCases = MobileApp.cases.filter(c => c.is_featured).slice(0, 10);
    const featuredContainer = document.getElementById('featuredCases');
    featuredContainer.innerHTML = '';
    featuredCases.forEach(c => {
        featuredContainer.appendChild(renderCaseCard(c));
    });
    
    // カテゴリーフィルター初期表示
    filterCasesByCategory('全て');
}

function filterCasesByCategory(category) {
    const filtered = category === '全て' 
        ? MobileApp.cases 
        : MobileApp.cases.filter(c => c.category === category);
    
    const container = document.getElementById('categoryFilteredCases');
    container.innerHTML = '';
    filtered.slice(0, 10).forEach(c => {
        container.appendChild(renderCaseCard(c));
    });
}

function openCaseModal(caseItem) {
    // ログインチェック：未ログインの場合は登録を誘導
    if (!MobileApp.isLoggedIn) {
        showLoginPrompt();
        return;
    }
    
    const modal = document.getElementById('caseModal');
    const title = document.getElementById('modalCaseTitle');
    const content = document.getElementById('modalCaseContent');
    
    title.textContent = caseItem.title;
    
    const multiplier = MobileApp.isLoggedIn 
        ? RANK_CONFIG.multipliers[MobileApp.currentUser.rank] || 1.0 
        : 1.0;
    
    // ボーナス率を含めたポイント計算 ★UPDATED
    const profileBonus = MobileApp.isLoggedIn && MobileApp.currentUser 
        ? (MobileApp.currentUser.profile_bonus_rate || 0) 
        : 0;
    const referralBonus = MobileApp.isLoggedIn && MobileApp.currentUser 
        ? (MobileApp.currentUser.referral_bonus_rate || 0) 
        : 0;
    const bonusRate = profileBonus + referralBonus;
    const basePoints = caseItem.points;
    const bonusMultiplier = 1 + (bonusRate / 100);
    const earnedPoints = Math.floor(basePoints * multiplier * bonusMultiplier);
    
    let pointsDisplayHTML = '';
    if (bonusRate > 0) {
        const beforeBonus = Math.floor(basePoints * multiplier);
        let bonusText = [];
        if (profileBonus > 0) bonusText.push(`プロフィール+${profileBonus}%`);
        if (referralBonus > 0) bonusText.push(`紹介+${referralBonus}%`);
        
        pointsDisplayHTML = `
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <p class="text-2xl font-bold text-gray-400 line-through">${formatNumber(beforeBonus)}pt</p>
                    <span class="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">+${bonusRate}%</span>
                </div>
                <p class="text-4xl font-black text-purple-400">${formatNumber(earnedPoints)}pt</p>
                <p class="text-xs text-green-400 mt-1">${bonusText.join('、')}適用済み</p>
                ${multiplier > 1.0 ? `<p class="text-xs text-green-400">ランクボーナス ${multiplier}倍適用</p>` : ''}
            </div>
        `;
    } else {
        const hints = [];
        if (!profileBonus) hints.push('プロフィール完成で+10%');
        if (!referralBonus) hints.push('友達紹介で最大+10%');
        
        pointsDisplayHTML = `
            <div>
                <p class="text-4xl font-black text-purple-400">${formatNumber(earnedPoints)}pt</p>
                ${multiplier > 1.0 ? `<p class="text-xs text-green-400">ランクボーナス ${multiplier}倍適用</p>` : ''}
                ${MobileApp.isLoggedIn && hints.length > 0 ? `<p class="text-xs text-yellow-400 mt-1">💡 ${hints.join('、')}獲得可能</p>` : ''}
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="relative mb-6 rounded-xl overflow-hidden" style="height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <img src="${caseItem.image_url}" alt="${caseItem.title}" class="w-full h-full object-contain p-6">
        </div>
        
        <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
                ${pointsDisplayHTML}
                <div class="text-right text-sm">
                    <p class="text-gray-400">所要時間</p>
                    <p class="font-bold">${caseItem.estimated_time}</p>
                </div>
            </div>
            
            <div class="flex gap-2 mb-4">
                <span class="category-chip">${caseItem.category}</span>
                <span class="category-chip">${caseItem.difficulty}</span>
            </div>
            
            <p class="text-gray-300 leading-relaxed mb-4">${caseItem.description}</p>
            
            <div class="stat-card p-4 mb-4">
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">利用者数</span>
                    <span class="font-bold">${formatNumber(caseItem.completion_count)}人</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-3 mb-4">
            <button onclick="toggleFavorite('${caseItem.id}')" class="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-xl">
                <i class="fas fa-heart text-xl" id="favoriteIcon-${caseItem.id}"></i>
            </button>
            <button onclick="participateCase('${caseItem.id}')" class="flex-1 bg-purple-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                <i class="fas fa-play"></i>
                参加してポイントGET
            </button>
        </div>
        
        ${generateReviewSection(caseItem.id)}
    `;
    
    modal.classList.add('active');
    
    // お気に入り状態を確認
    if (MobileApp.currentUser) {
        checkFavoriteStatus(caseItem.id);
    }
    
    // レビューを読み込み
    loadReviewsForCase(caseItem.id);
}

// お気に入り状態を確認してアイコンを更新
async function checkFavoriteStatus(caseId) {
    if (!MobileApp.currentUser) return;
    
    const isFav = await FavoriteSystem.isFavorite(MobileApp.currentUser.id, caseId);
    const icon = document.getElementById(`favoriteIcon-${caseId}`);
    
    if (icon) {
        if (isFav) {
            icon.classList.add('text-red-500');
            icon.classList.remove('text-gray-400');
        } else {
            icon.classList.add('text-gray-400');
            icon.classList.remove('text-red-500');
        }
    }
}

function closeCaseModal() {
    document.getElementById('caseModal').classList.remove('active');
}

async function participateCase(caseId) {
    if (!MobileApp.isLoggedIn) {
        showToast('ログインしてください', 'error');
        await initializeApp();
        return;
    }
    
    const caseItem = MobileApp.cases.find(c => c.id === caseId);
    if (!caseItem) return;
    
    // ランクボーナス
    const rankMultiplier = RANK_CONFIG.multipliers[MobileApp.currentUser.rank] || 1.0;
    
    // プロフィール + 紹介ボーナス ★UPDATED
    const profileBonusRate = MobileApp.currentUser.profile_bonus_rate || 0;
    const referralBonusRate = MobileApp.currentUser.referral_bonus_rate || 0;
    const totalBonusRate = profileBonusRate + referralBonusRate;
    const bonusMultiplier = 1 + (totalBonusRate / 100);
    
    // 最終獲得ポイント = 基本ポイント × ランクボーナス × (プロフィール + 紹介ボーナス)
    const earnedPoints = Math.floor(caseItem.points * rankMultiplier * bonusMultiplier);
    
    await addPointHistory(MobileApp.currentUser.id, earnedPoints, '獲得', caseItem.title, caseId);
    
    const updatedUser = await updateUser(MobileApp.currentUser.id, {
        total_points: MobileApp.currentUser.total_points + earnedPoints,
        available_points: MobileApp.currentUser.available_points + earnedPoints,
        rank_points: MobileApp.currentUser.rank_points + earnedPoints
    });
    
    if (updatedUser) {
        MobileApp.currentUser = updatedUser;
        updateUserDisplay();
        
        const achievements = await checkAchievements(MobileApp.currentUser.id);
        if (achievements.length > 0) {
            achievements.forEach(ach => {
                setTimeout(() => {
                    showToast(`実績解除: ${ach.name} (+${ach.bonus}pt)`, 'success');
                }, 500);
            });
        }
        
        let message = `${formatNumber(earnedPoints)}pt 獲得！`;
        const bonuses = [];
        if (rankMultiplier > 1.0) bonuses.push(`ランク${rankMultiplier}倍`);
        if (profileBonusRate > 0) bonuses.push(`プロフィール+${profileBonusRate}%`);
        if (referralBonusRate > 0) bonuses.push(`紹介+${referralBonusRate}%`); // ★NEW
        if (bonuses.length > 0) {
            message += ` (${bonuses.join(', ')})`;
        }
        showToast(message, 'success');
        
        closeCaseModal();
        await loadPointHistory();
    }
}

function renderHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    
    if (MobileApp.pointHistory.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">履歴がありません</p>';
        return;
    }
    
    const sorted = MobileApp.pointHistory.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 50);
    
    sorted.forEach(item => {
        const typeIcons = {
            '獲得': 'fa-arrow-up',
            '交換': 'fa-arrow-down',
            'ボーナス': 'fa-gift',
            'デイリー': 'fa-calendar-check'
        };
        
        const typeColors = {
            '獲得': 'text-green-400',
            '交換': 'text-red-400',
            'ボーナス': 'text-yellow-400',
            'デイリー': 'text-purple-400'
        };
        
        const sign = item.type === '交換' ? '-' : '+';
        
        const historyItem = document.createElement('div');
        historyItem.className = 'stat-card p-4';
        historyItem.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <i class="fas ${typeIcons[item.type]} ${typeColors[item.type]}"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold text-sm">${item.description}</p>
                        <p class="text-xs text-gray-400">${formatDate(item.created_at)}</p>
                    </div>
                </div>
                <p class="text-lg font-black ${typeColors[item.type]}">${sign}${formatNumber(item.points)}</p>
            </div>
        `;
        container.appendChild(historyItem);
    });
}

async function loadPointHistory() {
    if (!MobileApp.currentUser) return;
    
    const history = await fetchPointHistory(MobileApp.currentUser.id);
    MobileApp.pointHistory = history;
    
    // 案件数を更新
    const completedCases = history.filter(h => h.type === '獲得').length;
    document.getElementById('statCases').textContent = completedCases;
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    container.innerHTML = '';
    
    ACHIEVEMENTS.forEach(achievement => {
        const isUnlocked = MobileApp.achievements.some(a => a.achievement_name === achievement.name);
        
        const card = document.createElement('div');
        card.className = `stat-card p-4 text-center ${isUnlocked ? 'border-2 border-purple-500' : 'opacity-50'}`;
        
        card.innerHTML = `
            <div class="w-16 h-16 ${isUnlocked ? 'bg-purple-900/50' : 'bg-gray-800'} rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="fas ${achievement.icon} text-3xl ${isUnlocked ? 'text-purple-400' : 'text-gray-600'}"></i>
            </div>
            <p class="font-bold text-sm mb-1">${achievement.name}</p>
            <p class="text-xs text-gray-400 mb-2">${achievement.type}</p>
            <p class="text-lg font-black ${isUnlocked ? 'text-purple-400' : 'text-gray-500'}">+${formatNumber(achievement.bonus)}pt</p>
            ${isUnlocked ? '<p class="text-xs text-green-400 mt-2"><i class="fas fa-check-circle"></i> 達成</p>' : ''}
        `;
        
        container.appendChild(card);
    });
}

async function loadAchievements() {
    if (!MobileApp.currentUser) return;
    
    const response = await fetch(`tables/achievements?limit=100`);
    const data = await response.json();
    MobileApp.achievements = data.data.filter(a => a.user_id === MobileApp.currentUser.id);
}

function initializeCharts() {
    // ポイント推移チャート
    if (MobileApp.pointHistory.length > 0) {
        const ctx = document.getElementById('mobilePointsChart');
        if (ctx) {
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return date.toISOString().split('T')[0];
            });
            
            const pointsByDay = last30Days.map(date => {
                const dayHistory = MobileApp.pointHistory.filter(h => 
                    h.created_at && h.created_at.startsWith(date) && h.type !== '交換'
                );
                return dayHistory.reduce((sum, h) => sum + h.points, 0);
            });
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last30Days.map(d => new Date(d).getDate()),
                    datasets: [{
                        label: 'ポイント',
                        data: pointsByDay,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: { color: '#808080' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: {
                            ticks: { color: '#808080' },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }
    
    // カテゴリー別チャート
    const categoryCtx = document.getElementById('mobileCategoryChart');
    if (categoryCtx && MobileApp.cases.length > 0) {
        const categories = [...new Set(MobileApp.cases.map(c => c.category))];
        const categoryPoints = categories.map(cat => {
            const catCases = MobileApp.cases.filter(c => c.category === cat);
            return catCases.reduce((sum, c) => sum + c.points, 0);
        });
        
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryPoints,
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#00f2fe', '#43e97b', '#fa709a', '#fee140'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#fff', font: { size: 10 } }
                    }
                }
            }
        });
    }
}

// ========================================
// 画面遷移
// ========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-screen') === screenId) {
            btn.classList.add('active');
        }
    });
    
    MobileApp.currentScreen = screenId;
    
    // 画面ごとの初期化
    if (screenId === 'historyScreen') {
        renderHistory();
    } else if (screenId === 'achievementsScreen') {
        renderAchievements();
    } else if (screenId === 'statsScreen') {
        setTimeout(initializeCharts, 100);
    } else if (screenId === 'searchScreen') {
        // 検索画面は特に初期化不要
    } else if (screenId === 'favoritesScreen') {
        loadFavoritesScreen();
    } else if (screenId === 'rankingScreen') {
        loadRankingScreen('all');
    } else if (screenId === 'referralScreen') {
        loadReferralScreen();
    } else if (screenId === 'gachaScreen') {
        loadGachaScreen();
    } else if (screenId === 'couponScreen') {
        // クーポン画面は特に初期化不要
    } else if (screenId === 'adminScreen') {
        loadAdminCasesList();
    } else if (screenId === 'notificationsScreen') {
        loadNotificationsScreen();
    } else if (screenId === 'basicProfileEditScreen') {
        loadBasicProfileEditForm();
    } else if (screenId === 'emailVerificationScreen') {
        loadEmailVerificationScreen();
    } else if (screenId === 'phoneVerificationScreen') {
        loadPhoneVerificationScreen();
    } else if (screenId === 'profileEditScreen') {
        loadProfileEditForm();
    } else if (screenId === 'myPageScreen') {
        updateBonusStatus();
        updateEmailVerificationBadge();
        updatePhoneVerificationBadge();
    }
}

// ========================================
// 交換機能
// ========================================

function openExchangeModal() {
    if (!MobileApp.isLoggedIn) {
        showToast('ログインしてください', 'error');
        initializeApp();
        return;
    }
    document.getElementById('exchangeModal').classList.add('active');
    document.getElementById('exchangeForm').classList.add('hidden');
}

function closeExchangeModal() {
    document.getElementById('exchangeModal').classList.remove('active');
}

function selectExchangeType(type, rate) {
    MobileApp.selectedExchangeType = type;
    MobileApp.selectedExchangeRate = rate;
    
    document.getElementById('selectedExchangeType').textContent = type;
    document.getElementById('exchangeForm').classList.remove('hidden');
}

function updateMobileExchangeValue() {
    const amount = parseInt(document.getElementById('mobileExchangeAmount').value) || 0;
    const value = Math.floor(amount * MobileApp.selectedExchangeRate);
    document.getElementById('mobileExchangeValue').textContent = formatNumber(value);
}

async function executeMobileExchange() {
    const amount = parseInt(document.getElementById('mobileExchangeAmount').value);
    
    if (!amount || amount < 100) {
        showToast('最低100ptから交換できます', 'error');
        return;
    }
    
    if (amount > MobileApp.currentUser.available_points) {
        showToast('ポイントが不足しています', 'error');
        return;
    }
    
    const value = Math.floor(amount * MobileApp.selectedExchangeRate);
    
    const exchange = await createExchange(
        MobileApp.currentUser.id,
        MobileApp.selectedExchangeType,
        amount,
        value
    );
    
    if (exchange) {
        await addPointHistory(MobileApp.currentUser.id, amount, '交換', `${MobileApp.selectedExchangeType}に交換`);
        
        const updatedUser = await updateUser(MobileApp.currentUser.id, {
            available_points: MobileApp.currentUser.available_points - amount
        });
        
        if (updatedUser) {
            MobileApp.currentUser = updatedUser;
            updateUserDisplay();
            await loadPointHistory();
            await checkAchievements(MobileApp.currentUser.id);
            
            showToast(`${formatNumber(amount)}pt交換完了！`, 'success');
            closeExchangeModal();
        }
    }
}

async function claimDailyBonus() {
    if (!MobileApp.isLoggedIn) {
        showToast('ログインしてください', 'error');
        await initializeApp();
        return;
    }
    
    const dayNumber = MobileApp.currentUser.consecutive_login_days;
    const bonusPoints = [10, 20, 30, 50, 100, 150, 500];
    const points = bonusPoints[Math.min(dayNumber - 1, 6)] || 10;
    
    const bonusEntry = {
        user_id: MobileApp.currentUser.id,
        day_number: dayNumber,
        bonus_points: points
    };
    
    await fetch('tables/daily_bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bonusEntry)
    });
    
    await addPointHistory(MobileApp.currentUser.id, points, 'デイリー', `Day ${dayNumber} ボーナス`);
    
    const updatedUser = await updateUser(MobileApp.currentUser.id, {
        total_points: MobileApp.currentUser.total_points + points,
        available_points: MobileApp.currentUser.available_points + points,
        rank_points: MobileApp.currentUser.rank_points + points,
        consecutive_login_days: dayNumber + 1
    });
    
    if (updatedUser) {
        MobileApp.currentUser = updatedUser;
        updateUserDisplay();
        await checkAchievements(MobileApp.currentUser.id);
        showToast(`${points}pt獲得！${dayNumber}日連続ログイン`, 'success');
    }
}

// ========================================
// 初期化
// ========================================

async function initializeApp() {
    // 案件を読み込み
    await fetchCases();
    renderCases();
    
    // 管理者アカウントを作成
    await createAdminAccount();
    
    // ログイン状態を復元
    const isLoggedIn = await restoreLoginState();
    
    if (isLoggedIn) {
        // ログイン済みの場合はそのまま継続
        return;
    }
    
    // 未ログインの場合はログイン画面を表示
    showScreen('loginScreen');
    
    /* 旧コード: 自動ユーザー作成 - 認証システム実装により不要
    const user = await getOrCreateUser();
    if (user) {
        MobileApp.currentUser = user;
        MobileApp.isLoggedIn = true;
        document.getElementById('pointsSection').classList.remove('hidden');
        updateUserDisplay();
        await loadPointHistory();
        await loadAchievements();
        renderAchievements();
    }
    */
    
    // Swiper初期化（ログイン状態に関わらず実行）
    new Swiper('.hero-swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        }
    });
    
    // アンケート案件を読み込み
    renderSurveyCases();
    
    // キャンペーンバナーを表示
    renderCampaignBanner();
    
    // 管理者アクセスをチェック
    checkAdminAccess();
    
    // 通知バッジを更新
    updateNotificationBadge();
}

// ========================================
// イベントリスナー
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    // ログインフォーム
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // 新規登録フォーム
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // 基本プロフィール編集フォーム
    document.getElementById('basicProfileEditForm').addEventListener('submit', handleBasicProfileEdit);
    
    // 詳細プロフィール編集フォーム
    document.getElementById('profileEditForm').addEventListener('submit', handleProfileEdit);
    
    // メール認証フォーム
    document.getElementById('emailVerificationForm').addEventListener('submit', handleEmailVerification);
    
    // メール認証確認フォーム
    document.getElementById('emailVerificationConfirmForm').addEventListener('submit', handleEmailVerificationConfirm);
    
    // 電話番号認証フォーム ★NEW
    document.getElementById('phoneVerificationForm').addEventListener('submit', handlePhoneVerification);
    
    // 電話番号認証確認フォーム ★NEW
    document.getElementById('phoneVerificationConfirmForm').addEventListener('submit', handlePhoneVerificationConfirm);
    
    // パスワードリセットフォーム
    document.getElementById('passwordResetForm').addEventListener('submit', handlePasswordReset);
    
    // パスワードリセット確認フォーム
    document.getElementById('passwordResetConfirmForm').addEventListener('submit', handlePasswordResetConfirm);
    
    // ボトムナビ
    document.querySelectorAll('.bottom-nav-item[data-screen]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const screenId = e.currentTarget.getAttribute('data-screen');
            
            // ログインが必要な画面のチェック
            const loginRequiredScreens = ['myPageScreen', 'favoritesScreen', 'notificationsScreen', 'exchangeScreen'];
            
            if (loginRequiredScreens.includes(screenId) && !MobileApp.isLoggedIn) {
                showLoginPrompt();
                return;
            }
            
            showScreen(screenId);
        });
    });
    
    // カテゴリーフィルター
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const category = e.currentTarget.getAttribute('data-category');
            filterCasesByCategory(category);
        });
    });
    
    // 交換オプション
    document.querySelectorAll('.exchange-option-mobile').forEach(option => {
        option.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            const rate = parseFloat(e.currentTarget.getAttribute('data-rate'));
            selectExchangeType(type, rate);
        });
    });
    
    // 交換額計算
    const exchangeAmountInput = document.getElementById('mobileExchangeAmount');
    if (exchangeAmountInput) {
        exchangeAmountInput.addEventListener('input', updateMobileExchangeValue);
    }
    
    // 交換実行
    const confirmBtn = document.getElementById('confirmMobileExchange');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', executeMobileExchange);
    }
    
    // モーダル背景クリックで閉じる
    document.getElementById('caseModal').addEventListener('click', (e) => {
        if (e.target.id === 'caseModal') closeCaseModal();
    });
    
    document.getElementById('exchangeModal').addEventListener('click', (e) => {
        if (e.target.id === 'exchangeModal') closeExchangeModal();
    });
    
    // ========================================
    // 新規画面のイベントリスナー
    // ========================================
    
    // 検索ボタン
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // 検索入力でEnterキー
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    // 検索カテゴリーフィルター
    const searchCategoryFilters = document.querySelectorAll('.search-category-chip');
    searchCategoryFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            searchCategoryFilters.forEach(b => {
                b.classList.remove('bg-purple-600', 'text-white', 'active');
                b.classList.add('bg-gray-800');
            });
            e.currentTarget.classList.remove('bg-gray-800');
            e.currentTarget.classList.add('bg-purple-600', 'text-white', 'active');
        });
    });
    
    // ランキング期間切り替え
    const rankingPeriodBtns = document.querySelectorAll('.ranking-period-btn');
    rankingPeriodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const period = e.currentTarget.getAttribute('data-period');
            loadRankingScreen(period);
        });
    });
    
    // クーポン入力でEnterキー
    const couponInput = document.getElementById('couponInput');
    if (couponInput) {
        couponInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') useCouponBtn();
        });
    }
    
    // お問い合わせフォーム送信
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContactForm);
    }
});

// ========================================
// 拡張機能統合（extensions.jsと連携）
// ========================================

// お気に入り機能を追加
window.toggleFavorite = async function(caseId) {
    if (!MobileApp.isLoggedIn || !MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const isFav = await FavoriteSystem.isFavorite(MobileApp.currentUser.id, caseId);
    
    if (isFav) {
        await FavoriteSystem.remove(MobileApp.currentUser.id, caseId);
        showToast('お気に入りから削除しました');
    } else {
        await FavoriteSystem.add(MobileApp.currentUser.id, caseId);
        showToast('お気に入りに追加しました');
    }
    
    // アイコンの状態を更新
    checkFavoriteStatus(caseId);
};

// 通知システムを追加
window.loadNotifications = async function() {
    if (!MobileApp.currentUser) return;
    
    const notifications = await NotificationSystem.getUserNotifications(MobileApp.currentUser.id);
    MobileApp.notifications = notifications;
    
    // 通知バッジ更新（ヘッダーに通知アイコンを追加する場合）
    const unreadCount = notifications.filter(n => !n.is_read).length;
    console.log(`未読通知: ${unreadCount}件`);
};

// ランキング機能を追加
window.showRanking = async function() {
    const ranking = await RankingSystem.getPointsRanking('all', 20);
    console.log('ランキング:', ranking);
    
    // モーダルやページで表示する場合はここに実装
    alert(`トップ3:\n1位: ${ranking[0]?.user.username} - ${formatNumber(ranking[0]?.points)}pt\n2位: ${ranking[1]?.user.username} - ${formatNumber(ranking[1]?.points)}pt\n3位: ${ranking[2]?.user.username} - ${formatNumber(ranking[2]?.points)}pt`);
};

// ガチャ機能を追加
window.playGacha = async function() {
    if (!MobileApp.isLoggedIn || !MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const canPlay = await GachaSystem.canPlayToday(MobileApp.currentUser.id);
    if (!canPlay) {
        showToast('今日の回数を使い切りました', 'error');
        return;
    }
    
    showToast('ガチャを引いています...', 'info');
    
    const prize = await GachaSystem.play(MobileApp.currentUser.id, 'daily');
    
    if (prize) {
        setTimeout(() => {
            const rarityText = {
                'common': '通常',
                'rare': 'レア',
                'epic': '激レア',
                'legendary': '超激レア'
            };
            
            showToast(`${rarityText[prize.rarity]}！${formatNumber(prize.points)}pt 獲得！`, 'success');
            
            // ユーザー情報を再読み込み
            setTimeout(async () => {
                const userResponse = await fetch(`tables/users?limit=1000`);
                const userData = await userResponse.json();
                MobileApp.currentUser = userData.data.find(u => u.id === MobileApp.currentUser.id);
                updateUserDisplay();
            }, 500);
            
            // 通知作成
            NotificationSystem.create(MobileApp.currentUser.id, {
                title: 'ガチャ当選！',
                message: `デイリーガチャで${prize.points}pt獲得しました`,
                type: 'point',
                icon: 'fa-gift'
            });
        }, 2000);
    }
};

// クーポン使用機能を追加
window.useCoupon = async function(code) {
    if (!MobileApp.isLoggedIn || !MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    if (!code) {
        code = prompt('クーポンコードを入力してください\n\n利用可能:\n- WELCOME2024 (1000pt)\n- SPRING500 (500pt)\n- LUCKY777 (777pt)');
    }
    
    if (!code) return;
    
    const result = await CouponSystem.use(MobileApp.currentUser.id, code.toUpperCase());
    
    if (result.success) {
        showToast(result.message, 'success');
        
        // ユーザー情報を再読み込み
        setTimeout(async () => {
            const userResponse = await fetch(`tables/users?limit=1000`);
            const userData = await userResponse.json();
            MobileApp.currentUser = userData.data.find(u => u.id === MobileApp.currentUser.id);
            updateUserDisplay();
        }, 500);
    } else {
        showToast(result.message, 'error');
    }
};

// 紹介コード表示機能
window.showReferralCode = function() {
    if (!MobileApp.currentUser || !MobileApp.currentUser.referral_code) {
        showToast('紹介コードを取得中...', 'info');
        return;
    }
    
    const code = MobileApp.currentUser.referral_code;
    const link = ReferralSystem.generateReferralLink(code);
    
    const message = `あなたの紹介コード: ${code}\n\n紹介リンク:\n${link}\n\n友達が登録すると両方にボーナス！\n紹介者: 500pt\n被紹介者: 300pt`;
    
    alert(message);
    
    // クリップボードにコピー
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link);
        showToast('リンクをコピーしました！', 'success');
    }
};

// 検索機能を追加
window.searchCases = async function(query) {
    if (!query) {
        query = prompt('案件を検索（キーワードを入力）');
    }
    
    if (!query) return;
    
    const results = await SearchSystem.search(query, {});
    
    console.log(`検索結果: ${results.length}件`, results);
    
    if (results.length === 0) {
        showToast('検索結果が見つかりませんでした', 'info');
    } else {
        showToast(`${results.length}件の案件が見つかりました`, 'success');
        // 実際にはここで検索結果画面を表示
    }
    
    return results;
};

// キャンペーン適用を追加
window.applyCampaignBoost = async function(category, basePoints) {
    return await CampaignSystem.applyBoost(category, basePoints);
};

// ========================================
// 新規追加画面の機能実装
// ========================================

// 検索画面の機能
window.performSearch = async function() {
    const query = document.getElementById('searchInput').value.trim();
    const minPoints = parseInt(document.getElementById('minPoints').value) || 0;
    const maxPoints = parseInt(document.getElementById('maxPoints').value) || Infinity;
    
    // アクティブなカテゴリーフィルターを取得
    const activeCategory = document.querySelector('.search-category-chip.active');
    const category = activeCategory ? activeCategory.getAttribute('data-category') : null;
    
    // 検索オプション
    const options = {
        category: category && category !== 'all' ? category : null,
        minPoints,
        maxPoints
    };
    
    const results = await SearchSystem.search(query, options);
    
    // 結果を表示
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-search text-4xl mb-4"></i>
                <p>検索結果が見つかりませんでした</p>
            </div>
        `;
        return;
    }
    
    results.forEach(caseItem => {
        const caseCard = document.createElement('div');
        caseCard.className = 'bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer';
        caseCard.onclick = () => openCaseModal(caseItem.id);
        
        caseCard.innerHTML = `
            <div class="flex items-start gap-3">
                <img src="${caseItem.image_url}" alt="${caseItem.title}" 
                     class="w-16 h-16 rounded-lg object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-white mb-1 truncate">${caseItem.title}</h3>
                    <p class="text-sm text-gray-400 mb-2 line-clamp-2">${caseItem.description}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-orange-500 font-bold text-lg">${formatNumber(caseItem.points)}pt</span>
                        <span class="text-xs text-gray-500">${caseItem.category}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(caseCard);
    });
    
    showToast(`${results.length}件の案件が見つかりました`, 'success');
};

// お気に入り画面を読み込む
window.loadFavoritesScreen = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('home');
        return;
    }
    
    const favorites = await FavoriteSystem.getUserFavorites(MobileApp.currentUser.id);
    const container = document.getElementById('favoritesList');
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-heart text-4xl mb-4"></i>
                <p class="mb-2">お気に入りがありません</p>
                <p class="text-sm">案件をお気に入りに追加してみましょう</p>
            </div>
        `;
        return;
    }
    
    favorites.forEach(item => {
        const caseItem = item.case;
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors';
        
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <img src="${caseItem.image_url}" alt="${caseItem.title}" 
                     class="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                     onclick="openCaseModal('${caseItem.id}')">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-white mb-1 cursor-pointer" 
                        onclick="openCaseModal('${caseItem.id}')">${caseItem.title}</h3>
                    <p class="text-sm text-gray-400 mb-2 line-clamp-2">${caseItem.description}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-orange-500 font-bold text-lg">${formatNumber(caseItem.points)}pt</span>
                        <button onclick="toggleFavorite('${caseItem.id}'); setTimeout(loadFavoritesScreen, 300);" 
                                class="text-red-500 hover:text-red-400 transition-colors">
                            <i class="fas fa-heart text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
};

// ランキング画面を読み込む
window.loadRankingScreen = async function(period = 'all') {
    const ranking = await RankingSystem.getPointsRanking(period, 50);
    const container = document.getElementById('rankingList');
    container.innerHTML = '';
    
    // 期間切り替えボタンのアクティブ状態を更新
    document.querySelectorAll('.ranking-period-btn').forEach(btn => {
        if (btn.getAttribute('data-period') === period) {
            btn.classList.remove('bg-gray-700', 'text-gray-300');
            btn.classList.add('bg-orange-500', 'text-white');
        } else {
            btn.classList.remove('bg-orange-500', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-300');
        }
    });
    
    if (ranking.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-trophy text-4xl mb-4"></i>
                <p>ランキングデータがありません</p>
            </div>
        `;
        return;
    }
    
    ranking.forEach((item, index) => {
        const rankClass = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500';
        const bgClass = index < 3 ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gray-800';
        
        const rankItem = document.createElement('div');
        rankItem.className = `${bgClass} rounded-lg p-4 flex items-center gap-4`;
        
        const medalIcon = index === 0 ? 'fa-crown' : index === 1 ? 'fa-medal' : index === 2 ? 'fa-award' : 'fa-user';
        
        // ユーザーアイコンまたは画像を取得 ★UPDATED
        const userImage = item.user.profile_image || 'fa-user';
        const isCustomImage = userImage.startsWith('data:');
        const iconHTML = isCustomImage 
            ? `<img src="${userImage}" alt="Profile" class="w-full h-full object-cover rounded-full">`
            : `<i class="fas ${userImage} text-xl"></i>`;
        
        rankItem.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <div class="${rankClass} font-bold text-lg flex-shrink-0" style="width: 1.5rem;">
                    ${index + 1}
                </div>
                <div class="w-12 h-12 rounded-full ${index < 3 ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gray-700'} 
                            flex items-center justify-center flex-shrink-0 overflow-hidden">
                    ${iconHTML}
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-bold text-white truncate">${item.user.username}</div>
                <div class="text-xs text-gray-400">Rank ${item.user.current_rank || 'ブロンズ'}</div>
            </div>
            <div class="text-right flex-shrink-0">
                <div class="text-orange-500 font-bold text-lg">${formatNumber(item.points)}</div>
                <div class="text-xs text-gray-500">pt</div>
            </div>
        `;
        
        container.appendChild(rankItem);
    });
};

// 紹介画面を読み込む
window.loadReferralScreen = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('home');
        return;
    }
    
    const code = MobileApp.currentUser.referral_code;
    const link = ReferralSystem.generateReferralLink(code);
    const stats = await ReferralSystem.getReferralStats(MobileApp.currentUser.id);
    
    // 紹介コードとリンクを表示
    document.getElementById('referralCodeDisplay').textContent = code;
    document.getElementById('referralLinkDisplay').textContent = link;
    
    // 統計情報を更新
    document.getElementById('totalReferrals').textContent = stats.totalReferrals;
    
    // 報酬アップ率を表示 ★NEW
    const referralBonusRate = MobileApp.currentUser.referral_bonus_rate || 0;
    const bonusRateEl = document.getElementById('referralBonusRate');
    if (bonusRateEl) {
        bonusRateEl.textContent = `+${referralBonusRate}%`;
        if (referralBonusRate >= 10) {
            bonusRateEl.classList.add('text-yellow-400');
            bonusRateEl.textContent += ' ⭐';
        }
    }
    
    document.getElementById('referralRank').textContent = stats.rank;
    
    // TOP10紹介者ランキング
    const topReferrers = await ReferralSystem.getTopReferrers(10);
    const rankingContainer = document.getElementById('referralRanking');
    rankingContainer.innerHTML = '';
    
    topReferrers.forEach((item, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'flex items-center justify-between py-3 border-b border-gray-700';
        
        const isCurrentUser = item.user.id === MobileApp.currentUser.id;
        
        const userBonusRate = item.user.referral_bonus_rate || 0;
        
        // ユーザーアイコンまたは画像を取得 ★UPDATED
        const userImage = item.user.profile_image || 'fa-user';
        const isCustomImage = userImage.startsWith('data:');
        const iconHTML = isCustomImage 
            ? `<img src="${userImage}" alt="Profile" class="w-full h-full object-cover rounded-full">`
            : `<i class="fas ${userImage}"></i>`;
        
        rankItem.innerHTML = `
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="w-8 h-8 rounded-full ${index < 3 ? 'bg-orange-500' : 'bg-gray-700'} 
                            flex items-center justify-center font-bold text-sm flex-shrink-0">${index + 1}</span>
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 
                            flex items-center justify-center flex-shrink-0 overflow-hidden">
                    ${iconHTML}
                </div>
                <div class="min-w-0">
                    <div class="font-bold ${isCurrentUser ? 'text-orange-500' : 'text-white'} truncate">
                        ${item.user.username} ${isCurrentUser ? '(あなた)' : ''}
                    </div>
                    <div class="text-xs text-gray-500">${item.referralCount}人紹介 • +${userBonusRate}%アップ</div>
                </div>
            </div>
            <div class="text-right flex-shrink-0">
                <div class="text-yellow-400 font-bold">+${userBonusRate}%</div>
                <div class="text-xs text-gray-500">報酬アップ</div>
            </div>
        `;
        
        rankingContainer.appendChild(rankItem);
    });
};

// 紹介コードをコピー
window.copyReferralCode = function() {
    const code = document.getElementById('referralCodeDisplay').textContent;
    navigator.clipboard.writeText(code);
    showToast('紹介コードをコピーしました！', 'success');
};

// 紹介リンクをコピー
window.copyReferralLink = function() {
    const link = document.getElementById('referralLinkDisplay').textContent;
    navigator.clipboard.writeText(link);
    showToast('紹介リンクをコピーしました！', 'success');
};

// ガチャ画面を読み込む
window.loadGachaScreen = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('home');
        return;
    }
    
    const remaining = await GachaSystem.getRemainingPlays(MobileApp.currentUser.id);
    document.getElementById('gachaRemainingPlays').textContent = remaining;
    
    // ガチャ履歴を読み込む
    const history = await GachaSystem.getHistory(MobileApp.currentUser.id, 20);
    const historyContainer = document.getElementById('gachaHistory');
    historyContainer.innerHTML = '';
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p class="text-sm">まだガチャを引いていません</p>
            </div>
        `;
    } else {
        history.forEach(item => {
            const rarityColors = {
                'common': 'text-gray-400',
                'rare': 'text-blue-400',
                'epic': 'text-purple-400',
                'legendary': 'text-yellow-400'
            };
            
            const rarityText = {
                'common': '通常',
                'rare': 'レア',
                'epic': '激レア',
                'legendary': '超激レア'
            };
            
            const historyItem = document.createElement('div');
            historyItem.className = 'flex items-center justify-between py-2 border-b border-gray-700';
            historyItem.innerHTML = `
                <div>
                    <span class="${rarityColors[item.rarity]} font-bold">${rarityText[item.rarity]}</span>
                    <span class="text-gray-500 text-sm ml-2">${new Date(item.played_at).toLocaleDateString()}</span>
                </div>
                <span class="text-orange-500 font-bold">${formatNumber(item.prize_points)}pt</span>
            `;
            historyContainer.appendChild(historyItem);
        });
    }
};

// ガチャを引く（画面版）
window.playGachaBtn = async function() {
    if (!MobileApp.isLoggedIn || !MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const canPlay = await GachaSystem.canPlayToday(MobileApp.currentUser.id);
    if (!canPlay) {
        showToast('今日の回数を使い切りました', 'error');
        return;
    }
    
    // ボタンを無効化
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 抽選中...';
    
    showToast('ガチャを引いています...', 'info');
    
    const prize = await GachaSystem.play(MobileApp.currentUser.id, 'daily');
    
    if (prize) {
        setTimeout(async () => {
            const rarityText = {
                'common': '通常',
                'rare': 'レア',
                'epic': '激レア',
                'legendary': '超激レア'
            };
            
            showToast(`🎉 ${rarityText[prize.rarity]}！${formatNumber(prize.points)}pt 獲得！`, 'success');
            
            // ユーザー情報を再読み込み
            const userResponse = await fetch(`tables/users?limit=1000`);
            const userData = await userResponse.json();
            MobileApp.currentUser = userData.data.find(u => u.id === MobileApp.currentUser.id);
            updateUserDisplay();
            
            // ガチャ画面を再読み込み
            await loadGachaScreen();
            
            // ボタンを復元
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-dice"></i> ガチャを引く';
        }, 2000);
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-dice"></i> ガチャを引く';
    }
};

// クーポン使用（画面版）
window.useCouponBtn = async function() {
    if (!MobileApp.isLoggedIn || !MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    
    if (!code) {
        showToast('クーポンコードを入力してください', 'error');
        return;
    }
    
    const result = await CouponSystem.use(MobileApp.currentUser.id, code);
    
    if (result.success) {
        showToast(result.message, 'success');
        document.getElementById('couponInput').value = '';
        
        // ユーザー情報を再読み込み
        setTimeout(async () => {
            const userResponse = await fetch(`tables/users?limit=1000`);
            const userData = await userResponse.json();
            MobileApp.currentUser = userData.data.find(u => u.id === MobileApp.currentUser.id);
            updateUserDisplay();
        }, 500);
    } else {
        showToast(result.message, 'error');
    }
};

console.log('✅ PointMax Mobile - 全機能統合完了！');
console.log('📱 利用可能な機能:');
console.log('  - toggleFavorite(caseId): お気に入り追加/削除');
console.log('  - loadNotifications(): 通知読み込み');
console.log('  - showRanking(): ランキング表示');
console.log('  - playGacha(): ガチャを引く');
console.log('  - useCoupon(code): クーポン使用');
console.log('  - showReferralCode(): 紹介コード表示');
console.log('  - searchCases(query): 案件検索');
console.log('  - applyCampaignBoost(category, points): キャンペーン適用');
console.log('🖥️  画面機能:');
console.log('  - performSearch(): 検索実行');
console.log('  - loadFavoritesScreen(): お気に入り画面');
console.log('  - loadRankingScreen(period): ランキング画面');
console.log('  - loadReferralScreen(): 紹介画面');
console.log('  - loadGachaScreen(): ガチャ画面');
console.log('  - playGachaBtn(): ガチャ実行');
console.log('  - useCouponBtn(): クーポン使用');

// ========================================
// 管理者機能
// ========================================

// 管理者チェック（デモ用：usernameが"admin"の場合）
function checkAdminAccess() {
    if (MobileApp.currentUser && MobileApp.currentUser.username === 'admin') {
        const adminSection = document.getElementById('adminSection');
        if (adminSection) {
            adminSection.style.display = 'block';
        }
    }
}

// 案件追加フォームを表示
window.showAddCaseForm = function() {
    document.getElementById('addCaseForm').classList.remove('hidden');
};

// 案件追加フォームを非表示
window.hideAddCaseForm = function() {
    document.getElementById('addCaseForm').classList.add('hidden');
    // フォームをリセット
    document.getElementById('adminCaseTitle').value = '';
    document.getElementById('adminCaseDescription').value = '';
    document.getElementById('adminCasePoints').value = '';
    document.getElementById('adminCaseTime').value = '';
    document.getElementById('adminCaseUrl').value = '';
    document.getElementById('adminCaseNew').checked = false;
    document.getElementById('adminCaseFeatured').checked = false;
    
    // 画像アップロードをクリア
    clearImageUpload();
};

// 新規案件を保存
window.saveNewCase = async function() {
    const title = document.getElementById('adminCaseTitle').value.trim();
    const description = document.getElementById('adminCaseDescription').value.trim();
    const category = document.getElementById('adminCaseCategory').value;
    const points = parseInt(document.getElementById('adminCasePoints').value);
    const time = document.getElementById('adminCaseTime').value.trim() || '未定';
    const difficulty = document.getElementById('adminCaseDifficulty').value;
    const imageData = document.getElementById('adminCaseImage').value.trim();
    const imageUrl = imageData || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop';
    const caseUrl = document.getElementById('adminCaseUrl').value.trim();
    const isNew = document.getElementById('adminCaseNew').checked;
    const isFeatured = document.getElementById('adminCaseFeatured').checked;
    
    if (!title || !description || !points || !caseUrl) {
        showToast('必須項目を入力してください', 'error');
        return;
    }
    
    // 画像が未選択の場合の確認（任意）
    if (!imageData) {
        const proceed = confirm('画像が選択されていません。デフォルト画像を使用しますか？');
        if (!proceed) {
            return;
        }
    }
    
    try {
        const newCase = {
            title,
            description,
            category,
            points,
            estimated_time: time,
            difficulty,
            image_url: imageUrl,
            case_url: caseUrl,
            is_new: isNew,
            is_featured: isFeatured,
            completion_count: 0
        };
        
        const response = await fetch('tables/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCase)
        });
        
        if (response.ok) {
            showToast('案件を追加しました！', 'success');
            hideAddCaseForm();
            
            // 案件リストを再読み込み
            await fetchCases();
            renderCases();
            loadAdminCasesList();
        } else {
            showToast('案件の追加に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error saving case:', error);
        showToast('エラーが発生しました', 'error');
    }
};

// 管理者画面の案件一覧を読み込み
window.loadAdminCasesList = async function() {
    const container = document.getElementById('adminCasesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (MobileApp.cases.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p class="text-sm">案件がまだ登録されていません</p>
            </div>
        `;
        return;
    }
    
    MobileApp.cases.forEach(caseItem => {
        const caseCard = document.createElement('div');
        caseCard.className = 'bg-gray-800 rounded-lg p-4';
        
        caseCard.innerHTML = `
            <div class="flex items-start gap-3">
                <img src="${caseItem.image_url}" alt="${caseItem.title}" 
                     class="w-16 h-16 rounded-lg object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-white mb-1 truncate">${caseItem.title}</h3>
                    <p class="text-sm text-gray-400 mb-2">${caseItem.category} | ${formatNumber(caseItem.points)}pt</p>
                    <div class="flex gap-2">
                        ${caseItem.is_new ? '<span class="text-xs bg-green-600 px-2 py-1 rounded">NEW</span>' : ''}
                        ${caseItem.is_featured ? '<span class="text-xs bg-purple-600 px-2 py-1 rounded">おすすめ</span>' : ''}
                    </div>
                </div>
                <button onclick="deleteCase('${caseItem.id}')" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(caseCard);
    });
};

// 案件を削除
window.deleteCase = async function(caseId) {
    if (!confirm('この案件を削除しますか？')) return;
    
    try {
        const response = await fetch(`tables/cases/${caseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('案件を削除しました', 'success');
            await fetchCases();
            renderCases();
            loadAdminCasesList();
        } else {
            showToast('削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error deleting case:', error);
        showToast('エラーが発生しました', 'error');
    }
};

// ========================================
// お問い合わせフォーム送信
// ========================================

window.submitContactForm = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const category = document.getElementById('contactCategory').value;
    const message = document.getElementById('contactMessage').value.trim();
    
    // デモ版：コンソールに出力
    console.log('お問い合わせ送信:', { name, email, category, message });
    
    showToast('お問い合わせを送信しました', 'success');
    
    // フォームをリセット
    document.getElementById('contactForm').reset();
    
    // マイページに戻る
    setTimeout(() => {
        showScreen('myPageScreen');
    }, 1500);
};

// ========================================
// キャンペーンバナーの表示
// ========================================

async function renderCampaignBanner() {
    const campaigns = await CampaignSystem.getActiveCampaigns();
    const container = document.getElementById('campaignBanner');
    
    if (!container || campaigns.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    campaigns.forEach(campaign => {
        const banner = document.createElement('div');
        banner.className = 'bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl p-4 mb-3';
        
        banner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-fire text-2xl"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-lg mb-1">${campaign.title}</h4>
                    <p class="text-sm opacity-90">${campaign.description}</p>
                    ${campaign.target_category ? `<p class="text-xs mt-1 opacity-75">対象: ${campaign.target_category}</p>` : ''}
                </div>
                <div class="text-center">
                    <div class="text-2xl font-black">${campaign.boost_multiplier}x</div>
                    <div class="text-xs opacity-75">UP!</div>
                </div>
            </div>
        `;
        
        container.appendChild(banner);
    });
}

// ========================================
// ========================================
// キャンペーンバナー表示
// ========================================

async function renderCampaignBanner() {
    const campaigns = await CampaignSystem.getActiveCampaigns();
    const container = document.getElementById('campaignBanner');
    
    if (!container || campaigns.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    campaigns.forEach(campaign => {
        const banner = document.createElement('div');
        banner.className = 'bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-4 mb-3';
        
        const multiplierText = campaign.boost_multiplier > 1 
            ? `${campaign.boost_multiplier}倍` 
            : `+${(campaign.boost_multiplier - 1) * 100}%`;
        
        banner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-fire text-2xl"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-lg mb-1">${campaign.title}</h4>
                    <p class="text-sm opacity-90">${campaign.description}</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-black">${multiplierText}</div>
                    <div class="text-xs opacity-90">UP!</div>
                </div>
            </div>
        `;
        
        container.appendChild(banner);
    });
}

// ========================================
// アンケート案件の読み込み
// ========================================

async function renderSurveyCases() {
    const container = document.getElementById('surveySection');
    if (!container) return;
    
    // アフィリエイト案件のアンケート
    const surveyCases = MobileApp.cases.filter(c => c.category === 'アンケート').slice(0, 3);
    
    // データベースのアクティブなアンケート
    const activeSurveys = await SurveySystem.getActiveSurveys();
    
    container.innerHTML = '';
    
    // データベースのアンケートを表示（優先）
    activeSurveys.slice(0, 5).forEach(survey => {
        const card = document.createElement('div');
        card.className = 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 cursor-pointer hover:from-purple-900 hover:to-pink-900 transition-all border border-purple-500/30';
        card.onclick = () => openSurveyModal(survey.id);
        
        // ボーナス率計算 ★UPDATED
        let bonusRate = 0;
        let basePoints = survey.points_per_response;
        let displayPoints = basePoints;
        let pointsHTML = '';
        
        if (MobileApp.isLoggedIn && MobileApp.currentUser) {
            const profileBonus = MobileApp.currentUser.profile_bonus_rate || 0;
            const referralBonus = MobileApp.currentUser.referral_bonus_rate || 0;
            bonusRate = profileBonus + referralBonus;
            
            if (bonusRate > 0) {
                displayPoints = Math.floor(basePoints * (1 + bonusRate / 100));
                pointsHTML = `
                    <div class="text-right">
                        <div class="flex items-center gap-1 justify-end mb-0.5">
                            <span class="text-xs text-gray-400 line-through">${formatNumber(basePoints)}pt</span>
                            <span class="bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-bold">+${bonusRate}%</span>
                        </div>
                        <span class="text-yellow-400 font-bold">${formatNumber(displayPoints)}pt</span>
                    </div>
                `;
            } else {
                pointsHTML = `<span class="text-yellow-400 font-bold">${formatNumber(basePoints)}pt</span>`;
            }
        } else {
            pointsHTML = `<span class="text-yellow-400 font-bold">${formatNumber(basePoints)}pt</span>`;
        }
        
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="bg-purple-600 text-xs px-2 py-1 rounded-full font-bold">
                        ${survey.survey_type === 'internal' ? '自社' : 'PR'}
                    </span>
                    <h4 class="font-bold text-white">${survey.title}</h4>
                </div>
                ${pointsHTML}
            </div>
            <p class="text-sm text-gray-300 mb-2">${survey.description}</p>
            <div class="flex items-center justify-between text-xs">
                <div class="flex gap-3 text-gray-400">
                    <span><i class="fas fa-clock mr-1"></i>${survey.estimated_time}</span>
                    <span><i class="fas fa-users mr-1"></i>${survey.current_responses}/${survey.target_responses}</span>
                </div>
                <span class="text-purple-300"><i class="fas fa-arrow-right"></i></span>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // アフィリエイト案件のアンケートも表示
    surveyCases.forEach(survey => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors';
        card.onclick = () => openCaseModal(survey.id);
        
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-white">${survey.title}</h4>
                <span class="text-orange-500 font-bold">${formatNumber(survey.points)}pt</span>
            </div>
            <p class="text-sm text-gray-400 mb-2">${survey.description}</p>
            <div class="flex items-center gap-3 text-xs text-gray-500">
                <span><i class="fas fa-clock mr-1"></i>${survey.estimated_time}</span>
                <span><i class="fas fa-signal mr-1"></i>${survey.difficulty}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// 通知システムUI
// ========================================

// 通知画面を読み込む
window.loadNotificationsScreen = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('homeScreen');
        return;
    }
    
    const notifications = await NotificationSystem.getUserNotifications(MobileApp.currentUser.id);
    const container = document.getElementById('notificationsList');
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-bell-slash text-4xl mb-4"></i>
                <p>通知はありません</p>
            </div>
        `;
        return;
    }
    
    notifications.forEach(notification => {
        const notifItem = document.createElement('div');
        notifItem.className = `stat-card cursor-pointer ${notification.is_read ? 'opacity-60' : ''}`;
        notifItem.onclick = () => handleNotificationClick(notification);
        
        const iconClass = {
            'point': 'fa-coins text-orange-400',
            'rank': 'fa-medal text-yellow-400',
            'achievement': 'fa-trophy text-purple-400',
            'case': 'fa-file-alt text-blue-400',
            'system': 'fa-info-circle text-gray-400'
        }[notification.type] || 'fa-bell text-gray-400';
        
        notifItem.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <i class="fas ${notification.icon || iconClass}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-white mb-1">${notification.title}</h4>
                    <p class="text-sm text-gray-400 mb-1">${notification.message}</p>
                    <p class="text-xs text-gray-500">${formatRelativeTime(new Date(notification.created_at))}</p>
                </div>
                ${!notification.is_read ? '<div class="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>' : ''}
            </div>
        `;
        
        container.appendChild(notifItem);
    });
    
    // 未読数を更新
    updateNotificationBadge();
};

// 通知バッジを更新
window.updateNotificationBadge = async function() {
    if (!MobileApp.currentUser) return;
    
    const notifications = await NotificationSystem.getUserNotifications(MobileApp.currentUser.id);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};

// 通知をクリックした時の処理
window.handleNotificationClick = async function(notification) {
    // 既読にする
    await NotificationSystem.markAsRead(notification.id);
    
    // リンク先に遷移
    if (notification.link) {
        if (notification.link.startsWith('http')) {
            window.open(notification.link, '_blank');
        } else {
            showScreen(notification.link);
        }
    }
    
    // 画面を再読み込み
    await loadNotificationsScreen();
};

// すべての通知を既読にする
window.markAllNotificationsRead = async function() {
    if (!MobileApp.currentUser) return;
    
    const notifications = await NotificationSystem.getUserNotifications(MobileApp.currentUser.id);
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    for (const notification of unreadNotifications) {
        await NotificationSystem.markAsRead(notification.id);
    }
    
    showToast('すべて既読にしました', 'success');
    await loadNotificationsScreen();
};

// ========================================
// レビュー・評価システムUI
// ========================================

// レビューセクションをHTML生成
function generateReviewSection(caseId) {
    return `
        <div class="mt-6 border-t border-gray-800 pt-6">
            <h3 class="text-lg font-bold mb-4">レビュー・評価</h3>
            
            <!-- レビュー投稿フォーム -->
            <div class="stat-card mb-4" id="reviewForm-${caseId}">
                <h4 class="font-bold mb-3">この案件を評価する</h4>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-sm text-gray-400">評価:</span>
                    <div class="flex gap-1" id="starRating-${caseId}">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <button onclick="selectStarRating('${caseId}', ${i})" class="star-btn text-2xl text-gray-600" data-rating="${i}">
                                <i class="fas fa-star"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <textarea id="reviewComment-${caseId}" rows="3" placeholder="レビューを投稿（任意）" 
                          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm mb-3"></textarea>
                <button onclick="submitReview('${caseId}')" class="w-full bg-purple-600 py-2 rounded-lg font-bold text-sm">
                    レビューを投稿
                </button>
            </div>
            
            <!-- レビュー一覧 -->
            <div id="reviewsList-${caseId}">
                <div class="text-center py-4 text-gray-400">
                    <p class="text-sm">レビューを読み込み中...</p>
                </div>
            </div>
        </div>
    `;
}

// 星評価を選択
window.selectStarRating = function(caseId, rating) {
    const container = document.getElementById(`starRating-${caseId}`);
    const stars = container.querySelectorAll('.star-btn');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('text-gray-600');
            star.classList.add('text-yellow-400');
        } else {
            star.classList.remove('text-yellow-400');
            star.classList.add('text-gray-600');
        }
    });
    
    container.dataset.selectedRating = rating;
};

// レビューを投稿
window.submitReview = async function(caseId) {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const container = document.getElementById(`starRating-${caseId}`);
    const rating = parseInt(container.dataset.selectedRating || 0);
    const comment = document.getElementById(`reviewComment-${caseId}`).value.trim();
    
    if (rating === 0) {
        showToast('星評価を選択してください', 'error');
        return;
    }
    
    const success = await ReviewSystem.add(MobileApp.currentUser.id, caseId, rating, comment);
    
    if (success) {
        showToast('レビューを投稿しました！', 'success');
        
        // フォームをリセット
        container.dataset.selectedRating = 0;
        selectStarRating(caseId, 0);
        document.getElementById(`reviewComment-${caseId}`).value = '';
        
        // レビュー一覧を再読み込み
        await loadReviewsForCase(caseId);
    } else {
        showToast('レビューの投稿に失敗しました', 'error');
    }
};

// 案件のレビューを読み込む
window.loadReviewsForCase = async function(caseId) {
    const reviews = await ReviewSystem.getCaseReviews(caseId);
    const container = document.getElementById(`reviewsList-${caseId}`);
    
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-comment-slash text-3xl mb-2"></i>
                <p class="text-sm">まだレビューがありません</p>
                <p class="text-xs">最初のレビューを投稿しましょう！</p>
            </div>
        `;
        return;
    }
    
    // 平均評価を計算
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    container.innerHTML = `
        <div class="stat-card mb-4">
            <div class="flex items-center gap-3 mb-2">
                <div class="text-3xl font-black text-yellow-400">${avgRating.toFixed(1)}</div>
                <div>
                    <div class="flex gap-1 mb-1">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <i class="fas fa-star text-sm ${i <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-600'}"></i>
                        `).join('')}
                    </div>
                    <p class="text-xs text-gray-400">${reviews.length}件のレビュー</p>
                </div>
            </div>
        </div>
        
        <div class="space-y-3">
            ${reviews.map(review => `
                <div class="stat-card">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                                ${review.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p class="font-bold text-sm">${review.user.username}</p>
                                <div class="flex gap-1">
                                    ${[1, 2, 3, 4, 5].map(i => `
                                        <i class="fas fa-star text-xs ${i <= review.rating ? 'text-yellow-400' : 'text-gray-600'}"></i>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <span class="text-xs text-gray-500">${formatRelativeTime(new Date(review.created_at))}</span>
                    </div>
                    ${review.comment ? `<p class="text-sm text-gray-300 mb-2">${review.comment}</p>` : ''}
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <button onclick="markReviewHelpful('${review.id}')" class="flex items-center gap-1 hover:text-purple-400">
                            <i class="fas fa-thumbs-up"></i>
                            <span>役に立った (${review.helpful_count || 0})</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// レビューを「役に立った」
window.markReviewHelpful = async function(reviewId) {
    await ReviewSystem.markHelpful(reviewId);
    showToast('フィードバックありがとうございます', 'success');
};

console.log('✅ 追加機能実装完了:');
console.log('  - 管理者機能（案件追加・削除）');
console.log('  - お問い合わせフォーム');
console.log('  - プライバシーポリシー画面');
console.log('  - 利用規約画面');
console.log('  - アンケート案件フッター表示');
// ========================================
// ログイン・ログアウト・新規登録機能
// ========================================

// ログイン処理
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('ユーザー名とパスワードを入力してください', 'error');
        return;
    }
    
    try {
        // ユーザー検索
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        
        const user = data.data.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );
        
        if (user) {
            // ログイン成功
            MobileApp.currentUser = user;
            MobileApp.isLoggedIn = true;
            
            // localStorageに保存
            localStorage.setItem('currentUserId', user.id);
            
            showToast(`ようこそ、${user.username}さん！`, 'success');
            
            // ホーム画面に遷移
            showScreen('homeScreen');
            
            // UIを更新
            document.getElementById('pointsSection').classList.remove('hidden');
            updateUserDisplay();
            await loadPointHistory();
            await loadAchievements();
            renderAchievements();
            updateNotificationBadge();
            updateBonusStatus();
            checkAdminAccess();
            
            // フォームをリセット
            document.getElementById('loginForm').reset();
        } else {
            showToast('ユーザー名またはパスワードが正しくありません', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('ログインに失敗しました', 'error');
    }
};

// 新規登録処理
window.handleRegister = async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const referralCode = document.getElementById('registerReferralCode').value.trim().toUpperCase();
    const agree = document.getElementById('registerAgree').checked;
    
    // 拡張プロフィール情報取得
    const gender = document.getElementById('registerGender').value;
    const ageGroup = document.getElementById('registerAgeGroup').value;
    const occupation = document.getElementById('registerOccupation').value;
    const prefecture = document.getElementById('registerPrefecture').value;
    
    // 興味関心の取得
    const interestCheckboxes = document.querySelectorAll('.interest-checkbox:checked');
    const interests = Array.from(interestCheckboxes).map(cb => cb.value);
    
    // バリデーション
    if (!username || !email || !password) {
        showToast('必須項目を入力してください', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('ユーザー名は3文字以上で入力してください', 'error');
        return;
    }
    
    // パスワード強度チェック ★NEW
    if (password.length < 8) {
        showToast('パスワードは8文字以上で入力してください', 'error');
        return;
    }
    
    // 基本的な強度要件をチェック
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
        showToast('パスワードは大文字、小文字、数字を含む必要があります', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showToast('パスワードが一致しません', 'error');
        return;
    }
    
    if (!agree) {
        showToast('利用規約に同意してください', 'error');
        return;
    }
    
    try {
        // 既存ユーザーチェック
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        
        const existingUser = data.data.find(u => 
            u.username === username || u.email === email
        );
        
        if (existingUser) {
            if (existingUser.username === username) {
                showToast('このユーザー名は既に使用されています', 'error');
            } else {
                showToast('このメールアドレスは既に登録されています', 'error');
            }
            return;
        }
        
        // プロフィール完成度チェック
        const profileCompleted = !!(gender && ageGroup && occupation && prefecture && interests.length > 0);
        const profileBonusRate = profileCompleted ? 10 : 0;
        
        // 新規ユーザー作成
        const newUser = {
            username,
            email,
            password, // 本番環境ではハッシュ化が必要
            total_points: 0,
            available_points: 0,
            rank_points: 0,
            rank: 'ブロンズ',
            consecutive_login_days: 0,
            last_login_date: new Date().toISOString().split('T')[0],
            total_referrals: 0,
            profile_image: '',
            referral_code: ReferralSystem.generateReferralCode(username),
            // 拡張プロフィール情報
            gender: gender || '',
            age_group: ageGroup || '',
            occupation: occupation || '',
            prefecture: prefecture || '',
            interests: interests,
            profile_bonus_rate: profileBonusRate,
            referral_bonus_rate: 0, // ★NEW: 紹介ボーナス率（初期値0）
            profile_completed: profileCompleted,
            phone_verified: false,
            phone_number: '',
            identity_verified: false
        };
        
        const createResponse = await fetch('tables/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        
        if (createResponse.ok) {
            const createdUser = await createResponse.json();
            
            // 紹介コードがある場合は紹介記録
            if (referralCode) {
                await ReferralSystem.recordReferral(referralCode, createdUser.id);
            }
            
            // 新規登録ボーナス（通知作成）
            let welcomeMessage = '新規登録ありがとうございます。さっそくポイントを貯めましょう！';
            if (profileCompleted) {
                welcomeMessage += '\n\n🎉 プロフィール登録完了で報酬10%アップが適用されました！';
            }
            
            await NotificationSystem.create(createdUser.id, {
                title: 'ようこそポイしばへ！',
                message: welcomeMessage,
                type: 'system',
                icon: 'fa-gift'
            });
            
            const successMsg = profileCompleted 
                ? '登録完了！報酬10%アップが適用されました🎉' 
                : '登録完了！ログインしてください';
            showToast(successMsg, 'success');
            
            // フォームをリセット
            document.getElementById('registerForm').reset();
            
            // ログイン画面に遷移
            setTimeout(() => {
                showScreen('loginScreen');
                // ユーザー名を自動入力
                document.getElementById('loginUsername').value = username;
            }, 2000);
        } else {
            showToast('登録に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('登録に失敗しました', 'error');
    }
};

// プロフィール画像アップロード処理 ★NEW
window.handleProfileImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showProfileImageUploadError('ファイルサイズは5MB以下にしてください');
        return;
    }
    
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
        showProfileImageUploadError('画像ファイルを選択してください');
        return;
    }
    
    // FileReaderで画像を読み込む
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        
        // 隠しフィールドに保存
        document.getElementById('uploadedProfileImage').value = base64;
        document.getElementById('profileImageType').value = 'upload';
        
        // プレビューを更新
        const previewIcon = document.getElementById('currentProfileIcon');
        previewIcon.innerHTML = `<img src="${base64}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
        
        // アイコン選択を解除
        document.querySelectorAll('.profile-icon-option').forEach(btn => {
            btn.classList.remove('border-purple-500', 'bg-purple-900/30');
            btn.classList.add('border-gray-700');
            btn.setAttribute('data-selected', 'false');
        });
        
        // UI更新
        document.getElementById('profileUploadButtonText').textContent = '画像を変更';
        document.getElementById('profileImageFileName').textContent = `📁 ${file.name}`;
        document.getElementById('profileImageFileSize').textContent = `📊 ${(file.size / 1024).toFixed(2)} KB`;
        document.getElementById('profileImageInfo').classList.remove('hidden');
        document.getElementById('clearProfileImageBtn').classList.remove('hidden');
        hideProfileImageUploadError();
        
        showToast('画像をアップロードしました', 'success');
    };
    
    reader.onerror = function() {
        showProfileImageUploadError('画像の読み込みに失敗しました');
    };
    
    reader.readAsDataURL(file);
};

// プロフィール画像アップロードのクリア ★NEW
window.clearProfileImageUpload = function() {
    document.getElementById('profileImageFile').value = '';
    document.getElementById('uploadedProfileImage').value = '';
    document.getElementById('profileImageType').value = 'icon';
    document.getElementById('profileImageInfo').classList.add('hidden');
    document.getElementById('clearProfileImageBtn').classList.add('hidden');
    document.getElementById('profileUploadButtonText').textContent = '画像を選択';
    
    // プレビューをデフォルトに戻す
    const previewIcon = document.getElementById('currentProfileIcon');
    const currentIcon = MobileApp.currentUser?.profile_image || 'fa-user';
    if (currentIcon.startsWith('data:')) {
        previewIcon.innerHTML = `<img src="${currentIcon}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
    } else {
        previewIcon.innerHTML = `<i class="fas ${currentIcon}"></i>`;
    }
    
    hideProfileImageUploadError();
    showToast('画像をクリアしました', 'success');
};

// エラーメッセージ表示
function showProfileImageUploadError(message) {
    const errorElement = document.getElementById('profileImageUploadError');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// エラーメッセージ非表示
function hideProfileImageUploadError() {
    const errorElement = document.getElementById('profileImageUploadError');
    errorElement.classList.add('hidden');
}

// アイコン選択処理 ★UPDATED
window.selectProfileIcon = function(iconClass, buttonElement) {
    // 全てのアイコンボタンから選択状態を解除
    document.querySelectorAll('.profile-icon-option').forEach(btn => {
        btn.classList.remove('border-purple-500', 'bg-purple-900/30');
        btn.classList.add('border-gray-700');
        btn.setAttribute('data-selected', 'false');
    });
    
    // 選択されたボタンをハイライト
    buttonElement.classList.remove('border-gray-700');
    buttonElement.classList.add('border-purple-500', 'bg-purple-900/30');
    buttonElement.setAttribute('data-selected', 'true');
    
    // 隠しフィールドに保存
    document.getElementById('selectedProfileIcon').value = iconClass;
    document.getElementById('profileImageType').value = 'icon';
    document.getElementById('uploadedProfileImage').value = '';
    
    // プレビューを更新
    const previewIcon = document.getElementById('currentProfileIcon');
    previewIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    // アップロード情報をクリア
    document.getElementById('profileImageInfo').classList.add('hidden');
    document.getElementById('clearProfileImageBtn').classList.add('hidden');
    hideProfileImageUploadError();
};

// 基本プロフィール編集処理 ★NEW
window.handleBasicProfileEdit = async function(event) {
    event.preventDefault();
    
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    // アイコンまたは画像を取得 ★UPDATED
    const imageType = document.getElementById('profileImageType').value;
    const uploadedImage = document.getElementById('uploadedProfileImage').value;
    const selectedIcon = document.getElementById('selectedProfileIcon').value;
    
    const profileImage = imageType === 'upload' && uploadedImage ? uploadedImage : selectedIcon;
    
    // バリデーション
    if (username.length < 3 || username.length > 20) {
        showToast('ユーザー名は3〜20文字で入力してください', 'error');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showToast('正しいメールアドレスを入力してください', 'error');
        return;
    }
    
    try {
        // ユーザー名・メールの重複チェック（自分以外）
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        
        const duplicateUsername = data.data.find(u => u.username === username && u.id !== MobileApp.currentUser.id);
        const duplicateEmail = data.data.find(u => u.email === email && u.id !== MobileApp.currentUser.id);
        
        if (duplicateUsername) {
            showToast('このユーザー名は既に使用されています', 'error');
            return;
        }
        
        if (duplicateEmail) {
            showToast('このメールアドレスは既に使用されています', 'error');
            return;
        }
        
        // プロフィール更新
        const updateResponse = await fetch(`tables/users/${MobileApp.currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                email: email,
                profile_image: profileImage
            })
        });
        
        if (updateResponse.ok) {
            const updatedUser = await updateResponse.json();
            MobileApp.currentUser = updatedUser;
            
            // UI更新
            updateUserDisplay();
            
            showToast('プロフィールを更新しました', 'success');
            
            // マイページに戻る
            setTimeout(() => {
                showScreen('myPageScreen');
            }, 1500);
        } else {
            showToast('更新に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Basic profile edit error:', error);
        showToast('更新に失敗しました', 'error');
    }
};

// 詳細プロフィール編集処理 ★NEW
window.handleProfileEdit = async function(event) {
    event.preventDefault();
    
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const gender = document.getElementById('editGender').value;
    const ageGroup = document.getElementById('editAgeGroup').value;
    const occupation = document.getElementById('editOccupation').value;
    const prefecture = document.getElementById('editPrefecture').value;
    
    // 興味関心の取得
    const interestCheckboxes = document.querySelectorAll('.edit-interest-checkbox:checked');
    const interests = Array.from(interestCheckboxes).map(cb => cb.value);
    
    // プロフィール完成度チェック
    const profileCompleted = !!(gender && ageGroup && occupation && prefecture && interests.length > 0);
    
    // 以前の状態と比較
    const wasCompleted = MobileApp.currentUser.profile_completed || false;
    const newlyCompleted = !wasCompleted && profileCompleted;
    
    try {
        // ボーナス率を計算（既存の認証ボーナスは維持）
        const phoneBonus = MobileApp.currentUser.phone_verified ? 10 : 0;
        const identityBonus = MobileApp.currentUser.identity_verified ? 10 : 0;
        const profileBonus = profileCompleted ? 10 : 0;
        const totalBonusRate = profileBonus + phoneBonus + identityBonus;
        
        const updateData = {
            gender: gender || '',
            age_group: ageGroup || '',
            occupation: occupation || '',
            prefecture: prefecture || '',
            interests: interests,
            profile_completed: profileCompleted,
            profile_bonus_rate: totalBonusRate
        };
        
        const response = await fetch(`tables/users/${MobileApp.currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            MobileApp.currentUser = updatedUser;
            
            // 新規完成の場合は通知を作成
            if (newlyCompleted) {
                await NotificationSystem.create(updatedUser.id, {
                    title: '🎉 報酬10%アップ達成！',
                    message: 'プロフィールが完成しました！これから全案件の報酬が10%アップします。',
                    type: 'system',
                    icon: 'fa-gift'
                });
                showToast('プロフィール完成！報酬10%アップが適用されました🎉', 'success');
            } else {
                showToast('プロフィールを更新しました', 'success');
            }
            
            // UIを更新
            updateBonusStatus();
            
            // マイページに戻る
            setTimeout(() => {
                showScreen('myPageScreen');
            }, 1500);
        } else {
            showToast('更新に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Profile edit error:', error);
        showToast('更新に失敗しました', 'error');
    }
};

// プロフィール編集画面を開くときに現在の値を設定 ★NEW
// 基本プロフィール編集フォームの読み込み ★NEW
window.loadBasicProfileEditForm = function() {
    if (!MobileApp.currentUser) return;
    
    // ユーザー名とメールアドレスを設定
    document.getElementById('editUsername').value = MobileApp.currentUser.username || '';
    document.getElementById('editEmail').value = MobileApp.currentUser.email || '';
    
    // プロフィールアイコンまたは画像を設定 ★UPDATED
    const currentImage = MobileApp.currentUser.profile_image || 'fa-user';
    const previewIcon = document.getElementById('currentProfileIcon');
    
    // 画像かアイコンかを判定
    if (currentImage.startsWith('data:')) {
        // アップロードされた画像
        document.getElementById('profileImageType').value = 'upload';
        document.getElementById('uploadedProfileImage').value = currentImage;
        previewIcon.innerHTML = `<img src="${currentImage}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
        
        // UI更新
        document.getElementById('profileUploadButtonText').textContent = '画像を変更';
        document.getElementById('clearProfileImageBtn').classList.remove('hidden');
        
        // アイコン選択を解除
        document.querySelectorAll('.profile-icon-option').forEach(btn => {
            btn.classList.remove('border-purple-500', 'bg-purple-900/30');
            btn.classList.add('border-gray-700');
            btn.setAttribute('data-selected', 'false');
        });
    } else {
        // FontAwesomeアイコン
        document.getElementById('profileImageType').value = 'icon';
        document.getElementById('selectedProfileIcon').value = currentImage;
        document.getElementById('uploadedProfileImage').value = '';
        previewIcon.innerHTML = `<i class="fas ${currentImage}"></i>`;
        
        // アイコン選択ボタンの状態を更新
        document.querySelectorAll('.profile-icon-option').forEach(btn => {
            btn.classList.remove('border-purple-500', 'bg-purple-900/30');
            btn.classList.add('border-gray-700');
            btn.setAttribute('data-selected', 'false');
            
            // 現在のアイコンに一致するボタンを選択状態にする
            const btnIcon = btn.querySelector('i');
            if (btnIcon && btnIcon.classList.contains(currentImage)) {
                btn.classList.remove('border-gray-700');
                btn.classList.add('border-purple-500', 'bg-purple-900/30');
                btn.setAttribute('data-selected', 'true');
            }
        });
        
        // アップロード情報をクリア
        document.getElementById('profileImageInfo').classList.add('hidden');
        document.getElementById('clearProfileImageBtn').classList.add('hidden');
    }
};

// 詳細プロフィール編集フォームの読み込み
window.loadProfileEditForm = function() {
    if (!MobileApp.currentUser) return;
    
    document.getElementById('editGender').value = MobileApp.currentUser.gender || '';
    document.getElementById('editAgeGroup').value = MobileApp.currentUser.age_group || '';
    document.getElementById('editOccupation').value = MobileApp.currentUser.occupation || '';
    document.getElementById('editPrefecture').value = MobileApp.currentUser.prefecture || '';
    
    // 興味関心のチェックボックスを設定
    document.querySelectorAll('.edit-interest-checkbox').forEach(cb => {
        cb.checked = false;
    });
    
    if (MobileApp.currentUser.interests && Array.isArray(MobileApp.currentUser.interests)) {
        MobileApp.currentUser.interests.forEach(interest => {
            const checkbox = document.querySelector(`.edit-interest-checkbox[value="${interest}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
};

// ボーナスステータスの表示を更新 ★UPDATED
window.updateBonusStatus = function() {
    if (!MobileApp.currentUser) return;
    
    const bonusCard = document.getElementById('bonusStatusCard');
    if (bonusCard) bonusCard.style.display = 'block';
    
    // 総ボーナス率（プロフィール + 紹介 + 認証） ★UPDATED
    const profileBonus = MobileApp.currentUser.profile_bonus_rate || 0;
    const referralBonus = MobileApp.currentUser.referral_bonus_rate || 0;
    const phoneBonus = MobileApp.currentUser.phone_verified ? 10 : 0;
    const identityBonus = MobileApp.currentUser.identity_verified ? 10 : 0;
    const totalBonus = profileBonus + referralBonus + phoneBonus + identityBonus;
    
    const totalBonusEl = document.getElementById('totalBonusRate');
    if (totalBonusEl) {
        totalBonusEl.textContent = `+${totalBonus}%`;
        if (totalBonus > 0) {
            totalBonusEl.classList.add('text-yellow-400');
        }
    }
    
    // プロフィール完成ステータス
    const profileStatus = document.getElementById('profileBonusStatus');
    if (profileStatus) {
        if (MobileApp.currentUser.profile_completed) {
            profileStatus.textContent = '完了 +10%';
            profileStatus.className = 'text-green-400 font-bold';
        } else {
            profileStatus.textContent = '未完了';
            profileStatus.className = 'text-gray-500';
        }
    }
    
    // 友達紹介ステータス ★NEW
    const referralStatus = document.getElementById('referralBonusStatus');
    if (referralStatus) {
        const referralCount = MobileApp.currentUser.total_referrals || 0;
        const referralRate = MobileApp.currentUser.referral_bonus_rate || 0;
        if (referralCount > 0) {
            referralStatus.textContent = `${referralCount}人 (+${referralRate}%)`;
            referralStatus.className = 'text-green-400 font-bold';
            if (referralCount >= 5) {
                referralStatus.textContent += ' ⭐最大';
            }
        } else {
            referralStatus.textContent = '0人 (0%)';
            referralStatus.className = 'text-gray-500';
        }
    }
    
    // 電話認証ステータス
    const phoneStatus = document.getElementById('phoneBonusStatus');
    if (phoneStatus) {
        if (MobileApp.currentUser.phone_verified) {
            phoneStatus.textContent = '認証済 +10%';
            phoneStatus.className = 'text-green-400 font-bold';
        } else {
            phoneStatus.textContent = '未認証';
            phoneStatus.className = 'text-gray-500';
        }
    }
    
    // 本人確認ステータス
    const identityStatus = document.getElementById('identityBonusStatus');
    if (identityStatus) {
        if (MobileApp.currentUser.identity_verified) {
            identityStatus.textContent = '確認済 +10%';
            identityStatus.className = 'text-green-400 font-bold';
        } else {
            identityStatus.textContent = '未確認';
            identityStatus.className = 'text-gray-500';
        }
    }
    
    // プロフィール未完了バッジの表示
    const badge = document.getElementById('profileIncompleteBadge');
    if (badge) {
        badge.style.display = MobileApp.currentUser.profile_completed ? 'none' : 'inline-block';
    }
};

// ログアウト処理
window.logout = function() {
    if (!confirm('ログアウトしますか？')) return;
    
    // 状態をクリア
    MobileApp.currentUser = null;
    MobileApp.isLoggedIn = false;
    localStorage.removeItem('currentUserId');
    
    showToast('ログアウトしました', 'success');
    
    // ログイン画面に遷移
    showScreen('loginScreen');
    
    // UIをリセット
    document.getElementById('pointsSection').classList.add('hidden');
    document.getElementById('adminSection').style.display = 'none';
};

// 退会処理
window.confirmDeleteAccount = function() {
    if (!MobileApp.currentUser) return;
    
    const confirmation = prompt(
        '本当に退会しますか？\n' +
        '退会すると、すべてのポイントと履歴が削除されます。\n\n' +
        '退会する場合は「退会する」と入力してください。'
    );
    
    if (confirmation === '退会する') {
        deleteAccount();
    } else if (confirmation) {
        showToast('入力が正しくありません', 'error');
    }
};

// アカウント削除実行
async function deleteAccount() {
    if (!MobileApp.currentUser) return;
    
    try {
        const response = await fetch(`tables/users/${MobileApp.currentUser.id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('退会処理が完了しました', 'success');
            
            // ログアウト
            setTimeout(() => {
                logout();
            }, 1500);
        } else {
            showToast('退会処理に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Delete account error:', error);
        showToast('退会処理に失敗しました', 'error');
    }
}

// localStorageからログイン状態を復元
async function restoreLoginState() {
    const userId = localStorage.getItem('currentUserId');
    
    if (userId) {
        try {
            const response = await fetch(`tables/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                MobileApp.currentUser = user;
                MobileApp.isLoggedIn = true;
                
                document.getElementById('pointsSection').classList.remove('hidden');
                updateUserDisplay();
                await loadPointHistory();
                await loadAchievements();
                renderAchievements();
                updateNotificationBadge();
                updateEmailVerificationBadge();
                checkAdminAccess();
                
                return true;
            } else {
                // ユーザーが見つからない場合はログアウト
                localStorage.removeItem('currentUserId');
            }
        } catch (error) {
            console.error('Restore login error:', error);
        }
    }
    
    return false;
}

// 管理者アカウントを作成（初回のみ）
async function createAdminAccount() {
    try {
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        
        const adminExists = data.data.find(u => u.username === 'admin');
        
        if (!adminExists) {
            const adminUser = {
                username: 'admin',
                email: 'admin@pointshiba.com',
                password: 'admin',
                total_points: 999999,
                available_points: 999999,
                rank_points: 999999,
                current_rank: 'ダイヤモンド',
                consecutive_login_days: 999,
                last_login_date: new Date().toISOString().split('T')[0],
                total_referrals: 0,
                profile_image: '',
                referral_code: 'PMADMIN00'
            };
            
            await fetch('tables/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminUser)
            });
            
            console.log('✅ 管理者アカウント作成完了');
        }
        
        // デモユーザーも作成
        const demoExists = data.data.find(u => u.username === 'demo');
        
        if (!demoExists) {
            const demoUser = {
                username: 'demo',
                email: 'demo@pointshiba.com',
                password: 'demo',
                total_points: 5000,
                available_points: 5000,
                rank_points: 5000,
                current_rank: 'ゴールド',
                consecutive_login_days: 10,
                last_login_date: new Date().toISOString().split('T')[0],
                total_referrals: 3,
                profile_image: '',
                referral_code: ReferralSystem.generateReferralCode('demo')
            };
            
            await fetch('tables/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoUser)
            });
            
            console.log('✅ デモアカウント作成完了');
        }
    } catch (error) {
        console.error('Create admin account error:', error);
    }
}

// ========================================
// メールアドレス認証機能 ★NEW
// ========================================

// メール認証画面の初期化
window.loadEmailVerificationScreen = function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('loginScreen');
        return;
    }
    
    // 現在のメールアドレスを表示
    document.getElementById('verifyEmail').value = MobileApp.currentUser.email;
    document.getElementById('verifiedEmailDisplay').textContent = MobileApp.currentUser.email;
    
    // 認証済みかチェック
    if (MobileApp.currentUser.email_verified) {
        document.getElementById('emailVerifiedSection').classList.remove('hidden');
        document.getElementById('emailUnverifiedSection').classList.add('hidden');
    } else {
        document.getElementById('emailVerifiedSection').classList.add('hidden');
        document.getElementById('emailUnverifiedSection').classList.remove('hidden');
        document.getElementById('emailVerifyCodeSection').classList.add('hidden');
    }
};

// メール認証コード送信
window.handleEmailVerification = async function(event) {
    event.preventDefault();
    
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const email = document.getElementById('verifyEmail').value.trim();
    
    if (email !== MobileApp.currentUser.email) {
        showToast('登録済みのメールアドレスと一致しません', 'error');
        return;
    }
    
    try {
        // 認証コードを生成（6桁英数字）
        const verifyCode = generateResetCode(); // 既存のリセットコード生成関数を再利用
        
        // localStorageに保存（デモ環境用）
        localStorage.setItem('emailVerifyCode', verifyCode);
        localStorage.setItem('emailVerifyEmail', email);
        localStorage.setItem('emailVerifyCodeExpiry', Date.now() + 15 * 60 * 1000); // 15分有効
        
        // 認証コード入力セクションを表示
        document.getElementById('emailVerifyCodeSection').classList.remove('hidden');
        document.getElementById('demoVerifyCode').textContent = verifyCode;
        
        // フォームを無効化
        document.getElementById('verifyEmail').disabled = true;
        event.target.querySelector('button[type="submit"]').disabled = true;
        
        showToast('認証コードを発行しました', 'success');
        
        // 実環境では、ここでメール送信APIを呼び出す
        // await sendVerifyCodeEmail(email, verifyCode);
        
    } catch (error) {
        console.error('Email verification error:', error);
        showToast('認証コードの発行に失敗しました', 'error');
    }
};

// メール認証確認
window.handleEmailVerificationConfirm = async function(event) {
    event.preventDefault();
    
    const inputCode = document.getElementById('verifyCode').value.trim().toUpperCase();
    const storedCode = localStorage.getItem('emailVerifyCode');
    const storedEmail = localStorage.getItem('emailVerifyEmail');
    const expiry = localStorage.getItem('emailVerifyCodeExpiry');
    
    // バリデーション
    if (!storedCode || !storedEmail) {
        showToast('認証コードが見つかりません。最初からやり直してください。', 'error');
        return;
    }
    
    // 有効期限チェック
    if (Date.now() > parseInt(expiry)) {
        localStorage.removeItem('emailVerifyCode');
        localStorage.removeItem('emailVerifyEmail');
        localStorage.removeItem('emailVerifyCodeExpiry');
        showToast('認証コードの有効期限が切れました', 'error');
        return;
    }
    
    // コード検証
    if (inputCode !== storedCode) {
        showToast('認証コードが正しくありません', 'error');
        return;
    }
    
    try {
        // メールアドレスを認証済みに更新
        const updateResponse = await fetch(`tables/users/${MobileApp.currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email_verified: true 
            })
        });
        
        if (updateResponse.ok) {
            const updatedUser = await updateResponse.json();
            MobileApp.currentUser = updatedUser;
            
            // リセットコード情報をクリア
            localStorage.removeItem('emailVerifyCode');
            localStorage.removeItem('emailVerifyEmail');
            localStorage.removeItem('emailVerifyCodeExpiry');
            
            // 通知を作成
            await NotificationSystem.create(updatedUser.id, {
                title: '✅ メールアドレス認証完了',
                message: 'メールアドレスの認証が完了しました！アンケートに参加できるようになりました。',
                type: 'system',
                icon: 'fa-envelope-open-text'
            });
            
            showToast('メールアドレスの認証が完了しました！', 'success');
            
            // UI更新
            updateEmailVerificationBadge();
            
            // フォームをリセット
            document.getElementById('emailVerificationForm').reset();
            document.getElementById('emailVerificationConfirmForm').reset();
            document.getElementById('emailVerifyCodeSection').classList.add('hidden');
            document.getElementById('verifyEmail').disabled = false;
            document.querySelector('#emailVerificationForm button[type="submit"]').disabled = false;
            
            // 認証済み表示に切り替え
            setTimeout(() => {
                loadEmailVerificationScreen();
            }, 2000);
        } else {
            showToast('認証に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Email verification confirm error:', error);
        showToast('認証に失敗しました', 'error');
    }
};

// メール認証バッジの更新
function updateEmailVerificationBadge() {
    const badge = document.getElementById('emailVerifiedBadge');
    if (badge && MobileApp.currentUser) {
        if (MobileApp.currentUser.email_verified) {
            badge.textContent = '認証済';
            badge.className = 'bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold';
        } else {
            badge.textContent = '未認証';
            badge.className = 'bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold';
        }
    }
    
    // 電話番号認証バッジも更新
    const phoneBadge = document.getElementById('phoneVerifiedBadge');
    if (phoneBadge && MobileApp.currentUser) {
        if (MobileApp.currentUser.phone_verified) {
            phoneBadge.textContent = '認証済';
            phoneBadge.className = 'bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold';
        } else {
            phoneBadge.textContent = '未認証';
            phoneBadge.className = 'bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold';
        }
    }
}

// ========================================
// パスワードリセット機能
// ========================================

// リセットコード生成（6桁英数字）
function generateResetCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// パスワードリセット要求処理
window.handlePasswordReset = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showToast('メールアドレスを入力してください', 'error');
        return;
    }
    
    try {
        // ユーザー検索
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        const user = data.data.find(u => u.email === email);
        
        if (!user) {
            showToast('このメールアドレスは登録されていません', 'error');
            return;
        }
        
        // リセットコードを生成
        const resetCode = generateResetCode();
        
        // デモ環境用: localStorageに保存
        localStorage.setItem('resetCode', resetCode);
        localStorage.setItem('resetEmail', email);
        localStorage.setItem('resetCodeExpiry', Date.now() + 15 * 60 * 1000); // 15分有効
        
        // リセットコード入力セクションを表示
        document.getElementById('resetCodeSection').classList.remove('hidden');
        document.getElementById('demoResetCode').textContent = resetCode;
        
        // フォームを無効化
        document.getElementById('resetEmail').disabled = true;
        event.target.querySelector('button[type="submit"]').disabled = true;
        
        showToast('リセットコードを発行しました', 'success');
        
        // 実環境では、ここでメール送信APIを呼び出す
        // await sendResetCodeEmail(email, resetCode);
        
    } catch (error) {
        console.error('Password reset error:', error);
        showToast('リセットコードの発行に失敗しました', 'error');
    }
};

// パスワードリセット確認処理
window.handlePasswordResetConfirm = async function(event) {
    event.preventDefault();
    
    const inputCode = document.getElementById('resetCode').value.trim().toUpperCase();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('newPasswordConfirm').value;
    
    const storedCode = localStorage.getItem('resetCode');
    const storedEmail = localStorage.getItem('resetEmail');
    const expiry = localStorage.getItem('resetCodeExpiry');
    
    // バリデーション
    if (!storedCode || !storedEmail) {
        showToast('リセットコードが見つかりません。最初からやり直してください。', 'error');
        return;
    }
    
    // 有効期限チェック
    if (Date.now() > parseInt(expiry)) {
        localStorage.removeItem('resetCode');
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetCodeExpiry');
        showToast('リセットコードの有効期限が切れました', 'error');
        return;
    }
    
    // コード検証
    if (inputCode !== storedCode) {
        showToast('リセットコードが正しくありません', 'error');
        return;
    }
    
    // パスワード一致確認
    if (newPassword !== confirmPassword) {
        showToast('パスワードが一致しません', 'error');
        return;
    }
    
    // パスワード強度チェック ★UPDATED
    if (newPassword.length < 8) {
        showToast('パスワードは8文字以上で入力してください', 'error');
        return;
    }
    
    // 基本的な強度要件をチェック
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
        showToast('パスワードは大文字、小文字、数字を含む必要があります', 'error');
        return;
    }
    
    try {
        // ユーザー取得
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        const user = data.data.find(u => u.email === storedEmail);
        
        if (!user) {
            showToast('ユーザーが見つかりません', 'error');
            return;
        }
        
        // パスワード更新
        const updateResponse = await fetch(`tables/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        
        if (updateResponse.ok) {
            // リセットコード情報をクリア
            localStorage.removeItem('resetCode');
            localStorage.removeItem('resetEmail');
            localStorage.removeItem('resetCodeExpiry');
            
            showToast('パスワードが変更されました！ログイン画面に移動します', 'success');
            
            // フォームをリセット
            document.getElementById('passwordResetForm').reset();
            document.getElementById('passwordResetConfirmForm').reset();
            document.getElementById('resetCodeSection').classList.add('hidden');
            document.getElementById('resetEmail').disabled = false;
            document.querySelector('#passwordResetForm button[type="submit"]').disabled = false;
            
            // ログイン画面に遷移
            setTimeout(() => {
                showScreen('loginScreen');
            }, 2000);
        } else {
            showToast('パスワードの変更に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Password reset confirm error:', error);
        showToast('パスワードの変更に失敗しました', 'error');
    }
};

// ========================================
// パスワード強度チェッカー ★NEW
// ========================================

window.checkPasswordStrength = function(passwordInputId, strengthContainerId) {
    const password = document.getElementById(passwordInputId).value;
    const container = document.getElementById(strengthContainerId);
    
    // パスワードが空なら非表示
    if (password.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    // プレフィックスを決定（register または reset）
    const prefix = strengthContainerId.includes('register') ? 'register' : 'reset';
    
    // 各要件をチェック
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    // 要件の表示を更新
    updateRequirement(`${prefix}Req1`, requirements.length);
    updateRequirement(`${prefix}Req2`, requirements.uppercase);
    updateRequirement(`${prefix}Req3`, requirements.lowercase);
    updateRequirement(`${prefix}Req4`, requirements.number);
    updateRequirement(`${prefix}Req5`, requirements.special);
    
    // 強度を計算
    let strength = 0;
    if (requirements.length) strength += 25;
    if (requirements.uppercase) strength += 20;
    if (requirements.lowercase) strength += 20;
    if (requirements.number) strength += 20;
    if (requirements.special) strength += 15;
    
    // プログレスバーとラベルを更新
    const strengthBar = document.getElementById(`${prefix}PasswordStrengthBar`);
    const strengthLabel = document.getElementById(`${prefix}PasswordStrengthLabel`);
    
    strengthBar.style.width = `${strength}%`;
    
    if (strength < 40) {
        // 弱い
        strengthBar.style.backgroundColor = '#ef4444'; // red-500
        strengthLabel.textContent = '弱い';
        strengthLabel.className = 'text-xs font-bold text-red-400';
    } else if (strength < 75) {
        // 普通
        strengthBar.style.backgroundColor = '#f59e0b'; // amber-500
        strengthLabel.textContent = '普通';
        strengthLabel.className = 'text-xs font-bold text-amber-400';
    } else {
        // 強い
        strengthBar.style.backgroundColor = '#10b981'; // green-500
        strengthLabel.textContent = '強い';
        strengthLabel.className = 'text-xs font-bold text-green-400';
    }
};

// 要件チェック表示を更新する補助関数
function updateRequirement(elementId, isMet) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const icon = element.querySelector('i');
    
    if (isMet) {
        element.classList.remove('text-gray-500');
        element.classList.add('text-green-400');
        icon.classList.remove('fa-circle');
        icon.classList.add('fa-check-circle');
    } else {
        element.classList.remove('text-green-400');
        element.classList.add('text-gray-500');
        icon.classList.remove('fa-check-circle');
        icon.classList.add('fa-circle');
    }
}

console.log('✅ UI追加実装完了:');
console.log('  - 通知システムUI（通知画面、バッジ、アイコン）');
console.log('  - レビュー・評価システムUI（星評価、コメント投稿、一覧表示）');
console.log('✅ 認証機能実装完了:');
console.log('  - ログイン・ログアウト機能');
console.log('  - 新規登録機能');
console.log('  - パスワードリセット機能（6桁コード、15分有効期限）🆕');
console.log('  - 退会機能');
console.log('  - 管理者アカウント自動作成');
console.log('✅ パスワード強度チェッカー実装完了 🆕');
console.log('  - リアルタイム強度表示（弱い/普通/強い）');
console.log('  - 5つの要件チェック（8文字以上、大小文字、数字、特殊文字）');
console.log('  - 視覚的プログレスバー（色分け）');
console.log('  - 登録画面とリセット画面に対応');

// ========================================
// Firebase Authentication 統合 ★NEW
// ========================================

// 電話番号認証画面の初期化
window.loadPhoneVerificationScreen = function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('loginScreen');
        return;
    }
    
    // 認証済みかチェック
    if (MobileApp.currentUser.phone_verified) {
        document.getElementById('phoneVerifiedSection').classList.remove('hidden');
        document.getElementById('phoneUnverifiedSection').classList.add('hidden');
        document.getElementById('verifiedPhoneDisplay').textContent = MobileApp.currentUser.phone_number || '****';
    } else {
        document.getElementById('phoneVerifiedSection').classList.add('hidden');
        document.getElementById('phoneUnverifiedSection').classList.remove('hidden');
        document.getElementById('phoneVerifyCodeSection').classList.add('hidden');
    }
    
    // reCAPTCHA の初期化（Firebase使用時）
    if (typeof firebase !== 'undefined' && firebase.auth) {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                }
            });
        }
    }
};

// 電話番号認証 - SMS送信
window.handlePhoneVerification = async function(event) {
    event.preventDefault();
    
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const phoneNumber = document.getElementById('phoneNumber').value.trim().replace(/\s/g, '');
    const fullPhoneNumber = '+81' + phoneNumber;
    
    // 電話番号バリデーション
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
        showToast('正しい電話番号を入力してください', 'error');
        return;
    }
    
    try {
        // Firebase Phone Auth 使用
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await firebase.auth().signInWithPhoneNumber(fullPhoneNumber, appVerifier);
            
            // 確認結果を保存
            window.confirmationResult = confirmationResult;
            
            // コード入力セクションを表示
            document.getElementById('phoneVerifyCodeSection').classList.remove('hidden');
            document.getElementById('phoneNumber').disabled = true;
            event.target.querySelector('button[type="submit"]').disabled = true;
            
            showToast('SMSを送信しました', 'success');
        } else {
            // Firebase未初期化の場合はデモモード
            console.warn('Firebase未初期化 - デモモードで動作');
            showToast('【デモ】SMSを送信しました（コード: 123456）', 'success');
            document.getElementById('phoneVerifyCodeSection').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Phone verification error:', error);
        showToast('SMS送信に失敗しました: ' + error.message, 'error');
        
        // reCAPTCHA をリセット
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
    }
};

// 電話番号認証 - コード確認
window.handlePhoneVerificationConfirm = async function(event) {
    event.preventDefault();
    
    const code = document.getElementById('phoneVerifyCode').value.trim();
    
    if (!/^[0-9]{6}$/.test(code)) {
        showToast('6桁の数字を入力してください', 'error');
        return;
    }
    
    try {
        if (window.confirmationResult) {
            // Firebase で確認
            await window.confirmationResult.confirm(code);
            
            // ユーザーデータを更新
            const updateResponse = await fetch(`tables/users/${MobileApp.currentUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_verified: true,
                    phone_number: '+81' + document.getElementById('phoneNumber').value.trim().replace(/\s/g, '')
                })
            });
            
            if (updateResponse.ok) {
                const updatedUser = await updateResponse.json();
                MobileApp.currentUser = updatedUser;
                
                await NotificationSystem.create(updatedUser.id, {
                    title: '✅ 電話番号認証完了',
                    message: '電話番号の認証が完了しました！全てのアンケートに参加できます。',
                    type: 'system',
                    icon: 'fa-mobile-alt'
                });
                
                showToast('電話番号の認証が完了しました！', 'success');
                updatePhoneVerificationBadge();
                
                setTimeout(() => {
                    loadPhoneVerificationScreen();
                }, 2000);
            }
        } else {
            // デモモード
            if (code === '123456') {
                const updateResponse = await fetch(`tables/users/${MobileApp.currentUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone_verified: true,
                        phone_number: '+81' + document.getElementById('phoneNumber').value.trim().replace(/\s/g, '')
                    })
                });
                
                if (updateResponse.ok) {
                    const updatedUser = await updateResponse.json();
                    MobileApp.currentUser = updatedUser;
                    
                    showToast('【デモ】電話番号の認証が完了しました！', 'success');
                    updatePhoneVerificationBadge();
                    
                    setTimeout(() => {
                        loadPhoneVerificationScreen();
                    }, 2000);
                }
            } else {
                showToast('認証コードが正しくありません', 'error');
            }
        }
    } catch (error) {
        console.error('Phone verification confirm error:', error);
        showToast('認証に失敗しました: ' + error.message, 'error');
    }
};

// SMS再送信
window.resendPhoneSMS = async function() {
    document.getElementById('phoneNumber').disabled = false;
    document.querySelector('#phoneVerificationForm button[type="submit"]').disabled = false;
    document.getElementById('phoneVerifyCodeSection').classList.add('hidden');
    document.getElementById('phoneVerifyCode').value = '';
    
    // reCAPTCHA をリセット
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
    
    showToast('もう一度電話番号を入力してください', 'info');
};

// 電話番号認証バッジの更新
function updatePhoneVerificationBadge() {
    const badge = document.getElementById('phoneVerifiedBadge');
    if (badge && MobileApp.currentUser) {
        if (MobileApp.currentUser.phone_verified) {
            badge.textContent = '認証済';
            badge.className = 'bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold';
        } else {
            badge.textContent = '未認証';
            badge.className = 'bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold';
        }
    }
}

// ソーシャルログイン
window.handleSocialLogin = async function(provider) {
    try {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            showToast('【デモ】' + provider.toUpperCase() + ' ログイン（Firebase未設定）', 'info');
            // デモモードでアカウント作成
            await createDemoSocialAccount(provider);
            return;
        }
        
        let authProvider;
        
        switch (provider) {
            case 'google':
                authProvider = new firebase.auth.GoogleAuthProvider();
                break;
            case 'facebook':
                authProvider = new firebase.auth.FacebookAuthProvider();
                break;
            case 'twitter':
                authProvider = new firebase.auth.TwitterAuthProvider();
                break;
            case 'line':
                showToast('LINE ログインは準備中です', 'info');
                return;
            default:
                showToast('未対応のプロバイダーです', 'error');
                return;
        }
        
        // Firebase でログイン
        const result = await firebase.auth().signInWithPopup(authProvider);
        const user = result.user;
        
        // ユーザー情報を取得または作成
        await handleFirebaseUser(user, provider);
        
    } catch (error) {
        console.error('Social login error:', error);
        showToast('ログインに失敗しました: ' + error.message, 'error');
    }
};

// Firebase ユーザーの処理
async function handleFirebaseUser(firebaseUser, provider) {
    try {
        // 既存ユーザーをメールアドレスで検索
        const response = await fetch('tables/users?limit=1000');
        const data = await response.json();
        const existingUser = data.data.find(u => u.email === firebaseUser.email);
        
        if (existingUser) {
            // 既存ユーザーでログイン
            MobileApp.currentUser = existingUser;
            MobileApp.isLoggedIn = true;
            localStorage.setItem('currentUserId', existingUser.id);
            
            showToast(`おかえりなさい、${existingUser.username}さん！`, 'success');
            showScreen('homeScreen');
            updateUserDisplay();
        } else {
            // 新規ユーザー作成
            const newUser = {
                username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                password: 'social_login_' + Date.now(), // ダミーパスワード
                total_points: 0,
                available_points: 0,
                rank: 'ブロンズ',
                rank_points: 0,
                consecutive_login_days: 1,
                last_login_date: new Date().toISOString().split('T')[0],
                total_referrals: 0,
                profile_image: firebaseUser.photoURL || 'fa-user',
                referral_code: generateReferralCode(),
                email_verified: firebaseUser.emailVerified,
                phone_verified: false,
                social_provider: provider
            };
            
            const createResponse = await fetch('tables/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            
            if (createResponse.ok) {
                const createdUser = await createResponse.json();
                MobileApp.currentUser = createdUser;
                MobileApp.isLoggedIn = true;
                localStorage.setItem('currentUserId', createdUser.id);
                
                // ウェルカムボーナス
                await addPoints(createdUser.id, 300, '新規登録ボーナス', 'ボーナス');
                
                showToast(`ようこそ、${createdUser.username}さん！`, 'success');
                showScreen('homeScreen');
                updateUserDisplay();
            }
        }
    } catch (error) {
        console.error('Handle firebase user error:', error);
        showToast('ユーザー処理に失敗しました', 'error');
    }
}

// デモソーシャルアカウント作成
async function createDemoSocialAccount(provider) {
    const demoEmail = `demo_${provider}_${Date.now()}@example.com`;
    const demoUsername = `${provider}_user_${Math.random().toString(36).substr(2, 6)}`;
    
    const newUser = {
        username: demoUsername,
        email: demoEmail,
        password: 'demo_social_' + Date.now(),
        total_points: 0,
        available_points: 0,
        rank: 'ブロンズ',
        rank_points: 0,
        consecutive_login_days: 1,
        last_login_date: new Date().toISOString().split('T')[0],
        total_referrals: 0,
        profile_image: 'fa-user',
        referral_code: generateReferralCode(),
        email_verified: true,
        phone_verified: false,
        social_provider: provider
    };
    
    const createResponse = await fetch('tables/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });
    
    if (createResponse.ok) {
        const createdUser = await createResponse.json();
        MobileApp.currentUser = createdUser;
        MobileApp.isLoggedIn = true;
        localStorage.setItem('currentUserId', createdUser.id);
        
        await addPoints(createdUser.id, 300, '新規登録ボーナス', 'ボーナス');
        
        showToast(`【デモ】${provider.toUpperCase()}でログインしました！`, 'success');
        showScreen('homeScreen');
        updateUserDisplay();
    }
}

console.log('✅ Firebase Authentication 統合完了 🆕');
console.log('  - 電話番号認証（SMS）- Firebase Phone Auth');
console.log('  - ソーシャルログイン（Google, Facebook, X）');
console.log('  - デモモード対応（Firebase未設定時）');
console.log('  - 既存システムとの統合');
