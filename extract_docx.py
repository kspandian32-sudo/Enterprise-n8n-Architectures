import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            texts = []
            for paragraph in tree.findall('.//w:p', ns):
                para_text = ""
                for run in paragraph.findall('.//w:t', ns):
                    if run.text:
                        para_text += run.text
                if para_text:
                    texts.append(para_text)
            
            return "\n".join(texts)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    path = sys.argv[1]
    text = extract_text(path)
    sys.stdout.buffer.write(text.encode('utf-8'))
