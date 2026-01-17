#!/bin/bash

# Railway 部署设置脚本
# 用法: ./scripts/setup-railway.sh

set -e

echo "🚂 开始设置 Railway 部署..."

# 检查 Railway CLI 是否安装
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI 未安装，正在安装..."
    npm install -g @railway/cli || {
        echo "❌ 安装 Railway CLI 失败"
        echo "请手动安装: npm install -g @railway/cli"
        exit 1
    }
fi

echo "✅ Railway CLI 已安装"

# 登录 Railway
echo "🔑 登录 Railway..."
railway login || {
    echo "❌ 登录失败，请手动运行: railway login"
    exit 1
}

# 创建 Railway 项目（如果不存在）
echo "🛠️  创建 Railway 项目..."
if ! railway status 2>/dev/null; then
    railway init || {
        echo "⚠️  项目已存在或创建失败"
    }
fi

# 添加环境变量
echo "🔧 设置环境变量..."

# 从 .env 文件读取变量
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        # 跳过注释和空行
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # 设置 Railway 环境变量
        echo "设置 $key"
        railway variables set "$key"="$value" 2>/dev/null || true
    done < .env
fi

# 设置必要的 Railway 环境变量
echo "⚙️  设置必要的环境变量..."
railway variables set NODE_ENV=production 2>/dev/null || true
railway variables set PORT=8000 2>/dev/null || true

# 添加 ElephantSQL 数据库（如果需要）
echo "🐘 设置 ElephantSQL 数据库..."
echo "注意: 请先在 ElephantSQL 创建数据库，然后运行以下命令:"
echo "railway variables set DATABASE_URL=postgresql://user:password@host:port/database"

# 显示部署命令
echo ""
echo "🎉 Railway 设置完成！"
echo ""
echo "📋 部署命令:"
echo "1. railway link                   # 链接到 Railway 项目"
echo "2. railway up                     # 部署到 Railway"
echo "3. railway logs                   # 查看日志"
echo "4. railway open                   # 打开应用"
echo ""
echo "🐘 ElephantSQL 设置:"
echo "1. 访问 https://customer.elephantsql.com/"
echo "2. 创建新实例"
echo "3. 获取连接 URL"
echo "4. railway variables set DATABASE_URL=your_elephantsql_url"
echo ""
echo "🔧 环境变量管理:"
echo "railway variables                 # 查看所有变量"
echo "railway variables set KEY=value   # 设置变量"
echo "railway variables delete KEY      # 删除变量"
