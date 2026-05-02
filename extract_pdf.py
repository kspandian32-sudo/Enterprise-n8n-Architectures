import pypdf
import sys

def extract_pdf_text(pdf_path):
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <path_to_pdf>")
        sys.exit(1)
    
    path = sys.argv[1]
    text = extract_pdf_text(path)
    # Output to stdout using utf-8
    sys.stdout.buffer.write(text.encode('utf-8'))
