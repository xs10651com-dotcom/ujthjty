# 使用Python官方镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    PORT=8000

# 安装系统依赖（包括PostgreSQL客户端）
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY backend/requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 安装PostgreSQL驱动（如果使用ElephantSQL）
RUN pip install --no-cache-dir psycopg2-binary

# 复制所有代码
COPY . .

# 创建必要目录
RUN mkdir -p uploads database

# 暴露端口
EXPOSE 8000

# 启动命令 - Railway会覆盖这个命令
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "backend.app:create_app()"]
