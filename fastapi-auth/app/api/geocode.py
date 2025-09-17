from fastapi import APIRouter, HTTPException, Query
import os
import requests
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/kakao", tags=["kakao"])

KAKAO_KEY = os.getenv("KAKAO_REST_API_KEY", "")

def headers():
    if not KAKAO_KEY:
        raise HTTPException(500, "KAKAO_REST_API_KEY not set")
    return {"Authorization": f"KakaoAK {KAKAO_KEY}"}

@router.get("/coord2address")
def coord2address(lat: float = Query(..., description="위도"), lng: float = Query(..., description="경도")):
    """좌표를 주소로 변환하는 API (역지오코딩)"""
    try:
        # 카카오 좌표-주소 변환 API 호출
        url = "https://dapi.kakao.com/v2/local/geo/coord2address.json"
        
        headers_dict = headers()
        params = {
            "x": lng,  # 카카오 API는 경도, 위도 순서
            "y": lat
        }
        
        response = requests.get(url, headers=headers_dict, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("documents"):
                doc = data["documents"][0]
                
                # 안전한 필드 접근 (카카오 API 실제 응답 구조에 맞춤)
                address = doc.get("address", {}).get("address_name", "")
                road_address = doc.get("road_address", {}).get("address_name", "") if doc.get("road_address") else ""
                
                # 도로명주소가 있으면 도로명주소, 없으면 지번주소 사용
                final_address = road_address if road_address else address
                
                # 주소가 비어있으면 기본 주소 생성
                if not final_address:
                    final_address = f"위치: {lat}, {lng}"
                
                return {
                    "address": final_address,
                    "raw": data
                }
            else:
                # 검색 결과가 없으면 기본 주소 반환
                return {"address": f"위치: {lat}, {lng}", "raw": data}
        else:
            return JSONResponse(
                status_code=400,
                content={"detail": f"주소 변환 실패: {response.status_code}"}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"주소 변환 중 오류 발생: {str(e)}"}
        )

@router.get("/search")
def search_address(query: str = Query(..., description="검색할 주소")):
    """주소 검색 API"""
    try:
        # 카카오 주소 검색 API 호출
        url = "https://dapi.kakao.com/v2/local/search/address.json"
        
        headers_dict = headers()
        params = {
            "query": query,
            "size": 10  # 검색 결과 개수
        }
        
        response = requests.get(url, headers=headers_dict, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("documents"):
                # 검색 결과를 간단한 형태로 변환
                addresses = []
                for doc in data["documents"]:
                    address_name = doc.get("address_name", "")
                    road_address_name = doc.get("road_address_name", "")
                    
                    # 도로명주소가 있으면 도로명주소, 없으면 지번주소 사용
                    final_address = road_address_name if road_address_name else address_name
                    addresses.append(final_address)
                
                return {
                    "addresses": addresses,
                    "total": len(addresses),
                    "raw": data
                }
            else:
                return {"addresses": [], "total": 0, "raw": data}
        else:
            return JSONResponse(
                status_code=400,
                content={"detail": f"주소 검색 실패: {response.status_code}"}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"주소 검색 중 오류 발생: {str(e)}"}
        )






