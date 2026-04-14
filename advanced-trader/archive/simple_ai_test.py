import asyncio
import os
import sys
import aiohttp
import socket
from dotenv import load_dotenv

# .env.production の場所を正確に指定
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(env_path)

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"')

async def test_ai():
    print(f"Key preview: {OPENROUTER_KEY[:10]}...")
    connector = aiohttp.TCPConnector(family=socket.AF_INET, use_dns_cache=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "google/gemini-2.0-flash:free",
            "messages": [
                {"role": "user", "content": "Itako Plazaのコンサルタントとして、一言挨拶してください。"}
            ],
            "max_tokens": 100
        }
        async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload) as resp:
            print(f"Status: {resp.status}")
            data = await resp.json()
            if resp.status == 200:
                print("Response:", data["choices"][0]["message"]["content"])
            else:
                print("Error:", data)

if __name__ == "__main__":
    asyncio.run(test_ai())
