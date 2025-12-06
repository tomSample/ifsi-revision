/**
 * STATISTICS.JS - Système de statistiques et visualisation
 * Analyse la progression utilisateur et génère des graphiques
 */

// Helper pour résoudre les chemins sur GitHub Pages (si pas déjà défini)
if (!window.resolvePath) {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const basePath = isGitHubPages ? '/ifsi-revision' : '';
    window.resolvePath = (path) => path.startsWith('/') ? basePath + path : path;
}

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
    
    // Attendre que l'utilisateur soit authentifié
    if (auth) {
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve();
            });
        });
    }
    
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
        if (syncManager && auth && auth.currentUser) {
            userProgress = await syncManager.getAllProgress();
        }
        
        // Charger tous les termes disponibles
        const response = await fetch(window.resolvePath('/src/data/courses.json'));
        const coursesData = await response.json();
        
        allTerms = [];
        
        // Le JSON a la structure: courses: [[id, {data}], [id, {data}], ...]
        for (const [courseId, course] of coursesData.courses) {
            if (course.definitions && Array.isArray(course.definitions)) {
                for (const term of course.definitions) {
                    allTerms.push({
                        term: term.term,
                        definition: term.definition,
                        ue: course.ue
                    });
                }
            }
        }
        
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
    
    for (const progress of Object.values(userProgress)) {
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
    
    // Calculer le streak
    const streak = calculateStreak();
    
    return {
        totalTerms,
        reviewedTerms,
        reviewedPercent: Math.round(reviewedTerms / totalTerms * 100),
        easyCount,
        mediumCount,
        hardCount,
        totalReviews,
        successRate,
        masteredCount,
        masteredPercent: reviewedTerms > 0 ? Math.round(masteredCount / reviewedTerms * 100) : 0,
        streak
    };
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
    document.getElementById('mediumCount').textContent = stats.mediumCount;
    document.getElementById('hardCount').textContent = stats.hardCount;
    
    document.getElementById('streakDays').textContent = stats.streak;
}

/**
 * Calculer les statistiques par UE avec répétition espacée
 */
function calculateUEStats() {
    const ueMap = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialiser avec tous les termes
    for (const term of allTerms) {
        const ue = term.ue;
        if (!ueMap[ue]) {
            ueMap[ue] = {
                ue: ue,
                total: 0,
                neverSeen: 0,      // Jamais vus
                dueNow: 0,         // À réviser maintenant
                overdue: 0,        // En retard
                learning: 0,       // Intervalles < 7j
                consolidated: 0,   // Intervalles ≥ 7j
                easy: 0,
                medium: 0,
                hard: 0
            };
        }
        ueMap[ue].total++;
    }
    
    // Analyser la progression pour chaque terme
    for (const term of allTerms) {
        const ue = term.ue;
        const termKey = generateTermKey(term.term, ue);
        const progress = userProgress[termKey];
        
        if (!progress || !progress.nextReview) {
            // Terme jamais vu
            ueMap[ue].neverSeen++;
        } else {
            const nextReview = new Date(progress.nextReview);
            nextReview.setHours(0, 0, 0, 0);
            
            if (nextReview <= today) {
                // Dû aujourd'hui ou en retard
                ueMap[ue].dueNow++;
                
                const daysLate = Math.floor((today - nextReview) / (1000 * 60 * 60 * 24));
                if (daysLate > 0) {
                    ueMap[ue].overdue++;
                }
            } else {
                // Pas encore dû - catégoriser selon intervalle
                if (progress.intervalDays < 7) {
                    ueMap[ue].learning++;
                } else {
                    ueMap[ue].consolidated++;
                }
            }
            
            // Compter les difficultés
            if (progress.difficultyHistory) {
                ueMap[ue].easy += progress.difficultyHistory.facile || 0;
                ueMap[ue].medium += progress.difficultyHistory.moyen || 0;
                ueMap[ue].hard += progress.difficultyHistory.difficile || 0;
            }
        }
    }
    
    // Calculer les pourcentages
    const ueStats = Object.values(ueMap).map(ue => {
        const studied = ue.total - ue.neverSeen;
        const totalReviews = ue.easy + ue.medium + ue.hard;
        
        return {
            ...ue,
            studied,
            studiedPercent: Math.round(studied / ue.total * 100)
        };
    });
    
    return ueStats;
}

/**
 * Générer une clé unique pour un terme
 */
