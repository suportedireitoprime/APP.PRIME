from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import logging

app = FastAPI(title="YT-DLP API", version="1.0.0")

# Permitir chamadas do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/info")
def get_video_info(url: str):
    """Extrai informações do vídeo usando yt-dlp."""
    if not url:
        raise HTTPException(status_code=400, detail="URL é obrigatória")

    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Formatando a duração (de segundos para MM:SS)
            duration_sec = info.get('duration', 0)
            minutes = duration_sec // 60
            seconds = duration_sec % 60
            duration_str = f"{minutes:02d}:{seconds:02d}"

            return {
                "title": info.get("title", "Título desconhecido"),
                "duration": duration_str,
                "image": info.get("thumbnail", ""),
                "author": info.get("uploader", "Canal desconhecido"),
                "id": info.get("id", "")
            }
    except Exception as e:
        logging.error(f"Erro ao extrair info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
