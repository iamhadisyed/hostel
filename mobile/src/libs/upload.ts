import * as ImagePicker from 'expo-image-picker'

/**
 * Opens the photo library and returns a FormData-ready file object,
 * or null if the user cancelled / permission was denied.
 */
export const pickImageFile = async (): Promise<{ uri: string; name: string; type: string } | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (!permission.granted) {
    return null
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8
  })

  if (result.canceled || !result.assets?.[0]) {
    return null
  }

  const asset = result.assets[0]
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? `upload-${Date.now()}.jpg`
  const type = asset.mimeType ?? 'image/jpeg'

  return { uri: asset.uri, name, type }
}

export const appendFileToFormData = (formData: FormData, field: string, file: { uri: string; name: string; type: string }) => {
  // React Native's FormData accepts this shape even though it doesn't match the DOM File type.
  formData.append(field, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob)
}
