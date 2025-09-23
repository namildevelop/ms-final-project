import React, { useEffect, useRef, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import axios from "axios";
import { useAuth } from "../../src/context/AuthContext";

import { API_URL } from "@env";

interface DetectionResult {
  id: string;
  label: string;
  description: string;
  bbox: number[];
  audio_url?: string;
  confidence?: number;
}

export default function AICameraScreen() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [perm, request] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [hasLoc, setHasLoc] = useState<boolean | null>(null);
  const camRef = useRef<CameraView>(null);

  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [selected, setSelected] = useState<DetectionResult | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 카메라 뷰 실제 크기(px) 저장
  const [camLayout, setCamLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    (async () => {
      if (!perm?.granted) await request();
      const loc = await Location.requestForegroundPermissionsAsync();
      setHasLoc(loc.status === "granted");
    })();
  }, []);

  const API = Platform.OS === "web"
    ? "http://localhost:8000/v1/ai-analysis/analyze-base64"
    : "https://18bdbfb5aede.ngrok-free.app/v1/ai-analysis/analyze-base64";

  const captureAndAnalyze = async () => {
    if (isAnalyzing || !ready) return;
    
    try {
      setIsAnalyzing(true);
      
      const photo = await camRef.current?.takePictureAsync({
        base64: true, 
        quality: 0.3, 
        skipProcessing: true, 
        exif: false,
      });
      
      if (!photo?.base64) throw new Error("사진 촬영 실패");

      let coords = { latitude: null as number | null, longitude: null as number | null };
      if (hasLoc) {
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Lowest 
        });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }

      setStatus("AI 분석 중...");
      
      const response = await axios.post(API, {
        image: photo.base64,
        ...coords
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60초로 증가
      });

      if (response.data?.detections) {
        setDetections(response.data.detections);
        setStatus(`인식 완료: ${response.data.detections.length}개 객체`);
      } else {
        setStatus("인식된 객체가 없습니다");
      }
      
    } catch (error: any) {
      console.error("AI 분석 오류:", error);
      const errorMsg = error.response?.data?.detail || error.message || "분석 실패";
      setStatus(`오류: ${errorMsg}`);
      Alert.alert("분석 실패", errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playAudio = async (detection: DetectionResult) => {
    try {
      if (detection.audio_url) {
        // 서버에서 생성된 오디오 재생
        console.log("오디오 URL:", detection.audio_url);
        // 여기서는 TTS로 대체
        Speech.speak(detection.description, { language: "ko-KR" });
      } else {
        // TTS로 설명 재생
        Speech.speak(detection.description, { language: "ko-KR" });
      }
    } catch (error) {
      console.error("오디오 재생 오류:", error);
    }
  };

  if (!perm) return <View style={styles.center}><Text>권한 확인 중...</Text></View>;
  if (!perm.granted) return <View style={styles.center}><Text>카메라 권한이 필요합니다</Text></View>;

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setCamLayout({ width, height });
      }}
    >
      {/* 카메라 뷰 */}
      <CameraView
        style={StyleSheet.absoluteFill}
        ref={camRef}
        onCameraReady={() => setReady(true)}
        facing="back"
      />

      {/* 상태 배너 */}
      {Boolean(status) && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{status}</Text>
        </View>
      )}

      {/* 분석 중 오버레이 */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.analyzingText}>AI 분석 중...</Text>
        </View>
      )}

      {/* 바운딩 박스 오버레이 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {detections.map((det) => {
          if (camLayout.width === 0 || camLayout.height === 0) return null;

          const left = det.bbox[0] * camLayout.width;
          const top = det.bbox[1] * camLayout.height;
          const width = det.bbox[2] * camLayout.width;
          const height = det.bbox[3] * camLayout.height;

          const style = {
            position: "absolute" as const,
            left,
            top,
            width,
            height,
            borderColor: det.id.startsWith("yolo") ? "#ff3b30" : "#007AFF",
            borderWidth: 3,
            borderRadius: 8,
          };

          return (
            <TouchableOpacity 
              key={det.id} 
              style={style} 
              onPress={() => { 
                setSelected(det); 
                setOpen(true); 
              }}
            >
              <View style={[
                styles.labelContainer,
                { backgroundColor: det.id.startsWith("yolo") ? "rgba(255,59,48,0.8)" : "rgba(0,122,255,0.8)" }
              ]}>
                <Text style={styles.labelText}>{det.label}</Text>
                {det.confidence && (
                  <Text style={styles.confidenceText}>
                    {(det.confidence * 100).toFixed(0)}%
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 셔터 버튼 */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.shutterWrap}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={captureAndAnalyze}
            disabled={!ready || isAnalyzing}
            style={[
              styles.shutterBtn, 
              (!ready || isAnalyzing) && { opacity: 0.5 }
            ]}
          />
          <Text style={styles.shutterHint}>
            {isAnalyzing ? "분석 중..." : "AI 분석 촬영"}
          </Text>
        </View>
      </View>

      {/* 뒤로가기 버튼 */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>✕</Text>
      </TouchableOpacity>

      {/* 결과 모달 */}
      {selected && (
        <Modal 
          transparent 
          visible={open} 
          animationType="slide" 
          onRequestClose={() => { setOpen(false); setSelected(null); }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selected.label}</Text>
              <Text style={styles.modalDescription}>{selected.description}</Text>
              
              {selected.confidence && (
                <Text style={styles.confidenceText}>
                  신뢰도: {(selected.confidence * 100).toFixed(1)}%
                </Text>
              )}
              
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => playAudio(selected)}
                >
                  <Text style={styles.modalButtonText}>🔊 음성 안내</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => { setOpen(false); setSelected(null); }}
                >
                  <Text style={styles.modalButtonText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  banner: { 
    position: "absolute", 
    top: 60, 
    left: 0, 
    right: 0, 
    alignItems: "center", 
    zIndex: 9999 
  },
  bannerText: { 
    backgroundColor: "rgba(0,0,0,0.7)", 
    color: "#fff", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    fontSize: 14
  },
  analyzingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998
  },
  analyzingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16
  },
  labelContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    position: "absolute",
    top: 0,
    left: 0,
  },
  labelText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600" 
  },
  confidenceText: {
    color: "#fff",
    fontSize: 10,
    opacity: 0.8
  },
  shutterWrap: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shutterHint: {
    marginTop: 12,
    color: "#fff",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: "600",
    fontSize: 16
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold"
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  modalContent: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 20, 
    width: "85%",
    maxHeight: "70%"
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 12,
    color: "#1a1a1a"
  },
  modalDescription: { 
    fontSize: 16, 
    marginBottom: 16,
    lineHeight: 24,
    color: "#4a4a4a"
  },
  modalButtonsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  modalButton: { 
    backgroundColor: "#007AFF", 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    marginHorizontal: 4,
    flex: 1,
    alignItems: "center"
  },
  modalButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 16
  },
});

