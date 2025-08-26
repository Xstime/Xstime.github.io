import json
import requests
import os
from urllib.parse import urlparse

# 定义图标保存目录和链接文件
ICON_DIR = 'icon'
LINKS_FILE = 'links.json'

# 确保图标目录存在
if not os.path.exists(ICON_DIR):
    os.makedirs(ICON_DIR)
    print(f"创建目录: {ICON_DIR}")

# 读取 links.json 文件
try:
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        links = json.load(f)
except FileNotFoundError:
    print(f"错误: '{LINKS_FILE}' 未找到。请确保该文件在同一目录下。")
    exit()
except json.JSONDecodeError:
    print(f"错误: 无法解析 '{LINKS_FILE}'。请检查文件语法。")
    exit()

# 下载并保存图标的函数
def download_favicon(url):
    try:
        # 从 URL 中提取主机名 (域名)
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"无法从以下地址解析主机名: {url}")
            return

        # 定义图标的保存路径
        icon_path = os.path.join(ICON_DIR, f"{hostname}.png")

        # 如果图标已存在，则跳过
        if os.path.exists(icon_path):
            print(f"{hostname} 的图标已存在，跳过。")
            return

        # 使用 Google 的 favicon 服务作为可靠来源
        favicon_url = f"https://www.google.com/s2/favicons?domain={hostname}&sz=64"
        
        print(f"正在获取 {hostname} 的图标...")
        response = requests.get(favicon_url, timeout=10)
        
        # 检查请求是否成功
        if response.status_code == 200 and response.content:
            # 保存图标
            with open(icon_path, 'wb') as f:
                f.write(response.content)
            print(f"成功保存 {hostname} 的图标")
        else:
            print(f"获取 {hostname} 的图标失败。状态码: {response.status_code}")

    except requests.exceptions.RequestException as e:
        print(f"获取 {url} 的图标时发生网络错误: {e}")
    except Exception as e:
        print(f"处理 {url} 时发生未知错误: {e}")

# 遍历所有链接并下载它们的图标
for link in links:
    download_favicon(link['url'])

print("\n图标获取流程完成。")
