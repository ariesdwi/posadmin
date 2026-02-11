import imageCompression from 'browser-image-compression';

/**
 * Validates an image file for type and size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum allowed size in MB (default: 3)
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 3
): { isValid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.',
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      error: `Ukuran file terlalu besar (${fileSizeMB.toFixed(2)}MB). Maksimal ${maxSizeMB}MB.`,
    };
  }

  return { isValid: true };
};

/**
 * Compresses an image file
 * @param file - The image file to compress
 * @param maxSizeMB - Target maximum size in MB (default: 1)
 * @returns Compressed file
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 1
): Promise<File> => {
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Log compression results
    const originalSizeMB = file.size / (1024 * 1024);
    const compressedSizeMB = compressedFile.size / (1024 * 1024);
    console.log(
      `Image compressed: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`
    );

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Gagal mengompresi gambar. Silakan coba lagi.');
  }
};

/**
 * Validates and compresses an image file
 * @param file - The image file to process
 * @param maxSizeMB - Maximum allowed size before compression (default: 3)
 * @returns Processed file ready for upload
 */
export const processImageFile = async (
  file: File,
  maxSizeMB: number = 3
): Promise<{ file: File; error?: string }> => {
  // Validate first
  const validation = validateImageFile(file, maxSizeMB);
  if (!validation.isValid) {
    return { file, error: validation.error };
  }

  // Compress if file is larger than 1MB
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > 1) {
    try {
      const compressedFile = await compressImage(file, 1);
      return { file: compressedFile };
    } catch (error) {
      return { file, error: (error as Error).message };
    }
  }

  return { file };
};
