// ========================================
// PointMax - メインアプリケーションロジック
// ========================================

// グローバル状態管理
const AppState = {
    currentUser: null,
    cases: [],
    pointHistory: [],
    exchangeHistory: [],
    achievements: [],
    isLoggedIn: false
};

// ランク設定
const RANK_THRESHOLDS = {
    'ブロンズ': 0,
    'シルバー': 1000,
    'ゴールド': 5000,
    'プラチナ': 15000,
    'ダイヤモンド': 50000
};

const RANK_MULTIPLIERS = {
    'ブロンズ': 1.0,
    'シルバー': 1.1,
    'ゴールド': 1.2,
    'プラチナ': 1.3,
    'ダイヤモンド': 1.5
};

// 実績定義
const ACHIEVEMENT_DEFINITIONS = [
    { name: '初めての一歩', type: 'ポイント獲得', description: '初めてポイントを獲得する', icon: 'fa-star', threshold: 1, bonus_points: 100 },
    { name: 'コツコツ貯蓄家', type: 'ポイント獲得', description: '累計1,000ポイント獲得', icon: 'fa-coins', threshold: 1000, bonus_points: 200 },
    { name: 'ポイントマスター', type: 'ポイント獲得', description: '累計10,000ポイント獲得', icon: 'fa-trophy', threshold: 10000, bonus_points: 1000 },
    { name: '毎日ログイン', type: 'ログイン', description: '7日連続ログイン', icon: 'fa-calendar-check', threshold: 7, bonus_points: 300 },
    { name: '習慣化成功', type: 'ログイン', description: '30日連続ログイン', icon: 'fa-fire', threshold: 30, bonus_points: 1500 },
    { name: '初めての交換', type: '交換', description: 'ポイントを初めて交換する', icon: 'fa-exchange-alt', threshold: 1, bonus_points: 150 },
    { name: '友達の輪', type: '紹介', description: '友達を5人紹介する', icon: 'fa-users', threshold: 5, bonus_points: 500 },
    { name: 'インフルエンサー', type: '紹介', description: '友達を20人紹介する', icon: 'fa-bullhorn', threshold: 20, bonus_points: 3000 }
];

// ========================================
// ユーティリティ関数
// ========================================

// トースト通知を表示
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle text-2xl text-green-400';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle text-2xl text-red-400';
    } else if (type === 'info') {
        icon.className = 'fas fa-info-circle text-2xl text-blue-400';
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 数値をカンマ区切りでフォーマット
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ランクを計算
function calculateRank(rankPoints) {
    if (rankPoints >= RANK_THRESHOLDS['ダイヤモンド']) return 'ダイヤモンド';
    if (rankPoints >= RANK_THRESHOLDS['プラチナ']) return 'プラチナ';
    if (rankPoints >= RANK_THRESHOLDS['ゴールド']) return 'ゴールド';
    if (rankPoints >= RANK_THRESHOLDS['シルバー']) return 'シルバー';
    return 'ブロンズ';
}

// 次のランクまでのポイントを計算
function getPointsToNextRank(currentRank, rankPoints) {
    const ranks = ['ブロンズ', 'シルバー', 'ゴールド', 'プラチナ', 'ダイヤモンド'];
    const currentIndex = ranks.indexOf(currentRank);
    
    if (currentIndex === ranks.length - 1) {
        return 0; // 最高ランク
    }
    
    const nextRank = ranks[currentIndex + 1];
    const nextThreshold = RANK_THRESHOLDS[nextRank];
    return nextThreshold - rankPoints;
}

// ランクバッジのHTMLを生成
function getRankBadgeHTML(rank) {
    const rankClasses = {
        'ブロンズ': 'rank-bronze',
        'シルバー': 'rank-silver',
        'ゴールド': 'rank-gold',
        'プラチナ': 'rank-platinum',
        'ダイヤモンド': 'rank-diamond'
    };
    
    return `<div class="rank-badge ${rankClasses[rank]}">
        <i class="fas fa-medal"></i>
        <span>${rank}会員</span>
    </div>`;
}

// ========================================
// API関数
// ========================================

// 案件を取得
async function fetchCases() {
    try {
        const response = await fetch('tables/cases?limit=100');
        const data = await response.json();
        AppState.cases = data.data;
        return data.data;
    } catch (error) {
        console.error('案件の取得に失敗しました:', error);
        return [];
    }
}

// ユーザーを作成または取得
async function getOrCreateUser(username, email) {
    try {
        // ユーザーが既に存在するか確認
        const response = await fetch(`tables/users?search=${email}`);
        const data = await response.json();
        
        if (data.data.length > 0) {
            return data.data[0];
        }
        
        // 新規ユーザーを作成
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
        console.error('ユーザーの取得/作成に失敗しました:', error);
        return null;
    }
}

// ポイント履歴を追加
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
        console.error('ポイント履歴の追加に失敗しました:', error);
        return null;
    }
}

