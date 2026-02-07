export interface LemonSqueezyMeta {
  page: {
    currentPage: number;
    from: number;
    lastPage: number;
    perPage: number;
    to: number;
    total: number;
  };
}
export interface LemonSqueezyJsonApi {
  version: string;
}
export interface LemonSqueezyLinks {
  first?: string;
  last?: string;
  self?: string;
  next?: string;
  prev?: string;
}
export interface LemonSqueezyProductAttributes {
  store_id: number;
  name: string;
  slug: string;
  description: string;
  status: string;
  status_formatted: string;
  thumb_url: string;
  large_thumb_url: string;
  price: number;
  price_formatted: string; // e.g., "$9.99"
  from_price: number | null;
  to_price: number | null;
  pay_what_you_want: boolean;
  buy_now_url: string;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}
export interface LemonSqueezyRelationshipLinks {
  related: string;
  self: string;
}
export interface LemonSqueezyRelationship {
  links: LemonSqueezyRelationshipLinks;
}
export interface LemonSqueezyProductRelationships {
  store: LemonSqueezyRelationship;
  variants: LemonSqueezyRelationship;
}
export interface LemonSqueezyProductData {
  type: 'products';
  id: string;
  attributes: LemonSqueezyProductAttributes;
  relationships: LemonSqueezyProductRelationships;
  links: {
    self: string;
  };
}
export interface LemonSqueezyProductResponse {
  meta: LemonSqueezyMeta;
  jsonapi: LemonSqueezyJsonApi;
  links: LemonSqueezyLinks;
  data: LemonSqueezyProductData[];
}

export enum SubscriptionType {
  Monthly = "815916",
  Yearly = "816253"
}
