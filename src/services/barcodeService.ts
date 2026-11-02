import { localDb } from './db';
import { Product, StorageLocation, BarcodeScanResult } from '../types';

export interface SampleBarcode {
  barcode: string;
  label: string;
  category: string;
  defaultLocation: StorageLocation;
}

export const COMMON_SAMPLE_BARCODES: SampleBarcode[] = [
  { barcode: '9300601234567', label: 'Dairy Farmers Full Cream Milk 2L', category: 'Dairy', defaultLocation: 'fridge' },
  { barcode: '9300607654321', label: 'Sunny Queen Free Range Eggs 12pk', category: 'Dairy & Eggs', defaultLocation: 'fridge' },
  { barcode: '9310055112233', label: 'Bega Tasty Cheddar Block 500g', category: 'Dairy', defaultLocation: 'fridge' },
  { barcode: '9310022334455', label: 'Peters Vanilla Ice Cream 2L', category: 'Frozen', defaultLocation: 'freezer' },
  { barcode: '9300601554433', label: 'Birds Eye Snap Frozen Baby Peas 1kg', category: 'Frozen', defaultLocation: 'freezer' },
  { barcode: '9345678901234', label: 'Tassal Salmon Fillets 4pk', category: 'Seafood', defaultLocation: 'freezer' },
  { barcode: '8001250123456', label: 'Barilla Spaghetti No. 5 500g', category: 'Pantry Staples', defaultLocation: 'pantry' },
  { barcode: '9300633112244', label: 'Cobram Estate Extra Virgin Olive Oil', category: 'Pantry Staples', defaultLocation: 'pantry' },
  { barcode: '7622210449283', label: 'Cadbury Dairy Milk Chocolate 180g', category: 'Snacks', defaultLocation: 'pantry' },
  { barcode: '9300601334455', label: 'Devondale Salted Butter 250g', category: 'Dairy', defaultLocation: 'fridge' }
];

export function guessStorageLocation(category: string, productName: string): StorageLocation {
  const text = (category + ' ' + productName).toLowerCase();
  
  if (
    text.includes('freez') ||
    text.includes('ice cream') ||
    text.includes('frozen') ||
    text.includes('gelato') ||
    text.includes('nugget') ||
    text.includes('patty')
  ) {
    return 'freezer';
  }

  if (
    text.includes('milk') ||
    text.includes('dairy') ||
    text.includes('cheese') ||
    text.includes('yogurt') ||
    text.includes('egg') ||
    text.includes('butter') ||
    text.includes('meat') ||
    text.includes('poultry') ||
    text.includes('deli') ||
    text.includes('fridge') ||
    text.includes('refrigerat')
  ) {
    return 'fridge';
  }

  return 'pantry';
}

export async function lookupBarcode(barcode: string): Promise<BarcodeScanResult> {
  const clean = barcode.trim();
  if (!clean) {
    return {
      barcode: '',
      foundInLocal: false,
      foundInGlobal: false,
      rawSource: 'manual'
    };
  }

  // 1. Check local IndexedDB product database
  const localProduct = await localDb.findProductByBarcode(clean);
  if (localProduct) {
    return {
      barcode: clean,
      foundInLocal: true,
      foundInGlobal: true,
      product: localProduct,
      rawSource: 'local'
    };
  }

  // 2. Query Open Food Facts API (with timeout & offline protection)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(clean)}.json`;
    const response = await fetch(offUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kitchiq-SmartKitchenPWA/1.0 (https://kitchiq.clanhost.com.au)'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const offProd = data.product;
        const name = offProd.product_name || offProd.product_name_en || `Scanned Item (${clean})`;
        const brand = offProd.brands || offProd.brand_owner || '';
        const category = offProd.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || 'Groceries';
        const imageUrl = offProd.image_front_url || offProd.image_url || undefined;
        const defaultLocation = guessStorageLocation(category, name);
        const nutriscore = offProd.nutriscore_grade?.toUpperCase() || undefined;

        const newProduct: Product = {
          id: 'prod-' + crypto.randomUUID(),
          barcode: clean,
          name,
          brand,
          category,
          imageUrl,
          defaultLocation,
          defaultUnit: 'units',
          openfoodfactsId: clean,
          nutriscore,
          isVerified: false
        };

        // Cache into local database for instant future lookups!
        await localDb.saveProduct(newProduct, true);

        return {
          barcode: clean,
          foundInLocal: false,
          foundInGlobal: true,
          product: newProduct,
          rawSource: 'openfoodfacts'
        };
      }
    }
  } catch (err) {
    console.warn('[Kitchiq Barcode] Open Food Facts lookup offline or timed out:', err);
  }

  // 3. Not found or offline - return placeholder for manual naming
  return {
    barcode: clean,
    foundInLocal: false,
    foundInGlobal: false,
    product: {
      id: 'prod-' + crypto.randomUUID(),
      barcode: clean,
      name: '',
      brand: '',
      category: 'General',
      defaultLocation: 'pantry',
      defaultUnit: 'units',
      isVerified: false
    },
    rawSource: 'manual'
  };
}