// ユーザーのポイント履歴を取得
async function fetchPointHistory(userId) {
    try {
        const response = await fetch(`tables/point_history?limit=100`);
        const data = await response.json();
        return data.data.filter(h => h.user_id === userId);
    } catch (error) {
        console.error('ポイント履歴の取得に失敗しました:', error);
        return [];
    }
}

// ユーザーを更新
async function updateUser(userId, updates) {
    try {
        const response = await fetch(`tables/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        return await response.json();
    } catch (error) {
        console.error('ユーザーの更新に失敗しました:', error);
        return null;
    }
}

// ポイント交換を作成
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
        console.error('交換履歴の作成に失敗しました:', error);
        return null;
    }
}

// ユーザーの交換履歴を取得
async function fetchExchangeHistory(userId) {
    try {
        const response = await fetch(`tables/exchange_history?limit=100`);
        const data = await response.json();
        return data.data.filter(e => e.user_id === userId);
    } catch (error) {
        console.error('交換履歴の取得に失敗しました:', error);
        return [];
    }
}

// 交換コードを生成
function generateExchangeCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i < 11) code += '-';
    }
    return code;
}

// デイリーボーナスを受け取る
async function claimDailyBonus(userId, dayNumber) {
    const bonusPoints = [10, 20, 30, 50, 100, 150, 500];
    const points = bonusPoints[dayNumber - 1] || 10;
    
    try {
        // ボーナスレコードを作成
        const bonusEntry = {
            user_id: userId,
            day_number: dayNumber,
            bonus_points: points
        };
        
        await fetch('tables/daily_bonuses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bonusEntry)
        });
        
        // ポイントを追加
        await addPointHistory(userId, points, 'デイリー', `デイリーログインボーナス Day ${dayNumber}`);
        
        // ユーザーポイントを更新
        const updatedUser = await updateUser(userId, {
            total_points: AppState.currentUser.total_points + points,
            available_points: AppState.currentUser.available_points + points,
            rank_points: AppState.currentUser.rank_points + points
        });
        
        if (updatedUser) {
            AppState.currentUser = updatedUser;
            updateUserDisplay();
            showToast(`デイリーボーナス ${points}pt を獲得しました！`, 'success');
        }
        
        return points;
    } catch (error) {
        console.error('デイリーボーナスの受け取りに失敗しました:', error);
        return 0;
    }
}

// 実績をチェック
async function checkAchievements(userId) {
    const unlockedAchievements = [];
    
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
        let currentValue = 0;
        
        switch (achievement.type) {
            case 'ポイント獲得':
                currentValue = AppState.currentUser.total_points;
                break;
            case 'ログイン':
                currentValue = AppState.currentUser.consecutive_login_days;
                break;
            case '交換':
                currentValue = AppState.exchangeHistory.length;
                break;
            case '紹介':
                currentValue = AppState.currentUser.total_referrals;
                break;
        }
        
        if (currentValue >= achievement.threshold) {
            // 既に解除済みかチェック
            const existingResponse = await fetch(`tables/achievements?limit=100`);
            const existingData = await existingResponse.json();
            const existing = existingData.data.find(a => 
                a.user_id === userId && a.achievement_name === achievement.name
            );
            
            if (!existing) {
                // 実績を解除
                const achievementEntry = {
                    user_id: userId,
                    achievement_name: achievement.name,
                    achievement_type: achievement.type,
                    description: achievement.description,
                    icon: achievement.icon,
                    bonus_points: achievement.bonus_points,
                    is_unlocked: true
                };
                
                await fetch('tables/achievements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(achievementEntry)
                });
                
                // ボーナスポイントを付与
                await addPointHistory(userId, achievement.bonus_points, 'ボーナス', `実績解除: ${achievement.name}`);
                await updateUser(userId, {
                    total_points: AppState.currentUser.total_points + achievement.bonus_points,
                    available_points: AppState.currentUser.available_points + achievement.bonus_points,
                    rank_points: AppState.currentUser.rank_points + achievement.bonus_points
                });
                
                unlockedAchievements.push(achievement);
            }
        }
    }
    
    return unlockedAchievements;
}

// ========================================
// UI更新関数
// ========================================

// ユーザー表示を更新
function updateUserDisplay() {
    if (!AppState.currentUser) return;
    
    document.getElementById('userName').textContent = AppState.currentUser.username;
    document.getElementById('totalPoints').textContent = formatNumber(AppState.currentUser.available_points);
    document.getElementById('totalPointsYen').textContent = formatNumber(AppState.currentUser.available_points);
    document.getElementById('rankPoints').textContent = formatNumber(AppState.currentUser.rank_points);
    
    // ランク表示を更新
    const newRank = calculateRank(AppState.currentUser.rank_points);
    const rankBadgeElement = document.getElementById('userRank');
    rankBadgeElement.innerHTML = getRankBadgeHTML(newRank).replace('<div', '<span').replace('</div>', '</span>');
    
    // 次のランクまでのポイント
    const pointsToNext = getPointsToNextRank(newRank, AppState.currentUser.rank_points);
    document.getElementById('nextRankPoints').textContent = formatNumber(pointsToNext);
    
    // 連続ログイン日数
    document.getElementById('consecutiveDays').textContent = AppState.currentUser.consecutive_login_days;
}

// 案件リストを表示
function renderCases(cases, container) {
    const containerElement = container || document.getElementById('casesList');
    if (!containerElement) return;
    
    containerElement.innerHTML = '';
    
    cases.forEach(caseItem => {
        const caseCard = document.createElement('div');
        caseCard.className = 'bg-white rounded-2xl shadow-lg p-6 card-hover';
        
        const badges = [];
        if (caseItem.is_new) badges.push('<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>');
        if (caseItem.is_featured) badges.push('<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">おすすめ</span>');
        
        const difficultyColors = {
            '簡単': 'text-green-600',
            '普通': 'text-yellow-600',
            '難しい': 'text-red-600'
        };
        
        caseCard.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex gap-2 mb-2">
                        ${badges.join('')}
                    </div>
                    <h4 class="text-lg font-bold mb-2 line-clamp-2">${caseItem.title}</h4>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${caseItem.description}</p>
                </div>
                <div class="w-16 h-16 flex-shrink-0 ml-4">
                    <img src="${caseItem.image_url}" alt="${caseItem.title}" class="w-full h-full object-contain">
                </div>
            </div>
            
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-3xl font-black text-purple-600">${formatNumber(caseItem.points)}<span class="text-sm">pt</span></p>
                    <p class="text-xs text-gray-500">≈ ¥${formatNumber(caseItem.points)}</p>
                </div>
                <div class="text-right text-sm">
                    <p class="text-gray-600">所要時間: <span class="font-semibold">${caseItem.estimated_time}</span></p>
                    <p class="${difficultyColors[caseItem.difficulty]}">難易度: <span class="font-semibold">${caseItem.difficulty}</span></p>
                </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                    <i class="fas fa-users"></i> ${formatNumber(caseItem.completion_count)}人が利用
                </p>
                <button class="bg-purple-600 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-700 transition shine-effect case-action-btn" data-case-id="${caseItem.id}">
                    参加する <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        `;
        
        containerElement.appendChild(caseCard);
    });
    
    // 案件アクションボタンにイベントリスナーを追加
    document.querySelectorAll('.case-action-btn').forEach(btn => {
        btn.addEventListener('click', handleCaseAction);
    });
}

