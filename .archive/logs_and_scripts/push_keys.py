import subprocess
import json
import os
import sys

print("=== Fetching Service Accounts ===")
res = subprocess.run(['gcloud', 'iam', 'service-accounts', 'list', '--project', 'itako-plaza-kenji', '--format=json'], capture_output=True, text=True, shell=True)
sas = json.loads(res.stdout)
admin_sa = next((s['email'] for s in sas if 'firebase-adminsdk' in s['email']), None)

if not admin_sa:
    print("Error: Could not find firebase-adminsdk service account.")
    sys.exit(1)

print(f"Found SA: {admin_sa}")

print("=== Creating new private key ===")
subprocess.run(['gcloud', 'iam', 'service-accounts', 'keys', 'create', 'temp-key.json', '--iam-account', admin_sa, '--project', 'itako-plaza-kenji'], check=True, shell=True)

with open('temp-key.json', 'r', encoding='utf-8') as f:
    key_data = json.load(f)

envs = {
    'FIREBASE_PROJECT_ID': key_data['project_id'],
    'FIREBASE_CLIENT_EMAIL': key_data['client_email'],
    'FIREBASE_PRIVATE_KEY': key_data['private_key'],
}

print("=== Generating .env format for Vercel ===")
env_content = f"""FIREBASE_PROJECT_ID={envs['FIREBASE_PROJECT_ID']}
FIREBASE_CLIENT_EMAIL={envs['FIREBASE_CLIENT_EMAIL']}
FIREBASE_PRIVATE_KEY="{envs['FIREBASE_PRIVATE_KEY'].replace(chr(10), '\\n')}"
"""
with open('vercel_envs.txt', 'w', encoding='utf-8') as f:
    f.write(env_content)

print("Created vercel_envs.txt successfully.")

print("=== Cleaning up ===")
os.remove('temp-key.json')
print("Complete.")
