import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const TermsScreen: React.FC = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>이용약관</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: '#111827', lineHeight: 22, fontSize: 14 }}>
제 1 조 (목적)
{`\n`}이 약관은 ㈜에어트레블 (이하 “회사”)가 모바일 애플리케이션 및 웹을 통해 제공하는 AI 여행 일정 추천 서비스(이하 “서비스”)의 이용 조건·절차 및 회사와 이용자 간 권리·의무를 규정함을 목적으로 합니다.
{`\n\n`}제 2 조 (용어 정의)
1. 서비스: GPT 기반 알고리즘이 이용자의 입력·위치 정보를 분석해 맞춤 일정(교통, 숙소, 동선, 예상 경비 등)을 제안하는 기능 일체. 결제·예약 기능은 포함하지 않음.
{`\n`}2. 이용자: 본 약관에 동의하고 서비스를 이용하는 자(회원·비회원 포함).
{`\n`}3. 회원: 회사가 정한 절차에 따라 가입한 자.
{`\n`}4. 위치정보: 「위치정보 보호 및 이용 등에 관한 법률」에 따른 개인 또는 단말기의 위치를 식별할 수 있는 정보.
{`\n`}5. 콘텐츠: AI가 생성하거나 회사가 제공하는 텍스트·이미지·데이터 등 모든 정보.
{`\n\n`}제 3 조 (약관의 명시·개정)
1. 회사는 약관을 서비스 초기 화면에 게시하며, 개정 시 최소 7일(중대 변경 30일) 이전 공지합니다.
{`\n`}2. 이용자는 개정된 약관에 동의하지 않을 권리가 있으며, 거부 시 서비스 이용을 중단하고 탈퇴할 수 있습니다.
{`\n\n`}제 4 조 (서비스의 제공)
1. 회사는 다음 기능을 제공합니다.
{`\n`}  • AI 맞춤 일정 생성 및 편집
{`\n`}  • 위치 기반 일정 보정·추천
{`\n`}  • 여행 기록·저장(선택)
{`\n`}2. 회사는 예약·결제·대금청구를 직접 수행하지 않으며 이에 따른 계약·분쟁에 관여하지 않습니다.
{`\n`}3. 회사는 시스템 점검, 사업상·기술상 필요 시 서비스 일부를 변경·중단할 수 있습니다.
{`\n\n`}제 5 조 (회원가입·탈퇴)
1. 이용자는 이메일, 휴대전화번호, 주소 등 필수 정보를 입력하고 약관·개인정보 처리방침에 동의함으로써 회원가입을 신청합니다.
{`\n`}2. 회원은 언제든 탈퇴를 요청할 수 있으며, 회사는 관련 법령이 정한 범위를 제외하고 즉시 개인정보를 파기합니다.
{`\n\n`}제 6 조 (회사 의무)
1. 회사는 법령·약관이 정한 바에 따라 서비스를 안정적으로 제공하기 위해 최선을 다합니다.
{`\n`}2. 개인정보는 별도 개인정보 처리방침에 따라 보호됩니다.
{`\n\n`}제 7 조 (이용자 의무)
1. 이용자는 실제·정확한 정보를 제공하고, 계정·비밀번호 관리 책임을 집니다.
{`\n`}2. 다음 행위를 금합니다.
{`\n`}  • 서비스 콘텐츠의 상업적 이용, 무단 복제·배포
{`\n`}  • 타인의 개인정보 도용·침해
{`\n`}  • AI 모델 학습을 방해하거나 시스템에 과부하를 유발하는 행위
{`\n`}  • 기타 법령·공서양속에 반하는 행위
{`\n\n`}제 8 조 (지적재산권)
1. 서비스 및 AI 생성 콘텐츠에 대한 저작권·지식재산권은 회사 또는 정당한 권리자에게 귀속됩니다.
{`\n`}2. 이용자는 개인적·비상업적 용도로만 콘텐츠를 사용할 수 있으며, 사전 서면 동의 없이 2차적 저작물 작성·영리 이용을 할 수 없습니다.
{`\n\n`}제 9 조 (면책)
1. AI 추천 일정은 참고 정보이며, 실제 여행 결과·비용·안전에 대해 회사는 책임을 지지 않습니다.
{`\n`}2. 위치 오차, 데이터 갱신 지연, 외부 정보 변경으로 인한 손해에 대해 회사는 고의·중과실이 없는 한 책임을 부담하지 않습니다.
{`\n\n`}제 10 조 (분쟁 해결 및 준거법)
본 약관과 서비스는 대한민국 법령에 따르며, 서비스와 관련해 분쟁이 발생할 경우 서울중앙지방법원을 전속적 관할 법원으로 합니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsScreen;





