// データベース初期化スクリプト
// 初回アクセス時に自動的にテーブルとデモデータを作成

class DatabaseInitializer {
    constructor() {
        this.initialized = false;
    }
    
    // 初期化チェック
    async checkInitialization() {
        try {
            // usersテーブルが存在するか確認
            const response = await fetch('tables/users?limit=1');
            if (response.ok) {
                this.initialized = true;
                return true;
            }
        } catch (error) {
            console.log('データベース未初期化:', error);
        }
        return false;
    }
    
    // テーブルスキーマ定義
    getTableSchemas() {
        return {
            users: {
                fields: [
                    { name: 'id', type: 'text', description: 'ユーザーID（UUID）' },
                    { name: 'username', type: 'text', description: 'ユーザー名' },
                    { name: 'email', type: 'text', description: 'メールアドレス' },
                    { name: 'password', type: 'text', description: 'パスワード（ハッシュ化）' },
                    { name: 'points', type: 'number', description: '保有ポイント' },
                    { name: 'rank', type: 'text', description: 'ランク' },
                    { name: 'profile_icon', type: 'text', description: 'プロフィールアイコン' },
                    { name: 'profile_image', type: 'text', description: 'プロフィール画像（Base64）' },
                    { name: 'gender', type: 'text', description: '性別' },
                    { name: 'age_group', type: 'text', description: '年代' },
                    { name: 'occupation', type: 'text', description: '職業' },
                    { name: 'prefecture', type: 'text', description: '都道府県' },
                    { name: 'interests', type: 'array', description: '興味関心' },
                    { name: 'referral_code', type: 'text', description: '紹介コード' },
                    { name: 'referred_by', type: 'text', description: '紹介者コード' },
                    { name: 'email_verified', type: 'bool', description: 'メール認証済み' },
                    { name: 'phone_verified', type: 'bool', description: '電話認証済み' },
                    { name: 'two_factor_enabled', type: 'bool', description: '2段階認証有効' },
                    { name: 'two_factor_secret', type: 'text', description: '2段階認証シークレット' },
                    { name: 'consecutive_login_days', type: 'number', description: '連続ログイン日数' },
                    { name: 'last_login', type: 'datetime', description: '最終ログイン日時' }
                ]
            },
            
            cases: {
                fields: [
                    { name: 'id', type: 'text', description: '案件ID' },
                    { name: 'title', type: 'text', description: '案件名' },
                    { name: 'description', type: 'text', description: '説明' },
                    { name: 'category', type: 'text', description: 'カテゴリー' },
                    { name: 'points', type: 'number', description: '付与ポイント' },
                    { name: 'image', type: 'text', description: '画像URL' },
                    { name: 'url', type: 'text', description: '案件URL' },
                    { name: 'estimated_time', type: 'text', description: '所要時間' },
                    { name: 'difficulty', type: 'text', description: '難易度' },
                    { name: 'is_new', type: 'bool', description: '新着案件' },
                    { name: 'is_featured', type: 'bool', description: 'おすすめ案件' },
                    { name: 'is_active', type: 'bool', description: '公開状態' }
                ]
            },
            
            points_history: {
                fields: [
                    { name: 'id', type: 'text', description: '履歴ID' },
                    { name: 'user_id', type: 'text', description: 'ユーザーID' },
                    { name: 'type', type: 'text', description: 'タイプ' },
                    { name: 'points', type: 'number', description: 'ポイント数' },
                    { name: 'source', type: 'text', description: 'ソース' },
                    { name: 'description', type: 'text', description: '説明' }
                ]
            },
            
            surveys: {
                fields: [
                    { name: 'id', type: 'text', description: 'アンケートID' },
                    { name: 'title', type: 'text', description: 'タイトル' },
                    { name: 'description', type: 'text', description: '説明' },
                    { name: 'category', type: 'text', description: 'カテゴリー' },
                    { name: 'points', type: 'number', description: '付与ポイント' },
                    { name: 'estimated_time', type: 'text', description: '所要時間' },
                    { name: 'target_responses', type: 'number', description: '目標回答数' },
                    { name: 'current_responses', type: 'number', description: '現在の回答数' },
                    { name: 'questions', type: 'text', description: '質問データ（JSON）' },
                    { name: 'is_active', type: 'bool', description: '公開状態' },
                    { name: 'requires_email_verification', type: 'bool', description: 'メール認証必須' },
                    { name: 'requires_phone_verification', type: 'bool', description: '電話認証必須' },
                    { name: 'start_date', type: 'datetime', description: '開始日' },
                    { name: 'end_date', type: 'datetime', description: '終了日' },
                    { name: 'created_by', type: 'text', description: '作成者ID' }
                ]
            },
            
            survey_responses: {
                fields: [
                    { name: 'id', type: 'text', description: '回答ID' },
                    { name: 'survey_id', type: 'text', description: 'アンケートID' },
                    { name: 'user_id', type: 'text', description: 'ユーザーID' },
                    { name: 'answers', type: 'text', description: '回答データ（JSON）' },
                    { name: 'completed', type: 'bool', description: '完了状態' }
                ]
            },
            
            notifications: {
                fields: [
                    { name: 'id', type: 'text', description: '通知ID' },
                    { name: 'user_id', type: 'text', description: 'ユーザーID' },
                    { name: 'type', type: 'text', description: 'タイプ' },
                    { name: 'priority', type: 'text', description: '優先度' },
                    { name: 'title', type: 'text', description: 'タイトル' },
                    { name: 'message', type: 'text', description: 'メッセージ' },
                    { name: 'icon', type: 'text', description: 'アイコン' },
                    { name: 'link_screen', type: 'text', description: 'リンク先画面' },
                    { name: 'is_read', type: 'bool', description: '既読状態' },
                    { name: 'scheduled_time', type: 'datetime', description: '予約送信時刻' },
                    { name: 'sent_at', type: 'datetime', description: '送信日時' }
                ]
            },
            
            referrals: {
                fields: [
                    { name: 'id', type: 'text', description: '紹介ID' },
                    { name: 'referrer_id', type: 'text', description: '紹介者ID' },
                    { name: 'referred_id', type: 'text', description: '被紹介者ID' },
                    { name: 'referral_code', type: 'text', description: '紹介コード' },
                    { name: 'bonus_claimed', type: 'bool', description: 'ボーナス受取済み' }
                ]
            },
            
            login_history: {
                fields: [
                    { name: 'id', type: 'text', description: '履歴ID' },
                    { name: 'user_id', type: 'text', description: 'ユーザーID' },
                    { name: 'login_method', type: 'text', description: 'ログイン方法' },
                    { name: 'ip_address', type: 'text', description: 'IPアドレス' },
                    { name: 'user_agent', type: 'text', description: 'ユーザーエージェント' },
                    { name: 'device_type', type: 'text', description: 'デバイスタイプ' },
                    { name: 'location', type: 'text', description: '位置情報' },
                    { name: 'status', type: 'text', description: 'ステータス' },
                    { name: 'two_factor_used', type: 'bool', description: '2段階認証使用' },
                    { name: 'is_suspicious', type: 'bool', description: '不審なログイン' }
                ]
            }
        };
    }
    
