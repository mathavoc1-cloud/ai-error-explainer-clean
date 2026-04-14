import json
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def lambda_handler(event, context):
    try:
        body = json.loads(event["body"])
        error_text = body.get("error", "")

        if not error_text:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "No error provided"})
            }

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "Explain errors simply."},
                {"role": "user", "content": error_text}
            ]
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "result": response.choices[0].message.content
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }