from django.db import models
from django.contrib.auth.models import User


# ──────────────────────────────────────────
# 1. CATEGORIE
# ──────────────────────────────────────────
class Categorie(models.Model):
    nom         = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icone       = models.CharField(max_length=10, blank=True, null=True, default='🏷️')
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'


# ──────────────────────────────────────────
# 2. FOURNISSEUR
# ──────────────────────────────────────────
class Fournisseur(models.Model):
    nom        = models.CharField(max_length=150)
    telephone  = models.CharField(max_length=20, blank=True, null=True)
    email      = models.EmailField(blank=True, null=True)
    adresse    = models.TextField(blank=True, null=True)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fournisseurs')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = 'Fournisseur'
        verbose_name_plural = 'Fournisseurs'


# ──────────────────────────────────────────
# 3. PRODUIT
# ──────────────────────────────────────────
class Produit(models.Model):
    nom            = models.CharField(max_length=200)
    description    = models.TextField(blank=True, null=True)
    prix_vente     = models.DecimalField(max_digits=10, decimal_places=2)
    prix_achat     = models.DecimalField(max_digits=10, decimal_places=2)
    quantite_stock = models.IntegerField(default=0)
    seuil_alerte   = models.IntegerField(default=5)
    categorie      = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, blank=True, related_name='produits')
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='produits')
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='produits/', blank=True, null=True)

    def __str__(self):
        return self.nom

    @property
    def stock_faible(self):
        return self.quantite_stock <= self.seuil_alerte

    @property
    def benefice_unitaire(self):
        return self.prix_vente - self.prix_achat

    class Meta:
        ordering = ['nom']
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'


# ──────────────────────────────────────────
# 4. CLIENT
# ──────────────────────────────────────────
class Client(models.Model):
    nom        = models.CharField(max_length=100)
    prenom     = models.CharField(max_length=100, blank=True, null=True)
    telephone  = models.CharField(max_length=20, blank=True, null=True)
    email      = models.EmailField(blank=True, null=True)
    adresse    = models.TextField(blank=True, null=True)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clients')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} {self.prenom or ''}".strip()

    class Meta:
        ordering = ['nom']
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'


# ──────────────────────────────────────────
# 5. VENTE
# ──────────────────────────────────────────
class Vente(models.Model):
    STATUT_CHOICES = [
        ('payee',      'Payée'),
        ('en_attente', 'En attente'),
        ('annulee',    'Annulée'),
    ]

    date_vente    = models.DateTimeField(auto_now_add=True)
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_recu  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monnaie_rendu = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statut        = models.CharField(max_length=20, choices=STATUT_CHOICES, default='payee')
    client        = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventes')
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ventes')

    def __str__(self):
        return f"Vente #{self.id} - {self.date_vente.strftime('%d/%m/%Y')}"

    class Meta:
        ordering = ['-date_vente']
        verbose_name = 'Vente'
        verbose_name_plural = 'Ventes'


# ──────────────────────────────────────────
# 6. LIGNE DE VENTE
# ──────────────────────────────────────────
class LigneVente(models.Model):
    vente         = models.ForeignKey(Vente, on_delete=models.CASCADE, related_name='lignes')
    produit       = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='lignes_vente')
    quantite      = models.IntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    sous_total    = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.produit.nom} x{self.quantite}"

    class Meta:
        verbose_name = 'Ligne de vente'
        verbose_name_plural = 'Lignes de vente'


# ──────────────────────────────────────────
# 7. FACTURE
# ──────────────────────────────────────────
class Facture(models.Model):
    STATUT_CHOICES = [
        ('emise',   'Émise'),
        ('payee',   'Payée'),
        ('annulee', 'Annulée'),
    ]

    numero_facture = models.CharField(max_length=50, unique=True)
    date_emission  = models.DateTimeField(auto_now_add=True)
    montant_total  = models.DecimalField(max_digits=10, decimal_places=2)
    statut         = models.CharField(max_length=20, choices=STATUT_CHOICES, default='emise')
    vente          = models.OneToOneField(Vente, on_delete=models.CASCADE, related_name='facture')
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='factures')

    def save(self, *args, **kwargs):
        if not self.numero_facture:
            from django.utils import timezone
            now = timezone.now()
            self.numero_facture = f"FACT-{now.year}{now.month:02d}-{now.microsecond}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.numero_facture

    class Meta:
        ordering = ['-date_emission']
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'


# ──────────────────────────────────────────
# 8. ENTREE STOCK
# ──────────────────────────────────────────
class EntreeStock(models.Model):
    produit     = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='entrees')
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.SET_NULL, null=True, blank=True, related_name='entrees')
    quantite    = models.IntegerField()
    prix_achat  = models.DecimalField(max_digits=10, decimal_places=2)
    date_entree = models.DateTimeField(auto_now_add=True)
    reference   = models.CharField(max_length=100, blank=True, null=True)
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entrees_stock')

    def save(self, *args, **kwargs):
        # Met à jour automatiquement le stock du produit
        if not self.pk:
            self.produit.quantite_stock += self.quantite
            self.produit.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Entrée {self.produit.nom} - {self.quantite} unités"

    class Meta:
        ordering = ['-date_entree']
        verbose_name = 'Entrée de stock'
        verbose_name_plural = 'Entrées de stock'