# Shopify Product Manager

A Next.js application for managing and synchronizing products across multiple Shopify stores.

## Features

### 1. Product Scraping Page
- Scrape products from any Shopify store by entering the domain
- View products in card or list format
- Search and paginate through scraped products
- Select products and upload them to your store
- Support for both custom domains and `.myshopify.com` domains

### 2. Product Sharing Page
- Create groups with parent and child stores
- Manage groups with full CRUD operations
- Share products from parent store to all child stores
- Configure sync type (sync/async) for each group

### 3. Group Sync Page
- View all groups in a list format
- Enable/disable synchronization for each group
- Automatic synchronization of product changes across all stores in a group
- Real-time sync status indicators

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Domain Support

The application supports two types of Shopify domains:

1. **Custom domains**: `https://wearelively.com`
   - Uses `/products.json` endpoint for scraping
   - Uses `/admin/api/2024-01/products.json` for API operations

2. **Myshopify domains**: `https://lyangyi.myshopify.com`
   - Uses `/products.json` endpoint for scraping
   - Uses `https://{shopname}.myshopify.com/admin/api/2024-01/products.json` for API operations

The application automatically detects the domain type and uses the appropriate endpoints.

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **MongoDB** - Database for storing groups
- **Mongoose** - MongoDB ODM
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Cheerio** - HTML parsing (for scraping if needed)

## API Routes

- `POST /api/scrape` - Scrape products from a store
- `POST /api/upload` - Upload products to a store
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/[id]` - Get a specific group
- `PUT /api/groups/[id]` - Update a group
- `DELETE /api/groups/[id]` - Delete a group
- `POST /api/groups/[id]/sync` - Toggle sync for a group
- `GET /api/groups/[id]/products` - Get products from parent store
- `POST /api/share` - Share products to child stores

## Deployment

To deploy this app for production use by multiple users, see the comprehensive deployment guide:

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment instructions
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Quick deployment checklist

The deployment guide covers:
- Setting up Shopify Partner account and OAuth
- Deploying to Vercel, Netlify, or other platforms
- Database configuration
- Environment variables setup
- Converting from manual tokens to OAuth (recommended for production)
- Scaling and monitoring considerations

## Notes

- The sync functionality requires proper webhook setup in production to monitor product changes
- Admin tokens are stored in the database - ensure proper security measures in production
- For production deployment, consider converting to OAuth-based authentication (see DEPLOYMENT_GUIDE.md)
- The application is mobile-responsive and works on all device sizes

## Additional Documentation

- **[SETUP.md](./SETUP.md)** - Local development setup
- **[SHOPIFY_APP_INSTALLATION.md](./SHOPIFY_APP_INSTALLATION.md)** - Shopify app installation methods
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - MongoDB configuration guide


# D-U-Auto
