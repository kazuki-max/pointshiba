/**
 * ========================================
 * 2段階認証・ログイン履歴 統合コード
 * ========================================
 * 
 * mobile.jsと統合するための追加機能
 */

// ========================================
// グローバル変数
// ========================================
window.pendingLoginUser = null; // 2段階認証待ちのユーザー
window.twoFactorBackupCodes = []; // 一時的なバックアップコード保存

// ========================================
// ログイン処理の拡張（2段階認証対応）
// ========================================

// 元のログイン処理をラップ
const originalHandleLogin = window.handleLogin;

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
            // 2段階認証チェック
            const has2FA = await TwoFactorAuth.isEnabled(user.id);
            
            if (has2FA) {
                // 2段階認証が必要
                window.pendingLoginUser = user;
                showTwoFactorPrompt();
                
                // ログイン履歴（未完了）を記録
                await LoginHistory.record(user.id, false, 'password', false);
            } else {
                // 2段階認証不要、通常ログイン
                await completeLogin(user, false);
            }
        } else {
            // ログイン失敗を記録（ユーザーが特定できないのでスキップ）
            showToast('ユーザー名またはパスワードが正しくありません', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('ログインに失敗しました', 'error');
    }
};

/**
 * ログイン完了処理（2段階認証後も使用）
 */
async function completeLogin(user, twoFactorUsed = false) {
    MobileApp.currentUser = user;
    MobileApp.isLoggedIn = true;
    
    // localStorageに保存
    localStorage.setItem('currentUserId', user.id);
    
    showToast(`ようこそ、${user.username}さん！`, 'success');
    
    // ログイン履歴を記録
    await LoginHistory.record(user.id, true, 'password', twoFactorUsed);
    
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
    update2FABadge();
    
    // フォームをリセット
    document.getElementById('loginForm').reset();
}

/**
 * 2段階認証プロンプトを表示
 */
function showTwoFactorPrompt() {
    const code = prompt('2段階認証コードを入力してください（6桁）\nまたはバックアップコード（8桁）:');
    
    if (code) {
        verify2FACode(code);
    } else {
        showToast('ログインがキャンセルされました', 'info');
        window.pendingLoginUser = null;
    }
}

/**
 * 2段階認証コード検証
 */
async function verify2FACode(code) {
    if (!window.pendingLoginUser) {
        showToast('セッションが無効です', 'error');
        return;
    }
    
    const isValid = await TwoFactorAuth.verifyLogin(window.pendingLoginUser.id, code);
    
    if (isValid) {
        // 検証成功、ログイン完了
        await completeLogin(window.pendingLoginUser, true);
        window.pendingLoginUser = null;
    } else {
        showToast('認証コードが正しくありません', 'error');
        
        // 再度プロンプト表示
        const retry = confirm('認証コードが正しくありません。再試行しますか？');
        if (retry) {
            showTwoFactorPrompt();
        } else {
            window.pendingLoginUser = null;
        }
    }
}

// ========================================
// 2段階認証設定画面の機能
// ========================================

/**
 * 2段階認証画面を読み込み
 */
window.loadTwoFactorAuthScreen = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('loginScreen');
        return;
    }
    
    const isEnabled = await TwoFactorAuth.isEnabled(MobileApp.currentUser.id);
    
    if (isEnabled) {
        // 有効状態を表示
        document.getElementById('twoFactorEnabledSection').classList.remove('hidden');
        document.getElementById('twoFactorDisabledSection').classList.add('hidden');
        document.getElementById('twoFactorSetupSection').classList.add('hidden');
        
        // 最終使用日時を表示
        const secretData = await TwoFactorAuth.getUserSecret(MobileApp.currentUser.id);
        if (secretData && secretData.last_used) {
            const lastUsed = new Date(secretData.last_used);
            document.getElementById('twoFactorLastUsed').textContent = lastUsed.toLocaleString('ja-JP');
        }
    } else {
        // 無効状態を表示
        document.getElementById('twoFactorEnabledSection').classList.add('hidden');
        document.getElementById('twoFactorDisabledSection').classList.remove('hidden');
        document.getElementById('twoFactorSetupSection').classList.add('hidden');
    }
};

/**
 * 2段階認証を有効化開始
 */
