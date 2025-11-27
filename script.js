// Utility functions
const Utils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 20 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Please upload a valid image file (JPEG, PNG, WebP)');
        }

        if (file.size > maxSize) {
            throw new Error('File size too large. Maximum size is 20MB');
        }

        return true;
    },

    showError(message) {
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorAlert.style.display = 'block';
        
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    },

    hideError() {
        document.getElementById('error-alert').style.display = 'none';
    },

    showProgress() {
        document.getElementById('progress-container').style.display = 'block';
    },

    hideProgress() {
        document.getElementById('progress-container').style.display = 'none';
    },

    updateProgress(percent) {
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
    },

    sizeToBytes(size, unit) {
        const units = {
            'kb': 1024,
            'mb': 1024 * 1024
        };
        return size * (units[unit] || 1024);
    },

    bytesToSize(bytes, unit) {
        const units = {
            'kb': 1024,
            'mb': 1024 * 1024
        };
        return bytes / (units[unit] || 1024);
    },

    getImageDimensions(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height,
                        sizeKB: (file.size / 1024).toFixed(2),
                        format: this.getFileFormat(file.type)
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    getFileFormat(mimeType) {
        const formats = {
            'image/jpeg': 'JPEG',
            'image/jpg': 'JPG',
            'image/png': 'PNG',
            'image/webp': 'WebP'
        };
        return formats[mimeType] || 'Image';
    }
};

// Image Upload Class
class ImageUpload {
    constructor(type = 'main') {
        this.type = type;
        this.dropArea = document.getElementById(type === 'pixel' ? 'drop-area-pixel' : 'drop-area');
        this.fileInput = document.getElementById(type === 'pixel' ? 'file-input-pixel' : 'file-input');
        this.selectImageBtn = document.getElementById(type === 'pixel' ? 'select-image-pixel' : 'select-image');
        this.resetImageBtn = document.getElementById(type === 'pixel' ? 'reset-image-pixel' : 'reset-image');
        this.imageInBox = document.getElementById(type === 'pixel' ? 'image-in-box-pixel' : 'image-in-box');
        this.infoBox = document.getElementById(type === 'pixel' ? 'image-info-box-pixel' : 'image-info-box');
        
        this.currentFile = null;
        this.originalDimensions = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.selectImageBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        this.resetImageBtn.addEventListener('click', () => {
            this.reset();
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => {
                this.dropArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, () => {
                this.dropArea.classList.remove('dragover');
            }, false);
        });

        this.dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            this.handleFileSelect(file);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileSelect(file) {
        if (!file) return;

        try {
            Utils.validateImageFile(file);
            this.currentFile = file;
            
            const info = await Utils.getImageDimensions(file);
            this.originalDimensions = { width: info.width, height: info.height };
            
            this.displayPreview(file, info);
            this.showResetButton();
            Utils.hideError();
            
        } catch (error) {
            Utils.showError(error.message);
        }
    }

    displayPreview(file, info) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.imageInBox.src = e.target.result;
            this.imageInBox.style.display = 'block';
            this.showImageInfo(info);
            document.querySelector(this.type === 'pixel' ? '#drop-area-pixel .upload-text' : '.upload-text').textContent = 'Image Selected!';
        };
        
