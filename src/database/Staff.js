import { staffDb } from './lowdb.js';

export default class Staff {
    constructor(data) {
        this.userId = data.userId;
        this.adminPoints = data.adminPoints || 0;
        this.voicePoints = data.voicePoints || 0;
        this.messagePoints = data.messagePoints || 0;
        this.totalPoints = data.totalPoints || 0;

        this.currentLoginTimestamp = data.currentLoginTimestamp || null;
        this.voiceJoinTimestamp = data.voiceJoinTimestamp || null;
        this.messageCount = data.messageCount || 0;
        this.wordCount = data.wordCount || 0;
        this.voiceMinutes = data.voiceMinutes || 0;
        this.lastLoginMessageId = data.lastLoginMessageId || null;

        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }

    /**
     * Get or create a staff member
     */
    static async getOrCreate(userId) {
        await staffDb.read();
        let data = staffDb.data.users.find(u => u.userId === userId);
        
        if (!data) {
            data = {
                userId,
                adminPoints: 0,
                voicePoints: 0,
                messagePoints: 0,
                totalPoints: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            staffDb.data.users.push(data);
            await staffDb.write();
        }
        return new Staff(data);
    }

    /**
     * Add points to staff member
     */
    async addPoints(type, amount) {
        switch (type) {
            case 'admin':
                this.adminPoints += amount;
                break;
            case 'voice':
                this.voicePoints += amount;
                break;
            case 'message':
                this.messagePoints += amount;
                break;
        }
        await this.save();
        return this;
    }

    /**
     * Save changes to database
     */
    async save() {
        this.totalPoints = this.adminPoints + this.voicePoints + this.messagePoints;
        this.updatedAt = new Date().toISOString();

        await staffDb.read();
        const index = staffDb.data.users.findIndex(u => u.userId === this.userId);
        
        const data = {
            userId: this.userId,
            adminPoints: this.adminPoints,
            voicePoints: this.voicePoints,
            messagePoints: this.messagePoints,
            totalPoints: this.totalPoints,
            currentLoginTimestamp: this.currentLoginTimestamp,
            voiceJoinTimestamp: this.voiceJoinTimestamp,
            messageCount: this.messageCount,
            wordCount: this.wordCount,
            voiceMinutes: this.voiceMinutes,
            lastLoginMessageId: this.lastLoginMessageId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };

        if (index > -1) {
            staffDb.data.users[index] = data;
        } else {
            staffDb.data.users.push(data);
        }

        await staffDb.write();
        return this;
    }

    /**
     * Mock Mongoose-style find() with chaining
     * Note: This is now synchronous but handles the async read via .then()
     */
    static find(query = {}) {
        const queryChain = {
            _query: query,
            _sort: null,
            _limit: null,

            sort(sortOptions) {
                this._sort = sortOptions;
                return this;
            },

            limit(n) {
                this._limit = n;
                return this;
            },

            async then(resolve, reject) {
                try {
                    await staffDb.read();
                    let results = staffDb.data.users.map(d => new Staff(d));

                    // Filtering
                    if (Object.keys(this._query).length > 0) {
                        results = results.filter(user => {
                            for (const [key, value] of Object.entries(this._query)) {
                                if (value && typeof value === 'object' && '$gt' in value) {
                                    if (user[key] <= value.$gt) return false;
                                } else if (user[key] !== value) return false;
                            }
                            return true;
                        });
                    }

                    // Sorting
                    if (this._sort) {
                        const key = Object.keys(this._sort)[0];
                        const multiplier = this._sort[key] === -1 ? -1 : 1;
                        results.sort((a, b) => (a[key] - b[key]) * multiplier);
                    }

                    // Limiting
                    if (this._limit !== null) {
                        results = results.slice(0, this._limit);
                    }

                    resolve(results);
                } catch (error) {
                    if (reject) reject(error);
                }
            }
        };

        return queryChain;
    }

    /**
     * Reset all staff points to zero
     */
    static async resetAllPoints() {
        await staffDb.read();
        staffDb.data.users.forEach(staff => {
            staff.adminPoints = 0;
            staff.voicePoints = 0;
            staff.messagePoints = 0;
            staff.totalPoints = 0;
            staff.updatedAt = new Date().toISOString();
        });
        await staffDb.write();
        return staffDb.data.users.length;
    }
}
