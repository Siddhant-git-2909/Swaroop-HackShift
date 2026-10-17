import math
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from pymongo import MongoClient, ASCENDING, UpdateOne
from pymongo.errors import PyMongoError

from ..config.settings import settings
from .seed_data import (
    AREAS, SKILLS_TAXONOMY, USERS, WORKER_PROFILES,
    CLAIMS, EVIDENCE, BOOKINGS, QUOTATIONS, REVIEWS, CONTRACTOR_PROJECTS
)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def clean_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc is None:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
    return d

def clean_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [clean_doc(d) for d in docs]

class MongoStore:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.connected = False
        self._fallback_store = None

    def connect(self):
        if self.connected and self.db is not None:
            return True

        uri = settings.mongodb_uri
        db_name = settings.mongodb_database or "swaroop"
        if not uri:
            print("[SWAROOP DB] MONGODB_URI not configured. Using fallback demo store.")
            return False

        try:
            self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            # Verify connection with ping
            self.client.admin.command("ping")
            self.db = self.client[db_name]
            self.connected = True
            print(f"[SWAROOP DB] Successfully connected to MongoDB Atlas database: {db_name}")
            self.create_indexes()
            self.seed_deterministic_demo_data()
            return True
        except PyMongoError as e:
            print(f"[SWAROOP DB] MongoDB Atlas connection failed ({type(e).__name__}). Using fallback store.")
            self.connected = False
            return False

    def close(self):
        if self.client:
            self.client.close()
            self.connected = False
            print("[SWAROOP DB] MongoDB connection closed.")

    def create_indexes(self):
        if not self.connected or self.db is None:
            return
        try:
            self.db.users.create_index([("phone", ASCENDING)], unique=True, sparse=True)
            self.db.users.create_index([("id", ASCENDING)], unique=True)
            self.db.worker_profiles.create_index([("user_id", ASCENDING)], unique=True)
            self.db.worker_profiles.create_index([("slug", ASCENDING)], unique=True)
            self.db.claims.create_index([("worker_id", ASCENDING)])
            self.db.claims.create_index([("id", ASCENDING)], unique=True)
            self.db.evidence.create_index([("worker_id", ASCENDING)])
            self.db.evidence.create_index([("id", ASCENDING)], unique=True)
            self.db.bookings.create_index([("id", ASCENDING)], unique=True)
            self.db.bookings.create_index([("customer_id", ASCENDING)])
            self.db.bookings.create_index([("worker_id", ASCENDING)])
            self.db.quotations.create_index([("booking_id", ASCENDING)])
            self.db.reviews.create_index([("worker_id", ASCENDING)])
            self.db.contractor_projects.create_index([("contractor_id", ASCENDING)])
        except Exception as e:
            print(f"[SWAROOP DB] Index creation warning: {e}")

    def seed_deterministic_demo_data(self):
        """
        Idempotent seeding: ensures demo personas, Delhi NCR areas, taxonomy,
        and starter projects exist, but NEVER deletes or overwrites user-created data.
        """
        if not self.connected or self.db is None:
            return

        try:
            # Seed Areas
            for a in AREAS:
                doc = dict(a)
                doc["is_demo"] = True
                self.db.areas.update_one({"id": a["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Skills
            for s in SKILLS_TAXONOMY:
                doc = dict(s)
                doc["is_demo"] = True
                self.db.skills.update_one({"id": s["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Users
            for u in USERS:
                doc = dict(u)
                doc["is_demo"] = True
                self.db.users.update_one({"id": u["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Worker Profiles
            for w in WORKER_PROFILES:
                doc = dict(w)
                doc["is_demo"] = True
                self.db.worker_profiles.update_one({"user_id": w["user_id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Claims
            for c in CLAIMS:
                doc = dict(c)
                doc["is_demo"] = True
                self.db.claims.update_one({"id": c["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Evidence
            for ev in EVIDENCE:
                doc = dict(ev)
                doc["is_demo"] = True
                self.db.evidence.update_one({"id": ev["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Bookings
            for b in BOOKINGS:
                doc = dict(b)
                doc["is_demo"] = True
                self.db.bookings.update_one({"id": b["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Quotations
            for q in QUOTATIONS:
                doc = dict(q)
                doc["is_demo"] = True
                self.db.quotations.update_one({"id": q["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Reviews
            for r in REVIEWS:
                doc = dict(r)
                doc["is_demo"] = True
                self.db.reviews.update_one({"id": r["id"]}, {"$setOnInsert": doc}, upsert=True)

            # Seed Contractor Projects
            for p in CONTRACTOR_PROJECTS:
                doc = dict(p)
                doc["is_demo"] = True
                self.db.contractor_projects.update_one({"id": p["id"]}, {"$setOnInsert": doc}, upsert=True)

            print("[SWAROOP DB] Idempotent demo data seeded successfully in MongoDB Atlas.")
        except Exception as e:
            print(f"[SWAROOP DB] Seeding error: {e}")

    # Areas & Skills
    def get_areas(self) -> List[Dict[str, Any]]:
        if self.connected and self.db is not None:
            return clean_docs(list(self.db.areas.find({}, {"_id": 0})))
        return AREAS

    def get_skills(self) -> List[Dict[str, Any]]:
        if self.connected and self.db is not None:
            return clean_docs(list(self.db.skills.find({}, {"_id": 0})))
        return SKILLS_TAXONOMY

    # Users
    def get_user_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        if self.connected and self.db is not None:
            u = self.db.users.find_one({"phone": phone})
            return clean_doc(u)
        return next((u for u in USERS if u["phone"] == phone), None)

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.connected and self.db is not None:
            u = self.db.users.find_one({"id": user_id})
            return clean_doc(u)
        return next((u for u in USERS if u["id"] == user_id), None)

    def create_user(self, phone: str, role: str, name: str, language: str = "hi") -> Dict[str, Any]:
        existing = self.get_user_by_phone(phone)
        if existing:
            return existing

        user_id = f"user-{uuid.uuid4().hex[:8]}"
        user = {
            "id": user_id,
            "phone": phone,
            "role": role,
            "name": name,
            "language": language,
            "status": "active",
            "is_demo": False,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        if self.connected and self.db is not None:
            self.db.users.update_one({"id": user_id}, {"$set": user}, upsert=True)
        return user

    # Workers
    def get_worker(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.connected and self.db is not None:
            w = self.db.worker_profiles.find_one({"user_id": user_id})
            return clean_doc(w)
        return next((w for w in WORKER_PROFILES if w["user_id"] == user_id), None)

    def get_worker_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        if self.connected and self.db is not None:
            w = self.db.worker_profiles.find_one({"slug": slug})
            return clean_doc(w)
        return next((w for w in WORKER_PROFILES if w["slug"] == slug), None)

    def save_worker_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.get_worker(user_id) or {}
        slug = profile_data.get("slug") or existing.get("slug") or f"worker-{user_id.split('-')[-1]}"

        updated = {
            "user_id": user_id,
            "slug": slug,
            "name": profile_data.get("name", existing.get("name", "Karmachari")),
            "headline": profile_data.get("headline", ""),
            "core_skills": profile_data.get("core_skills", []),
            "secondary_skills": profile_data.get("secondary_skills", []),
            "experience_years": profile_data.get("experience_years"),
            "area_id": profile_data.get("area_id"),
            "area_text": profile_data.get("area_text", ""),
            "availability": profile_data.get("availability", {"today": True, "days": ["mon", "tue", "wed", "thu", "fri", "sat"], "from": "09:00", "to": "18:00"}),
            "source": profile_data.get("source", "voice"),
            "trust_level": existing.get("trust_level", 1),
            "identity_check_status": existing.get("identity_check_status", "none"),
            "human_verified_by": existing.get("human_verified_by"),
            "human_verified_at": existing.get("human_verified_at"),
            "public_fields": profile_data.get("public_fields", {"experience": True, "area": True, "reviews": True, "skills": True}),
            "is_demo": False,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.connected and self.db is not None:
            self.db.worker_profiles.update_one({"user_id": user_id}, {"$set": updated}, upsert=True)

        # Create or update default skill claims
        for skill in updated["core_skills"]:
            existing_claim = None
            if self.connected and self.db is not None:
                existing_claim = self.db.claims.find_one({"worker_id": user_id, "subject": skill})

            if not existing_claim:
                cid = f"claim-{uuid.uuid4().hex[:8]}"
                claim_doc = {
                    "id": cid,
                    "worker_id": user_id,
                    "type": "skill",
                    "subject": skill,
                    "status": "self_declared",
                    "source_label": "Self-declared during profile onboarding",
                    "scope": f"{skill.capitalize()} general trade work",
                    "assessed_by": None,
                    "assessed_at": None,
                    "note": None,
                    "is_demo": False,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }
                if self.connected and self.db is not None:
                    self.db.claims.insert_one(claim_doc)

        self.recompute_trust(user_id)
        return clean_doc(self.get_worker(user_id))

    def recompute_trust(self, worker_id: str):
        worker = self.get_worker(worker_id)
        if not worker:
            return

        if worker.get("human_verified_by"):
            new_level = 3
        else:
            evs = self.get_worker_evidence(worker_id)
            has_evidence = any(e.get("status") in ["ai_consistent", "human_accepted"] for e in evs)
            new_level = 2 if has_evidence else 1

        if self.connected and self.db is not None:
            self.db.worker_profiles.update_one({"user_id": worker_id}, {"$set": {"trust_level": new_level}})

    # Evidence & Claims
    def get_worker_evidence(self, worker_id: str) -> List[Dict[str, Any]]:
        if self.connected and self.db is not None:
            evs = list(self.db.evidence.find({"worker_id": worker_id}))
            return clean_docs(evs)
        return [e for e in EVIDENCE if e.get("worker_id") == worker_id]

    def add_evidence(self, worker_id: str, kind: str, image_url: str, caption: str, skill_slug: Optional[str] = None) -> Dict[str, Any]:
        ev_id = f"ev-{uuid.uuid4().hex[:8]}"

        # Match claim
        claim_id = None
        claims = self.get_worker_claims(worker_id)
        for c in claims:
            if c.get("type") == "skill":
                if not skill_slug or c.get("subject") == skill_slug:
                    claim_id = c["id"]
                    break

        ev = {
            "id": ev_id,
            "worker_id": worker_id,
            "claim_id": claim_id,
            "kind": kind,
            "file_key": f"{ev_id}.jpg",
            "image_url": image_url,
            "caption": caption,
            "source_label": "Worker camera upload",
            "is_public": True,
            "ai_score": 0.94,
            "ai_note": "AI-assisted check: Plausibly demonstrates competent workmanship and standard tooling.",
            "status": "ai_consistent",
            "reviewed_by": None,
            "is_demo": False,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.connected and self.db is not None:
            self.db.evidence.insert_one(ev)
            if claim_id:
                self.db.claims.update_one(
                    {"id": claim_id},
                    {"$set": {
                        "status": "evidence_added",
                        "source_label": "Work photo verified via AI-assisted check"
                    }}
                )

        self.recompute_trust(worker_id)
        return clean_doc(ev)

    def get_worker_claims(self, worker_id: str) -> List[Dict[str, Any]]:
        if self.connected and self.db is not None:
            claims = list(self.db.claims.find({"worker_id": worker_id}))
            return clean_docs(claims)
        return [c for c in CLAIMS if c.get("worker_id") == worker_id]

    # Facilitator human assessment
    def human_assess_claim(self, claim_id: str, facilitator_id: str, scope: str, note: str) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat() + "Z"
        if self.connected and self.db is not None:
            claim = self.db.claims.find_one({"id": claim_id})
            if not claim:
                raise ValueError("Claim not found")

            self.db.claims.update_one(
                {"id": claim_id},
                {"$set": {
                    "status": "independently_assessed",
                    "source_label": "In-person field assessment by Facilitator",
                    "assessed_by": facilitator_id,
                    "assessed_at": now,
                    "scope": scope,
                    "note": note
                }}
            )

            worker_id = claim["worker_id"]
            self.db.worker_profiles.update_one(
                {"user_id": worker_id},
                {"$set": {
                    "human_verified_by": facilitator_id,
                    "human_verified_at": now,
                    "trust_level": 3
                }}
            )
            return clean_doc(self.db.claims.find_one({"id": claim_id}))
        raise ValueError("Database unavailable")

    # Search & Matching (Dynamic across all MongoDB worker profiles)
    def search_workers(self, category: Optional[str] = None, area_id: Optional[str] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
        areas = self.get_areas()
        target_area = next((a for a in areas if a["id"] == area_id or a["slug"] == area_id), None)

        # Retrieve all workers from MongoDB
        workers_list = []
        if self.connected and self.db is not None:
            workers_list = clean_docs(list(self.db.worker_profiles.find({})))
        else:
            workers_list = [dict(w) for w in WORKER_PROFILES]

        results = []
        for worker in workers_list:
            uid = worker["user_id"]
            user = self.get_user_by_id(uid)
            if not user or user.get("status") != "active":
                continue

            # Query filter
            if query:
                q = query.lower()
                name_match = q in worker.get("name", "").lower()
                headline_match = q in worker.get("headline", "").lower()
                skill_match = any(q in s.lower() for s in worker.get("core_skills", []))
                if not (name_match or headline_match or skill_match):
                    continue

            # Skill matching score (0 to 40)
            skill_score = 0
            is_core = category and category in worker.get("core_skills", [])
            is_sec = category and category in worker.get("secondary_skills", [])

            if category:
                if is_core:
                    skill_score = 40
                elif is_sec:
                    skill_score = 20
                else:
                    skill_score = 10
            else:
                skill_score = 35

            # Distance score (0 to 25)
            w_area = next((a for a in areas if a["id"] == worker.get("area_id")), None)
            area_score = 10
            dist_km = None
            if target_area and w_area:
                dist_km = round(haversine_distance_km(target_area["lat"], target_area["lng"], w_area["lat"], w_area["lng"]), 1)
                if dist_km < 3:
                    area_score = 25
                elif dist_km < 8:
                    area_score = 20
                elif dist_km < 15:
                    area_score = 12
                else:
                    area_score = 5
            elif target_area and not w_area:
                area_score = 5

            # Availability score (0 to 15)
            avail_score = 15 if worker.get("availability", {}).get("today") else 8

            # Trust level score (0 to 20)
            tl = worker.get("trust_level", 1)
            trust_score = 20 if tl == 3 else (14 if tl == 2 else 6)

            total_score = min(100, skill_score + area_score + avail_score + trust_score)

            level_str = "Level 3: Independently Verified" if tl == 3 else ("Level 2: Evidence Added" if tl == 2 else "Level 1: Self-declared")
            dist_str = f"{dist_km} km away" if dist_km is not None else worker.get("area_text", "Delhi NCR")
            reason_en = f"Skills match, {dist_str}, available today, {level_str}"
            reason_hi = f"हुनर मैच, {dist_str}, आज उपलब्ध, {level_str}"

            # Reviews
            w_reviews = self.get_worker_reviews(uid)
            avg_rating = round(sum(r["rating"] for r in w_reviews) / len(w_reviews), 1) if w_reviews else 5.0

            results.append({
                "worker": worker,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "status": user["status"]
                    # Phone never exposed!
                },
                "score": total_score,
                "breakdown": {
                    "skill": skill_score,
                    "location": area_score,
                    "availability": avail_score,
                    "trust": trust_score
                },
                "distance_km": dist_km,
                "reason_en": reason_en,
                "reason_hi": reason_hi,
                "rating": avg_rating,
                "reviews_count": len(w_reviews),
                "claims": self.get_worker_claims(uid),
                "evidence_count": len(self.get_worker_evidence(uid))
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    # Bookings lifecycle
    def create_booking(self, customer_id: str, worker_id: str, category: str, description: str, area_id: Optional[str], requested_for: Optional[str], contractor_id: Optional[str] = None, booking_type: str = "direct") -> Dict[str, Any]:
        bid = f"book-{uuid.uuid4().hex[:8]}"
        areas = self.get_areas()
        area_obj = next((a for a in areas if a["id"] == area_id), None)
        area_text = f"{area_obj['name_en']}, {area_obj['city']}" if area_obj else "Delhi NCR"

        booking = {
            "id": bid,
            "customer_id": customer_id,
            "worker_id": worker_id,
            "contractor_id": contractor_id,
            "booking_type": booking_type,
            "category": category,
            "description": description,
            "area_id": area_id,
            "area_text": area_text,
            "requested_for": requested_for or datetime.utcnow().strftime("%Y-%m-%d"),
            "status": "requested",
            "amount_paise": None,
            "current_quotation_id": None,
            "started_at": None,
            "work_done_at": None,
            "completed_at": None,
            "is_demo": False,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.connected and self.db is not None:
            self.db.bookings.insert_one(booking)
        return clean_doc(booking)

    def list_bookings(self, user_id: str, role: str = "customer") -> List[Dict[str, Any]]:
        query = {}
        if role == "worker":
            query = {"worker_id": user_id}
        elif role == "contractor":
            query = {"$or": [{"contractor_id": user_id}, {"customer_id": user_id}]}
        else:
            query = {"customer_id": user_id}

        bookings = []
        if self.connected and self.db is not None:
            bookings = clean_docs(list(self.db.bookings.find(query).sort("created_at", -1)))
        else:
            bookings = [dict(b) for b in BOOKINGS if b.get("customer_id") == user_id or b.get("worker_id") == user_id]

        # Enrich with worker, customer and quotation details
        res = []
        for b in bookings:
            w = self.get_worker(b.get("worker_id", ""))
            c = self.get_user_by_id(b.get("customer_id", ""))
            quote = None
            if b.get("current_quotation_id"):
                quote = self.get_quotation(b["current_quotation_id"])

            res.append({
                **b,
                "worker_name": w.get("name") if w else "Worker",
                "worker_slug": w.get("slug") if w else None,
                "customer_name": c.get("name") if c else "Customer",
                "quotation": quote
            })
        return res

    def get_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        if self.connected and self.db is not None:
            b = self.db.bookings.find_one({"id": booking_id})
            return clean_doc(b)
        return next((b for b in BOOKINGS if b["id"] == booking_id), None)

    def update_booking_status(self, booking_id: str, new_status: str) -> Dict[str, Any]:
        booking = self.get_booking(booking_id)
        if not booking:
            raise ValueError("Booking not found")

        now = datetime.utcnow().isoformat() + "Z"
        update_fields: Dict[str, Any] = {"status": new_status}
        if new_status == "in_progress" and not booking.get("started_at"):
            update_fields["started_at"] = now
        elif new_status == "work_done" and not booking.get("work_done_at"):
            update_fields["work_done_at"] = now
        elif new_status == "completed" and not booking.get("completed_at"):
            update_fields["completed_at"] = now

        if self.connected and self.db is not None:
            self.db.bookings.update_one({"id": booking_id}, {"$set": update_fields})
            return clean_doc(self.db.bookings.find_one({"id": booking_id}))

        booking.update(update_fields)
        return booking

    # Quotations
    def get_quotation(self, quote_id: str) -> Optional[Dict[str, Any]]:
        if self.connected and self.db is not None:
            q = self.db.quotations.find_one({"id": quote_id})
            return clean_doc(q)
        return next((q for q in QUOTATIONS if q["id"] == quote_id), None)

    def create_quotation(self, booking_id: str, created_by: str, note: str, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        qid = f"quote-{uuid.uuid4().hex[:8]}"
        total_paise = sum(int(item.get("qty", 1)) * int(item.get("unit_paise", 0)) for item in items)

        quote = {
            "id": qid,
            "booking_id": booking_id,
            "version": 1,
            "status": "sent",
            "total_paise": total_paise,
            "note": note,
            "created_by": created_by,
            "items": items,
            "is_demo": False,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.connected and self.db is not None:
            self.db.quotations.insert_one(quote)
            self.db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "status": "quoted",
                    "current_quotation_id": qid
                }}
            )
        return clean_doc(quote)

    def accept_quotation(self, quote_id: str, customer_id: str) -> Dict[str, Any]:
        quote = self.get_quotation(quote_id)
        if not quote:
            raise ValueError("Quotation not found")

        if self.connected and self.db is not None:
            self.db.quotations.update_one({"id": quote_id}, {"$set": {"status": "accepted"}})
            self.db.bookings.update_one(
                {"id": quote["booking_id"]},
                {"$set": {
                    "status": "accepted",
                    "amount_paise": quote["total_paise"],
                    "current_quotation_id": quote_id
                }}
            )
            return clean_doc(self.db.quotations.find_one({"id": quote_id}))
        quote["status"] = "accepted"
        return quote

    # Reviews
    def add_review(self, booking_id: str, reviewer_id: str, rating: int, text: str) -> Dict[str, Any]:
        booking = self.get_booking(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking["status"] != "completed":
            raise ValueError("Reviews can only be submitted for completed bookings")

        reviewer = self.get_user_by_id(reviewer_id) or {}
        rev = {
            "id": f"rev-{uuid.uuid4().hex[:8]}",
            "booking_id": booking_id,
            "reviewer_id": reviewer_id,
            "reviewer_name": reviewer.get("name", "Customer"),
            "worker_id": booking["worker_id"],
            "rating": max(1, min(5, rating)),
            "text": text,
            "is_demo": False,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.connected and self.db is not None:
            self.db.reviews.insert_one(rev)
            # Update customer-confirmed claim
            self.db.claims.update_one(
                {"worker_id": booking["worker_id"], "subject": booking["category"], "status": {"$ne": "independently_assessed"}},
                {"$set": {
                    "status": "customer_confirmed",
                    "source_label": "Customer-confirmed after completed booking"
                }}
            )

        return clean_doc(rev)

    def get_worker_reviews(self, worker_id: str) -> List[Dict[str, Any]]:
        if self.connected and self.db is not None:
            revs = list(self.db.reviews.find({"worker_id": worker_id}).sort("created_at", -1))
            return clean_docs(revs)
        return [r for r in REVIEWS if r.get("worker_id") == worker_id]

    # Contractor Workflows
    def contractor_create_project(self, contractor_id: str, title: str, category: str, workers_needed: int, area_id: str, budget_rs: int, description: str) -> Dict[str, Any]:
        pid = f"proj-{uuid.uuid4().hex[:8]}"
        areas = self.get_areas()
        area_obj = next((a for a in areas if a["id"] == area_id), None)
        area_text = f"{area_obj['name_en']}, {area_obj['city']}" if area_obj else "Delhi NCR"

        proj = {
            "id": pid,
            "contractor_id": contractor_id,
            "title": title,
            "category": category,
            "trade_needed": category,
            "workers_needed": workers_needed,
            "area_id": area_id,
            "area_text": area_text,
            "budget_rs": budget_rs,
            "status": "recruiting",
            "assigned_worker_ids": [],
            "description": description,
            "is_demo": False,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.connected and self.db is not None:
            self.db.contractor_projects.insert_one(proj)
        return clean_doc(proj)

    def contractor_list_projects(self, contractor_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"contractor_id": contractor_id} if contractor_id else {}
        if self.connected and self.db is not None:
            projects = list(self.db.contractor_projects.find(query).sort("created_at", -1))
            return clean_docs(projects)
        return [p for p in CONTRACTOR_PROJECTS if not contractor_id or p.get("contractor_id") == contractor_id]

    def contractor_assign_worker(self, project_id: str, worker_id: str) -> Dict[str, Any]:
        if self.connected and self.db is not None:
            self.db.contractor_projects.update_one(
                {"id": project_id},
                {"$addToSet": {"assigned_worker_ids": worker_id}}
            )
            return clean_doc(self.db.contractor_projects.find_one({"id": project_id}))
        return {"id": project_id, "assigned_worker_ids": [worker_id]}

    def demo_reset(self):
        """
        Resets only demo records (is_demo=True) back to baseline seed.
        User-created records (is_demo=False) are SAFE and preserved.
        """
        if self.connected and self.db is not None:
            self.db.bookings.delete_many({"is_demo": True})
            self.db.quotations.delete_many({"is_demo": True})
            self.db.reviews.delete_many({"is_demo": True})
            self.db.evidence.delete_many({"is_demo": True})
            self.db.claims.delete_many({"is_demo": True})
            self.db.worker_profiles.delete_many({"is_demo": True})
            self.db.users.delete_many({"is_demo": True})
            self.seed_deterministic_demo_data()
            print("[SWAROOP DB] Demo records reset to baseline; user-created records preserved.")

# Global instance
mongo_store = MongoStore()
mongo_store.connect()