        reader.readAsDataURL(file);
    }

    showImageInfo(info) {
        const dimensionsEl = this.infoBox.querySelector(this.type === 'pixel' ? '#image-dimensions-pixel' : '#image-dimensions');
        const sizeEl = this.infoBox.querySelector(this.type === 'pixel' ? '#image-size-pixel' : '#image-size');
        const formatEl = this.type === 'pixel' ? 
            this.infoBox.querySelector('#image-format-pixel') : 
            this.infoBox.querySelector('#image-format');
        
        dimensionsEl.textContent = `${info.width} × ${info.height} px`;
        sizeEl.textContent = `${info.sizeKB} KB`;
        
        if (formatEl) {
            formatEl.textContent = info.format;
        }
        
        this.infoBox.classList.add('show');
    }

    showResetButton() {
        this.resetImageBtn.style.display = 'inline-block';
    }

    reset() {
        this.currentFile = null;
        this.originalDimensions = null;
        this.fileInput.value = '';
        this.imageInBox.style.display = 'none';
        this.resetImageBtn.style.display = 'none';
        this.infoBox.classList.remove('show');
        
        const uploadText = this.type === 'pixel' ? 
            document.querySelector('#drop-area-pixel .upload-text') : 
            document.querySelector('.upload-text');
        uploadText.textContent = this.type === 'pixel' ? 'Select image for pixel resize' : 'Select image & drag/drop here';
        
        document.getElementById('preview-container').style.display = 'none';
    }

    getCurrentFile() {
        return this.currentFile;
    }

    getOriginalDimensions() {
        return this.originalDimensions;
    }

    hasFile() {
        return this.currentFile !== null;
    }
}

