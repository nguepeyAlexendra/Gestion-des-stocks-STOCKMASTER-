from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, ProfileView,
    CategorieViewSet, FournisseurViewSet, ProduitViewSet,
    ClientViewSet, VenteViewSet, FactureViewSet, EntreeStockViewSet
)

router = DefaultRouter()
router.register(r'categories',    CategorieViewSet,    basename='categorie')
router.register(r'fournisseurs',  FournisseurViewSet,  basename='fournisseur')
router.register(r'produits',      ProduitViewSet,      basename='produit')
router.register(r'clients',       ClientViewSet,       basename='client')
router.register(r'ventes',        VenteViewSet,        basename='vente')
router.register(r'factures',      FactureViewSet,      basename='facture')
router.register(r'entrees-stock', EntreeStockViewSet,  basename='entree-stock')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(),        name='register'),
    path('auth/login/',    TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/',  TokenRefreshView.as_view(),    name='token_refresh'),
    path('auth/profile/',  ProfileView.as_view(),         name='profile'),
    path('', include(router.urls)),
]