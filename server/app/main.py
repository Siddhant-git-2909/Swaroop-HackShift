import os
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .config.settings import settings
from .shared.mongodb import mongo_store
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- Request / Response Schemas ---
class OTPRequest(BaseModel):
    phone: str
    role: str = "worker" # worker | customer | contractor | facilitator | admin
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

# --- Endpoints ---

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

# Auth (Simulated Demo OTP + MongoDB persistent users)
@app.post("/api/v1/auth/otp/request")
def request_otp(req: OTPRequest):
    return {
        "success": True,
        "message": f"SIMULATED: Verification code sent to {req.phone}.",
        "demo_otp": settings.demo_otp,
        "simulated": True
    }

@app.post("/api/v1/auth/otp/verify")
def verify_otp(req: OTPVerify):
    if req.otp != settings.demo_otp and req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP. Use demo OTP 123456")

    user = mongo_store.get_user_by_phone(req.phone)
    if not user:
        user = mongo_store.create_user(
            phone=req.phone,
            role=req.role,
            name=req.name or f"User {req.phone[-4:]}"
        )

    token = f"swaroop-jwt-{user['id']}"
    worker_profile = mongo_store.get_worker(user["id"]) if user["role"] == "worker" else None

    return {
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

@app.post("/api/v1/workers/voice-transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    """
    Accepts real recorded audio file from browser MediaRecorder,
    transcribes it using official Sarvam AI API, and extracts grounded profile.
    """
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) < 500:
            # Empty or too short audio; fall back gracefully
            return {
                "success": False,
                "transcript": "",
                "note": "Audio recording too short. Please speak again or use text entry.",
                "draft": None
            }

        transcript, success, note = transcribe_audio_sarvam(
            audio_bytes,
            filename=file.filename or "recording.wav",
            mime_type=file.content_type or "audio/wav"
        )

        if success and transcript:
            draft = VoiceAndTextExtractor.extract_from_text(transcript)
            return {
                "success": True,
                "transcript": transcript,
                "note": note,
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
        profiles = list(mongo_store.db.worker_profiles.find({}))
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

# Demo Reset (Safely resets demo records only; preserves user-created records)
@app.post("/api/v1/demo/reset")
def demo_reset():
    mongo_store.demo_reset()
    return {
        "success": True,
        "message": "Demo records have been restored to baseline clean state. User-created profiles remain preserved."
    }
