// Emergency Contacts API Service

import api from './api';
import {
  ContactFilters,
  SearchContactsRequest,
  ContactsResponse,
  ContactResponse,
  CategoryContactsResponse,
  CategoriesResponse,
  SearchContactsResponse,
} from '../types/api';
import { EmergencyContact, GroupedContacts } from '../types/models';

// Transform snake_case to camelCase
const transformContact = (contact: any): EmergencyContact => ({
  id: contact.id,
  category: contact.category,
  name: contact.name,
  phone: contact.phone,
  alternatePhone: contact.alternate_phone,
  email: contact.email,
  address: contact.address,
  city: contact.city,
  province: contact.province,
  isNational: Boolean(contact.is_national),
  isActive: Boolean(contact.is_active),
  displayOrder: contact.display_order,
  createdAt: contact.created_at,
  updatedAt: contact.updated_at,
});

export const contactsService = {
  // Get all contacts grouped by category
  getContacts: async (filters?: ContactFilters): Promise<GroupedContacts> => {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.province) params.append('province', filters.province);
    if (filters?.isNational !== undefined) params.append('is_national', String(filters.isNational));
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    
    // Add cache-busting timestamp to force fresh data
    params.append('_t', Date.now().toString());

    console.log('📡 Fetching contacts from API...');
    const response = await api.get<ContactsResponse>(`/emergency-contacts?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    console.log('📦 Raw API response:', JSON.stringify(response.data, null, 2));
    
    // Transform grouped contacts from snake_case to camelCase
    const groupedData = response.data.data!;
    console.log('📋 Grouped data type:', typeof groupedData);
    console.log('📋 Grouped data keys:', Object.keys(groupedData));
    
    const transformed: GroupedContacts = {};
    
    Object.entries(groupedData).forEach(([category, contacts]) => {
      console.log(`🔄 Transforming category "${category}" with ${(contacts as any[]).length} contacts`);
      transformed[category] = (contacts as any[]).map(transformContact);
    });
    
    console.log('✅ Transformed contacts:', JSON.stringify(transformed, null, 2));
    return transformed;
  },

  // Get contact by ID
  getContactById: async (id: number): Promise<EmergencyContact> => {
    const response = await api.get<ContactResponse>(`/emergency-contacts/${id}`);
    return transformContact(response.data.data!);
  },

  // Get contacts by category
  getByCategory: async (category: string, city?: string, province?: string): Promise<EmergencyContact[]> => {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (province) params.append('province', province);

    const response = await api.get<CategoryContactsResponse>(
      `/emergency-contacts/category/${category}?${params.toString()}`
    );
    return (response.data.data! as any[]).map(transformContact);
  },

  // Get all categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<CategoriesResponse>('/emergency-contacts/categories');
    return response.data.data!;
  },

  // Search contacts
  searchContacts: async (params: SearchContactsRequest): Promise<EmergencyContact[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.city) queryParams.append('city', params.city);
    if (params.province) queryParams.append('province', params.province);

    const response = await api.get<SearchContactsResponse>(`/emergency-contacts/search?${queryParams.toString()}`);
    return (response.data.data! as any[]).map(transformContact);
  },
};

export default contactsService;
