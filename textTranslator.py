import os
import cv2
import re
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential
from azure.ai.translation.text import TextTranslationClient

# Load environment variables from .env file
load_dotenv()

class ProfessionalImageTranslator:
    def __init__(self, target_language='ko'):
        """Initializes the translator with Azure credentials."""
        try:
            self.vision_endpoint = os.getenv("AZURE_VISION_ENDPOINT")
            self.vision_key = os.getenv("AZURE_VISION_KEY")
            self.translator_endpoint = os.getenv("TRANSLATOR_ENDPOINT")
            self.translator_key = os.getenv("TRANSLATOR_API_KEY")
            self.translator_region = os.getenv("TRANSLATOR_REGION")
            self.target_language = target_language

            # Initialize Azure clients
            self.vision_client = ImageAnalysisClient(
                endpoint=self.vision_endpoint,
                credential=AzureKeyCredential(self.vision_key)
            )
            self.translator_client = TextTranslationClient(
                endpoint=self.translator_endpoint,
                credential=AzureKeyCredential(self.translator_key),
                region=self.translator_region
            )
            print("✅ 전문가급 이미지 번역기가 성공적으로 초기화되었습니다.")
        except Exception as e:
            print(f"❌ 초기화에 실패했습니다. .env 파일과 자격 증명을 확인하세요. 오류: {e}")
            raise

    def extract_text_blocks_grouped(self, image_path):
        """
        Extracts text from an image, treating each detected line as a separate block
        to preserve layouts like columns in menus.
        """
        with open(image_path, "rb") as f:
            image_data = f.read()

        print("👁️ 이미지를 분석하여 텍스트 위치를 파악하는 중...")
        result = self.vision_client.analyze(
            image_data=image_data,
            visual_features=[VisualFeatures.READ]
        )

        text_blocks = []
        if result.read and result.read.blocks:
            # Iterate through every single line detected, ignoring the default block grouping
            all_lines = [line for block in result.read.blocks for line in block.lines]
            
            for line in all_lines:
                points = line.bounding_polygon
                x_coords = [p.x for p in points]
                y_coords = [p.y for p in points]
                
                line_info = {
                    'text': line.text,
                    'x': min(x_coords),
                    'y': min(y_coords),
                    'width': max(x_coords) - min(x_coords),
                    'height': max(y_coords) - min(y_coords)
                }

                # Create a new "block" for each line to process it independently
                text_blocks.append({
                    'text': line.text,
                    'x': line_info['x'],
                    'y': line_info['y'],
                    'width': line_info['width'],
                    'height': line_info['height'],
                    'lines': [line_info],  # The block contains only this one line
                    'line_count': 1
                })

        print(f"📦 {len(text_blocks)}개의 개별 텍스트 라인을 블록으로 정리했습니다.")
        return text_blocks

    def translate_text(self, text):
        """Translates a string of text."""
        if not text.strip():
            return ""
        # The calling function will handle the exception
        response = self.translator_client.translate(
            body=[{"text": text}],
            to_language=[self.target_language]
        )
        if response and len(response) > 0:
            return response[0]['translations'][0]['text']
        return text

    def get_premium_font(self, size, weight='regular'):
        
        """Loads a high-quality local font, with fallbacks."""
        font_paths = {
            'bold': [
                "C:\\Windows\\Fonts\\malgunbd.ttf",  # Malgun Gothic Bold
                "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
                "/usr/share/fonts/truetype/nanum/NanumBarunGothicBold.ttf"
            ],
            'regular': [
                "C:\\Windows\\Fonts\\malgun.ttf",  # Malgun Gothic Regular
                "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
                "/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf"
            ]
        }
        for font_path in font_paths.get(weight, font_paths['regular']):
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, size)
                except IOError:
                    continue
        return ImageFont.load_default()

    def split_translation_smartly(self, translation, original_lines):
        """Intelligently splits translated text to fit the original line count."""
        # Since each block now has only one line, this function is simplified.
        return [translation]

    def create_artistic_overlay(self, image_path, text_blocks, translations, output_path=None):
        """🎨 Creates a clean, artistic overlay by placing text in boxes line-by-line."""
        print("🎨 세련된 예술적 오버레이를 생성 중입니다...")
        
        pil_image = Image.open(image_path).convert("RGBA")
        overlay = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        for block, translation in zip(text_blocks, translations):
            if not translation.strip():
                continue

            # Since each block is one line, we directly access the first (and only) line
            original_line = block['lines'][0]
            trans_line = translation

            # --- 1. Determine base font properties ---
            # Simplified logic as we don't have multi-line titles in this mode
            font_weight = 'regular' 
            font_size = max(int(original_line['height'] * 0.7), 10)
            font = self.get_premium_font(font_size, font_weight)
            
            # --- 2. Adapt font size to fit the available width ---
            max_width = original_line['width'] * 1.1 # Allow text to be slightly wider
            
            # Reduce font size until the text fits
            while font.getlength(trans_line) > max_width and font_size > 9:
                font_size -= 1
                font = self.get_premium_font(font_size, font_weight)

            # --- 3. Calculate final text dimensions ---
            try:
                bbox = draw.textbbox((0, 0), trans_line, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                text_y_offset = bbox[1]
            except AttributeError:
                text_width, text_height = draw.textsize(trans_line, font=font)
                text_y_offset = 0

            # --- 4. Define the background box for this line ---
            padding_x = int(font_size * 0.4)
            padding_y = int(font_size * 0.2)
            
            box_width = text_width + padding_x * 2
            box_height = text_height + padding_y * 2
            
            # Center the new, perfectly sized box over the original line's area
            box_x = original_line['x'] + (original_line['width'] - box_width) / 2
            box_y = original_line['y'] + (original_line['height'] - box_height) / 2

            # --- 5. Draw the semi-transparent background ---
            fill_color = (255, 230, 230, 210) # Light pink, ~82% opaque
            draw.rounded_rectangle(
                [(box_x, box_y), (box_x + box_width, box_y + box_height)],
                radius=6,
                fill=fill_color
            )
            
            # --- 6. Draw the text, centered within its new background ---
            text_x = box_x + padding_x
            text_y = box_y + padding_y - text_y_offset
            
            text_color = (30, 30, 30)
            draw.text(
                (text_x, text_y),
                trans_line,
                fill=text_color,
                font=font
            )
        
        print(f"  ✨ {len(text_blocks)}개의 라인을 성공적으로 렌더링했습니다.")

        # Composite the overlay onto the original image
        final_image = Image.alpha_composite(pil_image, overlay).convert('RGB')

        if output_path is None:
            base_name = os.path.splitext(os.path.basename(image_path))[0]
            output_path = f"{base_name}_artistic_translated.png"

        final_image.save(output_path, "PNG", quality=95)
        print(f"💎 예술적 결과물이 {output_path}에 저장되었습니다.")
        return output_path

    def translate_image(self, image_path, target_language=None, output_path=None):
        """Main function to translate an image with an artistic overlay."""
        if target_language:
            self.target_language = target_language
        
        print(f"\n🎨 예술적 이미지 번역을 시작합니다: {image_path}")
        
        try:
            text_blocks = self.extract_text_blocks_grouped(image_path)
            if not text_blocks:
                print("❌ 이미지에서 텍스트를 찾을 수 없습니다.")
                return None
            
            print("🔄 텍스트 블록을 번역 중입니다...")
            translations = [self.translate_text(block['text']) for block in text_blocks]
            
            # Call the artistic overlay function
            result_path = self.create_artistic_overlay(
                image_path, text_blocks, translations, output_path
            )
            
            print(f"✨ 번역 완료! 결과: {result_path}")
            return result_path
            
        except Exception as e:
            print(f"❌ 번역 중 오류가 발생했습니다: {e}")
            # Improved error message for the user
            if "400036" in str(e) or "invalid" in str(e).lower():
                print("\n🤔 오류 메시지는 '언어 코드'를 언급하지만, Azure API 키, 엔드포인트 또는 지역이 잘못되었을 때도 자주 발생합니다.")
                print("👉 .env 파일의 TRANSLATOR_API_KEY, TRANSLATOR_ENDPOINT, TRANSLATOR_REGION 값이 올바른지 다시 한번 확인해주세요.")
            return None

def main():
    """Main loop to run the translator from the command line."""
    # List of common language codes to help the user
    supported_languages = {
        'ko': '한국어', 'en': '영어', 'ja': '일본어', 'zh-Hans': '중국어(간체)',
        'fr': '프랑스어', 'de': '독일어', 'es': '스페인어'
    }

    print("=" * 60)
    print("🎨 예술적 Azure 이미지 번역기")
    print("💎 아름다운 박물관 스타일 오버레이를 생성합니다.")
    print("=" * 60)
    
    try:
        translator = ProfessionalImageTranslator(target_language='ko')
        
        while True:
            print("\n" + "=" * 40)
            print("1. 이미지 번역하기")
            print("2. 종료")
            print("=" * 40)
            
            choice = input("옵션을 선택하세요 > ").strip()
            
            if choice == "1":
                image_path = input("이미지 파일 경로를 입력하세요 > ").strip().replace('"', '')
                
                if not os.path.exists(image_path):
                    print("❌ 파일을 찾을 수 없습니다. 경로를 확인해주세요.")
                    continue
                
                # Guide the user with language options
                print("\n📖 번역 가능한 언어 코드 예시:")
                for code, name in supported_languages.items():
                    print(f"  - {code}: {name}")

                while True:
                    target_lang = input("\n번역할 언어 코드를 입력하세요 (기본값: ko) > ").strip() or 'ko'
                    # A simple validation check (can be expanded)
                    if len(target_lang) > 1:
                        break
                    else:
                        print("❌ 유효하지 않은 언어 코드입니다. 다시 입력해주세요.")

                result_path = translator.translate_image(image_path, target_lang)
                
                if result_path:
                    if input("\n결과 이미지를 표시하시겠습니까? (y/n) > ").strip().lower() == 'y':
                        try:
                            result_image = cv2.imread(result_path)
                            cv2.imshow('예술적 번역 결과', result_image)
                            cv2.waitKey(0)
                            cv2.destroyAllWindows()
                        except Exception as e:
                            print(f"❌ 이미지를 표시할 수 없습니다: {e}")
            
            elif choice == "2":
                print("👋 프로그램을 종료합니다.")
                break
            else:
                print("잘못된 옵션입니다. 1 또는 2를 선택해주세요.")
    
    except Exception as e:
        print(f"❌ 시작 중 심각한 오류가 발생했습니다: {e}")

if __name__ == "__main__":
    main()

