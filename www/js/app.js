const applicationKey = 'YOUR_APPLICATION_KEY';
const clientKey = 'YOUR_CLIENT_KEY';
const ncmb = new NCMB(applicationKey, clientKey);

// WebSocket用の設定
const apiKey = 'YOUR_API_KEY';
const channelId = 1;

// チャットを管理するためのクラス
class Chat {
  // コンストラクター
  // APIキーなどの必要な設定情報の保存と、WebSocketへの接続を行う
  constructor(apiKey, channelId) {
    this.apiKey = apiKey;
    this.channelId = channelId;
    this.open = false;
    this.users = [];
    this.socket = new WebSocket(`wss://connect.websocket.in/v3/${this.channelId}?api_key=${this.apiKey}&notify_self`);
    this.socket.onopen = () => this.onopen();
    this.socket.onmessage = (message) => this.onmessage(message.data);
  }

  // WebSocketに繋がった際のイベントで呼び出されるメソッド
  onopen() {
    this.open = true;  
  }

  // 新しいユーザが接続したらユーザ一覧に追加
  addUser(user) {
    if (this.users.indexOf(user) > -1) return;
    this.users.push(user);
  }

  // 受け取ったメッセージの処理
  onmessage(data) {
    const { action, user, message } = JSON.parse(data);
    switch (action) {
      case 'login':
        this.addUser(user);
        this.send('ping', null);
        break;
      case 'ping':
        this.addUser(user);
        break;
      default:
        this.message(user, message);
    }
  }

  // メッセージの送信処理
  async send(action, message) {
    const user = ncmb.User.getCurrentUser();
    await this.waitOpen();
    this.socket.send(JSON.stringify({
      action,
      message,
      user: user.get('displayName')
    }))
  }

  // WebSocketが開くのを待つメソッド
  waitOpen() {
    return new Promise(res => {
      const id = setInterval(() => {
        if (this.open) {
          clearInterval(id);
          res();
        }
      }, 10)
    })
  }
}

// WebSocketの初期化
window.chat = new Chat(apiKey, channelId);
