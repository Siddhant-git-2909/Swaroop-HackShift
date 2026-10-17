# Demo seed data with realistic Delhi NCR areas, skills taxonomy, workers, claims, evidence, bookings

AREAS = [
    {"id": "area-1", "slug": "karol-bagh", "name_en": "Karol Bagh", "name_hi": "करोल बाग", "city": "Delhi", "lat": 28.6514, "lng": 77.1907},
    {"id": "area-2", "slug": "lajpat-nagar", "name_en": "Lajpat Nagar", "name_hi": "लाजपत नगर", "city": "Delhi", "lat": 28.5700, "lng": 77.2400},
    {"id": "area-3", "slug": "connaught-place", "name_en": "Connaught Place", "name_hi": "कनॉट प्लेस", "city": "Delhi", "lat": 28.6315, "lng": 77.2167},
    {"id": "area-4", "slug": "rohini-sec-7", "name_en": "Rohini Sector 7", "name_hi": "रोहिणी सेक्टर 7", "city": "Delhi", "lat": 28.7100, "lng": 77.1200},
    {"id": "area-5", "slug": "dwarka-sec-10", "name_en": "Dwarka Sector 10", "name_hi": "द्वारका सेक्टर 10", "city": "Delhi", "lat": 28.5800, "lng": 77.0600},
    {"id": "area-6", "slug": "noida-sec-18", "name_en": "Noida Sector 18", "name_hi": "नोएडा सेक्टर 18", "city": "Noida", "lat": 28.5708, "lng": 77.3260},
    {"id": "area-7", "slug": "cyber-city-gurgaon", "name_en": "Cyber City Gurgaon", "name_hi": "साइबर सिटी गुड़गांव", "city": "Gurgaon", "lat": 28.4950, "lng": 77.0895},
    {"id": "area-8", "slug": "indirapuram", "name_en": "Indirapuram", "name_hi": "इंदिरापुरम", "city": "Ghaziabad", "lat": 28.6415, "lng": 77.3714},
    {"id": "area-9", "slug": "saket", "name_en": "Saket", "name_hi": "साकेत", "city": "Delhi", "lat": 28.5244, "lng": 77.2167},
    {"id": "area-10", "slug": "mayur-vihar", "name_en": "Mayur Vihar Phase 1", "name_hi": "मयूर विहार", "city": "Delhi", "lat": 28.6070, "lng": 77.2980},
    {"id": "area-11", "slug": "janakpuri", "name_en": "Janakpuri", "name_hi": "जनकपुरी", "city": "Delhi", "lat": 28.6219, "lng": 77.0878},
    {"id": "area-12", "slug": "hauz-khas", "name_en": "Hauz Khas", "name_hi": "हौज़ खास", "city": "Delhi", "lat": 28.5494, "lng": 77.2001},
]

SKILLS_TAXONOMY = [
    {
        "id": "skill-1",
        "slug": "electrician",
        "name_en": "Electrician",
        "name_hi": "इलेक्ट्रीशियन / बिजली मिस्त्री",
        "aliases": ["bijli wala", "electrician", "bijli mistri", "wiring", "mcb", "fuse", "switch board", "fan repair"]
    },
    {
        "id": "skill-2",
        "slug": "plumber",
        "name_en": "Plumber",
        "name_hi": "प्लंबर / नल मिस्त्री",
        "aliases": ["nal wala", "plumber", "pipe fitting", "leakage", "tap repair", "tank cleaning", "sanitary"]
    },
    {
        "id": "skill-3",
        "slug": "ac-technician",
        "name_en": "AC Repair & Service",
        "name_hi": "एसी रिपेयर और सर्विस",
        "aliases": ["ac wala", "ac mechanic", "gas charging", "split ac", "window ac", "cooling issue"]
    },
    {
        "id": "skill-4",
        "slug": "painter",
        "name_en": "Painter & Whitewash",
        "name_hi": "पेंटर / रंगाई-पुताई",
        "aliases": ["rangai wala", "putty", "distemper", "texture paint", "wall paint", "painter"]
    },
    {
        "id": "skill-5",
        "slug": "carpenter",
        "name_en": "Carpenter",
        "name_hi": "बढ़ई / कारपेंटर",
        "aliases": ["badhai", "wood work", "furniture repair", "door lock", "cabinet", "plywood"]
    },
    {
        "id": "skill-6",
        "slug": "mason",
        "name_en": "Mason / Tile Worker",
        "name_hi": "राजमिस्त्री / टाइल कारीगर",
        "aliases": ["rajmistri", "tile fitting", "plaster", "chhat repair", "flooring", "cement work"]
    },
    {
        "id": "skill-7",
        "slug": "tailor",
        "name_en": "Tailor",
        "name_hi": "दर्जी / सिलाई कारीगर",
        "aliases": ["darzi", "silai", "blouse", "suit alteration", "curtains", "boutique"]
    },
    {
        "id": "skill-8",
        "slug": "appliance-repair",
        "name_en": "Home Appliance Repair",
        "name_hi": "घरेलू उपकरण मरम्मत",
        "aliases": ["fridge repair", "washing machine", "microwave repair", "geyser repair", "ro service"]
    }
]