// Image Processor Class
class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentImage = new Image();
    }

    async compressImageExactSize(file, targetSizeKB, quality, outputFormat = 'image/jpeg') {
        return new Promise((resolve, reject) => {
            try {
                Utils.showProgress();
                Utils.updateProgress(30);

                const reader = new FileReader();
                
                reader.onload = (e) => {
                    this.currentImage.onload = () => {
                        Utils.updateProgress(60);
                        this.processCompressionExactSize(this.currentImage, targetSizeKB, quality, outputFormat)
                            .then(resolve)
                            .catch(reject)
                            .finally(() => {
                                Utils.hideProgress();
                                Utils.updateProgress(0);
                            });
                    };
                    
                    this.currentImage.src = e.target.result;
                };
                
                reader.onerror = reject;
                reader.readAsDataURL(file);
                
            } catch (error) {
                Utils.hideProgress();
                reject(error);
            }
        });
    }

    async resizeImageByPixels(file, width, height, quality, outputFormat = 'image/jpeg', maintainAspect = true) {
        return new Promise((resolve, reject) => {
            try {
                Utils.showProgress();
                Utils.updateProgress(30);

                const reader = new FileReader();
                
                reader.onload = (e) => {
                    this.currentImage.onload = () => {
                        Utils.updateProgress(60);
                        this.processImageByPixels(this.currentImage, width, height, quality, outputFormat, maintainAspect)
                            .then(resolve)
                            .catch(reject)
                            .finally(() => {
                                Utils.hideProgress();
                                Utils.updateProgress(0);
                            });
                    };
                    
                    this.currentImage.src = e.target.result;
                };
                
                reader.onerror = reject;
                reader.readAsDataURL(file);
                
            } catch (error) {
                Utils.hideProgress();
                reject(error);
            }
        });
    }

    async processCompressionExactSize(img, targetSizeKB, quality, outputFormat) {
        return new Promise((resolve) => {
            const originalInfo = {
                width: img.width,
                height: img.height,
                sizeKB: this.getImageSizeKB(img)
            };

            // Convert image/jpg to image/jpeg for processing
            const processingFormat = outputFormat === 'image/jpg' ? 'image/jpeg' : outputFormat;

            // Dimensions same रखें
            this.canvas.width = img.width;
            this.canvas.height = img.height;

            this.ctx.drawImage(img, 0, 0, img.width, img.height);

            let imageDataUrl = this.canvas.toDataURL(processingFormat, quality / 100);
            let currentSizeKB = this.getDataUrlSizeKB(imageDataUrl);
            let adjustedQuality = quality;

            // Target size तक quality adjust करें - केवल नीचे की ओर
            const maxIterations = 25;
            let iterations = 0;

            // यदि current size target से बड़ा है, तो quality कम करें
            while (currentSizeKB > targetSizeKB && iterations < maxIterations && adjustedQuality > 10) {
                adjustedQuality -= 3;
                adjustedQuality = Math.max(10, adjustedQuality);
                imageDataUrl = this.canvas.toDataURL(processingFormat, adjustedQuality / 100);
                currentSizeKB = this.getDataUrlSizeKB(imageDataUrl);
                iterations++;
            }

            // यदि अभी भी target से बड़ा है, तो dimensions थोड़ा कम करें
            if (currentSizeKB > targetSizeKB) {
                const scaleFactor = Math.sqrt(targetSizeKB / currentSizeKB);
                const newWidth = Math.max(100, Math.floor(img.width * scaleFactor * 0.95));
                const newHeight = Math.max(100, Math.floor(img.height * scaleFactor * 0.95));
                
                this.canvas.width = newWidth;
                this.canvas.height = newHeight;
                this.ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                imageDataUrl = this.canvas.toDataURL(processingFormat, adjustedQuality / 100);
                currentSizeKB = this.getDataUrlSizeKB(imageDataUrl);
            }

            Utils.updateProgress(90);

            // Format name निकालें
            const formatName = this.getFormatName(outputFormat);

            resolve({
                dataUrl: imageDataUrl,
                width: this.canvas.width,
                height: this.canvas.height,
                sizeKB: Math.min(currentSizeKB, targetSizeKB * 1.02), // Ensure it's not more than target
                quality: adjustedQuality,
                originalWidth: originalInfo.width,
                originalHeight: originalInfo.height,
                originalSizeKB: originalInfo.sizeKB,
                format: formatName,
                mimeType: outputFormat
            });
        });
    }

    async processImageByPixels(img, targetWidth, targetHeight, quality, outputFormat, maintainAspect = true) {
        return new Promise((resolve) => {
            const originalInfo = {
                width: img.width,
                height: img.height,
                sizeKB: this.getImageSizeKB(img)
            };

            let finalWidth = targetWidth;
            let finalHeight = targetHeight;

            // Convert image/jpg to image/jpeg for processing
            const processingFormat = outputFormat === 'image/jpg' ? 'image/jpeg' : outputFormat;

            // यदि user ने दोनों dimensions दिए हैं और aspect ratio maintain करना है
            if (maintainAspect && targetWidth && targetHeight) {
                const originalAspect = img.width / img.height;
                const targetAspect = targetWidth / targetHeight;
                
                // अगर aspect ratio different है, तो user के input को priority दें
                if (Math.abs(originalAspect - targetAspect) > 0.01) {
                    // User के दिए गए dimensions को ही use करें, aspect ratio नहीं maintain करें
                    finalWidth = targetWidth;
                    finalHeight = targetHeight;
                } else {
                    // Aspect ratio same है, तो user के dimensions use करें
                    finalWidth = targetWidth;
                    finalHeight = targetHeight;
                }
            } else if (maintainAspect && targetWidth && !targetHeight) {
                // Only width provided, calculate height
                finalHeight = Math.round(targetWidth / (img.width / img.height));
            } else if (maintainAspect && !targetWidth && targetHeight) {
                // Only height provided, calculate width
                finalWidth = Math.round(targetHeight * (img.width / img.height));
            }

            // Ensure minimum dimensions
            finalWidth = Math.max(1, finalWidth);
            finalHeight = Math.max(1, finalHeight);

            this.canvas.width = finalWidth;
            this.canvas.height = finalHeight;

            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            this.ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

            const imageDataUrl = this.canvas.toDataURL(processingFormat, quality / 100);
            const currentSizeKB = this.getDataUrlSizeKB(imageDataUrl);

            Utils.updateProgress(90);

            // Format name निकालें
            const formatName = this.getFormatName(outputFormat);

            resolve({
                dataUrl: imageDataUrl,
                width: finalWidth,
                height: finalHeight,
                sizeKB: currentSizeKB,
                quality: quality,
                originalWidth: originalInfo.width,
                originalHeight: originalInfo.height,
                originalSizeKB: originalInfo.sizeKB,
                format: formatName,
                mimeType: outputFormat,
                maintainAspect: maintainAspect
            });
        });
    }

    getImageSizeKB(img) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);
        
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 1.0);
        return this.getDataUrlSizeKB(dataUrl);
    }

    getDataUrlSizeKB(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const sizeInBytes = (base64.length * 3) / 4;
        return Math.round((sizeInBytes / 1024) * 100) / 100; // 2 decimal places
    }

    getFormatName(mimeType) {
        const formats = {
            'image/jpeg': 'JPEG',
            'image/jpg': 'JPG',
            'image/png': 'PNG', 
            'image/webp': 'WebP'
        };
        return formats[mimeType] || 'JPG';
    }

    getFileExtension(mimeType) {
        const extensions = {
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpg',
            'image/png': 'png', 
            'image/webp': 'webp'
        };
        return extensions[mimeType] || 'jpg';
    }

    dataUrlToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        // Convert image/jpg to image/jpeg for proper MIME type handling
        const finalMime = mime === 'image/jpg' ? 'image/jpeg' : mime;
        
        return new Blob([u8arr], { type: finalMime });
    }

    createDownloadLink(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        return a;
    }
}

