# Landmark Map App for Landit

## プロジェクト概要

`Next.js + NestJS + PostGIS` を使った、スポット探索マップアプリです。  
フロントエンドでは地図上でスポットを閲覧し、バックエンドではCSVからスポット情報を取り込み、逆ジオコーディングで地図中心点の住所を取得します。

## 前提条件 

以下がインストール済みであること:

- Docker
- Docker Compose

## 実行手順 

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


## 技術選定理由

本プロジェクトでは、短期間での実装速度と今後の拡張性を重視して以下の技術を選定している。

### フロントエンド: Next.js (React)
- ルーティング・ビルド・開発体験が統合されており、実装を高速に進めやすい。
- Vite + React と比較すると軽量性では劣るが、プロジェクト全体の構築と運用の一体感を優先している。

### バックエンド: NestJS
- Controller / Service / Module の責務分離が明確で保守性が高い。
- Express 単体と比べて設計規約が強く、チーム開発や機能追加の際にも管理しやすい構成。

### データベース: PostgreSQL + PostGIS
- 緯度経度データを空間型として扱え、将来的な距離検索・空間クエリに対応しやすい点を重視。
- 通常のRDBでの座標管理よりも地理情報処理の拡張性に優れている。

### ORM／DBアクセス: TypeORM + pg
- NestJSとの親和性が高く、必要に応じて生SQLも柔軟に利用可能。
- Prismaより型生成の強みはないものの、PostGIS利用時の自由度を優先。

### 地図表示: Leaflet + React-Leaflet
- 軽量で扱いやすく、マーカー表示や中心座標追従など今回の要件にフィットしている。
- Mapbox GL JS より表現力は控えめだが、実装コストを考慮しシンプルさを重視。

### UI: Tailwind CSS + Radix UI (shadcn系コンポーネント)
- 開発速度とカスタマイズ性、アクセシビリティのバランスが良い。
- フルUIフレームワーク（例: MUI等）より軽量で柔軟な実装を可能にしている。

### 設定管理: @nestjs/config
- `GOOGLE_MAPS_API_KEY` 等の環境変数を安全にDI経由で扱えるため、process.envの直参照よりテスト性・保守性に優れる。

### データ取り込み: csv-parse
- CSVのシードデータ取り込みをNode.jsサーバー側でシンプルに実装。
- 軽量かつ柔軟なデータ処理が可能。

### 実行環境: Docker / Docker Compose
- frontend / backend / db 各コンテナの環境再現が容易で、検証手順を統一できる。
- ローカル環境差分による動作不一致を減らし、誰でも同じ手順で開発・動作確認が可能。

## 実装時に特に工夫した点

###地図操作時の無駄なAPI呼び出しを抑制
-  moveend をそのまま使うとズーム時にも逆ジオコーディングが走るため、中心座標が実質変わっていない場合はAPIを呼ばない制御を追加。
- UX改善とAPI利用量削減の両立を意識。

###逆ジオコーディング結果の品質
- plus_code の結果を住所表示に使わないようフィルタリングし、ユーザーにとって自然な住所を優先表示。
- ZERO_RESULTS やエラー時の表示文言も分岐して、状態が伝わるようにした。

## 技術的な判断を行った箇所

###地図ライブラリ選定の判断
- 要件に対して過不足のない Leaflet + React-Leaflet を採用し、実装コストを抑えつつ必要機能（マーカー、中心追従、範囲表示）を確実に満たした。

## 開発メモ

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Reverse Geocoding API: `GET /geocoding/reverse-geocode?lat=...&lng=...`