USERS = [
    {
        "id": "user-w1",
        "phone": "9000000001",
        "role": "worker",
        "name": "Ramesh Kumar (रमेश कुमार)",
        "language": "hi",
        "status": "active"
    },
    {
        "id": "user-w2",
        "phone": "9000000002",
        "role": "worker",
        "name": "Suresh Sharma (सुरेश शर्मा)",
        "language": "hi",
        "status": "active"
    },
    {
        "id": "user-w3",
        "phone": "9000000003",
        "role": "worker",
        "name": "Mohammad Arif (मोहम्मद आरिफ़)",
        "language": "hi",
        "status": "active"
    },
    {
        "id": "user-w4",
        "phone": "9000000004",
        "role": "worker",
        "name": "Rajesh Verma (राजेश वर्मा)",
        "language": "hi",
        "status": "active"
    },
    {
        "id": "user-c1",
        "phone": "9100000001",
        "role": "customer",
        "name": "Priya Sharma (प्रिया शर्मा)",
        "language": "en",
        "status": "active"
    },
    {
        "id": "user-c2",
        "phone": "9100000002",
        "role": "customer",
        "name": "Vikram Malhotra (विक्रम मल्होत्रा)",
        "language": "en",
        "status": "active"
    },
    {
        "id": "user-f1",
        "phone": "9200000001",
        "role": "facilitator",
        "name": "Sunita Devi (सुनीता देवी - सेवा केंद्र)",
        "language": "hi",
        "status": "active"
    },
    {
        "id": "user-a1",
        "phone": "9300000001",
        "role": "admin",
        "name": "Platform Admin (Swaroop Ops)",
        "language": "en",
        "status": "active"
    },
    {
        "id": "user-ct1",
        "phone": "9400000001",
        "role": "contractor",
        "name": "Hardeep Singh (हरदीप सिंह - कॉन्ट्रैक्टर)",
        "language": "hi",
        "status": "active"
    }
]

