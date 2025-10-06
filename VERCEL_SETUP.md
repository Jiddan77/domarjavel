# Vercel Deployment Setup

## Quick Setup

1. **Connect to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set **Root Directory** to `Frontend`
   - Framework will auto-detect as Next.js

2. **Environment Variables** (in Vercel dashboard):
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```

3. **Deploy**:
   - Vercel will automatically deploy on every push to main

## Alternative: Manual Deploy

```bash
cd Frontend
npx vercel --prod
```

## Troubleshooting

If build fails:
1. Check that Root Directory is set to `Frontend`
2. Verify Node.js version is 18+
3. Check build logs for specific errors
