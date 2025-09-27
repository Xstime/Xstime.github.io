#!/usr/bin/env python3
"""
快速图标下载器 - Quick Favicon Downloader
基于 fetch_icons.py 的简化版本，用于快速下载单个网站图标
"""

import requests
import os
import sys
from urllib.parse import urlparse

def download_favicon_simple(url):
    """
    简单快速的图标下载函数，基于 fetch_icons.py 的方法
    :param url: 网站URL
    :return: 下载的文件路径或None
    """
    # 标准化URL
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # 获取主机名
    try:
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"❌ 无法解析主机名: {url}")
            return None
    except Exception as e:
        print(f"❌ URL解析错误: {e}")
        return None
    
    # 确保icon目录存在
    icon_dir = "icon"
    if not os.path.exists(icon_dir):
        os.makedirs(icon_dir)
        print(f"✨ 创建目录: {icon_dir}")
    
    filename = os.path.join(icon_dir, f"{hostname}.png")
    
    # 检查文件是否已存在
    if os.path.exists(filename):
        print(f"ℹ️  图标已存在: {filename}")
        return filename
    
    try:
        # 使用Google的favicon服务（与fetch_icons.py相同的方法）
        favicon_url = f"https://www.google.com/s2/favicons?domain={hostname}&sz=64"
        print(f"🔍 正在获取 {hostname} 的图标...")
        
        response = requests.get(favicon_url, timeout=10)
        
        if response.status_code == 200 and response.content:
            # 检查内容大小，避免下载空图标
            if len(response.content) > 100:
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"✅ 成功保存: {filename}")
                return filename
            else:
                print(f"⚠️  图标数据太小，可能是默认图标")
        else:
            print(f"❌ 请求失败，状态码: {response.status_code}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络错误: {e}")
    except Exception as e:
        print(f"❌ 未知错误: {e}")
    
    # 如果失败，尝试复制默认图标
    default_path = os.path.join(icon_dir, "default.png")
    if os.path.exists(default_path):
        try:
            import shutil
            shutil.copy2(default_path, filename)
            print(f"📋 使用默认图标: {filename}")
            return filename
        except Exception as e:
            print(f"❌ 复制默认图标失败: {e}")
    
    print(f"❌ 无法获取图标: {hostname}")
    return None

def main():
    """主函数"""
    if len(sys.argv) != 2:
        print("🚀 快速图标下载器")
        print("基于 fetch_icons.py 的简化版本")
        print("-" * 30)
        print("用法: python3 quick_favicon.py <网站URL>")
        print("示例: python3 quick_favicon.py stackoverflow.com")
        print("示例: python3 quick_favicon.py https://github.com")
        sys.exit(1)
    
    url = sys.argv[1].strip()
    if not url:
        print("❌ 请提供有效的URL")
        sys.exit(1)
    
    print(f"🌐 目标网站: {url}")
    result = download_favicon_simple(url)
    
    if result:
        print(f"🎉 完成！图标保存在: {result}")
    else:
        print("💔 下载失败")
        sys.exit(1)

if __name__ == "__main__":
    main()