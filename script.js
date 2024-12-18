function getHighlightClass(type) {
    type = type.toLowerCase();
    if (type.includes('grammar')) return 'highlight-grammar';
    if (type.includes('spelling')) return 'highlight-spelling';
    if (type.includes('style')) return 'highlight-style';
    return 'highlight-other';
}

function highlightEditedText(text, changes) {
    let highlightedText = text;
    // Sort changes by length (longest first) to handle overlapping changes
    const sortedChanges = changes.slice().sort((a, b) => b.after.length - a.after.length);
    
    sortedChanges.forEach(change => {
        const highlightClass = getHighlightClass(change.type);
        // Escape special characters in the search string
        const searchRegex = new RegExp(change.after.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        highlightedText = highlightedText.replace(
            searchRegex,
            `<span class="${highlightClass}">${change.after}</span>`
        );
    });
    
    return highlightedText;
}

function displayChanges(result) {
    console.log('Displaying changes:', result);
    
    // Display AI-reported changes
    const aiChangesHtml = result.aiChanges.map(change => {
        const highlightClass = getHighlightClass(change.type);
        return `
            <div class="change-item">
                <div class="change-type">${change.type}</div>
                <div class="change-text">Before: ${change.before}</div>
                <div class="change-text">After: <span class="${highlightClass}">${change.after}</span></div>
            </div>
        `;
    }).join('');
    
    document.getElementById('ai-changes').innerHTML = aiChangesHtml;

    // Apply highlights to main edited text
    const highlightedText = highlightEditedText(result.editedText, result.aiChanges);
    document.getElementById('edited-display').innerHTML = highlightedText;
}

document.getElementById('analyze-btn').addEventListener('click', async () => {
    const manuscriptText = document.getElementById('manuscript-input').value;
    const analyzeBtn = document.getElementById('analyze-btn');
    const editedDisplay = document.getElementById('edited-display');

    if (!manuscriptText.trim()) {
        alert('Please enter some text to edit');
        return;
    }

    analyzeBtn.disabled = true;
    editedDisplay.textContent = 'Analyzing...';

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: manuscriptText })
        });

        const result = await response.json();
        console.log('Server response:', result);

        if (!response.ok) {
            throw new Error(result.error || 'Failed to edit text');
        }

        if (result.success) {
            displayChanges(result);
        } else {
            throw new Error(result.error || 'Editing failed');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error('Analysis error:', error);
    } finally {
        analyzeBtn.disabled = false;
    }
});
