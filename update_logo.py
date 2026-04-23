import base64
import re
import os

logo_path = r'C:\Users\vihanga.randive\.gemini\antigravity\brain\d87fd3be-b6f4-4580-a176-bb65dc19040b\media__1776917810240.png'
data_path = r'src/lib/initialData.ts'

with open(logo_path, 'rb') as f:
    new_logo = 'data:image/png;base64,' + base64.b64encode(f.read()).decode()

with open(data_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the logo for team mrju4a6j1
# We look for "id": "mrju4a6j1", then the next "logo": "..."
pattern = r'("id":\s*"mrju4a6j1",\s*"name":\s*"BLACK PANTHERS",\s*"logo":\s*")[^"]*(")'
content = re.sub(pattern, r'\1' + new_logo + r'\2', content)

# Update version
content = re.sub(r'"version":\s*(\d+)', '"version": 2026042304', content)

with open(data_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Black Panthers logo and version.")
