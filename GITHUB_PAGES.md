# Deploying to GitHub Pages

This app now works **100% client-side** - no server needed! Perfect for GitHub Pages.

## How It Works

- **No backend server** - all verification happens in the browser
- **No JSON files** - hashes are hardcoded directly in `app.js`
- **No database** - just a JavaScript object
- **Works offline** - after initial page load
- **Pure static files** - HTML, CSS, JS

## Deployment Steps

### 1. Push to GitHub

```bash
cd /home/paul/scm/verific
git init
git add public/
git commit -m "Add OCR hash verification app"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select branch: `main`
4. Select folder: `/ (root)` or `/public` (if you move files there)
5. Click **Save**

### 3. Access Your Site

Your app will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

## File Structure for GitHub Pages

You have two options:

### Option A: Serve from /public folder

Keep current structure and configure GitHub Pages to serve from `/public`:

```
verific/
├── public/          ← GitHub Pages serves this
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── build-hashes.js  ← Build script (not deployed)
├── server.js        ← Not needed for GitHub Pages
└── README.md
```

### Option B: Move files to root

Move `public/*` to root for simpler GitHub Pages setup:

```bash
mv public/* .
rm -rf public/
```

Then structure is:
```
verific/
├── index.html       ← GitHub Pages serves from root
├── styles.css
├── app.js
├── build-hashes.js
└── README.md
```

## Adding New Hashes

When you want to add more certifications:

1. **Edit `build-hashes.js`** and add new certifications:
   ```javascript
   addCertification(database,
       `Your certification text here
       Multiple lines supported`,
       'verified',
       'Description message'
   );
   ```

2. **Run the build script**:
   ```bash
   node build-hashes.js
   ```

3. **Copy the output** from `public/hashes.json` into `HASH_DATABASE` in `public/app.js`

4. **Commit and push**:
   ```bash
   git add public/app.js
   git commit -m "Add new certification hashes"
   git push
   ```

GitHub Pages will auto-deploy in ~1 minute.

## Custom Domain (Optional)

To use your own domain:

1. Add a `CNAME` file to your repository root:
   ```
   your-domain.com
   ```

2. Configure DNS with your domain provider:
   ```
   Type: CNAME
   Name: @  (or www)
   Value: YOUR_USERNAME.github.io
   ```

3. Enable "Enforce HTTPS" in GitHub Pages settings

## Browser Requirements

- **HTTPS Required**: Camera access requires HTTPS (GitHub Pages provides this automatically)
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 years)
- **Mobile**: Works best on phones with rear cameras

## Security Notes

### Hashes are Public

The hash database is visible in the JavaScript source code. This is **intentional and not a security issue** because:

1. **Hashes are one-way** - you can't reverse them to get the original text
2. **Verification is the goal** - anyone should be able to verify authenticity
3. **Transparency is a feature** - like blockchain, public verification is the point

### Updating Hashes

Anyone can view your hashes, but only you (repo owner) can add new ones by:
- Pushing to the repository
- Deploying updates via GitHub Pages

## Cost

**$0** - GitHub Pages is completely free for public repositories!

## Performance

- **Initial load**: ~500KB (Tesseract.js WASM)
- **Subsequent loads**: Cached
- **OCR processing**: 2-5 seconds per image
- **Hash lookup**: Instant (in-memory JavaScript object)

## Limitations

### GitHub Pages Limits

- **100 GB bandwidth/month** (soft limit)
- **1 GB repository size** (hard limit)
- **10 builds per hour** (deployment limit)

For this app, you'd need **~200,000 users/month** to hit bandwidth limits.

### Hash Database Size

JavaScript has no practical limit for the hash database size:

- **1,000 hashes** = ~50KB JavaScript
- **10,000 hashes** = ~500KB JavaScript
- **100,000 hashes** = ~5MB JavaScript (still loads instantly on modern networks)

If you need more, consider:
- Splitting into multiple files loaded on-demand
- Using IndexedDB for client-side storage
- Moving to a real backend API

## Testing Locally

Before deploying, test locally:

```bash
# Option 1: Python
cd public
python3 -m http.server 8000

# Option 2: Node.js
npx http-server public -p 8000

# Option 3: PHP
cd public
php -S localhost:8000
```

**Note**: Camera requires HTTPS, so local testing won't have camera access unless you:
- Use `localhost` (browsers allow this)
- Set up local SSL certificate
- Deploy to a test HTTPS environment

## Troubleshooting

### Camera Not Working

- Check browser permissions
- Ensure you're on HTTPS (GitHub Pages provides this)
- Try a different browser
- Check browser console for errors

### Hashes Not Verifying

- Check console logs to see the computed hash
- Verify hash exists in `HASH_DATABASE`
- Check for OCR accuracy issues
- Verify text normalization is working

### GitHub Pages Not Updating

- Check GitHub Actions tab for deployment status
- Clear browser cache
- Wait 1-2 minutes for propagation
- Check that you pushed to the correct branch

## Alternative Deployment Options

If GitHub Pages doesn't work for you:

- **Netlify**: Drag & drop the `public/` folder
- **Vercel**: Connect your GitHub repo
- **Cloudflare Pages**: Similar to GitHub Pages
- **GitLab Pages**: Like GitHub Pages
- **Surge.sh**: `surge public/` for instant deployment

All are free and work the same way!

## Example Deployment

Live demo (once you deploy):
```
https://paulhammant.github.io/verific/
```

That's it! Your OCR hash verification app is now live and accessible to anyone with a phone camera.
