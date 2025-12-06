/**
 * ADMIN REPORTS MANAGER
 * Gestion des signalements de définitions
 */

class AdminReportsManager {
    constructor() {
        this.reports = [];
        this.filteredReports = [];
        this.db = null;
        this.auth = null;
        this.initialized = false;
    }

    /**
     * Initialiser le gestionnaire
     */
    async init() {
        if (this.initialized) {
            console.log('📝 AdminReportsManager déjà initialisé');
            await this.loadReports();
            return;
        }

        try {
            // Initialiser Firebase si nécessaire
            if (!this.db || !this.auth) {
                const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
                const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
                const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
                
                const app = initializeApp(window.firebaseConfig);
                this.auth = getAuth(app);
                this.db = getFirestore(app);
            }

            // Charger les signalements
            await this.loadReports();
            
            this.initialized = true;
            console.log('✅ [AdminReportsManager] Initialisé');
            
        } catch (error) {
            console.error('❌ [AdminReportsManager] Erreur d\'initialisation:', error);
            this.showError('Erreur lors de l\'initialisation du gestionnaire de signalements');
        }
    }

    /**
     * Charger tous les signalements
     */
    async loadReports() {
        try {
            const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            // Créer la requête
            const reportsCollection = collection(this.db, 'reports');
            const q = query(reportsCollection, orderBy('reportedAt', 'desc'));
            
            // Récupérer les documents
            const querySnapshot = await getDocs(q);
            
            this.reports = [];
            querySnapshot.forEach((doc) => {
                this.reports.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`📊 ${this.reports.length} signalements chargés`);
            
            // Appliquer les filtres et afficher
            this.filterReports();
            this.updateStats();
            this.updateBadge();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des signalements:', error);
            this.showError('Erreur lors du chargement des signalements');
        }
    }

    /**
     * Filtrer les signalements
     */
    filterReports() {
        const statusFilter = document.getElementById('reportStatusFilter')?.value || 'pending';
        const reasonFilter = document.getElementById('reportReasonFilter')?.value || 'all';

        this.filteredReports = this.reports.filter(report => {
            const matchStatus = statusFilter === 'all' || report.status === statusFilter;
            const matchReason = reasonFilter === 'all' || report.reason === reasonFilter;
            return matchStatus && matchReason;
        });

        this.renderReports();
    }

    /**
     * Afficher les signalements
     */
    renderReports() {
        const reportList = document.getElementById('reportList');
        const noReportMessage = document.getElementById('noReportMessage');

        if (!reportList) return;

        if (this.filteredReports.length === 0) {
            reportList.style.display = 'none';
            if (noReportMessage) noReportMessage.style.display = 'block';
            return;
        }

        if (noReportMessage) noReportMessage.style.display = 'none';
        reportList.style.display = 'flex';

        reportList.innerHTML = this.filteredReports.map(report => this.renderReportCard(report)).join('');
    }

    /**
     * Rendre une carte de signalement
     */
    renderReportCard(report) {
        const statusColors = {
            'pending': '#ffc107',
            'approved': '#28a745',
            'rejected': '#dc3545'
        };

        const statusLabels = {
            'pending': '⏳ En attente',
            'approved': '✅ Approuvé',
            'rejected': '❌ Rejeté'
        };

        const statusColor = statusColors[report.status] || '#6c757d';
        const statusLabel = statusLabels[report.status] || report.status;

        const reportDate = report.reportedAt?.toDate ? 
            report.reportedAt.toDate().toLocaleString('fr-FR') : 
            new Date(report.reportedAt).toLocaleString('fr-FR');

        return `
            <div class="report-card" style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${statusColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 1.2rem;">
                            ${report.term}
                        </h4>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
                                UE ${report.ue}
                            </span>
                            <span style="background: #fff3cd; color: #856404; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
                                ${report.reasonLabel}
                            </span>
                            <span style="background: ${statusColor}20; color: ${statusColor}; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                ${statusLabel}
                            </span>
                        </div>
                    </div>
                    <span style="color: #6c757d; font-size: 0.85rem; white-space: nowrap;">
                        ${reportDate}
                    </span>
                </div>

                <div style="margin-bottom: 1rem;">
                    <strong style="color: #495057;">Définition actuelle :</strong>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; font-style: italic;">
                        ${report.currentDefinition}
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <strong style="color: #495057;">Commentaire étudiant :</strong>
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
                        ${report.comment}
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; font-size: 0.85rem; color: #6c757d; margin-bottom: 1rem;">
                    <span>👤 ${report.reportedByEmail}</span>
                </div>

                ${report.adminNotes ? `
                    <div style="margin-bottom: 1rem; background: #e8f5e9; padding: 1rem; border-radius: 8px;">
                        <strong style="color: #2e7d32;">Notes admin :</strong>
                        <div style="margin-top: 0.5rem;">${report.adminNotes}</div>
                    </div>
                ` : ''}

                ${report.status === 'pending' ? `
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid #e9ecef; padding-top: 1rem;">
                        <button onclick="window.adminReportsManager.openEditModal('${report.id}')" 
                                style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; min-width: 150px;">
                            ✏️ Modifier la définition
                        </button>
                        <button onclick="window.adminReportsManager.approveReport('${report.id}')" 
                                style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            ✅ Marquer comme traité
                        </button>
                        <button onclick="window.adminReportsManager.rejectReport('${report.id}')" 
                                style="padding: 0.75rem 1.5rem; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            ❌ Rejeter
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Ouvrir le modal d'édition de définition
     */
    openEditModal(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        const modal = document.createElement('div');
        modal.id = 'editDefinitionModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 2px solid #e9ecef; padding-bottom: 1rem;">
                    <h3 style="margin: 0; color: #2c3e50;">✏️ Modifier la définition</h3>
                    <button onclick="this.closest('#editDefinitionModal').remove()" style="background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #6c757d;">&times;</button>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <strong style="display: block; margin-bottom: 0.5rem; color: #495057;">Terme :</strong>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600;">
                        ${report.term}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <strong style="display: block; margin-bottom: 0.5rem; color: #495057;">UE :</strong>
                    <div style="background: #e3f2fd; color: #1976d2; padding: 0.75rem; border-radius: 8px; display: inline-block;">
                        ${report.ue}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <strong style="display: block; margin-bottom: 0.5rem; color: #495057;">Définition actuelle :</strong>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; font-style: italic;">
                        ${report.currentDefinition}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <strong style="display: block; margin-bottom: 0.5rem; color: #495057;">Commentaire étudiant :</strong>
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 8px;">
                        ${report.comment}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                        Nouvelle définition : <span style="color: #dc3545;">*</span>
                    </label>
                    <textarea id="newDefinitionText" 
                              style="width: 100%; min-height: 150px; padding: 1rem; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; font-family: inherit; resize: vertical;"
                              placeholder="Saisissez la nouvelle définition corrigée...">${report.currentDefinition}</textarea>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                        Notes admin (optionnel) :
                    </label>
                    <textarea id="adminNotesText" 
                              style="width: 100%; min-height: 80px; padding: 1rem; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; font-family: inherit; resize: vertical;"
                              placeholder="Ajoutez des notes sur la correction effectuée..."></textarea>
                </div>

                <div style="background: #d1ecf1; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #0c5460;">
                    <strong style="color: #0c5460;">✅ Mise à jour automatique :</strong>
                    <p style="margin: 0.5rem 0 0 0; color: #0c5460; font-size: 0.95rem;">
                        Cette action modifiera automatiquement la définition dans le fichier JSON.
                        La nouvelle définition sera disponible immédiatement pour tous les utilisateurs après rechargement.
                    </p>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="this.closest('#editDefinitionModal').remove()" 
                            style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Annuler
                    </button>
                    <button onclick="window.adminReportsManager.saveDefinition('${reportId}')" 
                            style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        💾 Enregistrer la correction
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus sur le textarea
        setTimeout(() => {
            document.getElementById('newDefinitionText')?.focus();
        }, 100);
    }

    /**
     * Enregistrer la nouvelle définition
     */
    async saveDefinition(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        const newDefinition = document.getElementById('newDefinitionText')?.value.trim();
        const adminNotes = document.getElementById('adminNotesText')?.value.trim();

        if (!newDefinition) {
            alert('Veuillez saisir une nouvelle définition.');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir modifier la définition de "${report.term}" ?\n\nLa modification sera appliquée immédiatement dans le fichier JSON.`)) {
            try {
                // 1. Mettre à jour la définition dans le JSON via l'API
                const response = await fetch('/api/update_definition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        term: report.term,
                        ue: report.ue,
                        newDefinition: newDefinition
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Erreur lors de la mise à jour');
                }

                // 2. Supprimer le signalement de Firestore (plus besoin de le garder)
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
                
                const reportRef = doc(this.db, 'reports', reportId);
                await deleteDoc(reportRef);

                // Fermer le modal
                document.getElementById('editDefinitionModal')?.remove();

                // Recharger les signalements
                await this.loadReports();

                this.showSuccess(`✅ Définition de "${report.term}" mise à jour avec succès dans le fichier JSON !`);

            } catch (error) {
                console.error('❌ Erreur lors de la sauvegarde:', error);
                this.showError(`Erreur: ${error.message}`);
            }
        }
    }

    /**
     * Approuver un signalement (supprime le signalement)
     */
    async approveReport(reportId) {
        if (confirm('Marquer ce signalement comme traité ?\n\nLe signalement sera supprimé de la base de données.')) {
            try {
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
                
                const reportRef = doc(this.db, 'reports', reportId);
                await deleteDoc(reportRef);

                await this.loadReports();
                this.showSuccess('Signalement traité et supprimé');

            } catch (error) {
                console.error('❌ Erreur:', error);
                this.showError('Erreur lors de la mise à jour');
            }
        }
    }

    /**
     * Rejeter un signalement (supprime le signalement)
     */
    async rejectReport(reportId) {
        const reason = prompt('Raison du rejet (optionnel) :\n\nLe signalement sera supprimé de la base de données.');
        if (reason !== null) {
            try {
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
                
                const reportRef = doc(this.db, 'reports', reportId);
                await deleteDoc(reportRef);

                await this.loadReports();
                this.showSuccess('Signalement rejeté et supprimé');

            } catch (error) {
                console.error('❌ Erreur:', error);
                this.showError('Erreur lors de la mise à jour');
            }
        }
    }

    /**
     * Mettre à jour les statistiques
     */
    updateStats() {
        const total = this.reports.length;
        const pending = this.reports.filter(r => r.status === 'pending').length;
        const approved = this.reports.filter(r => r.status === 'approved').length;
        const rejected = this.reports.filter(r => r.status === 'rejected').length;

        document.getElementById('totalReports').textContent = total;
        document.getElementById('pendingReports').textContent = pending;
        document.getElementById('approvedReports').textContent = approved;
        document.getElementById('rejectedReports').textContent = rejected;
    }

    /**
     * Mettre à jour le badge
     */
    updateBadge() {
        const pending = this.reports.filter(r => r.status === 'pending').length;
        const badge = document.getElementById('reportsCount');
        if (badge) {
            badge.textContent = pending;
            badge.style.display = pending > 0 ? 'inline-block' : 'none';
        }
    }

    /**
     * Afficher un message de succès
     */
    showSuccess(message) {
        const status = document.getElementById('status');
        if (status) {
            status.innerHTML = `<div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 8px; margin: 1rem 0;">${message}</div>`;
            setTimeout(() => status.innerHTML = '', 5000);
        }
    }

    /**
     * Afficher un message d'erreur
     */
    showError(message) {
        const status = document.getElementById('status');
        if (status) {
            status.innerHTML = `<div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px; margin: 1rem 0;">${message}</div>`;
            setTimeout(() => status.innerHTML = '', 5000);
        }
    }
}

// Fonctions globales pour les boutons HTML
window.filterReports = function() {
    if (window.adminReportsManager) {
        window.adminReportsManager.filterReports();
    }
};

window.refreshReports = function() {
    if (window.adminReportsManager) {
        window.adminReportsManager.loadReports();
    }
};

// Créer l'instance globale
window.adminReportsManager = new AdminReportsManager();

console.log('✅ [AdminReportsManager] Module chargé');
