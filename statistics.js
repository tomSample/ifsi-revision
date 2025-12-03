/**
 * STATISTICS.JS - Système de statistiques et visualisation
 * Analyse la progression utilisateur et génère des graphiques
 */

// Variables globales
let auth = null;
let db = null;
let syncManager = null;
let spacedRepetition = null;
let userProgress = {};
let allTerms = [];

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    await initializeFirebase();
    await loadData();
    await calculateStatistics();
    hideLoading();
});

/**
 * Initialiser Firebase et les modules
 */
async function initializeFirebase() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        const app = initializeApp(window.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        syncManager = new SyncManager(auth, db);
        spacedRepetition = new SpacedRepetition();
        
    } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
    }
}

/**
 * Charger les données nécessaires
 */
async function loadData() {
    try {
        // Charger la progression utilisateur
        if (syncManager && auth?.currentUser) {
            userProgress = await syncManager.getAllProgress();
            console.log(`✅ Progression chargée: ${Object.keys(userProgress).length} termes`);
            console.log('📊 DEBUG - Clés de progression:', Object.keys(userProgress).slice(0, 5));
            console.log('📊 DEBUG - Exemple de données progression:', Object.values(userProgress)[0]);
        }
        
        // Charger tous les termes disponibles
        const response = await fetch('ifsi_courses_2025-09-23.json');
        const coursesData = await response.json();
        
        allTerms = [];
        
        // Le JSON a la structure: courses: [[id, {data}], [id, {data}], ...]
        for (const [courseId, course] of coursesData.courses) {
            if (course.definitions && Array.isArray(course.definitions)) {
                for (const term of course.definitions) {
                    allTerms.push({
                        term: term.term,
                        definition: term.definition,
                        ue: course.ue,
                        courseId: courseId
                    });
                }
            }
        }
        
        console.log(`✅ ${allTerms.length} termes chargés`);
        console.log('📊 DEBUG - Exemple de terme:', allTerms[0]);
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
    }
}

/**
 * Calculer et afficher toutes les statistiques
 */
async function calculateStatistics() {
    const stats = calculateGlobalStats();
    displayGlobalStats(stats);
    
    const ueStats = calculateUEStats();
    displayUEPodiums(ueStats);
    displayUEDetails(ueStats);
    
    renderEvolutionChart();
    renderHeatmap();
}

/**
 * Calculer les statistiques globales
 */
function calculateGlobalStats() {
    const totalTerms = allTerms.length;
    const reviewedTerms = Object.keys(userProgress).length;
    
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    let masteredCount = 0;
    
    console.log('📊 DEBUG - calculateGlobalStats démarré');
    console.log(`📊 Total termes: ${totalTerms}, Termes revus: ${reviewedTerms}`);
    
    for (const [termKey, progress] of Object.entries(userProgress)) {
        console.log(`📊 DEBUG - Traitement ${termKey}:`, progress);
        
        if (progress.difficultyHistory) {
            easyCount += progress.difficultyHistory.facile || 0;
            mediumCount += progress.difficultyHistory.moyen || 0;
            hardCount += progress.difficultyHistory.difficile || 0;
        }
        
        // Maîtrisé si intervalle >= 30 jours
        if (progress.intervalDays >= 30) {
            masteredCount++;
        }
    }
    
    const totalReviews = easyCount + mediumCount + hardCount;
    const successRate = totalReviews > 0 
        ? Math.round((easyCount + mediumCount * 0.6) / totalReviews * 100) 
        : 0;
    
    console.log(`📊 DEBUG - Compteurs: facile=${easyCount}, moyen=${mediumCount}, difficile=${hardCount}`);
    console.log(`📊 DEBUG - Total révisions: ${totalReviews}, Maîtrisés: ${masteredCount}`);
    
    // Calculer le streak
    const streak = calculateStreak();
    
    const stats = {
        totalTerms,
        reviewedTerms,
        reviewedPercent: totalTerms > 0 ? Math.round(reviewedTerms / totalTerms * 100) : 0,
        easyCount,
        mediumCount,
        hardCount,
        totalReviews,
        successRate,
        masteredCount,
        masteredPercent: reviewedTerms > 0 ? Math.round(masteredCount / reviewedTerms * 100) : 0,
        streak
    };
    
    console.log('📊 DEBUG - Stats finales:', stats);
    
    return stats;
}

/**
 * Calculer le streak de jours consécutifs
 */
function calculateStreak() {
    const dates = [];
    
    for (const progress of Object.values(userProgress)) {
        if (progress.lastReviewed) {
            const date = new Date(progress.lastReviewed);
            const dateStr = date.toISOString().split('T')[0];
            if (!dates.includes(dateStr)) {
                dates.push(dateStr);
            }
        }
    }
    
    if (dates.length === 0) return 0;
    
    // Trier les dates
    dates.sort((a, b) => new Date(b) - new Date(a));
    
    // Compter les jours consécutifs depuis aujourd'hui
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i]);
        const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

