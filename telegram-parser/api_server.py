from supabase import create_client
import os
# ...existing code...
@app.get('/api/chats')
async def get_all_chats():
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        supabase = create_client(supabase_url, supabase_key)
        response = supabase.table('all_chats').select('*').execute()
        chats = response.data if hasattr(response, 'data') else response
        return {"success": True, "chats": chats}
    except Exception as e:
        return {"success": False, "error": str(e)}
from fastapi import FastAPI
import asyncio
import uvicorn
from telegram_parser import TelegramParser

app = FastAPI()
parser = TelegramParser()

@app.post('/api/update-chats')
async def update_chats():
    try:
        await parser.client.disconnect()
        await parser.discover_chats()  # Получаем чаты через Telethon
        await parser.load_monitored_chats()  # Перезаписываем monitored_chats в Supabase
        await parser.client.start()
        parser.setup_message_handlers()
        asyncio.create_task(parser.periodic_monitored_chats_update())
        return {"success": True, "message": "Чаты обновлены и мониторинг возобновлён."}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
