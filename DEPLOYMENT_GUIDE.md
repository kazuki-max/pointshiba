# デプロイガイド - Netlify + Supabase

## 📋 目次
1. [準備](#1-準備)
2. [Firebase セットアップ](#2-firebase-セットアップ)
3. [Netlify デプロイ](#3-netlify-デプロイ)
4. [ドメイン接続](#4-ドメイン接続)
5. [Supabase セットアップ](#5-supabase-セットアップ)
6. [本番環境テスト](#6-本番環境テスト)

---

## 1. 準備

### 必要なアカウント
- [ ] GitHub アカウント
- [ ] Netlify アカウント（GitHubでサインアップ可能）
- [ ] Firebase アカウント（Googleアカウント）
- [ ] Supabase アカウント（GitHubでサインアップ可能）
- [ ] 取得済みドメイン

### 必要なファイル
- [ ] プロジェクト一式
- [ ] `js/firebase-config.js`（後で作成）

---

## 2. Firebase セットアップ

`FIREBASE_SETUP_GUIDE.md` を参照して、以下を完了してください：

### チェックリスト
- [ ] Firebaseプロジェクト作成
- [ ] Firebase Authentication 有効化
- [ ] メール/パスワード認証 有効化
- [ ] Google ログイン 有効化
- [ ] Facebook ログイン 設定（App ID/Secret取得）
- [ ] X (Twitter) ログイン 設定（API Key/Secret取得）
- [ ] 電話番号認証 有効化
- [ ] APIキー取得
- [ ] `js/firebase-config.js` ファイル作成

### firebase-config.js の作成

```bash
# サンプルファイルをコピー
cp js/firebase-config.example.js js/firebase-config.js

# エディタで開いて Firebase Console から取得した値を記入
# YOUR_API_KEY などを実際の値に置き換える
```

---

## 3. Netlify デプロイ

### ステップ 3-1: GitHub にプッシュ

```bash
# Git リポジトリを初期化（まだの場合）
git init

# すべてのファイルを追加（firebase-config.js は .gitignore で除外される）
git add .

# コミット
git commit -m "Initial commit - ポイしば完成版"

# GitHub リポジトリを作成して接続
git remote add origin https://github.com/YOUR_USERNAME/pointshiba.git
git branch -M main
git push -u origin main
```

### ステップ 3-2: Netlify で新規サイト作成

1. [Netlify](https://www.netlify.com/) にログイン
2. 「Add new site」→「Import an existing project」
3. 「GitHub」を選択
4. リポジトリを選択（pointshiba）
5. ビルド設定:
   - **Build command**: （空欄）
   - **Publish directory**: `.`（ドット）
6. 「Deploy site」をクリック

### ステップ 3-3: 環境変数設定（重要！）

Netlify Dashboard で:

1. Site settings → Build & deploy → Environment
2. 「Add environment variable」をクリック
3. Firebase 設定を追加:

```
FIREBASE_API_KEY = "YOUR_API_KEY"
FIREBASE_AUTH_DOMAIN = "your-project.firebaseapp.com"
FIREBASE_PROJECT_ID = "your-project"
FIREBASE_STORAGE_BUCKET = "your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID = "123456789012"
FIREBASE_APP_ID = "1:123456789012:web:abcdef123456"
```

### ステップ 3-4: ビルドフック設定

1. Site settings → Build & deploy → Build hooks
2. 「Add build hook」
3. 名前: "Firebase Config Update"
4. ブランチ: main
5. 「Save」をクリック
6. 生成されたURLをコピー（後で使用）

---

## 4. ドメイン接続

### ステップ 4-1: Netlify でカスタムドメイン追加

1. Site settings → Domain management
2. 「Add custom domain」をクリック
3. あなたのドメインを入力（例: pointshiba.com）
4. 「Verify」をクリック

### ステップ 4-2: DNS 設定

ドメイン管理画面（お名前.com、ムームードメイン等）で:

#### Aレコードを追加
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600
```

#### CNAMEレコードを追加
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app
TTL: 3600
```

### ステップ 4-3: SSL証明書の有効化

1. Netlify Dashboard → Domain management
2. 「HTTPS」セクション
3. 「Verify DNS configuration」をクリック
4. 「Provision certificate」をクリック
5. 数分待つと自動的にSSL証明書が発行される

---

## 5. Supabase セットアップ

### ステップ 5-1: プロジェクト作成

1. [Supabase](https://supabase.com/) にログイン
2. 「New project」をクリック
3. プロジェクト名: **ポイしば**
4. Database Password: 強力なパスワードを生成
5. Region: **Northeast Asia (Tokyo)**
6. 「Create new project」をクリック

### ステップ 5-2: テーブル作成

SQL Editor で以下を実行:

```sql
-- users テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'ブロンズ',
  rank_points INTEGER DEFAULT 0,
  consecutive_login_days INTEGER DEFAULT 0,
  last_login_date DATE,
  total_referrals INTEGER DEFAULT 0,
  profile_image TEXT DEFAULT 'fa-user',
  referral_code TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  profile_bonus_rate INTEGER DEFAULT 0,
  referral_bonus_rate INTEGER DEFAULT 0,
  profile_completed BOOLEAN DEFAULT FALSE,
  gender TEXT,
  age_group TEXT,
  occupation TEXT,
  prefecture TEXT,
  interests TEXT[],
  social_provider TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 他のテーブルも同様に作成
-- cases, point_history, exchange_history, etc.
```

### ステップ 5-3: API キー取得

1. Project Settings → API
2. **Project URL** をコピー
3. **anon** key をコピー
4. **service_role** key をコピー（管理用）

### ステップ 5-4: Netlify に Supabase API キー追加

Netlify Dashboard → Environment variables:

```
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 6. 本番環境テスト

### テスト項目

#### 基本機能
- [ ] サイトが表示される
- [ ] ログインできる
- [ ] 新規登録できる
- [ ] パスワードリセットできる

#### Firebase 認証
- [ ] Google ログインできる
- [ ] Facebook ログインできる
- [ ] X (Twitter) ログインできる
- [ ] 電話番号認証（SMS）が届く
- [ ] メール認証が届く

#### データベース
- [ ] ユーザーデータが保存される
- [ ] ポイント履歴が記録される
- [ ] アンケートが表示される

#### パフォーマンス
- [ ] ページ読み込みが3秒以内
- [ ] モバイルで正常に動作
- [ ] SSL証明書が有効

---

## 7. トラブルシューティング

### 問題: Firebase エラー「This domain is not authorized」

**解決方法**:
1. Firebase Console → Authentication → Settings
2. 「承認済みドメイン」タブ
3. あなたのドメイン（pointshiba.com）を追加

### 問題: SMS が送信されない

**解決方法**:
1. Firebase Console → Authentication → Phone
2. reCAPTCHA が有効になっているか確認
3. テスト用電話番号を登録

### 問題: ソーシャルログインが動作しない

**解決方法**:
1. 各プロバイダーの Callback URL を確認:
   ```
   https://your-project.firebaseapp.com/__/auth/handler
   ```
2. プロバイダーの設定画面で URL を更新

### 問題: Netlify デプロイが失敗する

**解決方法**:
1. `netlify.toml` ファイルが正しいか確認
2. ビルドログを確認
3. 環境変数が設定されているか確認

---

## 8. 公開チェックリスト

### デプロイ前
- [ ] Firebase 設定完了
- [ ] すべての API キー取得済み
- [ ] `js/firebase-config.js` 作成済み
- [ ] `.gitignore` に firebase-config.js 追加済み
- [ ] ローカルでテスト完了

### デプロイ後
- [ ] サイトが表示される
- [ ] すべての認証方法が動作する
- [ ] SSL証明書が有効
- [ ] カスタムドメインが動作する
- [ ] データベース接続が動作する

### 運用開始
- [ ] Firebase の予算アラート設定（月¥1,000推奨）
- [ ] Supabase のバックアップ設定
- [ ] Google Analytics 設定（オプション）
- [ ] 利用規約・プライバシーポリシー確認

---

## 9. 料金概算

| サービス | 月間10,000ユーザー | 備考 |
|---------|------------------|------|
| Netlify | ¥0 | 100GB まで無料 |
| Firebase Auth | ¥0 | 電話認証10,000通まで無料 |
| Supabase | ¥0 | 500MB まで無料 |
| **合計** | **¥0** | 🎉 |

---

## 10. 次のステップ

デプロイ完了後:
1. ✅ ユーザーテストを実施
2. ✅ フィードバックを収集
3. ✅ バグ修正・改善
4. ✅ マーケティング開始

---

**作成日**: 2025-11-19  
**バージョン**: 1.0  
**サポート**: README.md を参照
