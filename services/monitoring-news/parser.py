import asyncpg
from telethon.tl.functions.channels import JoinChannelRequest, LeaveChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest
from telethon.tl.functions.messages import DeleteChatUserRequest
from telethon.tl.types import InputPeerChannel, InputPeerChat
import json
from telethon import TelegramClient, errors
import datetime as dt
from datetime import datetime, timedelta
import pytz
import aiohttp

with open('config.json') as f:
    config = json.load(f)

GEMINI_API_KEY = config["gemini_api_key"]

accounts = config["accounts"]
utc = pytz.timezone("Asia/Almaty")
time_limit = utc.localize(datetime.now() - timedelta(hours=3) - timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')

db_config = {
    "user": "postgres",
    "password": "postgres",
    "database": "policy_db",
    "host": "localhost",
    "port": 5432
}

async def get_channels():
    retries = 3
    for attempt in range(retries):
        try:
            conn = await asyncpg.connect(**db_config, timeout=30)
            try:
                sources = await conn.fetch("""
                    SELECT link FROM sources WHERE type = 'telegram'
                """)
                return [source['link'] for source in sources]
            finally:
                await conn.close()
        except (asyncpg.exceptions.TimeoutError, TimeoutError) as e:
            print(f"Попытка {attempt + 1}/{retries} не удалась: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(5)
            else:
                print("Не удалось подключиться к базе данных после всех попыток.")
                return []

async def analyze_with_gemini(text):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }

    classification_prompt = f"""
    Проанализируй следующий текст и определи, является ли он сообщением о чрезвычайной ситуации (ЧП), например, аварии, пожаре, наводнении, теракте и т.д. Ответь только "Да" или "Нет":

    Текст: "{text}"
    """
    classification_data = {
        "contents": [{"parts": [{"text": classification_prompt}]}]
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=classification_data) as response:
            if response.status == 200:
                result = await response.json()
                classification_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                is_emergency = classification_text.lower() == "да"
            else:
                print(f"Ошибка классификации текста: {response.status}")
                is_emergency = False

        if not is_emergency:
            return is_emergency, "Неизвестно", "Не применимо", "Не применимо", "Не применимо"

        location_prompt = f"""
        Извлеки из текста название города или региона, если они упомянуты. Если локация не указана, верни "Неизвестно". Ответь только названием локации или "Неизвестно":

        Текст: "{text}"
        """
        location_data = {
            "contents": [{"parts": [{"text": location_prompt}]}]
        }

        async with session.post(url, headers=headers, json=location_data) as response:
            if response.status == 200:
                result = await response.json()
                location = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                print(f"Ошибка извлечения локации: {response.status}")
                location = "Неизвестно"

        problem_solution_prompt = f"""
        Проанализируй следующий текст о чрезвычайной ситуации. Опиши кратко:
        1. Проблему (что произошло).
        2. Решение или актуальную информацию о безопасности (что делается или что нужно делать).

        Формат ответа:
        Проблема: [описание проблемы]
        Решение: [описание решения или мер безопасности]

        Текст: "{text}"
        """
        problem_solution_data = {
            "contents": [{"parts": [{"text": problem_solution_prompt}]}]
        }

        async with session.post(url, headers=headers, json=problem_solution_data) as response:
            if response.status == 200:
                result = await response.json()
                ps_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                problem = "Неизвестно"
                solution = "Неизвестно"
                for line in ps_text.split('\n'):
                    if line.startswith("Проблема:"):
                        problem = line.replace("Проблема:", "").strip()
                    elif line.startswith("Решение:"):
                        solution = line.replace("Решение:", "").strip()
            else:
                print(f"Ошибка извлечения проблемы и решения: {response.status}")
                problem = "Неизвестно"
                solution = "Неизвестно"

        user_solution_prompt = f"""
        На основе следующего текста о чрезвычайной ситуации дай краткие рекомендации, что делать людям в этой ситуации. Ответь только рекомендациями:

        Текст: "{text}"
        """
        user_solution_data = {
            "contents": [{"parts": [{"text": user_solution_prompt}]}]
        }

        async with session.post(url, headers=headers, json=user_solution_data) as response:
            if response.status == 200:
                result = await response.json()
                solution_user = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                print(f"Ошибка извлечения рекомендаций для пользователей: {response.status}")
                solution_user = "Неизвестно"

    return is_emergency, location, problem, solution, solution_user

async def send_to_typescript_backend(data):
    url = "http://192.168.0.163:4004/emergency"  # Замените на реальный URL
    headers = {"Content-Type": "application/json"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as response:
                if response.status == 200:
                    print(f"Данные ЧП успешно отправлены в TypeScript-бэкенд: {data}")
                else:
                    print(f"Ошибка отправки в TypeScript-бэкенд: {response.status}")
    except Exception as e:
        print(f"Ошибка при отправке в TypeScript-бэкенд: {e}")

async def init_db():
    conn = await asyncpg.connect(**db_config)
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            id SERIAL PRIMARY KEY,
            link TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            news_link TEXT NOT NULL,
            source_id INTEGER NOT NULL REFERENCES sources(id),
            news_title TEXT NOT NULL,
            news_body TEXT NOT NULL,
            summary TEXT NULL,
            problem TEXT NULL,
            solution TEXT NULL,
            solution_user TEXT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    await conn.close()

async def get_or_create_source(channel_id, channel_name):
    conn = await asyncpg.connect(**db_config)
    try:
        source = await conn.fetchrow("""
            SELECT id FROM sources WHERE link = $1
        """, channel_id)
        if not source:
            source = await conn.fetchrow("""
                INSERT INTO sources (link, name, type)
                VALUES ($1, $2, 'telegram')
                RETURNING id
            """, channel_id, channel_name)
        return source['id']
    except Exception as e:
        print(f'Ошибка в get_or_create_source: {e}')
    finally:
        await conn.close()

async def save_news_if_not_exists(source_id, message):
    conn = await asyncpg.connect(**db_config)
    try:
        exists = await conn.fetchrow("""
            SELECT id FROM news WHERE news_link = $1
        """, message['news_link'])
        if not exists:
            created_at = message['created_at']
            if isinstance(created_at, str):
                created_at = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
            created_at = created_at.replace(tzinfo=None)
            body_text = message['body'].strip()
            title = body_text.split('.')[0] if '.' in body_text else message['body']

            is_emergency, location, problem, solution, solution_user = await analyze_with_gemini(message['body'])

            await conn.execute("""
                INSERT INTO news (news_link, source_id, news_title, news_body, problem, solution, solution_user, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, message['news_link'], source_id, title, message['body'], problem, solution, solution_user, created_at)

            if is_emergency:
                emergency_data = {
                    "news_link": message['news_link'],
                    "title": title,
                    "body": message['body'],
                    "location": location,
                    "problem": problem,
                    "solution": solution,
                    "solution_user": solution_user,
                    "created_at": message['created_at']
                }
                await send_to_typescript_backend(emergency_data)
    except Exception as e:
        print(f'Ошибка в save_news_if_not_exists: {e}')
    finally:
        await conn.close()

async def fetch_recent_messages(client, channel_id, channel_username):
    try:
        channel = await client.get_entity(channel_id)
        print(f"\nЧтение сообщений из канала: {channel.title}...")
        source_id = await get_or_create_source(channel_id, channel.title)
        local_tz = pytz.timezone("Asia/Almaty")
        bd_news_link = 'https://t.me/' + channel_username

        async for message in client.iter_messages(channel):
            message_time = message.date.astimezone(local_tz).strftime('%Y-%m-%d %H:%M:%S')
            if message_time < time_limit:
                print(f"Сообщение старое, остановка обработки сообщений.")
                break
            if message_time >= time_limit and message.message and message.message.strip():
                bd_news_link_full = f"{bd_news_link}/{message.id}"
                message_data = {
                    "news_link": bd_news_link_full,
                    "body": message.message,
                    "created_at": message_time
                }
                await save_news_if_not_exists(source_id, message_data)
    except Exception as e:
        print(f"Ошибка чтения канала {channel_id}: {e}")

async def join_and_fetch(client, channel_id):
    try:
        channel_username = ''
        user_id = str((await client.get_me()).id)
        if channel_id.startswith("https://t.me/+"):
            invite_hash = channel_id.split("+")[-1]
            channel_username = f'+{invite_hash}'
            print(f"Используем инвайт-хеш: {invite_hash}")
            try:
                conn = await asyncpg.connect(**db_config)
                exists = await conn.fetchrow(
                    "SELECT 1 FROM private_channels WHERE user_id = $1 AND invite_link = $2",
                    user_id, channel_username
                )
                if not exists:
                    await client(ImportChatInviteRequest(invite_hash))
                    await private_channels_add(user_id, channel_username)
            except errors.UserAlreadyParticipantError:
                print(f"Уже в канале {channel_id}, пропускаем присоединение")
                exists = await conn.fetchrow(
                    "SELECT 1 FROM private_channels WHERE user_id = $1 AND invite_link = $2",
                    user_id, channel_username
                )
                if not exists:
                    await private_channels_add(user_id, channel_username)
                await fetch_recent_messages(client, channel_id, channel_username)
                return
            except Exception as e:
                print('Ошибка в try.try.except:', e)
                return
        elif channel_id.startswith("https://t.me/"):
            channel_username = channel_id.split("https://t.me/")[1]
        else:
            channel_username = channel_id

        print(f"Получение сущности канала: {channel_username}")
        await fetch_recent_messages(client, channel_id, channel_username)
    except errors.InviteHashInvalidError:
        print(f"Инвайт-хеш {channel_id} недействителен или не существует.")
    except errors.InviteHashExpiredError:
        print(f"Срок действия инвайт-ссылки истёк: {channel_id}")
    except errors.UserAlreadyParticipantError:
        print(f"Вы уже присоединились к каналу {channel_id}.")
        await fetch_recent_messages(client, channel_id, channel_username)
    except errors.FloodWaitError as e:
        print(f"Превышен лимит запросов. Подождите {e.seconds} секунд.")
        await asyncio.sleep(e.seconds)
        await join_and_fetch(client, channel_id)
    except Exception as e:
        print(f"Ошибка обработки канала {channel_id}: {e}")
        await asyncio.sleep(60)
        await fetch_recent_messages(client, channel_id, channel_username)

async def process_account(account):
    phone = account["phone"]
    api_id = account["api_id"]
    api_hash = account["api_hash"]
    channels = await get_channels()
    if not channels:
        print('Нет каналов для обработки')
        return
    client = TelegramClient(phone, api_id, api_hash)
    try:
        print(f"\nПодключение аккаунта {phone}...")
        await client.start(phone=phone)
        for channel_id in channels:
            await join_and_fetch(client, channel_id)
    except Exception as e:
        print(f"Ошибка с аккаунтом {phone}: {e}")
    finally:
        await client.disconnect()

async def main():
    await init_db()
    while True:
        for account in accounts:
            print(f"\n--- Начинаем работу с аккаунтом {account['phone']} ---")
            await process_account(account)
        print("\n--- Ожидание следующего запуска (1 минута) ---")
        await asyncio.sleep(60)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())