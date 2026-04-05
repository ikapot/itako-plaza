# 1. Playwright 実行用ベースイメージの採用
# 日本株・仮想通貨の操作に必要な Chromium を含むイメージを使用します。
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# 2. 作業ディレクトリの設定
WORKDIR /app

# 3. 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. ソースコードのコピー
COPY . .

# 5. 環境変数の設定 (Docker内でのバッファリング防止)
ENV PYTHONUNBUFFERED=1

# 6. アプリケーションの起動
# Cloud Run のデフォルトポート 8080 で起動します。
EXPOSE 8080
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8080"]
