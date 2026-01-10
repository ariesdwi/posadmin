import api from '@/lib/api'; 

// TYPE DEFINITION
export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  status?: 'AVAILABLE' | 'OUT_OF_STOCK';
  file?: File;       // The new image file (from <input type="file">)
  imageUrl?: string; // Existing URL (if not updating image)
}

// Helper to handle image upload
const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  console.log('Upload Endpoint Raw Response:', response);
  console.log('Upload Endpoint Data:', response.data);
  
  // Handle response structure - Robust check for various ImageKit fields
  // Try to find the URL in common fields, handling potential double-nesting if interceptor behaves oddly
  const data = response.data;
  const potentialUrl = 
    data?.imageUrl || 
    data?.url || 
    data?.secure_url || 
    data?.data?.imageUrl || // In case of double nesting
    data?.data?.url;

  if (!potentialUrl) {
    const keys = data ? Object.keys(data).join(', ') : 'null';
    console.error('Image Upload Error. Available keys:', keys, 'Full Data:', data);
    throw new Error(`Upload successful but image URL is missing. Received keys: ${keys}`);
  }
  
  return potentialUrl;
};

// 1. Create Product (POST)
export const createProduct = async (data: ProductFormData) => {
  let imageUrl = data.imageUrl; // Default to existing if provided? (Usually empty for create)
  
  // 1. Upload Image first if file exists
  if (data.file) {
    imageUrl = await uploadImage(data.file);
  }

  // 2. Send JSON payload
  const payload = {
    name: data.name,
    description: data.description,
    price: data.price,
    stock: data.stock,
    categoryId: data.categoryId,
    status: data.status,
    imageUrl: imageUrl, 
  };
  
  return api.post('/menu', payload);
};

// 2. Update Product (PATCH)
export const updateProduct = async (id: number | string, data: Partial<ProductFormData>) => {
  let imageUrl = data.imageUrl;

  // 1. Upload Image first if file exists
  if (data.file) {
    imageUrl = await uploadImage(data.file);
  }

  // 2. Send JSON payload
  // Only include fields that are present
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.price !== undefined) payload.price = data.price;
  if (data.stock !== undefined) payload.stock = data.stock;
  if (data.categoryId) payload.categoryId = data.categoryId;
  if (data.status) payload.status = data.status;
  if (imageUrl) payload.imageUrl = imageUrl;
  
  return api.patch(`/menu/${id}`, payload);
};
