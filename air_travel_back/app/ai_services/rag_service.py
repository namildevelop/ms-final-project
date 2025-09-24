"""
RAG (Retrieval-Augmented Generation) service using Azure OpenAI.
"""
from typing import Optional, List
from app.core.config import settings

class RAGService:
    """Service for RAG-based content generation."""
    
    def __init__(self):
        self.aoai = settings.AZURE_OPENAI_CLIENT
        self.deployment = settings.AZURE_OPENAI_DEPLOYMENT_NAME
        self.search_endpoint = settings.AZURE_SEARCH_ENDPOINT
        self.search_key = settings.AZURE_SEARCH_KEY
        self.search_index = settings.AZURE_SEARCH_INDEX
    
    def summarize(self, label_ko: str, aliases: Optional[List[str]] = None) -> Optional[str]:
        """Generate summary using Azure OpenAI + Azure AI Search."""
        if not (self.aoai and self.deployment and self.search_endpoint and self.search_key and self.search_index):
            print(f"RAGService: Missing config - aoai:{bool(self.aoai)}, deployment:{self.deployment}, search_endpoint:{self.search_endpoint}, search_key:{bool(self.search_key)}, search_index:{self.search_index}")
            return None

        alias_hint = ""
        if aliases:
            alias_hint = " (동의어: " + " / ".join(dict.fromkeys(aliases)) + ")"

        try:
            completion = self.aoai.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": "너는 서울 관광지 전문가야. 간결하고 정확한 한국어로 설명해."},
                    {"role": "user",
                     "content": f"'{label_ko}'{alias_hint} 에 대해 여행객이 이해하기 쉽게 3~4문장으로 안내해줘. "
                                f"가능하면 이용팁/안전/주변코스 한두 가지도 포함해."}
                ],
                # ※ 지금은 semantic 설정 문제 있으므로 simple 검색으로 동작 우선
                extra_body={
                    "data_sources": [
                        {
                            "type": "azure_search",
                            "parameters": {
                                "endpoint": self.search_endpoint,
                                "index_name": self.search_index,
                                "authentication": {"type": "api_key", "key": self.search_key},
                                "in_scope": True,
                                "query_type": "simple",
                                "top_n_documents": 5
                            }
                        }
                    ]
                }
            )
            txt = completion.choices[0].message.content
            return txt.strip() if txt else None
        except Exception as e:
            print("RAG error:", e)
            return None


