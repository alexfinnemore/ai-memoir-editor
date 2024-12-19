# AI Memoir Editor

An AI-powered web application for editing autobiographical manuscripts with intelligent style suggestions and visual feedback.

## Features
- Real-time text analysis using GPT-4
- Visual highlighting of changes
- Style, grammar, and readability improvements
- Detailed change explanations
- Side-by-side comparison view

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_key_here
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Technical Details

### Architecture
- Backend: Node.js server with OpenAI integration
- Frontend: Vanilla JavaScript with dynamic HTML/CSS
- API: OpenAI GPT-4 for text analysis

### Key Components
1. **Server (server.js)**:
   - Handles static file serving
   - Manages OpenAI API interaction
   - Processes text analysis requests
   - Includes JSON sanitization for API responses

2. **Frontend (script.js)**:
   - Manages user interactions
   - Handles text highlighting
   - Processes and displays changes
   - Implements error handling

3. **Styling (index.html)**:
   - Responsive grid layout
   - Color-coded highlighting system
   - Consistent typography

### Learned Best Practices
1. **API Handling**:
   - Always sanitize JSON responses from AI APIs
   - Use proper error handling for API calls
   - Implement detailed logging for debugging

2. **Text Processing**:
   - Escape HTML in user input
   - Handle overlapping text changes carefully
   - Preserve whitespace and formatting

3. **UI/UX**:
   - Provide visual feedback for changes
   - Maintain consistent styling
   - Keep original text accessible

4. **Source Control**:
   - Use feature branches for development
   - Maintain stable branches for releases
   - Write clear commit messages

### Known Issues & Solutions
1. **JSON Parsing**:
   - Issue: Control characters in AI responses causing JSON parse errors
   - Solution: Implemented sanitizeJsonString function

2. **Text Highlighting**:
   - Issue: HTML tags visible in edited text
   - Solution: Proper HTML escaping and regex handling

3. **Input Handling**:
   - Issue: Long text formatting issues
   - Solution: Pre-wrap and word-wrap styles

## Future Improvements
1. Add user authentication
2. Implement save/load functionality
3. Add export options
4. Enhance AI prompting for better results
5. Add undo/redo functionality

## Version History
- v1.0: Initial stable release
  - Basic editing functionality
  - Text highlighting
  - Change tracking

## Contributing
Contributions are welcome! Please see our contributing guidelines for more details.

## API Usage Notes
When using the GitHub API:
```javascript
// Use push_files for file updates
push_files({
    repo: "repository-name",
    owner: "owner-name",
    branch: "branch-name",
    files: [{
        path: "file-path",
        content: "file-content"
    }],
    message: "commit-message"
});
```