"""
RAG (Retrieval-Augmented Generation) service using Azure OpenAI.
"""
from typing import Optional, List
from app.core.config import settings
from openai import AzureOpenAI

class RAGService:
    """Service for RAG-based content generation."""
    
    def __init__(self):
        self.aoai_endpoint = settings.AZURE_OPENAI_ENDPOINT
        self.deployment = settings.AZURE_OPENAI_DEPLOYMENT_NAME
        self.search_endpoint = settings.AZURE_SEARCH_ENDPOINT
        self.search_key = settings.AZURE_SEARCH_KEY
        self.search_index = settings.AZURE_SEARCH_INDEX
        
        # Azure OpenAI 클라이언트 초기화
        if self.aoai_endpoint and settings.AZURE_OPENAI_API_KEY:
            self.aoai = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version="2024-02-15-preview",
                azure_endpoint=self.aoai_endpoint
            )
        else:
            self.aoai = None
    
    def summarize(self, label_ko: str, aliases: Optional[List[str]] = None) -> Optional[str]:
        """Generate summary using Azure OpenAI + Azure AI Search."""
        print(f"RAG Service: label_ko={label_ko}, aliases={aliases}")
        print(f"RAG Service: aoai={self.aoai}, deployment={self.deployment}")
        print(f"RAG Service: search_endpoint={self.search_endpoint}, search_key={'***' if self.search_key else None}, search_index={self.search_index}")
        
        if not (self.aoai and self.deployment and self.search_endpoint and self.search_key and self.search_index):
            print("RAG Service: Missing Azure configuration, returning None")
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