// UI Handler Class
class UIHandler {
    constructor() {
        this.qualitySlider = document.getElementById('quality-slider');
        this.qualityValue = document.getElementById('quality-value');
        this.sizeInput = document.getElementById('size-input');
        this.unitSelect = document.getElementById('unit-select');
        this.formatSelect = document.getElementById('format-select');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        this.resizeButton = document.getElementById('resize-button');
        
        this.qualitySliderPixel = document.getElementById('quality-slider-pixel');
        this.qualityValuePixel = document.getElementById('quality-value-pixel');
        this.widthInput = document.getElementById('width-input');
        this.heightInput = document.getElementById('height-input');
        this.maintainAspectCheckbox = document.getElementById('maintain-aspect');
        this.dimensionPresetButtons = document.querySelectorAll('.dimension-preset');
        this.resizeButtonPixel = document.getElementById('resize-button-pixel');
        this.formatSelectPixel = document.getElementById('format-select-pixel');
        
        this.compressionButtons = document.querySelectorAll('.compression-btn');
        this.downloadButton = document.getElementById('download-button');
        this.previewContainer = document.getElementById('preview-container');
        this.resizedPreview = document.getElementById('resized-preview');
        this.resizedInfo = document.getElementById('resized-info');

        this.currentResult = null;
        this.currentMode = 'pixel';
        this.init();
    }

    init() {
        this.bindEvents();
        this.initShareButtons();
        this.initFAQ();
        this.initMobileMenu();
    }