    // デモデータ取得
    getDemoData() {
        return {
            users: [
                {
                    username: 'admin',
                    email: 'admin@pointshiba.com',
                    password: 'admin', // 実際にはハッシュ化が必要
                    points: 100000,
                    rank: 'ダイヤモンド',
                    profile_icon: 'fa-crown',
                    referral_code: 'ADMIN001',
                    email_verified: true,
                    phone_verified: true,
                    two_factor_enabled: false,
                    consecutive_login_days: 30
                },
                {
                    username: 'demo',
                    email: 'demo@pointshiba.com',
                    password: 'demo', // 実際にはハッシュ化が必要
                    points: 5000,
                    rank: 'ゴールド',
                    profile_icon: 'fa-user',
                    referral_code: 'DEMO001',
                    email_verified: true,
                    phone_verified: false,
                    two_factor_enabled: false,
                    consecutive_login_days: 7
                }
            ],
            
            cases: [
                {
                    title: '楽天カード発行',
                    description: '年会費永年無料の楽天カード。今なら15,000ポイント！',
                    category: 'クレジットカード',
                    points: 15000,
                    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
                    url: 'https://example.com',
                    estimated_time: '5分',
                    difficulty: '簡単',
                    is_new: true,
                    is_featured: true,
                    is_active: true
                },
                {
                    title: '三井住友銀行 口座開設',
                    description: 'ネット銀行で便利！口座開設で8,000ポイント',
                    category: '口座開設',
                    points: 8000,
                    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
                    url: 'https://example.com',
                    estimated_time: '10分',
                    difficulty: '簡単',
                    is_new: true,
                    is_featured: true,
                    is_active: true
                },
                {
                    title: 'Amazonで買い物',
                    description: '購入金額の5%ポイント還元！',
                    category: 'ショッピング',
                    points: 500,
                    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=600&fit=crop',
                    url: 'https://example.com',
                    estimated_time: '即時',
                    difficulty: '簡単',
                    is_new: false,
                    is_featured: true,
                    is_active: true
                }
            ]
        };
    }
    
    // 初期化実行
    async initialize() {
        console.log('🗄️ データベース初期化を開始...');
        
        const isInitialized = await this.checkInitialization();
        if (isInitialized) {
            console.log('✅ データベースは既に初期化済みです');
            return true;
        }
        
        console.log('⚠️ Netlify Table APIはDashboardまたはCLIでのみテーブル作成可能です');
        console.log('📚 DATABASE_SETUP.md を参照してテーブルを手動で作成してください');
        
        return false;
    }
}

// グローバルで使用可能にする
window.DatabaseInitializer = DatabaseInitializer;

// 自動初期化（オプション）
document.addEventListener('DOMContentLoaded', async () => {
    const dbInit = new DatabaseInitializer();
    await dbInit.initialize();
});
