import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config/apiConfig';

export interface Contact {
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
}

export interface HashedContact {
  originalContact: Contact;
  hashedPhones: string[];
}

export interface DiscoveredContact {
  hash: string;
  userId: string;
  name: string;
  username?: string;
  avatar?: string;
  trustBadge?: boolean;
  originalContact: Contact;
}

export interface ContactDiscoveryResult {
  onIle: DiscoveredContact[];
  toInvite: Contact[];
}

class ContactsService {
  private serverSalt = 'ile_contact_discovery_salt_2024'; // In production, get this from server

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }

  async getDeviceContacts(): Promise<Contact[]> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Contacts permission denied');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      // Filter contacts with valid phone numbers and normalize
      const validContacts: Contact[] = data
        .filter(contact => 
          contact.phoneNumbers && 
          contact.phoneNumbers.length > 0 && 
          contact.name
        )
        .map(contact => ({
          id: contact.id || Math.random().toString(),
          name: contact.name!,
          phoneNumbers: contact.phoneNumbers?.map(phone => 
            this.normalizePhoneNumber(phone.number || '')
          ).filter(phone => phone.length > 0),
          emails: contact.emails?.map(email => email.email || '').filter(email => email !== '') as string[],
        }))
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0);

      console.log(`📱 Found ${validContacts.length} contacts with phone numbers`);
      return validContacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Normalize phone number to E.164 format
   * This is a basic implementation - in production, use a proper library like libphonenumber
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Skip if too short
    if (digitsOnly.length < 10) {
      return '';
    }

    // Add country code if missing (assuming US +1 for demo)
    if (digitsOnly.length === 10) {
      return '+1' + digitsOnly;
    }
    
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return '+' + digitsOnly;
    }

    // Return as-is if it looks like it already has country code
    return '+' + digitsOnly;
  }

  /**
   * Hash phone numbers using HMAC-SHA256 for privacy
   */
  async hashPhoneNumbers(contacts: Contact[]): Promise<HashedContact[]> {
    const hashedContacts: HashedContact[] = [];

    for (const contact of contacts) {
      if (!contact.phoneNumbers) continue;

      const hashedPhones: string[] = [];
      for (const phone of contact.phoneNumbers) {
        try {
          // Use HMAC-SHA256 with server salt for consistent hashing
          const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            phone + this.serverSalt,
            { encoding: Crypto.CryptoEncoding.HEX }
          );
          hashedPhones.push(hash);
        } catch (error) {
          console.error('Error hashing phone number:', error);
        }
      }

      if (hashedPhones.length > 0) {
        hashedContacts.push({
          originalContact: contact,
          hashedPhones,
        });
      }
    }

    return hashedContacts;
  }

  /**
   * Send hashed phone numbers to backend for matching
   */
  async discoverContacts(hashedContacts: HashedContact[]): Promise<DiscoveredContact[]> {
    try {
      // Flatten all hashes
      const allHashes = hashedContacts.flatMap(hc => hc.hashedPhones);
      
      console.log(`🔍 Discovering ${allHashes.length} hashed contacts...`);

      const response = await fetch(`${this.getApiUrl()}/v1/contacts/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
        },
        body: JSON.stringify({
          hashes: allHashes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Contact discovery failed: ${response.status}`);
      }

      const discoveredData = await response.json();
      console.log(`✅ Found ${discoveredData.length} contacts on Ilé`);

      // Map discovered contacts back to original contacts
      const discovered: DiscoveredContact[] = [];
      for (const item of discoveredData) {
        // Find the original contact that matches this hash
        const hashedContact = hashedContacts.find(hc => 
          hc.hashedPhones.includes(item.hash)
        );
        
        if (hashedContact) {
          discovered.push({
            ...item,
            originalContact: hashedContact.originalContact,
          });
        }
      }

      return discovered;
    } catch (error) {
      console.error('Error discovering contacts:', error);
      throw error;
    }
  }

  /**
   * Main function to perform full contact discovery
   */
  async performContactDiscovery(): Promise<ContactDiscoveryResult> {
    try {
      // 1. Get device contacts
      const deviceContacts = await this.getDeviceContacts();
      
      // 2. Hash phone numbers
      const hashedContacts = await this.hashPhoneNumbers(deviceContacts);
      
      // 3. Discover which ones are on Ilé
      const onIleContacts = await this.discoverContacts(hashedContacts);
      
      // 4. Separate into "On Ilé" and "To Invite"
      const onIleContactIds = new Set(
        onIleContacts.map(c => c.originalContact.id)
      );
      
      const toInvite = deviceContacts.filter(
        contact => !onIleContactIds.has(contact.id)
      );

      console.log(`📊 Contact Discovery Results:
        - Total contacts: ${deviceContacts.length}
        - On Ilé: ${onIleContacts.length}
        - To invite: ${toInvite.length}`);

      return {
        onIle: onIleContacts,
        toInvite,
      };
    } catch (error) {
      console.error('Contact discovery failed:', error);
      throw error;
    }
  }

  /**
   * Generate referral link for inviting contacts
   */
  generateInviteLink(contact: Contact): string {
    const referralCode = 'your_referral_code'; // Get from user profile
    const inviteText = encodeURIComponent(`Join me on Ilé! Download: https://ile.app?ref=${referralCode}`);
    return `sms:${contact.phoneNumbers?.[0]}&body=${inviteText}`;
  }

  /**
   * Search users by name/username (fallback when contacts permission denied)
   */
  async searchUsers(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.getApiUrl()}/v1/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          // Add auth headers
        },
      });

      if (!response.ok) {
        throw new Error('User search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get public profile for a user
   */
  async getUserPublicProfile(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getApiUrl()}/v1/users/${userId}/public`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  private getApiUrl(): string {
    return API_BASE_URL;
  }
}

export const contactsService = new ContactsService();