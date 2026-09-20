/**
 * RAPPEL QUOTIDIEN DE RÉVISION
 *
 * Version navigateur/PWA : le rappel est déclenché lorsque l'application
 * est ouverte ou réactivée. L'envoi push serveur pourra réutiliser ces
 * paramètres sans modifier le format stocké.
 */

(function () {
    'use strict';

    const DEFAULT_SETTINGS = {
        enabled: false,
        time: '12:30',
        cardCount: 10,
        semester: 'S3'
    };
    const SETTINGS_KEY = 'ifsi_daily_reminder_settings';
    const LAST_REMINDER_KEY = 'ifsi_daily_reminder_last_sent';

    function readSettings() {
        try {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            return { ...DEFAULT_SETTINGS, ...stored };
        } catch (error) {
            console.error('Impossible de lire les paramètres de rappel:', error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function getDueCards() {
        if (typeof window.getRevisionReminderSnapshot !== 'function') {
            return [];
        }

        const snapshot = window.getRevisionReminderSnapshot();
        const terms = snapshot.terms || [];
        const progress = snapshot.progress || {};
        const semester = readSettings().semester;

        return terms
            .filter(term => term.ue && term.ue.endsWith(`.${semester}`))
            .filter(term => {
                const data = progress[snapshot.termKey(term)];
                if (!data || !data.nextReview) return true;
                return new Date(data.nextReview) <= new Date();
            })
            .sort((a, b) => {
                const aProgress = progress[snapshot.termKey(a)];
                const bProgress = progress[snapshot.termKey(b)];
                const aDate = aProgress?.nextReview ? new Date(aProgress.nextReview).getTime() : 0;
                const bDate = bProgress?.nextReview ? new Date(bProgress.nextReview).getTime() : 0;
                return aDate - bDate;
            });
    }

    function notificationUrl() {
        const path = '/src/frontend/pages/revision.html?reminder=1';
        return typeof window.resolvePath === 'function' ? window.resolvePath(path) : path;
    }

    async function requestPermission() {
        if (!('Notification' in window)) {
            throw new Error('Les notifications ne sont pas prises en charge par ce navigateur.');
        }
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        if (Notification.permission !== 'granted') {
            throw new Error('L’autorisation de notification a été refusée.');
        }
    }

    async function showReminder(force = false) {
        const settings = readSettings();
        const dueCards = getDueCards();
        if (!force && (!settings.enabled || dueCards.length === 0)) {
            return { sent: false, dueCount: dueCards.length };
        }

        await requestPermission();
        const count = Math.min(settings.cardCount, dueCards.length || settings.cardCount);
        const notification = new Notification('📚 Révision du jour', {
            body: force
                ? 'Ceci est une notification de test.'
                : `${dueCards.length} carte${dueCards.length > 1 ? 's' : ''} du S3 vous attend${dueCards.length > 1 ? 'ent' : ''}. Session conseillée : ${count} carte${count > 1 ? 's' : ''}.`,
            icon: typeof window.resolvePath === 'function'
                ? window.resolvePath('/public/images/icon-192.png')
                : '/public/images/icon-192.png',
            tag: 'ifsi-daily-review',
            renotify: force
        });
        notification.onclick = () => {
            window.focus();
            window.location.href = notificationUrl();
            notification.close();
        };

        if (!force) localStorage.setItem(LAST_REMINDER_KEY, getTodayKey());
        return { sent: true, dueCount: dueCards.length };
    }

    function checkSchedule() {
        const settings = readSettings();
        if (!settings.enabled) return;

        const [hours, minutes] = settings.time.split(':').map(Number);
        const now = new Date();
        const scheduled = new Date(now);
        scheduled.setHours(hours, minutes, 0, 0);
        const lastSent = localStorage.getItem(LAST_REMINDER_KEY);

        if (now >= scheduled && lastSent !== getTodayKey()) {
            showReminder().catch(error => console.warn('Rappel quotidien non envoyé:', error.message));
        }
    }

    function init() {
        const enabled = document.getElementById('dailyReminderEnabled');
        const time = document.getElementById('dailyReminderTime');
        const cardCount = document.getElementById('dailyReminderCardCount');
        const saveButton = document.getElementById('saveDailyReminder');
        const testButton = document.getElementById('testDailyReminder');
        const status = document.getElementById('dailyReminderStatus');
        if (!enabled || !time || !cardCount || !saveButton || !testButton) return;

        const settings = readSettings();
        enabled.checked = settings.enabled;
        time.value = settings.time;
        cardCount.value = settings.cardCount;

        saveButton.addEventListener('click', async () => {
            const nextSettings = {
                enabled: enabled.checked,
                time: time.value || DEFAULT_SETTINGS.time,
                cardCount: Math.max(1, Math.min(50, Number(cardCount.value) || DEFAULT_SETTINGS.cardCount)),
                semester: 'S3'
            };
            saveSettings(nextSettings);
            if (nextSettings.enabled) {
                try {
                    await requestPermission();
                    status.textContent = 'Rappel activé pour chaque jour à 12 h 30.';
                } catch (error) {
                    enabled.checked = false;
                    saveSettings({ ...nextSettings, enabled: false });
                    status.textContent = error.message;
                }
            } else {
                status.textContent = 'Rappel désactivé.';
            }
        });

        testButton.addEventListener('click', async () => {
            try {
                await showReminder(true);
                status.textContent = 'Notification de test envoyée.';
            } catch (error) {
                status.textContent = error.message;
            }
        });

        checkSchedule();
        setInterval(checkSchedule, 60000);
    }

    window.dailyReminder = {
        getSettings: readSettings,
        saveSettings,
        getDueCards,
        sendTest: () => showReminder(true),
        checkSchedule
    };

    document.addEventListener('DOMContentLoaded', init);
})();
