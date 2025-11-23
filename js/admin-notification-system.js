/**
 * ========================================
 * 管理者通知システム
 * ========================================
 * 
 * 管理者がユーザーに通知を送信する機能
 * - 全ユーザー一斉通知
 * - 個別ユーザー通知
 * - 条件付き通知（ランク別等）
 * - 予約送信
 * - テンプレート機能
 * - 自動通知トリガー
 */

// ========================================
// AdminNotificationSystemクラス
// ========================================
const AdminNotificationSystem = {
    
    /**
     * 通知を作成・送信
     * @param {object} notificationData - 通知データ
     * @returns {Promise<object>} - 作成された通知
     */
    async sendNotification(notificationData) {
        try {
            console.log('📢 通知送信開始:', notificationData);
            
            const {
                targetType = 'all',           // all / individual / conditional
                targetUserIds = [],           // 個別送信先ユーザーIDリスト
                condition = null,             // 条件（例: "rank=gold"）
                title,
                message,
                type = 'system',              // system / announcement / reward / warning
                icon = 'fa-bell',
                linkUrl = null,
                linkScreen = null,
                priority = 'normal',          // low / normal / high / urgent
                scheduledTime = null,         // 予約送信時刻（null=即時）
                adminId = null
            } = notificationData;
            
            // バリデーション
            if (!title || !message) {
                throw new Error('タイトルとメッセージは必須です');
            }
            
            console.log('📢 送信先タイプ:', targetType);
            
            // 送信先ユーザーを取得
            const targetUsers = await this.getTargetUsers(targetType, targetUserIds, condition);
            
            console.log('📢 送信対象ユーザー数:', targetUsers.length);
            
            if (targetUsers.length === 0) {
                throw new Error('送信対象のユーザーが見つかりません');
            }
            
            // 管理者通知レコードを作成
            console.log('💾 管理者通知レコード作成中...');
            const adminNotification = {
                admin_id: adminId || MobileApp.currentUser?.id,
                target_type: targetType,
                target_user_ids: targetType === 'individual' ? targetUserIds : [],
                condition: condition,
                title: title,
                message: message,
                type: type,
                icon: icon,
                link_url: linkUrl,
                link_screen: linkScreen,
                priority: priority,
                scheduled_time: scheduledTime,
                sent_time: scheduledTime ? null : Date.now(),
                status: scheduledTime ? 'scheduled' : 'sent',
                sent_count: 0,
                read_count: 0,
                created_at_custom: Date.now()
            };
            
            console.log('💾 保存するデータ:', adminNotification);
            
            const adminNotifResponse = await fetch('tables/admin_notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminNotification)
            });
            
            console.log('💾 APIレスポンスステータス:', adminNotifResponse.status);
            
            if (!adminNotifResponse.ok) {
                const errorText = await adminNotifResponse.text();
                console.error('❌ APIエラー:', errorText);
                throw new Error('APIエラー: ' + errorText);
            }
            
            const savedAdminNotif = await adminNotifResponse.json();
            console.log('✅ 管理者通知レコード保存完了:', savedAdminNotif);
            
            // 予約送信の場合はここで終了
            if (scheduledTime) {
                console.log('📅 予約送信モード - 即時送信はスキップ');
                showToast(`通知を予約しました（${new Date(scheduledTime).toLocaleString('ja-JP')}）`, 'success');
                return savedAdminNotif;
            }
            
            // 即時送信：各ユーザーに通知を作成
            console.log('📤 各ユーザーへの送信開始...');
            console.log('🔍 NotificationSystemの存在チェック:', typeof NotificationSystem);
            
            let sentCount = 0;
            for (const user of targetUsers) {
                try {
                    console.log(`📧 ユーザー ${user.username} (${user.id}) に送信中...`);
                    
                    // NotificationSystemを使用して通知を作成
                    if (typeof NotificationSystem !== 'undefined') {
                        await NotificationSystem.create(user.id, {
                            title: title,
                            message: message,
                            type: type,
                            icon: icon,
                            link_url: linkUrl,
                            link_screen: linkScreen
                        });
                        sentCount++;
                        console.log(`✅ ユーザー ${user.username} に送信完了`);
                    }
                    } else {
                        console.error('❌ NotificationSystemが定義されていません');
                    }
                } catch (error) {
                    console.error(`❌ ユーザー ${user.id} への通知送信失敗:`, error);
                }
            }
            
            console.log(`✅ 送信完了: ${sentCount}/${targetUsers.length} 人`);
            
            // 送信数を更新
            console.log('💾 送信数を更新中...');
            const updateResponse = await fetch(`tables/admin_notifications/${savedAdminNotif.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sent_count: sentCount
                })
            });
            
            console.log('💾 更新レスポンスステータス:', updateResponse.status);
            
            showToast(`${sentCount}人のユーザーに通知を送信しました`, 'success');
            console.log('✅ 送信処理完了！');
            
            return {
                ...savedAdminNotif,
                sent_count: sentCount
            };
            
        } catch (error) {
            console.error('❌ 通知送信エラー:', error);
            console.error('❌ エラースタック:', error.stack);
            throw error;
        }
    },
    
    /**
     * 送信対象ユーザーを取得
     * @param {string} targetType - all / individual / conditional
     * @param {Array} targetUserIds - 個別送信先IDリスト
     * @param {string} condition - 条件文字列
     * @returns {Promise<Array>} - ユーザーリスト
     */
    async getTargetUsers(targetType, targetUserIds, condition) {
        try {
            console.log('👥 対象ユーザー取得中...');
            
            // 全ユーザー取得
            const response = await fetch('tables/users?limit=10000');
            const data = await response.json();
            let users = data.data;
            
            console.log('👥 取得した全ユーザー数:', users.length);
            
            // 送信先タイプによってフィルタリング
            console.log('🔍 フィルタリングタイプ:', targetType);
            
            switch (targetType) {
                case 'all':
                    // 全ユーザー（管理者除外）
                    const allUsers = users.filter(u => u.username !== 'admin');
                    console.log('✅ 全ユーザーモード:', allUsers.length, '人');
                    return allUsers;
                
                case 'individual':
                    // 個別指定
                    console.log('👤 個別ユーザーモード - 対象ID:', targetUserIds);
                    const individualUsers = users.filter(u => targetUserIds.includes(u.id));
                    console.log('✅ フィルタリング結果:', individualUsers.length, '人');
                    return individualUsers;
                
                case 'conditional':
                    // 条件付き
                    console.log('🔍 条件指定モード - 条件:', condition);
                    const conditionalUsers = this.filterUsersByCondition(users, condition);
                    console.log('✅ フィルタリング結果:', conditionalUsers.length, '人');
                    return conditionalUsers;
                
                default:
                    return [];
            }
        } catch (error) {
            console.error('対象ユーザー取得エラー:', error);
            return [];
        }
    },
    
    /**
     * 条件でユーザーをフィルタリング
     * @param {Array} users - ユーザーリスト
     * @param {string} condition - 条件文字列（例: "rank=ゴールド", "points>10000"）
     * @returns {Array} - フィルタリング済みユーザーリスト
     */
    filterUsersByCondition(users, condition) {
        if (!condition) return users;
        
        try {
            // 条件をパース（簡易実装）
            const conditions = condition.split('&').map(c => c.trim());
            
            return users.filter(user => {
                return conditions.every(cond => {
                    // "key=value" または "key>value" 形式
                    const equalMatch = cond.match(/^(\w+)=(.+)$/);
                    const gtMatch = cond.match(/^(\w+)>(\d+)$/);
                    const ltMatch = cond.match(/^(\w+)<(\d+)$/);
                    
                    if (equalMatch) {
                        const [, key, value] = equalMatch;
                        return String(user[key]) === value;
                    } else if (gtMatch) {
                        const [, key, value] = gtMatch;
                        return Number(user[key]) > Number(value);
                    } else if (ltMatch) {
                        const [, key, value] = ltMatch;
                        return Number(user[key]) < Number(value);
                    }
                    
                    return false;
                });
            });
        } catch (error) {
            console.error('条件フィルタエラー:', error);
            return users;
        }
    },
    
    /**
     * 通知履歴を取得
     * @param {number} limit - 取得件数
     * @returns {Promise<Array>} - 通知履歴
     */
    async getHistory(limit = 50) {
        try {
            const response = await fetch(`tables/admin_notifications?limit=${limit}`);
            const data = await response.json();
            
            // 日時降順ソート
            return data.data.sort((a, b) => b.created_at_custom - a.created_at_custom);
        } catch (error) {
            console.error('通知履歴取得エラー:', error);
            return [];
        }
    },
    
    /**
     * 予約送信通知を処理（定期実行）
     */
    async processScheduledNotifications() {
        try {
            const response = await fetch('tables/admin_notifications?limit=1000');
            const data = await response.json();
            
            // scheduled状態で、送信時刻を過ぎているものを取得
            const now = Date.now();
            const toSend = data.data.filter(n => 
                n.status === 'scheduled' && 
                n.scheduled_time && 
                n.scheduled_time <= now
            );
            
            for (const notification of toSend) {
                // 送信処理
                const targetUsers = await this.getTargetUsers(
                    notification.target_type,
                    notification.target_user_ids || [],
                    notification.condition
                );
                
                let sentCount = 0;
                for (const user of targetUsers) {
                    try {
                        if (typeof NotificationSystem !== 'undefined') {
                            await NotificationSystem.create(user.id, {
                                title: notification.title,
                                message: notification.message,
                                type: notification.type,
                                icon: notification.icon,
                                link_url: notification.link_url,
                                link_screen: notification.link_screen
                            });
                            sentCount++;
                        }
                    } catch (error) {
                        console.error(`ユーザー ${user.id} への通知送信失敗:`, error);
                    }
                }
                
                // ステータス更新
                await fetch(`tables/admin_notifications/${notification.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'sent',
                        sent_time: Date.now(),
                        sent_count: sentCount
                    })
                });
                
                console.log(`予約通知送信完了: ${notification.title} (${sentCount}人)`);
            }
            
        } catch (error) {
            console.error('予約通知処理エラー:', error);
        }
    },
    
    // ========================================
    // テンプレート機能
    // ========================================
    
    /**
     * テンプレートを保存
     * @param {object} templateData - テンプレートデータ
     * @returns {Promise<object>} - 保存されたテンプレート
     */
    async saveTemplate(templateData) {
        try {
            const template = {
                name: templateData.name,
                category: templateData.category || 'その他',
                title: templateData.title,
                message: templateData.message,
                type: templateData.type || 'system',
                icon: templateData.icon || 'fa-bell',
                variables: templateData.variables || [],
                is_active: true,
                created_at_custom: Date.now()
            };
            
            const response = await fetch('tables/notification_templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template)
            });
            
            return await response.json();
        } catch (error) {
            console.error('テンプレート保存エラー:', error);
            throw error;
        }
    },
    
    /**
     * テンプレート一覧を取得
     * @returns {Promise<Array>} - テンプレートリスト
     */
    async getTemplates() {
        try {
            const response = await fetch('tables/notification_templates?limit=1000');
            const data = await response.json();
            
            return data.data.filter(t => t.is_active);
        } catch (error) {
            console.error('テンプレート取得エラー:', error);
            return [];
        }
    },
    
    /**
     * テンプレートから通知を作成（変数置換）
     * @param {object} template - テンプレート
     * @param {object} variables - 置換変数（{username: "太郎", points: 1000}等）
     * @returns {object} - 通知データ
     */
    applyTemplate(template, variables = {}) {
        let title = template.title;
        let message = template.message;
        
        // 変数を置換
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            title = title.replace(regex, value);
            message = message.replace(regex, value);
        }
        
        return {
            title: title,
            message: message,
            type: template.type,
            icon: template.icon
        };
    },
    
    // ========================================
    // 自動通知トリガー
    // ========================================
    
    /**
     * 案件承認時の自動通知
     * @param {string} userId - ユーザーID
     * @param {string} caseName - 案件名
     * @param {number} points - 獲得ポイント
     */
    async notifyCaseApproved(userId, caseName, points) {
        return await this.sendNotification({
            targetType: 'individual',
            targetUserIds: [userId],
            title: '🎉 案件承認のお知らせ',
            message: `「${caseName}」が承認されました！${points}ptを獲得しました。`,
            type: 'reward',
            icon: 'fa-check-circle',
            linkScreen: 'historyScreen',
            priority: 'high'
        });
    },
    
    /**
     * 案件却下時の自動通知
     * @param {string} userId - ユーザーID
     * @param {string} caseName - 案件名
     * @param {string} reason - 却下理由
     */
    async notifyCaseRejected(userId, caseName, reason) {
        return await this.sendNotification({
            targetType: 'individual',
            targetUserIds: [userId],
            title: '⚠️ 案件却下のお知らせ',
            message: `「${caseName}」が却下されました。理由: ${reason}`,
            type: 'warning',
            icon: 'fa-times-circle',
            linkScreen: 'contactScreen',
            priority: 'high'
        });
    },
    
    /**
     * お問い合わせ返信時の自動通知
     * @param {string} userId - ユーザーID
     * @param {string} ticketNumber - チケット番号
     */
    async notifyContactReply(userId, ticketNumber) {
        return await this.sendNotification({
            targetType: 'individual',
            targetUserIds: [userId],
            title: '💬 お問い合わせへの返信',
            message: `お問い合わせ #${ticketNumber} に返信がありました。`,
            type: 'system',
            icon: 'fa-reply',
            linkScreen: 'contactScreen',
            priority: 'normal'
        });
    },
    
    /**
     * ポイント交換承認時の自動通知
     * @param {string} userId - ユーザーID
     * @param {string} exchangeType - 交換先
     * @param {number} points - 交換ポイント
     * @param {string} code - 交換コード
     */
    async notifyExchangeApproved(userId, exchangeType, points, code) {
        return await this.sendNotification({
            targetType: 'individual',
            targetUserIds: [userId],
            title: '✅ ポイント交換完了',
            message: `${exchangeType}への交換（${points}pt）が完了しました。交換コード: ${code}`,
            type: 'reward',
            icon: 'fa-gift',
            linkScreen: 'exchangeScreen',
            priority: 'high'
        });
    },
    
    /**
     * ランクアップ時の自動通知
     * @param {string} userId - ユーザーID
     * @param {string} newRank - 新ランク
     */
    async notifyRankUp(userId, newRank) {
        return await this.sendNotification({
            targetType: 'individual',
            targetUserIds: [userId],
            title: '🎊 ランクアップ！',
            message: `おめでとうございます！${newRank}ランクに昇格しました！`,
            type: 'achievement',
            icon: 'fa-crown',
            linkScreen: 'myPageScreen',
            priority: 'high'
        });
    }
};

// ========================================
// グローバル公開
// ========================================
window.AdminNotificationSystem = AdminNotificationSystem;

// ロード完了フラグ
window.AdminNotificationSystemLoaded = true;

// ロード完了イベントを発火（他のスクリプトが待機できるように）
if (typeof window.CustomEvent !== 'undefined') {
    const event = new CustomEvent('AdminNotificationSystemReady', { detail: { loaded: true } });
    window.dispatchEvent(event);
    console.log('📢 AdminNotificationSystemReady イベントを発火しました');
}

// 予約通知の定期チェック（1分ごと）
setInterval(() => {
    AdminNotificationSystem.processScheduledNotifications();
}, 60000);

console.log('✅ 管理者通知システム (AdminNotificationSystem) ロード完了');
console.log('🔍 window.AdminNotificationSystem:', typeof window.AdminNotificationSystem);
console.log('🔍 window.AdminNotificationSystemLoaded:', window.AdminNotificationSystemLoaded);
