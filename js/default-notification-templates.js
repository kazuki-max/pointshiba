/**
 * ========================================
 * デフォルト通知テンプレート
 * ========================================
 * 
 * 初回起動時にデフォルトテンプレートを作成
 */

const defaultNotificationTemplates = [
    {
        name: '案件承認通知',
        category: '案件承認',
        title: '🎉 案件承認のお知らせ',
        message: '{username}さん、「{case_name}」が承認されました！{points}ptを獲得しました。',
        type: 'reward',
        icon: 'fa-check-circle',
        variables: ['username', 'case_name', 'points']
    },
    {
        name: '案件却下通知',
        category: '案件却下',
        title: '⚠️ 案件却下のお知らせ',
        message: '{username}さん、「{case_name}」が却下されました。理由: {reason}',
        type: 'warning',
        icon: 'fa-times-circle',
        variables: ['username', 'case_name', 'reason']
    },
    {
        name: 'ポイント交換完了',
        category: 'ポイント交換',
        title: '✅ ポイント交換完了',
        message: '{exchange_type}への交換（{points}pt）が完了しました。交換コード: {code}',
        type: 'reward',
        icon: 'fa-gift',
        variables: ['exchange_type', 'points', 'code']
    },
    {
        name: 'ランクアップ通知',
        category: 'ランクアップ',
        title: '🎊 ランクアップ！',
        message: 'おめでとうございます！{username}さんが{rank}ランクに昇格しました！',
        type: 'achievement',
        icon: 'fa-crown',
        variables: ['username', 'rank']
    },
    {
        name: 'メンテナンス通知',
        category: 'メンテナンス',
        title: '🔧 メンテナンスのお知らせ',
        message: '{date}に定期メンテナンスを実施します。ご不便をおかけしますが、ご理解とご協力をお願いいたします。',
        type: 'system',
        icon: 'fa-tools',
        variables: ['date']
    },
    {
        name: '新機能リリース',
        category: '新機能',
        title: '🆕 新機能追加のお知らせ',
        message: '新機能「{feature_name}」をリリースしました！ぜひお試しください。',
        type: 'announcement',
        icon: 'fa-rocket',
        variables: ['feature_name']
    },
    {
        name: 'キャンペーン告知',
        category: 'キャンペーン',
        title: '🎁 期間限定キャンペーン！',
        message: '{campaign_name}を開催中！{end_date}まで。この機会をお見逃しなく！',
        type: 'announcement',
        icon: 'fa-bullhorn',
        variables: ['campaign_name', 'end_date']
    },
    {
        name: 'ログインボーナス',
        category: 'ボーナス',
        title: '🎁 ログインボーナス',
        message: '{username}さん、連続ログイン{days}日目！{points}ptを獲得しました。',
        type: 'reward',
        icon: 'fa-gift',
        variables: ['username', 'days', 'points']
    },
    {
        name: 'お問い合わせ返信',
        category: 'お問い合わせ',
        title: '💬 お問い合わせへの返信',
        message: 'お問い合わせ #{ticket_number} に返信がありました。ご確認ください。',
        type: 'system',
        icon: 'fa-reply',
        variables: ['ticket_number']
    },
    {
        name: '実績解除',
        category: '実績',
        title: '🏆 実績解除！',
        message: '実績「{achievement_name}」を解除しました！{points}ptを獲得しました。',
        type: 'achievement',
        icon: 'fa-trophy',
        variables: ['achievement_name', 'points']
    }
];

// ========================================
// デフォルトテンプレート初期化
// ========================================
async function initializeDefaultTemplates() {
    try {
        // 既存テンプレートをチェック
        const response = await fetch('tables/notification_templates?limit=1');
        const data = await response.json();
        
        // テンプレートがまだない場合のみ作成
        if (data.data.length === 0) {
            console.log('デフォルトテンプレートを作成中...');
            
            for (const template of defaultNotificationTemplates) {
                await AdminNotificationSystem.saveTemplate(template);
            }
            
            console.log('✅ デフォルトテンプレート作成完了');
        }
    } catch (error) {
        console.error('デフォルトテンプレート初期化エラー:', error);
    }
}

// 管理者ログイン時に初期化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (MobileApp.currentUser && MobileApp.currentUser.username === 'admin') {
            initializeDefaultTemplates();
        }
    }, 2000);
});

console.log('✅ デフォルト通知テンプレート ロード完了');
