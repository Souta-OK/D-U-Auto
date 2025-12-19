import axios from 'axios';

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  tags: string;
}

export function normalizeDomain(domain: string): string {
  let normalized = domain.trim();
  
  // Remove trailing slash
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  // Add https:// if no protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

export function isMyshopifyDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  return normalized.includes('.myshopify.com');
}

export async function scrapeProducts(domain: string): Promise<ShopifyProduct[]> {
  const normalizedDomain = normalizeDomain(domain);
  
  try {
    let url: string;
    
    if (isMyshopifyDomain(normalizedDomain)) {
      // For .myshopify.com domains, we need to use the Admin API
      // But for scraping, we'll try the public products.json endpoint first
      url = `${normalizedDomain}/products.json`;
    } else {
      // For custom domains, use products.json
      url = `${normalizedDomain}/products.json`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });
    
    if (response.data && response.data.products) {
      return response.data.products;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error scraping products:', error.message);
    throw new Error(`Failed to scrape products: ${error.message}`);
  }
}

export async function uploadProductToStore(
  domain: string,
  adminToken: string,
  product: ShopifyProduct
): Promise<any> {
  const normalizedDomain = normalizeDomain(domain);
  
  try {
    let url: string;
    
    if (isMyshopifyDomain(normalizedDomain)) {
      // Extract shop name from domain (e.g., https://lyangyi.myshopify.com -> lyangyi)
      // Handle both with and without protocol
      const match = normalizedDomain.match(/(?:https?:\/\/)?([^\/\.]+)\.myshopify\.com/);
      const shopName = match?.[1];
      if (!shopName) {
        throw new Error('Invalid myshopify.com domain');
      }
      url = `https://${shopName}.myshopify.com/admin/api/2024-01/products.json`;
    } else {
      // For custom domains, use the domain with admin API path
      url = `${normalizedDomain}/admin/api/2024-01/products.json`;
    }
    
    const productData = {
      product: {
        title: product.title,
        body_html: product.description,
        vendor: product.vendor,
        product_type: product.product_type,
        tags: product.tags,
        variants: product.variants.map((v) => ({
          price: v.price,
          sku: v.sku,
          inventory_quantity: v.inventory_quantity,
          title: v.title,
        })),
        images: product.images.map((img) => ({
          src: img.src,
          alt: img.alt || product.title,
        })),
      },
    };
    
    const response = await axios.post(url, productData, {
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error uploading product:', error.message);
    throw new Error(`Failed to upload product: ${error.message}`);
  }
}

export async function getProductsFromStore(
  domain: string,
  adminToken: string
): Promise<ShopifyProduct[]> {
  const normalizedDomain = normalizeDomain(domain);
  
  try {
    let url: string;
    
    if (isMyshopifyDomain(normalizedDomain)) {
      // Extract shop name from domain (e.g., https://lyangyi.myshopify.com -> lyangyi)
      const match = normalizedDomain.match(/(?:https?:\/\/)?([^\/\.]+)\.myshopify\.com/);
      const shopName = match?.[1];
      if (!shopName) {
        throw new Error('Invalid myshopify.com domain');
      }
      url = `https://${shopName}.myshopify.com/admin/api/2024-01/products.json`;
    } else {
      // For custom domains, use the domain with admin API path
      url = `${normalizedDomain}/admin/api/2024-01/products.json`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    if (response.data && response.data.products) {
      return response.data.products;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching products:', error.message);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
}