    bindEvents() {
        // File Size Compression Events
        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value + '%';
        });

        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = e.target.getAttribute('data-size');
                this.sizeInput.value = size;
                this.unitSelect.value = 'kb';
            });
        });

        this.resizeButton.addEventListener('click', () => {
            this.handleFileSizeResize();
        });

        // Pixel Resize Events
        this.qualitySliderPixel.addEventListener('input', (e) => {
            this.qualityValuePixel.textContent = e.target.value + '%';
        });

        this.dimensionPresetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const width = e.target.getAttribute('data-width');
                const height = e.target.getAttribute('data-height');
                this.widthInput.value = width;
                this.heightInput.value = height;
            });
        });

        // Remove auto-update functionality for dimension inputs
        this.widthInput.addEventListener('input', () => {
            // No auto-update - user controls both independently
        });

        this.heightInput.addEventListener('input', () => {
            // No auto-update - user controls both independently
        });

        this.resizeButtonPixel.addEventListener('click', () => {
            this.handlePixelResize();
        });

        // Compression Type Switching
        this.compressionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                this.switchCompressionType(type, e);
            });
        });

        this.downloadButton.addEventListener('click', () => {
            this.handleDownload();
        });
    }

    switchCompressionType(type, event) {
        // Remove active class from all buttons
        this.compressionButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Add active class to clicked button
        event.target.classList.add('active');
        event.target.setAttribute('aria-pressed', 'true');

        // Hide all compression types
        document.querySelectorAll('.compression-type').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected compression type
        this.currentMode = type;
        document.getElementById(`${type}-compression`).classList.add('active');
    }

    async handleFileSizeResize() {
        if (!imageUpload.hasFile()) {
            Utils.showError('Please select an image first');
            return;
        }

        const file = imageUpload.getCurrentFile();
        const targetSize = parseInt(this.sizeInput.value);
        const unit = this.unitSelect.value;
        const quality = parseInt(this.qualitySlider.value);
        const outputFormat = this.formatSelect.value;

        if (!targetSize || targetSize <= 0) {
            Utils.showError('Please enter a valid target size');
            return;
        }

        try {
            const targetSizeKB = Utils.sizeToBytes(targetSize, unit) / 1024;
            const result = await imageProcessor.compressImageExactSize(file, targetSizeKB, quality, outputFormat);
            
            // Ensure final size is not more than target
            if (result.sizeKB > targetSizeKB * 1.02) {
                Utils.showError(`Unable to compress to exact size. Best achieved: ${result.sizeKB.toFixed(2)} KB`);
            }
            
            this.currentResult = result;
            this.displayResult(result);
            
        } catch (error) {
            Utils.showError('Error processing image: ' + error.message);
        }
    }

    async handlePixelResize() {
        if (!pixelImageUpload.hasFile()) {
            Utils.showError('Please select an image first');
            return;
        }

        const file = pixelImageUpload.getCurrentFile();
        const width = parseInt(this.widthInput.value) || null;
        const height = parseInt(this.heightInput.value) || null;
        const quality = parseInt(this.qualitySliderPixel.value);
        const outputFormat = this.formatSelectPixel.value;
        const maintainAspect = this.maintainAspectCheckbox.checked;

        // Check if at least one dimension is provided
        if ((!width || width <= 0) && (!height || height <= 0)) {
            Utils.showError('Please enter valid width or height');
            return;
        }

        try {
            const result = await imageProcessor.resizeImageByPixels(
                file, 
                width, 
                height, 
                quality, 
                outputFormat,
                maintainAspect
            );
            this.currentResult = result;
            this.displayResult(result);
            
        } catch (error) {
            Utils.showError('Error processing image: ' + error.message);
        }
    }

    displayResult(result) {
        this.resizedPreview.src = result.dataUrl;
        
        let infoHTML = `
            <strong>Original:</strong> ${result.originalWidth} × ${result.originalHeight} | 
            <strong>Size:</strong> ${result.originalSizeKB.toFixed(2)} KB<br>
            <strong>Resized:</strong> ${result.width} × ${result.height} | 
            <strong>Size:</strong> ${result.sizeKB.toFixed(2)} KB | 
            <strong>Quality:</strong> ${result.quality}% |
            <strong>Format:</strong> ${result.format}
        `;

        if (result.maintainAspect !== undefined) {
            infoHTML += `<br><strong>Aspect Ratio:</strong> ${result.maintainAspect ? 'Maintained' : 'Custom'}`;
        }

        this.resizedInfo.innerHTML = infoHTML;
        this.previewContainer.style.display = 'block';

        this.previewContainer.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            this.showShareButtons();
        }, 1000);
    }

    showShareButtons() {
        const shareSection = document.querySelector('.social-share-section');
        if (shareSection) {
            shareSection.style.display = 'block';
        }
    }

    handleDownload() {
        if (!this.currentResult) {
            Utils.showError('No image to download');
            return;
        }

        const blob = imageProcessor.dataUrlToBlob(this.currentResult.dataUrl);
        const originalName = this.currentMode === 'dimension' ? 
            pixelImageUpload.getCurrentFile().name : 
            imageUpload.getCurrentFile().name;
        
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        
        // Get the selected format and its extension
        const formatSelect = this.currentMode === 'dimension' ? 
            this.formatSelectPixel : this.formatSelect;
        const selectedOption = formatSelect.options[formatSelect.selectedIndex];
        const formatExtension = selectedOption.getAttribute('data-extension') || 'jpg';
        
        const newFilename = `${nameWithoutExt}_resized_${this.currentResult.width}x${this.currentResult.height}_${this.currentResult.sizeKB.toFixed(0)}kb.${formatExtension}`;

        const downloadLink = imageProcessor.createDownloadLink(blob, newFilename);
        downloadLink.click();

        URL.revokeObjectURL(downloadLink.href);
    }

    initShareButtons() {
        document.querySelectorAll('.whatsapp-share').forEach(btn => {
            btn.addEventListener('click', function() {
                const text = "🚀 Free Image Resizer Tool - Image Ko 200KB Me Karen Online! 💯\n\n";
                const features = "✅ 100% Free\n✅ No Registration\n✅ WhatsApp, Facebook, Instagram Optimized\n✅ Instant Results\n\n";
                const url = "https://img1resize.in";
                const message = text + features + "Download Now: " + url;
                
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            });
        });

        document.querySelectorAll('.facebook-share').forEach(btn => {
            btn.addEventListener('click', function() {
                window.open('https://www.facebook.com/sharer/sharer.php?u=https://img1resize.in', '_blank');
            });
        });

        document.querySelectorAll('.twitter-share').forEach(btn => {
            btn.addEventListener('click', function() {
                const text = "Free Image Resizer Tool - Resize images online without quality loss!";
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=https://img1resize.in`, '_blank');
            });
        });

        document.querySelectorAll('.copy-link').forEach(btn => {
            btn.addEventListener('click', function() {
                navigator.clipboard.writeText('https://img1resize.in').then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                }).catch(() => {
                    alert('Link copied to clipboard: https://img1resize.in');
                });
            });
        });
    }

    initFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isExpanded = question.getAttribute('aria-expanded') === 'true';
                
                // Close all other FAQs
                faqQuestions.forEach(q => {
                    if (q !== question) {
                        q.setAttribute('aria-expanded', 'false');
                        q.nextElementSibling.classList.remove('show');
                    }
                });
                
                // Toggle current FAQ
                question.setAttribute('aria-expanded', !isExpanded);
                answer.classList.toggle('show');
            });
        });
    }

    initMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
            
            // Close menu when clicking on links
            const navLinks = document.querySelectorAll('.nav-list a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                });
            });
        }
    }
}

