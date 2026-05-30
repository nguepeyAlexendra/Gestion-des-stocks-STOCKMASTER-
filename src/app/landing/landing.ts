import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector   : 'app-landing',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './landing.html',
  styleUrls  : ['./landing.css']
})
export class LandingComponent {

  fonctionnalites = [
    { icon: '📦', titre: 'Gestion des stocks',       desc: 'Suivez vos produits en temps réel avec des alertes automatiques de stock faible.',    bg: '#ede9ff' },
    { icon: '🛒', titre: 'Enregistrement des ventes', desc: 'Enregistrez chaque vente rapidement avec calcul automatique du total et de la monnaie.', bg: '#eaf3de' },
    { icon: '🧾', titre: 'Facturation automatique',   desc: 'Générez des factures professionnelles automatiquement à chaque vente.',                bg: '#faeeda' },
    { icon: '👥', titre: 'Gestion des clients',       desc: 'Gardez l\'historique complet de chaque client et suivez leurs achats.',                bg: '#e6f1fb' },
    { icon: '📊', titre: 'Rapports & statistiques',   desc: 'Analysez votre activité avec des graphiques clairs et des statistiques précises.',      bg: '#fcebeb' },
    { icon: '👨‍💼', titre: 'Multi-utilisateurs',        desc: 'Gérez plusieurs vendeurs avec des accès et permissions personnalisés.',                bg: '#ede9ff' },
  ];

  avantages = [
    { num: 'Simple',  titre: 'Facile à utiliser',   desc: 'Interface intuitive, aucune formation nécessaire pour vos employés.' },
    { num: 'Rapide',  titre: 'Gain de temps',        desc: 'Automatisez les tâches répétitives et réduisez les erreurs de calcul.' },
    { num: 'Fiable',  titre: 'Données sécurisées',   desc: 'Vos données sont protégées et toujours disponibles.' },
  ];

  constructor(private router: Router) {}

  goToLogin()  { this.router.navigate(['/auth/login']); }
  goToRegister() { this.router.navigate(['/auth/register']); }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}