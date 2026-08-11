# LarryAgent Makefile

.PHONY: install run dev clean

# 安装后端依赖
install:
	cd backend && pip install -r requirements.txt

# 启动后端（生产模式）
run:
	cd backend && uvicorn main:app --port 8000

# 启动后端（开发模式，热重载）
dev:
	cd backend && uvicorn main:app --port 8000 --reload

# 清理临时文件
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