window.enableTwoFactor = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    try {
        // 秘密鍵とQRコードを生成
        const { secret, otpauthUrl, backupCodes } = await TwoFactorAuth.initialize(
            MobileApp.currentUser.id,
            MobileApp.currentUser.username
        );
        
        // バックアップコードを保存
        window.twoFactorBackupCodes = backupCodes;
        
        // セットアップセクションを表示
        document.getElementById('twoFactorDisabledSection').classList.add('hidden');
        document.getElementById('twoFactorSetupSection').classList.remove('hidden');
        
        // 秘密鍵を表示
        document.getElementById('secretKeyDisplay').textContent = secret;
        
        // QRコードを生成
        const canvas = document.getElementById('qrcodeCanvas');
        await TwoFactorAuth.generateQRCode(otpauthUrl, canvas);
        
        showToast('QRコードを認証アプリでスキャンしてください', 'info');
        
    } catch (error) {
        console.error('2段階認証有効化エラー:', error);
        showToast('エラーが発生しました: ' + error.message, 'error');
    }
};

/**
 * 2段階認証セットアップキャンセル
 */
window.cancelTwoFactorSetup = function() {
    document.getElementById('twoFactorSetupSection').classList.add('hidden');
    document.getElementById('twoFactorDisabledSection').classList.remove('hidden');
    window.twoFactorBackupCodes = [];
};

/**
 * 2段階認証検証フォーム送信
 */
window.handleTwoFactorVerify = async function(event) {
    event.preventDefault();
    
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        return;
    }
    
    const code = document.getElementById('twoFactorCode').value.trim();
    
    if (!/^[0-9]{6}$/.test(code)) {
        showToast('6桁の数字を入力してください', 'error');
        return;
    }
    
    try {
        // コード検証して有効化
        await TwoFactorAuth.enable(MobileApp.currentUser.id, code);
        
        showToast('2段階認証が有効化されました！', 'success');
        
        // バックアップコードを表示
        displayBackupCodes(window.twoFactorBackupCodes);
        
        // 通知を送信
        await NotificationSystem.create(MobileApp.currentUser.id, {
            title: '🔐 2段階認証有効化',
            message: '2段階認証が有効になりました。バックアップコードを安全な場所に保存してください。',
            type: 'system',
            icon: 'fa-shield-alt'
        });
        
        update2FABadge();
        
    } catch (error) {
        console.error('2段階認証検証エラー:', error);
        showToast('認証コードが正しくありません', 'error');
    }
};

/**
 * バックアップコードを表示
 */
function displayBackupCodes(codes) {
    const container = document.getElementById('backupCodesList');
    container.innerHTML = codes.map((code, index) => 
        `<div class="py-2 border-b border-gray-700 last:border-0">${index + 1}. ${code}</div>`
    ).join('');
    
    document.getElementById('backupCodesDisplay').classList.remove('hidden');
}

/**
 * バックアップコードをコピー
 */
window.copyBackupCodes = function() {
    const text = window.twoFactorBackupCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showToast('バックアップコードをコピーしました', 'success');
    }).catch(() => {
        showToast('コピーに失敗しました', 'error');
    });
};

/**
 * バックアップコードを表示（有効化後）
 */
window.showBackupCodes = async function() {
    if (!MobileApp.currentUser) return;
    
    const secretData = await TwoFactorAuth.getUserSecret(MobileApp.currentUser.id);
    if (secretData && secretData.backup_codes) {
        const codes = Array.isArray(secretData.backup_codes) 
            ? secretData.backup_codes 
            : JSON.parse(secretData.backup_codes || '[]');
        
        const remaining = codes.length;
        
        alert(`バックアップコード（残り${remaining}個）:\n\n${codes.join('\n')}\n\n※ 各コードは1回のみ使用可能です`);
    }
};

/**
 * 2段階認証を無効化
 */
window.disableTwoFactor = async function() {
    if (!MobileApp.currentUser) return;
    
    const code = prompt('2段階認証を無効化するには、現在の認証コードを入力してください:');
    
    if (!code) return;
    
    try {
        await TwoFactorAuth.disable(MobileApp.currentUser.id, code);
        showToast('2段階認証を無効化しました', 'success');
        
        // 通知を送信
        await NotificationSystem.create(MobileApp.currentUser.id, {
            title: '⚠️ 2段階認証無効化',
            message: '2段階認証が無効化されました。セキュリティが低下しています。',
            type: 'system',
            icon: 'fa-exclamation-triangle'
        });
        
        update2FABadge();
        loadTwoFactorAuthScreen();
        
    } catch (error) {
        console.error('2段階認証無効化エラー:', error);
        showToast('認証コードが正しくありません', 'error');
    }
};

