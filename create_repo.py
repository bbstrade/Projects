import urllib.request
import json
import sys

import os
token = os.environ.get("GITHUB_TOKEN", "your_token_here")
url = "https://api.github.com/user/repos"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "python-script"
}
data = json.dumps({
    "name": "Projects",
    "private": False
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as f:
        print(f.status)
        print(f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print(str(e))
