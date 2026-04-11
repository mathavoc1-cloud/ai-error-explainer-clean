import json
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY not found. Check your .env file.")

client = OpenAI(api_key=api_key)


def explain_error_with_ai(error_text: str) -> dict:
    system_prompt = """
You are an expert technical error explainer.

Your job is to explain coding and cloud errors in beginner-friendly language.

Always return valid JSON with exactly this structure:
{
  "meaning": "string",
  "likely_causes": ["string", "string", "string"],
  "how_to_fix": ["string", "string", "string"],
  "confidence": "high | medium | low"
}

Rules:
- Be clear and practical
- Keep explanations concise
- Focus on likely real-world causes
- Do not include markdown
- Do not include any text outside the JSON
- If the error is unclear, still make a best effort and lower confidence
"""

    user_prompt = f"""
Explain this technical error:

{error_text}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )

    content = response.choices[0].message.content.strip()

    try:
        parsed = json.loads(content)
        return parsed
    except json.JSONDecodeError:
        return {
            "meaning": "The AI returned an unexpected response format.",
            "likely_causes": [
                "The model did not return valid JSON",
                "The prompt needs stricter formatting instructions",
                "The response may have included extra text"
            ],
            "how_to_fix": [
                "Try the request again",
                "Check the backend logs",
                "Tighten the prompt or use structured output later"
            ],
            "confidence": "low"
        }


@app.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()

    if not data or "error" not in data:
        return jsonify({"error": "Missing 'error' field in request body"}), 400

    error_text = data["error"].strip()

    if not error_text:
        return jsonify({"error": "Error text cannot be empty"}), 400

    try:
        result = explain_error_with_ai(error_text)
        return jsonify(result)
    except Exception as e:
     print("FULL BACKEND ERROR:", str(e))
     return jsonify({
        "error": "Failed to explain error with AI",
        "details": str(e)
    }), 500


if __name__ == "__main__":
    app.run(debug=True)