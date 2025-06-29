const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileList = document.getElementById('fileList');
const outputPrefixInput = document.getElementById('outputPrefix');
const outputPrefixError = document.getElementById('outputPrefixError');
const generateBtn = document.getElementById('generateBtn');
const generateResults = document.getElementById('generateResults');
const generateResultsContent = document.getElementById('generateResultsContent');
const hFileDisplay = document.getElementById('hFileDisplay');
const hFileContent = document.getElementById('hFileContent');

// Supported file types (sox compatible formats)
const supportedTypes = ['.wav', '.aiff', '.aif', '.flac', '.mp3', '.ogg', '.m4a', '.wma', '.au', '.snd'];

// Maximum file size (5MB in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Click to select files
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Handle file input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);
outputPrefixInput.addEventListener('input', validateOutputPrefix);

// Handle Generate button click
generateBtn.addEventListener('click', handleGenerate);

function validateAndToggleButton(){
    validateOutputPrefix();
}

function handleGenerate() {
    const outputPrefix = outputPrefixInput.value;
    const samplingRate = document.getElementById('samplingRate').value;
    
    if (!outputPrefix) {
        alert('Please enter an output prefix');
        return;
    }
    
    // Disable button during processing
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            output_prefix: outputPrefix,
            sampling_rate: samplingRate
        })
    })
    .then(response => response.json())
    .then(data => {
        generateBtn.textContent = 'Generate';
        if (data.success) {
            displayGenerationResults(data.results);
            console.log('Generation results:', data.results);
        } else {
            displayGenerationError(data.error, data.details);
            console.error('Generation error:', data.error, data.details);
        }
    })
    .catch(error => {
        generateBtn.textContent = 'Generate';
        console.error('Error:', error);
        displayGenerationError('An error occurred during generation', error.toString());
    });
}

function displayGenerationResults(results) {
    console.log('Displaying generation results:', results);
    generateResultsContent.innerHTML = '';
    hFileContent.innerHTML = '';
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.style.marginBottom = '15px';
            resultItem.style.padding = '10px';
            resultItem.style.backgroundColor = '#d4edda';
            resultItem.style.border = '1px solid #c3e6cb';
            resultItem.style.borderRadius = '5px';
            
            const resultText = document.createElement('div');
            resultText.innerHTML = `<strong>Generated:</strong> ${result.output_file} from ${result.raw_file}`;
            resultItem.appendChild(resultText);
            
            if (result.char2mozzi_output) {
                const outputPre = document.createElement('pre');
                outputPre.textContent = result.char2mozzi_output;
                outputPre.style.backgroundColor = '#f8f9fa';
                outputPre.style.padding = '10px';
                outputPre.style.marginTop = '10px';
                outputPre.style.borderRadius = '3px';
                outputPre.style.fontSize = '12px';
                resultItem.appendChild(outputPre);
            }
            
            generateResultsContent.appendChild(resultItem);
            
            // Display .h file content in the new section
            if (result.h_file_content) {
                const hFileItem = document.createElement('div');
                hFileItem.style.marginBottom = '20px';
                
                const hFileHeader = document.createElement('div');
                hFileHeader.style.display = 'flex';
                hFileHeader.style.alignItems = 'center';
                hFileHeader.style.marginBottom = '10px';
                hFileHeader.style.gap = '10px';
                
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download';
                downloadBtn.style.padding = '5px 15px';
                downloadBtn.style.backgroundColor = '#007bff';
                downloadBtn.style.color = 'white';
                downloadBtn.style.border = 'none';
                downloadBtn.style.borderRadius = '3px';
                downloadBtn.style.cursor = 'pointer';
                downloadBtn.style.fontSize = '12px';
                downloadBtn.addEventListener('click', () => {
                    downloadFile(result.h_file_content, result.output_file);
                });
                hFileHeader.appendChild(downloadBtn);
                
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy';
                copyBtn.style.padding = '5px 15px';
                copyBtn.style.backgroundColor = '#28a745';
                copyBtn.style.color = 'white';
                copyBtn.style.border = 'none';
                copyBtn.style.borderRadius = '3px';
                copyBtn.style.cursor = 'pointer';
                copyBtn.style.fontSize = '12px';
                copyBtn.addEventListener('click', () => {
                    copyToClipboard(result.h_file_content, copyBtn);
                });
                hFileHeader.appendChild(copyBtn);
                
                const hFileTitle = document.createElement('h4');
                hFileTitle.textContent = result.output_file;
                hFileTitle.style.margin = '0';
                hFileTitle.style.color = '#333';
                hFileHeader.appendChild(hFileTitle);
                
                hFileItem.appendChild(hFileHeader);
                
                const hFilePre = document.createElement('pre');
                hFilePre.textContent = result.h_file_content;
                hFilePre.style.backgroundColor = '#fff';
                hFilePre.style.padding = '15px';
                hFilePre.style.border = '1px solid #ddd';
                hFilePre.style.borderRadius = '3px';
                hFilePre.style.fontSize = '13px';
                hFilePre.style.maxHeight = '500px';
                hFilePre.style.overflowY = 'auto';
                hFilePre.style.fontFamily = 'monospace';
                hFileItem.appendChild(hFilePre);
                
                hFileContent.appendChild(hFileItem);
            }
        });
        generateResults.style.display = 'block';
        if (hFileContent.innerHTML.trim() !== '') {
            hFileDisplay.style.display = 'block';
        }
}

