import json
from typing import Dict, Any, List
from openai import AzureOpenAI
from app.core.config import settings

def generate_trip_plan_with_gpt(trip_details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a trip plan using Azure OpenAI GPT model, formatted for the new itinerary item structure.
    """
    client = AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version="2024-02-01",
    )

    prompt_content = f"""
당신은 상세한 여행 계획을 생성하는 유용한 AI 비서입니다.
다음 정보를 바탕으로 포괄적인 여행 일정을 생성해 주세요. 응답은 반드시 JSON 형식으로만 제공해야 합니다.

**여행 정보:**
- 여행 제목: {trip_details.get('title', '미정')}
- 기간: {trip_details.get('start_date')}부터 {trip_details.get('end_date')}까지
- 목적지: {trip_details.get('destination_city', '')}, {trip_details.get('destination_country', '')}
- 교통 방식: {trip_details.get('transport_method', '미정')}
- 숙박: {trip_details.get('accommodation', '미정')}
- 관심사: {', '.join(trip_details.get('interests', []))}
- 최신 트렌드 반영 여부: {'예' if trip_details.get('trend') else '아니오'}

**필수 JSON 출력 형식:**
응답은 `itinerary`라는 단일 키를 가진 JSON 객체여야 합니다. `itinerary`의 값은 각 일정을 나타내는 객체들의 배열이어야 합니다.
각 일정 객체는 다음 키를 포함해야 합니다:
- `day`: (Integer) 몇일차인지 나타내는 숫자.
- `order_in_day`: (Integer) 그날의 일정 순서 (1부터 시작).
- `place_name`: (String) 장소의 이름.
- `description`: (String) 일정에 대한 상세 설명.
- `start_time`: (String) 일정이 시작되는 시간 (HH:MM 형식). 정보가 없으면 null.
- `end_time`: (String) 일정이 끝나는 시간 (HH:MM 형식). 정보가 없으면 null.
- `address`: (String) 장소의 정확하고 완전한 주소. 정보가 없으면 null.

**JSON 예시:**
```json
{{
  "itinerary": [
    {{
      "day": 1,
      "order_in_day": 1,
      "place_name": "에펠탑",
      "description": "파리의 상징인 에펠탑을 방문하여 도시의 전경을 감상합니다.",
      "start_time": "09:00",
      "end_time": "11:00",
      "address": "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France"
    }},
    {{
      "day": 1,
      "order_in_day": 2,
      "place_name": "루브르 박물관",
      "description": "모나리자를 비롯한 세계적인 예술 작품들을 감상합니다.",
      "start_time": "12:00",
      "end_time": "15:00",
      "address": "Rue de Rivoli, 75001 Paris, France"
    }}
  ]
}}
```
"""

    messages = [
        {
            "role": "system",
            "content": "You are an AI assistant that helps people create detailed travel itineraries. You must respond only with JSON in the specified format."
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
            max_tokens=3000, # Increased for potentially longer structured plans
            temperature=0.7,
            top_p=0.95,
            response_format={"type": "json_object"} # Enforce JSON output
        )
        
        gpt_response_content = completion.choices[0].message.content
        parsed_plan = json.loads(gpt_response_content)
        return parsed_plan

    except Exception as e:
        print(f"Error calling Azure OpenAI or parsing response: {e}")
        return {"error": f"Failed to generate plan: {str(e)}", "itinerary": []}

def get_gpt_chat_response(trip_details: Dict[str, Any], current_plan: List[Dict[str, Any]], user_prompt: str) -> Dict[str, Any]:
    """
    Generates a chat response or a modified trip plan using Azure OpenAI GPT model.
    """
    client = AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version="2024-02-01",
    )

    prompt_content = f"""
당신은 여행 계획을 돕는 AI 비서입니다. 현재 여행 계획과 사용자의 요청을 바탕으로 질문에 답변하거나 계획을 수정합니다.
응답은 항상 JSON 형식으로 제공해야 합니다.

**현재 여행 정보:**
- 여행 제목: {trip_details.get('title', '미정')}
- 기간: {trip_details.get('start_date')}부터 {trip_details.get('end_date')}까지
- 목적지: {trip_details.get('destination_city', '')}, {trip_details.get('destination_country', '')}

**현재 여행 계획 (Itinerary):**
```json
{json.dumps(current_plan, indent=2, ensure_ascii=False)}
```

**사용자 요청:**
"{user_prompt}"

**지시사항:**
1.  사용자의 요청이 단순히 정보를 묻는 질문이라면, `notes` 필드에 답변을 담아 응답하세요. `itinerary` 필드는 **기존 계획을 그대로** 유지해야 합니다.
2.  사용자의 요청이 계획 수정을 요구하는 것이라면, `itinerary` 필드를 수정하여 **완전히 새로운 전체 계획**을 반영하고, `notes` 필드에 변경 사항에 대한 요약을 담아 응답하세요.
3.  `itinerary` 배열의 각 객체는 `day`, `order_in_day`, `place_name`, `description`, `start_time`, `end_time` 키를 포함해야 합니다. **또한, 각 장소에 대해 정확하고 완전한 주소를 `address` 필드에 포함해야 합니다.** 정보가 없으면 `null`로 설정하세요.

**JSON 응답 예시:**
```json
{{
  "itinerary": [
    {{
      "day": 1,
      "order_in_day": 1,
      "place_name": "에펠탑",
      "description": "파리의 상징인 에펠탑을 방문하여 도시의 전경을 감상합니다.",
      "start_time": "09:00",
      "end_time": "11:00",
      "address": "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France"
    }},
    {{
      "day": 1,
      "order_in_day": 2,
      "place_name": "루브르 박물관",
      "description": "모나리자를 비롯한 세계적인 예술 작품들을 감상합니다.",
      "start_time": "12:00",
      "end_time": "15:00",
      "address": "Rue de Rivoli, 75001 Paris, France"
    }}
  ], // 수정되었거나 기존의 전체 일정
  "notes": "[사용자 요청에 대한 답변 또는 계획 수정 요약]"
}}
```
"""

    messages = [
        {
            "role": "system",
            "content": "You are an AI assistant that helps with travel plans, answering questions and modifying existing itineraries based on user requests. You always respond in JSON format. Ensure all itinerary items include a precise and complete address in the 'address' field."
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
            max_tokens=3000,
            temperature=0.7,
            top_p=0.95,
            response_format={"type": "json_object"}
        )
        
        gpt_response_content = completion.choices[0].message.content
        parsed_response = json.loads(gpt_response_content)
        return parsed_response

    except Exception as e:
        print(f"Error calling Azure OpenAI for chat or parsing response: {e}")
        return {"error": f"Failed to get chat response: {str(e)}", "notes": "죄송합니다, GPT와 통신하는 중 오류가 발생했습니다.", "itinerary": current_plan}