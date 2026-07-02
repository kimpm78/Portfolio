type CloudinaryUploadResult = {
  url: string
  publicId: string
  width: number
  height: number
  format: string
}

export const uploadImageToCloudinary = async (
  file: File,
  folder = 'portfolio',
): Promise<CloudinaryUploadResult> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not set')
  }

  if (!uploadPreset) {
    throw new Error('VITE_CLOUDINARY_UPLOAD_PRESET is not set')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.error?.message || `Cloudinary upload failed (${response.status})`

    throw new Error(message)
  }

  const data = await response.json()

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  }
}
