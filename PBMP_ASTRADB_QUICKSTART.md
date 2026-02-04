# 🚀 PBMP AstraDB Quick Start

## 📋 What You Need

Tell me which format your PBMP docs are in:

### Option 1: Website URLs ✅ (Easiest)
Your docs are on a website that can be scraped.

### Option 2: Local Files 📁
PDF, DOCX, TXT, MD files on your computer.

### Option 3: Plain Text 📝
You have the content ready as text.

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Add to Main .env
Edit `/chatbotRC/.env` and add:
```bash
PBMP_ASTRA_DB_COLLECTION=pbmp_docs
```

### Step 2: Update Your Doc URLs
Edit `/chatbotRC/scripts/loadPBMPDocs.ts`:
```typescript
const pbmpUrls = [
    'https://your-site.com/docs',
    'https://your-site.com/guide',
    // Add all your PBMP doc URLs
]
```

### Step 3: Load Docs to AstraDB
```bash
cd chatbotRC

# Test first (only 3 chunks per URL)
npm run seed:pbmp:test

# If test works, load everything
npm run seed:pbmp
```

### Step 4: Modify API
Follow: `/chatbotRC/API_MODIFICATION_FOR_PBMP.md`

OR tell me and I'll make the changes!

### Step 5: Test PBMP
```bash
# Terminal 1 - API
cd chatbotRC
npm run dev

# Terminal 2 - PBMP
cd hbmpchat  
npm run dev

# Open: http://localhost:3001
# Ask a question from your docs!
```

---

## 🎯 Current Status

✅ PBMP React app created  
✅ Loading script created  
✅ Collection name configured  
✅ .env updated  
⏳ Waiting for: Your doc URLs  
⏳ Need to: Load docs to AstraDB  
⏳ Need to: Modify API route  

---

## 📝 What Format Are Your Docs?

**Tell me:**
1. **Website URLs**: "My docs are at https://..."
2. **Local PDFs**: "I have PDF files in a folder"
3. **Text files**: "I have .txt/.md files"
4. **Other**: Describe your format

Once you tell me, I'll customize the loading script!

---

## 💡 Example Setups

### Example 1: Single Website
```typescript
const pbmpUrls = [
    'https://pbmp.com/docs',
]
```

### Example 2: Multiple Pages
```typescript
const pbmpUrls = [
    'https://pbmp.com/getting-started',
    'https://pbmp.com/features',
    'https://pbmp.com/pricing',
    'https://pbmp.com/faq',
]
```

### Example 3: Documentation Site
```typescript
const pbmpUrls = [
    'https://docs.pbmp.com/intro',
    'https://docs.pbmp.com/user-guide',
    'https://docs.pbmp.com/api-reference',
]
```

---

## 🔍 Testing After Setup

Ask PBMP these questions:
- "What is PBMP?" (should answer from your docs)
- "How does [your feature] work?"
- "What are the pricing plans?"

If it says "I don't have that information", either:
- The docs weren't loaded (check AstraDB)
- The API isn't using pbmp collection (check logs)
- The question isn't covered in your docs

---

## 🎊 Ready?

**Next: Tell me your doc format and I'll help you load them!**
