# 管理者通知システム デバッグガイド

## 問題の症状
- 送信ボタンを押しても何も起こらない
- 予約送信チェックボックスを押しても何も起こらない

## 実施した修正内容

### 1. イベントリスナーの修正
- **問題**: DOMContentLoaded時にフォーム要素がまだ存在していない
- **解決策**: 
  - `setTimeout`で遅延実行
  - `form.onsubmit`を直接設定（フォールバック）
  - 画面初期化時に再アタッチ
  - イベントリスナーを複数回呼び出せるヘルパー関数を作成

### 2. デバッグログの追加
- すべての関数実行時にコンソールログを出力
- データの流れを追跡可能に

### 3. スクリプト読み込み順序の修正
- `default-notification-templates.js`を追加

## デバッグ手順

### ステップ1: ブラウザを完全リフレッシュ
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### ステップ2: 開発者ツールを開く
```
F12 または右クリック > 検証
```

### ステップ3: コンソールタブを開く
すべてのログメッセージを確認できます。

### ステップ4: 管理者通知画面を開く
マイページ > ユーザー通知管理

**期待されるログ出力:**
```
📍 DOMContentLoaded後の初回アタッチ
🔧 イベントリスナーのアタッチを開始...
🔍 ラジオボタン数: 3
🔍 予約送信チェックボックス: [object HTMLInputElement]
🔍 予約送信時刻入力: [object HTMLInputElement]
✅ 予約送信チェックボックスイベント登録完了
✅ イベントリスナーのアタッチ完了
🔍 フォームイベントリスナー登録を試行...
🔍 フォーム要素: [object HTMLFormElement]
✅ 管理者通知フォームイベントリスナー登録完了
✅ showScreen オーバーライド完了
✅ 管理者通知UI統合 ロード完了
```

### ステップ5: 画面を開いた時のログ
```
🎯 管理者通知画面を初期化
🔄 画面初期化時のイベントリスナー再アタッチ...
🔧 イベントリスナーのアタッチを開始...
✅ フォームイベントリスナー追加（画面初期化時）
```

### ステップ6: 予約送信チェックボックスをクリック
**期待されるログ:**
```
📅 予約送信チェックボックス変更: true
✅ 予約時刻入力を表示: 2025-11-21T07:30
```

チェックを外す:
```
📅 予約送信チェックボックス変更: false
✅ 予約時刻入力を非表示
```

### ステップ7: フォームに入力して送信ボタンをクリック

**最小限の入力:**
- タイトル: 「テスト通知」
- メッセージ: 「これはテストです」
- その他はデフォルト値のまま

**期待されるログ出力:**
```
🚀 handleAdminNotificationSubmit 関数が呼ばれました！
✅ preventDefault 実行済み
🔍 現在のユーザー: {id: "...", username: "admin", ...}
✅ 管理者権限確認OK
📝 フォームデータ取得開始...
📝 取得データ: {targetType: "all", title: "テスト通知", message: "これはテストです"}
💬 確認ダイアログ表示: 通知を送信しますか？
```

確認ダイアログで「OK」をクリック:
```
✅ ユーザーが送信を承認しました
📤 AdminNotificationSystem.sendNotification を呼び出します...
📢 通知送信開始: {targetType: "all", title: "テスト通知", ...}
📢 送信先タイプ: all
👥 対象ユーザー取得中...
👥 取得した全ユーザー数: X
🔍 フィルタリングタイプ: all
✅ 全ユーザーモード: X 人
📢 送信対象ユーザー数: X
💾 管理者通知レコード作成中...
💾 保存するデータ: {...}
💾 APIレスポンスステータス: 201
✅ 管理者通知レコード保存完了: {...}
📤 各ユーザーへの送信開始...
🔍 NotificationSystemの存在チェック: object
📧 ユーザー test1 (...) に送信中...
✅ ユーザー test1 に送信完了
... (繰り返し)
✅ 送信完了: X/X 人
💾 送信数を更新中...
💾 更新レスポンスステータス: 200
✅ 送信処理完了！
✅ 送信完了: {...}
```

## トラブルシューティング

### 問題1: フォーム要素が見つかりません
**ログ:**
```
⚠️ adminNotificationForm が見つかりません
```

**解決策:**
1. mobile.htmlに`adminNotificationScreen`が正しく定義されているか確認
2. フォームのID `adminNotificationForm` が正しいか確認

### 問題2: イベントリスナーが発火しない
**ログ:**
```
✅ 管理者通知フォームイベントリスナー登録完了
（でも送信ボタンクリック時に何も起こらない）
```

