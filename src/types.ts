export interface ExactMatch {
  store: string;
  price: string;
  purchaseUrl: string;
  savings: string;
}

export interface ProductAlternative {
  name: string;
  price: string;
  reason: string;
  purchaseUrl: string;
  savings: string;
}

export interface OriginalProduct {
  name: string;
  estimatedPrice?: string;
}

export interface AlternativesResponse {
  originalProduct: OriginalProduct;
  exactMatches: ExactMatch[];
  alternatives: ProductAlternative[];
}

export interface ApiError {
  error: string;
}

