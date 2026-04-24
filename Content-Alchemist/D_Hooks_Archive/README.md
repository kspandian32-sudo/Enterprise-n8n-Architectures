# Workflow D: Hooks & Archive

## 📋 Role
The "Housekeeper" of the system. It saves viral hooks and moves processed audio to the archive.

## 🔄 Flow
**Receive Hook Data** -> **Log Hooks to Sheets** -> **Move Audio File** -> **Clean Up**

## 💡 Why this way?
- **Folder Hygeine**: Automatically clears the `Incoming Audio` folder to prevent duplicate processing.
- **Research Library**: Builds a long-term "Viral Hooks" database in Google Sheets for future content inspiration.
