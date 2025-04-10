document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadBox = document.getElementById('upload-box');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const previewList = document.getElementById('preview-list');
    const clearFilesBtn = document.getElementById('clear-files');
    const analyzeBtn = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingContainer = document.getElementById('loading-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    // FAQ functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other open FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current FAQ
            item.classList.toggle('active');
        });
    });
    
    // File Upload Functionality
    let files = [];
    
    // Handle click on upload box
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', handleFileSelect);
    
    // Handle drag and drop
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // Clear files button
    clearFilesBtn.addEventListener('click', () => {
        clearFiles();
    });
    
    // Analyze button
    analyzeBtn.addEventListener('click', () => {
        if (files.length === 0) {
            showError('Please select at least one image to analyze.');
            return;
        }
        
        uploadFiles();
    });
    
    // Handle file selection
    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    }
    
    // Process selected files
    function handleFiles(selectedFiles) {
        hideError();
        
        // Validate file types
        const validFiles = Array.from(selectedFiles).filter(file => {
            const fileType = file.type.toLowerCase();
            return fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'image/png';
        });
        
        if (validFiles.length === 0) {
            showError('Please select valid image files (JPG, JPEG, PNG).');
            return;
        }
        
        // Add to files array
        files = [...files, ...validFiles];
        
        // Update UI
        updatePreview();
    }
    
    // Update preview UI
    function updatePreview() {
        if (files.length > 0) {
            previewContainer.classList.remove('hidden');
            renderPreviews();
        } else {
            previewContainer.classList.add('hidden');
        }
    }
    
    // Render file previews
    function renderPreviews() {
        previewList.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="filename">${file.name}</div>
                `;
                previewList.appendChild(previewItem);
                
                // Add event listener to remove button
                previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFile(index);
                });
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Remove a file
    function removeFile(index) {
        files.splice(index, 1);
        updatePreview();
    }
    
    // Clear all files
    function clearFiles() {
        files = [];
        fileInput.value = '';
        updatePreview();
    }
    
    // Show error message
    function showError(message) {
        errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorMessage.classList.remove('hidden');
    }
    
    // Hide error message
    function hideError() {
        errorMessage.classList.add('hidden');
    }
    
    // Upload files to server
    function uploadFiles() {
        hideError();
        
        // Show loading UI
        loadingContainer.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files[]', file);
        });
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 5;
                updateProgress(progress);
            }
        }, 200);
        
        // Send to server
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            clearInterval(progressInterval);
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Upload failed');
                });
            }
            
            updateProgress(100);
            return response.json();
        })
        .then(data => {
            // Store results in localStorage for results page
            localStorage.setItem('analysisResults', JSON.stringify(data.results));
            
            // Redirect to results page after a short delay
            setTimeout(() => {
                window.location.href = '/results';
            }, 500);
        })
        .catch(error => {
            clearInterval(progressInterval);
            loadingContainer.classList.add('hidden');
            showError(error.message);
        });
    }
    
    // Update progress UI
    function updateProgress(percent) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }
});