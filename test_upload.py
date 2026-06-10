import sys
sys.path.append('backend')
from app import app
import io
import numpy as np
from PIL import Image

app.config['TESTING'] = True
client = app.test_client()

# Create noise image
noise = np.random.randint(0, 255, (400, 400, 3), dtype=np.uint8)
img = Image.fromarray(noise)
buf = io.BytesIO()
img.save(buf, 'JPEG')
buf.seek(0)

# Create token
from flask_jwt_extended import create_access_token
with app.app_context():
    token = create_access_token(identity='test_operator')

# Upload
try:
    res = client.post('/api/inspect/upload', 
                      headers={'Authorization': f'Bearer {token}'}, 
                      data={'image': (buf, 'test.jpg'), 'product': 'Bottle'})
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    import traceback
    traceback.print_exc()
