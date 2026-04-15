import { ticketDb } from '../database/lowdb.js';

class DBManager {
    constructor() {
        // Database is already initialized in lowdb.js via JSONFilePreset
    }

    // Create a new ticket record
    async createTicket(ticketId, userId, category) {
        await ticketDb.read();
        ticketDb.data.tickets.push({
            ticket_id: ticketId,
            user_id: userId,
            category: category,
            status: 'open',
            created_at: new Date().toISOString(),
            claimed_by: null,
            claimed_at: null,
            closed_at: null,
            archived: 0,
            rating: null,
            feedback: null
        });
        await ticketDb.write();
    }

    // Update ticket with channel ID when created
    async updateTicketChannel(ticketId, channelId) {
        await ticketDb.read();
        const ticket = ticketDb.data.tickets.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.channel_id = channelId;
            await ticketDb.write();
        }
    }

    async updateTicketChannelData(channelId, updates = {}) {
        await ticketDb.read();
        const ticket = ticketDb.data.tickets.find(t => t.channel_id === channelId);
        if (!ticket) return null;

        if (updates.claimedBy !== undefined) ticket.claimed_by = updates.claimedBy;
        if (updates.claimedAtNow) ticket.claimed_at = new Date().toISOString();
        if (updates.clearClaim) {
            ticket.claimed_by = null;
            ticket.claimed_at = null;
        }
        if (updates.status) ticket.status = updates.status;
        if (updates.closedAtNow) ticket.closed_at = new Date().toISOString();
        if (updates.rating !== undefined) ticket.rating = updates.rating;
        if (updates.feedback !== undefined) ticket.feedback = updates.feedback;
        if (updates.archived !== undefined) ticket.archived = updates.archived ? 1 : 0;

        await ticketDb.write();
        return ticket;
    }

    // Claim a ticket
    async claimTicket(ticketId, adminId) {
        await ticketDb.read();
        const ticket = ticketDb.data.tickets.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.claimed_by = adminId;
            ticket.claimed_at = new Date().toISOString();
            await ticketDb.write();
        }
    }

    // Unclaim a ticket
    async unclaimTicket(ticketId) {
        await ticketDb.read();
        const ticket = ticketDb.data.tickets.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.claimed_by = null;
            ticket.claimed_at = null;
            await ticketDb.write();
        }
    }

    // Close a ticket
    async closeTicket(ticketId, rating = null, feedback = null) {
        await ticketDb.read();
        const ticket = ticketDb.data.tickets.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.status = 'closed';
            ticket.closed_at = new Date().toISOString();
            ticket.rating = rating;
            ticket.feedback = feedback;
            await ticketDb.write();
        }
    }

    // Archive a ticket
    async archiveTicket(ticketId) {
        await ticketDb.read();
        const ticket = ticketDb.data.tickets.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.archived = 1;
            await ticketDb.write();
        }
    }

    // Get all active tickets for a user
    async getUserActiveTickets(userId) {
        await ticketDb.read();
        return ticketDb.data.tickets.filter(t => t.user_id === userId && t.status === 'open' && t.archived === 0);
    }

    // Get ticket by ticket ID
    async getTicketById(ticketId) {
        await ticketDb.read();
        return ticketDb.data.tickets.find(t => t.ticket_id === ticketId);
    }

    // Get ticket by channel ID
    async getTicketByChannelId(channelId) {
        await ticketDb.read();
        return ticketDb.data.tickets.find(t => t.channel_id === channelId);
    }

    // Get all tickets (with optional filters)
    async getAllTickets(filters = {}) {
        await ticketDb.read();
        let results = [...ticketDb.data.tickets];
        
        if (filters.userId) results = results.filter(t => t.user_id === filters.userId);
        if (filters.status) results = results.filter(t => t.status === filters.status);
        if (filters.archived !== undefined) results = results.filter(t => t.archived === (filters.archived ? 1 : 0));
        
        return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Get ticket statistics
    async getTicketStats() {
        await ticketDb.read();
        const tickets = ticketDb.data.tickets;
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            closed: tickets.filter(t => t.status === 'closed').length,
            archived: tickets.filter(t => t.archived === 1).length
        };
    }

    getNextTicketNumber() {
        // nextTicketNumber is handled with a separate counter in lowdb to mimic sqlite AUTOINCREMENT
        const current = ticketDb.data.nextTicketNumber || 1;
        ticketDb.data.nextTicketNumber = current + 1;
        ticketDb.write(); 
        return current;
    }

    async saveAdminRating({ ticketId, channelId = null, userId, adminId = null, closedBy = null, category = null, rating, feedback = null }) {
        await ticketDb.read();
        const existingIndex = ticketDb.data.adminRatings.findIndex(r => r.ticket_id === ticketId);
        
        const ratingData = {
            ticket_id: ticketId,
            channel_id: channelId,
            user_id: userId,
            admin_id: adminId,
            closed_by: closedBy,
            category: category,
            rating: rating,
            feedback: feedback,
            created_at: new Date().toISOString()
        };

        if (existingIndex > -1) {
            ticketDb.data.adminRatings[existingIndex] = ratingData;
        } else {
            ticketDb.data.adminRatings.push(ratingData);
        }
        
        await ticketDb.write();
    }

    async getTopTicketAdmins(limit = 10) {
        await ticketDb.read();
        const ratings = ticketDb.data.adminRatings;
        const stats = {};

        ratings.forEach(r => {
            if (!r.admin_id) return;
            if (!stats[r.admin_id]) {
                stats[r.admin_id] = { admin_id: r.admin_id, rated_tickets: 0, total_rating: 0, five_star_count: 0 };
            }
            stats[r.admin_id].rated_tickets++;
            stats[r.admin_id].total_rating += r.rating;
            if (r.rating === 5) stats[r.admin_id].five_star_count++;
        });

        return Object.values(stats)
            .map(s => ({
                ...s,
                average_rating: (s.total_rating / s.rated_tickets).toFixed(2)
            }))
            .sort((a, b) => b.rated_tickets - a.rated_tickets || b.average_rating - a.average_rating)
            .slice(0, limit);
    }
}

export default new DBManager();
