"""Barcode / QR Code Scanner using pyzbar"""

import io, cv2, numpy as np
from PIL import Image

try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    PYZBAR_OK = True
except ImportError:
    PYZBAR_OK = False


def decode_barcode(image_bytes: bytes):
    if not PYZBAR_OK: return None
    try:
        img     = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = pyzbar_decode(img)
        if results: return results[0].data.decode("utf-8")
        arr   = np.array(img)
        gray  = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        sharp = cv2.filter2D(gray, -1, [[-1,-1,-1],[-1,9,-1],[-1,-1,-1]])
        results = pyzbar_decode(Image.fromarray(sharp))
        return results[0].data.decode("utf-8") if results else None
    except Exception as e:
        print(f"[Barcode] Error: {e}"); return None


def generate_qr(data: str) -> bytes:
    import qrcode
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(data); qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO(); img.save(buf, format="PNG"); return buf.getvalue()
