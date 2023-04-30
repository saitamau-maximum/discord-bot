# Maximum Discord BOT

## セットアップ
```bash
$ git clone https://github.com/saitamau-maximum/discord-bot.git
$ cd discord-bot
$ ./setup.sh
```
`.env`が生成されるので、中身を埋める。

## 起動スクリプト設定
EC2なら、起動スクリプトを設定するGUIがあるので、そこで`npm run start`を設定する。
それ以外の環境なら、`systemd`などを使って、`npm run start`を起動するように設定する。

こうすることでサーバーが落ちても再起動時に自動で起動するようにできる。