/**
 * Afficher les statistiques globales
 */
function displayGlobalStats(stats) {
    document.getElementById('reviewedCount').textContent = stats.reviewedTerms;
    document.getElementById('totalCount').textContent = `sur ${stats.totalTerms} disponibles`;
    document.getElementById('reviewedProgress').style.width = `${stats.reviewedPercent}%`;
    
    document.getElementById('successRate').textContent = `${stats.successRate}%`;
    document.getElementById('easyCount').textContent = stats.easyCount;
function calculateUEStats() {
    const ueMap = {};
    
    console.log('📊 DEBUG - calculateUEStats démarré');
    
    // Initialiser avec tous les termes
    for (const term of allTerms) {
        const ue = term.ue;
        if (!ueMap[ue]) {
            ueMap[ue] = {
                ue: ue,
                total: 0,
                reviewed: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                mastered: 0
            };
        }
        ueMap[ue].total++;
    }
    
    console.log('📊 DEBUG - UE initialisées:', Object.keys(ueMap));
    
    // Ajouter les données de progression
    for (const [termKey, progress] of Object.entries(userProgress)) {
        console.log(`📊 DEBUG - Analyse termKey: "${termKey}"`);
        
        // Extraire l'UE du termKey (format possible: term_ue ou autre)
        const ueMatch = termKey.match(/_(\d+\.\d+)/);
        console.log(`📊 DEBUG - UE Match result:`, ueMatch);
        
        if (!ueMatch) {
            console.warn(`⚠️ Impossible d'extraire l'UE de: ${termKey}`);
            continue;
        }
        
        const ue = ueMatch[1];
        if (!ueMap[ue]) {
            console.warn(`⚠️ UE ${ue} non trouvée dans ueMap`);
            continue;
        }
        
        ueMap[ue].reviewed++;
        
        if (progress.difficultyHistory) {
            ueMap[ue].easy += progress.difficultyHistory.facile || 0;
            ueMap[ue].medium += progress.difficultyHistory.moyen || 0;
            ueMap[ue].hard += progress.difficultyHistory.difficile || 0;
        }
        
        if (progress.intervalDays >= 30) {
            ueMap[ue].mastered++;
        }
    }
    
    console.log('📊 DEBUG - ueMap après progression:', ueMap);
    
    // Calculer les pourcentages
    const ueStats = Object.values(ueMap).map(ue => {
        const totalReviews = ue.easy + ue.medium + ue.hard;
        const successRate = totalReviews > 0 
            ? Math.round((ue.easy + ue.medium * 0.6) / totalReviews * 100) 
            : 0;
        
        return {
            ...ue,
            reviewedPercent: ue.total > 0 ? Math.round(ue.reviewed / ue.total * 100) : 0,
            successRate,
            masteredPercent: ue.reviewed > 0 ? Math.round(ue.mastered / ue.reviewed * 100) : 0
        };
    });
    
    console.log('📊 DEBUG - ueStats finales:', ueStats);
    
    return ueStats;
}           ? Math.round((ue.easy + ue.medium * 0.6) / totalReviews * 100) 
            : 0;
        
        return {
            ...ue,
            reviewedPercent: Math.round(ue.reviewed / ue.total * 100),
            successRate,
            masteredPercent: ue.reviewed > 0 ? Math.round(ue.mastered / ue.reviewed * 100) : 0
        };
    });
    
    return ueStats;
}

/**
 * Afficher les podiums des UE
 */
function displayUEPodiums(ueStats) {
    // Top 3 UE maîtrisées (par taux de réussite)
    const topMastered = [...ueStats]
        .filter(ue => ue.reviewed > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3);
    
    const podiumMastered = document.getElementById('podiumMastered');
    podiumMastered.innerHTML = topMastered.map((ue, index) => `
        <div class="podium-item">
            <div class="podium-block">
                <div class="podium-rank">${['🥇', '🥈', '🥉'][index]}</div>
                <div class="podium-ue">UE ${ue.ue}</div>
                <div class="podium-score">${ue.successRate}% de réussite</div>
                <div class="podium-score">${ue.reviewed}/${ue.total} cartes</div>
            </div>
        </div>
    `).join('');
    
    // Top 3 UE à travailler (par taux de réussite le plus bas)
    const topNeedWork = [...ueStats]
        .filter(ue => ue.reviewed > 0)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 3);
    
    const podiumNeedWork = document.getElementById('podiumNeedWork');
    podiumNeedWork.innerHTML = topNeedWork.map((ue, index) => `
        <div class="podium-item">
            <div class="podium-block">
                <div class="podium-rank">${index + 1}</div>
                <div class="podium-ue">UE ${ue.ue}</div>
                <div class="podium-score">${ue.successRate}% de réussite</div>
                <div class="podium-score">${ue.reviewed}/${ue.total} cartes</div>
            </div>
        </div>
    `).join('');
}

