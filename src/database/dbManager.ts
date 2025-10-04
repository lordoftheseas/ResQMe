import knex, { Knex } from 'knex';
import knexConfig from './knexfile';
import { Alert } from '../types';

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
    }
};

export default dbManager;
