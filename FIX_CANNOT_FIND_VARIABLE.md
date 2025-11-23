# 「Can't find variable: AdminNotificationSystem」エラーの修正

## エラー内容
```
通知送信に失敗しました: Can't find variable: AdminNotificationSystem
```

## 原因
スクリプトの読み込みタイミングの問題により、`admin-notification-ui.js` が実行される時点で `admin-notification-system.js` がまだ完全に読み込まれていない。

## 実施した修正

### 1. 存在確認の追加 ✅
**ファイル:** `js/admin-notification-ui.js`

`handleAdminNotificationSubmit` 関数内で `AdminNotificationSystem` を使用する前に存在確認を追加：

```javascript
// AdminNotificationSystemの存在確認
if (typeof AdminNotificationSystem === 'undefined') {
    console.error('❌ AdminNotificationSystem が定義されていません');
    showToast('システムエラー: AdminNotificationSystem が読み込まれていません', 'error');
    return;
}
```

### 2. 初期化タイミングの遅延 ✅
**ファイル:** `js/admin-notification-ui.js`

イベントリスナーの登録タイミングを `1500ms` → `2000ms` に変更し、`AdminNotificationSystem` の読み込みを待つロジックを追加：

```javascript
// 初回読み込み時（遅延実行 - AdminNotificationSystemの読み込みを待つ）
setTimeout(function() {
    console.log('📍 DOMContentLoaded後の初回アタッチ');
    console.log('🔍 AdminNotificationSystem 存在確認:', typeof AdminNotificationSystem);
    
    if (typeof AdminNotificationSystem === 'undefined') {
        console.warn('⚠️ AdminNotificationSystem がまだ読み込まれていません。再試行します...');
        // 再試行
        setTimeout(function() {
            console.log('🔄 AdminNotificationSystem 再確認:', typeof AdminNotificationSystem);
            attachAdminNotificationListeners();
        }, 1000);
    } else {
        attachAdminNotificationListeners();
    }
}, 2000);
```

### 3. ロード完了フラグの追加 ✅
**ファイル:** `js/admin-notification-system.js`

グローバルフラグを追加して、読み込み完了を明示的に確認可能に：

```javascript
// ロード完了フラグ
window.AdminNotificationSystemLoaded = true;

console.log('✅ 管理者通知システム (AdminNotificationSystem) ロード完了');
console.log('🔍 window.AdminNotificationSystem:', typeof window.AdminNotificationSystem);
console.log('🔍 window.AdminNotificationSystemLoaded:', window.AdminNotificationSystemLoaded);
```

### 4. デバッグヘルパー関数の追加 ✅
**ファイル:** `js/admin-notification-ui.js`

コンソールで簡単にデバッグ情報を確認できる関数を追加：

```javascript
window.debugAdminNotification = function() {
    console.log('=== 管理者通知システム デバッグ情報 ===');
    console.log('AdminNotificationSystem:', typeof AdminNotificationSystem);
    console.log('AdminNotificationSystemLoaded:', window.AdminNotificationSystemLoaded);
    console.log('MobileApp.currentUser:', MobileApp.currentUser);
    console.log('NotificationSystem:', typeof NotificationSystem);
    console.log('Form element:', document.getElementById('adminNotificationForm'));
    // ... その他のデバッグ情報
};
```

---

## テスト手順

### 1. 完全リフレッシュ
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 2. 開発者ツールを開く
- **F12** キー
- **コンソール** タブ

### 3. ページ読み込み時のログを確認
以下のログが順番に表示されるはずです：

```
✅ 管理者通知システム (AdminNotificationSystem) ロード完了
🔍 window.AdminNotificationSystem: object
🔍 window.AdminNotificationSystemLoaded: true
📍 DOMContentLoaded後の初回アタッチ
🔍 AdminNotificationSystem 存在確認: object
🔧 イベントリスナーのアタッチを開始...
✅ イベントリスナーのアタッチ完了
🔍 フォームイベントリスナー登録を試行...
🔍 AdminNotificationSystem 存在確認: object
✅ 管理者通知フォームイベントリスナー登録完了
✅ 管理者通知UI統合 ロード完了
💡 デバッグ用: コンソールで debugAdminNotification() を実行してください
```

### 4. デバッグヘルパーを実行
コンソールで以下を入力：

```javascript
debugAdminNotification()
```

**期待される出力:**
```
=== 管理者通知システム デバッグ情報 ===
AdminNotificationSystem: object
AdminNotificationSystemLoaded: true
MobileApp.currentUser: {id: "...", username: "admin", ...}
NotificationSystem: object
Form element: [object HTMLFormElement]
Form onsubmit: function
Form dataset.listenerAdded: true
========================================
```

### 5. 管理者通知画面を開く
- adminでログイン
- マイページ > ユーザー通知管理

**期待されるログ:**
```
🎯 管理者通知画面を初期化
🔄 画面初期化時のイベントリスナー再アタッチ...
🔧 イベントリスナーのアタッチを開始...
✅ フォームイベントリスナー追加（画面初期化時）
```

### 6. 通知を送信してみる
- タイトル: 「テスト」
- メッセージ: 「テスト」
- 送信ボタンをクリック

**期待されるログ:**
```
🚀 handleAdminNotificationSubmit 関数が呼ばれました！
✅ preventDefault 実行済み
🔍 現在のユーザー: {username: "admin", ...}
✅ 管理者権限確認OK
📝 フォームデータ取得開始...
📝 取得データ: {targetType: "all", title: "テスト", ...}
💬 確認ダイアログ表示
✅ ユーザーが送信を承認しました
📤 AdminNotificationSystem.sendNotification を呼び出します...
🔍 AdminNotificationSystem の存在確認: object
📢 通知送信開始: {...}
（以下、送信処理のログが続く）
```

---

## トラブルシューティング

### エラー1: AdminNotificationSystem が undefined のまま
**ログ:**
```
⚠️ AdminNotificationSystem がまだ読み込まれていません。再試行します...
🔄 AdminNotificationSystem 再確認: undefined
```

**解決策:**
1. ブラウザのキャッシュをクリア
2. スーパーリロード（Ctrl+Shift+R）
3. ネットワークタブで `admin-notification-system.js` が正しく読み込まれているか確認
4. コンソールで手動確認:
```javascript
console.log(window.AdminNotificationSystem);
console.log(window.AdminNotificationSystemLoaded);
```

### エラー2: スクリプトが404エラー
**解決策:**
1. `js/admin-notification-system.js` ファイルが存在するか確認
2. ファイル名のスペルミスがないか確認
3. mobile.htmlのscriptタグが正しいか確認

### エラー3: 依然として「Can't find variable」エラー
**手動テスト:**

コンソールで以下を実行：

```javascript
// 1. スクリプトが読み込まれているか確認
console.log('AdminNotificationSystem:', window.AdminNotificationSystem);

// 2. 手動で関数を呼び出してみる
if (window.AdminNotificationSystem) {
    console.log('✅ AdminNotificationSystem は存在します');
    console.log('sendNotification関数:', typeof AdminNotificationSystem.sendNotification);
} else {
    console.error('❌ AdminNotificationSystem が見つかりません');
}

// 3. スクリプトタグの確認
const scripts = document.querySelectorAll('script[src*="admin-notification"]');
console.log('読み込まれているスクリプト:', scripts);
scripts.forEach(s => console.log('  -', s.src));
```

---

## 追加の対策（必要に応じて）

### オプション1: script タグに defer 属性を追加
**ファイル:** `mobile.html`

```html
<!-- 管理者通知システム ★NEW -->
<script src="js/default-notification-templates.js" defer></script>
<script src="js/admin-notification-system.js" defer></script>
<script src="js/admin-notification-ui.js" defer></script>
```

**注意:** `defer` を使用すると、DOMContentLoaded後にスクリプトが実行されることが保証されますが、他のスクリプトとの競合が発生する可能性があります。

### オプション2: 動的スクリプト読み込み
**ファイル:** `js/admin-notification-ui.js`

```javascript
// AdminNotificationSystemが読み込まれるまで待機
function waitForAdminNotificationSystem(callback, maxRetries = 10) {
    let retries = 0;
    const check = setInterval(() => {
        console.log(`🔍 AdminNotificationSystem チェック (${retries + 1}/${maxRetries})`);
        if (typeof AdminNotificationSystem !== 'undefined') {
            clearInterval(check);
            console.log('✅ AdminNotificationSystem 読み込み完了');
            callback();
        } else if (++retries >= maxRetries) {
            clearInterval(check);
            console.error('❌ AdminNotificationSystem の読み込みタイムアウト');
        }
    }, 500);
}

// 使用例
waitForAdminNotificationSystem(() => {
    attachAdminNotificationListeners();
});
```

---

## まとめ

今回の修正により：

1. ✅ `AdminNotificationSystem` の存在確認を追加
2. ✅ 読み込みタイミングを2000msに遅延
3. ✅ 読み込み失敗時の再試行ロジックを追加
4. ✅ デバッグヘルパー関数を追加
5. ✅ 詳細なログ出力を追加

これらの修正により、スクリプトの読み込み順序の問題が解決されるはずです。

**次のステップ:**
1. ブラウザを完全リフレッシュ
2. コンソールログを確認
3. `debugAdminNotification()` を実行
4. 通知送信をテスト

それでも問題が解決しない場合は、コンソールログのスクリーンショットを共有してください。
