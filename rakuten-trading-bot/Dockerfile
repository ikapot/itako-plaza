# 1. ベースイメージの指定
FROM python:3.11-slim

# 2. 作業ディレクトリの設定
WORKDIR /app

# 3. システム依存関係のインストール (もし必要なら)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. 依存関係のコピーとインストール
COPY rakuten-trading-bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. ソースコードと人格データのコピー
COPY rakuten-trading-bot/ .
COPY src/data/profiles.js ./src/data/profiles.js

# 6. 環境変数の設定
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# 7. 実行コマンド
CMD ["python", "itako_discord_bot.py"]
