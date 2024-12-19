document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const manuscriptInput = document.getElementById('manuscript-input');
    const editedDisplay = document.getElementById('edited-display');

    if (!analyzeBtn || !manuscriptInput || !editedDisplay) {
        console.error('Required elements not found');
        return;
    }

    analyzeBtn.addEventListener('click', async () => {
        const text = manuscriptInput.value;
        if (!text.trim()) {
            alert('Please enter some text to analyze');
            return;
        }

        try {
            analyzeBtn.disabled = true;
            editedDisplay.textContent = 'Analyzing...';

            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (result.success) {
                // Highlight original text
                let highlightedOriginal = result.originalText;
                result.aiChanges.forEach(change => {
                    const escapedBefore = escapeRegExp(change.before);
                    const regex = new RegExp(escapedBefore, 'g');
                    highlightedOriginal = highlightedOriginal.replace(
                        regex,
                        `<span class="original-highlight">${change.before}</span>`
                    );
                });
                manuscriptInput.style.display = 'none';
                const originalDisplay = document.createElement('div');
                originalDisplay.className = 'text-area';
                originalDisplay.innerHTML = highlightedOriginal;
                manuscriptInput.parentNode.insertBefore(originalDisplay, manuscriptInput.nextSibling);

                // Highlight edited text
                let highlightedEdited = result.editedText;
                result.aiChanges.forEach(change => {
                    const escapedAfter = escapeRegExp(change.after);
                    const regex = new RegExp(escapedAfter, 'g');
                    highlightedEdited = highlightedEdited.replace(
                        regex,
                        `<span class="highlight-${change.type.toLowerCase()}">${change.after}</span>`
                    );
                });
                editedDisplay.innerHTML = highlightedEdited;

                // Display changes section
                displayChanges(result.aiChanges);
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Error:', error);
            editedDisplay.textContent = 'Error: ' + error.message;
        } finally {
            analyzeBtn.disabled = false;
        }
    });
});

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function displayChanges(changes) {
    const aiChangesDiv = document.getElementById('ai-changes');
    if (!changes || !changes.length) {
        aiChangesDiv.innerHTML = '<p>No changes suggested</p>';
        return;
    }

    const html = changes.map(change => `
        <div class="change-item">
            <div class="change-type ${change.type.toLowerCase()}">${change.type}</div>
            <div class="change-content">
                <p><strong>Before:</strong> <span class="original-highlight">${escapeHtml(change.before)}</span></p>
                <p><strong>After:</strong> <span class="highlight-${change.type.toLowerCase()}">${escapeHtml(change.after)}</span></p>
                <p class="explanation"><em>${escapeHtml(change.explanation)}</em></p>
            </div>
        </div>
    `).join('');

    aiChangesDiv.innerHTML = html;
}