/**
 * 2段階認証バッジを更新
 */
async function update2FABadge() {
    if (!MobileApp.currentUser) return;
    
    const isEnabled = await TwoFactorAuth.isEnabled(MobileApp.currentUser.id);
    const badge = document.getElementById('twoFactorBadge');
    
    if (badge) {
        if (isEnabled) {
            badge.textContent = '有効';
            badge.className = 'bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold';
        } else {
            badge.textContent = '無効';
            badge.className = 'bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold';
        }
    }
}

// ========================================
// ログイン履歴画面の機能
// ========================================

/**
 * ログイン履歴画面を読み込み
 */
window.loadLoginHistoryScreen = async function() {
    if (!MobileApp.currentUser) {
        showToast('ログインしてください', 'error');
        showScreen('loginScreen');
        return;
    }
    
    try {
        // ログイン履歴を取得
        const history = await LoginHistory.getHistory(MobileApp.currentUser.id, 50);
        
        // 統計を取得
        const stats = await LoginHistory.getStatistics(MobileApp.currentUser.id);
        
        // 統計を表示
        if (stats) {
            document.getElementById('loginStatsTotal').textContent = stats.totalLogins;
            document.getElementById('loginStatsSuccess').textContent = stats.successfulLogins;
            document.getElementById('loginStats2FA').textContent = stats.twoFactorLogins;
            document.getElementById('loginStatsSuspicious').textContent = stats.suspiciousLogins;
            
            // セキュリティアラート
            if (stats.suspiciousLogins > 0) {
                document.getElementById('securityAlert').classList.remove('hidden');
            } else {
                document.getElementById('securityAlert').classList.add('hidden');
            }
        }
        
        // ログイン履歴をHTMLで表示
        const historyHTML = LoginHistory.formatHistoryHTML(history);
        document.getElementById('loginHistoryList').innerHTML = historyHTML;
        
    } catch (error) {
        console.error('ログイン履歴取得エラー:', error);
        document.getElementById('loginHistoryList').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p>ログイン履歴の取得に失敗しました</p>
            </div>
        `;
    }
};

// ========================================
// 画面初期化フック
// ========================================

// 元のshowScreen関数を拡張
const originalShowScreen = window.showScreen;

window.showScreen = function(screenId) {
    // 元の関数を実行
    originalShowScreen(screenId);
    
    // 追加の初期化処理
    if (screenId === 'twoFactorAuthScreen') {
        loadTwoFactorAuthScreen();
    } else if (screenId === 'loginHistoryScreen') {
        loadLoginHistoryScreen();
    }
};

// ========================================
// イベントリスナー登録
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // 2段階認証検証フォーム
    const twoFactorForm = document.getElementById('twoFactorVerifyForm');
    if (twoFactorForm) {
        twoFactorForm.addEventListener('submit', handleTwoFactorVerify);
    }
    
    // 初回ロード時に2FAバッジを更新
    setTimeout(() => {
        if (MobileApp.currentUser) {
            update2FABadge();
        }
    }, 1000);
});

// ========================================
// ソーシャルログインの拡張
// ========================================

// ソーシャルログイン後もログイン履歴を記録
const originalHandleFirebaseUser = window.handleFirebaseUser;

if (originalHandleFirebaseUser) {
    window.handleFirebaseUser = async function(firebaseUser, provider) {
        await originalHandleFirebaseUser(firebaseUser, provider);
        
        // ログイン履歴を記録
        if (MobileApp.currentUser) {
            await LoginHistory.record(MobileApp.currentUser.id, true, provider, false);
        }
    };
}

console.log('✅ 2段階認証・ログイン履歴システム 統合完了 🆕');
console.log('  - TOTP認証アプリ対応（Google Authenticator等）');
console.log('  - バックアップコード機能');
console.log('  - ログイン履歴記録・表示');
console.log('  - 異常ログイン検知・アラート');
console.log('  - IPアドレス・デバイス情報取得');
console.log('  - 完全無料で動作');
