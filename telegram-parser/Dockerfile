# Dockerfile для парсера Telegram на Railway
FROM python:3.10
WORKDIR /app
COPY . /app
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
CMD ["python", "telegram_parser.py"]
