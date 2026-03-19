# Landmark Map App for Landit

## プロジェクト概要

`Next.js + NestJS + PostGIS` を使った、スポット探索マップアプリです。  
フロントエンドでは地図上でスポットを閲覧し、バックエンドではCSVからスポット情報を取り込み、逆ジオコーディングで地図中心点の住所を取得します。

## 前提条件 (Prerequisites)

以下がインストール済みであること:

- Docker
- Docker Compose

## セットアップ手順 (Setup)

### 1. リポジトリを取得

```bash
git clone https://github.com/Koyo46/landmark-map-app-for-landit
cd landmark-map-app-for-landit
```

### 2. `backend/.env` を手動で作成

`backend/.env` を作成し、Google Maps APIキーを設定してください。

```bash
GOOGLE_MAPS_API_KEY=xxx
```

> 注:
> - APIキーは Google Cloud で発行してください
> - Geocoding API を有効化してください
> - バックエンド実装上、環境変数名は `GOOGLE_MAPS_API_KEY` です

### 3. コンテナを起動

```bash
docker-compose up -d --build
```

### 4. アプリにアクセス

以下へアクセスしてください:

- [http://localhost:3000](http://localhost:3000)

## 開発メモ

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Reverse Geocoding API: `GET /geocoding/reverse-geocode?lat=...&lng=...`
