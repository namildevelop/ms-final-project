import json
from typing import Dict, Any
from openai import AzureOpenAI
from app.core.config import settings

def generate_trip_plan_with_gpt(trip_details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a trip plan using Azure OpenAI GPT model.
    """
    
    # Initialize Azure OpenAI client
    client = AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version="2024-02-01", # Using a stable API version
    )

    # Construct the prompt based on trip_details
    prompt_content = f"""
당신은 상세한 여행 계획을 생성하는 유용한 AI 비서입니다.
다음 정보를 바탕으로 포괄적인 여행 일정을 생성해 주세요:

여행 제목: {trip_details.get('title', '미정')}
기간: {trip_details.get('start_date')}부터 {trip_details.get('end_date')}까지
목적지: {trip_details.get('destination_city', '')}, {trip_details.get('destination_country', '')}
교통 방식: {trip_details.get('transport_method', '미정')}
숙박: {trip_details.get('accommodation', '미정')}
관심사: {', '.join(trip_details.get('interests', []))}
최신 트렌드 반영 여부: {'예' if trip_details.get('trend') else '아니오'}

각 날짜별 활동, 방문할 장소, 예상 시간 등을 포함한 일정을 상세하게 제공해 주세요. 응답은 JSON 형식으로만 제공해야 합니다. JSON 형식은 다음과 같습니다:
{{
  "trip_title": "[여행 제목]",
  "destination": "[목적지]",
  "duration": "[시작일] - [종료일]",
  "itinerary": [
    {{
      "day": 1,
      "date": "[날짜]",
      "activities": [
        {{"time": "[시간]", "description": "[활동 내용]", "location": "[장소]"}}
      ]
    }}
  ],
  "notes": "[추가 참고 사항]"
}}
"""

    messages = [
        {
            "role": "system",
            "content": "You are an AI assistant that helps people create detailed travel itineraries in JSON format."
        },
        {
            "role": "user",
            "content": prompt_content
        }
    ]

    try:
        completion = client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=messages,
            max_tokens=2000, # A more reasonable max_tokens for a plan
            temperature=0.7,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0,
            stop=None,
            stream=False
        )
        
        gpt_response_content = completion.choices[0].message.content
        
        # Attempt to parse the JSON response
        try:
            parsed_plan = json.loads(gpt_response_content)
            return parsed_plan
        except json.JSONDecodeError:
            print(f"Warning: GPT response was not valid JSON: {gpt_response_content}")
            # Fallback to a simple structure if JSON parsing fails
            return {"error": "Failed to parse GPT response as JSON", "raw_response": gpt_response_content}

    except Exception as e:
        print(f"Error calling Azure OpenAI: {e}")
        return {"error": f"Failed to generate plan: {str(e)}"}