**解決策:**
1. ブラウザのキャッシュをクリア
2. 完全リフレッシュ (Ctrl+Shift+R)
3. コンソールで手動テスト:
```javascript
const form = document.getElementById('adminNotificationForm');
console.log('Form:', form);
console.log('Listener added:', form.dataset.listenerAdded);
form.onsubmit = (e) => { e.preventDefault(); alert('Form submitted!'); };
```

### 問題3: MobileApp.currentUser が undefined
**ログ:**
```
🔍 現在のユーザー: undefined
❌ 管理者権限エラー
```

**解決策:**
1. ログインしているか確認
2. adminユーザーでログインしているか確認
3. コンソールで確認:
```javascript
console.log(MobileApp.currentUser);
```

### 問題4: NotificationSystem が undefined
**ログ:**
```
🔍 NotificationSystemの存在チェック: undefined
❌ NotificationSystemが定義されていません
```

**解決策:**
1. `js/extensions.js` が読み込まれているか確認
2. mobile.htmlのscriptタグの順序を確認:
```html
<script src="js/extensions.js"></script>  <!-- これが先 -->
<script src="js/mobile.js"></script>
<script src="js/admin-notification-system.js"></script>  <!-- これが後 -->
```

### 問題5: API呼び出しエラー
**ログ:**
```
💾 APIレスポンスステータス: 400
❌ APIエラー: ...
```

**解決策:**
1. テーブルスキーマが正しく作成されているか確認
2. Network タブでAPIレスポンスを確認
3. データベース権限を確認

## テストケース

### テストケース1: 全ユーザーに即時送信
1. 送信先: 全ユーザー
2. タイトル: 「全体お知らせ」
3. メッセージ: 「これは全ユーザーへのテストです」
4. 予約送信: チェックなし
5. 送信ボタンをクリック

**期待結果:**
- 確認ダイアログが表示される
- 送信完了トースト表示
- 送信履歴タブに切り替わる
- 全ユーザーに通知が届く

### テストケース2: 予約送信
1. 送信先: 全ユーザー
2. タイトル: 「予約通知」
3. メッセージ: 「これは予約送信のテストです」
4. 予約送信: チェック
5. 日時を1時間後に設定
6. 送信ボタンをクリック

**期待結果:**
- 確認ダイアログに予約時刻が表示される
- 「通知を予約しました」トースト表示
- 送信履歴タブで「予約中」ステータスを確認

### テストケース3: 条件指定
1. 送信先: 条件指定
2. 条件: `rank=ゴールド`
3. タイトル: 「ゴールド会員様へ」
4. メッセージ: 「ゴールド会員限定のお知らせです」
5. 送信ボタンをクリック

**期待結果:**
- ゴールドランクのユーザーのみに送信
- ログで「✅ フィルタリング結果: X 人」を確認

### テストケース4: 個別ユーザー
1. 送信先: 個別ユーザー
2. ユーザーID: （実際のユーザーIDを入力）
3. タイトル: 「個別通知」
4. メッセージ: 「あなた宛の通知です」
5. 送信ボタンをクリック

**期待結果:**
- 指定したユーザーのみに送信
- ログで「👥 個別ユーザーモード - 対象ID: [...]」を確認

## 確認項目チェックリスト

- [ ] ブラウザを完全リフレッシュした
- [ ] 開発者ツールのコンソールを開いた
- [ ] adminユーザーでログインしている
- [ ] 管理者通知画面が開ける
- [ ] 初期化ログが表示される
- [ ] 予約送信チェックボックスが反応する
- [ ] 送信ボタンクリック時にログが出る
- [ ] 確認ダイアログが表示される
- [ ] 送信完了トーストが表示される
- [ ] 送信履歴タブに記録が残る

## 追加のデバッグコマンド

コンソールで以下を実行して手動テスト:

```javascript
// フォーム要素の確認
const form = document.getElementById('adminNotificationForm');
console.log('Form:', form);
console.log('Form onsubmit:', form.onsubmit);

// イベントリスナーを手動で再アタッチ
attachAdminNotificationListeners();

// 手動で送信関数を呼び出し（テスト用）
handleAdminNotificationSubmit(new Event('submit'));

// NotificationSystemの確認
console.log('NotificationSystem:', NotificationSystem);
console.log('Extensions loaded:', typeof NotificationSystem !== 'undefined');

// 現在のユーザー確認
console.log('Current user:', MobileApp.currentUser);

// テーブルデータ確認
fetch('tables/admin_notifications?limit=5')
  .then(r => r.json())
  .then(d => console.log('Admin notifications:', d));
```

## 連絡事項

すべてのログ出力を確認して、どこで処理が止まっているかを特定してください。
ログ出力を共有していただければ、さらに詳細な診断が可能です。
