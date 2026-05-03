import imageCompression from 'browser-image-compression';

export const processProfileImage = async (file: File): Promise<string | null> => {
  // 1. Log the original size
  console.log(`📸 Original file size: ${(file.size / 1024 / 1024).toFixed(3)} MB`);

  const options = {
    maxSizeMB: 0.1, // Increased to 100KB so the algorithm doesn't "give up"
    maxWidthOrHeight: 400, // Slightly larger for better mobile clarity
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.7, // NEW: Force the image to lose 30% quality immediately
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // 2. Log the compressed size
    console.log(`📉 Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(3)} MB`);

    const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
    return base64; 
  } catch (error) {
    console.error("Compression failed:", error);
    return null;
  }
};