import { Client, Account, Databases, ID } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

const client = new Client();

if (projectId && projectId !== 'YOUR_PROJECT_ID_HERE') {
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export { ID };

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
export const WATCHLIST_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WATCHLIST_COLLECTION_ID || '';
export const HISTORY_COLLECTION_ID = import.meta.env.VITE_APPWRITE_HISTORY_COLLECTION_ID || '';
