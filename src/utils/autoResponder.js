const { EmbedBuilder } = require('discord.js');

class AutoResponder {
    constructor() {
        this.responses = {
            'كيف': {
                keywords: ['كيف', 'طريقة', 'شلون', 'كيفية'],
                response: 'مرحباً! يمكنني مساعدتك. يرجى توضيح سؤالك بشكل أكثر تفصيلاً وسيقوم فريق الدعم بالرد عليك في أقرب وقت.'
            },
            'مشكلة': {
                keywords: ['مشكلة', 'خطأ', 'باق', 'error', 'bug'],
                response: 'عذراً على هذه المشكلة. هل يمكنك تقديم المعلومات التالية:\n1. خطوات تكرار المشكلة\n2. رسالة الخطأ (إن وجدت)\n3. توقيت حدوث المشكلة'
            },
            'دفع': {
                keywords: ['دفع', 'فاتورة', 'اشتراك', 'payment', 'bill'],
                response: 'للمساعدة في مشاكل الدفع، يرجى تقديم:\n1. رقم الفاتورة\n2. تاريخ العملية\n3. طريقة الدفع المستخدمة'
            },
            'شكر': {
                keywords: ['شكرا', 'thank', 'thanks', 'thx', 'شكراً'],
                response: 'شكراً لك! نحن سعداء بمساعدتك. لا تنسى تقييم خدمتنا عند إغلاق التذكرة 😊'
            }
        };
    }

    checkMessage(content) {
        content = content.toLowerCase();
        for (const [category, data] of Object.entries(this.responses)) {
            if (data.keywords.some(keyword => content.includes(keyword))) {
                return this.createResponseEmbed(category, data.response);
            }
        }
        return null;
    }

    createResponseEmbed(category, response) {
        return new EmbedBuilder()
            .setTitle('الرد الآلي')
            .setDescription(response)
            .setColor(0xff2f5b) // Updated color
            .setFooter({ 
                text: 'ONE Support Team', 
                iconURL: 'https://cdn.discordapp.com/icons/1157764250899587168/a_70347d99d756911cc13387dd212fdda2.gif?animated=true&size=1024'
            })
            .setTimestamp();
    }
}


module.exports = new AutoResponder();
