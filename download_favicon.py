#!/usr/bin/env python3
"""
交互式图标下载器 - Interactive Favicon Downloader
基于 fetch_icons.py 改进，支持交互式输入和多种下载方式
作者：GitHub Copilot
日期：2025年9月27日
"""

import json
import requests
import os
import sys
from urllib.parse import urlparse, urljoin
import re

class FaviconDownloader:
    def __init__(self, icon_dir="icon"):
        """
        初始化图标下载器
        :param icon_dir: 图标保存目录
        """
        self.icon_dir = icon_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # 确保图标目录存在
        if not os.path.exists(self.icon_dir):
            os.makedirs(self.icon_dir)
            print(f"✨ 创建目录: {self.icon_dir}")

    def normalize_url(self, url):
        """
        标准化URL格式
        :param url: 输入的URL
        :return: 标准化后的URL
        """
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        return url

    def get_hostname(self, url):
        """
        从URL获取主机名
        :param url: 网站URL
        :return: 主机名
        """
        try:
            parsed = urlparse(url)
            return parsed.hostname
        except Exception:
            return None

    def download_favicon_google(self, url):
        """
        使用Google服务下载favicon (最可靠的方法)
        :param url: 网站URL
        :return: 成功返回True，失败返回False
        """
        hostname = self.get_hostname(url)
        if not hostname:
            print(f"❌ 无法从URL解析主机名: {url}")
            return False

        icon_path = os.path.join(self.icon_dir, f"{hostname}.png")
        
        # 如果图标已存在，询问是否覆盖
        if os.path.exists(icon_path):
            print(f"⚠️  {hostname} 的图标已存在")
            return True

        try:
            # 使用Google的favicon服务
            favicon_url = f"https://www.google.com/s2/favicons?domain={hostname}&sz=64"
            print(f"🔍 正在从Google服务获取 {hostname} 的图标...")
            
            response = self.session.get(favicon_url, timeout=10)
            
            if response.status_code == 200 and response.content:
                # 检查是否是有效的图片数据
                if len(response.content) > 100:  # 有效图标应该大于100字节
                    with open(icon_path, 'wb') as f:
                        f.write(response.content)
                    print(f"✅ 成功保存 {hostname} 的图标 (Google服务)")
                    return True
                else:
                    print(f"⚠️  获取到的图标数据太小，可能是默认图标")
            else:
                print(f"❌ Google服务返回状态码: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 网络错误: {e}")
        except Exception as e:
            print(f"❌ 未知错误: {e}")
            
        return False

    def find_favicon_in_html(self, url):
        """
        从网页HTML中查找favicon链接
        :param url: 网站URL
        :return: favicon URL列表
        """
        favicon_urls = []
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            html_content = response.text
            
            # 查找各种favicon链接
            patterns = [
                r'<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"\']+)["\']',
                r'<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'](?:shortcut )?icon["\']',
                r'<link[^>]*rel=["\']apple-touch-icon[^"\']*["\'][^>]*href=["\']([^"\']+)["\']'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                for match in matches:
                    favicon_url = urljoin(url, match)
                    if favicon_url not in favicon_urls:
                        favicon_urls.append(favicon_url)
        
        except Exception as e:
            print(f"❌ 解析HTML失败: {e}")
        
        # 添加常见路径
        common_paths = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png']
        for path in common_paths:
            favicon_url = urljoin(url, path)
            if favicon_url not in favicon_urls:
                favicon_urls.append(favicon_url)
        
        return favicon_urls

    def download_favicon_direct(self, url):
        """
        直接从网站下载favicon
        :param url: 网站URL
        :return: 成功返回True，失败返回False
        """
        hostname = self.get_hostname(url)
        if not hostname:
            return False

        icon_path = os.path.join(self.icon_dir, f"{hostname}.png")
        
        print(f"🔍 正在从网站直接获取 {hostname} 的图标...")
        favicon_urls = self.find_favicon_in_html(url)
        
        for i, favicon_url in enumerate(favicon_urls[:3], 1):  # 只尝试前3个
            try:
                print(f"📥 尝试 ({i}/3): {favicon_url}")
                response = self.session.get(favicon_url, timeout=5)
                
                if response.status_code == 200 and len(response.content) > 50:
                    with open(icon_path, 'wb') as f:
                        f.write(response.content)
                    print(f"✅ 成功保存 {hostname} 的图标 (直接下载)")
                    return True
                    
            except Exception as e:
                print(f"⚠️  下载失败: {e}")
                continue
        
        return False

    def download_favicon(self, url, method='auto'):
        """
        下载网站favicon的主方法
        :param url: 网站URL
        :param method: 'google', 'direct', 'auto'
        :return: 成功返回True，失败返回False
        """
        url = self.normalize_url(url)
        hostname = self.get_hostname(url)
        
        if not hostname:
            print(f"❌ 无法解析URL: {url}")
            return False
        
        print(f"🌐 处理网站: {hostname}")
        
        # 检查文件是否已存在
        icon_path = os.path.join(self.icon_dir, f"{hostname}.png")
        if os.path.exists(icon_path):
            print(f"ℹ️  图标已存在: {icon_path}")
            return True
        
        success = False
        
        if method == 'google' or method == 'auto':
            success = self.download_favicon_google(url)
        
        if not success and (method == 'direct' or method == 'auto'):
            success = self.download_favicon_direct(url)
        
        if not success:
            # 创建默认图标
            self.create_default_icon(hostname)
        
        return success

    def create_default_icon(self, hostname):
        """
        为无法获取图标的网站创建默认图标
        :param hostname: 主机名
        """
        default_path = os.path.join(self.icon_dir, "default.png")
        if os.path.exists(default_path):
            import shutil
            icon_path = os.path.join(self.icon_dir, f"{hostname}.png")
            shutil.copy2(default_path, icon_path)
            print(f"📋 使用默认图标: {hostname}")
        else:
            print(f"❌ 无法获取图标且无默认图标: {hostname}")

    def batch_download_from_json(self, json_file='links.json'):
        """
        从JSON文件批量下载图标
        :param json_file: JSON文件路径
        """
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                links = json.load(f)
            
            print(f"📋 从 {json_file} 读取到 {len(links)} 个链接")
            success_count = 0
            
            for i, link in enumerate(links, 1):
                print(f"\n[{i}/{len(links)}] 处理中...")
                if self.download_favicon(link['url']):
                    success_count += 1
                print("-" * 40)
            
            print(f"\n✨ 批量下载完成！成功: {success_count}/{len(links)}")
            
        except FileNotFoundError:
            print(f"❌ 文件未找到: {json_file}")
        except json.JSONDecodeError:
            print(f"❌ JSON文件格式错误: {json_file}")
        except Exception as e:
            print(f"❌ 处理JSON文件时出错: {e}")

def main():
    """主函数"""
    print("🚀 交互式网站图标下载器")
    print("基于 fetch_icons.py 改进版本")
    print("=" * 50)
    
    downloader = FaviconDownloader()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--batch':
            # 批量模式
            json_file = sys.argv[2] if len(sys.argv) > 2 else 'links.json'
            downloader.batch_download_from_json(json_file)
            return
        else:
            # 命令行参数模式
            urls = sys.argv[1:]
            for url in urls:
                downloader.download_favicon(url)
            return
    
    # 交互式模式
    print("选择模式:")
    print("1. 单个URL下载")
    print("2. 批量URL下载")
    print("3. 从links.json批量下载")
    
    try:
        choice = input("\n请选择 (1-3): ").strip()
        
        if choice == '1':
            url = input("请输入网站URL: ").strip()
            if url:
                downloader.download_favicon(url)
        
        elif choice == '2':
            print("请输入网站URL（每行一个，输入空行结束）:")
            urls = []
            while True:
                url = input("URL: ").strip()
                if not url:
                    break
                urls.append(url)
            
            if urls:
                success_count = 0
                for i, url in enumerate(urls, 1):
                    print(f"\n[{i}/{len(urls)}] 处理中...")
                    if downloader.download_favicon(url):
                        success_count += 1
                    print("-" * 30)
                
                print(f"\n✨ 完成！成功: {success_count}/{len(urls)}")
        
        elif choice == '3':
            json_file = input("JSON文件路径 (默认: links.json): ").strip()
            if not json_file:
                json_file = 'links.json'
            downloader.batch_download_from_json(json_file)
        
        else:
            print("❌ 无效选择")
    
    except KeyboardInterrupt:
        print("\n\n👋 用户取消操作")
    except Exception as e:
        print(f"\n❌ 程序错误: {e}")

if __name__ == "__main__":
    main()