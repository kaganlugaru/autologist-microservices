# Dockerfile для backend на Render
FROM node:18
WORKDIR /app
COPY . /app
	RUN npm install
	RUN apt-get update && apt-get install -y python3 python3-pip python3-venv
	# Создаем виртуальное окружение Python
	RUN python3 -m venv /app/venv
	# Активируем venv и устанавливаем зависимости
	RUN /app/venv/bin/pip install --upgrade pip && /app/venv/bin/pip install -r requirements.txt
	# Запуск Node.js сервера (если нужен Python, используем /app/venv/bin/python)
	CMD ["node", "server.js"]