// 案件アクション処理
async function handleCaseAction(event) {
    if (!AppState.isLoggedIn) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const caseId = event.currentTarget.getAttribute('data-case-id');
    const caseItem = AppState.cases.find(c => c.id === caseId);
    
    if (!caseItem) return;
    
    // ランク倍率を適用
    const multiplier = RANK_MULTIPLIERS[AppState.currentUser.rank] || 1.0;
    const earnedPoints = Math.floor(caseItem.points * multiplier);
    
    // ポイント履歴を追加
    await addPointHistory(AppState.currentUser.id, earnedPoints, '獲得', caseItem.title, caseId);
    
    // ユーザーポイントを更新
    const updatedUser = await updateUser(AppState.currentUser.id, {
        total_points: AppState.currentUser.total_points + earnedPoints,
        available_points: AppState.currentUser.available_points + earnedPoints,
        rank_points: AppState.currentUser.rank_points + earnedPoints
    });
    
    if (updatedUser) {
        AppState.currentUser = updatedUser;
        updateUserDisplay();
        
        // 実績をチェック
        const newAchievements = await checkAchievements(AppState.currentUser.id);
        if (newAchievements.length > 0) {
            newAchievements.forEach(ach => {
                setTimeout(() => {
                    showToast(`実績解除: ${ach.name} (+${ach.bonus_points}pt)`, 'success');
                }, 500);
            });
        }
        
        // ボーナスメッセージ
        let message = `${formatNumber(earnedPoints)}pt を獲得しました！`;
        if (multiplier > 1.0) {
            message += ` (ランクボーナス: ${multiplier}倍)`;
        }
        showToast(message, 'success');
        
        // 履歴を更新
        await loadPointHistory();
    }
}

