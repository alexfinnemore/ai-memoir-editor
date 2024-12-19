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
                editedDisplay.textContent = result.editedText;
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

function displayChanges(changes) {
    const aiChangesDiv = document.getElementById('ai-changes');
    if (!changes || !changes.length) {
        aiChangesDiv.innerHTML = '<p>No changes suggested</p>';
        return;
    }

    const html = changes.map(change => `
        <div class="change">
            <strong>${change.type}</strong>
            <p>Before: ${change.before}</p>
            <p>After: ${change.after}</p>
            <p><em>${change.explanation}</em></p>
        </div>
    `).join('');

    aiChangesDiv.innerHTML = html;
}