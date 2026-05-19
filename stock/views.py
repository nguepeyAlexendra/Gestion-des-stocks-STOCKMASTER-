from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Categorie, Fournisseur, Produit, Client, Vente, Facture, EntreeStock
from .serializers import (
    RegisterSerializer, UserSerializer,
    CategorieSerializer, FournisseurSerializer, ProduitSerializer,
    ClientSerializer, VenteSerializer, FactureSerializer, EntreeStockSerializer
)


# ──────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message' : 'Compte créé avec succès !',
            'user'    : UserSerializer(user).data,
            'tokens'  : {
                'refresh': str(refresh),
                'access' : str(refresh.access_token),
            }
        }, status=201)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ──────────────────────────────────────────
# CATEGORIE
# ──────────────────────────────────────────
class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class   = CategorieSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Categorie.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────────────────────────────────────────
# FOURNISSEUR
# ──────────────────────────────────────────
class FournisseurViewSet(viewsets.ModelViewSet):
    serializer_class   = FournisseurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Fournisseur.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────────────────────────────────────────
# PRODUIT
# ──────────────────────────────────────────
class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class   = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Produit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stock_faible(self, request):
        produits   = [p for p in self.get_queryset() if p.stock_faible]
        serializer = self.get_serializer(produits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        queryset = self.get_queryset()
        return Response({
            'total_produits'          : queryset.count(),
            'produits_stock_faible'   : len([p for p in queryset if p.stock_faible]),
            'valeur_stock'            : sum(p.prix_achat * p.quantite_stock for p in queryset),
        })


# ──────────────────────────────────────────
# CLIENT
# ──────────────────────────────────────────
class ClientViewSet(viewsets.ModelViewSet):
    serializer_class   = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Client.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────────────────────────────────────────
# VENTE
# ──────────────────────────────────────────
class VenteViewSet(viewsets.ModelViewSet):
    serializer_class   = VenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vente.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        import datetime
        queryset = self.get_queryset()
        return Response({
            'total_ventes'      : queryset.count(),
            'chiffre_affaires'  : sum(v.montant_total for v in queryset),
            'ventes_aujourdhui' : queryset.filter(
                date_vente__date=datetime.date.today()
            ).count(),
        })


# ──────────────────────────────────────────
# FACTURE
# ──────────────────────────────────────────
class FactureViewSet(viewsets.ModelViewSet):
    serializer_class   = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ['get', 'head', 'options']

    def get_queryset(self):
        return Facture.objects.filter(user=self.request.user)


# ──────────────────────────────────────────
# ENTREE STOCK
# ──────────────────────────────────────────
class EntreeStockViewSet(viewsets.ModelViewSet):
    serializer_class   = EntreeStockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EntreeStock.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)