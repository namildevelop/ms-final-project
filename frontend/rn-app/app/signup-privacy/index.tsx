import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const PrivacyScreen: React.FC = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>개인정보 수집·이용 동의</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>개인정보 수집·이용 동의서</Text>

        {/* 표: 수집 항목/목적/보유기간 */}
        <View style={s.table}>
          <View style={[s.row, s.headerRow]}>
            <Text style={[s.cell, s.headerCell, s.col1]}>구분</Text>
            <Text style={[s.cell, s.headerCell, s.col2]}>수집 항목</Text>
            <Text style={[s.cell, s.headerCell, s.col3]}>수집·이용 목적</Text>
            <Text style={[s.cell, s.headerCell, s.col4, s.lastCell]}>보유·이용 기간</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.cell, s.col1]}>회원가입</Text>
            <Text style={[s.cell, s.col2]}>이메일, 휴대전화번호, 주소,{"\n"}암호화된 인증정보</Text>
            <Text style={[s.cell, s.col3]}>① 본인 확인·계정 관리</Text>
            <Text style={[s.cell, s.col4, s.lastCell]}>{`회원 탈퇴 시 지체 없이 파기
(단, 전자상거래법 등 관계 법령에 따라 6개월~5년 보관 의무가 있는 정보는 해당 기간 보관)`}</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.cell, s.col1]}>위치정보</Text>
            <Text style={[s.cell, s.col2]}>GPS, Wi‑Fi, 기지국 정보</Text>
            <Text style={[s.cell, s.col3]}>② 실시간 일정 보정·추천</Text>
            <Text style={[s.cell, s.col4, s.lastCell]}>수집일로부터 6개월 후 파기</Text>
          </View>
          <View style={[s.row, s.lastRow]}>
            <Text style={[s.cell, s.col1]}>자동수집</Text>
            <Text style={[s.cell, s.col2]}>IP, 기기·OS 정보, 접속 로그,{"\n"}이용 기록, AI 입력 데이터</Text>
            <Text style={[s.cell, s.col3]}>③ 서비스 품질·보안 유지</Text>
            <Text style={[s.cell, s.col4, s.lastCell]}>1년 보관 후 파기 또는 익명화</Text>
          </View>
        </View>

        <Text style={{ color: '#111827', lineHeight: 22, fontSize: 14, marginTop: 16 }}>
1) 제3자 제공{`\n`}회사는 원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만, 법령에 근거한 요청이 있거나 이용자가 사전에 동의한 경우에 한해 최소한의 정보를 제공합니다.
{`\n\n`}2) 국외 이전 및 처리 위탁{`\n`}• 수탁자: OpenAI, Microsoft, Google 등 GPT 모델 운영사(미국 등)
{`\n`}• 이전 항목: 이용자가 AI 입력 창에 직접 기재한 텍스트, 서비스 사용 로그(이메일·전화번호·주소는 제외)
{`\n`}• 이용 목적: 일정 추천 생성, 모델 품질 향상
{`\n`}• 보유 기간: 1년 또는 이용자 삭제 요청 시
{`\n`}※ 국외 이전에 동의하지 않을 권리가 있으며, 동의 거부 시 AI 추천 서비스 이용이 제한될 수 있습니다.
{`\n\n`}3) 이용자의 권리{`\n`}개인정보·위치정보 열람, 정정, 삭제, 처리 정지, 동의 철회 요청 가능. 회사는 요청을 받은 날로부터 10일 이내 조치 결과를 통보합니다.
{`\n\n`}4) 개인정보 보호 책임자{`\n`}성명: 고길동(Chief Privacy Officer){`\n`}이메일: kokildong@company.com{`\n`}전화: 02-0000-0000
{`\n\n`}5) 파기 절차 및 방법{`\n`}전자 파일: 복구 불가능한 방법으로 영구 삭제{`\n`}출력물: 분쇄·소각
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyScreen;

const s = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    backgroundColor: '#f9fafb',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    color: '#111827',
    fontSize: 13,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  headerCell: {
    fontWeight: '700',
  },
  col1: { flex: 1 },
  col2: { flex: 2 },
  col3: { flex: 2 },
  col4: { flex: 2 },
});


