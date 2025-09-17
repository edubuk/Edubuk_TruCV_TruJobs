def get_metadata_extraction_prompt(text):
    """Returns the prompt for extracting structured metadata from resume text"""
    return f"""Extract information from the resume text below following these EXTREMELY STRICT rules:

1. LITERAL EXTRACTION ONLY:
- Only extract information that is EXPLICITLY stated in the text
- Treat this as a text parsing task, not interpretation
- Every field must come verbatim from the text

2. ABSOLUTELY NO INFERENCE:
- Do NOT assume any skills from job descriptions
- Do NOT guess technologies from project names
- Do NOT add anything not explicitly listed

3. SKILLS MUST BE EXPLICIT:
- ONLY include terms that appear in a clear "Skills"/"Technical Skills" section
- Or when listed in format: "Skills: Java, Python" (extract ["Java", "Python"])
- NEVER include skills from:
    * Job descriptions ("Worked on Java projects" ≠ "Java" skill)
    * Project descriptions
    * Summary/objective statements

4. EMPTY ARRAYS WHEN MISSING:
- If section doesn't exist in text, return empty array
- Never invent entries to fill arrays

Required output format (JSON):
{{
"full_name": "(exact characters from name field)",
"email": "(exact email or null)",
"phone": "(exact phone or null)",
"location": "(exact location or null)",
"skills": [], // MUST BE EMPTY UNLESS EXPLICIT SKILLS SECTION
"work_experience": ["(exact bullet points)"],
"certifications": ["(exact certification text)"],
"projects": ["(exact project descriptions)"],
"education": ["(exact education entries)"],
"summary": "(exact summary text or null)"
}}

Resume text:
{text}

Return ONLY the raw JSON with EXACT text matches."""