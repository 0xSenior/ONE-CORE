import dotenv from 'dotenv';
dotenv.config();

// تحويل النص إلى مصفوفة
const parseArray = (str) => str ? str.split(',').map(item => item.trim()) : [];

// تحويل النص إلى كائن التصنيفات
const parseCategories = (str) => {
    if (!str) return null;
    return str.split(',').map(cat => {
        const [value, emoji, label] = cat.split(':');
        return { value, emoji, label };
    });
};

// تحويل النص إلى قيمة منطقية
const parseBoolean = (str) => str?.toLowerCase() === 'true';

// تحويل النص إلى رقم
const parseNumber = (str, defaultValue) => {
    const num = parseInt(str);
    return isNaN(num) ? defaultValue : num;
};

const settings = {
    // إعدادات التذاكر
    supportRole: process.env.SUPPORT_ROLE || 'Ticket Support',
    archiveCategory: process.env.ARCHIVE_CATEGORY || 'Archived Tickets',
    logsChannelId: process.env.LOGS_CHANNEL || '〢・ticket・logs',
    ticketCategory: process.env.TICKET_CATEGORY || 'Tickets',

    // إعدادات الأولويات
    alertHighPriority: parseBoolean(process.env.ALERT_HIGH_PRIORITY),
    highPriorityRoles: parseArray(process.env.HIGH_PRIORITY_ROLES),

    // إعدادات التصنيفات
    categories: parseCategories(process.env.TICKET_CATEGORIES) || [
        { value: 'complaints', emoji: '👮', label: 'البلاغات الإدارية' },
        { value: 'technical', emoji: '⚙️', label: 'الدعم الفني' },
        { value: 'hacks', emoji: '🐛', label: 'القلتشات والأختراق' },
        { value: 'departments', emoji: '🛡️', label: 'شكاوي القطاعات' },
        { value: 'general', emoji: '❓', label: 'إستفسارات عامة' },
        { value: 'vehicles', emoji: '🚗', label: 'المركبات والبيوت' },
        { value: 'rewards', emoji: '🏆', label: 'التعويض والعضويات' },
        { value: 'applications', emoji: '📋', label: 'التقديمات' }
    ],

    // إعدادات الألوان
    colors: {
        success: process.env.COLOR_SUCCESS || '#00ff00',
        warning: process.env.COLOR_WARNING || '#ffff00',
        danger: process.env.COLOR_DANGER || '#ff0000',
        info: process.env.COLOR_INFO || '#0099ff',
        default: process.env.COLOR_DEFAULT || '#2f3136'
    },

    // إعدادات أخرى
    deleteTimeout: parseNumber(process.env.DELETE_TIMEOUT, 5000),
    transcriptEnabled: parseBoolean(process.env.TRANSCRIPT_ENABLED),
    autoCloseHours: parseNumber(process.env.AUTO_CLOSE_HOURS, 48),
    maxTicketsPerUser: parseNumber(process.env.MAX_TICKETS_PER_USER, 3),

    // الأولويات الافتراضية
    priorities: {
        low: { label: 'منخفضة', emoji: '🟢', color: '#00ff00' },
        medium: { label: 'متوسطة', emoji: '🟡', color: '#ffff00' },
        high: { label: 'عالية', emoji: '🟠', color: '#ff9900' },
        urgent: { label: 'عاجلة', emoji: '🔴', color: '#ff0000' }
    }
};

export default settings;