function generateTermKey(term, ue) {
    const normalized = term.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_');
    return `${normalized}_${ue.toLowerCase()}`;
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
 * Afficher les détails par UE (design simplifié et lisible)
 */
function displayUEDetails(ueStats) {
    const ueList = document.getElementById('ueDetailsList');
    
    // Trier par score de facilité (meilleur en haut)
    const sortedUE = [...ueStats].sort((a, b) => {
        // Calculer score de facilité pour chaque UE
        const totalA = a.easy + a.medium + a.hard;
        const totalB = b.easy + b.medium + b.hard;
        
        const scoreA = totalA > 0 ? (a.easy * 1.0 + a.medium * 0.5) / totalA : 0;
        const scoreB = totalB > 0 ? (b.easy * 1.0 + b.medium * 0.5) / totalB : 0;
        
        // Si pas de données, mettre en bas
        if (totalA === 0 && totalB === 0) {
            // Trier par numéro d'UE
            const [major1, minor1] = a.ue.split('.').map(Number);
            const [major2, minor2] = b.ue.split('.').map(Number);
            return major1 !== major2 ? major1 - major2 : minor1 - minor2;
        }
        if (totalA === 0) return 1;
        if (totalB === 0) return -1;
        
        // Meilleur score en haut
        return scoreB - scoreA;
    });
    
    ueList.innerHTML = sortedUE.map(ue => {
        const hasDue = ue.dueNow > 0;
        const studiedPercent = (ue.studied / ue.total * 100).toFixed(0);
        
        const totalReviews = ue.easy + ue.medium + ue.hard;
        const hasData = totalReviews > 0;
        
        // Calcul des pourcentages pour les difficultés
        const easyPercent = hasData ? (ue.easy / totalReviews * 100).toFixed(0) : 0;
        const mediumPercent = hasData ? (ue.medium / totalReviews * 100).toFixed(0) : 0;
        const hardPercent = hasData ? (ue.hard / totalReviews * 100).toFixed(0) : 0;
        
        // Score de facilité
        const facilityScore = hasData ? ((ue.easy * 1.0 + ue.medium * 0.5) / totalReviews * 100).toFixed(0) : 0;
        
        return `
        <div class="ue-item" style="border: 2px solid ${hasDue ? '#dc3545' : '#e9ecef'}; border-radius: 12px; padding: 1.5rem; background: white; transition: all 0.2s;">
            <!-- En-tête -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">
                        📚 UE ${ue.ue}
                    </div>
                    ${hasData ? `<div style="background: linear-gradient(135deg, ${facilityScore >= 70 ? '#28a745' : facilityScore >= 50 ? '#ffc107' : '#dc3545'} 0%, ${facilityScore >= 70 ? '#218838' : facilityScore >= 50 ? '#e0a800' : '#c82333'} 100%); color: white; padding: 0.3rem 0.8rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;" title="Score de facilité : ${facilityScore}%">
                        ${facilityScore}% facile
                    </div>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 1.1rem; font-weight: 600; color: #6c757d;">
                        ${ue.studied}/${ue.total}
                    </div>
                    ${hasDue ? `<div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 1rem; box-shadow: 0 2px 8px rgba(220,53,69,0.3);" title="${ue.overdue > 0 ? ue.overdue + ' en retard' : 'À réviser'}">
                        🔥 ${ue.dueNow}
                    </div>` : ''}
                </div>
            </div>
            
            <!-- Progression globale -->
            <div style="margin-bottom: ${hasData ? '1.2rem' : '0'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.9rem; color: #6c757d; font-weight: 600;">Progression</span>
                    <span style="font-size: 1rem; font-weight: 700; color: #667eea;">${studiedPercent}%</span>
                </div>
                <div style="height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="width: ${studiedPercent}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: width 0.5s ease;"></div>
                </div>
            </div>
            
            ${hasData ? `
            <!-- Performance sur termes vus -->
            <div>
                <div style="font-size: 0.9rem; color: #495057; font-weight: 600; margin-bottom: 0.8rem;">
                    Performance sur les ${totalReviews} terme${totalReviews > 1 ? 's' : ''} vu${totalReviews > 1 ? 's' : ''}
                </div>
                
                <!-- Facile -->
                <div style="margin-bottom: 0.6rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; background: #28a745; border-radius: 3px;"></div>
                            <span style="font-size: 0.85rem; color: #6c757d;">Facile</span>
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 600; color: #28a745;">${ue.easy} (${easyPercent}%)</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${easyPercent}%; height: 100%; background: #28a745; transition: width 0.5s ease;"></div>
                    </div>
                </div>
                
                <!-- Moyen -->
                <div style="margin-bottom: 0.6rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; background: #ffc107; border-radius: 3px;"></div>
                            <span style="font-size: 0.85rem; color: #6c757d;">Moyen</span>
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 600; color: #ffc107;">${ue.medium} (${mediumPercent}%)</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${mediumPercent}%; height: 100%; background: #ffc107; transition: width 0.5s ease;"></div>
                    </div>
                </div>
                
                <!-- Difficile -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; background: #dc3545; border-radius: 3px;"></div>
                            <span style="font-size: 0.85rem; color: #6c757d;">Difficile</span>
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 600; color: #dc3545;">${ue.hard} (${hardPercent}%)</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${hardPercent}%; height: 100%; background: #dc3545; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            </div>
            ` : `
            <div style="text-align: center; padding: 1rem; color: #adb5bd; font-style: italic;">
                Aucune révision effectuée pour cette UE
            </div>
            `}
        </div>
    `;
    }).join('');
}

/**
 * Générer le calendrier heatmap
 */
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
    
    // Générer le calendrier (30 derniers jours)
    const days = 30;
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