// ポイント履歴を読み込み
async function loadPointHistory() {
    if (!AppState.currentUser) return;
    
    const history = await fetchPointHistory(AppState.currentUser.id);
    AppState.pointHistory = history;
    
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-gray-500 text-center py-8">まだポイント履歴がありません</p>';
        return;
    }
    
    // 最新のものから表示
    history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20).forEach(item => {
        const typeColors = {
            '獲得': 'text-green-600',
            '交換': 'text-red-600',
            'ボーナス': 'text-yellow-600',
            '紹介': 'text-blue-600',
            'デイリー': 'text-purple-600'
        };
        
        const typeIcons = {
            '獲得': 'fa-arrow-up',
            '交換': 'fa-arrow-down',
            'ボーナス': 'fa-gift',
            '紹介': 'fa-users',
            'デイリー': 'fa-calendar-check'
        };
        
        const historyItem = document.createElement('div');
        historyItem.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition';
        
        const sign = item.type === '交換' ? '-' : '+';
        
        historyItem.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <i class="fas ${typeIcons[item.type]} ${typeColors[item.type]}"></i>
                </div>
                <div>
                    <p class="font-semibold">${item.description}</p>
                    <p class="text-sm text-gray-500">${formatDate(item.created_at)}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xl font-bold ${typeColors[item.type]}">${sign}${formatNumber(item.points)}pt</p>
                <p class="text-xs text-gray-500">${item.status}</p>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// 交換履歴を読み込み
async function loadExchangeHistory() {
    if (!AppState.currentUser) return;
    
    const history = await fetchExchangeHistory(AppState.currentUser.id);
    AppState.exchangeHistory = history;
    
    const historyList = document.getElementById('exchangeHistoryList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-gray-500 text-center py-8">まだ交換履歴がありません</p>';
        return;
    }
    
    // 最新のものから表示
    history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(item => {
        const exchangeItem = document.createElement('div');
        exchangeItem.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-xl';
        
        exchangeItem.innerHTML = `
            <div>
                <p class="font-semibold">${item.exchange_type}</p>
                <p class="text-sm text-gray-500">${formatDate(item.created_at)}</p>
                <p class="text-xs text-gray-400 font-mono">${item.exchange_code}</p>
            </div>
            <div class="text-right">
                <p class="text-lg font-bold text-red-600">-${formatNumber(item.points_used)}pt</p>
                <p class="text-sm text-green-600">≈ ¥${formatNumber(item.exchange_value)}</p>
                <p class="text-xs text-gray-500">${item.status}</p>
            </div>
        `;
        
        historyList.appendChild(exchangeItem);
    });
}

// 実績を読み込み
async function loadAchievements() {
    if (!AppState.currentUser) return;
    
    const response = await fetch(`tables/achievements?limit=100`);
    const data = await response.json();
    const userAchievements = data.data.filter(a => a.user_id === AppState.currentUser.id);
    AppState.achievements = userAchievements;
    
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) return;
    
    achievementsList.innerHTML = '';
    
    ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        const isUnlocked = userAchievements.some(a => a.achievement_name === achievement.name);
        
        const achievementCard = document.createElement('div');
        achievementCard.className = `bg-white rounded-2xl shadow-lg p-6 ${isUnlocked ? 'border-2 border-purple-500' : 'opacity-60'}`;
        
        achievementCard.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 ${isUnlocked ? 'bg-purple-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas ${achievement.icon} text-4xl ${isUnlocked ? 'text-purple-600' : 'text-gray-400'}"></i>
                </div>
                <h4 class="text-lg font-bold mb-2">${achievement.name}</h4>
                <p class="text-sm text-gray-600 mb-3">${achievement.description}</p>
                <p class="text-xl font-bold ${isUnlocked ? 'text-purple-600' : 'text-gray-400'}">
                    +${formatNumber(achievement.bonus_points)}pt
                </p>
                ${isUnlocked ? '<p class="text-xs text-green-600 mt-2 font-semibold"><i class="fas fa-check-circle"></i> 達成済み</p>' : '<p class="text-xs text-gray-400 mt-2">未達成</p>'}
            </div>
        `;
        
        achievementsList.appendChild(achievementCard);
    });
}

// 統計チャートを初期化
function initializeCharts() {
    // ポイント獲得推移チャート
    const pointsCtx = document.getElementById('pointsChart');
    if (pointsCtx && AppState.pointHistory.length > 0) {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split('T')[0];
        });
        
        const pointsByDay = last30Days.map(date => {
            const dayHistory = AppState.pointHistory.filter(h => 
                h.created_at && h.created_at.startsWith(date) && h.type !== '交換'
            );
            return dayHistory.reduce((sum, h) => sum + h.points, 0);
        });
        
        new Chart(pointsCtx, {
            type: 'line',
            data: {
                labels: last30Days.map(d => new Date(d).getDate() + '日'),
                datasets: [{
                    label: '獲得ポイント',
                    data: pointsByDay,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // カテゴリー別チャート
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx && AppState.cases.length > 0) {
        const categories = [...new Set(AppState.cases.map(c => c.category))];
        const categoryPoints = categories.map(cat => {
            const catCases = AppState.cases.filter(c => c.category === cat);
            return catCases.reduce((sum, c) => sum + c.points, 0);
        });
        
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryPoints,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#00f2fe',
                        '#43e97b',
                        '#fa709a',
                        '#fee140'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// ========================================
// イベントハンドラー
// ========================================

// ログイン処理
async function handleLogin() {
    // デモ用: ランダムなユーザーを作成
    const username = `ユーザー${Math.floor(Math.random() * 10000)}`;
    const email = `user${Math.floor(Math.random() * 10000)}@pointmax.jp`;
    
    const user = await getOrCreateUser(username, email);
    
    if (user) {
        AppState.currentUser = user;
        AppState.isLoggedIn = true;
        
        // ランクを更新
        const newRank = calculateRank(user.rank_points);
        if (newRank !== user.rank) {
            await updateUser(user.id, { rank: newRank });
            AppState.currentUser.rank = newRank;
        }
        
        // UIを更新
        document.getElementById('landing').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        updateUserDisplay();
        await loadPointHistory();
        await loadExchangeHistory();
        await loadAchievements();
        
        showToast(`ようこそ、${user.username}さん！`, 'success');
        
        // 実績をチェック
        await checkAchievements(user.id);
    }
}

// タブ切り替え
function switchTab(tabName) {
    // すべてのタブボタンとコンテンツを非アクティブに
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    // 選択されたタブをアクティブに
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    const selectedContent = document.getElementById(`${tabName}Tab`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // 統計タブの場合はチャートを初期化
    if (tabName === 'stats') {
        setTimeout(initializeCharts, 100);
    }
}

// フィルター処理
function filterCases(category) {
    const filteredCases = category === '全て' 
        ? AppState.cases 
        : AppState.cases.filter(c => c.category === category);
    
    renderCases(filteredCases);
    
    // フィルターボタンの見た目を更新
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            btn.classList.add('bg-purple-600', 'text-white', 'active');
        } else {
            btn.classList.remove('bg-purple-600', 'text-white', 'active');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
}

// ポイント交換モーダルを開く
let selectedExchangeType = '';
let selectedExchangeRate = 1;

function openExchangeModal(exchangeType, rate) {
    selectedExchangeType = exchangeType;
    selectedExchangeRate = rate;
    
    document.getElementById('modalExchangeType').textContent = exchangeType;
    document.getElementById('exchangeModal').classList.remove('hidden');
    
    // 入力値をリセット
    document.getElementById('exchangeAmount').value = '';
    document.getElementById('exchangeValue').textContent = '¥0';
}

// ポイント交換額の計算
function updateExchangeValue() {
    const amount = parseInt(document.getElementById('exchangeAmount').value) || 0;
    const value = Math.floor(amount * selectedExchangeRate);
    document.getElementById('exchangeValue').textContent = `¥${formatNumber(value)}`;
}

// ポイント交換を実行
async function executeExchange() {
    const amount = parseInt(document.getElementById('exchangeAmount').value);
    
    if (!amount || amount < 100) {
        showToast('最低交換額は100ptです', 'error');
        return;
    }
    
    if (amount > AppState.currentUser.available_points) {
        showToast('ポイントが不足しています', 'error');
        return;
    }
    
    const value = Math.floor(amount * selectedExchangeRate);
    
    // 交換を作成
    const exchange = await createExchange(AppState.currentUser.id, selectedExchangeType, amount, value);
    
    if (exchange) {
        // ポイント履歴を追加
        await addPointHistory(AppState.currentUser.id, amount, '交換', `${selectedExchangeType}に交換`);
        
        // ユーザーポイントを更新
        const updatedUser = await updateUser(AppState.currentUser.id, {
            available_points: AppState.currentUser.available_points - amount
        });
        
        if (updatedUser) {
            AppState.currentUser = updatedUser;
            updateUserDisplay();
            await loadPointHistory();
            await loadExchangeHistory();
            
            // 実績をチェック
            await checkAchievements(AppState.currentUser.id);
            
            showToast(`${formatNumber(amount)}ptを${selectedExchangeType}に交換しました！`, 'success');
            document.getElementById('exchangeModal').classList.add('hidden');
        }
    }
}

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 案件を読み込み
    await fetchCases();
    
    // おすすめ案件を表示（ランディングページ用）
    const featuredCases = AppState.cases.filter(c => c.is_featured).slice(0, 3);
    const featuredContainer = document.getElementById('featuredCases');
    if (featuredContainer) {
        renderCases(featuredCases, featuredContainer);
    }
    
    // 初期表示
    renderCases(AppState.cases);
    
    // ログインボタン
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('startBtn').addEventListener('click', handleLogin);
    
    // 「すべての案件を見る」ボタン
    const viewAllBtn = document.getElementById('viewAllCasesBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', handleLogin);
    }
    
    // タブボタン
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // フィルターボタン
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.currentTarget.getAttribute('data-category');
            filterCases(category);
        });
    });
    
    // デイリーボーナスボタン
    document.getElementById('claimDailyBtn').addEventListener('click', async () => {
        if (!AppState.isLoggedIn) {
            showToast('ログインしてください', 'error');
            return;
        }
        
        const dayNumber = AppState.currentUser.consecutive_login_days;
        await claimDailyBonus(AppState.currentUser.id, dayNumber);
        
        // 連続ログイン日数を更新
        await updateUser(AppState.currentUser.id, {
            consecutive_login_days: dayNumber + 1,
            last_login_date: new Date().toISOString().split('T')[0]
        });
        
        AppState.currentUser.consecutive_login_days = dayNumber + 1;
        updateUserDisplay();
        
        // 実績をチェック
        await checkAchievements(AppState.currentUser.id);
    });
    
    // 交換オプションボタン
    document.querySelectorAll('.exchange-option').forEach(option => {
        option.addEventListener('click', (e) => {
            if (!AppState.isLoggedIn) {
                showToast('ログインしてください', 'error');
                return;
            }
            
            const exchangeType = e.currentTarget.getAttribute('data-type');
            const rate = parseFloat(e.currentTarget.getAttribute('data-rate'));
            openExchangeModal(exchangeType, rate);
        });
    });
    
    // 交換モーダル
    document.getElementById('exchangeAmount').addEventListener('input', updateExchangeValue);
    document.getElementById('confirmExchangeBtn').addEventListener('click', executeExchange);
    document.getElementById('cancelExchangeBtn').addEventListener('click', () => {
        document.getElementById('exchangeModal').classList.add('hidden');
    });
    
    // モーダルの外側をクリックで閉じる
    document.getElementById('exchangeModal').addEventListener('click', (e) => {
        if (e.target.id === 'exchangeModal') {
            document.getElementById('exchangeModal').classList.add('hidden');
        }
    });
});
