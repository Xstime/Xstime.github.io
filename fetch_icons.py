import json
import requests
import os
from urllib.parse import urlparse

ICON_DIR = 'icon'
LINKS_FILE = 'links.json'

if not os.path.exists(ICON_DIR):
    os.makedirs(ICON_DIR)
    print(f"创建目录: {ICON_DIR}")

try:
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        links = json.load(f)
except FileNotFoundError:
    print(f"错误: '{LINKS_FILE}' 未找到。请确保该文件在同一目录下。")
    exit()
except json.JSONDecodeError:
    print(f"错误: 无法解析 '{LINKS_FILE}'。请检查文件语法。")
    exit()

def download_favicon(url):
    try:
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"无法从以下地址解析主机名: {url}")
            return

        icon_path = os.path.join(ICON_DIR, f"{hostname}.png")
        if os.path.exists(icon_path):
            print(f"{hostname} 的图标已存在，跳过。")
            return
        favicon_url = f"https://www.google.com/s2/favicons?domain={hostname}&sz=64"
        
        print(f"正在获取 {hostname} 的图标...")
        response = requests.get(favicon_url, timeout=10)
        
        if response.status_code == 200 and response.content:
            with open(icon_path, 'wb') as f:
                f.write(response.content)
            print(f"成功保存 {hostname} 的图标")
        else:
            print(f"获取 {hostname} 的图标失败。状态码: {response.status_code}")

    except requests.exceptions.RequestException as e:
        print(f"获取 {url} 的图标时发生网络错误: {e}")
    except Exception as e:
        print(f"处理 {url} 时发生未知错误: {e}")

for link in links:
    download_favicon(link['url'])

print("\n图标获取流程完成。")
