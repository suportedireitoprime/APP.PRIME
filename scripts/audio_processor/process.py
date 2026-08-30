import os
import sys
import subprocess
import requests
from supabase import create_client, Client

def main():
    if len(sys.argv) < 6:
        print("Usage: process.py <raw_audio_url> <record_id> <table_name> <bucket_name> <final_file_path> [intro_url]")
        sys.exit(1)

    raw_audio_url = sys.argv[1]
    record_id = sys.argv[2]
    table_name = sys.argv[3]
    bucket_name = sys.argv[4]
    final_file_path = sys.argv[5]
    intro_url = sys.argv[6] if len(sys.argv) > 6 else None

    # Retrieve Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    # Update database status to processing
    try:
        # Assuming the tables have an 'audio_url' or similar column.
        # We will use the Supabase REST API to just update.
        # For AdminPilulas (table: pilulas) and AdminResumoLivroAudioEditar (table: biblioteca_livros)
        print(f"Marking record {record_id} as processing in {table_name}")
        # Not strictly necessary if the UI just waits, but good for state
    except Exception as e:
        print(f"Warning: Could not update status: {e}")

    # 1. Download raw audio
    print(f"Downloading raw audio from {raw_audio_url}...")
    raw_response = requests.get(raw_audio_url)
    if not raw_response.ok:
        print(f"Error downloading raw audio: {raw_response.status_code}")
        sys.exit(1)
    
    with open("raw.m4a", "wb") as f:
        f.write(raw_response.content)

    # 2. Download intro audio (if provided)
    use_intro = False
    if intro_url and intro_url.lower() not in ["null", "none", ""]:
        print(f"Downloading intro from {intro_url}...")
        intro_response = requests.get(intro_url)
        if intro_response.ok:
            with open("intro.mp3", "wb") as f:
                f.write(intro_response.content)
            use_intro = True
        else:
            print(f"Warning: Could not download intro: {intro_response.status_code}")

    # 3. Process with FFmpeg
    print("Processing audio with FFmpeg...")
    if use_intro:
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", "intro.mp3",
            "-i", "raw.m4a",
            "-filter_complex", "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:10,afade=t=out:st=8:d=2[intro];[1:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=8000|8000[voice];[intro][voice]amix=inputs=2:duration=longest:normalize=0,aformat=channel_layouts=mono[out]",
            "-map", "[out]",
            "-c:a", "libmp3lame", "-b:a", "64k",
            "output.mp3"
        ]
    else:
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", "raw.m4a",
            "-ac", "1",
            "-c:a", "libmp3lame", "-b:a", "64k",
            "output.mp3"
        ]

    try:
        subprocess.run(ffmpeg_cmd, check=True)
        print("FFmpeg processing complete.")
    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg: {e}")
        sys.exit(1)

    # 4. Upload to Supabase Storage
    print(f"Uploading output to Supabase Storage: bucket={bucket_name}, path={final_file_path}")
    with open("output.mp3", "rb") as f:
        upload_response = supabase.storage.from_(bucket_name).upload(
            file=f,
            path=final_file_path,
            file_options={"content-type": "audio/mpeg", "upsert": "true"}
        )
    
    # Check upload response for errors (supabase-py sometimes returns an object or a dict)
    if not upload_response:
        print(f"Upload failed!")
        sys.exit(1)

    # 5. Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(final_file_path)
    print(f"Public URL: {public_url}")

    # 6. Update database record
    print(f"Updating database table {table_name} for record {record_id}...")
    update_data = {}
    if table_name == "pilulas":
        update_data = {"audio_url": public_url}
    elif table_name == "biblioteca_livros":
        update_data = {"audio_url": public_url}
        # se existir outras colunas para atualizar (ex: tamanho, duracao)
    
    try:
        res = supabase.table(table_name).update(update_data).eq("id", record_id).execute()
        print("Database updated successfully.")
        print(res)
    except Exception as e:
        print(f"Error updating database: {e}")
        sys.exit(1)

    print("Process finished successfully!")

if __name__ == "__main__":
    main()
