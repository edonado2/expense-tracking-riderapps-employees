# 🚨 **Troubleshooting Deployment Issues**

## ❌ **Error: Cannot find module '/opt/render/project/src/server/server/index.js'**

### **What This Means:**
Render is looking for the wrong file path. It's trying to find `server/server/index.js` instead of `server/dist/index.js`.

### **Root Cause:**
The TypeScript build process isn't working correctly, or the start command is wrong.

### **✅ Solutions:**

#### **1. Fix Build Command (Recommended)**
```yaml
# In render.yaml
buildCommand: npm run render-build
startCommand: node dist/index.js
```

#### **2. Verify Package.json Scripts**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "render-build": "npm install && npm run build"
  }
}
```

#### **3. Check File Structure**
```
server/
├── src/
│   └── index.ts
├── dist/          ← This folder must exist after build
│   └── index.js   ← This file must exist after build
├── package.json
└── tsconfig.json
```

#### **4. Test Locally First**
```bash
cd server
npm install
npm run build
ls -la dist/        # Should show index.js
npm start           # Should start without errors
```

### **🔧 Common Fixes:**

#### **Fix 1: Clear Build Cache**
```bash
cd server
rm -rf dist/
rm -rf node_modules/
npm install
npm run build
```

#### **Fix 2: Check TypeScript Config**
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

#### **Fix 3: Verify Entry Point**
```json
{
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js"
  }
}
```

### **🚀 Deployment Checklist:**

- [ ] **Build Command**: `npm run render-build`
- [ ] **Start Command**: `node dist/index.js`
- [ ] **Root Directory**: `server`
- [ ] **TypeScript**: Builds to `dist/` folder
- [ ] **Entry Point**: `dist/index.js` exists
- [ ] **Dependencies**: All installed correctly
- [ ] **Procfile**: `web: node dist/index.js`
- [ ] **Buildpacks**: `heroku/nodejs`

### **📞 Still Having Issues?**

1. **Check Render logs** for specific error messages
2. **Test locally** with `npm run build && npm start`
3. **Verify file paths** in your repository
4. **Check TypeScript compilation** output

---

🎯 **Most Common Fix**: Use `npm run render-build` as your build command!
