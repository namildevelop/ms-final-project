import json
import re
from typing import Dict, Any, List
from openai import AzureOpenAI
from app.core.config import settings


search_index = settings.AZURE_SEARCH_INDEX
semantic_config = settings.AZURE_SEMANTIC_CONFIG
search_endpoint = settings.AZURE_SEARCH_ENDPOINT
search_ai_key = settings.AZURE_SEARCH_AI_KEY


def clean_json_response(response_text: str) -> str:
    # 디버그 출력으로 문제 추적
    print(f"[DEBUG] 원본 응답 시작 100자: {repr(response_text[:100])}")
    
    cleaned = response_text.strip()
    
    # `````` 제거
    if cleaned.startswith('```'):
        cleaned = cleaned[7:]
    elif cleaned.startswith('```'):
        cleaned = cleaned[3:]
    
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip()
    
    print(f"[DEBUG] 정리된 응답 시작 100자: {repr(cleaned[:100])}")
    return cleaned



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
당신은 상세한 여행 계획과 그에 따른 준비물 리스트를 생성하는 유용한 AI 비서입니다.
다음 정보를 바탕으로 신뢰할 수 있는 RAG 데이터와 여행 DB를 활용해 시간대별 최적화된 포괄적인 여행 일정과 준비물 리스트를 생성해 주세요. 
이동 동선은 효율적이며, 이동 시간과 거리도 최소화합니다.
각 장소의 운영시간, 입장료, 그리고 1박 2일 이상의 일정에서는 숙소 체크인 시간(오후 3~4시 이후) 조건도 반드시 반영하세요.
일정 내 여유시간과 식사 시간도 포함하세요.
추천된 일정의 요약과 함께, 장소별로 방문 이유 및 추가 선택지(대체 맛집 혹은 활동)를 함께 기록하세요.
만약 RAG 데이터 내 정보가 부족할 경우, 모델 자체 판단으로 적절한 일정을 생성하되, 사용자 요청과 최근 트렌드를 반영하세요.
응답은 반드시 순수한 JSON 형식으로만 제공해야 합니다. 마크다운 코드 블록(```


**여행 정보:**
- 여행 제목: {trip_details.get('title', '미정')}
- 기간: {trip_details.get('start_date')}부터 {trip_details.get('end_date')}까지
- 목적지: {trip_details.get('destination_city', '')}, {trip_details.get('destination_country', '')}
- 교통 방식: {trip_details.get('transport_method', '미정')}
- 숙박: {trip_details.get('accommodation', '미정')}
- 관심사: {', '.join(trip_details.get('interests', []))}
- 여행 인원: {trip_details.get('member_count', '미정')}명
- 동반자와의 관계: {trip_details.get('companion_relation', '미정')}
- 최신 트렌드 반영 여부: {'예' if trip_details.get('trend') else '아니오'}


**필수 JSON 출력 형식:**
응답은 `itinerary`와 `packing_list`라는 두 개의 키를 가진 JSON 객체여야 합니다.


`itinerary`의 값은 각 일정을 나타내는 객체들의 배열이어야 합니다.
각 일정 객체는 다음 키를 포함해야 합니다:
- `day`: (Integer) 몇일차인지 나타내는 숫자.
- `order_in_day`: (Integer) 그날의 일정 순서 (1부터 시작).
- `place_name`: (String) 장소의 이름.
- `description`: (String) 일정에 대한 상세 설명.
- `start_time`: (String) 일정이 시작되는 시간 (HH:MM 형식). 정보가 없으면 null.
- `end_time`: (String) 일정이 끝나는 시간 (HH:MM 형식). 정보가 없으면 null.
- `address`: (String) 장소의 정확하고 완전한 주소. 정보가 없으면 null.


`packing_list`의 값은 여행에 필요한 준비물 항목들을 문자열로 나열한 배열이어야 합니다.
`packing_list`의 값은 중복되는 내용 없이, 각각 한번씩만 포함하여야 합니다.


**JSON 예시:**
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
  ],
  "packing_list": [
    "여권",
    "비자 (필요시)",
    "항공권/E-티켓",
    "숙소 예약 확인서",
    "여행자 보험 증서",
    "현금 (현지 통화)",
    "신용카드",
    "스마트폰 및 충전기",
    "보조 배터리",
    "국제 운전면허증 (필요시)",
    "상비약",
    "세면도구",
    "갈아입을 옷",
    "편한 신발",
    "카메라",
    "선글라스",
    "모자",
    "우산/우비",
    "개인 위생용품",
    "작은 가방 (데일리용)",
    "여행용 어댑터/변환기"
  ]
}}
"""


    messages = [
        {
            "role": "system",
            "content": "You are an AI assistant that helps people create detailed travel itineraries. You must respond only with pure JSON format without any markdown code blocks (```json). Your response should be valid JSON that can be parsed directly."
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
            response_format={"type": "json_object"}, # Enforce JSON output,
            extra_body={
                "data_sources": [{
                    "type": "azure_search",
                    "parameters": {
                        "endpoint": f"{search_endpoint}",
                        "index_name": f"{search_index}",
                        "semantic_configuration": f"{semantic_config}",
                        "query_type": "semantic",
                        "fields_mapping": {},
                        "in_scope": True,
                        "role_information": "You are an AI assistant that helps people create detailed travel itineraries. You must respond only with pure JSON format without markdown code blocks.",
                        "filter": None,
                        "strictness": 3,
                        "top_n_documents": 5,
                        "authentication": {
                            "type": "api_key",
                            "key": f"{search_ai_key}"
                        }
                    }
                }]
            }
        )
        
        gpt_response_content = completion.choices[0].message.content
        
        # JSON 응답 정리
        cleaned_response = clean_json_response(gpt_response_content)
        print(f"원본 응답 길이: {len(gpt_response_content)}")
        print(f"정리 후 길이: {len(cleaned_response)}")
        print(f"정리된 응답 시작: {cleaned_response[:100]}...")
        
        parsed_plan = json.loads(cleaned_response)
        return parsed_plan


    except json.JSONDecodeError as je:
        print(f"JSON parsing error: {je}")
        print(f"Cleaned response: {cleaned_response[:500]}...")
        return {"error": f"Failed to parse JSON: {str(je)}", "itinerary": []}
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
응답은 항상 순수한 JSON 형식으로 제공해야 합니다. 마크다운 코드 블록을 사용하지 마세요.


