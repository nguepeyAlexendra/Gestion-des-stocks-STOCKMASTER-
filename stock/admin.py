from django.contrib import admin
from .models import (
    ProfilUtilisateur, Categorie, Fournisseur, Produit,
    Client, Vente, LigneVente, Facture, EntreeStock
)


# ── PROFIL UTILISATEUR ──
@admin.register(ProfilUtilisateur)
class ProfilUtilisateurAdmin(admin.ModelAdmin):
    list_display  = ['user', 'role', 'created_at']
    list_filter   = ['role']
    search_fields = ['user__username', 'user__email']


# ── CATEGORIE ──
@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'icone', 'description', 'created_at']
    search_fields = ['nom']


# ── FOURNISSEUR ──
@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'telephone', 'email', 'created_at']
    search_fields = ['nom', 'email']


# ── PRODUIT ──
@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'prix_vente', 'prix_achat', 'quantite_stock', 'seuil_alerte', 'categorie']
    search_fields = ['nom', 'description']
    list_filter   = ['categorie']
    ordering      = ['nom']


# ── CLIENT ──
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'prenom', 'telephone', 'email', 'user', 'created_at']
    search_fields = ['nom', 'prenom', 'telephone']
    list_filter   = ['user']


# ── LIGNE DE VENTE ──
class LigneVenteInline(admin.TabularInline):
    model           = LigneVente
    extra           = 0
    fields          = ['produit', 'quantite', 'prix_unitaire', 'sous_total']
    readonly_fields = ['sous_total']


# ── VENTE ──
@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display  = ['id', 'client', 'montant_total', 'montant_recu', 'monnaie_rendu', 'statut', 'date_vente', 'user']
    search_fields = ['client__nom', 'id']
    list_filter   = ['statut', 'user', 'date_vente']
    ordering      = ['-date_vente']
    inlines       = [LigneVenteInline]


# ── FACTURE ──
@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display  = ['numero_facture', 'montant_total', 'statut', 'date_emission', 'user']
    search_fields = ['numero_facture']
    list_filter   = ['statut', 'user']
    ordering      = ['-date_emission']


# ── ENTREE STOCK ──
@admin.register(EntreeStock)
class EntreeStockAdmin(admin.ModelAdmin):
    list_display  = ['produit', 'fournisseur', 'quantite', 'prix_achat', 'date_entree', 'user']
    search_fields = ['produit__nom', 'reference']
    list_filter   = ['fournisseur', 'user']
    ordering      = ['-date_entree']