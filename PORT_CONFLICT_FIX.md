# Port 11434 Conflict - Quick Fix Guide

## Error Message
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:11434
```

This means something is already using port 11434.

---

## 🚀 Quick Fix (Choose One Method)

### Method 1: PowerShell Script (EASIEST)
```powershell
# Run this in PowerShell (in C:\AI-SEO\mission-control)
.\fix-port-11434.ps1
```

### Method 2: Manual PowerShell Commands
```powershell
# 1. Find what's using the port
Get-NetTCPConnection -LocalPort 11434 | Select-Object LocalPort, OwningProcess

# 2. Get process details
Get-Process -Id [PID_FROM_ABOVE]

# 3. Kill the process
Stop-Process -Id [PID_FROM_ABOVE] -Force

# 4. Start tui-listener
node tui-listener.js
```

### Method 3: Command Prompt
```cmd
# 1. Find what's using the port
netstat -ano | findstr :11434

# 2. Kill the process (use the PID from above)
taskkill /F /PID [PID_FROM_ABOVE]

# 3. Start tui-listener
node tui-listener.js
```

---

## 🔍 Common Causes

### 1. Ollama is Running
**Most Common!** Ollama uses port 11434 by default.

**Fix Options:**
- **Option A**: Kill Ollama (if not needed)
  ```powershell
  Get-Process ollama* | Stop-Process -Force
  ```

- **Option B**: Change tui-listener port
  Edit `tui-listener.js` line 11:
  ```javascript
  bridgePort: 11435,  // Changed from 11434
  ```

### 2. tui-listener Already Running
Check if you already started it in another terminal.

**Fix:**
- Find the terminal and close it, OR
- Kill the process manually

### 3. Previous Node Process Didn't Exit Cleanly
**Fix:**
```powershell
# Kill all node processes (CAREFUL - this kills all Node.js processes)
Get-Process node | Stop-Process -Force

# Then restart services in order (see Ready Reckoner)
```

---

## ⚠️ Before Killing Processes

**Check these first:**

1. **Is tui-listener already running in another terminal?**
   - Look at all your open terminals
   - If yes, just use that one (don't start another)

2. **Do you need Ollama running?**
   - If you're using Ollama for other projects, don't kill it
   - Instead, change tui-listener's port

3. **Are other Mission Control services running?**
   - Killing all node processes will stop everything
   - You'll need to restart all 5 terminals

---

## 🎯 Recommended Solution

**For most users:**

1. Run the PowerShell script:
   ```powershell
   cd C:\AI-SEO\mission-control
   .\fix-port-11434.ps1
   ```

2. If it finds Ollama, kill it (unless you need it)

3. Start tui-listener:
   ```bash
   node tui-listener.js
   ```

**If Ollama is needed:**

1. Edit `tui-listener.js`:
   ```javascript
   const CONFIG = {
     bridgePort: 11435,  // Change this line
     // ... rest of config
   ```

2. Update dashboard to use new port
   (wherever it sends missions to the bridge)

3. Start tui-listener:
   ```bash
   node tui-listener.js
   ```

---

## ✅ Verify It Worked

After killing the process and starting tui-listener, you should see:

```
[SUCCESS] ✓ Bridge listening on port 11434
[INFO] Connecting to Moltbot Gateway at ws://localhost:18789...
[SUCCESS] ✓ Connected to Moltbot Gateway
[INFO] Protocol V3 handshake sent
[SUCCESS] ✓ Protocol V3 accepted by gateway
[SUCCESS] ✓ Found active TUI session: [session-id]
```

---

## 🆘 Still Not Working?

### Error: Access Denied
**Solution:** Run PowerShell as Administrator
- Right-click PowerShell → "Run as Administrator"
- Then run the fix script again

### Error: Process keeps coming back
**This is Ollama auto-restarting**
- Disable Ollama from startup
- OR change tui-listener port permanently

### Multiple processes on port 11434
**Unusual but possible**
- Kill them one by one using their PIDs
- Check Task Manager for hidden processes

---

## 📝 Prevention Tips

1. **Always close tui-listener cleanly**
   - Use Ctrl+C, not just closing the terminal

2. **Check if Ollama is running before starting tui-listener**
   ```powershell
   Get-Process ollama -ErrorAction SilentlyContinue
   ```

3. **Use the check-terminals.js script**
   - It will show you what's using each port
   - Run before starting services

4. **Consider using different port**
   - If you use Ollama regularly, change tui-listener to port 11435

---

## 🔧 Alternative: Use Different Port

If you keep having conflicts, permanently change the port:

**1. Edit tui-listener.js:**
```javascript
const CONFIG = {
  bridgePort: 11435,  // Use 11435 instead of 11434
  // ... rest
```

**2. Update dashboard fetch calls:**
Find where dashboard calls the bridge (probably in a component):
```javascript
// Change from:
fetch('http://localhost:11434/send-mission', ...)

// To:
fetch('http://localhost:11435/send-mission', ...)
```

**3. Update documentation:**
Make a note that you're using port 11435 for future reference.
