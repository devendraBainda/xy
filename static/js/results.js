document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('results-container');
    const resultsSummary = document.getElementById('results-summary');
    const downloadReportBtn = document.getElementById('download-report');
    
    // Load results from localStorage
    const results = JSON.parse(localStorage.getItem('analysisResults') || '[]');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                <h3>No Results Found</h3>
                <p>Please upload images for analysis first.</p>
                <a href="/" class="cta-button" style="margin-top: 1.5rem;">
                    Go to Upload Page
                </a>
            </div>
        `;
        resultsSummary.classList.add('hidden');
        return;
    }
    
    // Render results
    renderResults(results);
    
    // Render summary
    renderSummary(results);
    
    // Download report button
    downloadReportBtn.addEventListener('click', () => {
        generatePDF(results);
    });
    
    // Render results grid
    function renderResults(results) {
        resultsContainer.innerHTML = `
            <div class="results-grid">
                ${results.map((result, index) => `
                    <div class="result-card">
                        <div class="result-image">
                            <img src="${result.filepath}" alt="${result.filename}">
                        </div>
                        <div class="result-details">
                            ${result.error ? `
                                <h3>Processing Error</h3>
                                <p class="result-confidence">${result.error}</p>
                            ` : `
                                <h3>${result.class_name}</h3>
                                <p class="result-confidence">Confidence: ${result.confidence}%</p>
                                <p class="result-filename">${result.filename}</p>
                                <div class="result-tag ${result.is_benign ? 'benign' : 'malignant'}">
                                    ${result.is_benign ? 'Benign' : 'Malignant'}
                                </div>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Render summary statistics
    function renderSummary(results) {
        // Filter out errors
        const validResults = results.filter(result => !result.error);
        
        // Count by type
        const benignCount = validResults.filter(result => result.is_benign).length;
        const malignantCount = validResults.filter(result => !result.is_benign).length;
        
        // Calculate average confidence
        const avgConfidence = validResults.length > 0 
            ? Math.round(validResults.reduce((sum, result) => sum + result.confidence, 0) / validResults.length) 
            : 0;
        
        resultsSummary.innerHTML = `
            <h3>Analysis Summary</h3>
            <p>Summary of the ${validResults.length} analyzed image(s):</p>
            
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--success);">${benignCount}</div>
                    <div class="stat-label">Benign Tissues</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--danger);">${malignantCount}</div>
                    <div class="stat-label">Malignant Tissues</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--primary);">${avgConfidence}%</div>
                    <div class="stat-label">Avg. Confidence</div>
                </div>
            </div>
        `;
    }
    
    // Generate PDF report
    function generatePDF(results) {
        alert('PDF report generation would be implemented here in a production environment.');
        // In a real implementation, you would use a library like jsPDF to generate a PDF report
    }
});