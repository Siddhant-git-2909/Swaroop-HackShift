import requests
from typing import Dict, Any, Tuple
from ...config.settings import settings

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

def transcribe_audio_sarvam(audio_bytes: bytes, filename: str = "recording.wav", mime_type: str = "audio/wav") -> Tuple[str, bool, str]:
    """
    Transcribes audio using official Sarvam AI speech-to-text API.
    Returns: (transcript, success, note)
    Never exposes API key. Degrades safely to text fallback on failure.
    """
    key = settings.sarvam_api_key
    if not key or key == "your_sarvam_api_key_here":
        return "", False, "Sarvam API key not configured. Using text fallback."

    try:
        headers = {
            "api-subscription-key": key
        }

        # Prepare multipart file payload
        files = {
            "file": (filename, audio_bytes, mime_type)
        }
        data = {
            "model": "saaras:v3",
            "language_code": "unknown", # auto-detects Hindi/Hinglish/English
            "mode": "transcribe"
        }

        res = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=15)

        if res.status_code == 200:
            result = res.json()
            transcript = result.get("transcript", "").strip()
            detected_lang = result.get("language_code", "hi-IN")
            return transcript, True, f"Sarvam AI speech recognition ({detected_lang})"
        elif res.status_code == 400:
            # Try alternate model if v3 body differs
            data["model"] = "saaras:v2"
            res2 = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=10)
            if res2.status_code == 200:
                result2 = res2.json()
                return result2.get("transcript", "").strip(), True, "Sarvam AI speech recognition (saaras:v2)"
            return "", False, f"Sarvam STT rejected audio format (HTTP {res.status_code})."
        else:
            return "", False, f"Sarvam STT service returned status {res.status_code}."
    except Exception as e:
        return "", False, f"Speech transcription error ({type(e).__name__}). Fallback to text entry."