function displayGenerationError(error, details) {
    generateResultsContent.innerHTML = '';
    const errorItem = document.createElement('div');
    errorItem.style.padding = '10px';
    errorItem.style.backgroundColor = '#f8d7da';
    errorItem.style.border = '1px solid #f5c6cb';
    errorItem.style.borderRadius = '5px';
    errorItem.style.color = '#721c24';
    
    errorItem.innerHTML = `<strong>Error:</strong> ${error}`;
    
    if (details) {
        const detailsPre = document.createElement('pre');
        detailsPre.textContent = details;
        detailsPre.style.backgroundColor = '#ffeaa7';
        detailsPre.style.padding = '10px';
        detailsPre.style.marginTop = '10px';
        detailsPre.style.borderRadius = '3px';
        detailsPre.style.fontSize = '12px';
        errorItem.appendChild(detailsPre);
    }
    
    generateResultsContent.appendChild(errorItem);
    generateResults.style.display = 'block';
}

function validateOutputPrefix() {
    const value = outputPrefixInput.value;
    // C variable name regex: starts with letter or underscore, followed by letters, numbers, or underscores
    const isValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
    if (isValid || value === '') {
        outputPrefixError.style.display = 'none';
    } else {
        outputPrefixError.style.display = 'inline';
        // Disable Generate button when showing error message
        generateBtn.disabled = true;
    }
    return isValid && value !== '';
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    dropZone.classList.add('dragover');
}

function unhighlight(e) {
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    const validFiles = [];
    const invalidFiles = [];
    const oversizedFiles = [];
    
    [...files].forEach(file => {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (file.size > MAX_FILE_SIZE) {
            oversizedFiles.push(file);
        } else if (supportedTypes.includes(fileExtension)) {
            validFiles.push(file);
        } else {
            invalidFiles.push(file);
        }
    });
    if (validFiles.length > 0) {
        outputPrefixInput.disabled = false;
        const firstFile = validFiles[0];
        let fileNameWithoutExt = firstFile.name.lastIndexOf('.') != -1 ? firstFile.name.substring(0, firstFile.name.lastIndexOf('.')) : firstFile.name;
        // Replace invalid C variable name characters with underscores
        fileNameWithoutExt = fileNameWithoutExt.replace(/[^a-zA-Z0-9_]/g, '_');
        // Ensure it starts with a letter or underscore
        if (/^[0-9]/.test(fileNameWithoutExt)) {
            fileNameWithoutExt = '_' + fileNameWithoutExt;
        }
        outputPrefixInput.value = fileNameWithoutExt;
        fileList.innerHTML = ''; // Clear previous list
        validFiles.forEach(uploadFile);
        fileInfo.style.display = 'block';
        // Hide and clear Generation Results when new files are uploaded
        generateResults.style.display = 'none';
        generateResultsContent.innerHTML = '';
        // Also hide the H file display section
        hFileDisplay.style.display = 'none';
        hFileContent.innerHTML = '';
    } else {
        outputPrefixInput.disabled = true;
        outputPrefixInput.value = '';
    }
    
    if (oversizedFiles.length > 0) {
        alert(`Files too large (max 5MB): ${oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(', ')}`);
    }
    
    if (invalidFiles.length > 0) {
        alert(`Unsupported file types detected: ${invalidFiles.map(f => f.name).join(', ')}\nSupported formats: ${supportedTypes.join(', ')}`);
    }
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard(content, buttonElement) {
    console.log('Copying to clipboard:', content);
    navigator.clipboard.writeText(content).then(() => {
        console.log('Copying to clipboard was successful');
        showCopySuccess(buttonElement);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function fallbackCopyTextToClipboard(text, buttonElement) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(buttonElement);
        } else {
            alert('Failed to copy to clipboard');
        }
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        alert('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess(buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Copied!';
    buttonElement.style.backgroundColor = '#198754';
    setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.backgroundColor = '#28a745';
    }, 1000);
}

function uploadFile(file) {
    const uploadItem = document.createElement('li');
    uploadItem.textContent = `${file.name}: converting...`;
    fileList.appendChild(uploadItem);
    const formData = new FormData();
    formData.append('file', file);
    const samplingRate = document.getElementById('samplingRate').value;
    formData.append('sampling_rate', samplingRate);
    const outputPrefix = document.getElementById('outputPrefix').value;
    formData.append('output_prefix', outputPrefix);
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        uploadItem.innerHTML = ''; // Clear "converting..." message
        if (data.filepath) {
            const fileInfoSpan = document.createElement('span');
            fileInfoSpan.textContent = `Original: ${data.original_filename}, Saved as: ${data.filepath}`;
            uploadItem.appendChild(fileInfoSpan);
            if(data.sox_output) {
                const pre = document.createElement('pre');
                pre.textContent = data.sox_output;
                pre.style.backgroundColor = '#eee';
                pre.style.padding = '10px';
                pre.style.marginTop = '10px';
                uploadItem.appendChild(pre);
            }
            if(data.raw_filepath) {
                const rawPathSpan = document.createElement('span');
                rawPathSpan.textContent = ` -> RAW file: ${data.raw_filepath}`;
                rawPathSpan.style.fontWeight = 'bold';
                uploadItem.appendChild(rawPathSpan);
            }
            // Enable Generate button when sox processing is successful
            generateBtn.disabled = false;
        } else if (data.error) {
            console.error('Upload Error:', data.error, data.details);
            uploadItem.textContent = `Error uploading ${file.name}: ${data.error}`;
            if(data.details){
                const pre = document.createElement('pre');
                pre.textContent = data.details;
                pre.style.backgroundColor = '#fdd';
                pre.style.padding = '10px';
                pre.style.marginTop = '10px';
                uploadItem.appendChild(pre);
            }
            uploadItem.style.color = 'red';
        }
    })
    .catch(error => {
        uploadItem.innerHTML = ''; // Clear "converting..." message
        console.error('Error:', error);
        uploadItem.textContent = `Error uploading ${file.name}. See console for details.`;
        uploadItem.style.color = 'red';
    });
}