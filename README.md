# AI Memoir Editor

## Overview
An AI-powered web application for editing autobiographical manuscripts.

## Setup
1. Clone the repository
2. Install dependencies
3. Run the application

## Development Guidelines

### Using GitHub API
When updating files, use the `push_files` function instead of `create_or_update_file`. Here's the correct format:

```javascript
push_files({
  repo: "repository-name",
  owner: "repository-owner",
  branch: "main",
  message: "commit message",
  files: [
    {
      path: "filename.ext",
      content: "file content as string"
    }
  ]
});
```

### Best Practices
1. Use meaningful commit messages
2. Create feature branches for significant changes
3. Test changes locally before pushing
4. Document all major changes