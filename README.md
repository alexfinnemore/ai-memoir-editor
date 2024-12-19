# AI Memoir Editor

## Overview
An AI-powered web application for editing autobiographical manuscripts.

## Setup
1. Clone the repository
2. Install dependencies
3. Run the application

## Development Guidelines

### Using GitHub API
When using the `create_or_update_file` endpoint:
1. Always include both `encoding` and `content` parameters
2. The `encoding` should be set to "base64"
3. The `content` should be base64 encoded
4. Include the file's SHA when updating existing files
5. Include the branch name
6. Example:
```javascript
{
  "path": "filename.ext",
  "message": "commit message",
  "content": "<base64-encoded-content>",
  "encoding": "base64",
  "branch": "main",
  "sha": "<file-sha-if-updating>"
}
```

### Best Practices
1. Always fetch the current file's SHA before updating
2. Use proper commit messages describing changes
3. Create feature branches for significant changes
4. Document API usage patterns in comments