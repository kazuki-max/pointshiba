/**
 * ========================================
 * 管理者通知UI統合
 * ========================================
 * 
 * 管理者通知システムのUI制御
 */

// ========================================
// タブ切り替え
// ========================================
window.switchAdminNotifTab = function(tabName) {
    // タブボタンのスタイル切り替え
    document.querySelectorAll('.admin-notif-tab').forEach(tab => {
        tab.classList.remove('bg-purple-600');
        tab.classList.add('bg-gray-700');
    });
    document.getElementById(`adminNotifTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.remove('bg-gray-700');
    document.getElementById(`adminNotifTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('bg-purple-600');
    
    // コンテンツの表示切り替え
    document.querySelectorAll('.admin-notif-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`adminNotif${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.remove('hidden');
    
    // 各タブの初期化
    if (tabName === 'history') {
        loadAdminNotifHistory();
    } else if (tabName === 'templates') {
        loadAdminNotifTemplates();
    }
};

// ========================================
// 通知送信フォーム制御
// ========================================

// イベントリスナーをアタッチする関数（複数回呼び出し可能）
window.attachAdminNotificationListeners = function() {
    console.log('🔧 イベントリスナーのアタッチを開始...');
    
    // 送信先タイプの切り替え
    const targetTypeRadios = document.querySelectorAll('input[name="targetType"]');
    console.log('🔍 ラジオボタン数:', targetTypeRadios.length);
    
    targetTypeRadios.forEach(radio => {
        // 既存のリスナーを削除してから追加
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
        
        newRadio.addEventListener('change', function() {
            console.log('📻 送信先タイプ変更:', this.value);
            const conditionalSection = document.getElementById('conditionalSection');
            const individualSection = document.getElementById('individualSection');
            
            conditionalSection.classList.add('hidden');
            individualSection.classList.add('hidden');
            
            if (this.value === 'conditional') {
                conditionalSection.classList.remove('hidden');
            } else if (this.value === 'individual') {
                individualSection.classList.remove('hidden');
            }
        });
    });
    
    // 予約送信チェックボックス
    const scheduledCheckbox = document.getElementById('notifScheduled');
    const scheduledTimeInput = document.getElementById('notifScheduledTime');
    
    console.log('🔍 予約送信チェックボックス:', scheduledCheckbox);
    console.log('🔍 予約送信時刻入力:', scheduledTimeInput);
    
    if (scheduledCheckbox && scheduledTimeInput) {
        // 既存のリスナーを削除
        const newCheckbox = scheduledCheckbox.cloneNode(true);
        scheduledCheckbox.parentNode.replaceChild(newCheckbox, scheduledCheckbox);
        
        newCheckbox.addEventListener('change', function() {
            console.log('📅 予約送信チェックボックス変更:', this.checked);
            if (this.checked) {
                scheduledTimeInput.classList.remove('hidden');
                // デフォルト値を1時間後に設定
                const now = new Date();
                now.setHours(now.getHours() + 1);
                scheduledTimeInput.value = now.toISOString().slice(0, 16);
                console.log('✅ 予約時刻入力を表示:', scheduledTimeInput.value);
            } else {
                scheduledTimeInput.classList.add('hidden');
                console.log('✅ 予約時刻入力を非表示');
            }
        });
        console.log('✅ 予約送信チェックボックスイベント登録完了');
    } else {
        console.warn('⚠️ notifScheduled または notifScheduledTime が見つかりません');
    }
    
    console.log('✅ イベントリスナーのアタッチ完了');
};

// AdminNotificationSystemが読み込まれるまで待機する関数
function waitForAdminNotificationSystem(callback, maxAttempts = 20) {
    // すでに読み込まれている場合は即座に実行
    if (typeof window.AdminNotificationSystem !== 'undefined') {
        console.log('✅ AdminNotificationSystem は既に読み込まれています');
        callback();
        return;
    }
    
    // イベントリスナー方式で待機
    let eventListenerAdded = false;
    
    window.addEventListener('AdminNotificationSystemReady', function() {
        if (!eventListenerAdded) {
            eventListenerAdded = true;
            console.log('✅ AdminNotificationSystemReady イベントを受信しました');
            callback();
        }
    });
    
    // フォールバック: ポーリング方式でも確認
    let attempts = 0;
    
    function check() {
        attempts++;
        console.log(`🔍 AdminNotificationSystem チェック (${attempts}/${maxAttempts})`);
        
        if (typeof window.AdminNotificationSystem !== 'undefined') {
            if (!eventListenerAdded) {
                eventListenerAdded = true;
                console.log('✅ AdminNotificationSystem 読み込み完了（ポーリング検出）');
                callback();
            }
        } else if (attempts >= maxAttempts) {
            console.error('❌ AdminNotificationSystem の読み込みタイムアウト');
            alert('システムエラー: 管理者通知システムの読み込みに失敗しました。\n\nページをリロードしてください。');
        } else {
            console.log('⏳ 再試行中... (' + (attempts * 300) + 'ms経過)');
            setTimeout(check, 300);
        }
    }
    
    // 最初のチェックを500ms後に開始（イベントを待つ時間を与える）
    setTimeout(check, 500);
}

// 初回読み込み時（AdminNotificationSystemが読み込まれるまで待機）
setTimeout(function() {
    console.log('📍 初期化開始');
    waitForAdminNotificationSystem(function() {
        console.log('🎉 AdminNotificationSystem 利用可能 - イベントリスナーをアタッチします');
        attachAdminNotificationListeners();
    });
}, 1000);

// ========================================
// 通知送信フォーム送信
// ========================================
window.handleAdminNotificationSubmit = async function(event) {
    console.log('🚀 handleAdminNotificationSubmit 関数が呼ばれました！', event);
    
    if (event) {
        event.preventDefault();
        console.log('✅ preventDefault 実行済み');
    }
    
    console.log('🔍 現在のユーザー:', MobileApp.currentUser);
    
    if (!MobileApp.currentUser || MobileApp.currentUser.username !== 'admin') {
        console.error('❌ 管理者権限エラー');
        showToast('管理者権限が必要です', 'error');
        return;
    }
    
    console.log('✅ 管理者権限確認OK');
    
    try {
        console.log('📝 フォームデータ取得開始...');
        
        // フォームデータ取得
        const targetType = document.querySelector('input[name="targetType"]:checked').value;
        const title = document.getElementById('notifTitle').value.trim();
        const message = document.getElementById('notifMessage').value.trim();
        
        console.log('📝 取得データ:', { targetType, title, message });
        const type = document.getElementById('notifType').value;
        const priority = document.getElementById('notifPriority').value;
        const icon = document.getElementById('notifIcon').value;
        const linkScreen = document.getElementById('notifLinkScreen').value;
        const scheduled = document.getElementById('notifScheduled').checked;
        
        let targetUserIds = [];
        let condition = null;
        let scheduledTime = null;
        
        if (targetType === 'individual') {
            const userIdsText = document.getElementById('notifUserIds').value.trim();
            targetUserIds = userIdsText.split(',').map(id => id.trim()).filter(id => id);
            
            if (targetUserIds.length === 0) {
                showToast('ユーザーIDを入力してください', 'error');
                return;
            }
        } else if (targetType === 'conditional') {
            condition = document.getElementById('notifCondition').value.trim();
            
            if (!condition) {
                showToast('条件を入力してください', 'error');
                return;
            }
        }
        
        if (scheduled) {
            const scheduledTimeStr = document.getElementById('notifScheduledTime').value;
            scheduledTime = new Date(scheduledTimeStr).getTime();
            
            if (scheduledTime <= Date.now()) {
                showToast('予約時刻は未来の日時を指定してください', 'error');
                return;
            }
        }
        
        // 確認ダイアログ
        const confirmMessage = scheduled 
            ? `予約送信しますか？\n送信時刻: ${new Date(scheduledTime).toLocaleString('ja-JP')}`
            : '通知を送信しますか？';
        
        console.log('💬 確認ダイアログ表示:', confirmMessage);
        
        if (!confirm(confirmMessage)) {
            console.log('❌ ユーザーがキャンセルしました');
            return;
        }
        
        console.log('✅ ユーザーが送信を承認しました');
        
        // 通知送信
        console.log('📤 AdminNotificationSystem.sendNotification を呼び出します...');
        console.log('🔍 AdminNotificationSystem の存在確認:', typeof AdminNotificationSystem);
        
        // AdminNotificationSystemの存在確認
        if (typeof AdminNotificationSystem === 'undefined' || typeof window.AdminNotificationSystem === 'undefined') {
            console.error('❌ AdminNotificationSystem が定義されていません');
            showToast('システムの初期化が完了していません。3秒後に再試行してください。', 'error');
            
            // 3秒後に自動で再初期化
            setTimeout(function() {
                console.log('🔄 自動再初期化を試行...');
                if (typeof AdminNotificationSystem !== 'undefined') {
                    console.log('✅ AdminNotificationSystem 読み込み完了 - 再度お試しください');
                    showToast('システム初期化完了。もう一度送信ボタンを押してください。', 'success');
                } else {
                    console.error('❌ 再初期化失敗 - ページをリロードしてください');
                    if (confirm('システムの読み込みに失敗しました。ページをリロードしますか？')) {
                        location.reload();
                    }
                }
            }, 3000);
            
            return;
        }
        
        const result = await AdminNotificationSystem.sendNotification({
            targetType: targetType,
            targetUserIds: targetUserIds,
            condition: condition,
            title: title,
            message: message,
            type: type,
            icon: icon,
            linkScreen: linkScreen || null,
            priority: priority,
            scheduledTime: scheduledTime,
            adminId: MobileApp.currentUser.id
        });
        
        console.log('✅ 送信完了:', result);
        
        // フォームリセット
        document.getElementById('adminNotificationForm').reset();
        document.getElementById('conditionalSection').classList.add('hidden');
        document.getElementById('individualSection').classList.add('hidden');
        document.getElementById('notifScheduledTime').classList.add('hidden');
        
        // 送信履歴タブに切り替え
        switchAdminNotifTab('history');
        
    } catch (error) {
        console.error('❌ 通知送信エラー:', error);
        console.error('❌ エラースタック:', error.stack);
        showToast('通知送信に失敗しました: ' + error.message, 'error');
    }
    
    return false; // フォーム送信を防ぐ
};

// フォームイベントリスナー登録（AdminNotificationSystemの読み込みを待つ）
setTimeout(function() {
    console.log('🔍 フォームイベントリスナー登録を試行...');
    
    waitForAdminNotificationSystem(function() {
        console.log('🔍 フォーム要素を取得...');
        const form = document.getElementById('adminNotificationForm');
        console.log('🔍 フォーム要素:', form);
        
        if (form) {
            // 既存のリスナーを削除してから追加
            form.removeEventListener('submit', handleAdminNotificationSubmit);
            form.addEventListener('submit', handleAdminNotificationSubmit);
            form.dataset.listenerAdded = 'true';
            console.log('✅ 管理者通知フォームイベントリスナー登録完了');
            
            // テスト用：フォームに直接onsubmitを設定
            form.onsubmit = function(e) {
                console.log('🔥 onsubmit イベント発火！');
                return handleAdminNotificationSubmit(e);
            };
        } else {
            console.warn('⚠️ adminNotificationForm が見つかりません');
        }
    });
}, 1500);

// ========================================
// プレビュー機能
// ========================================
window.previewAdminNotification = function() {
    const title = document.getElementById('notifTitle').value.trim();
    const message = document.getElementById('notifMessage').value.trim();
    const icon = document.getElementById('notifIcon').value;
    const type = document.getElementById('notifType').value;
    
    if (!title || !message) {
        showToast('タイトルとメッセージを入力してください', 'error');
        return;
    }
    
    // プレビューHTML生成
    const typeColors = {
        system: 'border-blue-500/30 bg-blue-900/20',
        announcement: 'border-purple-500/30 bg-purple-900/20',
        reward: 'border-green-500/30 bg-green-900/20',
        warning: 'border-yellow-500/30 bg-yellow-900/20',
        achievement: 'border-pink-500/30 bg-pink-900/20'
    };
    
    const previewHTML = `
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onclick="this.remove()">
            <div class="bg-gray-900 rounded-xl p-6 max-w-md w-full" onclick="event.stopPropagation()">
                <h3 class="text-lg font-bold mb-4">プレビュー</h3>
                
                <div class="border ${typeColors[type]} rounded-lg p-4">
                    <div class="flex items-start gap-3 mb-2">
                        <i class="fas ${icon} text-xl"></i>
                        <div class="flex-1">
                            <h4 class="font-bold mb-1">${title}</h4>
                            <p class="text-sm text-gray-400">${message}</p>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">たった今</p>
                </div>
                
                <button onclick="this.closest('.fixed').remove()" class="w-full mt-4 bg-purple-600 py-3 rounded-lg font-bold">
                    閉じる
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHTML);
};

// ========================================
// 送信履歴読み込み
// ========================================
window.loadAdminNotifHistory = async function() {
    const container = document.getElementById('adminNotifHistoryList');
    
    try {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-4xl mb-3"></i>
                <p>読み込み中...</p>
            </div>
        `;
        
        const history = await AdminNotificationSystem.getHistory(50);
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>送信履歴がありません</p>
                </div>
            `;
            return;
        }
        
        // 履歴HTML生成
        const html = history.map(notif => {
            const date = new Date(notif.created_at_custom);
            const dateStr = date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const statusColors = {
                draft: 'bg-gray-600',
                scheduled: 'bg-yellow-600',
                sent: 'bg-green-600',
                failed: 'bg-red-600'
            };
            
            const statusTexts = {
                draft: '下書き',
                scheduled: '予約中',
                sent: '送信済み',
                failed: '失敗'
            };
            
            const targetTypeTexts = {
                all: '全ユーザー',
                individual: '個別送信',
                conditional: '条件指定'
            };
            
            return `
                <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="${statusColors[notif.status]} text-white text-xs px-2 py-1 rounded-full font-bold">
                                    ${statusTexts[notif.status]}
                                </span>
                                <span class="text-xs text-gray-500">${targetTypeTexts[notif.target_type]}</span>
                            </div>
                            <h4 class="font-bold">${notif.title}</h4>
                            <p class="text-sm text-gray-400 mt-1">${notif.message.substring(0, 100)}${notif.message.length > 100 ? '...' : ''}</p>
                        </div>
                        <i class="fas ${notif.icon} text-xl"></i>
                    </div>
                    <div class="flex items-center justify-between text-xs text-gray-500 mt-3">
                        <span>${dateStr}</span>
                        <span>送信数: ${notif.sent_count || 0}人 / 既読: ${notif.read_count || 0}人</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('送信履歴取得エラー:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p>送信履歴の取得に失敗しました</p>
            </div>
        `;
    }
};

// ========================================
// テンプレート管理
// ========================================
window.loadAdminNotifTemplates = async function() {
    const container = document.getElementById('adminNotifTemplatesList');
    
    try {
        const templates = await AdminNotificationSystem.getTemplates();
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-file-alt text-4xl mb-3 opacity-50"></i>
                    <p>テンプレートがありません</p>
                </div>
            `;
            return;
        }
        
        const html = templates.map(template => `
            <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        <h4 class="font-bold">${template.name}</h4>
                        <p class="text-xs text-gray-500 mb-2">${template.category}</p>
                        <p class="text-sm text-gray-400">${template.title}</p>
                    </div>
                </div>
                <button onclick="useTemplate('${template.id}')" class="w-full mt-3 bg-purple-600 py-2 rounded-lg text-sm font-bold">
                    このテンプレートを使用
                </button>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('テンプレート取得エラー:', error);
    }
};

window.useTemplate = async function(templateId) {
    try {
        const templates = await AdminNotificationSystem.getTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            showToast('テンプレートが見つかりません', 'error');
            return;
        }
        
        // フォームに値を設定
        document.getElementById('notifTitle').value = template.title;
        document.getElementById('notifMessage').value = template.message;
        document.getElementById('notifType').value = template.type;
        document.getElementById('notifIcon').value = template.icon;
        
        // 送信タブに切り替え
        switchAdminNotifTab('send');
        
        showToast('テンプレートを読み込みました', 'success');
        
    } catch (error) {
        console.error('テンプレート使用エラー:', error);
        showToast('テンプレートの読み込みに失敗しました', 'error');
    }
};

// ========================================
// 画面初期化
// ========================================
setTimeout(function() {
    const originalShowScreen = window.showScreen;

    window.showScreen = function(screenId) {
        if (originalShowScreen) {
            originalShowScreen(screenId);
        }
        
        if (screenId === 'adminNotificationScreen') {
            console.log('🎯 管理者通知画面を初期化');
            // デフォルトで送信タブを表示
            setTimeout(() => {
                switchAdminNotifTab('send');
                
                // AdminNotificationSystemの読み込みを待ってからイベントリスナーをアタッチ
                console.log('🔄 画面初期化時のイベントリスナー再アタッチ...');
                
                waitForAdminNotificationSystem(function() {
                    console.log('✅ AdminNotificationSystem 確認完了 - リスナーをアタッチします');
                    
                    // すべてのイベントリスナーを再アタッチ
                    attachAdminNotificationListeners();
                    
                    // フォームイベントリスナーを再確認
                    console.log('🔍 画面初期化時のフォームチェック...');
                    const form = document.getElementById('adminNotificationForm');
                    console.log('🔍 フォーム要素（画面初期化時）:', form);
                    
                    if (form) {
                        // 既存のリスナーを削除してから追加
                        form.removeEventListener('submit', handleAdminNotificationSubmit);
                        form.addEventListener('submit', handleAdminNotificationSubmit);
                        form.dataset.listenerAdded = 'true';
                        
                        // 直接onsubmitも設定
                        form.onsubmit = function(e) {
                            console.log('🔥 onsubmit イベント発火（画面初期化時）！');
                            return handleAdminNotificationSubmit(e);
                        };
                        
                        console.log('✅ フォームイベントリスナー追加（画面初期化時）');
                    } else {
                        console.warn('⚠️ フォームが見つかりませんでした（画面初期化時）');
                    }
                });
            }, 200);
        }
    };
    
    console.log('✅ showScreen オーバーライド完了');
}, 500);

console.log('✅ 管理者通知UI統合 ロード完了');

// デバッグヘルパー関数
window.debugAdminNotification = function() {
    const info = {
        'AdminNotificationSystem (typeof)': typeof AdminNotificationSystem,
        'window.AdminNotificationSystem (typeof)': typeof window.AdminNotificationSystem,
        'AdminNotificationSystemLoaded': window.AdminNotificationSystemLoaded,
        'MobileApp.currentUser': MobileApp.currentUser ? MobileApp.currentUser.username : 'not logged in',
        'NotificationSystem (typeof)': typeof NotificationSystem,
        'Form element': document.getElementById('adminNotificationForm') ? 'exists' : 'not found',
        'Form onsubmit': document.getElementById('adminNotificationForm') ? 'attached' : 'N/A',
        'Listener added': document.getElementById('adminNotificationForm')?.dataset.listenerAdded || 'no'
    };
    
    console.log('=== 管理者通知システム デバッグ情報 ===');
    Object.keys(info).forEach(key => {
        console.log(key + ':', info[key]);
    });
    console.log('========================================');
    
    // スマホでも見れるようにアラート表示
    const message = Object.keys(info).map(key => key + ': ' + info[key]).join('\n');
    alert('デバッグ情報:\n\n' + message);
    
    return info;
};

console.log('💡 デバッグ用: コンソールで debugAdminNotification() を実行してください');