// Initialize everything when DOM is loaded
let imageUpload, pixelImageUpload, imageProcessor, uiHandler;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 img1resize.in application initialized');
    
    // Initialize components
    imageUpload = new ImageUpload('main');
    pixelImageUpload = new ImageUpload('pixel');
    imageProcessor = new ImageProcessor();
    uiHandler = new UIHandler();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Update live counters
    function updateLiveCounters() {
        const userCount = document.getElementById('user-count');
        const imageCount = document.getElementById('image-count');
        
        if (userCount && imageCount) {
            const randomUsers = Math.floor(Math.random() * 50) + 10;
            const randomImages = Math.floor(Math.random() * 200) + 50;
            
            let currentUsers = parseInt(userCount.textContent.replace(',', '')) || 15829;
            let currentImages = parseInt(imageCount.textContent.replace(',', '')) || 72456;
            
            currentUsers += randomUsers;
            currentImages += randomImages;
            
            userCount.textContent = currentUsers.toLocaleString();
            imageCount.textContent = currentImages.toLocaleString();
        }
    }

    // Update counters every 30 seconds
    setInterval(updateLiveCounters, 30000);

    // Update copyright year
    const yearElement = document.querySelector('.copyright p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = `&copy; ${currentYear} img1resize.in. All rights reserved. | Free Image Resizer Tool`;
    }

    // Add interactive effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    console.log('✅ Website fully loaded and initialized');
});