# Firebase Authentication セットアップガイド

## 📋 目次
1. [Firebaseプロジェクト作成](#1-firebaseプロジェクト作成)
2. [Firebase Authentication 有効化](#2-firebase-authentication-有効化)
3. [認証プロバイダー設定](#3-認証プロバイダー設定)
4. [APIキー取得と設定](#4-apiキー取得と設定)
5. [トラブルシューティング](#5-トラブルシューティング)

---

## 1. Firebaseプロジェクト作成

### ステップ 1-1: Firebase Console にアクセス
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. Googleアカウントでログイン

### ステップ 1-2: 新規プロジェクト作成
1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力: **ポイしば** (または任意の名前)
3. 「続行」をクリック
4. Google アナリティクス: **有効化（推奨）** または スキップ
5. 「プロジェクトを作成」をクリック

### ステップ 1-3: Webアプリを追加
1. プロジェクトのホーム画面で「ウェブ」アイコン (`</>`) をクリック
2. アプリのニックネーム: **ポイしば Web**
3. Firebase Hosting: **チェックを入れない**（Netlify使用のため）
4. 「アプリを登録」をクリック
5. **Firebase SDK の設定情報が表示されます** ← これをメモ！

```javascript
// 表示される設定情報（例）
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**⚠️ 重要**: この設定情報を **`firebase-config.js`** ファイルに保存します（後述）

---

## 2. Firebase Authentication 有効化

### ステップ 2-1: Authentication に移動
1. 左サイドバーから「構築」→「Authentication」をクリック
2. 「始める」ボタンをクリック

### ステップ 2-2: ログイン方法を有効化
「Sign-in method」タブで以下を有効化します：

#### ✅ メール/パスワード
1. 「メール/パスワード」をクリック
2. 「有効にする」をオン
3. 「メールリンク（パスワード不要のログイン）」もオン（推奨）
4. 「保存」をクリック

---

## 3. 認証プロバイダー設定

### 3-1. Google ログイン（最優先）✨

#### ステップ A: Firebase で有効化
1. Authentication → Sign-in method
2. 「Google」をクリック
3. 「有効にする」をオン
4. プロジェクトの公開名: **ポイしば**
5. サポートメール: あなたのメールアドレス
6. 「保存」をクリック

**完了！Google ログインはこれだけでOK！**

---

### 3-2. Facebook ログイン

#### ステップ A: Facebook Developers でアプリ作成
1. [Facebook for Developers](https://developers.facebook.com/) にアクセス
2. 「マイアプリ」→「アプリを作成」
3. アプリタイプ: **消費者**
4. アプリ名: **ポイしば**
5. アプリの連絡先メールアドレス: あなたのメール
6. 「アプリを作成」をクリック

#### ステップ B: Facebook Login を追加
1. ダッシュボードから「製品を追加」
2. 「Facebook Login」の「設定」をクリック
3. プラットフォーム: **ウェブ**
4. サイトURL: `https://your-domain.com`（後で変更可能）
5. 「保存」をクリック

#### ステップ C: OAuth リダイレクトURI を設定
1. Facebook Login → 設定
2. 「有効なOAuthリダイレクトURI」に以下を追加:
   ```
   https://your-project.firebaseapp.com/__/auth/handler
   ```
3. 「変更を保存」

#### ステップ D: アプリIDとシークレットを取得
1. 設定 → 基本設定
2. **アプリID** をコピー
3. **app secret** の「表示」をクリックしてコピー

#### ステップ E: Firebase に設定
1. Firebase Console → Authentication → Sign-in method
2. 「Facebook」をクリック
3. 「有効にする」をオン
4. アプリID: 先ほどコピーしたものを貼り付け
5. app secret: 先ほどコピーしたものを貼り付け
6. 「保存」をクリック

---

### 3-3. X (旧Twitter) ログイン

#### ステップ A: X Developer Portal でアプリ作成
1. [X Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. 「Create Project」をクリック
3. プロジェクト名: **ポイしば**
4. 用途: **Making a bot** または **Exploring the API**
5. プロジェクトを作成

#### ステップ B: アプリを作成
1. 「Create an app」をクリック
2. アプリ名: **ポイしば Web**
3. API Key と API Secret Key をコピーして保存

#### ステップ C: アプリ設定
1. アプリの「Settings」タブ
2. 「Authentication settings」の「Set up」をクリック
3. 「Enable 3-legged OAuth」をオン
4. Callback URL: 
   ```
   https://your-project.firebaseapp.com/__/auth/handler
   ```
5. Website URL: `https://your-domain.com`
6. 「Save」をクリック

#### ステップ D: Firebase に設定
1. Firebase Console → Authentication → Sign-in method
2. 「Twitter」をクリック
3. 「有効にする」をオン
4. API Key: 先ほどコピーしたものを貼り付け
5. API Secret: 先ほどコピーしたものを貼り付け
6. 「保存」をクリック

---

### 3-4. LINE ログイン

#### ステップ A: LINE Developers でチャネル作成
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 「新規プロバイダー作成」をクリック
3. プロバイダー名: **ポイしば**
4. 「作成」をクリック

#### ステップ B: チャネルを作成
1. 「新規チャネル作成」をクリック
2. チャネルタイプ: **LINEログイン**
3. チャネル名: **ポイしば**
4. チャネル説明: **ポイントサイト ポイしば**
5. アプリタイプ: **ウェブアプリ**
6. メールアドレス: あなたのメール
7. 「作成」をクリック

#### ステップ C: Callback URL を設定
1. チャネル基本設定
2. 「コールバックURL」に以下を追加:
   ```
   https://your-project.firebaseapp.com/__/auth/handler
   ```
3. 「更新」をクリック

#### ステップ D: Channel ID と Channel Secret を取得
1. チャネル基本設定
2. **Channel ID** をコピー
3. **Channel Secret** をコピー

#### ステップ E: カスタム認証プロバイダーとして Firebase に設定

**⚠️ 注意**: Firebase は LINE を直接サポートしていないため、カスタム実装が必要です。

実装方法は以下の2つ：

**方法1: Firebase Functions 使用（推奨）**
- Netlify Functions で LINEのOAuth処理を実装
- Firebase Custom Token を発行

**方法2: LINE SDK直接使用**
- クライアントサイドで LINE Login SDK を使用
- 取得したIDトークンで Firebase にログイン

詳細は `LINE_LOGIN_IMPLEMENTATION.md` を参照してください。

---

### 3-5. 電話番号認証（SMS）

#### ステップ A: Firebase で有効化
1. Authentication → Sign-in method
2. 「電話番号」をクリック
3. 「有効にする」をオン
4. 「保存」をクリック

#### ステップ B: テスト用電話番号を追加（開発用）
1. 「電話番号」設定画面
2. 「テスト用の電話番号」セクション
3. 電話番号: `+81 90 1234 5678`（例）
4. 確認コード: `123456`（任意の6桁）
5. 「追加」をクリック

**⚠️ 重要**: 
- 本番環境では reCAPTCHA が必要（自動的に有効化されます）
- 日本国内のSMSは1通あたり約¥6
- 月10,000通まで無料

---

## 4. APIキー取得と設定

### ステップ 4-1: Firebase 設定情報を確認
1. プロジェクト設定（⚙️アイコン）→「全般」タブ
2. 「マイアプリ」セクションで先ほど作成したWebアプリを確認
3. 「SDK の設定と構成」で設定情報を表示

### ステップ 4-2: 設定ファイルを作成

プロジェクトに **`js/firebase-config.js`** ファイルを作成：

```javascript
// Firebase 設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Firebase 初期化
firebase.initializeApp(firebaseConfig);
```

**⚠️ 重要**: 
- `YOUR_API_KEY` などを実際の値に置き換えてください
- このファイルは `.gitignore` に追加してください（機密情報のため）

### ステップ 4-3: .gitignore に追加

プロジェクトルートに `.gitignore` ファイルを作成または編集：

```
# Firebase 設定（機密情報）
js/firebase-config.js

# その他
node_modules/
.env
.DS_Store
```

### ステップ 4-4: サンプル設定ファイルを作成

**`js/firebase-config.example.js`** を作成：

```javascript
// Firebase 設定（サンプル）
// 実際の値は firebase-config.js に記述してください
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Firebase 初期化
firebase.initializeApp(firebaseConfig);
```

---

## 5. トラブルシューティング

### 問題1: 「This domain is not authorized」エラー

**原因**: Firebase の承認済みドメインにあなたのドメインが登録されていない

**解決方法**:
1. Firebase Console → Authentication → Settings
2. 「承認済みドメイン」タブ
3. 「ドメインを追加」をクリック
4. あなたのドメイン（例: `your-domain.com`）を追加
5. 「追加」をクリック

### 問題2: reCAPTCHA が表示されない

**原因**: reCAPTCHA がブロックされている、またはドメインが未登録

**解決方法**:
1. ブラウザの広告ブロッカーを無効化
2. Firebase Console → Authentication → Settings → 「承認済みドメイン」を確認
3. `localhost` または `127.0.0.1` は開発用に自動承認済み

### 問題3: LINE ログインが動作しない

**原因**: LINE は Firebase の標準プロバイダーではない

**解決方法**:
- カスタム実装が必要
- `LINE_LOGIN_IMPLEMENTATION.md` を参照

### 問題4: SMS が送信されない（日本）

**原因**: Firebase の電話番号認証は一部の国で制限がある

**解決方法**:
1. テスト用電話番号を使用（開発中）
2. 本番環境では実際のSMSが送信される
3. reCAPTCHA が正しく動作していることを確認

---

## 6. セキュリティルール（重要）

### ステップ 6-1: Firestore セキュリティルールを設定

後で Supabase と併用する場合、Firestore は使用しないかもしれませんが、
念のため基本的なセキュリティルールを設定：

1. Firebase Console → Firestore Database → ルール
2. 以下のルールを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のドキュメントのみ読み書き可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // その他のコレクションは認証済みユーザーのみ読み取り可能
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

---

## 7. 料金アラート設定（推奨）

### ステップ 7-1: 予算アラートを設定
1. Firebase Console → 左下の「アップグレード」
2. 「Blaze プラン」に変更（従量課金）
3. 「予算アラート」を設定
4. 月額上限: **¥1,000**（推奨）
5. アラートメール: あなたのメールアドレス

**これで月¥1,000を超えると通知が来ます！**

---

## 8. 完了チェックリスト

実装前に以下を確認してください：

- [ ] Firebaseプロジェクト作成完了
- [ ] Firebase Authentication 有効化完了
- [ ] メール/パスワード認証 有効化
- [ ] Google ログイン 有効化
- [ ] Facebook ログイン 設定完了（App ID/Secret取得）
- [ ] X (Twitter) ログイン 設定完了（API Key/Secret取得）
- [ ] LINE ログイン チャネル作成完了（Channel ID/Secret取得）
- [ ] 電話番号認証 有効化
- [ ] テスト用電話番号 登録完了
- [ ] Firebase SDK 設定情報を `firebase-config.js` に保存
- [ ] 承認済みドメイン に本番ドメイン追加
- [ ] 予算アラート 設定完了

---

## 9. 次のステップ

セットアップが完了したら：

1. ✅ `firebase-config.js` に設定情報を記述
2. ✅ コードに Firebase SDK を統合（実装済み）
3. ✅ 各認証機能をテスト
4. ✅ Netlify にデプロイ
5. ✅ 本番環境でテスト

---

## 📞 サポート

問題が発生した場合：
1. [Firebase ドキュメント](https://firebase.google.com/docs/auth)
2. [Firebase サポート](https://firebase.google.com/support)
3. Stack Overflow で検索

---

**作成日**: 2025-11-19  
**バージョン**: 1.0
