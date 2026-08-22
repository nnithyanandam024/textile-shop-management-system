import { useState, useEffect, useCallback } from 'react';
import {
  staffCustomerService,
  StaffCustomerListItem,
  StaffCustomerDetails,
  StaffCustomerPurchaseItem,
  StaffCustomerReturnItem,
  StaffCustomerLoyaltyData,
  StaffCustomerPreferences,
} from '../services/staffCustomerService';

export function useStaffCustomers() {
  const [customers, setCustomers] = useState<StaffCustomerListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Active customer profile state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetails, setCustomerDetails] = useState<StaffCustomerDetails | null>(null);
  const [purchases, setPurchases] = useState<StaffCustomerPurchaseItem[]>([]);
  const [returns, setReturns] = useState<StaffCustomerReturnItem[]>([]);
  const [loyalty, setLoyalty] = useState<StaffCustomerLoyaltyData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Modals & UI
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isLoyaltyAdjustModalOpen, setIsLoyaltyAdjustModalOpen] = useState(false);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & List
  const loadCustomers = useCallback(async (query: string = '', tier: string = 'ALL') => {
    setLoading(true);
    try {
      const results = await staffCustomerService.searchCustomers(query);
      const filtered = tier === 'ALL' ? results : results.filter((c) => c.tier === tier);
      setCustomers(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to search customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers(searchQuery, tierFilter);
  }, [loadCustomers, searchQuery, tierFilter]);

  // Load 360° Profile
  const loadCustomerProfile = useCallback(async (customerId: number) => {
    setSelectedCustomerId(customerId);
    setLoadingProfile(true);
    try {
      const [details, purchaseList, returnList, loyaltyData] = await Promise.all([
        staffCustomerService.getCustomerDetails(customerId),
        staffCustomerService.getPurchases(customerId),
        staffCustomerService.getReturns(customerId),
        staffCustomerService.getLoyalty(customerId),
      ]);
      setCustomerDetails(details);
      setPurchases(purchaseList);
      setReturns(returnList);
      setLoyalty(loyaltyData);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Create Customer
  const handleCreateCustomer = async (input: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    dob?: string;
    anniversary?: string;
    notes?: string;
    preferences?: StaffCustomerPreferences;
  }) => {
    try {
      const created = await staffCustomerService.createCustomer(input);
      setSuccessMessage(`Customer ${created.name} (${created.customerCode}) created successfully.`);
      setIsCreateModalOpen(false);
      loadCustomers(searchQuery, tierFilter);
      return created;
    } catch (err: any) {
      setError(err.message || 'Customer creation failed.');
      throw err;
    }
  };

  // Update Customer
  const handleUpdateCustomer = async (customerId: number, input: any) => {
    try {
      const updated = await staffCustomerService.updateCustomer(customerId, input);
      setCustomerDetails(updated);
      setSuccessMessage(`Customer details updated.`);
      setIsEditModalOpen(false);
      loadCustomers(searchQuery, tierFilter);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Update failed.');
      throw err;
    }
  };

  // Update Preferences
  const handleUpdatePreferences = async (customerId: number, preferences: StaffCustomerPreferences) => {
    try {
      await staffCustomerService.updatePreferences(customerId, preferences);
      setCustomerDetails((prev) => (prev ? { ...prev, preferences } : prev));
      setSuccessMessage('Customer textile preferences saved.');
      setIsPreferencesModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences.');
      throw err;
    }
  };

  // Add Note
  const handleAddNote = async (customerId: number, note: string) => {
    try {
      const newNote = await staffCustomerService.addNote(customerId, note);
      setCustomerDetails((prev) =>
        prev ? { ...prev, notes: [newNote, ...prev.notes] } : prev
      );
      setSuccessMessage('Note added to customer profile.');
    } catch (err: any) {
      setError(err.message || 'Failed to add note.');
      throw err;
    }
  };

  // Adjust Loyalty
  const handleAdjustLoyalty = async (
    customerId: number,
    points: number,
    type: 'EARN' | 'REDEEM' | 'ADJUST',
    description: string
  ) => {
    try {
      const updatedLoyalty = await staffCustomerService.adjustLoyaltyPoints(
        customerId,
        points,
        type,
        description
      );
      setLoyalty(updatedLoyalty);
      setCustomerDetails((prev) =>
        prev
          ? {
              ...prev,
              loyaltyPoints: updatedLoyalty.pointsBalance,
              lifetimePoints: updatedLoyalty.lifetimePoints,
              tier: updatedLoyalty.tier,
            }
          : prev
      );
      setSuccessMessage(`Loyalty points ${type.toLowerCase()}ed successfully.`);
      setIsLoyaltyAdjustModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Loyalty adjustment failed.');
      throw err;
    }
  };

  return {
    customers,
    searchQuery,
    tierFilter,
    loading,
    selectedCustomerId,
    customerDetails,
    purchases,
    returns,
    loyalty,
    loadingProfile,
    isCreateModalOpen,
    isEditModalOpen,
    isPreferencesModalOpen,
    isLoyaltyAdjustModalOpen,
    error,
    successMessage,
    setSearchQuery,
    setTierFilter,
    setIsCreateModalOpen,
    setIsEditModalOpen,
    setIsPreferencesModalOpen,
    setIsLoyaltyAdjustModalOpen,
    onLoadProfile: loadCustomerProfile,
    onCreateCustomer: handleCreateCustomer,
    onUpdateCustomer: handleUpdateCustomer,
    onUpdatePreferences: handleUpdatePreferences,
    onAddNote: handleAddNote,
    onAdjustLoyalty: handleAdjustLoyalty,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
    refresh: () => loadCustomers(searchQuery, tierFilter),
  };
}
