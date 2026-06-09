from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction  # ✅ AJOUTÉ pour les transactions atomiques
from rest_framework import serializers
from .models import (
    ProfilUtilisateur, Categorie, Fournisseur, Produit,
    Client, Vente, LigneVente, Facture, EntreeStock
)
import random
import string


def generer_mot_de_passe():
    caracteres = string.ascii_letters + string.digits + '!@#$%'
    return ''.join(random.choices(caracteres, k=10))


# ── AUTH ──
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
        ProfilUtilisateur.objects.create(user=user, role='utilisateur')
        return user


class UserSerializer(serializers.ModelSerializer):
    role     = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'role', 'is_admin']

    def get_role(self, obj):
        try:
            return obj.profil.role
        except ProfilUtilisateur.DoesNotExist:  # ✅ MODIFIÉ : plus précis
            return 'utilisateur'

    def get_is_admin(self, obj):
        try:
            return obj.profil.is_admin
        except ProfilUtilisateur.DoesNotExist:  # ✅ MODIFIÉ : plus précis
            return False


# ✅ MODIFIÉ : Gestion complète de la mise à jour du profil
class ProfilSerializer(serializers.ModelSerializer):
    # ✅ MODIFIÉ : username et email ne sont plus read_only pour permettre la mise à jour
    username   = serializers.CharField(source='user.username', required=False)
    email      = serializers.EmailField(source='user.email', required=False)
    role       = serializers.ReadOnlyField()
    is_admin   = serializers.ReadOnlyField()
    # ✅ MODIFIÉ : SerializerMethodField au lieu de ReadOnlyField pour gérer l'URL absolue
    photo_url  = serializers.SerializerMethodField()

    class Meta:
        model  = ProfilUtilisateur
        fields = [
            'id', 'username', 'email', 'role', 'is_admin',
            'photo', 'photo_url', 'prenom', 'nom_complet',
            'telephone', 'adresse', 'created_at'
        ]

    def get_photo_url(self, obj):
        """Construit l'URL absolue de la photo (compatible responsive & production)"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return f'http://127.0.0.1:8000{obj.photo.url}'
        return None

    def update(self, instance, validated_data):
        """
        Gère la mise à jour simultanée du User (username, email)
        et du ProfilUtilisateur (photo, prénom, téléphone, etc.)
        """
        # ✅ MODIFIÉ : Extraire et mettre à jour les données du User
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Mise à jour du ProfilUtilisateur
        return super().update(instance, validated_data)


# ✅ MODIFIÉ : Validation de la force du nouveau mot de passe
class ChangerMotDePasseSerializer(serializers.Serializer):
    ancien_mot_de_passe  = serializers.CharField(required=True)
    nouveau_mot_de_passe = serializers.CharField(required=True, min_length=6)

    def validate_ancien_mot_de_passe(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value

    # ✅ AJOUTÉ : Validation de la politique de mot de passe Django
    def validate_nouveau_mot_de_passe(self, value):
        try:
            validate_password(value)
        except exceptions.ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


# ── CREATION UTILISATEUR PAR ADMIN ──
class CreateUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    email    = serializers.EmailField()
    role     = serializers.ChoiceField(choices=['admin', 'utilisateur'])

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email existe déjà.")
        return value

    def create(self, validated_data):
        mot_de_passe = generer_mot_de_passe()
        user = User.objects.create_user(
            username = validated_data['username'],
            email    = validated_data['email'],
            password = mot_de_passe
        )
        ProfilUtilisateur.objects.create(user=user, role=validated_data['role'])

        role_label = 'Administrateur' if validated_data['role'] == 'admin' else 'Utilisateur'

        html_content = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif;">
  <div style="max-width:520px;margin:2rem auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#0F6E56;padding:2.5rem 2rem;text-align:center;">
      <div style="width:70px;height:70px;background:#1D9E75;border-radius:12px;margin:0 auto 1rem;text-align:center;">
        <span style="color:white;font-size:28px;font-weight:700;line-height:70px;display:block;">SM</span>
      </div>
      <h1 style="color:white;font-size:24px;font-weight:500;margin:0 0 0.5rem;letter-spacing:2px;">STOCKMASTER</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;letter-spacing:3px;">GESTION DES STOCKS</p>
    </div>
    <div style="padding:2rem;">
      <div style="text-align:center;margin-bottom:1.5rem;">
        <span style="display:inline-block;background:#e1f5ee;color:#0F6E56;padding:6px 16px;border-radius:999px;font-size:13px;font-weight:500;">
          Compte cree avec succes
        </span>
      </div>
      <h2 style="font-size:18px;font-weight:500;margin:0 0 0.75rem;">Bonjour {user.username} !</h2>
      <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 1.5rem;">
        Votre compte a ete cree sur la plateforme StockMaster.
        Vous pouvez des maintenant vous connecter avec les identifiants ci-dessous.
      </p>
      <div style="background:#f9f9f9;border-radius:8px;padding:1rem 1.25rem;margin-bottom:1.5rem;">
        <p style="font-size:13px;color:#888;margin:0 0 0.75rem;font-weight:500;">Vos identifiants de connexion</p>
        <p style="font-size:14px;margin:0 0 8px;">
          <span style="color:#888;">Nom d&#39;utilisateur : </span>
          <span style="font-weight:500;">{user.username}</span>
        </p>
        <p style="font-size:14px;margin:0 0 8px;">
          <span style="color:#888;">Email : </span>
          <span style="font-weight:500;">{user.email}</span>
        </p>
        <p style="font-size:14px;margin:0 0 8px;">
          <span style="color:#888;">Mot de passe : </span>
          <span style="font-weight:700;color:#0F6E56;background:#e1f5ee;padding:2px 8px;border-radius:4px;">{mot_de_passe}</span>
        </p>
        <p style="font-size:14px;margin:0;">
          <span style="color:#888;">Role : </span>
          <span style="font-weight:500;">{role_label}</span>
        </p>
      </div>
      <table style="width:100%;">
        <tr>
          <td style="text-align:center;">
            <a href="http://localhost:4200/auth/login"
               style="display:inline-block;background:#1D9E75;color:white;text-decoration:none;padding:12px 40px;border-radius:8px;font-size:15px;font-weight:500;">
              Se connecter a StockMaster
            </a>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:1.25rem 2rem;border-top:1px solid #eee;text-align:center;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        Cet email a ete envoye automatiquement - merci de ne pas y repondre.
      </p>
    </div>
  </div>
</body>
</html>
        """

        text_content = f"Bonjour {user.username}, votre compte StockMaster a ete cree. Identifiants : username={user.username}, password={mot_de_passe}. Connectez-vous sur http://localhost:4200/auth/login"

        try:
            from django.core.mail import EmailMultiAlternatives
            msg = EmailMultiAlternatives(
                subject    = 'Vos identifiants StockMaster',
                body       = text_content,
                from_email = settings.DEFAULT_FROM_EMAIL,
                to         = [user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=True)
        except Exception as e:
            print(f"Erreur envoi email: {e}")

        return user

# ── CATEGORIE ──
class CategorieSerializer(serializers.ModelSerializer):
    nombre_produits = serializers.SerializerMethodField()

    class Meta:
        model  = Categorie
        fields = ['id', 'nom', 'description', 'icone', 'nombre_produits', 'created_at']

    def get_nombre_produits(self, obj):
        return obj.produits.count()


# ── FOURNISSEUR ──
class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Fournisseur
        fields = ['id', 'nom', 'telephone', 'email', 'adresse', 'created_at']


# ── PRODUIT ──
class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom     = serializers.CharField(source='categorie.nom', read_only=True)
    stock_faible      = serializers.ReadOnlyField()
    benefice_unitaire = serializers.ReadOnlyField()
    image_url         = serializers.SerializerMethodField()

    class Meta:
        model  = Produit
        fields = [
            'id', 'nom', 'description', 'prix_vente', 'prix_achat',
            'quantite_stock', 'seuil_alerte', 'categorie', 'categorie_nom',
            'stock_faible', 'benefice_unitaire', 'image', 'image_url',
            'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'http://127.0.0.1:8000{obj.image.url}'
        return None

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


# ── CLIENT ──
class ClientSerializer(serializers.ModelSerializer):
    nombre_achats = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = ['id', 'nom', 'prenom', 'telephone', 'email', 'adresse', 'nombre_achats', 'created_at']

    def get_nombre_achats(self, obj):
        return obj.ventes.count()


# ── LIGNE DE VENTE ──
class LigneVenteSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model  = LigneVente
        fields = ['id', 'produit', 'produit_nom', 'quantite', 'prix_unitaire', 'sous_total']
        extra_kwargs = {'sous_total': {'required': False}}

    def validate(self, data):
        produit       = data.get('produit')
        quantite      = data.get('quantite')
        prix_unitaire = data.get('prix_unitaire')

        if quantite <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0.")

        if produit and quantite > produit.quantite_stock:
            raise serializers.ValidationError(
                f"Stock insuffisant. Disponible : {produit.quantite_stock}"
            )

        # Règle : prix unitaire ne peut pas être inférieur au prix de vente
        if produit and prix_unitaire < produit.prix_vente:
            raise serializers.ValidationError(
                f"Le prix unitaire ({prix_unitaire} F) ne peut pas être inférieur au prix de vente ({produit.prix_vente} F)."
            )

        data['sous_total'] = quantite * prix_unitaire
        return data


# ✅ MODIFIÉ : Ajout de transaction.atomic() pour garantir l'intégrité des données
# ── VENTE ──
class VenteSerializer(serializers.ModelSerializer):
    lignes     = LigneVenteSerializer(many=True)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    vendeur    = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = Vente
        fields = [
            'id', 'date_vente', 'montant_total', 'montant_recu',
            'monnaie_rendu', 'statut', 'client', 'client_nom',
            'vendeur', 'lignes'
        ]

    def validate_montant_recu(self, value):
        if value < 0:
            raise serializers.ValidationError("Le montant reçu ne peut pas être négatif.")
        return value

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        validated_data.pop('user', None)
        user = self.context['request'].user

        # ✅ AJOUTÉ : Transaction atomique pour garantir la cohérence des données
        with transaction.atomic():
            montant_total = sum(l['quantite'] * l['prix_unitaire'] for l in lignes_data)
            montant_recu  = validated_data.get('montant_recu', montant_total)
            monnaie_rendu = montant_recu - montant_total

            vente = Vente.objects.create(
                **validated_data,
                montant_total = montant_total,
                monnaie_rendu = monnaie_rendu,
                user          = user
            )

            for ligne_data in lignes_data:
                produit    = ligne_data['produit']
                sous_total = ligne_data['quantite'] * ligne_data['prix_unitaire']
                ligne_data.pop('sous_total', None)
                LigneVente.objects.create(
                    vente      = vente,
                    sous_total = sous_total,
                    **ligne_data
                )
                # Stock partagé — diminue pour tous
                produit.quantite_stock -= ligne_data['quantite']
                produit.save()

            Facture.objects.create(
                vente         = vente,
                montant_total = montant_total,
                user          = user
            )

        return vente


# ── FACTURE ──
class FactureSerializer(serializers.ModelSerializer):
    vente_id   = serializers.IntegerField(source='vente.id', read_only=True)
    client_nom = serializers.SerializerMethodField()
    lignes     = serializers.SerializerMethodField()
    vendeur    = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = Facture
        fields = [
            'id', 'numero_facture', 'date_emission',
            'montant_total', 'statut', 'vente_id',
            'client_nom', 'lignes', 'vendeur'
        ]

    def get_client_nom(self, obj):
        if obj.vente.client:
            return str(obj.vente.client)
        return "Client anonyme"

    def get_lignes(self, obj):
        return LigneVenteSerializer(obj.vente.lignes.all(), many=True).data


# ✅ MODIFIÉ : Ajout de la méthode create() pour gérer la mise à jour du stock
# ── ENTREE STOCK ──
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

    # ✅ AJOUTÉ : Gestion de la mise à jour du stock dans le serializer
    def create(self, validated_data):
        with transaction.atomic():
            entree = super().create(validated_data)
            # Mise à jour du stock du produit
            entree.produit.quantite_stock += entree.quantite
            entree.produit.save()
        return entree