**현재 여행 정보:**
- 여행 제목: {trip_details.get('title', '미정')}
- 기간: {trip_details.get('start_date')}부터 {trip_details.get('end_date')}까지
- 목적지: {trip_details.get('destination_city', '')}, {trip_details.get('destination_country', '')}


**현재 여행 계획 (Itinerary):**
{json.dumps(current_plan, indent=2, ensure_ascii=False)}


**사용자 요청:**
"{user_prompt}"


**지시사항:**
1.  **질문/대화:** 사용자의 요청이 질문(정보성 질문 포함)이거나 일반적인 대화인 경우, `notes` 필드에만 답변을 포함하고 `itinerary` 필드는 생략한 JSON을 반환하세요.
2.  **계획 수정:** 사용자의 요청이 계획 수정을 요구하는 것이라면(예: "에펠탑 일정을 둘째 날로 옮겨줘", "저녁 식사 메뉴를 추가해줘"), `itinerary` 필드를 수정하여 **완전히 새로운 전체 계획**을 반영하고, `notes` 필드에 변경 사항에 대한 요약을 담아 응답하세요.
3.  `itinerary` 배열의 각 객체는 `day`, `order_in_day`, `place_name`, `description`, `start_time`, `end_time` 키를 포함해야 합니다. **또한, 각 장소에 대해 정확하고 완전한 주소를 `address` 필드에 포함해야 합니다.** 정보가 없으면 `null`로 설정하세요.


**JSON 응답 예시:**


*   **질문/대화:**
    {{
      "notes": "첫째 날 일정은 에펠탑 방문과 루브르 박물관 관람입니다."
    }}


*   **계획 수정:**
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
    ],
    "notes": "[사용자 요청에 대한 계획 수정 요약]"
    }}
