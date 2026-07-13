
import qrcode

url = "https://expo.dev/artifacts/eas/mTgw4UMw9erotSBdMqr7X8.apk"
img = qrcode.make(url)
img.save("AGRICOLA_MOBILE_QR.png")
print("QR Code salvo como AGRICOLA_MOBILE_QR.png")
