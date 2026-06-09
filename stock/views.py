from datetime import date
from django.db.models import Sum, Count, Q, F
from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

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
        except (ProfilUtilisateur.DoesNotExist, AttributeError):
            return False

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        try:
            return request.user.profil.is_admin
        except (ProfilUtilisateur.DoesNotExist, AttributeError):
            return False


# ── AUTH & PROFIL ──
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

    def _get_or_create_profil(self, user):
        profil = getattr(user, 'profil', None)
        if not profil:
            profil = ProfilUtilisateur.objects.create(user=user)
        return profil

    def get(self, request):
        profil = self._get_or_create_profil(request.user)
        serializer = ProfilSerializer(profil, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        profil = self._get_or_create_profil(request.user)
        serializer = ProfilSerializer(profil, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangerMotDePasseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangerMotDePasseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['nouveau_mot_de_passe'])
            request.user.save()
            return Response({'message': 'Mot de passe changé avec succès !'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StatistiquesUtilisateurView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        ventes_qs = Vente.objects.filter(user=user)
        ca_aggrege = ventes_qs.filter(statut='payee').aggregate(total=Sum('montant_total'))['total']

        return Response({
            'total_ventes': ventes_qs.count(),
            'chiffre_affaires': float(ca_aggrege or 0),
            'total_clients': Client.objects.filter(user=user).count(),
            'total_factures': Facture.objects.filter(user=user).count(),
        })


# ── GESTION UTILISATEURS PAR ADMIN ──
class CreateUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': f'Utilisateur {user.username} créé avec succès ! Un email a été envoyé.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        users = User.objects.all().select_related('profil')
        return Response(UserSerializer(users, many=True).data)


class DeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user == request.user:
                return Response({'error': 'Vous ne pouvez pas supprimer votre propre compte.'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response({'message': 'Utilisateur supprimé.'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)


# ── CATEGORIE ──
class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer
    permission_classes = [IsAdminOrReadOnly]
    def get_queryset(self):
        return Categorie.objects.all()


# ── FOURNISSEUR ──
class FournisseurViewSet(viewsets.ModelViewSet):
    serializer_class = FournisseurSerializer
    permission_classes = [IsAdminOrReadOnly]
    def get_queryset(self):
        return Fournisseur.objects.all()


# ── PRODUIT ──
class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAdminOrReadOnly]
    def get_queryset(self):
        return Produit.objects.all()

    @action(detail=False, methods=['get'])
    def stock_faible(self, request):
        produits = self.get_queryset().filter(quantite_stock__lte=F('seuil_alerte'))
        serializer = self.get_serializer(produits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        queryset = self.get_queryset()
        stats = queryset.aggregate(
            total=Count('id'),
            faible=Count('id', filter=Q(quantite_stock__lte=F('seuil_alerte'))),
            valeur=Sum(F('prix_achat') * F('quantite_stock'))
        )
        return Response({
            'total_produits': stats['total'] or 0,
            'produits_stock_faible': stats['faible'] or 0,
            'valeur_stock': float(stats['valeur'] or 0),
        })


# ── CLIENT ──
class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        try:
            if self.request.user.profil.is_admin:
                return Client.objects.all()
        except (ProfilUtilisateur.DoesNotExist, AttributeError):
            pass
        return Client.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── VENTE ──
class VenteViewSet(viewsets.ModelViewSet):
    serializer_class = VenteSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        try:
            if self.request.user.profil.is_admin:
                return Vente.objects.all()
        except (ProfilUtilisateur.DoesNotExist, AttributeError):
            pass
        return Vente.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        try:
            if self.request.user.profil.is_admin:
                raise ValidationError({"detail": "Action interdite : Un gestionnaire/administrateur ne peut pas effectuer de ventes."})
        except (ProfilUtilisateur.DoesNotExist, AttributeError):
            pass
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        queryset = self.get_queryset()
        ca_aggrege = queryset.filter(statut='payee').aggregate(total=Sum('montant_total'))['total']
        return Response({
            'total_ventes': queryset.count(),
            'chiffre_affaires': float(ca_aggrege or 0),
            'ventes_aujourdhui': queryset.filter(date_vente__date=date.today()).count(),
        })


# ── FACTURE ──
class FactureViewSet(viewsets.ModelViewSet):
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'head', 'options']
    def get_queryset(self):
        try:
            if self.request.user.profil.is_admin:
                return Facture.objects.all()
        except (ProfilUtilisateur.DoesNotExist, AttributeError):
            pass
        return Facture.objects.filter(user=self.request.user)


# ── ENTREE STOCK ──
class EntreeStockViewSet(viewsets.ModelViewSet):
    serializer_class = EntreeStockSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    def get_queryset(self):
        return EntreeStock.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)