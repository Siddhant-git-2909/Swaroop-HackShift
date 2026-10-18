import os
import re
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .config.settings import settings
from .shared.mongodb import mongo_store, clean_doc, clean_docs
from .shared.ai.extractor import VoiceAndTextExtractor
from .shared.ai.sarvam import transcribe_audio_sarvam

app = FastAPI(
    title="SWAROOP API",
    description="Resume nahi, hunar hai. Voice-first platform for skilled informal workers backed by MongoDB Atlas.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/api/v1/openapi.json"
)

# CORS configuration
cors_origins_raw = settings.cors_origins.strip()
if cors_origins_raw == "*" or not cors_origins_raw:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    allowed_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.exception_handler(RuntimeError)
def runtime_error_handler(request, exc: RuntimeError):
    if "MongoDB" in str(exc):
        return JSONResponse(
            status_code=503,
            content={
                "detail": str(exc),
                "database": "MongoDB Atlas",
                "database_connected": False
            }
        )
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# Upload directory setup
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# --- Startup & Shutdown ---
@app.on_event("startup")
def on_startup():
    mongo_store.connect()

@app.on_event("shutdown")
def on_shutdown():
    mongo_store.close()

# --- Phone Normalization & Validation ---
def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r"\D", "", str(phone))
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    return digits

def is_valid_indian_phone(phone: str) -> bool:
    norm = normalize_phone(phone)
    return bool(re.match(r"^[6-9]\d{9}$", norm))

# --- Request / Response Schemas ---
class SignupRequest(BaseModel):
    name: str
    phone: str
    role: str # worker | contractor | customer

class OTPRequest(BaseModel):
    phone: str
    role: Optional[str] = "worker" # worker | customer | contractor | facilitator | admin
    name: Optional[str] = None

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: str = "worker"
    name: Optional[str] = None

class StaffLogin(BaseModel):
    phone: str
    password: str

class TextDraftRequest(BaseModel):
    text: str

class ProfileConfirmRequest(BaseModel):
    user_id: str
    name: str
    headline: str
    core_skills: List[str]
    secondary_skills: List[str] = []
    experience_years: Optional[int] = None
    area_id: Optional[str] = None
    area_text: Optional[str] = None
    source: str = "voice"

class SearchRequest(BaseModel):
    category: Optional[str] = None
    area_id: Optional[str] = None
    query: Optional[str] = None

class BookingCreate(BaseModel):
    customer_id: str
    worker_id: str
    contractor_id: Optional[str] = None
    booking_type: str = "direct" # direct | contractor_dispatch
    category: str
    description: str
    area_id: Optional[str] = None
    requested_for: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class QuoteItem(BaseModel):
    label: str
    qty: float = 1.0
    unit_paise: int

class QuoteCreate(BaseModel):
    created_by: str
    note: str
    items: List[QuoteItem]

class ReviewCreate(BaseModel):
    booking_id: str
    reviewer_id: str
    rating: int
    text: str

class FacilitatorAssess(BaseModel):
    facilitator_id: str
    scope: str
    note: str

class ContractorProjectCreate(BaseModel):
    contractor_id: str
    title: str
    category: str
    workers_needed: int
    area_id: str
    budget_rs: int
    description: str

class AssignWorkerRequest(BaseModel):
    worker_id: str

class ContractorWorkerReviewRequest(BaseModel):
    contractor_id: str
    claim_id: Optional[str] = None
    verdict: str = "verified" # verified | reviewed | rejected
    note: str

# --- Endpoints ---
@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "app_env": settings.app_env,
        "demo_mode": settings.demo_mode,
        "database": "MongoDB Atlas",
        "database_connected": mongo_store.connected,
        "database_name": settings.mongodb_database,
        "sarvam_stt_configured": bool(settings.sarvam_api_key and settings.sarvam_api_key != "your_sarvam_api_key_here"),
        "public_base_url": settings.public_base_url,
        "demo_otp": settings.demo_otp if settings.demo_mode else None
    }

@app.get("/api/v1/areas")
def get_areas():
    return mongo_store.get_areas()

@app.get("/api/v1/skills")
def get_skills():
    return mongo_store.get_skills()

