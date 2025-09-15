// 언어 이름과 API 코드를 매핑하는 객체
export const languageMap: { [key: string]: string } = {
  '영어': 'en',
  '한국어': 'ko',
  '중국어': 'zh-Hans',
  '일본어': 'ja',
  '스페인어': 'es',
  '프랑스어': 'fr',
  '독일어': 'de',
  '이탈리아어': 'it',
  '포르투갈어': 'pt',
  '러시아어': 'ru',
  '베트남어': 'vi',
  '태국어': 'th',
};

// 언어 코드를 다시 언어 이름으로 변환하는 함수 (필요시 사용)
export const getLanguageName = (code: string): string => {
  return Object.keys(languageMap).find(key => languageMap[key] === code) || 'Unknown';
};