/**
 * Afficher les détails par UE
 */
function displayUEDetails(ueStats) {
    const ueList = document.getElementById('ueDetailsList');
    
    // Trier par UE
    const sortedUE = [...ueStats].sort((a, b) => {
        const [major1, minor1] = a.ue.split('.').map(Number);
        const [major2, minor2] = b.ue.split('.').map(Number);
        return major1 !== major2 ? major1 - major2 : minor1 - minor2;
    });
    
    ueList.innerHTML = sortedUE.map(ue => `
        <div class="ue-item">
            <div>
                <div class="ue-name">UE ${ue.ue}</div>
                <div class="ue-stats">
                    ${ue.reviewed}/${ue.total} cartes · 
                    <span style="color: #28a745;">${ue.easy} faciles</span> · 
                    <span style="color: #ffc107;">${ue.medium} moyens</span> · 
                    <span style="color: #dc3545;">${ue.hard} difficiles</span>
                </div>
            </div>
            <div>
                <div class="ue-progress">${ue.successRate}%</div>
                <div class="ue-stats">${ue.mastered} maîtrisées</div>
            </div>
        </div>
    `).join('');
}

/**
 * Générer le graphique d'évolution
 */
function renderEvolutionChart() {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) return;
    
    // Préparer les données (derniers 30 jours)
    const days = 30;
    const labels = [];
    const data = [];
    
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        labels.push(dateStr);
        
        // Compter le nombre de cartes maîtrisées à cette date
        let masteredCount = 0;
        for (const progress of Object.values(userProgress)) {
            if (progress.lastReviewed) {
                const reviewDate = new Date(progress.lastReviewed);
                if (reviewDate <= date && progress.intervalDays >= 30) {
                    masteredCount++;
                }
            }
        }
        data.push(masteredCount);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cartes maîtrisées',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * Générer le calendrier heatmap
 */
function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;
    
    // Créer un map de dates avec compteur de révisions
    const dateMap = {};
    
    for (const progress of Object.values(userProgress)) {
        if (progress.lastReviewed) {
            const date = new Date(progress.lastReviewed);
            const dateStr = date.toISOString().split('T')[0];
            dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
        }
    }
    
    // Générer le calendrier (90 derniers jours)
    const days = 90;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    // Trouver le max pour la normalisation
    const maxReviews = Math.max(...Object.values(dateMap), 1);
    
    // Générer la grille
    let html = '<div style="display: grid; grid-template-columns: repeat(13, 1fr); gap: 4px; padding: 20px;">';
    
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const reviews = dateMap[dateStr] || 0;
        
        // Calculer l'intensité (0-4)
        const intensity = reviews === 0 ? 0 : Math.ceil((reviews / maxReviews) * 4);
        
        const colors = [
            '#ebedf0',  // 0 révisions
            '#c6e48b',  // Faible
            '#7bc96f',  // Moyen
            '#239a3b',  // Élevé
            '#196127'   // Très élevé
        ];
        
        html += `
            <div style="
                width: 100%;
                aspect-ratio: 1;
                background: ${colors[intensity]};
                border-radius: 3px;
                cursor: pointer;
                transition: transform 0.2s ease;
            " 
            title="${dateStr}: ${reviews} révision${reviews > 1 ? 's' : ''}"
            onmouseover="this.style.transform='scale(1.2)'"
            onmouseout="this.style.transform='scale(1)'">
            </div>
        `;
    }
    
    html += '</div>';
    html += `
        <div style="display: flex; justify-content: center; gap: 10px; font-size: 12px; color: #6c757d; margin-top: 10px;">
            <span>Moins</span>
            <div style="display: flex; gap: 3px;">
                ${[0, 1, 2, 3, 4].map(i => `
                    <div style="width: 15px; height: 15px; background: ${['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'][i]}; border-radius: 2px;"></div>
                `).join('')}
            </div>
            <span>Plus</span>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Masquer le message de chargement
 */
function hideLoading() {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('statsContent').style.display = 'block';
}

/**
 * 🚀 Afficher les statistiques de performance
 */
function showPerformanceStats() {
    if (syncManager) {
        syncManager.logPerformanceStats();
        alert('📊 Statistiques affichées dans la console (F12)');
    } else {
        alert('❌ Sync manager non initialisé');
    }
}
