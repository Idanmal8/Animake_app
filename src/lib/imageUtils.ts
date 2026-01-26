/**
 * Compresses a base64 image string by resizing it and converting to JPEG.
 * @param base64 The input base64 string (with or without data URI prefix).
 * @param maxWidth The maximum width of the output image.
 * @param quality The JPEG quality (0 to 1).
 * @returns A Promise resolving to the compressed base64 string (with data URI prefix).
 */
export async function compressImage(
  base64: string,
  maxWidth = 1024,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64
    img.crossOrigin = 'anonymous' // Handle potential CORS if image comes from external URL

    img.onload = () => {
      let width = img.width
      let height = img.height

      // Scale down if width exceeds maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Export as JPEG with reduced quality
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }

    img.onerror = (err) => {
      reject(new Error('Failed to load image for compression: ' + err))
    }
  })
}
