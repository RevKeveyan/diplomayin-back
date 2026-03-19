const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Ensure uploads directory exists
const uploadPath = "uploads/products/";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage (temporary storage)
const storage = multer.memoryStorage(); // Store files in memory before processing

const upload = multer({ storage });

// Image optimization function
const optimizeImages = async (files) => {
  const processedFiles = [];

  for (const file of files) {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = path.join(uploadPath, filename);

    // Resize and compress image
    await sharp(file.buffer)
      .resize(800) // Set max width (maintains aspect ratio)
      .toFormat("webp") // Convert to WebP (smaller than JPEG/PNG)
      .webp({ quality: 80 }) // Adjust quality (80% is a good balance)
      .toFile(outputPath);

    processedFiles.push(`/uploads/products/${filename}`);
  }

  return processedFiles;
};

module.exports = { upload, optimizeImages };
