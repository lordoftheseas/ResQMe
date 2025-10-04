import knex, { Knex } from 'knex';
import knexConfig from './knexfile';
import { Alert, User } from '../types';

const db: Knex = knex(knexConfig.development);

const dbManager = {
    async init(): Promise<void> {
        try {
            await db.migrate.latest();
            console.log('Migrations are up to date.');
        } catch (error) {
            console.error('Error running migrations', error);
            throw error;
        }
    },
    async addAlert(alertData: Omit<Alert, 'id'>): Promise<Alert> {
        const dataToInsert = { ...alertData, gps: JSON.stringify(alertData.gps || {}) };
        const [newAlert] = await db('alerts').insert(dataToInsert).returning('*');
        return { ...newAlert, gps: JSON.parse(newAlert.gps) };
    },
    async getAllAlerts(): Promise<Alert[]> {
        const alerts = await db('alerts').select('*').orderBy('receivedAt', 'desc');
        return alerts.map(alert => ({ ...alert, gps: JSON.parse(alert.gps) }));
    },
    async getUnsyncedAlerts(): Promise<Alert[]> {
        const alerts = await db('alerts').where({ synced: false }).select('*');
        return alerts.map(alert => ({ ...alert, gps: JSON.parse(alert.gps) }));
    },
    async markAlertsAsSynced(alertIds: number[]): Promise<number> {
        return db('alerts').whereIn('id', alertIds).update({ synced: true });
    },

    // User management functions
    async createUser(userData: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
        const [newUser] = await db('users').insert({
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).returning('*');
        return newUser;
    },

    async getUserById(userId: string): Promise<User | null> {
        const user = await db('users').where({ id: userId }).first();
        return user || null;
    },

    async getUserByEmail(email: string): Promise<User | null> {
        const user = await db('users').where({ email }).first();
        return user || null;
    },

    async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
        const [updatedUser] = await db('users')
            .where({ id: userId })
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .returning('*');
        return updatedUser || null;
    },

    async deleteUser(userId: string): Promise<boolean> {
        const deleted = await db('users').where({ id: userId }).del();
        return deleted > 0;
    },

    async getAllUsers(): Promise<User[]> {
        return db('users').select('*').orderBy('created_at', 'desc');
    },

    async getAdminUsers(): Promise<User[]> {
        return db('users').where({ is_admin: true }).select('*');
    }
};

export default dbManager;
