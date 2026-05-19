from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Categorie, Fournisseur, Produit, Client, Vente, LigneVente, Facture, EntreeStock


# ──────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username = validated_data['username'],
            email    = validated_data.get('email', ''),
            password = validated_data['password']
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email']


# ──────────────────────────────────────────
# CATEGORIE
# ──────────────────────────────────────────
class CategorieSerializer(serializers.ModelSerializer):
    nombre_produits = serializers.SerializerMethodField()

    class Meta:
        model  = Categorie
        fields = ['id', 'nom', 'description', 'nombre_produits', 'created_at']

    def get_nombre_produits(self, obj):
        return obj.produits.count()


# ──────────────────────────────────────────
# FOURNISSEUR
# ──────────────────────────────────────────
class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Fournisseur
        fields = ['id', 'nom', 'telephone', 'email', 'adresse', 'created_at']


# ──────────────────────────────────────────
# PRODUIT
# ──────────────────────────────────────────
class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom   = serializers.CharField(source='categorie.nom', read_only=True)
    stock_faible    = serializers.ReadOnlyField()
    benefice_unitaire = serializers.ReadOnlyField()

    class Meta:
        model  = Produit
        fields = [
            'id', 'nom', 'description', 'prix_vente', 'prix_achat',
            'quantite_stock', 'seuil_alerte', 'categorie', 'categorie_nom',
            'stock_faible', 'benefice_unitaire', 'created_at', 'updated_at'
        ]

    def validate_prix_vente(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le prix de vente doit être supérieur à 0.")
        return value

    def validate_prix_achat(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le prix d'achat doit être supérieur à 0.")
        return value

    def validate_quantite_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("La quantité ne peut pas être négative.")
        return value


# ──────────────────────────────────────────
# CLIENT
# ──────────────────────────────────────────
class ClientSerializer(serializers.ModelSerializer):
    nombre_achats = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = ['id', 'nom', 'prenom', 'telephone', 'email', 'adresse', 'nombre_achats', 'created_at']

    def get_nombre_achats(self, obj):
        return obj.ventes.count()


# ──────────────────────────────────────────
# LIGNE DE VENTE
# ──────────────────────────────────────────
class LigneVenteSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model  = LigneVente
        fields = ['id', 'produit', 'produit_nom', 'quantite', 'prix_unitaire', 'sous_total']

    def validate(self, data):
        produit  = data.get('produit')
        quantite = data.get('quantite')
        if quantite <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0.")
        if produit and quantite > produit.quantite_stock:
            raise serializers.ValidationError(
                f"Stock insuffisant. Disponible : {produit.quantite_stock}"
            )
        return data


# ──────────────────────────────────────────
# VENTE
# ──────────────────────────────────────────
class VenteSerializer(serializers.ModelSerializer):
    lignes       = LigneVenteSerializer(many=True)
    client_nom   = serializers.CharField(source='client.nom', read_only=True)

    class Meta:
        model  = Vente
        fields = [
            'id', 'date_vente', 'montant_total', 'montant_recu',
            'monnaie_rendu', 'statut', 'client', 'client_nom', 'lignes'
        ]

    def validate_montant_recu(self, value):
        if value < 0:
            raise serializers.ValidationError("Le montant reçu ne peut pas être négatif.")
        return value

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        user        = self.context['request'].user

        # Calcul du montant total
        montant_total = sum(
            l['quantite'] * l['prix_unitaire'] for l in lignes_data
        )
        montant_recu  = validated_data.get('montant_recu', montant_total)
        monnaie_rendu = montant_recu - montant_total

        # Création de la vente
        vente = Vente.objects.create(
            **validated_data,
            montant_total  = montant_total,
            monnaie_rendu  = monnaie_rendu,
            user           = user
        )

        # Création des lignes + mise à jour du stock
        for ligne_data in lignes_data:
            produit = ligne_data['produit']
            LigneVente.objects.create(
                vente         = vente,
                sous_total    = ligne_data['quantite'] * ligne_data['prix_unitaire'],
                **ligne_data
            )
            # Déduire du stock automatiquement
            produit.quantite_stock -= ligne_data['quantite']
            produit.save()

        # Génération automatique de la facture
        Facture.objects.create(
            vente         = vente,
            montant_total = montant_total,
            user          = user
        )

        return vente


# ──────────────────────────────────────────
# FACTURE
# ──────────────────────────────────────────
class FactureSerializer(serializers.ModelSerializer):
    vente_id    = serializers.IntegerField(source='vente.id', read_only=True)
    client_nom  = serializers.SerializerMethodField()
    lignes      = serializers.SerializerMethodField()

    class Meta:
        model  = Facture
        fields = [
            'id', 'numero_facture', 'date_emission',
            'montant_total', 'statut', 'vente_id', 'client_nom', 'lignes'
        ]

    def get_client_nom(self, obj):
        if obj.vente.client:
            return str(obj.vente.client)
        return "Client anonyme"

    def get_lignes(self, obj):
        return LigneVenteSerializer(obj.vente.lignes.all(), many=True).data


# ──────────────────────────────────────────
# ENTREE STOCK
# ──────────────────────────────────────────
class EntreeStockSerializer(serializers.ModelSerializer):
    produit_nom     = serializers.CharField(source='produit.nom', read_only=True)
    fournisseur_nom = serializers.CharField(source='fournisseur.nom', read_only=True)

    class Meta:
        model  = EntreeStock
        fields = [
            'id', 'produit', 'produit_nom', 'fournisseur', 'fournisseur_nom',
            'quantite', 'prix_achat', 'date_entree', 'reference'
        ]

    def validate_quantite(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0.")
        return value