# Auth (Common Signup, Simulated Demo OTP Login & MongoDB persistent users)
@app.post("/api/v1/auth/signup")
def signup(req: SignupRequest):
    if not req.name or len(req.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name is required (minimum 2 characters).")

    norm_phone = normalize_phone(req.phone)
    if not is_valid_indian_phone(norm_phone):
        raise HTTPException(status_code=400, detail="Invalid Indian mobile number. Please enter a valid 10-digit number starting with 6, 7, 8, or 9.")

    role = req.role.lower().strip()
    if role not in ["worker", "contractor", "customer"]:
        raise HTTPException(status_code=400, detail="Role must be one of: worker, contractor, customer.")

    existing = mongo_store.get_user_by_phone(norm_phone)
    if existing:
        raise HTTPException(status_code=400, detail="Phone number is already registered. Please login instead.")

    user = mongo_store.create_user(phone=norm_phone, role=role, name=req.name.strip())

    worker_profile = None
    if role == "worker":
        worker_profile = mongo_store.get_worker(user["id"])
        if not worker_profile:
            slug = f"{req.name.strip().lower().replace(' ', '-')}-{norm_phone[-4:]}"
            worker_profile = mongo_store.save_worker_profile(user["id"], {
                "user_id": user["id"],
                "name": req.name.strip(),
                "headline": f"Skilled Worker — {req.name.strip()}",
                "core_skills": [],
                "secondary_skills": [],
                "slug": slug,
                "trust_level": 1
            })

    token = f"swaroop-jwt-{user['id']}"
    return {
        "success": True,
        "message": f"Account successfully created as {role.capitalize()}.",
        "token": token,
        "user": {
            "id": user["id"],
            "phone": user["phone"],
            "role": user["role"],
            "name": user["name"],
            "status": user.get("status", "active")
        },
        "worker_profile": worker_profile
    }

@app.post("/api/v1/auth/otp/request")
def request_otp(req: OTPRequest):
    norm_phone = normalize_phone(req.phone)
    if not is_valid_indian_phone(norm_phone):
        raise HTTPException(status_code=400, detail="Invalid Indian mobile number. Must be a 10-digit number starting with 6, 7, 8, or 9.")

    user = mongo_store.get_user_by_phone(norm_phone)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found for this phone number. Please sign up first.")

    res = {
        "success": True,
        "message": f"DEMO OTP: Use {settings.demo_otp}. SMS delivery simulated for HackShift MVP.",
        "simulated": True,
        "phone": norm_phone
    }
    # Restrict demo OTP exposure in production API responses
    if settings.demo_mode and settings.app_env != "production":
        res["demo_otp"] = settings.demo_otp

    return res

@app.post("/api/v1/auth/otp/verify")
def verify_otp(req: OTPVerify):
    norm_phone = normalize_phone(req.phone)
    if not is_valid_indian_phone(norm_phone):
        raise HTTPException(status_code=400, detail="Invalid Indian mobile number.")

    user = mongo_store.get_user_by_phone(norm_phone)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found for this phone number. Please sign up first.")

    # Reject incorrect or missing OTP
    if req.otp != settings.demo_otp and req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP. Use DEMO OTP 123456.")

    # Login retrieves existing account and its stored role (no duplicate accounts or role changes)
    token = f"swaroop-jwt-{user['id']}"
    worker_profile = mongo_store.get_worker(user["id"]) if user["role"] == "worker" else None

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "phone": user["phone"],
            "role": user["role"],
            "name": user["name"],
            "status": user.get("status", "active")
        },
        "worker_profile": worker_profile,
        "simulated": True
    }

