export const PARCEL_CATEGORY_OPTIONS = [
  {
    key: "food_essentials",
    label: "Food and essentials",
    description: "Prepared meals, groceries, fresh produce, and food staples",
  },
  {
    key: "pharmaceutical",
    label: "Pharmaceutical item",
    description: "Medicines, medical supplies, and healthcare products",
  },
  {
    key: "mail_parcel",
    label: "Mail and small parcel",
    description: "Documents, envelopes, letters, and small boxed items",
  },
  {
    key: "laundry_clothing",
    label: "Laundry and cloths",
    description: "Apparel, textiles, washed or dry-cleaned garments",
  },
  {
    key: "electronics_gadgets",
    label: "Electronic and gadgets",
    description: "Phones, computers, cables, accessories, and electronics",
  },
  {
    key: "large_item",
    label: "Large item and others",
    description: "Furniture, appliances, bulk merchandise, and oversized goods",
  },
] as const;

export const HANDLING_OPTIONS = [
  { key: "GENERAL", label: "General" },
  { key: "FRAGILE", label: "Fragile" },
  { key: "PERISHABLE", label: "Perishable" },
  { key: "HAZARDOUS", label: "Hazardous" },
  { key: "SENSITIVE", label: "Sensitive" },
  { key: "OVERSIZE", label: "Oversize" },
] as const;

export const MOBILITY_OPTIONS = [
  { key: "bicycle", label: "Bicycle" },
  { key: "motorcycle", label: "Motorcycle" },
  { key: "tricycle", label: "Tricycle (Keke)" },
  { key: "car", label: "Car (Sedan)" },
  { key: "van", label: "Van" },
  { key: "truck", label: "Truck" },
  { key: "large_truck", label: "Long truck" },
] as const;
