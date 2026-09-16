import os
from PIL import Image

# The uploaded image path
input_path = r"C:\Users\ext_wpereira\.gemini\antigravity-ide\brain\d0b1e94b-c827-4c55-bc4c-5c3abc7d8681\.user_uploaded\uploaded_media_1789543955310.img"
# The destination path
output_path = r"c:\Users\ext_wpereira\OneDrive - Vitamina Work Life S.A\Documentos\APP.PRIME\src\assets\covers\hero-estudante-v3.webp"

try:
    img = Image.open(input_path)
    # Convert to RGB just in case
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # Save as webp with 100% quality
    img.save(output_path, "webp", quality=100, method=6)
    print("Imagem convertida e salva com sucesso em", output_path)
except Exception as e:
    print("Erro ao converter imagem:", e)
