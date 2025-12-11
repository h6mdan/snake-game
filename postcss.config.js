export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```
4. Click **"Commit new file"**

#### **9. Create `.gitignore`:**
1. Click **"Add file"** → **"Create new file"**
2. Name it: `.gitignore`
3. Paste this code:
```
node_modules
dist
.DS_Store
```
4. Click **"Commit new file"**

### **C. Verify Your Files:**

Your repository should now have this structure:
```
snake-game/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
└── README.md
