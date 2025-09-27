def get_metadata_extraction_prompt(text):
    """Returns the prompt for extracting structured metadata from resume text"""
    return f"""
You are an expert resume parser. Extract a clean, structured JSON from the resume text below.

IMPORTANT: The text may be corrupted PDF content with technical artifacts. Look for actual resume content like names, emails, skills, and experience.

Rules for extraction (balanced and practical):
1) Grounded extraction (no hallucination)
   - Use only information present in the resume text.
   - IGNORE PDF technical content like "obj", "endobj", "Type", "ExtGState", etc.
   - Look for real human names, email addresses, company names, and skills.
   - Do NOT invent degrees, employers, or dates that are not present.

2) Name extraction (HIGHEST PRIORITY)
   - The candidate name is the most important field to extract correctly
   - Look for patterns like "mailto:name@email.com" to find names
   - Look for LinkedIn URLs that contain names
   - Extract full names from any clear text sections
   - Look for name patterns at the beginning of the resume
   - Look for ALL CAPS names that might be headers
   - Look for text following "Name:" or "RESUME" or "CV" labels
   - If you find multiple potential names, choose the most complete one
   - NEVER return "Unknown" as the name unless absolutely no name is found

3) Skills extraction (flexible and comprehensive)
   - Include skills listed in a dedicated Skills/Technical Skills section if present.
   - ALSO include skills clearly mentioned in experience, projects, summary, or achievements.
   - Look for technology names, programming languages, frameworks, tools.
   - Normalize skill tokens (trim, deduplicate, keep concise terms like "Python", "React", "AWS").

4) Work experience structure
   - Extract as an array of objects with fields: job_title, company, start_date, end_date, description.
   - Dates can be any textual form present (e.g., "Jan 2021 - Present"). If missing, use null.

5) Certifications, projects, education
   - Return arrays. Each item may be a string or an object with name/title and optional details.
   - Do not fabricate items; include only what the text supports.

6) Contact & personal info
   - Extract full_name, email, phone, location if present; otherwise use null.

7) Output quality
   - Keep arrays concise and deduplicated.
   - Use proper JSON only. No markdown, no comments, no extra text.
   - Double-check your JSON is valid before returning it.
   - Use double quotes for all keys and string values.
   - Do not use single quotes, unquoted keys, or trailing commas.

Required JSON schema:
{{
  "full_name": string|null,
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "skills": string[],
  "work_experience": [
    {{
      "job_title": string|null,
      "company": string|null,
      "start_date": string|null,
      "end_date": string|null,
      "description": string|null
    }}
  ],
  "certifications": [string|object],
  "projects": [string|object],
  "education": [string|object],
  "summary": string|null
}}

Resume text:
{text}

Return ONLY the JSON object.
"""