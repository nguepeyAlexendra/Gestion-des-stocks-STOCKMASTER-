from datetime import datetime, date  

from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


from .models import (
    ProfilUtilisateur, Categorie, Fournisseur, Produit,
    Client, Vente, Facture, EntreeStock
)
from .serializers import (
    ChangerMotDePasseSerializer, ProfilSerializer, RegisterSerializer, UserSerializer, CreateUserSerializer,
    CategorieSerializer, FournisseurSerializer, ProduitSerializer,
    ClientSerializer, VenteSerializer, FactureSerializer, EntreeStockSerializer
)


# ── PERMISSIONS PERSONNALISEES ──
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return request.user.profil.is_admin
        except:
            return False

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        try:
            return request.user.profil.is_admin
        except:
            return False


# ── AUTH ──
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response(
            {'error': 'La création de compte est réservée aux administrateurs. Contactez votre administrateur.'},
            status=status.HTTP_403_FORBIDDEN
        )
class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
class ProfilDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profil = request.user.profil
        except:
            profil = ProfilUtilisateur.objects.create(user=request.user)
        serializer = ProfilSerializer(profil, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        try:
            profil = request.user.profil
        except:
            profil = ProfilUtilisateur.objects.create(user=request.user)

        # Mise à jour email et username
        if 'email' in request.data:
            request.user.email = request.data['email']
            request.user.save()

        serializer = ProfilSerializer(profil, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class ChangerMotDePasseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangerMotDePasseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['nouveau_mot_de_passe'])
            request.user.save()
            return Response({'message': 'Mot de passe changé avec succès !'})
        return Response(serializer.errors, status=400)


class StatistiquesUtilisateurView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user     = request.user
        ventes   = Vente.objects.filter(user=user)
        factures = Facture.objects.filter(user=user)
        clients  = Client.objects.filter(user=user)
        return Response({
            'total_ventes'     : ventes.count(),
            'chiffre_affaires' : sum(v.montant_total for v in ventes),
            'total_clients'    : clients.count(),
            'total_factures'   : factures.count(),
        })


# ── GESTION UTILISATEURS PAR ADMIN ──
class CreateUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message' : f'Utilisateur {user.username} créé avec succès ! Un email a été envoyé.',
            'user'    : UserSerializer(user).data
        }, status=201)

    def get(self, request):
        users = User.objects.all().select_related('profil')
        return Response(UserSerializer(users, many=True).data)


class DeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user == request.user:
                return Response({'error': 'Vous ne pouvez pas supprimer votre propre compte.'}, status=400)
            user.delete()
            return Response({'message': 'Utilisateur supprimé.'})
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)


# ── CATEGORIE ──
class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class   = CategorieSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return Categorie.objects.all()


# ── FOURNISSEUR ──
class FournisseurViewSet(viewsets.ModelViewSet):
    serializer_class   = FournisseurSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return Fournisseur.objects.all()


# ── PRODUIT ──
class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class   = ProduitSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return Produit.objects.all()

    @action(detail=False, methods=['get'])
    def stock_faible(self, request):
        produits   = [p for p in self.get_queryset() if p.stock_faible]
        serializer = self.get_serializer(produits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        queryset = self.get_queryset()
        return Response({
            'total_produits'        : queryset.count(),
            'produits_stock_faible' : len([p for p in queryset if p.stock_faible]),
            'valeur_stock'          : sum(p.prix_achat * p.quantite_stock for p in queryset),
        })


# ── CLIENT ──
class ClientViewSet(viewsets.ModelViewSet):
    serializer_class   = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            if self.request.user.profil.is_admin:
                return Client.objects.all()
        except:
            pass
        return Client.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── VENTE ──
from rest_framework.exceptions import ValidationError\


# ── VENTE ──
class VenteViewSet(viewsets.ModelViewSet):
    serializer_class   = VenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            # L'admin voit l'intégralité des ventes de tout le monde
            if self.request.user.profil.is_admin:
                return Vente.objects.all()
        except ProfilUtilisateur.DoesNotExist:
            pass
        # Un utilisateur vendeur voit uniquement ses propres transactions
        return Vente.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Règle métier stricte : Interdiction pour un administrateur de vendre
        try:
            if self.request.user.profil.is_admin:
                raise ValidationError({
                    "detail": "Action interdite : Un gestionnaire/administrateur ne peut pas effectuer de ventes."
                })
        except ProfilUtilisateur.DoesNotExist:
            pass
            
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
     queryset = self.get_queryset()
     return Response({
        'total_ventes'      : queryset.count(),
        'chiffre_affaires'  : float(sum(v.montant_total for v in queryset)),
        'ventes_aujourdhui' : queryset.filter(
            date_vente__date=date.today()  # ← corrigé
        ).count(),
    })


# ── FACTURE ──
class FactureViewSet(viewsets.ModelViewSet):
    serializer_class   = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ['get', 'head', 'options']

    def get_queryset(self):
        try:
            if self.request.user.profil.is_admin:
                return Facture.objects.all()
        except:
            pass
        return Facture.objects.filter(user=self.request.user)


# ── ENTREE STOCK ──
class EntreeStockViewSet(viewsets.ModelViewSet):
    serializer_class   = EntreeStockSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return EntreeStock.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)