@app.get("/api/v1/workers/{worker_id}/contact")
def get_worker_contact(worker_id: str):
    worker = mongo_store.get_worker(worker_id)
    if not worker:
        worker = mongo_store.get_worker_by_slug(worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    user = mongo_store.get_user_by_id(worker["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="Worker account not found")

    return {
        "worker_id": worker["user_id"],
        "name": worker.get("name") or user.get("name"),
        "phone": user.get("phone"),
        "headline": worker.get("headline"),
        "area_text": worker.get("area_text", "Delhi NCR"),
        "trust_level": worker.get("trust_level", 1)
    }

@app.post("/api/v1/auth/staff/login")
def staff_login(req: StaffLogin):
    user = mongo_store.get_user_by_phone(req.phone)
    if not user or user.get("role") not in ["facilitator", "admin"]:
        raise HTTPException(status_code=403, detail="Staff user not found")

    if req.password != settings.demo_staff_password:
        raise HTTPException(status_code=401, detail="Incorrect staff password. Use 'change-me-demo'")

    token = f"swaroop-jwt-{user['id']}"
    return {
        "token": token,
        "user": user
    }

@app.get("/api/v1/auth/me")
def get_me(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    user_id = authorization.replace("Bearer ", "").replace("swaroop-jwt-", "").replace("demo-jwt-", "")
    user = mongo_store.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Sarvam Voice & Text Onboarding
@app.post("/api/v1/workers/text-draft")
def text_draft(req: TextDraftRequest):
    draft = VoiceAndTextExtractor.extract_from_text(req.text)
    return {
        "draft": draft,
        "degraded": False
    }

@app.post("/api/v1/workers/voice-draft")
def voice_draft_sample():
    # Returns grounded sample for immediate one-click testing
    draft = VoiceAndTextExtractor.get_demo_voice_sample()
    return {
        "draft": draft,
        "degraded": False,
        "source": "voice"
    }

@app.post("/api/v1/voice/transcribe")
async def general_voice_transcribe(
    file: UploadFile = File(...),
    language_code: Optional[str] = Form("unknown")
):
    """
    Universal Voice-to-Text endpoint powered by Sarvam AI (Saaras model).
    Accepts any spoken audio in Hindi, Hinglish, English, or Indian regional languages
    and converts it into high-accuracy text.
    """
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) < 300:
            return {
                "success": False,
                "transcript": "",
                "note": "Recording was too short or silent. Please speak clearly into your microphone.",
                "language_code": language_code or "unknown"
            }

        transcript, success, note, meta = transcribe_audio_sarvam(
            audio_bytes,
            filename=file.filename or "recording.webm",
            mime_type=file.content_type or "audio/webm",
            language_code=language_code or "unknown"
        )

        return {
            "success": success,
            "transcript": transcript,
            "note": note,
            "language_code": meta.get("language_code", "unknown"),
            "meta": meta
        }
    except Exception as e:
        return {
            "success": False,
            "transcript": "",
            "note": f"Transcription error: {str(e)}",
            "language_code": "unknown"
        }

@app.post("/api/v1/workers/voice-transcribe")
async def worker_voice_transcribe(file: UploadFile = File(...)):
    """
    Worker voice profile creation: accepts audio, transcribes with Sarvam AI,
    and automatically extracts structured skill profile fields.
    """
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) < 300:
            return {
                "success": False,
                "transcript": "",
                "note": "Audio recording too short. Please speak again or use text entry.",
                "draft": None
            }

        transcript, success, note, meta = transcribe_audio_sarvam(
            audio_bytes,
            filename=file.filename or "recording.webm",
            mime_type=file.content_type or "audio/webm"
        )

        if success and transcript:
            draft = VoiceAndTextExtractor.extract_from_text(transcript)
            return {
                "success": True,
                "transcript": transcript,
                "note": note,
                "language_code": meta.get("language_code", "hi-IN"),
                "draft": draft
            }
        else:
            return {
                "success": False,
                "transcript": "",
                "note": note,
                "draft": None
            }
    except Exception as e:
        return {
            "success": False,
            "transcript": "",
            "note": f"Audio processing error: {str(e)}",
            "draft": None
        }

@app.post("/api/v1/workers/profile/confirm")
def confirm_worker_profile(req: ProfileConfirmRequest):
    user = mongo_store.get_user_by_id(req.user_id)
    if not user:
        user = mongo_store.create_user(phone=f"90000{req.user_id[-5:]}", role="worker", name=req.name)
    else:
        user["name"] = req.name

    profile = mongo_store.save_worker_profile(req.user_id, req.model_dump())
    return {
        "success": True,
        "profile": profile
    }

@app.get("/api/v1/workers/me")
def get_my_worker_profile(worker_id: str):
    profile = mongo_store.get_worker(worker_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    claims = mongo_store.get_worker_claims(worker_id)
    evidence = mongo_store.get_worker_evidence(worker_id)
    return {
        "profile": profile,
        "claims": claims,
        "evidence": evidence
    }

@app.get("/api/v1/public/workers/{slug}")
def get_public_passport(slug: str):
    worker = mongo_store.get_worker_by_slug(slug)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    uid = worker["user_id"]
    claims = mongo_store.get_worker_claims(uid)
    evidence = [e for e in mongo_store.get_worker_evidence(uid) if e.get("is_public", True)]
    reviews = mongo_store.get_worker_reviews(uid)

    public_url = f"{settings.public_base_url.rstrip('/')}/w/{worker['slug']}"

    # Privacy guarantee: NEVER expose phone number on public profile
    return {
        "worker": {
            "slug": worker["slug"],
            "name": worker["name"],
            "headline": worker["headline"],
            "core_skills": worker["core_skills"],
            "secondary_skills": worker.get("secondary_skills", []),
            "experience_years": worker.get("experience_years"),
            "area_text": worker.get("area_text"),
            "trust_level": worker.get("trust_level", 1),
            "identity_check_status": worker.get("identity_check_status"),
            "availability": worker.get("availability")
        },
        "public_url": public_url,
        "claims": claims,
        "evidence": evidence,
        "reviews": reviews
    }

# Real Evidence File Upload & Trust
@app.post("/api/v1/evidence")
async def upload_evidence(
    worker_id: str = Form(...),
    caption: str = Form(...),
    skill_slug: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    final_url = image_url or "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60"

    if file and file.filename:
        # Validate file format and size
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail="Invalid image file type. Please upload JPG, PNG, or WebP.")

        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

        saved_filename = f"ev_{uuid.uuid4().hex[:10]}{ext}"
        file_path = os.path.join(settings.upload_dir, saved_filename)
        with open(file_path, "wb") as f:
            f.write(content)
        final_url = f"/uploads/{saved_filename}"

    ev = mongo_store.add_evidence(
        worker_id=worker_id,
        kind="photo",
        image_url=final_url,
        caption=caption,
        skill_slug=skill_slug
    )
    return ev

@app.get("/api/v1/evidence/me")
def get_my_evidence(worker_id: str):
    return mongo_store.get_worker_evidence(worker_id)

@app.get("/api/v1/workers/me/trust")
def get_trust_status(worker_id: str):
    profile = mongo_store.get_worker(worker_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    level = profile.get("trust_level", 1)
    claims = mongo_store.get_worker_claims(worker_id)
    evidence = mongo_store.get_worker_evidence(worker_id)

    next_step = ""
    if level == 1:
        next_step = "Upload work photos or project proof to reach Level 2 (Evidence Added)"
    elif level == 2:
        next_step = "Visit your local Sewa Kendra for in-person skill assessment to reach Level 3 (Human-Reviewed)"
    else:
        next_step = "You are at Level 3 (Independently Verified by Facilitator)!"

    return {
        "level": level,
        "level_title": "Level 1: Self-Declared" if level == 1 else ("Level 2: Evidence Added" if level == 2 else "Level 3: Independently Verified"),
        "claims": claims,
        "evidence_count": len(evidence),
        "next_step": next_step
    }

# Discovery & Matching (Directly querying MongoDB Atlas)
@app.post("/api/v1/matching/search")
def search_matching(req: SearchRequest):
    results = mongo_store.search_workers(category=req.category, area_id=req.area_id, query=req.query)
    return {
        "total": len(results),
        "results": results
    }

# Bookings Lifecycle
@app.post("/api/v1/bookings")
def create_booking(req: BookingCreate):
    booking = mongo_store.create_booking(
        customer_id=req.customer_id,
        worker_id=req.worker_id,
        contractor_id=req.contractor_id,
        booking_type=req.booking_type,
        category=req.category,
        description=req.description,
        area_id=req.area_id,
        requested_for=req.requested_for
    )
    return booking

@app.get("/api/v1/bookings")
def list_bookings(user_id: str, role: str = "customer"):
    return mongo_store.list_bookings(user_id, role)

@app.get("/api/v1/bookings/{id}")
def get_booking_detail(id: str):
    booking = mongo_store.get_booking(id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    w = mongo_store.get_worker(booking.get("worker_id", ""))
    c = mongo_store.get_user_by_id(booking.get("customer_id", ""))
    quote = mongo_store.get_quotation(booking.get("current_quotation_id")) if booking.get("current_quotation_id") else None

    return {
        **booking,
        "worker_name": w.get("name") if w else "Worker",
        "customer_name": c.get("name") if c else "Customer",
        "quotation": quote
    }

@app.post("/api/v1/bookings/{id}/status")
def update_booking_status(id: str, req: StatusUpdate):
    try:
        updated = mongo_store.update_booking_status(id, req.status)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Quotations
@app.post("/api/v1/bookings/{id}/quotations")
def create_quote(id: str, req: QuoteCreate):
    try:
        quote = mongo_store.create_quotation(
            booking_id=id,
            created_by=req.created_by,
            note=req.note,
            items=[item.model_dump() for item in req.items]
        )
        return quote
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/quotations/{id}/accept")
def accept_quote(id: str, customer_id: str):
    try:
        quote = mongo_store.accept_quotation(id, customer_id)
        return quote
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Reviews
@app.post("/api/v1/reviews")
def submit_review(req: ReviewCreate):
    try:
        rev = mongo_store.add_review(
            booking_id=req.booking_id,
            reviewer_id=req.reviewer_id,
            rating=req.rating,
            text=req.text
        )
        return rev
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/public/workers/{slug}/reviews")
def get_worker_reviews(slug: str):
    worker = mongo_store.get_worker_by_slug(slug)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return mongo_store.get_worker_reviews(worker["user_id"])

# Facilitator In-Person Assessment (Promote to L3)
@app.post("/api/v1/facilitator/claims/{id}/assess")
def assess_claim(id: str, req: FacilitatorAssess):
    facilitator = mongo_store.get_user_by_id(req.facilitator_id)
    if not facilitator or facilitator.get("role") not in ["facilitator", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only certified Sewa Kendra facilitators can assess Level 3 claims.")

    try:
        claim = mongo_store.human_assess_claim(
            claim_id=id,
            facilitator_id=req.facilitator_id,
            scope=req.scope,
            note=req.note
        )
        return {
            "success": True,
            "claim": claim,
            "message": "Worker claim successfully verified in-person. Worker is now Level 3 (Independently Verified)."
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/facilitator/workers")
def list_facilitator_queue():
    workers = []
    if mongo_store.connected and mongo_store.db is not None:
        profiles = clean_docs(list(mongo_store.db.worker_profiles.find({})))
    else:
        profiles = []
    for w in profiles:
        uid = w["user_id"]
        claims = mongo_store.get_worker_claims(uid)
        evidence = mongo_store.get_worker_evidence(uid)
        workers.append({
            "worker": w,
            "claims": claims,
            "evidence": evidence
        })
    return workers

# Contractor Projects & Squad Management
@app.post("/api/v1/contractor/projects")
def create_contractor_project(req: ContractorProjectCreate):
    contractor = mongo_store.get_user_by_id(req.contractor_id)
    if not contractor or contractor.get("role") not in ["contractor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only registered commercial contractors can create project squads.")

    return mongo_store.contractor_create_project(
        contractor_id=req.contractor_id,
        title=req.title,
        category=req.category,
        workers_needed=req.workers_needed,
        area_id=req.area_id,
        budget_rs=req.budget_rs,
        description=req.description
    )

@app.get("/api/v1/contractor/projects")
def list_contractor_projects(contractor_id: Optional[str] = None):
    return mongo_store.contractor_list_projects(contractor_id)

@app.post("/api/v1/contractor/projects/{id}/assign")
def assign_worker_to_project(id: str, req: AssignWorkerRequest):
    return mongo_store.contractor_assign_worker(id, req.worker_id)

@app.post("/api/v1/contractor/workers/{worker_id}/review")
def contractor_review_worker(worker_id: str, req: ContractorWorkerReviewRequest):
    contractor = mongo_store.get_user_by_id(req.contractor_id)
    if not contractor or contractor.get("role") not in ["contractor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only registered commercial contractors can submit trade verification reviews.")

    try:
        rev = mongo_store.contractor_review_worker(
            contractor_id=req.contractor_id,
            worker_id=worker_id,
            claim_id=req.claim_id,
            verdict=req.verdict,
            note=req.note
        )
        return {
            "success": True,
            "review": rev,
            "message": f"Worker trade performance successfully marked as {req.verdict}."
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

# Demo Reset (Safely resets demo records only; preserves user-created records)
@app.post("/api/v1/demo/reset")
def demo_reset():
    mongo_store.demo_reset()
    return {
        "success": True,
        "message": "Demo records have been restored to baseline clean state. User-created profiles remain preserved."
    }
