import requests, os, json, traceback, re
from PIL import Image
from io import BytesIO
from flask import Flask, request, jsonify

app = Flask(__name__)

# Enterprise Configuration
COMPOSIO_API_KEY = "ak_opSJBncBYg60tnCsjuJT"
IG_USER_ID = "27135504529380775"

def run_composio_tool(tool_slug, arguments):
    """
    Executes a tool via the Composio V2/V3 Backend API directly.
    """
    # Updated to V3 execute endpoint
    url = f"https://backend.composio.dev/api/v3.1/tools/execute/{tool_slug}"
    headers = {
        "x-api-key": COMPOSIO_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "entity_id": "pg-test-06807f08-6269-4077-a0d8-b0f7fce89863",
        "connected_account_id": "ca_KtYMFNtICMjW",
        "arguments": arguments
    }
    print(f"Executing Composio Tool: {tool_slug}")
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    
    if r.status_code != 200:
        raise Exception(f"Composio API Error ({r.status_code}): {r.text}")
    
    res = r.json()
    # Handle the structure where the actual response is in data.result or similar
    return res

def get_direct_image_url(url):
    """
    Resolves Ideogram gallery pages to direct image file URLs.
    """
    if "ideogram.ai" in url and ("/g/" in url or "/p/" in url):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        try:
            r = requests.get(url, headers=headers, timeout=30)
            match = re.search(r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', r.text)
            if not match:
                match = re.search(r'content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', r.text)
            if match:
                return match.group(1)
        except:
            pass
    return url

@app.route('/publish', methods=['POST'])
def publish():
    log_file = r'C:\AI-SEO\bridge_log.txt'
    with open(log_file, 'a', encoding='utf-8') as log:
        try:
            data = request.json
            log.write(f"\n--- Request Received ---\n{json.dumps(data, indent=2)}\n")
            
            image_url = data.get('image_url')
            caption = data.get('caption')
            
            if not image_url or not caption:
                return jsonify({'success': False, 'error': 'Missing parameters'}), 400

            # 1. Resolve & Fetch
            resolved_url = get_direct_image_url(image_url)
            log.write(f"Resolved URL: {resolved_url}\n")
            
            r = requests.get(resolved_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
            img = Image.open(BytesIO(r.content))
            
            temp_path = r'C:\AI-SEO\post.jpg'
            img.convert('RGB').save(temp_path, 'JPEG')
            log.write("Converted to JPEG\n")

            # 2. Re-host
            r = requests.post('https://tmpfiles.org/api/v1/upload', files={'file': open(temp_path, 'rb')}, timeout=30)
            public_url = r.json()['data']['url'].replace('tmpfiles.org/', 'tmpfiles.org/dl/')
            log.write(f"Direct Public URL: {public_url}\n")

            # 3. Create Media Container (Composio API V2)
            # Use 'instagram_post_ig_user_media' or check the exact slug required for V2
            container_res = run_composio_tool("instagram_post_ig_user_media", {
                "ig_user_id": IG_USER_ID,
                "image_url": public_url,
                "caption": caption
            })
            log.write(f"Container Response: {json.dumps(container_res)}\n")
            
            # The structure for V2 might be container_res['data']['response_data']['id'] 
            # or container_res['data']['id']. Let's try to be flexible.
            creation_id = None
            if 'data' in container_res:
                if 'id' in container_res['data']:
                    creation_id = container_res['data']['id']
                elif 'response_data' in container_res['data'] and 'id' in container_res['data']['response_data']:
                    creation_id = container_res['data']['response_data']['id']
            
            if not creation_id:
                raise Exception(f"Could not find creation_id in response: {json.dumps(container_res)}")

            # 4. Publish (Composio API V2)
            publish_res = run_composio_tool("instagram_post_ig_user_media_publish", {
                "ig_user_id": IG_USER_ID,
                "creation_id": creation_id
            })
            log.write(f"Publish Response: {json.dumps(publish_res)}\n")
            
            return jsonify({'success': True, 'data': publish_res})
            
        except Exception as e:
            err = traceback.format_exc()
            log.write(f"CRITICAL ERROR:\n{err}\n")
            return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007)
