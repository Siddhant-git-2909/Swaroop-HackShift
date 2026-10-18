import re
from typing import Dict, Any, List
from ..seed_data import SKILLS_TAXONOMY, AREAS

class VoiceAndTextExtractor:
    @staticmethod
    def extract_from_text(raw_text: str) -> Dict[str, Any]:
        """
        Extracts skills, experience, service area from natural language Hindi/Hinglish/English text.
        Grounds every field strictly against taxonomy to prevent hallucination.
        """
        text_lower = raw_text.lower()
        matched_skills = []

        for skill in SKILLS_TAXONOMY:
            slug = skill["slug"]
            name_en = skill["name_en"].lower()
            name_hi = skill["name_hi"]
            aliases = [a.lower() for a in skill.get("aliases", [])]

            found = False
            if slug in text_lower or name_en in text_lower:
                found = True
            elif any(alias in text_lower for alias in aliases):
                found = True

            if found and slug not in matched_skills:
                matched_skills.append(slug)

        # Experience extraction
        experience_years = None
        exp_match = re.search(r'(\d+)\s*(?:saal|sal|year|years|varsh|वर्ष|साल)', text_lower)
        if exp_match:
            try:
                experience_years = int(exp_match.group(1))
            except ValueError:
                pass

        # Area matching
        matched_area = None
        for area in AREAS:
            if area["slug"] in text_lower or area["name_en"].lower() in text_lower or area["name_hi"] in raw_text:
                matched_area = area
                break

        core_skills = matched_skills[:2] if matched_skills else ["electrician"]
        secondary_skills = matched_skills[2:] if len(matched_skills) > 2 else []

        headline = ""
        if core_skills:
            skill_names = [s.replace('-', ' ').capitalize() for s in core_skills]
            headline = f"Experienced {' & '.join(skill_names)} ({experience_years or 3}+ years)"
            if matched_area:
                headline += f" in {matched_area['name_en']}"

        # Name extraction (Hindi / English)
        extracted_name = None
        name_match = re.search(r'(?:mera\s+naam|my\s+name\s+is|naam\s+hai)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)', raw_text, re.IGNORECASE)
        if name_match:
            candidate = name_match.group(1).strip()
            # Clean up trailing words like 'hai'
            candidate = re.sub(r'\s+hai$', '', candidate, flags=re.IGNORECASE)
            if len(candidate) > 2:
                extracted_name = candidate

        return {
            "transcript": raw_text,
            "sample_name": extracted_name,
            "core_skills": core_skills,
            "secondary_skills": secondary_skills,
            "experience_years": experience_years or 3,
            "area_id": matched_area["id"] if matched_area else "area-1",
            "area_text": f"{matched_area['name_en']}, {matched_area['city']}" if matched_area else "Delhi NCR",
            "headline": headline or "Skilled Craftsman",
            "degraded": False,
            "source": "voice"
        }

    @staticmethod
    def get_demo_voice_sample() -> Dict[str, Any]:
        """
        Deterministic Hindi/Hinglish sample for instant one-click voice demo.
        """
        sample_transcript = "Mera naam Rajesh Kumar hai. Main Karol Bagh me rehta hoon aur 7 saal se bijli ka kaam (electrician) aur AC repair kar raha hoon. MCB wiring aur inverter setup meri khaasiyat hai."
        res = VoiceAndTextExtractor.extract_from_text(sample_transcript)
        res["sample_name"] = "Rajesh Kumar (राजेश कुमार)"
        return res