"""


    messages = [
        {
            "role": "system",
            "content": "You are an AI assistant that helps with travel plans, answering questions and modifying existing itineraries based on user requests. You always respond in pure JSON format without markdown code blocks. Ensure all itinerary items include a precise and complete address in the 'address' field."
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
            response_format={"type": "json_object"},
            extra_body={
                "data_sources": [{
                    "type": "azure_search",
                    "parameters": {
                        "endpoint": f"{search_endpoint}",
                        "index_name": f"{search_index}",
                        "semantic_configuration": f"{semantic_config}",
                        "query_type": "semantic",
                        "fields_mapping": {},
                        "in_scope": True,
                        "role_information": "You are an AI assistant that helps people create detailed travel itineraries. You must respond only with pure JSON format without markdown code blocks.",
                        "filter": None,
                        "strictness": 3,
                        "top_n_documents": 5,
                        "authentication": {
                            "type": "api_key",
                            "key": f"{search_ai_key}"
                        }
                    }
                }]
            }
        )
        
        gpt_response_content = completion.choices[0].message.content
        
        # JSON 응답 정리
        cleaned_response = clean_json_response(gpt_response_content)
        parsed_response = json.loads(cleaned_response)
        return parsed_response


    except json.JSONDecodeError as je:
        print(f"JSON parsing error in chat response: {je}")
        return {"error": f"Failed to parse JSON: {str(je)}", "notes": "죄송합니다, 응답 처리 중 오류가 발생했습니다.", "itinerary": current_plan}
    except Exception as e:
        print(f"Error calling Azure OpenAI for chat or parsing response: {e}")
        return {"error": f"Failed to get chat response: {str(e)}", "notes": "죄송합니다, GPT와 통신하는 중 오류가 발생했습니다.", "itinerary": current_plan}


def get_gpt_place_description(place_name: str) -> str:
    """
    Generates a detailed description for a given place name using Azure OpenAI GPT model.
    """
    client = AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version="2024-02-01",
    )


    prompt_content = f"""
    "{place_name}"에 대한 상세한 설명을 생성해 주세요. 내용은 RAG를 참고하되, 참고할 내용이 없다면 직접 생성해서 추가해주세요. 이 장소의 역사, 중요성, 방문객이 즐길 수 있는 활동, 주변 명소 등을 포함하여 풍부하고 유익한 정보를 제공해 주세요.
    응답은 다른 말 없이 설명 텍스트만 포함해야 합니다.
    """


    messages = [
        {
            "role": "system",
            "content": "You are a helpful AI assistant that provides detailed descriptions of tourist attractions. You must respond only with the descriptive text."
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
            max_tokens=500,
            temperature=0.7,
            top_p=0.95,
            extra_body={
                "data_sources": [{
                    "type": "azure_search",
                    "parameters": {
                        "endpoint": f"{search_endpoint}",
                        "index_name": f"{search_index}",
                        "semantic_configuration": f"{semantic_config}",
                        "query_type": "semantic",
                        "fields_mapping": {},
                        "in_scope": True,
                        "role_information": "You are an AI assistant that helps people create detailed travel itineraries. You must respond only with descriptive text.",
                        "filter": None,
                        "strictness": 3,
                        "top_n_documents": 5,
                        "authentication": {
                            "type": "api_key",
                            "key": f"{search_ai_key}"
                        }
                    }
                }]
            }
        )
        
        description = completion.choices[0].message.content
        return description.strip()


    except Exception as e:
        print(f"Error calling Azure OpenAI for place description: {e}")
        return "상세 정보를 생성하는 중 오류가 발생했습니다."


def generate_diary_image_url(title: str, content: str) -> str:
    """
    Generates an image URL using Azure DALL-E 3 based on diary content.
    """
    if not title and not content:
        raise ValueError("Title or content is required to generate an image.")


    try:
        client = AzureOpenAI(
            api_key=settings.AZURE_DALL_E_API_KEY,
            api_version=settings.AZURE_DALL_E_API_VERSION,
            azure_endpoint=settings.AZURE_DALL_E_ENDPOINT,
        )
        
        prompt = f"A beautiful and emotional diary illustration about '{title}'. Scene: {content}. in a warm, watercolor style."
        
        response = client.images.generate(
            model=settings.AZURE_DALL_E_DEPLOYMENT_NAME,
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        if not image_url:
            raise ValueError("Image URL was not returned from the API.")
            
        return image_url


    except Exception as e:
        print(f"DALL-E 3 API error: {str(e)}")
        # Re-raise the exception to be handled by the caller
        raise e
