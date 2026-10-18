import requests
from typing import Dict, Any, Tuple
from ...config.settings import settings

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

def detect_audio_container(audio_bytes: bytes, fallback_name: str, fallback_mime: str) -> Tuple[str, str]:
    """Detects actual audio container from magic bytes to ensure Sarvam gets correct MIME and file extension."""
    if audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
        return "recording.webm", "audio/webm"
    elif audio_bytes.startswith(b"RIFF"):
        return "recording.wav", "audio/wav"
    elif audio_bytes.startswith(b"OggS"):
        return "recording.ogg", "audio/ogg"
    elif audio_bytes.startswith(b"ID3") or (len(audio_bytes) > 2 and audio_bytes[0] == 0xff and (audio_bytes[1] & 0xe0) == 0xe0):
        return "recording.mp3", "audio/mpeg"
    elif audio_bytes.startswith(b"\x00\x00\x00\x1cftyp") or audio_bytes.startswith(b"\x00\x00\x00\x20ftyp"):
        return "recording.m4a", "audio/mp4"
    return fallback_name or "recording.wav", fallback_mime or "audio/wav"

def transcribe_audio_sarvam(
    audio_bytes: bytes, 
    filename: str = "recording.wav", 
    mime_type: str = "audio/wav",
    language_code: str = "unknown"
) -> Tuple[str, bool, str, Dict[str, Any]]:
    """
    Transcribes audio using official Sarvam AI speech-to-text API (Saaras).
    Returns: (transcript, success, note, metadata_dict)
    Never exposes API key. Degrades safely on failure.
    """
    key = settings.sarvam_api_key
    if not key or key == "your_sarvam_api_key_here":
        return "", False, "Sarvam API key not configured. Using text fallback.", {}

    # Auto-detect real container from byte signatures
    resolved_name, resolved_mime = detect_audio_container(audio_bytes, filename, mime_type)

    try:
        headers = {
            "api-subscription-key": key
        }

        # Prepare multipart file payload
        files = {
            "file": (resolved_name, audio_bytes, resolved_mime)
        }
        data = {
            "model": "saaras:v4",
            "mode": "transcribe"
        }
        if language_code and language_code.lower() not in ["unknown", "auto"]:
            data["language_code"] = language_code

        res = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=20)

        if res.status_code == 200:
            result = res.json()
            transcript = result.get("transcript", "").strip()
            detected_lang = result.get("language_code", "hi-IN")
            meta = {
                "request_id": result.get("request_id"),
                "language_code": detected_lang,
                "model": "saaras:v4"
            }
            if transcript:
                return transcript, True, f"Sarvam AI speech recognition ({detected_lang})", meta
            else:
                return "", False, "No spoken words detected in audio. Please speak louder and closer to the microphone.", meta
        elif res.status_code in [400, 422]:
            # Try alternate model saaras:v3
            data["model"] = "saaras:v3"
            files = {"file": (resolved_name, audio_bytes, resolved_mime)}
            res2 = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=15)
            if res2.status_code == 200:
                result2 = res2.json()
                transcript = result2.get("transcript", "").strip()
                detected_lang = result2.get("language_code", "hi-IN")
                meta = {
                    "request_id": result2.get("request_id"),
                    "language_code": detected_lang,
                    "model": "saaras:v3"
                }
                if transcript:
                    return transcript, True, f"Sarvam AI speech recognition (saaras:v3 - {detected_lang})", meta
                else:
                    return "", False, "No spoken words detected in audio. Please speak louder and closer to the microphone.", meta
            error_msg = res.json().get("error", {}).get("message", f"HTTP {res.status_code}") if res.headers.get("content-type", "").startswith("application/json") else f"HTTP {res.status_code}"
            return "", False, f"Sarvam STT rejected audio format: {error_msg}", {}
        else:
            return "", False, f"Sarvam STT service returned status {res.status_code}.", {}
    except Exception as e:
        return "", False, f"Speech transcription error ({type(e).__name__}). Fallback to text entry.", {}
