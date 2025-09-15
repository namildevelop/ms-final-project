import os
import re
from PIL import Image, ImageDraw, ImageFont, ExifTags
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.ai.translation.text import TextTranslationClient

# .env 파일에서 환경변수 로드
load_dotenv()

def rotate_image_if_needed(image_path):
    """이미지의 EXIF 데이터를 읽어 필요하면 자동으로 회전시킵니다."""
    try:
        image = Image.open(image_path)
        # EXIF 데이터에서 Orientation 태그 찾기
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
        
        exif = image._getexif()

        if exif is not None and orientation in exif:
            exif_orientation = exif[orientation]
            
            if exif_orientation == 3:
                image = image.rotate(180, expand=True)
            elif exif_orientation == 6:
                image = image.rotate(270, expand=True)
            elif exif_orientation == 8:
                image = image.rotate(90, expand=True)
            
            # 회전된 이미지를 같은 경로에 덮어쓰기
            image.save(image_path)
            print(f"✅ 이미지를 EXIF 데이터에 따라 회전했습니다 (Orientation: {exif_orientation}).")
        image.close()
    except (AttributeError, KeyError, IndexError, TypeError):
        # EXIF 정보가 없는 이미지거나 처리 중 오류 발생 시 무시
        print("⚠️ EXIF 정보가 없거나 처리할 수 없어 자동 회전을 건너뜁니다.")
        pass

class ProfessionalImageTranslator:
    def __init__(self, target_language='ko'):
        """Initializes the translator with Azure credentials."""
        try:
            self.doc_ai_endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
            self.doc_ai_key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
            self.translator_endpoint = os.getenv("TRANSLATOR_ENDPOINT")
            self.translator_key = os.getenv("TRANSLATOR_API_KEY")
            self.translator_region = os.getenv("TRANSLATOR_REGION")
            self.target_language = target_language

            if not all([self.doc_ai_endpoint, self.doc_ai_key]):
                raise ValueError("Document Intelligence endpoint or key is missing.")
            
            self.doc_ai_client = DocumentAnalysisClient(
                endpoint=self.doc_ai_endpoint, credential=AzureKeyCredential(self.doc_ai_key)
            )
            self.translator_client = TextTranslationClient(
                endpoint=self.translator_endpoint,
                credential=AzureKeyCredential(self.translator_key),
                region=self.translator_region
            )
        except Exception as e:
            print(f"❌ ProfessionalImageTranslator 초기화 실패: {e}")
            raise

    def extract_text_blocks_grouped(self, image_path):
        """Extracts text from an image, treating each line as a separate block."""
        with open(image_path, "rb") as f:
            image_data = f.read()

        poller = self.doc_ai_client.begin_analyze_document("prebuilt-layout", image_data)
        result = poller.result()

        text_blocks = []
        if result.pages:
            for page in result.pages:
                for line in page.lines:
                    points = line.polygon
                    x_coords = [p.x for p in points]
                    y_coords = [p.y for p in points]
                    
                    line_info = {
                        'text': line.content,
                        'x': min(x_coords),
                        'y': min(y_coords),
                        'width': max(x_coords) - min(x_coords),
                        'height': max(y_coords) - min(y_coords)
                    }

                    text_blocks.append({
                        'text': line.content,
                        'x': line_info['x'],
                        'y': line_info['y'],
                        'width': line_info['width'],
                        'height': line_info['height'],
                        'lines': [line_info],
                        'line_count': 1
                    })
        return text_blocks

    def translate_text(self, text, target_language):
        """Translates a string of text."""
        if not text.strip() or not re.search('[a-zA-Z]', text):
             return text
        
        try:
            response = self.translator_client.translate(
                body=[{"text": text}],
                to_language=[target_language]
            )
            if response and len(response) > 0:
                return response[0]['translations'][0]['text']
        except Exception as e:
            print(f"Translation Error: {e}")
            return text
        return text

    def get_premium_font(self, size, weight='regular'):
        """Loads a high-quality local font, with fallbacks."""
        font_paths = {
            'bold': ["/usr/share/fonts/truetype/nanum/NanumBarunGothicBold.ttf"],
            'regular': ["/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf"]
        }
        for font_path in font_paths.get(weight, font_paths['regular']):
            if os.path.exists(font_path):
                try: 
                    return ImageFont.truetype(font_path, size)
                except IOError: 
                    continue
        return ImageFont.load_default()

    def create_artistic_overlay(self, image_path, text_blocks, translations, output_path=None):
        """Creates an overlay with translated text."""
        pil_image = Image.open(image_path).convert("RGBA")
        overlay = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        for block, translation in zip(text_blocks, translations):
            if not translation.strip(): 
                continue

            original_line = block['lines'][0]
            trans_line = translation
            font_size = max(int(original_line['height'] * 0.8), 10)
            font = self.get_premium_font(font_size, 'regular')
            
            max_width = original_line['width'] * 1.1
            
            while font.getlength(trans_line) > max_width and font_size > 9:
                font_size -= 1
                font = self.get_premium_font(font_size, 'regular')

            bbox = font.getbbox(trans_line)
            text_width, text_height = bbox[2] - bbox[0], bbox[3] - bbox[1]

            padding_x = int(font_size * 0.4)
            padding_y = int(font_size * 0.2)
            
            box_width = text_width + padding_x * 2
            box_height = text_height + padding_y * 2
            box_x = original_line['x'] + (original_line['width'] - box_width) / 2
            box_y = original_line['y'] + (original_line['height'] - box_height) / 2

            draw.rounded_rectangle(
                [(box_x, box_y), (box_x + box_width, box_y + box_height)],
                radius=6, fill=(255, 240, 225, 220)
            )
            
            text_x = box_x + padding_x
            text_y = box_y + padding_y - bbox[1]
            draw.text((text_x, text_y), trans_line, fill=(30, 30, 30), font=font)
        
        final_image = Image.alpha_composite(pil_image, overlay).convert('RGB')

        if output_path is None:
            base_name = os.path.splitext(os.path.basename(image_path))[0]
            output_path = f"{base_name}_artistic_translated.png"

        final_image.save(output_path, "PNG", quality=95)
        return output_path

    def translate_image(self, image_path, target_language=None, output_path=None):
        """Main function to translate an image."""
        effective_language = target_language if target_language else self.target_language
        
        try:
            rotate_image_if_needed(image_path)
            text_blocks = self.extract_text_blocks_grouped(image_path)
            if not text_blocks:
                return None
            
            translations = [self.translate_text(block['text'], effective_language) for block in text_blocks]
            result_path = self.create_artistic_overlay(
                image_path, text_blocks, translations, output_path
            )
            return result_path
        except Exception as e:
            print(f"❌ translate_image 중 오류 발생: {e}")
            return None

