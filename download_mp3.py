import os
import sys
import subprocess

try:
    import yt_dlp
except ImportError:
    print("Knihovna yt-dlp nebyla nalezena. Instaluji...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "yt-dlp"])
    import yt_dlp

def download_audio(url, output_dir="assets/audio"):
    os.makedirs(output_dir, exist_ok=True)
    
    is_playlist = "playlist" in url.lower() or "list=" in url.lower()
    
    ydl_opts = {
        'format': 'bestaudio/best',
        # Pokud je to playlist, uloží skladby do složky assets/audio
        'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'noplaylist': False,  # Povolit stahování celých playlistů
        'ignoreerrors': True, # Přeskočit smazaná/nedostupná videa v playlistu bez pádu
        'quiet': False,
    }

    if is_playlist:
        print(f"\n[Detekován playlist! Stahuji všechny skladby do MP3]")
    else:
        print(f"\n[Stahuji audio]: {url}")
    print(f"[Cílová složka]: {os.path.abspath(output_dir)}\n")
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    
    print("\n✓ Hotovo! Všechny MP3 byly úspěšně staženy.")

def main():
    if len(sys.argv) > 1:
        url = sys.argv[1].strip()
    else:
        print("=" * 55)
        print("  YouTube -> MP3 Stahovač pro Turnaj (Lanka 2027)")
        print("=" * 55)
        url = input("\nVlož YouTube URL odkaz: ").strip()

    if not url:
        print("Nebyl zadán žádný odkaz.")
        return

    try:
        download_audio(url)
    except Exception as e:
        print(f"\nChyba při stahování: {e}")

    # Pokud byl skript spuštěn dvojklikem ve Windows, počkáme před zavřením okna
    if len(sys.argv) <= 1:
        input("\nStiskni Enter pro ukončení...")

if __name__ == '__main__':
    main()