WORKER_PROFILES = [
    {
        "user_id": "user-w1",
        "slug": "ramesh-electrician",
        "name": "Ramesh Kumar",
        "headline": "House Wiring, MCB Tripping & Inverter Specialist with 8 Years Experience",
        "core_skills": ["electrician"],
        "secondary_skills": ["appliance-repair"],
        "experience_years": 8,
        "area_id": "area-1",
        "area_text": "Karol Bagh & Central Delhi",
        "availability": {"days": ["mon", "tue", "wed", "thu", "fri", "sat"], "from": "09:00", "to": "19:00", "today": True},
        "source": "voice",
        "trust_level": 2, # L2 Evidence Added
        "identity_check_status": "simulated_check",
        "human_verified_by": None,
        "human_verified_at": None,
        "public_fields": {"experience": True, "area": True, "reviews": True, "skills": True}
    },
    {
        "user_id": "user-w2",
        "slug": "suresh-plumber",
        "name": "Suresh Sharma",
        "headline": "CPVC Pipe Fitting, Tap Leaks & Sanitary Ware Repair",
        "core_skills": ["plumber"],
        "secondary_skills": [],
        "experience_years": 4,
        "area_id": "area-2",
        "area_text": "Lajpat Nagar & South Delhi",
        "availability": {"days": ["mon", "wed", "thu", "fri", "sun"], "from": "08:30", "to": "18:00", "today": True},
        "source": "text",
        "trust_level": 1, # L1 Self Declared
        "identity_check_status": "none",
        "human_verified_by": None,
        "human_verified_at": None,
        "public_fields": {"experience": True, "area": True, "reviews": True, "skills": True}
    },
    {
        "user_id": "user-w3",
        "slug": "arif-master-electrician",
        "name": "Mohammad Arif",
        "headline": "Certified Industrial & Home Electrician, 3-Phase DB & Sub-panel Expert",
        "core_skills": ["electrician", "ac-technician"],
        "secondary_skills": ["appliance-repair"],
        "experience_years": 12,
        "area_id": "area-6",
        "area_text": "Noida Sector 18 & Greater Noida",
        "availability": {"days": ["mon", "tue", "wed", "thu", "fri", "sat"], "from": "09:00", "to": "20:00", "today": True},
        "source": "facilitator",
        "trust_level": 3, # L3 Independently Verified
        "identity_check_status": "simulated_check",
        "human_verified_by": "user-f1",
        "human_verified_at": "2025-01-15T11:30:00Z",
        "public_fields": {"experience": True, "area": True, "reviews": True, "skills": True}
    },
    {
        "user_id": "user-w4",
        "slug": "rajesh-ac-expert",
        "name": "Rajesh Verma",
        "headline": "Inverter AC PCB Diagnosis, Gas Top-up & Jet Pump Deep Cleaning",
        "core_skills": ["ac-technician"],
        "secondary_skills": ["electrician"],
        "experience_years": 7,
        "area_id": "area-7",
        "area_text": "Cyber City & DLF Gurgaon",
        "availability": {"days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "from": "08:00", "to": "20:00", "today": True},
        "source": "voice",
        "trust_level": 2, # L2 Evidence Added
        "identity_check_status": "simulated_check",
        "human_verified_by": None,
        "human_verified_at": None,
        "public_fields": {"experience": True, "area": True, "reviews": True, "skills": True}
    }
]

CLAIMS = [
    {
        "id": "claim-1",
        "worker_id": "user-w1",
        "type": "skill",
        "subject": "electrician",
        "status": "evidence_added",
        "source_label": "Work photo verified via AI-assisted check",
        "scope": "Domestic Wiring & Distribution Board setup",
        "assessed_by": None,
        "assessed_at": None,
        "note": "2 evidence photos attached and checked"
    },
    {
        "id": "claim-2",
        "worker_id": "user-w1",
        "type": "identity",
        "subject": "identity_badge",
        "status": "simulated_check",
        "source_label": "Simulated Aadhaar/Phone verification",
        "scope": "Phone match confirmation",
        "assessed_by": None,
        "assessed_at": None,
        "note": "SIMULATED: No real Aadhaar collected"
    },
    {
        "id": "claim-3",
        "worker_id": "user-w2",
        "type": "skill",
        "subject": "plumber",
        "status": "self_declared",
        "source_label": "Self-declared during onboarding",
        "scope": "Tap & pipe repair",
        "assessed_by": None,
        "assessed_at": None,
        "note": "No evidence uploaded yet"
    },
    {
        "id": "claim-4",
        "worker_id": "user-w3",
        "type": "skill",
        "subject": "electrician",
        "status": "independently_assessed",
        "source_label": "In-person field assessment by Facilitator Sunita Devi",
        "scope": "Heavy duty commercial & domestic electrical testing",
        "assessed_by": "user-f1",
        "assessed_at": "2025-01-15T11:30:00Z",
        "note": "In-person skill check at Karol Bagh center. Observed safe wiring practices, live circuit multimeter diagnosis, and earthing installation."
    }
]

EVIDENCE = [
    {
        "id": "ev-1",
        "worker_id": "user-w1",
        "claim_id": "claim-1",
        "kind": "photo",
        "file_key": "sample_mcb_panel.jpg",
        "image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=60",
        "caption": "Complete rewiring of 3-bedroom flat distribution box with 63A isolator and RCBO",
        "source_label": "Worker camera upload",
        "is_public": True,
        "ai_score": 0.94,
        "ai_note": "AI-assisted check: Highly consistent with residential electrical DB panel installation.",
        "status": "ai_consistent",
        "reviewed_by": None,
        "created_at": "2025-01-10T14:20:00Z"
    },
    {
        "id": "ev-2",
        "worker_id": "user-w1",
        "claim_id": "claim-1",
        "kind": "photo",
        "file_key": "sample_inverter_setup.jpg",
        "image_url": "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60",
        "caption": "Tubular battery dual-inverter wiring with bypass rotary switch",
        "source_label": "Worker camera upload",
        "is_public": True,
        "ai_score": 0.91,
        "ai_note": "AI-assisted check: Clear battery terminal and inverter cabling layout.",
        "status": "ai_consistent",
        "reviewed_by": None,
        "created_at": "2025-01-12T10:15:00Z"
    },
    {
        "id": "ev-3",
        "worker_id": "user-w3",
        "claim_id": "claim-4",
        "kind": "photo",
        "file_key": "sample_industrial_panel.jpg",
        "image_url": "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&auto=format&fit=crop&q=60",
        "caption": "Three phase motor starter and relay panel installation for garment factory",
        "source_label": "Facilitator in-person assessment photo",
        "is_public": True,
        "ai_score": 0.98,
        "ai_note": "AI-assisted check: Verified industrial relay and neat cable trunking.",
        "status": "human_accepted",
        "reviewed_by": "user-f1",
        "created_at": "2025-01-15T11:25:00Z"
    }
]

BOOKINGS = [
    {
        "id": "book-1",
        "customer_id": "user-c1",
        "worker_id": "user-w1",
        "category": "electrician",
        "description": "Main circuit breaker trips whenever AC and geyser are on together. Need urgent inspection.",
        "area_id": "area-1",
        "area_text": "Karol Bagh, Delhi",
        "requested_for": "2025-02-10",
        "status": "completed",
        "amount_paise": 65000, # Rs. 650
        "current_quotation_id": "quote-1",
        "started_at": "2025-02-10T11:00:00Z",
        "work_done_at": "2025-02-10T12:30:00Z",
        "completed_at": "2025-02-10T12:45:00Z",
        "created_at": "2025-02-09T18:00:00Z"
    },
    {
        "id": "book-2",
        "customer_id": "user-c1",
        "worker_id": "user-w1",
        "category": "electrician",
        "description": "Installation of 3 ceiling fans and 2 smart touch switches in new study room.",
        "area_id": "area-3",
        "area_text": "Connaught Place, Delhi",
        "requested_for": "2025-02-15",
        "status": "in_progress",
        "amount_paise": 85000, # Rs. 850
        "current_quotation_id": "quote-2",
        "started_at": "2025-02-15T10:00:00Z",
        "work_done_at": None,
        "completed_at": None,
        "created_at": "2025-02-14T09:30:00Z"
    },
    {
        "id": "book-3",
        "customer_id": "user-c2",
        "worker_id": "user-w2",
        "category": "plumber",
        "description": "Kitchen sink pipe broken, water leaking onto cabinet floor.",
        "area_id": "area-2",
        "area_text": "Lajpat Nagar, Delhi",
        "requested_for": "2025-02-16",
        "status": "requested",
        "amount_paise": None,
        "current_quotation_id": None,
        "started_at": None,
        "work_done_at": None,
        "completed_at": None,
        "created_at": "2025-02-16T08:15:00Z"
    }
]

QUOTATIONS = [
    {
        "id": "quote-1",
        "booking_id": "book-1",
        "version": 1,
        "status": "accepted",
        "total_paise": 65000,
        "note": "Diagnosis fee + replaced overloaded 32A MCB with Havells C40 breaker + neutral tightening",
        "created_by": "user-w1",
        "created_at": "2025-02-10T11:15:00Z",
        "items": [
            {"label": "Visiting & Electrical Fault Diagnosis", "qty": 1, "unit_paise": 25000},
            {"label": "Havells C40 Single Pole MCB", "qty": 1, "unit_paise": 25000},
            {"label": "Labor for DB board re-termination", "qty": 1, "unit_paise": 15000}
        ]
    },
    {
        "id": "quote-2",
        "booking_id": "book-2",
        "version": 1,
        "status": "accepted",
        "total_paise": 85000,
        "note": "Ceiling fan rod assembly & mounting (3 nos) + Smart switch neutral wire pull",
        "created_by": "user-w1",
        "created_at": "2025-02-14T11:00:00Z",
        "items": [
            {"label": "Ceiling Fan Assembly & Installation", "qty": 3, "unit_paise": 20000},
            {"label": "Smart Switch Wiring & Neutral Loop", "qty": 2, "unit_paise": 12500}
        ]
    }
]

REVIEWS = [
    {
        "id": "rev-1",
        "booking_id": "book-1",
        "reviewer_id": "user-c1",
        "reviewer_name": "Priya Sharma",
        "worker_id": "user-w1",
        "rating": 5,
        "text": "Ramesh ji arrived within 30 minutes! He quickly pinpointed that our MCB was undersized for both AC and geyser. Replaced it cleanly and gave an itemised bill before taking payment. True professional!",
        "created_at": "2025-02-10T13:00:00Z"
    }
]

CONTRACTOR_PROJECTS = [
    {
        "id": "proj-1",
        "contractor_id": "user-ct1",
        "title": "Commercial Showroom 3-Phase DB & Lighting Panel Setup",
        "category": "electrician",
        "trade_needed": "electrician",
        "workers_needed": 2,
        "area_id": "area-1",
        "area_text": "Karol Bagh Commercial Market",
        "budget_rs": 45000,
        "status": "in_progress",
        "assigned_worker_ids": ["user-w1", "user-w3"],
        "description": "Commercial multi-tier distribution setup for retail electronics showroom.",
        "created_at": "2025-02-12T10:00:00Z"
    },
    {
        "id": "proj-2",
        "contractor_id": "user-ct1",
        "title": "Apartment Complex Overhead Tank & Booster Pump Overhaul",
        "category": "plumber",
        "trade_needed": "plumber",
        "workers_needed": 3,
        "area_id": "area-2",
        "area_text": "Lajpat Nagar Block C",
        "budget_rs": 32000,
        "status": "recruiting",
        "assigned_worker_ids": ["user-w2"],
        "description": "Replacement of 4-inch CPVC risers and dual booster pump vibration dampening.",
        "created_at": "2025-02-14T14:30:00Z"
    }
]
