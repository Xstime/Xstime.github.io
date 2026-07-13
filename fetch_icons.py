from download_favicon import FaviconDownloader


def main() -> None:
    downloader = FaviconDownloader(icon_dir='icon')
    downloader.batch_download_from_json('links.json')


if __name__ == '__main__':
    main()
