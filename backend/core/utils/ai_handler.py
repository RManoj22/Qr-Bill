import os
import json
import base64
import requests
import fitz  # PyMuPDF
import openai
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")


import base64
import requests
from io import BytesIO
from PIL import Image

def encode_image(image_url, converted=False):
    """Fetch an image from a URL and convert it to a base64-encoded string."""
    try:
        response = requests.get(image_url)
        if response.status_code != 200:
            return {"error": "Failed to download image"}

        if converted:
            image = Image.open(BytesIO(response.content))
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_byte_array = buffered.getvalue()
        else:
            img_byte_array = response.content

        return base64.b64encode(img_byte_array).decode("utf-8")

    except Exception as e:
        return {"error": str(e)}



def convert_pdf_to_image(pdf_bytes):
    """Convert the first page of a PDF to an image."""
    try:
        pdf_file = BytesIO(pdf_bytes)
        pdf_document = fitz.open(stream=pdf_file, filetype="pdf")
        page = pdf_document[0]
        pix = page.get_pixmap()
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return image, None
    except Exception as e:
        return None, str(e)


def extract_text_from_image(base64_image):
    """Send a request to OpenAI API to extract text from the image."""
    try:
        prompt = """You are an AI expert in extracting the details. Extract the details from this bill in a structured JSON format covering:
        - Vendor Name
        - Bill Category (e.g., grocery, electronics, hardwares)
        - Date
        - Total Bill Amount
        - SGST Percentage
        - SGST Amount
        - CGST Percentage
        - CGST Amount
        - Total Tax Percentage
        - Total Tax Amount
        - Transport (Look for packing and forwarding charges or delivery charges. If either is found, use that amount as the Transport value)
        - Discount (Look for amounts with (-) prefix or mentioned as discount/less amount)
        - Rounded Off
        - Loading/Unloading Charges
        - Item Details (Name, Quantity(QTY)(kgs,nos), Price of total no of quantity)
        If any field is not found, return 'UNKNOWN'.
        """

        chat_completion = openai.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ]
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return {"error": str(e)}


def process_file_from_url(file_url):
    """Download the file from the URL, convert it if necessary, and extract text."""
    print("file url in process func", file_url)
    # response = requests.get(file_url)
    # if response.status_code != 200:
    #     return {"error": "Unable to download file"}

    # content_type = response.headers.get("Content-Type", "")

    # base64_image = None

    # if "image" in content_type:
    #     base64_image = encode_image(response.content)
    # elif "pdf" in content_type:
    #     image, error = convert_pdf_to_image(response.content)
    #     if error:
    #         return {"error": f"PDF Conversion Error: {error}"}
    #     base64_image = encode_image(image, converted=True)
    # else:
    #     return {"error": "Unsupported file type"}

    base64_image =  encode_image(file_url)    
    extracted_text = extract_text_from_image(base64_image)
    print("extracted text", extracted_text)
    try:
        cleaned_response = extracted_text.strip().replace("```json", "").replace("```", "").strip()
        extracted_data = json.loads(cleaned_response)
        print("cleaned response", extracted_data)
        return extracted_data
    except json.JSONDecodeError:
        return {"error": "Failed to parse API response as JSON"}
